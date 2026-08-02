// Supabase Edge Function : generate-client-diagnostic
// ------------------------------------------------------------------
// Genere un diagnostic client complet a partir de la fiche remplie dans
// le CRM KBSAuto : recherche concurrentielle (TikTok / Facebook Afrique de
// l'Ouest) via l'API Anthropic + outil web_search, puis programme de suivi
// 30/60 jours et guide strategique interactif, le tout en JSON structure.
//
// La cle API Anthropic n'est JAMAIS exposee cote client : elle vit uniquement
// dans la variable d'environnement ANTHROPIC_API_KEY de cette fonction.
//
// La generation dure 1 a 3 minutes : on repond immediatement (statut
// "generating") et on poursuit le travail en tache de fond via
// EdgeRuntime.waitUntil, l'UI faisant du polling sur le statut.
// ------------------------------------------------------------------

const SUPABASE_URL = "https://vspepqwipgjkmnemwlfa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_olyJ2hEstrKN7KR4v4mNaQ_sYXVjw04";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const MODEL = "claude-sonnet-5";
// Tarifs Anthropic (intro Sonnet 5 jusqu'au 31/08/2026 : 2$/M entree, 10$/M sortie).
const PRICE_IN_PER_TOKEN = 2 / 1_000_000;
const PRICE_OUT_PER_TOKEN = 10 / 1_000_000;
const PRICE_PER_SEARCH = 0.01;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---- Acces a kbs_storage (meme pattern cle-valeur que le reste de l'app) ----
function storageKey(clientId: string) {
  return `diagnostic:${clientId}`;
}

async function loadDiagnostic(clientId: string): Promise<any | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/kbs_storage?key=eq.${encodeURIComponent(storageKey(clientId))}&select=value`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
  );
  const rows = await res.json();
  return rows?.[0]?.value ?? null;
}

async function saveDiagnostic(clientId: string, value: any): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/kbs_storage`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      key: storageKey(clientId),
      value,
      updated_at: new Date().toISOString(),
    }),
  });
}

// ---- Prompt systeme : impose le schema JSON de sortie ----
function buildSystemPrompt(): string {
  return `Tu es le stratege senior de KBS Digital Agency (Afrique de l'Ouest, francophone).
Tu realises un DIAGNOSTIC MARKETING COMPLET pour un client a partir de sa fiche.

MISSION (dans l'ordre) :
1. Utilise l'outil web_search pour rechercher ~50 concurrents dans la MEME NICHE que le client, sur TikTok et Facebook, en priorite en Afrique de l'Ouest (Senegal, Cote d'Ivoire, Mali, Benin, Burkina, Togo, Guinee...). Fais plusieurs recherches ciblees.
2. Pour les meilleurs comptes : nombre d'abonnes approximatif, plateforme, style de contenu, angle marketing, cible visee, et POURQUOI ca marche pour eux.
3. Identifie ce qui differencie les meilleurs.
4. Croise avec le profil du client (form_data) pour identifier son VRAI probleme, souvent DIFFERENT du probleme percu qu'il a lui-meme decrit.
5. Produis un programme de suivi (30 ou 60 jours selon le/les service(s) concernes), jour par jour, avec des taches concretes cochables.
6. Produis un guide strategique : positionnement, personas, angles marketing avec exemples concrets et hooks, KPI a suivre.

CONTRAINTES DE SORTIE — TRES IMPORTANT :
- Reponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni apres, sans balises Markdown, sans commentaires.
- Tout le contenu textuel est en FRANCAIS, concret et actionnable, adapte au marche ouest-africain.
- Chaque tache du programme a un identifiant "id" UNIQUE et stable (ex: "j1t1", "j1t2", "j2t1"...).
- Respecte EXACTEMENT ce schema :

{
  "research": {
    "summary": "synthese de la recherche concurrentielle en 4-6 phrases",
    "competitors": [
      { "name": "", "platform": "TikTok|Facebook|Instagram", "handle": "", "followers": "ex: ~35k", "angle": "", "target": "", "whyItWorks": "" }
    ],
    "sources": [ { "title": "", "url": "" } ]
  },
  "diagnostic": {
    "positioning": "positionnement recommande pour le client, 2-4 phrases",
    "perceivedProblem": "le probleme que le client CROIT avoir (repris de sa fiche)",
    "realProblem": "le VRAI probleme identifie apres recherche, et pourquoi",
    "personas": [ { "name": "", "description": "", "pains": ["",""], "desires": ["",""] } ],
    "angles": [ { "title": "", "example": "exemple concret de post/video", "hook": "phrase d'accroche prete a l'emploi" } ]
  },
  "program": {
    "durationDays": 30,
    "services": ["service(s) concerne(s) issus de la fiche"],
    "kpis": ["KPI 1 a suivre", "KPI 2", "KPI 3"],
    "days": [
      { "day": 1, "theme": "theme du jour", "tasks": [ { "id": "j1t1", "label": "tache concrete" } ] }
    ]
  }
}

Vise 8 a 12 concurrents detailles minimum (jusqu'a ~50 si pertinent), 2 a 4 personas, 3 a 6 angles, et un programme complet couvrant tous les jours (durationDays = 30 ou 60).`;
}

function buildUserContent(formData: any): string {
  // Les photos (dataURL base64) ne sont PAS envoyees a l'IA : ce sont de longues
  // chaines de texte inutilisables comme image et qui gonfleraient enormement le
  // cout en tokens. Elles restent stockees dans la fiche pour l'usage interne KBS.
  const { photoClient: _pc, photoPage: _pp, ...textFields } = formData || {};
  return `Voici la fiche diagnostic du client. Realise la recherche puis produis le JSON demande.

FICHE CLIENT (form_data) :
${JSON.stringify(textFields, null, 2)}`;
}

// ---- Appel Anthropic avec gestion du server-tool loop (pause_turn) ----
async function callAnthropic(formData: any) {
  const messages: any[] = [
    { role: "user", content: buildUserContent(formData) },
  ];

  let totalIn = 0;
  let totalOut = 0;
  let totalSearches = 0;
  let last: any = null;

  for (let i = 0; i < 8; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 24000,
        system: buildSystemPrompt(),
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 25 }],
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${errText.slice(0, 500)}`);
    }

    const data = await res.json();
    last = data;

    const u = data.usage ?? {};
    totalIn += (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
    totalOut += u.output_tokens ?? 0;
    totalSearches += u.server_tool_use?.web_search_requests ?? 0;

    messages.push({ role: "assistant", content: data.content });

    if (data.stop_reason !== "pause_turn") break;
  }

  const text = (last?.content ?? [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();

  const cost = totalIn * PRICE_IN_PER_TOKEN + totalOut * PRICE_OUT_PER_TOKEN + totalSearches * PRICE_PER_SEARCH;

  return { text, cost, tokensIn: totalIn, tokensOut: totalOut, searches: totalSearches };
}

// ---- Extraction robuste du JSON depuis la reponse ----
function extractJSON(text: string): any {
  let t = text.trim();
  // Retire d'eventuelles balises Markdown ```json ... ```
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // Sinon, isole du premier { au dernier }
  if (!t.startsWith("{")) {
    const first = t.indexOf("{");
    const lastBrace = t.lastIndexOf("}");
    if (first !== -1 && lastBrace !== -1) t = t.slice(first, lastBrace + 1);
  }
  return JSON.parse(t);
}

// ---- Travail de fond : genere et met a jour le diagnostic ----
async function runGeneration(clientId: string, base: any) {
  try {
    const { text, cost } = await callAnthropic(base.formData || {});
    let parsed: any;
    try {
      parsed = extractJSON(text);
    } catch (_e) {
      await saveDiagnostic(clientId, {
        ...base,
        status: "failed",
        errorMessage: "La reponse de l'IA n'etait pas un JSON exploitable. Tu peux relancer.",
        rawText: text.slice(0, 4000),
        generationCostEstimate: cost,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    await saveDiagnostic(clientId, {
      ...base,
      status: "completed",
      errorMessage: "",
      researchData: parsed.research ?? null,
      guideContent: parsed.diagnostic ?? null,
      programJson: parsed.program ?? null,
      generationCostEstimate: Number(cost.toFixed(3)),
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    await saveDiagnostic(clientId, {
      ...base,
      status: "failed",
      errorMessage: String(e).slice(0, 500),
      updatedAt: new Date().toISOString(),
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY manquante cote serveur. Configure le secret dans Supabase." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const { clientId } = await req.json();
    if (!clientId) {
      return new Response(JSON.stringify({ error: "clientId requis." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const existing = await loadDiagnostic(String(clientId));
    if (!existing || !existing.formData) {
      return new Response(JSON.stringify({ error: "Aucune fiche diagnostic enregistree pour ce client." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    // Verrou anti double-clic / double-cout : un seul diagnostic en generation a la fois.
    if (existing.status === "generating") {
      return new Response(JSON.stringify({ status: "generating", message: "Une generation est deja en cours." }), {
        status: 409,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const base = {
      ...existing,
      status: "generating",
      errorMessage: "",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveDiagnostic(String(clientId), base);

    // Travail long en tache de fond ; on repond tout de suite.
    // @ts-ignore EdgeRuntime est fourni par le runtime Supabase.
    EdgeRuntime.waitUntil(runGeneration(String(clientId), base));

    return new Response(JSON.stringify({ status: "generating" }), {
      status: 202,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
