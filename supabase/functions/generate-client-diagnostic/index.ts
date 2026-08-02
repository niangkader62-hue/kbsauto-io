// Supabase Edge Function : generate-client-diagnostic (SYNCHRONE, sans web_search)
// ------------------------------------------------------------------
// Genere un diagnostic client complet a partir de la fiche remplie dans le CRM
// KBSAuto : diagnostic strategique + programme 30/60 jours + guide, en JSON.
//
// La cle API Anthropic reste cote serveur (variable ANTHROPIC_API_KEY).
//
// IMPORTANT : la recherche web en direct a ete RETIREE. Elle depassait la
// limite de temps d'une Edge Function (plan gratuit ~150s). L'IA s'appuie sur
// sa connaissance du marche ouest-africain -> generation en ~30 a 50s, fiable.
// ------------------------------------------------------------------

const SUPABASE_URL = "https://vspepqwipgjkmnemwlfa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_olyJ2hEstrKN7KR4v4mNaQ_sYXVjw04";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const MODEL = "claude-sonnet-5";
const PRICE_IN_PER_TOKEN = 2 / 1_000_000;
const PRICE_OUT_PER_TOKEN = 10 / 1_000_000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function buildSystemPrompt(): string {
  return `Tu es le stratege senior de KBS Digital Agency (Afrique de l'Ouest, francophone).
Tu realises un DIAGNOSTIC MARKETING COMPLET pour un client a partir de sa fiche.

MISSION :
1. A partir de ta connaissance approfondie du marche ouest-africain (Senegal, Cote d'Ivoire, Mali, Benin, Burkina, Togo, Guinee...) et des reseaux sociaux (TikTok, Facebook), identifie des concurrents ou comptes de reference representatifs dans la MEME NICHE que le client. Donne des exemples concrets et plausibles (type de compte, style), en precisant que ce sont des references du secteur.
2. Pour chacun : nombre d'abonnes approximatif, plateforme, angle marketing, cible, et POURQUOI ca marche.
3. Croise avec le profil du client (form_data) pour identifier son VRAI probleme, souvent DIFFERENT du probleme percu qu'il a lui-meme decrit.
4. Produis un programme de suivi (30 ou 60 jours selon le/les service(s) concernes), jour par jour, avec des taches concretes cochables.
5. Produis un guide strategique : positionnement, personas, angles marketing avec exemples concrets et hooks prets a l'emploi, KPI a suivre.

CONTRAINTES DE SORTIE — TRES IMPORTANT :
- Reponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni apres, sans balises Markdown, sans commentaires.
- Tout le contenu textuel est en FRANCAIS, concret et actionnable, adapte au marche ouest-africain.
- Chaque tache du programme a un identifiant "id" UNIQUE et stable (ex: "j1t1", "j1t2", "j2t1"...).
- Respecte EXACTEMENT ce schema :

{
  "research": {
    "summary": "synthese de l'analyse concurrentielle en 4-6 phrases",
    "competitors": [
      { "name": "", "platform": "TikTok|Facebook|Instagram", "handle": "", "followers": "ex: ~35k", "angle": "", "target": "", "whyItWorks": "" }
    ],
    "sources": []
  },
  "diagnostic": {
    "positioning": "positionnement recommande pour le client, 2-4 phrases",
    "perceivedProblem": "le probleme que le client CROIT avoir (repris de sa fiche)",
    "realProblem": "le VRAI probleme identifie, et pourquoi",
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

Vise 6 a 10 concurrents, 2 a 4 personas, 3 a 6 angles, et un programme complet couvrant tous les jours (durationDays = 30 ou 60).`;
}

function buildUserContent(formData: any): string {
  // Les photos (dataURL base64) ne sont PAS envoyees a l'IA.
  const { photoClient: _pc, photoPage: _pp, ...textFields } = formData || {};
  return `Voici la fiche diagnostic du client. Produis le JSON demande.

FICHE CLIENT (form_data) :
${JSON.stringify(textFields, null, 2)}`;
}

// ---- Appel Anthropic : un seul appel rapide, sans outil (donc sans latence de
// recherche web). Reponse en ~30 a 50s, dans la limite de temps du serveur.
async function callAnthropic(formData: any) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "disabled" },
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserContent(formData) }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const u = data.usage ?? {};
  const totalIn = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
  const totalOut = u.output_tokens ?? 0;

  const text = (data.content ?? [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();

  const cost = totalIn * PRICE_IN_PER_TOKEN + totalOut * PRICE_OUT_PER_TOKEN;
  return { text, cost };
}

function extractJSON(text: string): any {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  if (!t.startsWith("{")) {
    const first = t.indexOf("{");
    const lastBrace = t.lastIndexOf("}");
    if (first !== -1 && lastBrace !== -1) t = t.slice(first, lastBrace + 1);
  }
  return JSON.parse(t);
}

// Genere le diagnostic, l'ecrit dans kbs_storage ET renvoie l'enregistrement.
async function runGeneration(clientId: string, base: any): Promise<any> {
  try {
    const { text, cost } = await callAnthropic(base.formData || {});
    let parsed: any;
    try {
      parsed = extractJSON(text);
    } catch (_e) {
      const rec = {
        ...base,
        status: "failed",
        errorMessage: "La reponse de l'IA n'etait pas un JSON exploitable. Tu peux relancer.",
        rawText: text.slice(0, 4000),
        generationCostEstimate: Number(cost.toFixed(3)),
        updatedAt: new Date().toISOString(),
      };
      await saveDiagnostic(clientId, rec);
      return rec;
    }

    const rec = {
      ...base,
      status: "completed",
      errorMessage: "",
      researchData: parsed.research ?? null,
      guideContent: parsed.diagnostic ?? null,
      programJson: parsed.program ?? null,
      generationCostEstimate: Number(cost.toFixed(3)),
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveDiagnostic(clientId, rec);
    return rec;
  } catch (e) {
    const rec = {
      ...base,
      status: "failed",
      errorMessage: String(e).slice(0, 500),
      updatedAt: new Date().toISOString(),
    };
    await saveDiagnostic(clientId, rec);
    return rec;
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
    // Verrou : un seul diagnostic en generation a la fois. Deverrouillage si un
    // precedent est reste bloque plus de 6 min.
    if (existing.status === "generating") {
      const startedMs = Date.parse(existing.startedAt || existing.updatedAt || "") || 0;
      const stale = Date.now() - startedMs > 6 * 60 * 1000;
      if (!stale) {
        return new Response(JSON.stringify({ status: "generating", message: "Une generation est deja en cours." }), {
          status: 409,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    const base = {
      ...existing,
      status: "generating",
      errorMessage: "",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveDiagnostic(String(clientId), base);

    const rec = await runGeneration(String(clientId), base);

    return new Response(JSON.stringify(rec), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
