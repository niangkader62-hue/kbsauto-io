import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Target, Users, LayoutGrid, Sparkles, CalendarDays, MessageSquare,
  Wallet, Link2, Plus, Trash2, ChevronDown, ChevronRight, ChevronLeft, ExternalLink,
  CheckCircle2, Circle, RotateCcw, TrendingUp, Banknote, Flame, GraduationCap,
  Award, TrendingDown, Lock, LogOut, CalendarClock, Send, History, FileText,
  Shield, UserPlus, AlertTriangle, Search, Copy, Radar, CalendarCheck,
  Pencil, Save, KeyRound, RefreshCw, X, MapPin, BookOpen, Bell, Eye, EyeOff,
  Archive, Percent
} from "lucide-react";

/* ---------------------------------- SUPABASE ---------------------------------- */
const supabase = createClient(
  "https://vspepqwipgjkmnemwlfa.supabase.co",
  "sb_publishable_olyJ2hEstrKN7KR4v4mNaQ_sYXVjw04"
);

/* ---------------------------------- PALETTE ---------------------------------- */
const C = {
  bg: "var(--c-bg)", card: "var(--c-card)", cardAlt: "var(--c-cardAlt)", border: "var(--c-border)",
  gold: "var(--c-gold)", goldLight: "var(--c-goldLight)", green: "var(--c-green)", greenLight: "var(--c-greenLight)",
  rust: "var(--c-rust)", rustLight: "var(--c-rustLight)", text: "var(--c-text)", muted: "var(--c-muted)",
  white: "#FFFFFF", black: "#0D0D0D",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;500;600;700;800;900&display=swap');
.kbs-navbar::-webkit-scrollbar { height: 0; display: none; }
.kbs-navbar { scrollbar-width: none; -ms-overflow-style: none; }
@keyframes kbsSwipeHint { 0%, 100% { opacity: .45; transform: translateX(0); } 50% { opacity: 1; transform: translateX(4px); } }
.kbs-hint { animation: kbsSwipeHint 1.9s ease-in-out infinite; }
:root{
  --c-bg:#F6F2EB;--c-card:#FFFFFF;--c-cardAlt:#F1EBE1;--c-border:rgba(23,21,20,0.10);
  --c-gold:#C15F3C;--c-goldLight:#D2734A;--c-green:#2E8B6F;--c-greenLight:#2E8B6F;
  --c-rust:#C0392B;--c-rustLight:#C0392B;--c-text:#171514;--c-muted:#6E665E;
}
@media (prefers-color-scheme: dark){
  :root{
    --c-bg:#141210;--c-card:#211D18;--c-cardAlt:#2A241E;--c-border:rgba(242,237,228,0.12);
    --c-gold:#D6764A;--c-goldLight:#E48D5F;--c-green:#3CBE7C;--c-greenLight:#57C99A;
    --c-rust:#E5765B;--c-rustLight:#E5765B;--c-text:#F2EDE4;--c-muted:#9A9187;
  }
}
body{ background:var(--c-bg); }`;

/* Codes d'accès par défaut — modifiables ensuite directement dans l'onglet Administration */
const DEFAULT_CODES = {
  app: "KBS2026",       // mot de passe général de l'outil
  ceo: "CEO2026",       // Objectif (CEO)
  catherine: "CATH2026", // CRM & Trésorerie (Catherine)
  ressources: "KBSAUTO2026", // Section Ressources (Boîte à outils, Académie, Plan 30j, Liens, Formation)
  admin: "ADMIN2026",   // Administration — accès total
  reset: "RESET2026",   // Confirmation supplémentaire pour tout réinitialiser
};
// Code de secours : fonctionne TOUJOURS, sur tous les écrans verrouillés,
// quoi qu'il arrive aux codes stockés dans la base. Sert de filet de sécurité
// pour ne plus jamais être bloqué hors de l'application.
const MASTER_CODE = "KBSAUTO2026";
function codeMatches(input, expected) {
  const norm = (s) => (s || "").toString().trim().toUpperCase();
  return norm(input) === norm(expected) || norm(input) === MASTER_CODE;
}
// Comparaison stricte, SANS le code de secours : utilisee la ou le contenu doit
// rester confidentiel entre membres (guides de Formation). Le filet de securite
// reste disponible via Administration, ou tous les codes sont visibles.
function codeMatchesStrict(input, expected) {
  const norm = (s) => (s || "").toString().trim().toUpperCase();
  return norm(input) !== "" && norm(input) === norm(expected);
}

/* ---------------------------------- NOTIFICATIONS PUSH ---------------------------------- */
const VAPID_PUBLIC_KEY = "BKrHlym_YWrE-ByaFkXDz8-xAukgCRyrPxsx-klRahzs_uBH68UjVE0EJ2eDyghQnBegMV7-1Kkan69rXfArxb8";
const NOTIFY_FUNCTION_URL = "https://vspepqwipgjkmnemwlfa.supabase.co/functions/v1/send-notification";
const DIAGNOSTIC_FUNCTION_URL = "https://vspepqwipgjkmnemwlfa.supabase.co/functions/v1/generate-client-diagnostic";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_olyJ2hEstrKN7KR4v4mNaQ_sYXVjw04";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// Envoie une notification push à toute l'équipe (appelée après une action importante : nouveau client, devis, etc.)
async function notifyTeam(title, body, tabId) {
  try {
    await fetch(NOTIFY_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "apikey": SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ title, body, url: tabId ? `/#${tabId}` : "/" }),
    });
  } catch (e) { /* best-effort — on ne bloque jamais l'action principale pour une notif ratée */ }
}

// Petit carillon interne (2 notes) joue quand une notification arrive alors que
// l'appli est ouverte. Genere par WebAudio : aucun fichier son a charger.
function playChime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    const t0 = ctx.currentTime;
    [[880, 0], [1318.5, 0.13]].forEach(([freq, dt]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t0 + dt);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.33);
      o.start(t0 + dt); o.stop(t0 + dt + 0.38);
    });
    setTimeout(() => { try { ctx.close(); } catch (e) {} }, 900);
  } catch (e) { /* silencieux */ }
}

// Pastille du systeme (comme WhatsApp) sur l'icone de l'appli installee.
function setAppBadge(n) {
  try {
    if (n > 0 && navigator.setAppBadge) navigator.setAppBadge(n);
    else if (navigator.clearAppBadge) navigator.clearAppBadge();
  } catch (e) { /* non supporte sur cet appareil */ }
}

// Pastille rouge de non-lus (compteur facon WhatsApp) affichee en haut a droite d'un onglet.
function NotifDot({ count }) {
  return (
    <span style={{
      position: "absolute", top: -5, right: -5, minWidth: 17, height: 17, padding: "0 4px",
      borderRadius: 999, background: "#E5484D", color: "#FFFFFF",
      fontSize: 10, fontWeight: 800, lineHeight: "17px", textAlign: "center",
      boxShadow: "0 0 0 2px var(--c-bg)", fontFamily: "Nunito, sans-serif",
    }}>{count > 9 ? "9+" : count}</span>
  );
}

const LOGO_B64 = "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";

function autoCode(name) {
  const base = (name || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, "").slice(0, 6) || "MEMBRE";
  return `${base}2026`;
}

/* Coordonnées de l'agence — affichées sur les reçus et devis PDF, modifiables dans Administration */
const DEFAULT_AGENCY = {
  name: "KBS DIGITAL AGENCY",
  email: "Niangkader62@gmail.com",
  phone1: "+223 76 90 80 31",
  phone2: "+223 90 64 71 06",
  address: "",
};

/* ---------------------------------- STATIC DATA ---------------------------------- */

const TEAM_COLORS = ["#C9A227", "#3CBE7C", "#DD6A54", "#7FB3E8", "#C58FE8", "#E8A26B"];

const DEFAULT_TEAM = [
  { id: "ceo", name: "CEO", role: "Stratégie, Technique, Enseignement", color: C.gold, code: "CEO2026",
    checklist: ["Vérifier les tâches à valider", "Monter la vidéo finale du jour", "Avancer sur un projet client", "Point d'équipe 15 min"] },
  { id: "catherine", name: "Catherine", role: "Commercial, Closing, Trésorerie", color: C.greenLight, code: "CATH2026",
    checklist: ["Traiter les messages WhatsApp", "Accueillir les nouveaux élèves", "Relancer les prospects en attente", "Mettre à jour la trésorerie"] },
  { id: "sacko", name: "Sacko", role: "Coordination, Graphisme", color: C.rustLight, code: "SACKO2026",
    checklist: ["Coordonner les tâches de l'équipe", "Créer les visuels du jour", "Vérifier la cohérence graphique", "Point d'équipe 15 min"] },
  { id: "oumou", name: "Oumou", role: "Créatrice de contenu", color: "#7FB3E8", code: "OUMOU2026",
    checklist: ["Écrire un script vidéo", "Tourner une vidéo", "Analyser une tendance TikTok", "Répondre aux commentaires"] },
];

const DEFAULT_PACKS = [
  { name: "Pack 1 : Formation + Vente", online: 45000, presentiel: 80000 },
  { name: "Pack 2 : Lancement Produit", online: 50000, presentiel: 85000 },
  { name: "Pack 3 : Visibilité (Mensuel)", online: 140000, presentiel: 160000 },
  { name: "Pack 4 : Présence Pro", online: 170000, presentiel: 190000 },
  { name: "Pack 5 : Conversion & Ventes", online: 65000, presentiel: 80000 },
  { name: "Pack 6 : IA & Automatisation", online: 70000, presentiel: 95000 },
  { name: "Pack 7 : Tech / Projet Avancé", online: 350000, presentiel: null, note: "Sur devis" },
];

const DEFAULT_FORMATIONS = [
  { name: "Formation Alibaba", online: 10000, presentiel: 20000 },
  { name: "Formation E-commerce", online: 20000, presentiel: 35000 },
  { name: "Intelligence Artificielle (IA)", online: 20000, presentiel: 35000 },
  { name: "Montage vidéo CapCut", online: 15000, presentiel: 25000 },
  { name: "Campagne publicitaire (Meta/TikTok)", online: 25000, presentiel: 35000 },
  { name: "Formation au Closing", online: 15000, presentiel: 25000 },
];

const DEFAULT_PRESTATIONS = [
  { name: "Création de page de vente", price: "25 000 FCFA" },
  { name: "Création de site web dynamique", price: "100 000 FCFA" },
  { name: "Community Management", price: "100 000 FCFA / mois" },
  { name: "Création de SaaS / Application", price: "À partir de 300 000 FCFA" },
];

const DEFAULT_PRICING = { packs: DEFAULT_PACKS, formations: DEFAULT_FORMATIONS, prestations: DEFAULT_PRESTATIONS };


const AI_TOOLS = [
  { cat: "Rédaction, Stratégie & Recherche IA", items: [
    { name: "Claude", url: "https://claude.ai", role: "Le \"cerveau\" de l'agence : stratégie, rédaction longue, création de documents (Word/Excel/PDF), code des apps KOLO et MY HABY.", adv: "Très fiable sur les gros documents et le raisonnement, peut livrer un fichier prêt à l'emploi directement." },
    { name: "ChatGPT", url: "https://chatgpt.com", role: "Brainstorming rapide, GPTs personnalisés, génération d'images.", adv: "Polyvalent, bon pour itérer vite sur des idées et scripts courts." },
    { name: "Gemini", url: "https://gemini.google.com", role: "Analyse de documents longs, intégration Gmail / Docs / Sheets.", adv: "Pratique quand Catherine ou toi travaillez déjà dans Google Workspace." },
    { name: "Perplexity", url: "https://www.perplexity.ai", role: "Veille concurrentielle et études de marché avec sources vérifiables.", adv: "Idéal avant de lancer une offre : voir ce qui marche chez les concurrents." },
  ]},
  { cat: "Voix, Vidéo & Avatars IA", items: [
    { name: "HeyGen", url: "https://www.heygen.com", role: "Avatars IA parlants et doublage automatique multilingue.", adv: "Permet à Sacko de produire des vidéos sans être toujours filmé, ou de dupliquer une vidéo en plusieurs langues." },
    { name: "Eleven Labs", url: "https://elevenlabs.io", role: "Voix off IA ultra réalistes en plusieurs langues, clonage vocal.", adv: "Parfait pour les voix off de présentations ou tutoriels sans micro pro." },
    { name: "CapCut", url: "https://www.capcut.com", role: "Montage vidéo mobile, sous-titres automatiques, effets tendances TikTok.", adv: "Outil principal du CEO pour le montage final signature de l'agence." },
    { name: "Video Compressor", url: "https://play.google.com/store/apps", role: "Compression vidéo avant envoi WhatsApp ou upload.", adv: "Évite les échecs d'envoi liés aux fichiers trop lourds depuis mobile." },
  ]},
  { cat: "Design & Présentation", items: [
    { name: "Canva", url: "https://www.canva.com", role: "Design de posts, affiches, visuels de vente. Magic Studio pour générer/retoucher des images par IA.", adv: "Templates rapides, cohérence visuelle de marque pour toute l'équipe." },
    { name: "Gamma", url: "https://gamma.app", role: "Génère des présentations professionnelles complètes à partir d'un simple texte.", adv: "Parfait pour les présentations de partenariat ou de closing B2B." },
  ]},
  { cat: "Développement & Hébergement", items: [
    { name: "Supabase", url: "https://supabase.com", role: "Base de données et authentification pour les apps KOLO et MY HABY.", adv: "Backend prêt en quelques minutes, temps réel, sécurisé." },
    { name: "Netlify", url: "https://www.netlify.com", role: "Hébergement et déploiement instantané par glisser-déposer.", adv: "Compatible avec ton flux de travail 100% mobile." },
    { name: "Cursor", url: "https://cursor.com", role: "Éditeur de code assisté par IA pour accélérer le développement.", adv: "Utile quand tu passes sur ordinateur pour du code plus complexe." },
  ]},
  { cat: "Organisation & Automatisation", items: [
    { name: "Notion", url: "https://www.notion.so", role: "QG central de l'agence : bases de données, documentation, suivi.", adv: "Un seul endroit pour toute l'équipe, accessible mobile et ordinateur." },
    { name: "Loom", url: "https://www.loom.com", role: "Enregistrement vidéo d'écran pour les tutoriels internes.", adv: "Le CEO forme l'équipe sans réunion en direct." },
    { name: "Make.com", url: "https://www.make.com", role: "Automatisation entre applications (ex: nouvelle vente → notification WhatsApp).", adv: "Fait gagner du temps sur les tâches répétitives de suivi." },
    { name: "Systeme.io", url: "https://systeme.io", role: "Tunnels de vente, pages de capture, emailing automatique.", adv: "Tout-en-un pour vendre les formations et packs sans site complexe." },
  ]},
  { cat: "Marketing & Publicité", items: [
    { name: "Meta Business Suite", url: "https://business.facebook.com", role: "Gestion centralisée Facebook / Instagram, publications programmées.", adv: "Rôles séparés pour Sacko (contenu) et Catherine (messages)." },
    { name: "Publicité Meta (Ads Manager)", url: "https://www.facebook.com/adsmanager", role: "Campagnes publicitaires ciblées Facebook/Instagram.", adv: "Ciblage précis par ville, âge et centres d'intérêt en Afrique de l'Ouest." },
  ]},
  { cat: "Banques média gratuites", items: [
    { name: "Pexels (photos)", url: "https://www.pexels.com", role: "Photos libres de droits pour visuels et publicités.", adv: "Qualité pro, gratuit, sans attribution obligatoire." },
    { name: "Pexels Vidéos", url: "https://www.pexels.com/videos/", role: "Vidéos libres de droits pour montages et publicités.", adv: "Bonnes B-roll pour habiller les vidéos de Sacko." },
    { name: "Pixabay", url: "https://pixabay.com", role: "Photos, vidéos et illustrations gratuites.", adv: "Complète Pexels avec plus d'illustrations et d'icônes." },
  ]},
];

const WEEKS = [
  { title: "Semaine 1 — Intégration & Configuration", tasks: [
    "CEO : configurer Meta Business Suite pour Sacko et Catherine, enregistrer 3 tutoriels Loom.",
    "Catherine : connecter WhatsApp Companion, étudier l'historique des anciennes conversations clients.",
    "Sacko : analyser 5 comptes concurrents sur TikTok.",
  ]},
  { title: "Semaine 2 — Machine à contenu & prospection", tasks: [
    "Sacko : rédiger et tourner les 3 premières vidéos face caméra.",
    "CEO : montage final CapCut, configuration de la page de vente du Pack 1.",
    "Catherine : lister 20 profils d'entrepreneurs locaux à contacter.",
  ]},
  { title: "Semaine 3 — Intensification des ventes", tasks: [
    "Sacko : répondre aux commentaires générés par les vidéos.",
    "Catherine : récupérer les leads WhatsApp, utiliser les scripts, relancer à J+1.",
    "CEO : avancer sur le projet de site web dynamique pour un client.",
  ]},
  { title: "Semaine 4 — Optimisation & encaissement", tasks: [
    "Sacko : analyser les statistiques des vidéos avec le CEO.",
    "Catherine : faire le point trésorerie, vérifier si l'objectif 250 000 FCFA est atteint.",
    "CEO : distribuer les premières commissions de l'équipe (selon le taux officiel).",
  ]},
];

const PERSONAS = [
  { title: "Le Vendeur Débutant", age: "20–35 ans", desc: "Veut se lancer dans l'e-commerce / import Alibaba, budget limité, cherche une formation accessible.",
    tone: "Langage simple et familier, preuve sociale (témoignages), promesse concrète \"gagner de l'argent rapidement\", ton motivant." },
  { title: "Le Commerçant / Boutique locale", age: "30–50 ans", desc: "Activité physique déjà lancée, veut plus de visibilité digitale mais ne maîtrise pas les réseaux sociaux.",
    tone: "Ton rassurant, vocabulaire sans jargon, résultats concrets (\"plus de clients dans votre boutique\")." },
  { title: "L'Entrepreneur / PME Ambitieux", age: "25–45 ans", desc: "Veut un site web, une application ou de l'automatisation IA, budget plus élevé.",
    tone: "Ton professionnel, orienté retour sur investissement, mise en avant de l'expertise technique." },
];

const GROUPES_CIBLES = [
  "Groupes Facebook : \"Entrepreneurs au Mali\", \"Business Bamako\", \"Achat/Vente gros et détail\"",
  "Canaux Telegram professionnels d'entrepreneurs",
  "Groupes WhatsApp de commerçants",
  "Réseau élargi : Sénégal, Côte d'Ivoire, Burkina Faso, Guinée (via le partenaire au Bénin et les collaborateurs)",
];

const METHODE_PROSPECTION = [
  "Ne jamais spammer ni publier de lien direct dans les groupes.",
  "Repérer une publication d'un commerçant qui se plaint de ne pas vendre.",
  "Répondre avec 2 conseils gratuits tirés de nos formations (apport de valeur réel).",
  "Inviter en message privé WhatsApp pour un audit gratuit de sa page.",
  "Convertir l'audit gratuit en proposition d'un Pack adapté à son besoin.",
];

/* ---------------------------------- PROSPECTION TERRAIN (entreprises physiques) ---------------------------------- */
const METHODE_TERRAIN = [
  { titre: "Avant la visite — Préparer son terrain", points: [
    "Repérer des commerces à fort potentiel : bonne fréquentation, activité active, mais visibilité en ligne faible ou nulle.",
    "Avoir sur soi : le portefeuille de preuves (captures, exemples), la grille tarifaire, des devis vierges, une carte de visite.",
    "Fixer un objectif clair pour la visite : obtenir un rendez-vous, présenter, ou closer directement.",
  ]},
  { titre: "Les 30 premières secondes — L'accroche", points: [
    "Se présenter brièvement : prénom + KBS Digital Agency + une phrase d'impact, pas un discours.",
    "Complimenter un détail réel et précis du commerce — jamais une phrase générique.",
    "Poser une seule question ouverte qui montre un intérêt sincère pour leur activité, pas une intention de vendre.",
  ]},
  { titre: "Découverte — Comprendre avant de proposer", points: [
    "Comment trouvez-vous vos clients aujourd'hui ?",
    "Avez-vous déjà essayé le digital (réseaux sociaux, site, publicité) ? Qu'est-ce qui a marché ou pas ?",
    "Quel est votre plus gros frein : le temps, le budget, ou le manque de compétence technique ?",
    "Toujours reformuler leur besoin avec leurs propres mots avant de proposer quoi que ce soit.",
  ]},
  { titre: "Présentation — Relier le service à LEUR problème", points: [
    "Ne jamais réciter tout le catalogue : choisir un seul service qui répond exactement à ce qu'ils viennent de dire.",
    "Montrer le portefeuille concret de ce service précis (voir la fiche de chaque service ci-dessous).",
    "Donner un chiffre ou un résultat concret quand c'est possible plutôt qu'une promesse vague.",
  ]},
  { titre: "Gestion des objections", points: [
    "Ne jamais argumenter contre le client — valider son point, puis répondre.",
    "Structure simple : \"Je comprends... beaucoup de nos clients pensaient pareil... voici ce qu'on a fait pour eux...\"",
    "Voir l'objection fréquente et la réponse préparée pour chaque service ci-dessous.",
  ]},
  { titre: "Closing — Conclure", points: [
    "Poser une question de closing simple et directe : \"On démarre cette semaine ou la semaine prochaine ?\"",
    "Toujours repartir avec quelque chose de concret : un acompte, une signature, ou au minimum un rendez-vous daté.",
    "Utiliser le devis PDF professionnel pour formaliser l'offre immédiatement sur place.",
  ]},
  { titre: "Après la vente — Fidéliser et faire grandir", points: [
    "Envoyer le reçu PDF professionnel immédiatement après paiement — ça renforce le sérieux de l'agence.",
    "Demander un avis Google ou un témoignage dès le premier résultat visible.",
    "Programmer une relance pour proposer une évolution vers un pack supérieur (upsell).",
  ]},
];

/* Chaque entrée : cible = type de commerce idéal, portfolio = preuves concrètes à montrer,
   accroche = phrase d'ouverture spécifique, objection = frein fréquent, reponse = réponse préparée.
   Les Packs 3 et 4 ont un "script" complet étape par étape en plus (offres phares). */
const PROSPECTION_GUIDE = {
  "Formations & Coaching": [
    { name: "Formation Alibaba", cible: "Commerçants vendant des produits importés (vêtements, électronique, cosmétiques, accessoires)",
      portfolio: "Captures de commandes Alibaba réussies, calcul de marge achat/revente, témoignage d'un élève qui importe déjà",
      accroche: "Vous vendez déjà ce type de produit ici — savez-vous que vous pourriez l'acheter 3 à 5 fois moins cher en direct ?",
      objection: "Je n'ai pas le temps d'apprendre ça.",
      reponse: "La formation présentielle dure 2h, on la programme à votre convenance, et votre premier import rembourse largement l'investissement." },
    { name: "Formation E-commerce", cible: "Commerçants avec des produits physiques mais aucune présence en ligne",
      portfolio: "Exemple de boutique en ligne montée pour un client + captures des commandes reçues",
      accroche: "Vos produits sont visibles uniquement ici en boutique, ou aussi en ligne ?",
      objection: "Le e-commerce c'est compliqué pour moi.",
      reponse: "On démarre avec 3 produits seulement : en 48h vous avez votre première page en ligne, pas besoin d'être informaticien." },
    { name: "Intelligence Artificielle (IA)", cible: "Tout commerçant ou PME qui perd du temps sur des tâches répétitives",
      portfolio: "Démonstration en direct sur le téléphone : générer un post ou une réponse client en 30 secondes",
      accroche: "Combien de temps passez-vous chaque jour à écrire vos publications ou répondre aux mêmes questions ?",
      objection: "L'IA c'est réservé aux grandes entreprises.",
      reponse: "Je vous montre maintenant, sur votre propre produit, en 1 minute — vous jugez par vous-même." },
    { name: "Montage vidéo CapCut", cible: "Restaurants, salons de beauté, boutiques avec des produits visuels",
      portfolio: "Vidéo brute vs vidéo montée (avant/après), captures des vues obtenues",
      accroche: "Vos vidéos ont l'air professionnelles, ou filmées à la va-vite ?",
      objection: "Je n'ai pas de contenu à filmer.",
      reponse: "On filme ensemble 15 minutes sur place pendant la formation, avec ce que vous avez déjà." },
    { name: "Campagne publicitaire (Meta/TikTok)", cible: "Commerces à forte demande locale : restaurants, boutiques, événements",
      portfolio: "Capture d'une campagne gérée avec ses résultats (impressions, clics, coût par résultat)",
      accroche: "Avez-vous déjà boosté une publication, ou vous ne savez pas par où commencer ?",
      objection: "La publicité en ligne coûte cher.",
      reponse: "On teste avec un petit budget, 5 000 à 10 000 FCFA par jour, pour voir les résultats avant d'investir plus." },
    { name: "Formation au Closing", cible: "Boutiques ou PME avec une équipe de vente (vendeurs, accueil)",
      portfolio: "Script de vente utilisé + témoignage d'une équipe déjà formée",
      accroche: "Vos vendeurs concluent facilement, ou perdez-vous des clients au dernier moment ?",
      objection: "Mes vendeurs savent déjà vendre.",
      reponse: "Proposez un audit gratuit de 10 minutes sur une vraie situation de vente — ça révèle souvent des points invisibles de l'intérieur." },
  ],
  "Prestations techniques & créatives": [
    { name: "Création de page de vente", cible: "Tout commerce qui fait de la publicité ou reçoit du trafic sans page dédiée",
      portfolio: "2 à 3 pages de vente déjà réalisées (à montrer sur tablette/téléphone), taux de conversion si connu",
      accroche: "Quand quelqu'un clique sur votre publicité ou cherche votre offre, où atterrit-il ?",
      objection: "J'ai déjà une page Facebook.",
      reponse: "Une page Facebook informe ; une page de vente est conçue pour transformer un visiteur en client — ce n'est pas le même outil." },
    { name: "Création de site web dynamique", cible: "PME et entreprises de services établies (cabinets, agences, sociétés structurées)",
      portfolio: "2 à 3 sites réalisés, et KBSAuto.io lui-même comme preuve vivante du savoir-faire technique",
      accroche: "Si un client tape le nom de votre entreprise sur Google aujourd'hui, que trouve-t-il ?",
      objection: "C'est un investissement important.",
      reponse: "Détaillez ce qui est inclus (design, hébergement, mises à jour) et comparez au coût d'un client perdu faute de visibilité en ligne." },
    { name: "Community Management", cible: "Restaurants, boutiques, salons — tout commerce dont la clientèle utilise les réseaux sociaux",
      portfolio: "Avant/après d'une page gérée (fréquence de publication, engagement) + calendrier de contenu type",
      accroche: "Qui s'occupe de vos réseaux sociaux en ce moment ?",
      objection: "Je peux le faire moi-même.",
      reponse: "Montrez le temps réel que ça demande (recherche, création, publication, réponses) et la différence de régularité avec un professionnel dédié." },
    { name: "Création de SaaS / Application", cible: "PME structurées avec un besoin de gestion interne (stocks, rendez-vous, clients)",
      portfolio: "KBSAuto.io comme démonstration concrète et vivante du savoir-faire technique de l'agence",
      accroche: "Comment gérez-vous vos rendez-vous, vos stocks ou vos clients aujourd'hui — sur papier, Excel, ou un outil dédié ?",
      objection: "C'est un très gros investissement.",
      reponse: "Proposez un cahier des charges gratuit et un devis détaillé avant tout engagement — aucune surprise sur le prix final." },
  ],
  "Packs stratégiques": [
    { name: "Pack 1 : Formation + Vente", cible: "Débutants qui veulent se lancer dans la vente en ligne",
      portfolio: "Parcours d'un élève passé de 0 à ses premières ventes",
      accroche: "Vous voulez vendre en ligne mais vous ne savez pas par où commencer ?",
      objection: "Je préfère apprendre gratuitement sur YouTube.",
      reponse: "YouTube donne des bouts d'information épars ; ici vous avez un parcours structuré et un accompagnement jusqu'à votre première vente." },
    { name: "Pack 2 : Lancement Produit", cible: "Commerces qui préparent un nouveau produit ou une nouvelle offre",
      portfolio: "Exemple d'un lancement réussi : teaser, jour J, résultats obtenus",
      accroche: "Vous avez un nouveau produit ou service à annoncer bientôt ?",
      objection: "On peut gérer le lancement nous-mêmes.",
      reponse: "Proposez de gérer ce lancement comme un test — le résultat parlera de lui-même pour la suite de la collaboration." },
    { name: "Pack 3 : Visibilité (Mensuel)", cible: "Tout commerce physique actif, bien fréquenté sur place, mais invisible en ligne",
      portfolio: "Avant/après d'une page gérée par KBS (posts, engagement, avis clients)",
      accroche: "Votre boutique est bien fréquentée ici — avez-vous autant de visibilité en ligne ?",
      objection: "C'est cher pour un abonnement mensuel.",
      reponse: "Comparez au coût d'un employé à temps plein pour faire pareil, ou au coût des clients perdus chaque mois faute de visibilité.",
      script: [
        "Repérage : commerce avec bonne fréquentation physique mais page Facebook abandonnée, pas d'avis Google, pas de site.",
        "Ouverture : se présenter, complimenter un détail réel, puis \"Je vois que votre boutique est bien fréquentée ici — avez-vous autant de visibilité en ligne ?\"",
        "Découverte : \"Qui gère vos réseaux sociaux aujourd'hui ?\" / \"Combien de clients pensez-vous perdre parce qu'ils ne vous trouvent pas en ligne ?\"",
        "Présentation : montrer le portefeuille avant/après, présenter le Pack comme une solution mensuelle tout-en-un à prix fixe.",
        "Preuve chiffrée : \"Nos clients en Pack Visibilité voient en moyenne plus de messages et d'appels en 4 à 6 semaines.\"",
        "Objection prix : comparer au coût d'un salarié dédié ou aux clients perdus chaque mois.",
        "Closing : \"On peut démarrer cette semaine avec votre premier mois — je prends vos informations et on programme le premier contenu maintenant ?\"",
        "Après-vente : envoyer le reçu PDF immédiatement, planifier un bilan à 30 jours, proposer une évolution vers le Pack 4.",
      ] },
    { name: "Pack 4 : Présence Pro", cible: "PME ou commerce structuré voulant une image professionnelle complète (souvent après le Pack 3)",
      portfolio: "Exemples de PME dont l'image a été transformée, captures avant/après",
      accroche: "Vous avez une belle activité ici — votre image en ligne reflète-t-elle vraiment ce niveau de professionnalisme ?",
      objection: "On a déjà quelqu'un en interne qui s'en occupe un peu.",
      reponse: "Ce pack ne remplace pas forcément cette personne : il structure et professionnalise ce qui est fait aujourd'hui de façon informelle.",
      script: [
        "Repérage : entreprises à l'activité stable qui veulent professionnaliser leur image globale, souvent après un premier contact via le Pack 3.",
        "Ouverture : \"Vous avez une belle activité ici — est-ce que votre image en ligne reflète vraiment ce niveau de professionnalisme ?\"",
        "Découverte : \"Avez-vous un site web ? Une charte visuelle cohérente ? Des avis clients visibles ?\"",
        "Présentation : positionner le Pack 4 comme la solution complète — présence gérée + visuels professionnels + suivi stratégique mensuel.",
        "Preuve : montrer des exemples de PME transformées, avec captures avant/après à l'appui.",
        "Objection : rassurer sur la complémentarité avec l'existant plutôt que le remplacement.",
        "Closing : proposer un premier mois d'essai avec des livrables clairs, faire valider avec un devis PDF professionnel.",
        "Après-vente : suivi mensuel avec bilan chiffré, proposition d'évolution vers les packs techniques (site web, SaaS).",
      ] },
    { name: "Pack 5 : Conversion & Ventes", cible: "Commerces qui ont du trafic ou des contacts mais peu de ventes concrètes",
      portfolio: "Exemple d'entonnoir de vente (page + relance + closing) avec résultats obtenus",
      accroche: "Vous avez des visiteurs ou des contacts, mais peu de ventes concrètes ?",
      objection: "On a déjà des clients, ça suffit.",
      reponse: "Ce pack sert à vendre plus aux mêmes contacts, pas seulement à en trouver de nouveaux — on augmente le volume et la fréquence d'achat." },
    { name: "Pack 6 : IA & Automatisation", cible: "Commerces qui reçoivent beaucoup de messages clients répétitifs (WhatsApp, réseaux sociaux)",
      portfolio: "Exemple de réponse automatique WhatsApp + temps gagné chiffré",
      accroche: "Combien de messages clients recevez-vous par jour, et qui y répond ?",
      objection: "Je préfère répondre moi-même, c'est plus humain.",
      reponse: "L'automatisation gère les questions répétitives (horaires, prix, disponibilité) — vous gardez le temps pour les échanges qui comptent vraiment." },
    { name: "Pack 7 : Tech / Projet Avancé", cible: "PME structurées avec un besoin sur mesure (plateforme, outil interne)",
      portfolio: "KBSAuto.io présenté comme la vitrine ultime du savoir-faire technique de l'agence",
      accroche: "Avez-vous un projet technique en tête que vous n'avez jamais pu concrétiser ?",
      objection: "C'est un trop gros projet, on doit réfléchir.",
      reponse: "Proposez un atelier de cadrage gratuit de 30 minutes pour clarifier le besoin avant tout devis engageant." },
  ],
};

const SCRIPTS = [
  { title: "Script 1 — Débutants e-commerce (Pack 1)",
    hook: "\"Tu veux commencer à vendre en ligne mais tu ne sais pas par où commencer ?\"",
    probleme: "Beaucoup de débutants perdent de l'argent en achetant au mauvais endroit ou en n'ayant aucune page de vente.",
    solution: "Avec le Pack 1, tu apprends à importer depuis Alibaba, à monter ta boutique et à avoir une vraie page de vente qui convertit.",
    cta: "Écris \"PACK1\" en commentaire ou en message pour recevoir le programme complet." },
  { title: "Script 2 — Boutiques/PME locales (Pack 3)",
    hook: "\"Ta boutique est belle mais personne ne la connaît sur les réseaux ?\"",
    probleme: "Sans présence régulière sur Facebook et TikTok, tu perds des clients chaque jour au profit de la concurrence.",
    solution: "Le Pack 3 Visibilité Mensuelle gère tes publications et tes publicités pour que de nouveaux clients arrivent chaque semaine.",
    cta: "Envoie \"VISIBILITÉ\" en message privé pour un audit gratuit de ta page." },
  { title: "Script 3 — IA & Automatisation (Pack 6)",
    hook: "\"Et si une IA pouvait faire le travail de 3 employés pour ton business ?\"",
    probleme: "Beaucoup d'entrepreneurs perdent des heures sur des tâches répétitives : réponses clients, visuels, rapports.",
    solution: "Le Pack IA & Automatisation t'apprend à utiliser Claude, ChatGPT et Make.com pour automatiser tout ça.",
    cta: "Écris \"IA\" en message pour découvrir le programme complet." },
  { title: "Script 4 — Formation Alibaba (Import)",
    hook: "\"Tu veux importer depuis la Chine mais tu as peur de te faire arnaquer ?\"",
    probleme: "Beaucoup perdent de l'argent en commandant chez le mauvais fournisseur ou en payant trop de frais de douane.",
    solution: "La Formation Alibaba t'apprend à choisir un fournisseur fiable, négocier les prix et calculer ta marge avant de commander.",
    cta: "Envoie \"ALIBABA\" pour recevoir le guide complet." },
  { title: "Script 5 — Site web dynamique (PME)",
    hook: "\"Ton entreprise mérite mieux qu'une simple page Facebook.\"",
    probleme: "Sans site web professionnel, tes clients doutent de ton sérieux face à la concurrence.",
    solution: "On te crée un site web dynamique, rapide et pensé pour convertir tes visiteurs en clients.",
    cta: "Réserve un appel gratuit pour discuter de ton projet." },
  { title: "Script 6 — Formation Montage CapCut",
    hook: "\"Tes vidéos ont l'air amateur alors que tu passes des heures dessus ?\"",
    probleme: "Un mauvais montage fait fuir les spectateurs avant même la fin de la vidéo.",
    solution: "La Formation CapCut t'apprend les techniques qui gardent l'attention et donnent un rendu professionnel.",
    cta: "Écris \"MONTAGE\" pour t'inscrire." },
  { title: "Script 7 — Campagne publicitaire Meta/TikTok",
    hook: "\"Tu as déjà dépensé de l'argent en pub sans aucun résultat ?\"",
    probleme: "La majorité des pubs échouent à cause d'un mauvais ciblage ou d'un message qui ne parle pas au bon client.",
    solution: "On configure et on optimise tes campagnes Meta et TikTok pour toucher les bonnes personnes au bon moment.",
    cta: "Envoie \"PUB\" pour un audit gratuit de ton compte publicitaire." },
  { title: "Script 8 — Formation au Closing",
    hook: "\"Tu as des prospects intéressés mais qui n'achètent jamais ?\"",
    probleme: "Beaucoup de ventes se perdent à cause d'un mauvais suivi ou d'objections mal gérées.",
    solution: "La Formation au Closing te donne les scripts et techniques pour transformer une conversation WhatsApp en vente conclue.",
    cta: "Écris \"CLOSING\" pour recevoir le programme." },
  { title: "Script 9 — Community Management mensuel",
    hook: "\"Qui gère tes réseaux sociaux pendant que tu gères ton entreprise ?\"",
    probleme: "Publier sans stratégie fait perdre du temps et ne ramène pas de nouveaux clients.",
    solution: "Notre équipe crée et publie ton contenu chaque semaine, en cohérence avec ta marque et tes objectifs de vente.",
    cta: "Envoie \"VISIBILITÉ PRO\" pour découvrir nos formules mensuelles." },
  { title: "Script 10 — Coaching Entrepreneuriat global",
    hook: "\"Tu veux lancer ton business mais tu te sens seul face à toutes les décisions ?\"",
    probleme: "Sans accompagnement, on perd du temps à essayer-échouer sur des choses déjà maîtrisées par d'autres.",
    solution: "Notre coaching t'accompagne pas à pas, de l'idée jusqu'à ta première vente, avec un plan adapté à ton budget.",
    cta: "Réserve ton appel de découverte gratuit dès aujourd'hui." },
];

const HOOKS = [
  { cat: "Curiosité", items: [
    "Voici comment j'ai vendu ma première formation sans dépenser 1 FCFA en publicité.",
    "Ce que 90% des vendeurs sur Facebook ignorent sur l'algorithme en 2026.",
    "Le secret que les grosses boutiques ne veulent pas que tu connaisses.",
    "J'ai testé l'IA pour créer une pub en 5 minutes… voici le résultat.",
    "Pourquoi certains vendeurs explosent leurs ventes pendant que d'autres stagnent ?",
    "La méthode que j'utilise pour trouver des clients sans jamais publier de pub.",
  ]},
  { cat: "Douleur / Problème", items: [
    "Tu postes tous les jours et personne n'achète ? Voici pourquoi.",
    "Ta boutique est belle mais vide de clients ? Le problème n'est pas ton produit.",
    "Tu perds de l'argent chaque mois sur des pubs qui ne convertissent pas ?",
    "Arrête de payer pour des formations qui ne t'apprennent rien de concret.",
    "Tu ne sais pas comment importer depuis Alibaba sans te faire arnaquer ?",
    "Ton compte TikTok stagne à 100 vues depuis des mois ?",
  ]},
  { cat: "Preuve sociale", items: [
    "Comment ce client est passé de 0 à 15 ventes en 2 semaines.",
    "Plus de 50 entrepreneurs ouest-africains ont déjà suivi cette formation.",
    "Ce client vendait 0 produit avant de travailler avec nous. Regarde maintenant.",
    "Nos élèves parlent mieux que nous — voici leurs résultats.",
    "Ils ont commencé comme toi, sans expérience. Voici où ils en sont.",
    "Le témoignage qui m'a convaincu de créer cette formation.",
  ]},
  { cat: "Urgence / Rareté", items: [
    "Plus que 3 places disponibles pour l'accompagnement de ce mois.",
    "L'offre Pack 1 à prix réduit se termine dans 48h.",
    "Ce tarif ne sera plus disponible le mois prochain.",
    "Les 10 premiers inscrits reçoivent un bonus gratuit.",
    "Dernière session de formation avant la prochaine augmentation de prix.",
    "Cette astuce IA va bientôt être payante partout — profites-en maintenant.",
  ]},
  { cat: "Question directe", items: [
    "Tu veux vendre en ligne mais tu ne sais pas par où commencer ?",
    "Et si tu pouvais créer 10 publicités en 1 heure grâce à l'IA ?",
    "Combien de temps perds-tu chaque semaine à créer du contenu qui ne marche pas ?",
    "Prêt à transformer ta page Facebook en machine à vendre ?",
    "Tu sais que tu peux automatiser tes ventes pendant que tu dors ?",
    "Qu'est-ce qui t'empêche vraiment de lancer ta boutique en ligne aujourd'hui ?",
  ]},
];

const DEPENSES_CATEGORIES = ["Publicité (Meta/TikTok)", "Abonnements outils IA", "Formation", "Transport / Communication", "Autre"];

const SUIVI_STATUTS = ["Nouveau client", "Formation en cours", "Formation terminée", "Support après-vente"];

function buildServicesCatalogue(pricing) {
  return [
    { groupe: "Packs stratégiques", options: pricing.packs.map(p => p.name) },
    { groupe: "Formations & Coaching", options: pricing.formations.map(f => f.name) },
    { groupe: "Prestations techniques & créatives", options: pricing.prestations.map(p => p.name) },
  ];
}

const DETTE_STATUTS = ["En attente", "Payée"];

const PROSPECTION_STATUTS = ["À répondu", "Intéressé", "Contacté", "Objection prix", "Pas intéressé", "Archivé"];
const INTERET_NIVEAUX = ["Chaud", "Tiède", "Froid"];
function buildAllServicesFlat(pricing) {
  return [...pricing.packs.map(p => p.name), ...pricing.formations.map(p => p.name), ...pricing.prestations.map(p => p.name)];
}

function findServiceInfo(name, pricing) {
  const pack = pricing.packs.find(p => p.name === name);
  if (pack) return { price: fcfa(pack.online) };
  const f = pricing.formations.find(p => p.name === name);
  if (f) return { price: fcfa(f.online) };
  const pr = pricing.prestations.find(p => p.name === name);
  if (pr) return { price: pr.price };
  return { price: "[Prix]" };
}

const DM_SCRIPTS = [
  { stage: "Premier Contact", text: "Bonjour [Prénom] 👋\nJ'ai vu ton commentaire, ça a l'air de vraiment t'intéresser !\nMoi c'est [Ton prénom], de KBS Digital Agency — on aide les entrepreneurs avec [Service].\nEst-ce que c'est quelque chose qui pourrait t'intéresser qu'on t'explique en 2 minutes ?" },
  { stage: "Relance (48h)", text: "Bonjour [Prénom] 😊\nJe voulais juste m'assurer que mon dernier message ne s'est pas perdu dans tes notifications.\nTu as 2 minutes pour qu'on en parle rapidement ?" },
  { stage: "Objection Prix", text: "Je comprends totalement [Prénom], le budget c'est important.\nAvec [Service] (à partir de [Prix]), tu peux rapidement rentabiliser ton investissement avec un seul client ou une seule vente.\nOn peut aussi voir ensemble une formule plus légère si tu préfères commencer petit." },
  { stage: "Objection Confiance", text: "Ta méfiance est totalement normale [Prénom], beaucoup de nos clients avaient les mêmes doutes au début.\nJe peux t'envoyer gratuitement un aperçu ou un témoignage pour que tu voies la qualité de notre travail, sans aucun engagement.\nTu veux que je te l'envoie maintenant ?" },
  { stage: "Closing", text: "Super [Prénom] ! Voici ce que tu obtiens avec [Service] :\n✅ Un accompagnement complet, étape par étape\n✅ Un support direct sur WhatsApp\n✅ Nos ressources et guides inclus\nPour [Prix] → paiement via Wave, Orange Money ou Chariow.\nDès que c'est fait, on démarre immédiatement 🚀" },
];

function defaultDispoDays() {
  const d = {};
  for (let i = 1; i <= 30; i++) d[i] = { disponible: false, heure: "", note: "" };
  return d;
}

const WEEKDAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
function weekdayAbbrev(dayNum) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), dayNum);
  return WEEKDAYS_FR[d.getDay()];
}

function buildReceiptText(p) {
  const date = p.dateInscription || new Date().toISOString().slice(0, 10);
  return `🧾 REÇU — KBS Digital Agency%0A%0AClient : ${p.prenom || ""} ${p.nom}%0AService : ${p.pack}%0AMontant payé : ${fcfa(p.montant)}%0ADate : ${date}%0A%0AMerci pour votre confiance ! 🙏%0AKBS Digital Agency`;
}
function whatsappReceiptLink(p) {
  const phone = (p.whatsapp || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${phone}?text=${buildReceiptText(p)}`;
}
function buildRappelText(d) {
  return `👋 Bonjour ${d.clientNom},%0A%0ACeci est un rappel amical concernant votre paiement de ${fcfa(d.montantDu)} pour "${d.service}", prévu le ${d.dateEcheance}.%0A%0AMerci de nous contacter pour régulariser dès que possible.%0A— KBS Digital Agency`;
}
function whatsappRappelLink(d) {
  const phone = (d.whatsapp || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${phone}?text=${buildRappelText(d)}`;
}

/* ---------------------------------- PDF : REÇU & DEVIS PROFESSIONNELS ---------------------------------- */
const LOGO_BASE64 = "data:image/png;base64,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";
const PDF_GOLD = [201, 162, 39];
const PDF_NAVY = [10, 19, 16];
const PDF_MUTED = [110, 122, 112];

function docNumber(prefix, dateStr, id) {
  const d = (dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  return `${prefix}-${d}-${String(id).slice(-4)}`;
}

function pdfHeader(doc, title, numero, dateStr, agency) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF_NAVY);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setFillColor(...PDF_GOLD);
  doc.rect(0, 38, pageW, 1.5, "F");

  try { doc.addImage(LOGO_BASE64, "PNG", 15, 8, 22, 22); } catch (e) { /* ignore if image fails to load */ }
  const textX = 42;

  doc.setTextColor(...PDF_GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(agency.name || "KBS DIGITAL AGENCY", textX, 16);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Stratégie, Ventes & Production digitale", textX, 22.5);
  const contactLine = [agency.phone1, agency.phone2].filter(Boolean).join("  /  ") + (agency.email ? `   •   ${agency.email}` : "");
  doc.text(contactLine, textX, 28);
  if (agency.address) doc.text(agency.address, textX, 33);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, pageW - 15, 17, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`N° ${numero}`, pageW - 15, 24, { align: "right" });
  doc.text(`Date : ${dateStr}`, pageW - 15, 30, { align: "right" });

  return 52; // y position to continue below header
}

function pdfFooter(doc, agency, message) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_MUTED);
  const lines = doc.splitTextToSize(message, pageW - 30);
  doc.text(lines, 15, 255);

  doc.setDrawColor(...PDF_GOLD);
  doc.setLineWidth(0.5);
  doc.line(15, 278, pageW - 15, 278);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_MUTED);
  const contactLine = [agency.name, agency.phone1, agency.phone2, agency.email].filter(Boolean).join("  —  ");
  doc.text(contactLine, pageW / 2, 285, { align: "center" });
}

function generateReceiptPDF(p, agency) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const dateStr = p.dateInscription || new Date().toISOString().slice(0, 10);
  const numero = docNumber("REC", dateStr, p.id);
  let y = pdfHeader(doc, "REÇU DE PAIEMENT", numero, dateStr, agency);

  doc.setTextColor(...PDF_NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Client", 15, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`${p.prenom || ""} ${p.nom || ""}`.trim(), 15, y); y += 5.5;
  if (p.whatsapp) { doc.text(`WhatsApp : ${p.whatsapp}`, 15, y); y += 5.5; }
  if (p.email) { doc.text(`Email : ${p.email}`, 15, y); y += 5.5; }
  const adr = [p.adresse, p.quartier].filter(Boolean).join(", ");
  if (adr) { doc.text(`Adresse : ${adr}`, 15, y); y += 5.5; }

  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Service / Prestation", "Montant payé"]],
    body: [[p.pack || "—", fcfa(p.montant)]],
    theme: "grid",
    headStyles: { fillColor: PDF_NAVY, textColor: PDF_GOLD, fontStyle: "bold", fontSize: 10.5 },
    styles: { fontSize: 10.5, cellPadding: 4, textColor: PDF_NAVY },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
  });

  let y2 = doc.lastAutoTable.finalY + 10;
  doc.setFillColor(244, 240, 228);
  doc.rect(15, y2, pageW - 30, 16, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_NAVY);
  doc.text("Total payé", 20, y2 + 10.5);
  doc.setTextColor(140, 105, 10);
  doc.text(fcfa(p.montant), pageW - 20, y2 + 10.5, { align: "right" });

  pdfFooter(doc, agency, "Merci pour votre confiance. Ce reçu atteste du paiement reçu par notre agence pour le service mentionné ci-dessus. Conservez-le comme preuve de paiement.");
  doc.save(`${numero}_${(p.nom || "recu").replace(/\s+/g, "_")}.pdf`);
}

function generateDevisPDF(dv, agency) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const dateStr = dv.date || new Date().toISOString().slice(0, 10);
  const numero = docNumber("DEV", dateStr, dv.id);
  let y = pdfHeader(doc, "DEVIS", numero, dateStr, agency);

  doc.setTextColor(...PDF_NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Destinataire", 15, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(dv.clientNom || "—", 15, y); y += 5.5;
  if (dv.whatsapp) { doc.text(`WhatsApp : ${dv.whatsapp}`, 15, y); y += 5.5; }
  if (dv.validite) { doc.text(`Devis valable jusqu'au : ${dv.validite}`, 15, y); y += 5.5; }

  y += 4;
  const items = (dv.items && dv.items.length ? dv.items : [{ label: "—", qte: 1, prix: 0 }]);
  const total = items.reduce((s, it) => s + (Number(it.qte) || 1) * (Number(it.prix) || 0), 0);
  autoTable(doc, {
    startY: y,
    head: [["Prestation", "Qté", "Prix unitaire", "Sous-total"]],
    body: items.map(it => [it.label || "—", String(it.qte || 1), fcfa(it.prix), fcfa((Number(it.qte) || 1) * (Number(it.prix) || 0))]),
    theme: "grid",
    headStyles: { fillColor: PDF_NAVY, textColor: PDF_GOLD, fontStyle: "bold", fontSize: 10 },
    styles: { fontSize: 10, cellPadding: 3.5, textColor: PDF_NAVY },
    columnStyles: { 1: { halign: "center", cellWidth: 18 }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" } },
  });

  let y2 = doc.lastAutoTable.finalY + 10;
  doc.setFillColor(244, 240, 228);
  doc.rect(15, y2, pageW - 30, 16, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_NAVY);
  doc.text("Montant total du devis", 20, y2 + 10.5);
  doc.setTextColor(140, 105, 10);
  doc.text(fcfa(total), pageW - 20, y2 + 10.5, { align: "right" });
  y2 += 24;

  if (dv.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_MUTED);
    const noteLines = doc.splitTextToSize(`Notes : ${dv.notes}`, pageW - 30);
    doc.text(noteLines, 15, y2);
  }

  pdfFooter(doc, agency, "Ce devis est une proposition commerciale non contractuelle, valable jusqu'à la date indiquée ci-dessus. Il devient définitif après acceptation écrite et versement de l'acompte convenu.");
  doc.save(`${numero}_${(dv.clientNom || "devis").replace(/\s+/g, "_")}.pdf`);
}

function generateProspectionPDF(agency) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 15;
  const contentW = pageW - marginX * 2;
  const dateStr = new Date().toISOString().slice(0, 10);
  let y = 0;
  let pageNum = 0;

  function startPage(title) {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    y = pdfHeader(doc, title, `TERRAIN-${dateStr.replace(/-/g, "")}`, dateStr, agency);
  }
  function ensure(space) {
    if (y + space > pageH - 20) startPage("GUIDE DE PROSPECTION TERRAIN (suite)");
  }
  function sectionTitle(text) {
    ensure(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...PDF_NAVY);
    doc.text(text, marginX, y);
    y += 7;
  }
  function label(text, color) {
    ensure(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...(color || PDF_GOLD));
    doc.text(text.toUpperCase(), marginX, y);
    y += 4.5;
  }
  function body(text, opts) {
    opts = opts || {};
    doc.setFont("helvetica", opts.italic ? "italic" : "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...(opts.color || [40, 40, 40]));
    const lines = doc.splitTextToSize(text, contentW);
    ensure(lines.length * 4.3 + 2);
    doc.text(lines, marginX, y);
    y += lines.length * 4.3 + 3;
  }

  startPage("GUIDE DE PROSPECTION TERRAIN");
  sectionTitle("Méthode universelle en 7 étapes");
  METHODE_TERRAIN.forEach((m, i) => {
    ensure(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...PDF_NAVY);
    const titleLines = doc.splitTextToSize(`${i + 1}. ${m.titre}`, contentW);
    doc.text(titleLines, marginX, y);
    y += titleLines.length * 5 + 1;
    m.points.forEach(p => body(`•  ${p}`));
    y += 2;
  });

  Object.entries(PROSPECTION_GUIDE).forEach(([categorie, services]) => {
    startPage(categorie.toUpperCase());
    services.forEach(s => {
      ensure(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...PDF_NAVY);
      doc.text(s.name, marginX, y);
      y += 6;
      label("Cible idéale"); body(s.cible);
      label("Portefeuille à montrer"); body(s.portfolio);
      label("Accroche"); body(`"${s.accroche}"`, { italic: true, color: [140, 105, 10] });
      label("Objection fréquente", PDF_MUTED); body(s.objection, { color: [150, 60, 50] });
      label("Réponse"); body(s.reponse);
      if (s.script) {
        label("Script complet — du début à la fin");
        s.script.forEach((step, i) => body(`${i + 1}. ${step}`));
      }
      ensure(6);
      doc.setDrawColor(220, 215, 200);
      doc.line(marginX, y, pageW - marginX, y);
      y += 6;
    });
  });

  doc.save("Guide_Prospection_Terrain_KBS.pdf");
}

const ACADEMIE = [
  { name: "Meta Blueprint", url: "https://www.facebook.com/business/learn", desc: "Cours officiels Meta sur la publicité Facebook et Instagram.", certif: "Certification Meta disponible (cours gratuits, certains examens payants)." },
  { name: "TikTok Academy", url: "https://www.tiktok.com/business/en/tiktok-academy", desc: "Formations officielles TikTok for Business sur le contenu et la publicité.", certif: "Badges de complétion gratuits." },
  { name: "Google Ateliers Numériques (Digital Garage)", url: "https://learndigital.withgoogle.com/digitalgarage", desc: "Fondamentaux du marketing digital par Google.", certif: "Certificat gratuit reconnu à la fin du cours." },
  { name: "HubSpot Academy", url: "https://academy.hubspot.com", desc: "Cours sur la vente, l'inbound marketing et le service client.", certif: "Certifications gratuites téléchargeables." },
  { name: "Semrush Academy", url: "https://www.semrush.com/academy", desc: "Formations sur le SEO, la publicité et le content marketing.", certif: "Certificats gratuits après examen." },
  { name: "Canva Design School", url: "https://www.canva.com/designschool", desc: "Bases du design graphique pour les réseaux sociaux.", certif: "Cours gratuits, sans certificat formel." },
  { name: "Shopify Learn", url: "https://www.shopify.com/learn", desc: "Formations e-commerce : lancer et gérer une boutique en ligne.", certif: "Cours gratuits, sans certificat officiel." },
  { name: "Alison", url: "https://alison.com", desc: "Large catalogue de cours gratuits en marketing digital et entrepreneuriat.", certif: "Certificat digital gratuit (version imprimée payante)." },
];

/* ---------------------------------- STORAGE HELPERS (SUPABASE) ---------------------------------- */
async function loadShared(key, fallback) {
  try {
    const { data, error } = await supabase.from("kbs_storage").select("value").eq("key", key).maybeSingle();
    if (error || !data) return fallback;
    return data.value;
  } catch { return fallback; }
}
// Renvoie null si tout va bien, sinon un message d'erreur lisible.
// Avant, les echecs etaient avales en silence : l'app affichait "Enregistre"
// alors que rien n'etait ecrit dans la base.
async function saveShared(key, value) {
  try {
    const { error } = await supabase.from("kbs_storage").upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) return error.message || "Erreur d'enregistrement";
    return null;
  } catch (e) {
    return (e && e.message) ? e.message : "Connexion impossible";
  }
}

/* ---------------------------------- DIAGNOSTICS IA (stockage kbs_storage) ---------------------------------- */
// Chaque diagnostic vit sous sa propre cle "diagnostic:{clientId}" pour isoler
// les ecritures (l'app ET la fonction Edge ecrivent la meme ligne, mais jamais
// en meme temps grace au verrou de statut). Cela evite d'ecraser le resultat
// genere en arriere-plan par la fonction.
function diagKey(clientId) { return `diagnostic:${clientId}`; }

async function loadDiagnostic(clientId) {
  return loadShared(diagKey(clientId), null);
}
async function saveDiagnostic(clientId, value) {
  return saveShared(diagKey(clientId), value);
}
// Charge tous les diagnostics (pour l'onglet Administration).
async function loadAllDiagnostics() {
  try {
    const { data, error } = await supabase.from("kbs_storage").select("key,value").like("key", "diagnostic:%");
    if (error || !data) return [];
    return data.map(r => r.value).filter(Boolean);
  } catch { return []; }
}

function emptyDiagnosticForm(prospect) {
  return {
    // Identite (pre-remplie depuis la fiche client existante)
    nom: prospect?.nom || "",
    prenom: prospect?.prenom || "",
    whatsapp: prospect?.whatsapp || "",
    quartierVille: prospect?.quartier || "",
    marque: "",
    // Business
    niche: "",
    descriptionBusiness: "",
    catalogue: "",
    panierMoyen: "",
    budgetPubActuel: "",
    // Presence digitale
    tiktok: "",
    facebook: "",
    instagram: "",
    abonnes: "",
    dejaVenduEnLigne: "non",
    detailsVentes: "",
    derniereActivite: "",
    // Diagnostic
    cibleActuelle: "",
    problemePercu: "",
    objectifs30j: "",
    objectifsLongTerme: "",
    concurrentsConnus: "",
    // Photos (dataURL base64)
    photoClient: "",
    photoPage: "",
    // Notes internes KBS (jamais exportees au client)
    noteCommercial: "",
    budgetReelEstime: "",
    niveauUrgence: "Moyen",
  };
}

// Le formulaire est considere "complet" quand l'essentiel pour lancer une
// recherche Ide qualite est renseigne (niche + description + objectifs).
function diagnosticFormComplete(f) {
  if (!f) return false;
  return Boolean((f.niche || "").trim() && (f.descriptionBusiness || "").trim() && (f.problemePercu || "").trim() && (f.objectifs30j || "").trim());
}

/* ---------------------------------- UI PRIMITIVES ---------------------------------- */
function Card({ children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, ...style }}>
      {children}
    </div>
  );
}
function Eyebrow({ children }) {
  return <div style={{ color: C.gold, fontSize: 11, letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{children}</div>;
}
function H2({ children, style }) {
  return <h2 style={{ fontFamily: "Baloo 2, sans-serif", fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 12px", ...style }}>{children}</h2>;
}
function fcfa(n) { return `${Number(n || 0).toLocaleString("fr-FR")} FCFA`; }

/* --- Commissions : taux officiel global + taux individuel par membre --- */
const DEFAULT_COMMISSION_RATE = 10; // Taux officiel (%), modifiable par le CEO
// Taux applique a un client selon la personne qui le suit (owner).
// Si le membre a un taux perso, on l'utilise ; sinon on retombe sur le taux officiel.
function memberRate(team, ownerId, fallback) {
  const m = (team || []).find(x => x.id === ownerId);
  const v = m && m.commissionPct != null && m.commissionPct !== "" ? Number(m.commissionPct) : fallback;
  return Number.isFinite(v) ? v : fallback;
}
// Commission d'un client = montant paye * taux de la personne qui le suit.
function commissionOf(prospect, team, fallback) {
  return (Number(prospect.montant) || 0) * (memberRate(team, prospect.owner, fallback) / 100);
}
// Somme des commissions de tous les clients.
function totalCommissionOf(prospects, team, fallback) {
  return (prospects || []).reduce((s, p) => s + commissionOf(p, team, fallback), 0);
}

/* Champ de code masque par defaut (points), revelable via l'icone oeil. */
function CodeInput({ value, onChange, placeholder, style }) {
  const [shown, setShown] = useState(false);
  return (
    <div style={{ position: "relative", ...style }}>
      <input
        type={shown ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: 40, fontWeight: 700, letterSpacing: shown ? 0.5 : 2 }} />
      <button
        type="button"
        aria-label={shown ? "Masquer le code" : "Afficher le code"}
        onClick={(e) => { e.preventDefault(); setShown(s => !s); }}
        style={{
          position: "absolute", right: 5, top: "50%", marginTop: -13, width: 28, height: 26,
          background: "none", border: "none", color: shown ? C.goldLight : C.muted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
        }}>
        {shown ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function MiniUnlock({ code, label, onUnlock, strict }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  function tryUnlock() {
    const ok = strict ? codeMatchesStrict(input, code) : codeMatches(input, code);
    if (ok) onUnlock(); else setError(true);
  }
  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}><Lock size={11} /> {label}</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input type="password" placeholder="Code" value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => { if (e.key === "Enter") tryUnlock(); }}
          style={{ ...inputStyle, width: 100, padding: "6px 8px", fontSize: 12 }} />
        <button onClick={tryUnlock} style={{ ...iconBtn, padding: "6px 10px" }}>OK</button>
      </div>
      {error && <div style={{ color: C.rustLight, fontSize: 10 }}>Code incorrect.</div>}
    </div>
  );
}

/* Rangee horizontale defilante avec fleches cliquables.
   Les fleches garantissent le defilement meme si le glissement tactile
   ne fonctionne pas sur l'appareil. */
function ScrollRow({ children, gap = 8, padding = "12px 12px 8px", bg }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function update() {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const t = setTimeout(update, 120);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      clearTimeout(t);
    };
  }, [children]);

  function nudge(dir) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(140, el.clientWidth * 0.6), behavior: "smooth" });
  }

  const arrow = (side) => ({
    position: "absolute", top: "50%", marginTop: -16, [side]: 4,
    width: 32, height: 32, borderRadius: 999, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: C.card, border: `1px solid ${C.gold}`, color: C.goldLight,
    boxShadow: "0 2px 10px rgba(0,0,0,0.45)", zIndex: 3, padding: 0,
  });

  return (
    <div style={{ position: "relative", background: bg || C.cardAlt }}>
      <div ref={ref} className="kbs-navbar" style={{ display: "flex", gap, padding, overflowX: "auto", scrollSnapType: "x proximity" }}>
        {children}
      </div>
      {canLeft && (
        <button aria-label="Précédent" onClick={() => nudge(-1)} style={arrow("left")}><ChevronLeft size={18} /></button>
      )}
      {canRight && (
        <button aria-label="Suivant" onClick={() => nudge(1)} style={arrow("right")}><ChevronRight size={18} /></button>
      )}
    </div>
  );
}

function NotificationBanner() {
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
  const [status, setStatus] = useState(supported ? Notification.permission : "unsupported");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function enable() {
    setBusy(true);
    setError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      setStatus(permission);
      if (permission !== "granted") { setBusy(false); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const subJson = sub.toJSON();
      const existing = await loadShared("kbs:pushSubscriptions", []);
      if (!existing.find(s => s.endpoint === subJson.endpoint)) {
        await saveShared("kbs:pushSubscriptions", [...existing, { ...subJson, addedAt: new Date().toISOString() }]);
      }
    } catch (e) {
      setError("Impossible d'activer les notifications sur cet appareil.");
    }
    setBusy(false);
  }

  if (!supported || status === "granted") return null;

  return (
    <div style={{ background: "rgba(193,95,60,0.14)", borderBottom: `1px solid ${C.border}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ fontSize: 12.5, color: C.text, display: "flex", alignItems: "center", gap: 6 }}><Bell size={14} color={C.goldLight} /> Active les notifications pour être averti en temps réel de ce qui se passe dans l'équipe.</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={enable} disabled={busy} style={{ ...btnGold, width: "auto", padding: "7px 14px", fontSize: 12 }}>{busy ? "..." : "Activer"}</button>
        {error && <span style={{ fontSize: 11, color: C.rustLight }}>{error}</span>}
      </div>
    </div>
  );
}

/* ---------------------------------- MAIN APP ---------------------------------- */
export default function App() {
  const [category, setCategory] = useState("pilotage");
  const [tab, setTab] = useState("objectif");
  const [loaded, setLoaded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const [team, setTeam] = useState(DEFAULT_TEAM);
  const [goal, setGoal] = useState(250000);
  const [prospects, setProspects] = useState([]);
  const [kanban, setKanban] = useState({ todo: [], doing: [], review: [], done: [] });
  const [checks, setChecks] = useState({ ceo: [], catherine: [], sacko: [] });
  const [links, setLinks] = useState([]);
  const [caisse, setCaisse] = useState({ ops: [], debts: [] });
  const [expenses, setExpenses] = useState([]);
  const [dettes, setDettes] = useState([]);
  const [prospection, setProspection] = useState([]);
  const [dispos, setDispos] = useState({});
  const [codes, setCodes] = useState(DEFAULT_CODES);
  const [agency, setAgency] = useState(DEFAULT_AGENCY);
  const [devis, setDevis] = useState([]);
  const [guides, setGuides] = useState(DEFAULT_GUIDES);
  const [formationLiens, setFormationLiens] = useState({});
  const [ressourcesUnlocked, setRessourcesUnlocked] = useState(false);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE); // Taux officiel (%)
  const [archives, setArchives] = useState([]);   // Historique fige, un element par mois cloture
  const [period, setPeriod] = useState("");        // Mois en cours "AAAA-MM"
  // Notifications non-lues par onglet (comme WhatsApp). Propre a l'appareil -> localStorage.
  const [unread, setUnread] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kbs:unread") || "{}"); } catch (e) { return {}; }
  });
  const tabRef = useRef(tab);
  useEffect(() => { tabRef.current = tab; }, [tab]);

  useEffect(() => {
    (async () => {
      // Filet de securite : tout membre enregistre sans code personnel en recoit un
      // automatiquement, sinon sa checklist et sa Formation resteraient inaccessibles.
      const loadedRate = await loadShared("kbs:commissionRate", DEFAULT_COMMISSION_RATE);
      const rate = Number.isFinite(Number(loadedRate)) ? Number(loadedRate) : DEFAULT_COMMISSION_RATE;
      setCommissionRate(rate);
      const loadedTeam = await loadShared("kbs:team", DEFAULT_TEAM);
      // Filet de securite code perso + taux de commission perso par defaut (taux officiel).
      setTeam((loadedTeam || []).map(m => ({
        ...m,
        code: m.code || autoCode(m.name),
        commissionPct: m.commissionPct != null && m.commissionPct !== "" ? m.commissionPct : rate,
      })));
      setGoal(await loadShared("kbs:goal", 250000));
      setProspects(await loadShared("kbs:prospects", []));
      setKanban(await loadShared("kbs:kanban", { todo: [], doing: [], review: [], done: [] }));
      setChecks(await loadShared("kbs:checks", { ceo: [], catherine: [], sacko: [] }));
      setLinks(await loadShared("kbs:links", []));
      setCaisse(await loadShared("kbs:caisse", { ops: [], debts: [] }));
      setExpenses(await loadShared("kbs:expenses", []));
      setDettes(await loadShared("kbs:dettes", []));
      setProspection(await loadShared("kbs:prospection", []));
      setDispos(await loadShared("kbs:dispos", {}));
      setCodes({ ...DEFAULT_CODES, ...(await loadShared("kbs:codes", DEFAULT_CODES)) });
      setAgency(await loadShared("kbs:agency", DEFAULT_AGENCY));
      setDevis(await loadShared("kbs:devis", []));
      setGuides(await loadShared("kbs:guides", DEFAULT_GUIDES));
      setFormationLiens(await loadShared("kbs:formationLiens", {}));
      setPricing({ ...DEFAULT_PRICING, ...(await loadShared("kbs:pricing", DEFAULT_PRICING)) });
      setArchives(await loadShared("kbs:archives", []));
      setPeriod(await loadShared("kbs:period", ""));
      setLoaded(true);
    })();
  }, []);

  // Enregistrement centralise : toute panne d'ecriture devient visible a l'ecran
  // au lieu d'etre ignoree en silence.
  const [saveError, setSaveError] = useState("");
  async function persist(key, value) {
    const err = await saveShared(key, value);
    setSaveError(err ? err : "");
    return err;
  }

  useEffect(() => { if (loaded) persist("kbs:team", team); }, [team, loaded]);
  useEffect(() => { if (loaded) persist("kbs:goal", goal); }, [goal, loaded]);
  useEffect(() => { if (loaded) persist("kbs:prospects", prospects); }, [prospects, loaded]);
  useEffect(() => { if (loaded) persist("kbs:kanban", kanban); }, [kanban, loaded]);
  useEffect(() => { if (loaded) persist("kbs:checks", checks); }, [checks, loaded]);
  useEffect(() => { if (loaded) persist("kbs:links", links); }, [links, loaded]);
  useEffect(() => { if (loaded) persist("kbs:caisse", caisse); }, [caisse, loaded]);
  useEffect(() => { if (loaded) persist("kbs:expenses", expenses); }, [expenses, loaded]);
  useEffect(() => { if (loaded) persist("kbs:dettes", dettes); }, [dettes, loaded]);
  useEffect(() => { if (loaded) persist("kbs:prospection", prospection); }, [prospection, loaded]);
  useEffect(() => { if (loaded) persist("kbs:dispos", dispos); }, [dispos, loaded]);
  useEffect(() => { if (loaded) persist("kbs:codes", codes); }, [codes, loaded]);
  useEffect(() => { if (loaded) persist("kbs:agency", agency); }, [agency, loaded]);
  useEffect(() => { if (loaded) persist("kbs:devis", devis); }, [devis, loaded]);
  useEffect(() => { if (loaded) persist("kbs:guides", guides); }, [guides, loaded]);
  useEffect(() => { if (loaded) persist("kbs:formationLiens", formationLiens); }, [formationLiens, loaded]);
  useEffect(() => { if (loaded) persist("kbs:pricing", pricing); }, [pricing, loaded]);
  useEffect(() => { if (loaded) persist("kbs:commissionRate", commissionRate); }, [commissionRate, loaded]);
  useEffect(() => { if (loaded) persist("kbs:archives", archives); }, [archives, loaded]);
  useEffect(() => { if (loaded) persist("kbs:period", period); }, [period, loaded]);

  const totalCA = useMemo(() => prospects.reduce((s, p) => s + (Number(p.montant) || 0), 0), [prospects]);
  const servicesCatalogue = useMemo(() => buildServicesCatalogue(pricing), [pricing]);
  const allServicesFlat = useMemo(() => buildAllServicesFlat(pricing), [pricing]);
  const totalCommission = useMemo(() => totalCommissionOf(prospects, team, commissionRate), [prospects, team, commissionRate]);
  const totalDepenses = useMemo(() => expenses.reduce((s, e) => s + (Number(e.montant) || 0), 0), [expenses]);
  const beneficeNet = totalCA - totalCommission - totalDepenses;
  const pct = Math.min(100, Math.round((totalCA / (goal || 1)) * 100));

  // ------- Archives mensuelles -------
  const currentMonth = () => new Date().toISOString().slice(0, 7); // "AAAA-MM"

  // Photographie figee du mois : clients & CA, tresorerie & depenses, dettes, objectif atteint.
  function buildSnapshot(periodLabel) {
    const byMember = team.map(m => {
      const mine = prospects.filter(p => p.owner === m.id);
      const ca = mine.reduce((s, p) => s + (Number(p.montant) || 0), 0);
      const rate = memberRate(team, m.id, commissionRate);
      return { id: m.id, name: m.name, color: m.color, rate, ca, commission: ca * rate / 100, clients: mine.length };
    });
    return {
      id: `${periodLabel}-${Date.now()}`,
      period: periodLabel,
      closedAt: new Date().toISOString(),
      goal, commissionRate,
      totalCA, totalCommission, totalDepenses, beneficeNet,
      pctObjectif: Math.min(100, Math.round((totalCA / (goal || 1)) * 100)),
      clients: prospects, expenses, dettes, byMember,
    };
  }

  // Archive le mois indique (sans rien effacer). Ne fait rien s'il n'y a aucune donnee.
  // On empile les archives (jamais d'ecrasement) mais on ignore un instantane identique
  // deja present (protege contre un double-appel, ex. React StrictMode en developpement).
  function archiveMonth(periodLabel) {
    const label = periodLabel || period || currentMonth();
    if (!(prospects.length || expenses.length || dettes.length)) return;
    const snap = buildSnapshot(label);
    setArchives(prev => {
      const exists = (prev || []).some(a =>
        a.period === label && a.totalCA === snap.totalCA &&
        (a.clients || []).length === snap.clients.length &&
        (a.expenses || []).length === snap.expenses.length &&
        (a.dettes || []).length === snap.dettes.length);
      if (exists) return prev;
      return [...(prev || []), snap].sort((a, b) => a.period.localeCompare(b.period));
    });
  }

  // Bascule automatique de mois : on archive le mois ecoule puis on remet les compteurs a zero.
  useEffect(() => {
    if (!loaded) return;
    const now = currentMonth();
    if (!period) { setPeriod(now); return; }   // Tout premier lancement : on marque le mois courant.
    if (period === now) return;                  // Toujours le meme mois : rien a faire.
    archiveMonth(period);                        // Nouveau mois -> on fige le mois precedent...
    setProspects([]);                            // ...puis on repart a zero pour le CA/commissions,
    setExpenses([]);                             //    la tresorerie/depenses
    setDettes([]);                               //    et les dettes.
    setPeriod(now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, period]);

  // --- Notifications non-lues (pastilles + pastille systeme facon WhatsApp) ---
  useEffect(() => {
    try { localStorage.setItem("kbs:unread", JSON.stringify(unread)); } catch (e) {}
    const total = Object.values(unread).reduce((s, n) => s + (Number(n) || 0), 0);
    setAppBadge(total);
  }, [unread]);

  // Notification recue alors que l'appli est ouverte -> son interne + pastille d'onglet.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function onMsg(e) {
      const d = e.data || {};
      if (d.type !== "kbs-push") return;
      const url = d.url || "";
      const tid = d.tabId || (url.includes("#") ? url.split("#")[1] : "") || "general";
      playChime();
      const onThisTab = document.visibilityState === "visible" && tabRef.current === tid;
      if (!onThisTab) setUnread(u => ({ ...u, [tid]: (u[tid] || 0) + 1 }));
    }
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  // Ouvrir un onglet efface ses non-lus.
  useEffect(() => {
    if (!unlocked) return;
    setUnread(u => (u[tab] ? { ...u, [tab]: 0 } : u));
  }, [tab, unlocked]);

  function resetAllData() {
    archiveMonth(period || currentMonth()); // On garde une trace avant d'effacer.
    setProspects([]);
    setKanban({ todo: [], doing: [], review: [], done: [] });
    setChecks({});
    setLinks([]);
    setCaisse({ ops: [], debts: [] });
    setExpenses([]);
    setDettes([]);
    setProspection([]);
    setDispos({});
    setDevis([]);
    setGoal(250000);
    setPeriod(currentMonth());
  }

  // Cloture manuelle d'un mois (CEO) : archive les chiffres actuels sous le mois choisi
  // (ex. "2026-08" pour Aout) puis remet a zero les compteurs du mois. Ne touche ni a
  // l'equipe, ni aux tarifs, ni au Kanban : seulement CA/clients, tresorerie, dettes.
  function closeMonthManually(monthLabel) {
    const label = monthLabel || period || currentMonth();
    archiveMonth(label);
    setProspects([]);
    setExpenses([]);
    setDettes([]);
    setPeriod(currentMonth());
  }

  const TAB_META = {
    objectif: { label: "Objectif", icon: Target },
    dispos: { label: "Planning", icon: CalendarCheck },
    kanban: { label: "Kanban", icon: LayoutGrid },
    crm: { label: "CRM & Clients", icon: Users },
    devis: { label: "Devis", icon: FileText },
    tresorerie: { label: "Trésorerie", icon: Banknote },
    dettes: { label: "Dettes & Rappels", icon: AlertTriangle },
    tarifs: { label: "Tarifs", icon: Wallet },
    cible: { label: "Cible", icon: MessageSquare },
    copywriting: { label: "Laboratoire Copywriting", icon: Flame },
    prospection: { label: "Prospection Réseaux", icon: Radar },
    terrain: { label: "Prospection Terrain", icon: MapPin },
    outils: { label: "Boîte à outils IA", icon: Sparkles },
    academie: { label: "Académie Gratuite", icon: GraduationCap },
    plan: { label: "Plan 30 jours", icon: CalendarDays },
    liens: { label: "Liens partagés", icon: Link2 },
    adminEquipe: { label: "Équipe", icon: Users },
    adminDiagnostics: { label: "Diagnostics IA", icon: Sparkles },
    adminCodes: { label: "Codes d'accès", icon: KeyRound },
    adminAgence: { label: "Agence", icon: MapPin },
    adminTarifs: { label: "Tarifs", icon: Banknote },
    adminFormation: { label: "Formation", icon: BookOpen },
    adminCaisse: { label: "Caisse Perso", icon: Wallet },
    adminReset: { label: "Réinitialisation", icon: AlertTriangle },
    formation: { label: "Formation", icon: BookOpen },
    archives: { label: "Archives", icon: Archive },
  };

  const CATEGORIES = [
    { id: "pilotage", label: "Pilotage", icon: Target, tabs: ["objectif", "dispos", "kanban"] },
    { id: "ventes", label: "Ventes & Finance", icon: Wallet, tabs: ["crm", "devis", "tresorerie", "dettes", "tarifs", "archives"] },
    { id: "marketing", label: "Marketing", icon: Flame, tabs: ["cible", "copywriting", "prospection", "terrain"] },
    { id: "ressources", label: "Ressources", icon: Sparkles, tabs: ["outils", "academie", "plan", "liens", "formation"] },
    { id: "admin", label: "Administration", icon: Shield, tabs: ["adminEquipe", "adminDiagnostics", "adminCodes", "adminAgence", "adminTarifs", "adminFormation", "adminCaisse", "adminReset"] },
  ];

  function selectCategory(catId) {
    setCategory(catId);
    const cat = CATEGORIES.find(c => c.id === catId);
    setTab(cat.tabs[0]);
  }

  // Ouvre directement le bon onglet quand l'appli est lancée depuis une notification (#tabId)
  useEffect(() => {
    if (!loaded || !unlocked) return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const cat = CATEGORIES.find(c => c.tabs.includes(hash));
    if (cat) { setCategory(cat.id); setTab(hash); }
  }, [loaded, unlocked]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Nunito, sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {!loaded ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>Chargement…</div>
      ) : !unlocked ? (
        <LoginScreen onUnlock={() => setUnlocked(true)} codes={codes} />
      ) : (
      <div className="kbs-shell" style={{ maxWidth: 1100, margin: "0 auto", minHeight: "100vh", borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, background: C.bg }}>
      {/* HEADER */}
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={`data:image/png;base64,${LOGO_B64}`} alt="KBSAUTO" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 800, fontSize: 22, color: C.gold }}>KBSAUTO</span>
            </div>
          </div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 2, marginLeft: 44 }}>KBS Digital Agency — QG de l'équipe</div>
        </div>
        <button onClick={() => setUnlocked(false)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, padding: "6px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
          <LogOut size={13} /> Déconnexion
        </button>
      </div>

      <NotificationBanner />

      {saveError && (
        <div style={{ background: "rgba(183,64,47,0.18)", borderBottom: `1px solid ${C.rust}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={15} color={C.rustLight} />
          <div style={{ fontSize: 12, color: C.rustLight, flex: 1 }}>
            Enregistrement échoué — tes modifications ne sont pas sauvegardées. ({saveError})
          </div>
          <button onClick={() => setSaveError("")} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* CATEGORY BAR — rangee defilante avec fleches cliquables */}
      <ScrollRow gap={10} padding="12px 12px 8px">
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          const active = category === c.id;
          const catCount = c.tabs.reduce((s, t) => s + (unread[t] || 0), 0);
          return (
            <div key={c.id} onClick={() => selectCategory(c.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              flexShrink: 0, width: 74, cursor: "pointer", scrollSnapAlign: "start",
            }}>
              <div style={{
                position: "relative",
                width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? `linear-gradient(135deg, ${C.goldLight}, ${C.gold})` : C.card,
                border: `1px solid ${active ? C.gold : C.border}`,
                boxShadow: active ? `0 4px 14px rgba(193,95,60,0.45)` : "none",
                transition: "all .18s ease",
              }}>
                <Icon size={19} color={active ? "#FFFFFF" : C.muted} />
                {catCount > 0 && <NotifDot count={catCount} />}
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, textAlign: "center", lineHeight: 1.2, color: active ? C.goldLight : C.muted }}>{c.label}</span>
            </div>
          );
        })}
      </ScrollRow>

      {/* SUB-TAB BAR — tous les sous-onglets visibles d'un coup (retour a la ligne) */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "6px 12px 12px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {CATEGORIES.find(c => c.id === category).tabs.map(tid => {
            const meta = TAB_META[tid];
            const Icon = meta.icon;
            const active = tab === tid;
            const tabCount = unread[tid] || 0;
            return (
              <div key={tid} onClick={() => setTab(tid)} style={{
                position: "relative",
                display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer",
                padding: "8px 12px", borderRadius: 999,
                border: `1px solid ${active ? C.gold : (tabCount > 0 ? C.rust : C.border)}`,
                background: active ? "rgba(193,95,60,0.16)" : C.card,
                transition: "all .18s ease",
              }}>
                <Icon size={15} color={active ? C.goldLight : C.muted} />
                <span style={{ fontSize: 12, fontWeight: 700, textAlign: "center", lineHeight: 1.2, color: active ? C.goldLight : C.muted }}>{meta.label}</span>
                {tabCount > 0 && <NotifDot count={tabCount} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="kbs-content" style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
        {tab === "objectif" && <TabObjectif goal={goal} setGoal={setGoal} totalCA={totalCA} totalCommission={totalCommission} pct={pct} prospects={prospects} team={team} codes={codes} commissionRate={commissionRate} />}
        {tab === "dispos" && <TabDispos dispos={dispos} setDispos={setDispos} team={team} />}
        {tab === "kanban" && <TabKanban kanban={kanban} setKanban={setKanban} checks={checks} setChecks={setChecks} team={team} codes={codes} />}
        {tab === "crm" && <TabCRM prospects={prospects} setProspects={setProspects} totalCA={totalCA} totalCommission={totalCommission} team={team} codes={codes} agency={agency} pricing={pricing} servicesCatalogue={servicesCatalogue} commissionRate={commissionRate} />}
        {tab === "devis" && <TabDevis devis={devis} setDevis={setDevis} prospects={prospects} team={team} agency={agency} />}
        {tab === "tresorerie" && <TabTresorerie prospects={prospects} setProspects={setProspects} expenses={expenses} setExpenses={setExpenses} totalCA={totalCA} totalCommission={totalCommission} totalDepenses={totalDepenses} beneficeNet={beneficeNet} team={team} codes={codes} commissionRate={commissionRate} />}
        {tab === "dettes" && <TabDettes dettes={dettes} setDettes={setDettes} prospects={prospects} />}
        {tab === "tarifs" && <TabTarifs pricing={pricing} />}
        {tab === "archives" && <TabArchives archives={archives} period={period} team={team} />}
        {tab === "cible" && <TabCible />}
        {tab === "copywriting" && <TabCopywriting />}
        {tab === "prospection" && <TabProspection prospection={prospection} setProspection={setProspection} prospects={prospects} setProspects={setProspects} team={team} pricing={pricing} allServicesFlat={allServicesFlat} />}
        {tab === "terrain" && <TabProspectionTerrain agency={agency} />}
        {category === "ressources" && !ressourcesUnlocked ? (
          <Card style={{ textAlign: "center" }}>
            <MiniUnlock code={codes.ressources} label="Section Ressources — entre le code d'accès" onUnlock={() => setRessourcesUnlocked(true)} />
          </Card>
        ) : (
          <>
            {tab === "outils" && <TabOutils />}
            {tab === "academie" && <TabAcademie />}
            {tab === "plan" && <TabPlan />}
            {tab === "liens" && <TabLiens links={links} setLinks={setLinks} team={team} />}
            {tab === "formation" && <TabFormation team={team} codes={codes} guides={guides} formationLiens={formationLiens} />}
          </>
        )}
        {category === "admin" && <TabAdministration section={tab} caisse={caisse} setCaisse={setCaisse} team={team} setTeam={setTeam} codes={codes} setCodes={setCodes} onResetAll={resetAllData} onCloseMonth={closeMonthManually} currentMonth={currentMonth()} agency={agency} setAgency={setAgency} guides={guides} setGuides={setGuides} formationLiens={formationLiens} setFormationLiens={setFormationLiens} pricing={pricing} setPricing={setPricing} commissionRate={commissionRate} setCommissionRate={setCommissionRate} />}
      </div>
      </div>
      )}
    </div>
  );
}

/* ---------------------------------- LOGIN SCREEN ---------------------------------- */
function LoginScreen({ onUnlock, codes }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);

  function tryUnlock() {
    if (codeMatches(pwd, codes.app)) { setError(false); onUnlock(); }
    else { setError(true); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <img src={`data:image/png;base64,${LOGO_B64}`} alt="KBSAUTO" style={{ width: 76, height: 76, borderRadius: 18, marginBottom: 16, boxShadow: `0 0 0 1px ${C.border}` }} />
      <div style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 2 }}>KBSAUTO</div>
      <div style={{ color: C.muted, fontSize: 12.5, marginBottom: 16 }}>KBS Digital Agency</div>
      <div style={{ color: C.muted, fontSize: 13, marginBottom: 20, textAlign: "center" }}>Accès réservé à l'équipe — entre le code d'accès</div>
      <div style={{ width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="password"
          placeholder="Code d'accès"
          value={pwd}
          onChange={e => { setPwd(e.target.value); setError(false); }}
          onKeyDown={e => { if (e.key === "Enter") tryUnlock(); }}
          style={inputStyle}
          autoFocus
        />
        {error && <div style={{ color: C.rustLight, fontSize: 12 }}>Code incorrect. Demande-le au CEO.</div>}
        <button onClick={tryUnlock} style={btnGold}><Lock size={14} /> Déverrouiller</button>
      </div>
    </div>
  );
}

/* ---------------------------------- TAB: OBJECTIF ---------------------------------- */
function TabObjectif({ goal, setGoal, totalCA, totalCommission, pct, prospects, team, codes, commissionRate }) {
  const [ceoUnlocked, setCeoUnlocked] = useState(false);
  const r = 70, circ = 2 * Math.PI * r;
  const perPerson = team.map(m => {
    const ca = prospects.filter(p => p.owner === m.id).reduce((s, p) => s + (Number(p.montant) || 0), 0);
    const rate = memberRate(team, m.id, commissionRate);
    return { ...m, ca, rate, commission: ca * rate / 100 };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ textAlign: "center" }}>
        <Eyebrow>Objectif mensuel</Eyebrow>
        <div style={{ position: "relative", width: 180, height: 180, margin: "8px auto" }}>
          <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="90" cy="90" r={r} stroke={C.border} strokeWidth="14" fill="none" />
            <circle cx="90" cy="90" r={r} stroke={C.gold} strokeWidth="14" fill="none"
              strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "Baloo 2, sans-serif", fontSize: 30, fontWeight: 800, color: C.goldLight }}>{pct}%</div>
            <div style={{ fontSize: 11, color: C.muted }}>de l'objectif</div>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{fcfa(totalCA)} <span style={{ color: C.muted, fontWeight: 500 }}>/ {fcfa(goal)}</span></div>
        {ceoUnlocked ? (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 12, color: C.muted }}>Modifier l'objectif :</label>
            <input type="number" value={goal} onChange={e => setGoal(Number(e.target.value))}
              style={{ width: 110, background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "4px 8px", fontSize: 13 }} />
          </div>
        ) : (
          <MiniUnlock code={codes.ceo} label="Réservé au CEO" onUnlock={() => setCeoUnlocked(true)} />
        )}
      </Card>

      <Card>
        <Eyebrow>Commission d'équipe (taux officiel {commissionRate}%)</Eyebrow>
        <div style={{ fontFamily: "Baloo 2, sans-serif", fontSize: 24, fontWeight: 800, color: C.greenLight }}>{fcfa(totalCommission)}</div>
        <div style={{ color: C.muted, fontSize: 12.5, marginTop: 2 }}>Calculée automatiquement sur le CA encaissé, selon le pourcentage de chaque personne. Modifiable dans Administration → Équipe.</div>
      </Card>

      <Card>
        <Eyebrow>Performance par personne</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {perPerson.map(m => (
            <div key={m.id}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{m.name} <span style={{ color: C.muted, fontWeight: 500, fontSize: 11 }}>· {m.rate}%</span></span>
                <span style={{ color: C.muted }}>{fcfa(m.ca)}</span>
              </div>
              <div style={{ height: 6, background: C.cardAlt, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (m.ca / (goal || 1)) * 100)}%`, background: m.color }} />
              </div>
              {m.ca > 0 && <div style={{ fontSize: 11, color: C.greenLight, marginTop: 3 }}>Commission : {fcfa(m.commission)}</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- TAB: CRM ---------------------------------- */
function TabCRM({ prospects, setProspects, totalCA, totalCommission, team, codes, agency, pricing, servicesCatalogue, commissionRate }) {
  const [form, setForm] = useState({
    nom: "", prenom: "", whatsapp: "", email: "", adresse: "", quartier: "",
    dateInscription: new Date().toISOString().slice(0, 10),
    pack: pricing.packs[0]?.name || "", statut: "À contacter", montant: "", owner: team[0]?.id || ""
  });
  const [catherineUnlocked, setCatherineUnlocked] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [noteText, setNoteText] = useState("");

  function addProspect() {
    if (!form.nom.trim()) return;
    setProspects([...prospects, { ...form, id: Date.now(), historique: [] }]);
    notifyTeam("Nouveau client 🎉", `${form.prenom || ""} ${form.nom}`.trim() + " vient d'être ajouté au CRM.", "crm");
    setForm({ nom: "", prenom: "", whatsapp: "", email: "", adresse: "", quartier: "", dateInscription: new Date().toISOString().slice(0, 10), pack: pricing.packs[0]?.name || "", statut: "À contacter", montant: "", owner: team[0]?.id || "" });
  }
  function updateStatut(id, statut) {
    setProspects(prospects.map(p => p.id === id ? { ...p, statut } : p));
  }
  function removeProspect(id) { setProspects(prospects.filter(p => p.id !== id)); }
  function addHistorique(id) {
    if (!noteText.trim()) return;
    setProspects(prospects.map(p => p.id === id
      ? { ...p, historique: [...(p.historique || []), { id: Date.now(), date: new Date().toISOString().slice(0, 10), note: noteText }] }
      : p));
    setNoteText("");
  }
  function removeHistorique(pid, hid) {
    setProspects(prospects.map(p => p.id === pid ? { ...p, historique: (p.historique || []).filter(h => h.id !== hid) } : p));
  }

  const statuts = ["À contacter", "En discussion", "Audit envoyé", "Devis envoyé", "Payé", "Perdu"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <Eyebrow>Ajouter un client / prospect</Eyebrow>
        {catherineUnlocked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
              <input placeholder="Prénom" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <input placeholder="Numéro WhatsApp" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} />
            <input placeholder="Email (optionnel)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Adresse" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
              <input placeholder="Quartier" value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>Date d'inscription :</label>
              <input type="date" value={form.dateInscription} onChange={e => setForm({ ...form, dateInscription: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <select value={form.pack} onChange={e => setForm({ ...form, pack: e.target.value })} style={inputStyle}>
              {servicesCatalogue.map(g => (
                <optgroup key={g.groupe} label={g.groupe}>
                  {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                </optgroup>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input type="number" placeholder="Montant payé (FCFA)" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <button onClick={addProspect} style={btnGold}><Plus size={14} /> Ajouter le client</button>
          </div>
        ) : (
          <MiniUnlock code={codes.catherine} label="Réservé à Catherine" onUnlock={() => setCatherineUnlocked(true)} />
        )}
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>CA encaissé</div>
          <div style={{ fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: C.goldLight }}>{fcfa(totalCA)}</div>
        </Card>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>Commissions équipe</div>
          <div style={{ fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: C.greenLight }}>{fcfa(totalCommission)}</div>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {prospects.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Aucun client pour l'instant. Ajoute le premier ci-dessus.</div>}
        {prospects.slice().reverse().map(p => {
          const expanded = expandedId === p.id;
          return (
          <Card key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div onClick={() => setExpandedId(expanded ? null : p.id)} style={{ cursor: "pointer", flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.prenom} {p.nom}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{p.whatsapp} · {p.pack}</div>
                <div style={{ fontSize: 12, color: C.muted }}>Suivi par : {team.find(m => m.id === p.owner)?.name}</div>
                {!expanded && <div style={{ fontSize: 11, color: C.gold, marginTop: 4 }}>📄 Fiche, reçu WhatsApp & historique →</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {catherineUnlocked && <button onClick={() => removeProspect(p.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><Trash2 size={16} /></button>}
                <button onClick={() => setExpandedId(expanded ? null : p.id)} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer" }}>
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              {catherineUnlocked ? (
                <select value={p.statut} onChange={e => updateStatut(p.id, e.target.value)} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, width: "auto" }}>
                  {statuts.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: 12, color: C.muted, background: C.cardAlt, padding: "4px 8px", borderRadius: 6 }}>{p.statut}</span>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: C.goldLight }}>{fcfa(p.montant)}</div>
            </div>
            {Number(p.montant) > 0 && <div style={{ fontSize: 11, color: C.greenLight, marginTop: 4 }}>Commission ({memberRate(team, p.owner, commissionRate)}%) : {fcfa(commissionOf(p, team, commissionRate))}</div>}

            {expanded && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, marginBottom: 10 }}>
                  <div><span style={{ color: C.muted }}>Email : </span>{p.email || "—"}</div>
                  <div><span style={{ color: C.muted }}>Adresse : </span>{p.adresse || "—"}</div>
                  <div><span style={{ color: C.muted }}>Quartier : </span>{p.quartier || "—"}</div>
                  <div><span style={{ color: C.muted }}>Date d'inscription : </span>{p.dateInscription || "—"}</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <FileText size={13} color={C.gold} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 0.5 }}>Reçu</span>
                </div>
                {Number(p.montant) > 0 && p.whatsapp ? (
                  <a href={whatsappReceiptLink(p)} target="_blank" rel="noopener noreferrer"
                    style={{ ...btnGold, textDecoration: "none", marginBottom: 8 }}>
                    <Send size={13} /> Envoyer le reçu via WhatsApp
                  </a>
                ) : (
                  <div style={{ fontSize: 11.5, color: C.muted, background: C.cardAlt, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    {!p.whatsapp ? "Ajoute un numéro WhatsApp" : "Renseigne le montant payé"} pour activer l'envoi du reçu.
                  </div>
                )}
                {Number(p.montant) > 0 && (
                  <button onClick={() => generateReceiptPDF(p, agency)}
                    style={{ ...iconBtn, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", marginBottom: 12, color: C.goldLight, borderColor: C.gold }}>
                    <FileText size={14} /> Télécharger le reçu PDF (pro)
                  </button>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <History size={13} color={C.gold} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 0.5 }}>Historique</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  {(p.historique || []).length === 0 && <div style={{ fontSize: 11.5, color: C.muted }}>Aucune note enregistrée.</div>}
                  {(p.historique || []).slice().reverse().map(h => (
                    <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "start", background: C.cardAlt, borderRadius: 8, padding: 8, fontSize: 12 }}>
                      <div><span style={{ color: C.muted }}>{h.date} — </span>{h.note}</div>
                      <button onClick={() => removeHistorique(p.id, h.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer", flexShrink: 0 }}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input placeholder="Ajouter une note (ex: relance faite, RDV pris…)" value={noteText} onChange={e => setNoteText(e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
                  <button onClick={() => addHistorique(p.id)} style={{ ...iconBtn, padding: "0 12px" }}><Plus size={13} /></button>
                </div>

                <DiagnosticSection prospect={p} agency={agency} />
              </div>
            )}
          </Card>
        );})}
      </div>
    </div>
  );
}

/* ---------------------------------- DIAGNOSTIC & GUIDE IA ---------------------------------- */

// Compte les taches totales et cochees pour la barre de progression.
function guideProgress(diag) {
  const days = diag?.programJson?.days || [];
  let total = 0, done = 0;
  const cp = diag?.checklistProgress || {};
  days.forEach(d => (d.tasks || []).forEach(t => { total++; if (cp[t.id]) done++; }));
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

// Message WhatsApp pre-rempli. ATTENTION : wa.me ne peut PAS joindre un PDF
// automatiquement ; il ne pre-remplit qu'un texte. L'ajout du PDF reste manuel.
function whatsappGuideLink(prospect, diag) {
  const phone = (prospect?.whatsapp || "").replace(/[^0-9]/g, "");
  const prenom = prospect?.prenom || prospect?.nom || "";
  const pos = diag?.guideContent?.positioning || "";
  const dur = diag?.programJson?.durationDays || 30;
  const txt =
    `Bonjour ${prenom} 👋\n\n` +
    `Voici ton diagnostic personnalise realise par KBS Digital Agency, avec ton programme de ${dur} jours et ta strategie sur mesure.\n\n` +
    (pos ? `Positionnement recommande : ${pos}\n\n` : "") +
    `Le guide complet (PDF) est pret : je te l'envoie juste apres ce message.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(txt)}`;
}

// Export PDF du guide (jsPDF + autoTable, deja utilises ailleurs dans l'app).
function generateGuidePDF(diag, prospect, agency) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 15;
  let y = 18;
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - marginX * 2;

  function ensure(space) { if (y + space > pageH - 15) { doc.addPage(); y = 18; } }
  function title(t) {
    ensure(12);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(193, 95, 60);
    doc.text(t, marginX, y); y += 7;
    doc.setTextColor(30, 30, 30);
  }
  function para(label, text) {
    if (!text) return;
    ensure(10);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
    if (label) { doc.text(label, marginX, y); y += 5; }
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const lines = doc.splitTextToSize(String(text), usableW);
    lines.forEach(ln => { ensure(6); doc.text(ln, marginX, y); y += 5; });
    y += 2;
  }

  // En-tete
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(193, 95, 60);
  doc.text(agency?.name || "KBS Digital Agency", marginX, y); y += 7;
  doc.setFontSize(12); doc.setTextColor(30, 30, 30);
  doc.text("Diagnostic & Guide strategique", marginX, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(90, 90, 90);
  doc.text(`Client : ${(prospect?.prenom || "")} ${(prospect?.nom || "")}`.trim(), marginX, y); y += 5;
  doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, marginX, y); y += 9;
  doc.setTextColor(30, 30, 30);

  const g = diag?.guideContent || {};
  const p = diag?.programJson || {};

  title("Positionnement");
  para("", g.positioning);
  title("Le vrai probleme");
  para("Ce que le client percoit :", g.perceivedProblem);
  para("Le vrai probleme identifie :", g.realProblem);

  if ((g.personas || []).length) {
    title("Personas cibles");
    g.personas.forEach(per => {
      para(per.name || "Persona", per.description);
      if ((per.pains || []).length) para("Frustrations :", per.pains.join(" · "));
      if ((per.desires || []).length) para("Desirs :", per.desires.join(" · "));
    });
  }

  if ((g.angles || []).length) {
    title("Angles marketing");
    g.angles.forEach((a, i) => {
      para(`${i + 1}. ${a.title || ""}`, a.example);
      if (a.hook) para("Accroche :", a.hook);
    });
  }

  if ((p.kpis || []).length) {
    title("KPI a suivre");
    para("", p.kpis.map(k => `• ${k}`).join("\n"));
  }

  if ((p.days || []).length) {
    ensure(20);
    title(`Programme ${p.durationDays || 30} jours`);
    const rows = p.days.map(d => [
      String(d.day),
      d.theme || "",
      (d.tasks || []).map(t => `• ${t.label}`).join("\n"),
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Jour", "Theme", "Taches"]],
      body: rows,
      styles: { fontSize: 8.5, cellPadding: 2, valign: "top" },
      headStyles: { fillColor: [193, 95, 60], textColor: 255 },
      columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 40 }, 2: { cellWidth: usableW - 52 } },
      margin: { left: marginX, right: marginX },
    });
  }

  const safe = ((prospect?.nom || "client")).replace(/\s+/g, "_");
  doc.save(`Diagnostic_${safe}.pdf`);
}

// Petit uploader photo -> dataURL base64 (reutilise le pattern FileReader).
function PhotoField({ label, value, onChange }) {
  const inputRef = useRef(null);
  function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: C.muted }}>{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {value
          ? <img src={value} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover", border: `1px solid ${C.border}` }} />
          : <div style={{ width: 46, height: 46, borderRadius: 8, background: C.cardAlt, border: `1px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 18 }}>📷</div>}
        <input ref={inputRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
        <button onClick={() => inputRef.current?.click()} style={{ ...iconBtn, padding: "6px 10px" }}>{value ? "Changer" : "Ajouter"}</button>
        {value && <button onClick={() => onChange("")} style={{ ...iconBtn, padding: "6px 10px", color: C.rustLight }}>Retirer</button>}
      </div>
    </div>
  );
}

// Champ texte / textarea labellise, compact.
function DField({ label, value, onChange, area, placeholder, type }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: 11, color: C.muted }}>{label}</label>
      {area
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={area === true ? 3 : area} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        : <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />}
    </div>
  );
}

function DiagnosticSection({ prospect, agency }) {
  const clientId = String(prospect.id);
  const [open, setOpen] = useState(false);
  const [diag, setDiag] = useState(undefined); // undefined = pas encore charge
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [launching, setLaunching] = useState(false);
  const pollRef = useRef(null);

  function stopPolling() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const d = await loadDiagnostic(clientId);
      if (d) setDiag(d);
      if (d && d.status !== "generating") stopPolling();
    }, 8000);
  }
  useEffect(() => () => stopPolling(), []);

  useEffect(() => {
    if (!open || diag !== undefined) return;
    (async () => {
      const d = await loadDiagnostic(clientId);
      setDiag(d);
      setForm(d?.formData ? { ...emptyDiagnosticForm(prospect), ...d.formData } : emptyDiagnosticForm(prospect));
      if (d?.status === "generating") startPolling();
    })();
  }, [open]);

  function baseRecord(status, extra) {
    return {
      clientId,
      clientNom: `${prospect.prenom || ""} ${prospect.nom || ""}`.trim(),
      whatsapp: prospect.whatsapp || "",
      formData: form,
      status,
      checklistProgress: diag?.checklistProgress || {},
      researchData: diag?.researchData || null,
      guideContent: diag?.guideContent || null,
      programJson: diag?.programJson || null,
      generationCostEstimate: diag?.generationCostEstimate || 0,
      errorMessage: "",
      createdAt: diag?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...extra,
    };
  }

  async function saveForm() {
    setSaving(true);
    const next = baseRecord(diag?.status === "completed" ? "completed" : "draft");
    const err = await saveDiagnostic(clientId, next);
    setSaving(false);
    if (!err) { setDiag(next); setSavedMsg("Fiche enregistrée ✓"); setTimeout(() => setSavedMsg(""), 2500); }
    else { setSavedMsg("Erreur : " + err); }
  }

  async function launch() {
    if (!diagnosticFormComplete(form)) { setSavedMsg("Complète la niche, la description, le problème perçu et les objectifs 30j."); return; }
    const ok = window.confirm("Cette génération est payante, environ 1 $, et prend 1 à 3 minutes.\n\nElle lance une recherche IA sur ~50 concurrents de la niche puis génère le programme et le guide. Continuer ?");
    if (!ok) return;
    setLaunching(true);
    // On enregistre d'abord la fiche pour que la fonction lise le form_data a jour.
    const base = baseRecord("draft");
    await saveDiagnostic(clientId, base);
    // Affiche tout de suite l'ecran "Recherche en cours" pendant l'attente.
    setDiag({ ...base, status: "generating", startedAt: new Date().toISOString() });
    // Filet de securite : si la connexion tombe pendant l'attente (1 a 2 min),
    // le polling recuperera le resultat que la fonction a ecrit en base.
    startPolling();
    try {
      // La fonction genere de maniere synchrone : la reponse arrive apres 1 a 2
      // minutes et contient directement le diagnostic termine (ou l'echec).
      const res = await fetch(DIAGNOSTIC_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data && (data.status === "completed" || data.status === "failed")) {
        stopPolling();
        setDiag(data);
      } else if (res.status === 202 || data.status === "generating") {
        // Compat : ancien comportement -> on laisse le polling faire le travail.
      } else if (data && data.error) {
        stopPolling();
        setDiag({ ...base, status: "failed", errorMessage: data.error });
      }
    } catch (e) {
      // Connexion coupee pendant l'attente : on garde le polling actif, la
      // fonction a pu terminer et ecrire le resultat en base malgre tout.
    }
    setLaunching(false);
  }

  async function toggleTask(taskId) {
    const cp = { ...(diag.checklistProgress || {}) };
    cp[taskId] = !cp[taskId];
    const next = { ...diag, checklistProgress: cp, updatedAt: new Date().toISOString() };
    setDiag(next);
    await saveDiagnostic(clientId, next);
  }

  const status = diag?.status;

  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={14} color={C.gold} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 0.5 }}>Diagnostic & Guide IA</span>
          {status && <StatusPill status={status} />}
        </div>
        {open ? <ChevronDown size={15} color={C.gold} /> : <ChevronRight size={15} color={C.gold} />}
      </div>

      {open && diag === undefined && <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Chargement…</div>}

      {open && diag !== undefined && (
        <div style={{ marginTop: 10 }}>
          {status === "generating" && <DiagGenerating diag={diag} />}
          {status === "completed" && (
            <InteractiveGuide diag={diag} prospect={prospect} agency={agency} onToggle={toggleTask} onEditForm={() => setDiag({ ...diag, status: "draft" })} onRelaunch={launch} launching={launching} />
          )}
          {(status === "failed") && (
            <div style={{ background: "rgba(192,57,43,0.10)", border: `1px solid ${C.rust}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, color: C.rustLight, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> La génération a échoué</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{diag.errorMessage || "Erreur inconnue."}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6 }}>Aucun nouveau débit tant que tu ne relances pas manuellement.</div>
            </div>
          )}

          {(status === undefined || status === "draft" || status === "failed") && (
            <DiagnosticForm form={form} setForm={setForm} onSave={saveForm} onLaunch={launch} saving={saving} launching={launching} savedMsg={savedMsg} complete={diagnosticFormComplete(form)} />
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    draft: { t: "Brouillon", c: C.muted, bg: C.cardAlt },
    generating: { t: "Génération…", c: C.goldLight, bg: "rgba(193,95,60,0.14)" },
    completed: { t: "Guide prêt", c: C.greenLight, bg: "rgba(46,139,111,0.14)" },
    failed: { t: "Échec", c: C.rustLight, bg: "rgba(192,57,43,0.12)" },
  };
  const m = map[status] || map.draft;
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: m.c, background: m.bg, padding: "2px 8px", borderRadius: 20 }}>{m.t}</span>;
}

function DiagGenerating({ diag }) {
  return (
    <div style={{ background: C.cardAlt, borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 10 }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>🔎</div>
      <div style={{ fontWeight: 700, fontSize: 13, color: C.goldLight }}>Recherche en cours…</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>L'IA analyse ~50 concurrents puis rédige le programme et le guide.<br />Compte 1 à 3 minutes — l'écran se met à jour automatiquement.</div>
      <div style={{ height: 4, background: C.border, borderRadius: 4, marginTop: 12, overflow: "hidden" }}>
        <div className="kbs-hint" style={{ height: "100%", width: "40%", background: C.gold, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function DiagnosticForm({ form, setForm, onSave, onLaunch, saving, launching, savedMsg, complete }) {
  if (!form) return null;
  const set = (k) => (v) => setForm({ ...form, [k]: v });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 11.5, color: C.muted }}>Remplis la fiche puis lance le diagnostic IA. Le déclenchement est <b>manuel</b> et payant : rien ne se lance à l'enregistrement.</div>

      <FormGroup title="Identité">
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><DField label="Nom" value={form.nom} onChange={set("nom")} /></div>
          <div style={{ flex: 1 }}><DField label="Prénom" value={form.prenom} onChange={set("prenom")} /></div>
        </div>
        <DField label="Numéro WhatsApp" value={form.whatsapp} onChange={set("whatsapp")} />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><DField label="Quartier / Ville" value={form.quartierVille} onChange={set("quartierVille")} /></div>
          <div style={{ flex: 1 }}><DField label="Marque / entreprise" value={form.marque} onChange={set("marque")} placeholder="si différent du nom" /></div>
        </div>
      </FormGroup>

      <FormGroup title="Business">
        <DField label="Niche / secteur *" value={form.niche} onChange={set("niche")} placeholder="ex : cosmétique visage, vêtements enfants" />
        <DField label="Description courte du business *" value={form.descriptionBusiness} onChange={set("descriptionBusiness")} area placeholder="2-3 phrases" />
        <DField label="Catalogue produits / services" value={form.catalogue} onChange={set("catalogue")} area placeholder="une ligne par produit" />
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><DField label="Panier moyen (FCFA)" value={form.panierMoyen} onChange={set("panierMoyen")} type="number" /></div>
          <div style={{ flex: 1 }}><DField label="Budget pub mensuel" value={form.budgetPubActuel} onChange={set("budgetPubActuel")} placeholder="FCFA ou « aucun »" /></div>
        </div>
      </FormGroup>

      <FormGroup title="Présence digitale">
        <DField label="Lien TikTok" value={form.tiktok} onChange={set("tiktok")} placeholder="optionnel" />
        <DField label="Lien page Facebook" value={form.facebook} onChange={set("facebook")} placeholder="optionnel" />
        <DField label="Lien Instagram" value={form.instagram} onChange={set("instagram")} placeholder="optionnel" />
        <DField label="Abonnés approx. par plateforme" value={form.abonnes} onChange={set("abonnes")} placeholder="ex : TikTok 2k, FB 800" />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: C.muted }}>A-t-il déjà vendu en ligne ?</label>
          <select value={form.dejaVenduEnLigne} onChange={e => set("dejaVenduEnLigne")(e.target.value)} style={inputStyle}>
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </div>
        {form.dejaVenduEnLigne === "oui" && <DField label="Détails / volume / résultat" value={form.detailsVentes} onChange={set("detailsVentes")} area />}
        <DField label="Dernière activité sur la page" value={form.derniereActivite} onChange={set("derniereActivite")} placeholder="date approximative (page inactive ?)" />
      </FormGroup>

      <FormGroup title="Diagnostic">
        <DField label="Cible / clientèle actuelle (selon le client)" value={form.cibleActuelle} onChange={set("cibleActuelle")} area />
        <DField label="Problème perçu par le client *" value={form.problemePercu} onChange={set("problemePercu")} area placeholder="ce qu'il PENSE être son problème" />
        <DField label="Objectifs à 30 jours *" value={form.objectifs30j} onChange={set("objectifs30j")} area />
        <DField label="Objectifs long terme (3-6 mois)" value={form.objectifsLongTerme} onChange={set("objectifsLongTerme")} area />
        <DField label="Concurrents déjà connus du client" value={form.concurrentsConnus} onChange={set("concurrentsConnus")} area />
      </FormGroup>

      <FormGroup title="Photos">
        <PhotoField label="Photo du client / de la boutique" value={form.photoClient} onChange={set("photoClient")} />
        <PhotoField label="Capture de sa page actuelle (optionnel)" value={form.photoPage} onChange={set("photoPage")} />
      </FormGroup>

      <FormGroup title="Notes internes KBS (jamais exportées au client)">
        <DField label="Impression du commercial après le RDV" value={form.noteCommercial} onChange={set("noteCommercial")} area />
        <DField label="Budget réel estimé (FCFA)" value={form.budgetReelEstime} onChange={set("budgetReelEstime")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: C.muted }}>Niveau d'urgence</label>
          <select value={form.niveauUrgence} onChange={e => set("niveauUrgence")(e.target.value)} style={inputStyle}>
            <option>Faible</option><option>Moyen</option><option>Élevé</option>
          </select>
        </div>
      </FormGroup>

      {savedMsg && <div style={{ fontSize: 12, color: savedMsg.startsWith("Erreur") ? C.rustLight : C.greenLight }}>{savedMsg}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSave} disabled={saving} style={{ ...iconBtn, flex: 1, padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving ? 0.6 : 1 }}>
          <Save size={14} /> {saving ? "Enregistrement…" : "Enregistrer la fiche"}
        </button>
        <button onClick={onLaunch} disabled={launching || !complete} title={complete ? "" : "Complète les champs obligatoires (*)"}
          style={{ ...btnGold, flex: 1, opacity: (launching || !complete) ? 0.5 : 1, cursor: (launching || !complete) ? "not-allowed" : "pointer" }}>
          <Sparkles size={14} /> {launching ? "Lancement…" : "Lancer le diagnostic IA"}
        </button>
      </div>
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Génération ≈ 0,50 à 1,50 $ · facturation Anthropic à l'usage · un seul lancement à la fois.</div>
    </div>
  );
}

function FormGroup({ title, children }) {
  return (
    <div style={{ background: C.cardAlt, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function InteractiveGuide({ diag, prospect, agency, onToggle, onEditForm, onRelaunch, launching }) {
  const g = diag.guideContent || {};
  const p = diag.programJson || {};
  const r = diag.researchData || {};
  const prog = guideProgress(diag);
  const [openResearch, setOpenResearch] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Barre de progression globale */}
      <div style={{ background: C.cardAlt, borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Progression du programme ({p.durationDays || 30} jours)</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.goldLight }}>{prog.done}/{prog.total} · {prog.pct}%</span>
        </div>
        <div style={{ height: 8, background: C.border, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${prog.pct}%`, background: C.gold, borderRadius: 6, transition: "width .3s" }} />
        </div>
      </div>

      {/* Diagnostic */}
      {g.positioning && <GuideBlock label="Positionnement" text={g.positioning} />}
      {(g.perceivedProblem || g.realProblem) && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Le vrai problème</div>
          {g.perceivedProblem && <div style={{ fontSize: 12.5, marginBottom: 6 }}><span style={{ color: C.muted }}>Perçu : </span>{g.perceivedProblem}</div>}
          {g.realProblem && <div style={{ fontSize: 12.5, background: C.cardAlt, borderRadius: 8, padding: 10 }}><span style={{ color: C.gold, fontWeight: 700 }}>Réel : </span>{g.realProblem}</div>}
        </div>
      )}

      {(g.personas || []).length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Personas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {g.personas.map((per, i) => (
              <div key={i} style={{ background: C.cardAlt, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{per.name}</div>
                {per.description && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{per.description}</div>}
                {(per.pains || []).length > 0 && <div style={{ fontSize: 11.5, marginTop: 4 }}>😣 {per.pains.join(" · ")}</div>}
                {(per.desires || []).length > 0 && <div style={{ fontSize: 11.5, marginTop: 2 }}>✨ {per.desires.join(" · ")}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(g.angles || []).length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Angles marketing</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {g.angles.map((a, i) => (
              <div key={i} style={{ background: C.cardAlt, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{a.title}</div>
                {a.example && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{a.example}</div>}
                {a.hook && <div style={{ fontSize: 12, marginTop: 4, fontStyle: "italic", color: C.goldLight }}>« {a.hook} »</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(p.kpis || []).length > 0 && (
        <GuideBlock label="KPI à suivre" text={p.kpis.map(k => `• ${k}`).join("\n")} />
      )}

      {/* Rail des jours */}
      {(p.days || []).length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Programme jour par jour</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {p.days.map((d, i) => (
              <div key={i} style={{ background: C.cardAlt, borderRadius: 8, padding: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ background: C.gold, color: "#fff", fontSize: 11, fontWeight: 800, borderRadius: 6, padding: "2px 8px" }}>J{d.day}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>{d.theme}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(d.tasks || []).map(t => {
                    const done = !!(diag.checklistProgress || {})[t.id];
                    return (
                      <div key={t.id} onClick={() => onToggle(t.id)} style={{ display: "flex", alignItems: "flex-start", gap: 7, cursor: "pointer", fontSize: 12.5 }}>
                        {done ? <CheckCircle2 size={16} color={C.greenLight} style={{ flexShrink: 0, marginTop: 1 }} /> : <Circle size={16} color={C.muted} style={{ flexShrink: 0, marginTop: 1 }} />}
                        <span style={{ textDecoration: done ? "line-through" : "none", color: done ? C.muted : C.text }}>{t.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concurrents analyses (repliable) */}
      {(r.competitors || []).length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
          <div onClick={() => setOpenResearch(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: 0.4 }}>Concurrents analysés ({r.competitors.length})</span>
            {openResearch ? <ChevronDown size={14} color={C.gold} /> : <ChevronRight size={14} color={C.gold} />}
          </div>
          {openResearch && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {r.summary && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{r.summary}</div>}
              {r.competitors.map((c, i) => (
                <div key={i} style={{ background: C.cardAlt, borderRadius: 8, padding: 8, fontSize: 11.5 }}>
                  <div style={{ fontWeight: 700 }}>{c.name} <span style={{ color: C.muted, fontWeight: 400 }}>· {c.platform} · {c.followers}</span></div>
                  {c.angle && <div style={{ color: C.muted, marginTop: 2 }}>Angle : {c.angle}</div>}
                  {c.whyItWorks && <div style={{ marginTop: 2 }}>👍 {c.whyItWorks}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <button onClick={() => generateGuidePDF(diag, prospect, agency)} style={{ ...btnGold }}>
        <FileText size={14} /> Exporter le guide en PDF
      </button>
      {prospect.whatsapp ? (
        <a href={whatsappGuideLink(prospect, diag)} target="_blank" rel="noopener noreferrer" style={{ ...iconBtn, textDecoration: "none", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: C.greenLight, borderColor: C.green }}>
          <Send size={14} /> Envoyer sur WhatsApp
        </a>
      ) : (
        <div style={{ fontSize: 11.5, color: C.muted, background: C.cardAlt, borderRadius: 8, padding: 10 }}>Ajoute un numéro WhatsApp au client pour activer l'envoi.</div>
      )}
      <div style={{ fontSize: 11, color: C.muted, background: C.cardAlt, borderRadius: 8, padding: 10 }}>
        ⚠️ WhatsApp ne peut pas joindre le PDF automatiquement : le lien pré-remplit seulement un texte. Télécharge d'abord le PDF, puis joins-le manuellement dans WhatsApp.
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <button onClick={onEditForm} style={{ ...iconBtn, flex: 1, padding: "8px" }}>Modifier la fiche</button>
        <button onClick={onRelaunch} disabled={launching} style={{ ...iconBtn, flex: 1, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: launching ? 0.6 : 1 }}>
          <RefreshCw size={13} /> Relancer (payant)
        </button>
      </div>
      {diag.generationCostEstimate ? <div style={{ fontSize: 10.5, color: C.muted, textAlign: "center" }}>Coût estimé de cette génération : ≈ {Number(diag.generationCostEstimate).toFixed(2)} $</div> : null}
    </div>
  );
}

function GuideBlock({ label, text }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.goldLight, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 12.5, whiteSpace: "pre-wrap" }}>{text}</div>
    </div>
  );
}

/* ---------------------------------- ADMIN : SUIVI DES DIAGNOSTICS IA ---------------------------------- */
function AdminDiagnostics() {
  const [list, setList] = useState(null);
  const [rawId, setRawId] = useState(null);

  async function refresh() {
    setList(null);
    const all = await loadAllDiagnostics();
    all.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    setList(all);
  }
  useEffect(() => { refresh(); }, []);

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthCost = (list || []).reduce((s, d) => {
    const ref = d.completedAt || d.updatedAt || "";
    return ref.startsWith(ym) ? s + (Number(d.generationCostEstimate) || 0) : s;
  }, 0);
  const totalCost = (list || []).reduce((s, d) => s + (Number(d.generationCostEstimate) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <H2>Diagnostics IA</H2>
        <button onClick={refresh} style={{ ...iconBtn, display: "flex", alignItems: "center", gap: 5, padding: "6px 10px" }}><RefreshCw size={13} /> Rafraîchir</button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>Coût ce mois-ci</div>
          <div style={{ fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: C.goldLight }}>≈ {monthCost.toFixed(2)} $</div>
        </Card>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>Coût cumulé</div>
          <div style={{ fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: C.greenLight }}>≈ {totalCost.toFixed(2)} $</div>
        </Card>
      </div>

      {list === null && <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 16 }}>Chargement…</div>}
      {list !== null && list.length === 0 && <div style={{ fontSize: 12.5, color: C.muted, textAlign: "center", padding: 16 }}>Aucun diagnostic pour l'instant. Ouvre la fiche d'un client dans le CRM pour en créer un.</div>}

      {(list || []).map(d => (
        <Card key={d.clientId}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{d.clientNom || `Client ${d.clientId}`}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                {d.formData?.niche ? `Niche : ${d.formData.niche} · ` : ""}Maj : {(d.updatedAt || "").slice(0, 16).replace("T", " ")}
              </div>
            </div>
            <StatusPill status={d.status} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <div style={{ fontSize: 11.5, color: C.muted }}>
              {d.generationCostEstimate ? `Coût : ≈ ${Number(d.generationCostEstimate).toFixed(2)} $` : "—"}
              {d.programJson?.durationDays ? ` · ${d.programJson.durationDays} j` : ""}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {d.researchData && <button onClick={() => setRawId(rawId === d.clientId ? null : d.clientId)} style={{ ...iconBtn, padding: "5px 9px", fontSize: 11 }}>{rawId === d.clientId ? "Masquer" : "Données brutes"}</button>}
            </div>
          </div>
          {d.status === "failed" && d.errorMessage && <div style={{ fontSize: 11.5, color: C.rustLight, marginTop: 6 }}>Erreur : {d.errorMessage}</div>}
          {rawId === d.clientId && (
            <pre style={{ marginTop: 8, background: C.cardAlt, borderRadius: 8, padding: 10, fontSize: 10.5, overflowX: "auto", maxHeight: 260, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(d.researchData, null, 2)}
            </pre>
          )}
        </Card>
      ))}
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Les guides et leur progression se consultent dans la fiche de chaque client (CRM & Clients).</div>
    </div>
  );
}

/* ---------------------------------- TAB: DEVIS ---------------------------------- */
function TabDevis({ devis, setDevis, prospects, team, agency }) {
  const [form, setForm] = useState({ clientNom: "", whatsapp: "", validite: "", notes: "", linkedId: "", items: [{ label: "", qte: 1, prix: "" }] });

  function pickClient(id) {
    const p = prospects.find(pp => String(pp.id) === String(id));
    if (p) setForm({ ...form, linkedId: id, clientNom: `${p.prenom || ""} ${p.nom}`.trim(), whatsapp: p.whatsapp || "" });
    else setForm({ ...form, linkedId: "" });
  }
  function updateItem(idx, patch) {
    setForm({ ...form, items: form.items.map((it, i) => i === idx ? { ...it, ...patch } : it) });
  }
  function addItem() { setForm({ ...form, items: [...form.items, { label: "", qte: 1, prix: "" }] }); }
  function removeItem(idx) { setForm({ ...form, items: form.items.filter((_, i) => i !== idx) }); }
  function addDevis() {
    if (!form.clientNom.trim()) return;
    const items = form.items.filter(it => it.label.trim());
    if (!items.length) return;
    setDevis([...devis, { ...form, items, id: Date.now(), date: new Date().toISOString().slice(0, 10), statut: "Envoyé" }]);
    notifyTeam("Nouveau devis 📄", `Devis pour ${form.clientNom}`, "devis");
    setForm({ clientNom: "", whatsapp: "", validite: "", notes: "", linkedId: "", items: [{ label: "", qte: 1, prix: "" }] });
  }
  function updateStatut(id, statut) { setDevis(devis.map(d => d.id === id ? { ...d, statut } : d)); }
  function removeDevis(id) { setDevis(devis.filter(d => d.id !== id)); }
  function total(items) { return (items || []).reduce((s, it) => s + (Number(it.qte) || 1) * (Number(it.prix) || 0), 0); }

  const statuts = ["Envoyé", "Accepté", "Refusé"];
  const statutColor = { "Envoyé": C.goldLight, "Accepté": C.greenLight, "Refusé": C.rustLight };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ background: C.cardAlt }}>
        <div style={{ fontSize: 13 }}>📝 Crée un devis professionnel, télécharge-le en PDF et envoie-le au client avant qu'il ne paie.</div>
      </Card>

      <Card>
        <Eyebrow>Nouveau devis</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <select value={form.linkedId} onChange={e => pickClient(e.target.value)} style={inputStyle}>
            <option value="">— Choisir un client existant (optionnel) —</option>
            {prospects.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
          </select>
          <input placeholder="Nom du client / entreprise" value={form.clientNom} onChange={e => setForm({ ...form, clientNom: e.target.value })} style={inputStyle} />
          <input placeholder="Numéro WhatsApp" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>Valable jusqu'au :</label>
            <input type="date" value={form.validite} onChange={e => setForm({ ...form, validite: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
          </div>

          <Eyebrow>Prestations</Eyebrow>
          {form.items.map((it, idx) => (
            <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input placeholder="Prestation" value={it.label} onChange={e => updateItem(idx, { label: e.target.value })} style={{ ...inputStyle, flex: 2 }} />
              <input type="number" placeholder="Qté" value={it.qte} onChange={e => updateItem(idx, { qte: e.target.value })} style={{ ...inputStyle, flex: "0 0 55px" }} />
              <input type="number" placeholder="Prix" value={it.prix} onChange={e => updateItem(idx, { prix: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
              {form.items.length > 1 && <button onClick={() => removeItem(idx)} style={iconBtn}><Trash2 size={12} /></button>}
            </div>
          ))}
          <button onClick={addItem} style={{ ...iconBtn, alignSelf: "flex-start" }}><Plus size={12} /> Ajouter une ligne</button>

          <textarea placeholder="Notes / conditions (optionnel)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} />

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: C.goldLight, padding: "4px 2px" }}>
            <span>Total du devis</span><span>{fcfa(total(form.items))}</span>
          </div>

          <button onClick={addDevis} style={btnGold}><Plus size={14} /> Créer le devis</button>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {devis.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 16 }}>Aucun devis pour l'instant.</div>}
        {devis.slice().reverse().map(d => (
          <Card key={d.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{d.clientNom}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{d.date}{d.validite ? ` · Valable jusqu'au ${d.validite}` : ""}</div>
              </div>
              <button onClick={() => removeDevis(d.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><Trash2 size={16} /></button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <select value={d.statut} onChange={e => updateStatut(d.id, e.target.value)} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, width: "auto", color: statutColor[d.statut] }}>
                {statuts.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.goldLight }}>{fcfa(total(d.items))}</div>
            </div>
            <button onClick={() => generateDevisPDF(d, agency)}
              style={{ ...iconBtn, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", marginTop: 10, color: C.goldLight, borderColor: C.gold }}>
              <FileText size={14} /> Télécharger le devis PDF
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- TAB: KANBAN ---------------------------------- */
function TabKanban({ kanban, setKanban, checks, setChecks, team, codes }) {
  const [newTask, setNewTask] = useState("");
  const [taskAssignee, setTaskAssignee] = useState(team[0]?.id || "");
  const [myUnlock, setMyUnlock] = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [whoPicker, setWhoPicker] = useState(team[0]?.id || "");
  const [unlockCode, setUnlockCode] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  const cols = [
    { id: "todo", label: "À faire" }, { id: "doing", label: "En cours" },
    { id: "review", label: "À valider" }, { id: "done", label: "Terminé" },
  ];
  function addTask() {
    if (!newTask.trim()) return;
    setKanban({ ...kanban, todo: [...kanban.todo, { id: Date.now(), text: newTask, assignedTo: taskAssignee }] });
    setNewTask("");
  }
  function move(colId, taskId, dir) {
    const order = ["todo", "doing", "review", "done"];
    const idx = order.indexOf(colId);
    const target = order[idx + dir];
    if (!target) return;
    const task = kanban[colId].find(t => t.id === taskId);
    setKanban({ ...kanban, [colId]: kanban[colId].filter(t => t.id !== taskId), [target]: [...kanban[target], task] });
  }
  function removeTask(colId, taskId) {
    setKanban({ ...kanban, [colId]: kanban[colId].filter(t => t.id !== taskId) });
  }
  function canEdit(personId) { return adminUnlocked || myUnlock === personId; }
  // Une tâche sans responsable (ancienne tâche) reste modifiable par tout le monde.
  function canEditTask(t) { return !t.assignedTo || canEdit(t.assignedTo); }
  function toggleCheck(person, idx) {
    if (!canEdit(person)) return;
    const list = checks[person] || [];
    const next = list.includes(idx) ? list.filter(i => i !== idx) : [...list, idx];
    setChecks({ ...checks, [person]: next });
  }
  function resetChecks(person) {
    if (!canEdit(person)) return;
    setChecks({ ...checks, [person]: [] });
  }
  function tryUnlockMine() {
    const member = team.find(m => m.id === whoPicker);
    // Strict : le code de secours n'ouvre pas les tâches/checklist d'un autre membre.
    if (member && codeMatchesStrict(unlockCode, member.code)) { setMyUnlock(member.id); setUnlockError(false); setUnlockCode(""); }
    else setUnlockError(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Card>
        <Eyebrow>Nouvelle tâche</Eyebrow>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <input placeholder="Décrire la tâche…" value={newTask} onChange={e => setNewTask(e.target.value)} style={{ ...inputStyle, flex: "1 1 100%" }} />
          <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
            {team.map(m => <option key={m.id} value={m.id}>Pour : {m.name}</option>)}
          </select>
          <button onClick={addTask} style={{ ...btnGold, width: "auto", padding: "0 16px" }}><Plus size={16} /></button>
        </div>
      </Card>

      {!adminUnlocked ? (
        <Card>
          <Eyebrow>Déverrouiller mes tâches &amp; ma checklist</Eyebrow>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 6, marginBottom: 8 }}>Entre ton code personnel pour déplacer les tâches qui te sont assignées et cocher ta checklist.</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <select value={whoPicker} onChange={e => { setWhoPicker(e.target.value); setUnlockError(false); }} style={{ ...inputStyle, flex: "1 1 120px" }}>
              {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input type="password" placeholder="Ton code" value={unlockCode}
              onChange={e => { setUnlockCode(e.target.value); setUnlockError(false); }}
              onKeyDown={e => { if (e.key === "Enter") tryUnlockMine(); }}
              style={{ ...inputStyle, flex: "1 1 100px" }} />
            <button onClick={tryUnlockMine} style={{ ...iconBtn, padding: "0 14px" }}>OK</button>
          </div>
          {unlockError && <div style={{ color: C.rustLight, fontSize: 11, marginTop: 6 }}>Code incorrect.</div>}
          {myUnlock && <div style={{ color: C.greenLight, fontSize: 11, marginTop: 6 }}>✓ {team.find(m => m.id === myUnlock)?.name} peut gérer ses tâches et sa checklist.</div>}
          <div style={{ marginTop: 8 }}>
            <MiniUnlock strict code={codes.admin} label="Ou code Administration (CEO — tout déverrouiller)" onUnlock={() => setAdminUnlocked(true)} />
          </div>
        </Card>
      ) : (
        <div style={{ color: C.greenLight, fontSize: 12 }}>✓ Mode Administration : toutes les tâches et checklists sont modifiables.</div>
      )}

      <div>
        <H2>Tableau Kanban</H2>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Chaque tâche ne peut être déplacée ou supprimée que par la personne à qui elle est assignée (ou le CEO).</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cols.map((col, colIdx) => (
            <Card key={col.id}>
              <Eyebrow>{col.label} ({kanban[col.id]?.length || 0})</Eyebrow>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {(kanban[col.id] || []).map(t => {
                  const editable = canEditTask(t);
                  const who = team.find(m => m.id === t.assignedTo);
                  return (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, background: C.cardAlt, borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 13 }}>{t.text}</span>
                        {who && <span style={{ fontSize: 10.5, fontWeight: 700, color: editable ? C.goldLight : C.muted }}>{who.name}{editable ? "" : " 🔒"}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {editable ? (
                          <>
                            {colIdx > 0 && <button onClick={() => move(col.id, t.id, -1)} style={iconBtn}>←</button>}
                            {colIdx < 3 && <button onClick={() => move(col.id, t.id, 1)} style={iconBtn}>→</button>}
                            <button onClick={() => removeTask(col.id, t.id)} style={iconBtn}><Trash2 size={12} /></button>
                          </>
                        ) : (
                          <Lock size={13} color={C.muted} />
                        )}
                      </div>
                    </div>
                  );
                })}
                {(kanban[col.id] || []).length === 0 && <div style={{ fontSize: 12, color: C.muted }}>Vide</div>}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <H2>Checklists quotidiennes</H2>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Chacun voit toutes les checklists, mais ne peut cocher que la sienne (déverrouille ton code en haut). Le CEO peut tout cocher avec le code Administration.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {team.map(m => {
            const editable = canEdit(m.id);
            return (
              <Card key={m.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Eyebrow>{m.name}{editable ? "" : " 🔒"}</Eyebrow>
                  {editable && <button onClick={() => resetChecks(m.id)} style={iconBtn}><RotateCcw size={12} /></button>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  {(m.checklist || []).map((item, idx) => {
                    const done = (checks[m.id] || []).includes(idx);
                    return (
                      <div key={idx} onClick={() => toggleCheck(m.id, idx)} style={{ display: "flex", gap: 8, alignItems: "center", cursor: editable ? "pointer" : "default", opacity: editable ? 1 : 0.7 }}>
                        {done ? <CheckCircle2 size={16} color={C.greenLight} /> : <Circle size={16} color={C.muted} />}
                        <span style={{ fontSize: 13, color: done ? C.muted : C.text, textDecoration: done ? "line-through" : "none" }}>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- TAB: DISPONIBILITÉS ÉQUIPE (PLANNING UNIQUE) ---------------------------------- */
function TabDispos({ dispos, setDispos, team }) {
  const [whoAmI, setWhoAmI] = useState(null);
  const [viewing, setViewing] = useState(null);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const now = new Date();
  const firstWeekdayOffset = new Date(now.getFullYear(), now.getMonth(), 1).getDay(); // 0=Dim ... 6=Sam
  const todayDayNum = now.getDate();

  useEffect(() => {
    if (!viewing && team.length) setViewing(team[0].id);
  }, [team, viewing]);

  const viewingMember = team.find(m => m.id === viewing);
  const isEditing = whoAmI && whoAmI === viewing;
  const dayData = dispos[viewing] || defaultDispoDays();

  function updateDay(d, patch) {
    if (!isEditing) return;
    const memberDays = dispos[viewing] || defaultDispoDays();
    setDispos({ ...dispos, [viewing]: { ...memberDays, [d]: { ...memberDays[d], ...patch } } });
  }
  function toggleDay(d) { updateDay(d, { disponible: !dayData[d]?.disponible }); }
  function resetMine() {
    if (!isEditing) return;
    setDispos({ ...dispos, [viewing]: defaultDispoDays() });
  }

  const availableCount = days.filter(d => dayData[d]?.disponible).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ background: C.cardAlt }}>
        <div style={{ fontSize: 13 }}>📅 Chaque membre indique ici ses jours et heures de disponibilité (Jour 1 à 30 du mois). Tout le monde peut consulter, mais seule la personne concernée peut modifier son propre calendrier.</div>
      </Card>

      {!whoAmI && (
        <Card style={{ textAlign: "center" }}>
          <Eyebrow>Qui es-tu ?</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 8 }}>
            {team.map(m => (
              <button key={m.id} onClick={() => { setWhoAmI(m.id); setViewing(m.id); }} style={{
                padding: "8px 14px", borderRadius: 999, border: `1px solid ${C.border}`,
                background: "transparent", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>{m.name}</button>
            ))}
          </div>
        </Card>
      )}

      {whoAmI && (
      <>
        <div style={{ display: "flex", overflowX: "auto", gap: 6 }}>
          {team.map(m => {
            const active = viewing === m.id;
            return (
              <button key={m.id} onClick={() => setViewing(m.id)} style={{
                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                border: `1px solid ${active ? m.color : C.border}`,
                background: active ? "rgba(193,95,60,0.12)" : "transparent",
                color: active ? m.color : C.muted, cursor: "pointer", flexShrink: 0
              }}>{m.name}{m.id === whoAmI ? " (toi)" : ""}</button>
            );
          })}
        </div>

        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: C.muted }}>Jours disponibles — {viewingMember?.name}</div>
          <div style={{ fontFamily: "Baloo 2, sans-serif", fontSize: 22, fontWeight: 800, color: C.text }}>{availableCount} / 30</div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Eyebrow>{isEditing ? "Ton calendrier (modifiable)" : `Calendrier de ${viewingMember?.name} (lecture seule)`}</Eyebrow>
            {isEditing && <button onClick={resetMine} style={iconBtn}><RotateCcw size={12} /> Réinitialiser</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {WEEKDAYS_FR.map(w => (
              <div key={w} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, color: (w === "Sam" || w === "Dim") ? C.gold : C.muted }}>{w}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {Array.from({ length: firstWeekdayOffset }).map((_, i) => <div key={`blank-${i}`} />)}
            {days.map(d => {
              const av = dayData[d]?.disponible;
              const isToday = d === todayDayNum;
              return (
                <button key={d}
                  onClick={() => toggleDay(d)}
                  title={[dayData[d]?.heure, dayData[d]?.note].filter(Boolean).join(" — ")}
                  style={{
                    aspectRatio: "1", borderRadius: 8,
                    border: isToday ? `2px solid ${C.goldLight}` : `1px solid ${av ? C.greenLight : C.border}`,
                    background: av ? "rgba(60,190,124,0.18)" : "rgba(255,255,255,0.04)",
                    color: av ? C.greenLight : C.muted, fontWeight: 700, fontSize: 13,
                    cursor: isEditing ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1
                  }}>
                  {d}
                  {av && dayData[d]?.heure && <span style={{ fontSize: 8, fontWeight: 600 }}>{dayData[d].heure}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: C.muted }}>
            <span><span style={{ color: C.muted }}>●</span> Indisponible</span>
            <span><span style={{ color: C.greenLight }}>●</span> Disponible</span>
          </div>
        </Card>

        {isEditing && (
          <Card>
            <Eyebrow>Ajouter une heure et une note sur un jour disponible</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {days.filter(d => dayData[d]?.disponible).map(d => (
                <div key={d} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 26, fontSize: 12, fontWeight: 700, color: C.greenLight }}>J{d}</span>
                  <input type="time" value={dayData[d]?.heure || ""} onChange={e => updateDay(d, { heure: e.target.value })} style={{ ...inputStyle, width: 90, fontSize: 12, padding: "6px 8px" }} />
                  <input placeholder="Ex: dispo l'après-midi, sur RDV…" value={dayData[d]?.note || ""} onChange={e => updateDay(d, { note: e.target.value })} style={{ ...inputStyle, flex: 1, fontSize: 12, padding: "6px 8px" }} />
                </div>
              ))}
              {availableCount === 0 && <div style={{ fontSize: 12, color: C.muted }}>Coche un jour disponible ci-dessus pour ajouter une heure.</div>}
            </div>
          </Card>
        )}

        <button onClick={() => setWhoAmI(null)} style={{ ...iconBtn, alignSelf: "center" }}>Changer d'identité</button>
      </>
      )}
    </div>
  );
}

function TabOutils() {
  const [open, setOpen] = useState(AI_TOOLS[0].cat);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ color: C.muted, fontSize: 12.5, marginBottom: 4 }}>Cette boîte à outils s'agrandira au fil du temps — ajoute vos futures découvertes dans l'onglet "Liens partagés".</div>
      {AI_TOOLS.map(group => {
        const expanded = open === group.cat;
        return (
          <Card key={group.cat}>
            <button onClick={() => setOpen(expanded ? null : group.cat)} style={{ background: "none", border: "none", color: C.text, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: 0 }}>
              <span style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 700, fontSize: 14 }}>{group.cat}</span>
              {expanded ? <ChevronDown size={16} color={C.gold} /> : <ChevronRight size={16} color={C.gold} />}
            </button>
            {expanded && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {group.items.map(tool => (
                  <div key={tool.name} style={{ background: C.cardAlt, borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{tool.name}</span>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ color: C.goldLight, display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>Ouvrir <ExternalLink size={12} /></a>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.text, marginTop: 6 }}>{tool.role}</div>
                    <div style={{ fontSize: 12, color: C.greenLight, marginTop: 4 }}>+ {tool.adv}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------------------------- TAB: PLAN 30 JOURS ---------------------------------- */
function TabPlan() {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {WEEKS.map((w, i) => {
        const expanded = open === i;
        return (
          <Card key={i}>
            <button onClick={() => setOpen(expanded ? -1 : i)} style={{ background: "none", border: "none", color: C.text, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: 0 }}>
              <span style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 700, fontSize: 14 }}>{w.title}</span>
              {expanded ? <ChevronDown size={16} color={C.gold} /> : <ChevronRight size={16} color={C.gold} />}
            </button>
            {expanded && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {w.tasks.map((t, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                    <TrendingUp size={14} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------------------------- TAB: CIBLE & COPYWRITING ---------------------------------- */
function TabCible() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <H2>Nos 3 clients cibles</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PERSONAS.map(p => (
            <Card key={p.title}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title} <span style={{ color: C.muted, fontWeight: 500, fontSize: 12 }}>({p.age})</span></div>
              <div style={{ fontSize: 12.5, color: C.text, marginTop: 6 }}>{p.desc}</div>
              <div style={{ fontSize: 12, color: C.goldLight, marginTop: 6 }}>Comment lui parler : {p.tone}</div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <H2>Groupes à cibler</H2>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {GROUPES_CIBLES.map((g, i) => <div key={i} style={{ fontSize: 13 }}>• {g}</div>)}
          </div>
        </Card>
      </div>

      <div>
        <H2>Méthode de prospection (sans budget pub)</H2>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {METHODE_PROSPECTION.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                <span style={{ color: C.gold, fontWeight: 700 }}>{i + 1}.</span> {m}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ textAlign: "center", background: C.cardAlt }}>
        <div style={{ fontSize: 13 }}>Les 30 hooks et les 10 scripts complets sont dans l'onglet <span style={{ color: C.gold, fontWeight: 700 }}>Laboratoire Copywriting</span> 🔥</div>
      </Card>
    </div>
  );
}
function ScriptLine({ label, text, color }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: color || C.greenLight, textTransform: "uppercase" }}>{label} — </span>
      <span style={{ fontSize: 12.5 }}>{text}</span>
    </div>
  );
}

/* ---------------------------------- TAB: TRÉSORERIE ---------------------------------- */
function TabTresorerie({ prospects, setProspects, expenses, setExpenses, totalCA, totalCommission, totalDepenses, beneficeNet, team, codes, commissionRate }) {
  const [form, setForm] = useState({ label: "", categorie: DEPENSES_CATEGORIES[0], montant: "", addedBy: team[0]?.id || "" });
  const [catherineUnlocked, setCatherineUnlocked] = useState(false);
  const clientsPayants = prospects.filter(p => Number(p.montant) > 0);

  function addExpense() {
    if (!form.label.trim() || !form.montant) return;
    setExpenses([...expenses, { ...form, id: Date.now(), date: new Date().toISOString().slice(0, 10) }]);
    notifyTeam("Nouvelle dépense 💸", `${form.label} — ${fcfa(form.montant)}`, "tresorerie");
    setForm({ label: "", categorie: DEPENSES_CATEGORIES[0], montant: "", addedBy: team[0]?.id || "" });
  }
  function removeExpense(id) { setExpenses(expenses.filter(e => e.id !== id)); }
  function updateSuivi(id, suivi) { setProspects(prospects.map(p => p.id === id ? { ...p, suivi } : p)); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <H2>Bilan financier (synchronisé)</H2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Revenus (CRM)</div>
            <div style={{ fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: C.goldLight, fontSize: 15 }}>{fcfa(totalCA)}</div>
          </Card>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Commissions équipe</div>
            <div style={{ fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: C.rustLight, fontSize: 15 }}>{fcfa(totalCommission)}</div>
          </Card>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Dépenses</div>
            <div style={{ fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: C.rustLight, fontSize: 15 }}>{fcfa(totalDepenses)}</div>
          </Card>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Bénéfice net</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: beneficeNet >= 0 ? C.greenLight : C.rustLight, fontSize: 15 }}>
              {beneficeNet >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {fcfa(beneficeNet)}
            </div>
          </Card>
        </div>
        <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Bénéfice net = Revenus encaissés − Commissions équipe − Dépenses. Recalculé automatiquement selon le pourcentage de chacun.</div>
      </div>

      <div>
        <H2>Dépenses</H2>
        <Card>
          <Eyebrow>Ajouter une dépense</Eyebrow>
          {catherineUnlocked ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              <input placeholder="Description (ex: Boost pub TikTok)" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={inputStyle} />
              <div style={{ display: "flex", gap: 8 }}>
                <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                  {DEPENSES_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" placeholder="Montant" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
              </div>
              <select value={form.addedBy} onChange={e => setForm({ ...form, addedBy: e.target.value })} style={inputStyle}>
                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button onClick={addExpense} style={btnGold}><Plus size={14} /> Ajouter la dépense</button>
            </div>
          ) : (
            <MiniUnlock code={codes.catherine} label="Réservé à Catherine" onUnlock={() => setCatherineUnlocked(true)} />
          )}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {expenses.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 16 }}>Aucune dépense enregistrée.</div>}
          {expenses.slice().reverse().map(e => (
            <Card key={e.id} style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{e.label}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{e.categorie} · {e.date} · {team.find(m => m.id === e.addedBy)?.name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 700, color: C.rustLight, fontSize: 13 }}>-{fcfa(e.montant)}</div>
                  {catherineUnlocked && <button onClick={() => removeExpense(e.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><Trash2 size={15} /></button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <H2>Suivi des clients payants</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {clientsPayants.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 16 }}>Aucun client payant pour l'instant.</div>}
          {clientsPayants.map(p => (
            <Card key={p.id}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.nom}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{p.pack} · {fcfa(p.montant)}</div>
              {catherineUnlocked ? (
                <select value={p.suivi || SUIVI_STATUTS[0]} onChange={e => updateSuivi(p.id, e.target.value)} style={{ ...inputStyle, marginTop: 8, fontSize: 12 }}>
                  {SUIVI_STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>{p.suivi || SUIVI_STATUTS[0]}</div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- TAB: DETTES & RAPPELS ---------------------------------- */
function TabDettes({ dettes, setDettes, prospects }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ clientNom: "", whatsapp: "", service: "", montantDu: "", dateEcheance: today, statut: "En attente", linkedId: "" });

  function pickClient(id) {
    const p = prospects.find(pp => String(pp.id) === String(id));
    if (p) setForm({ ...form, linkedId: id, clientNom: `${p.prenom || ""} ${p.nom}`.trim(), whatsapp: p.whatsapp || "", service: p.pack || "" });
    else setForm({ ...form, linkedId: "" });
  }
  function addDette() {
    if (!form.clientNom.trim() || !form.montantDu) return;
    setDettes([...dettes, { ...form, id: Date.now() }]);
    notifyTeam("Nouvelle dette à suivre 🧾", `${form.clientNom} doit ${fcfa(form.montantDu)}`, "dettes");
    setForm({ clientNom: "", whatsapp: "", service: "", montantDu: "", dateEcheance: today, statut: "En attente", linkedId: "" });
  }
  function markPaid(id) { setDettes(dettes.map(d => d.id === id ? { ...d, statut: "Payée" } : d)); }
  function removeDette(id) { setDettes(dettes.filter(d => d.id !== id)); }

  function urgency(d) {
    if (d.statut === "Payée") return "payee";
    return d.dateEcheance < today ? "retard" : "attente";
  }
  const sorted = dettes.slice().sort((a, b) => {
    const order = { retard: 0, attente: 1, payee: 2 };
    return order[urgency(a)] - order[urgency(b)];
  });
  const totalDu = dettes.filter(d => d.statut !== "Payée").reduce((s, d) => s + (Number(d.montantDu) || 0), 0);
  const enRetard = dettes.filter(d => urgency(d) === "retard").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>Total dû (impayé)</div>
          <div style={{ fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: C.goldLight, fontSize: 15 }}>{fcfa(totalDu)}</div>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>Échéances en retard</div>
          <div style={{ fontWeight: 800, fontFamily: "Baloo 2, sans-serif", color: enRetard > 0 ? C.rustLight : C.greenLight, fontSize: 15 }}>{enRetard}</div>
        </Card>
      </div>

      <Card>
        <Eyebrow>Enregistrer une dette / échéance</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <select value={form.linkedId} onChange={e => pickClient(e.target.value)} style={inputStyle}>
            <option value="">— Choisir un client existant (optionnel) —</option>
            {prospects.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
          </select>
          <input placeholder="Nom du client" value={form.clientNom} onChange={e => setForm({ ...form, clientNom: e.target.value })} style={inputStyle} />
          <input placeholder="Numéro WhatsApp" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} />
          <input placeholder="Service concerné" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} style={inputStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" placeholder="Montant dû (FCFA)" value={form.montantDu} onChange={e => setForm({ ...form, montantDu: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            <input type="date" value={form.dateEcheance} onChange={e => setForm({ ...form, dateEcheance: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <button onClick={addDette} style={btnGold}><Plus size={14} /> Enregistrer la dette</button>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 16 }}>Aucune dette enregistrée. 🎉</div>}
        {sorted.map(d => {
          const u = urgency(d);
          const color = u === "retard" ? C.rustLight : u === "payee" ? C.greenLight : C.goldLight;
          const label = u === "retard" ? "En retard" : u === "payee" ? "Payée" : "À échoir";
          return (
            <Card key={d.id} style={{ borderColor: u === "retard" ? C.rust : C.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{d.clientNom}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{d.service}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Échéance : {d.dateEcheance}</div>
                </div>
                <button onClick={() => removeDette(d.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><Trash2 size={16} /></button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color, background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 6 }}>{label}</span>
                <div style={{ fontWeight: 700, color: C.goldLight, fontSize: 13 }}>{fcfa(d.montantDu)}</div>
              </div>
              {d.statut !== "Payée" && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {d.whatsapp && (
                    <a href={whatsappRappelLink(d)} target="_blank" rel="noopener noreferrer" style={{ ...iconBtn, flex: 1, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Send size={12} /> Rappel WhatsApp
                    </a>
                  )}
                  <button onClick={() => markPaid(d.id)} style={{ ...iconBtn, flex: 1, color: C.greenLight, borderColor: C.green }}>Marquer payée</button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card style={{ background: C.cardAlt }}>
        <div style={{ fontSize: 11.5, color: C.muted }}>💡 Le rappel WhatsApp s'ouvre en un clic avec le message pré-rédigé. Pour un envoi vraiment automatique sans intervention, il faudra la version Supabase + Make.com.</div>
      </Card>
    </div>
  );
}
function TabCopywriting() {
  const [openHook, setOpenHook] = useState(HOOKS[0].cat);
  const [openScript, setOpenScript] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ background: C.cardAlt }}>
        <div style={{ fontSize: 13 }}>🔥 <strong>Stratégie :</strong> utilise un hook différent chaque jour pour tester ce qui accroche le mieux ton audience, puis reprends les scripts complets pour vendre en message privé.</div>
      </Card>

      <div>
        <H2>30 hooks & accroches</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {HOOKS.map(group => {
            const expanded = openHook === group.cat;
            return (
              <Card key={group.cat}>
                <button onClick={() => setOpenHook(expanded ? null : group.cat)} style={{ background: "none", border: "none", color: C.text, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: 0 }}>
                  <span style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 700, fontSize: 14 }}>{group.cat} ({group.items.length})</span>
                  {expanded ? <ChevronDown size={16} color={C.gold} /> : <ChevronRight size={16} color={C.gold} />}
                </button>
                {expanded && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {group.items.map((h, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, background: C.cardAlt, borderRadius: 8, padding: 10 }}>
                        <Flame size={13} color={C.rustLight} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <H2>10 scripts vidéo complets</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SCRIPTS.map((s, i) => {
            const expanded = openScript === i;
            return (
              <Card key={s.title}>
                <button onClick={() => setOpenScript(expanded ? null : i)} style={{ background: "none", border: "none", color: C.text, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: 0 }}>
                  <span style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 700, fontSize: 13.5 }}>{s.title}</span>
                  {expanded ? <ChevronDown size={16} color={C.gold} /> : <ChevronRight size={16} color={C.gold} />}
                </button>
                {expanded && (
                  <div style={{ marginTop: 10 }}>
                    <ScriptLine label="Crochet" text={s.hook} />
                    <ScriptLine label="Problème" text={s.probleme} />
                    <ScriptLine label="Solution" text={s.solution} />
                    <ScriptLine label="Appel à l'action" text={s.cta} color={C.rustLight} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- TAB: PROSPECTION RÉSEAUX ---------------------------------- */
function TabProspection({ prospection, setProspection, prospects, setProspects, team, pricing, allServicesFlat }) {
  const [service, setService] = useState(allServicesFlat[0]);
  const [copiedStage, setCopiedStage] = useState(null);
  const [form, setForm] = useState({ nom: "", whatsapp: "", source: "", commentaire: "", interet: "Chaud", statut: "À répondu", scriptUtilise: DM_SCRIPTS[0].stage, note: "" });

  const priceInfo = findServiceInfo(service, pricing);

  function renderScript(text) {
    return text.replaceAll("[Service]", service).replaceAll("[Prix]", priceInfo.price);
  }
  function copyScript(stage, text) {
    try {
      navigator.clipboard.writeText(renderScript(text));
      setCopiedStage(stage);
      setTimeout(() => setCopiedStage(null), 1500);
    } catch { /* ignore */ }
  }

  function addEntry() {
    if (!form.nom.trim()) return;
    setProspection([...prospection, { ...form, id: Date.now(), date: new Date().toISOString().slice(0, 10) }]);
    setForm({ nom: "", whatsapp: "", source: "", commentaire: "", interet: "Chaud", statut: "À répondu", scriptUtilise: DM_SCRIPTS[0].stage, note: "" });
  }
  function updateStatut(id, statut) { setProspection(prospection.map(p => p.id === id ? { ...p, statut } : p)); }
  function removeEntry(id) { setProspection(prospection.filter(p => p.id !== id)); }
  function convertToClient(p) {
    setProspects([...prospects, {
      id: Date.now(), nom: p.nom, prenom: "", whatsapp: p.whatsapp, email: "", adresse: "", quartier: "",
      dateInscription: new Date().toISOString().slice(0, 10), pack: pricing.packs[0]?.name || "", statut: "En discussion",
      montant: "", owner: team[0]?.id || "", historique: [{ id: Date.now(), date: new Date().toISOString().slice(0, 10), note: `Converti depuis la prospection (source : ${p.source || "réseaux sociaux"})` }],
    }]);
    removeEntry(p.id);
  }

  const interetColor = { Chaud: C.rustLight, Tiède: C.goldLight, Froid: "#7FB3E8" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ background: C.cardAlt }}>
        <div style={{ fontSize: 13 }}>🎯 Ces messages sont pour Catherine : à envoyer en réponse aux commentaires Facebook/TikTok, puis en DM privé. Choisis le service concerné, le texte se met à jour automatiquement.</div>
      </Card>

      <Card>
        <Eyebrow>Service à mettre en avant</Eyebrow>
        <select value={service} onChange={e => setService(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
          {allServicesFlat.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Card>

      <div>
        <H2>Scripts DM — copier-coller</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DM_SCRIPTS.map(s => (
            <Card key={s.stage}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.gold }}>{s.stage}</span>
                <button onClick={() => copyScript(s.stage, s.text)} style={{ ...iconBtn, display: "flex", alignItems: "center", gap: 5 }}>
                  <Copy size={12} /> {copiedStage === s.stage ? "Copié !" : "Copier"}
                </button>
              </div>
              <div style={{ fontSize: 12.5, whiteSpace: "pre-line", color: C.text, background: C.cardAlt, borderRadius: 8, padding: 10 }}>{renderScript(s.text)}</div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <H2>Suivi des commentaires & DM</H2>
        <Card>
          <Eyebrow>Ajouter un contact repéré</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <input placeholder="Nom & Prénom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
            <input placeholder="Contact WhatsApp" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} />
            <input placeholder="Source (groupe / page)" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} style={inputStyle} />
            <input placeholder="Commentaire vu" value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} style={inputStyle} />
            <div style={{ display: "flex", gap: 8 }}>
              <select value={form.interet} onChange={e => setForm({ ...form, interet: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                {INTERET_NIVEAUX.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <select value={form.scriptUtilise} onChange={e => setForm({ ...form, scriptUtilise: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                {DM_SCRIPTS.map(s => <option key={s.stage} value={s.stage}>{s.stage}</option>)}
              </select>
            </div>
            <button onClick={addEntry} style={btnGold}><Plus size={14} /> Ajouter au suivi</button>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {prospection.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 16 }}>Aucun contact repéré pour l'instant.</div>}
          {prospection.slice().reverse().map(p => (
            <Card key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nom}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{p.whatsapp} · {p.source}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>"{p.commentaire}"</div>
                </div>
                <button onClick={() => removeEntry(p.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><Trash2 size={16} /></button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, flexWrap: "wrap", gap: 6 }}>
                <select value={p.statut} onChange={e => updateStatut(p.id, e.target.value)} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, width: "auto" }}>
                  {PROSPECTION_STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 11, fontWeight: 700, color: interetColor[p.interet] }}>{p.interet}</span>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Script utilisé : {p.scriptUtilise} · {p.date}</div>
              <button onClick={() => convertToClient(p)} style={{ ...iconBtn, marginTop: 8, width: "100%", color: C.greenLight, borderColor: C.green }}>
                ✓ Convertir en client (CRM)
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- TAB: PROSPECTION TERRAIN ---------------------------------- */
function TabProspectionTerrain({ agency }) {
  const [openService, setOpenService] = useState(null);
  const [openMethode, setOpenMethode] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ background: C.cardAlt }}>
        <div style={{ fontSize: 13 }}>🚪 Guide complet pour approcher, convaincre et convertir des entreprises physiques (boutiques, restaurants, PME…) en face à face. Une fiche par service : qui viser, quoi montrer, quoi dire.</div>
      </Card>

      <button onClick={() => generateProspectionPDF(agency)}
        style={{ ...btnGold, justifyContent: "center" }}>
        <FileText size={14} /> Télécharger le guide complet en PDF
      </button>

      <div>
        <div onClick={() => setOpenMethode(!openMethode)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <H2>Méthode universelle en 7 étapes</H2>
          {openMethode ? <ChevronDown size={18} color={C.muted} /> : <ChevronRight size={18} color={C.muted} />}
        </div>
        {openMethode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {METHODE_TERRAIN.map((m, i) => (
              <Card key={i}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: C.goldLight, marginBottom: 6 }}>{i + 1}. {m.titre}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {m.points.map((p, j) => <div key={j} style={{ fontSize: 12.5, color: C.text }}>• {p}</div>)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {Object.entries(PROSPECTION_GUIDE).map(([categorie, services]) => (
        <div key={categorie}>
          <H2>{categorie}</H2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {services.map(s => {
              const open = openService === s.name;
              return (
                <Card key={s.name}>
                  <div onClick={() => setOpenService(open ? null : s.name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</div>
                    {open ? <ChevronDown size={16} color={C.muted} /> : <ChevronRight size={16} color={C.muted} />}
                  </div>
                  {open && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                      <div><Eyebrow>Cible idéale</Eyebrow><div style={{ fontSize: 12.5 }}>{s.cible}</div></div>
                      <div><Eyebrow>Portefeuille à montrer</Eyebrow><div style={{ fontSize: 12.5 }}>{s.portfolio}</div></div>
                      <div><Eyebrow>Accroche</Eyebrow><div style={{ fontSize: 12.5, fontStyle: "italic", color: C.goldLight }}>"{s.accroche}"</div></div>
                      <div><Eyebrow>Objection fréquente</Eyebrow><div style={{ fontSize: 12.5, color: C.rustLight }}>{s.objection}</div></div>
                      <div><Eyebrow>Réponse</Eyebrow><div style={{ fontSize: 12.5 }}>{s.reponse}</div></div>
                      {s.script && (
                        <div>
                          <Eyebrow>Script complet — du début à la fin</Eyebrow>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
                            {s.script.map((step, i) => (
                              <div key={i} style={{ fontSize: 12, display: "flex", gap: 6 }}>
                                <span style={{ color: C.gold, fontWeight: 700 }}>{i + 1}.</span> {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- TAB: ACADÉMIE GRATUITE ---------------------------------- */
function TabAcademie() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ color: C.muted, fontSize: 12.5 }}>Formations officielles et gratuites, spécifiques à notre domaine (marketing digital, publicité, e-commerce, IA).</div>
      {ACADEMIE.map(a => (
        <Card key={a.name}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</span>
            <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: C.goldLight, display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>Ouvrir <ExternalLink size={12} /></a>
          </div>
          <div style={{ fontSize: 12.5, marginTop: 6 }}>{a.desc}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.greenLight, marginTop: 6 }}>
            <Award size={13} /> {a.certif}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------------------------- TAB: TARIFS ---------------------------------- */
function TabTarifs({ pricing }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <H2>Formations & Coaching</H2>
        <Card><PriceTable rows={pricing.formations} /></Card>
      </div>
      <div>
        <H2>Prestations techniques & créatives</H2>
        <Card>
          {pricing.prestations.map(p => (
            <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span>{p.name}</span><span style={{ color: C.goldLight, fontWeight: 700 }}>{p.price}</span>
            </div>
          ))}
        </Card>
      </div>
      <div>
        <H2>Packs stratégiques</H2>
        <Card><PriceTable rows={pricing.packs} /></Card>
      </div>
    </div>
  );
}
function PriceTable({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 11, color: C.muted, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ flex: 2 }}>Offre</div><div style={{ flex: 1, textAlign: "right" }}>En ligne</div><div style={{ flex: 1, textAlign: "right" }}>Présentiel</div>
      </div>
      {rows.map(r => (
        <div key={r.name} style={{ display: "flex", fontSize: 12.5, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ flex: 2 }}>{r.name}</div>
          <div style={{ flex: 1, textAlign: "right", color: C.goldLight, fontWeight: 700 }}>{fcfa(r.online)}</div>
          <div style={{ flex: 1, textAlign: "right", color: C.muted }}>{r.presentiel ? fcfa(r.presentiel) : (r.note || "—")}</div>
        </div>
      ))}
    </div>
  );
}

/* Éditeur générique pour les 3 listes de tarifs (Packs, Formations, Prestations) dans Administration */
function PricingListEditor({ title, rows, onChange, priceMode }) {
  const isText = priceMode === "text";
  const [newRow, setNewRow] = useState(isText ? { name: "", price: "" } : { name: "", online: "", presentiel: "", note: "" });

  function updateRow(idx, patch) {
    onChange(rows.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }
  function addRow() {
    if (!newRow.name.trim()) return;
    if (isText) {
      onChange([...rows, { name: newRow.name, price: newRow.price }]);
      setNewRow({ name: "", price: "" });
    } else {
      onChange([...rows, {
        name: newRow.name,
        online: Number(newRow.online) || 0,
        presentiel: newRow.presentiel === "" ? null : Number(newRow.presentiel),
        note: newRow.note || undefined,
      }]);
      setNewRow({ name: "", online: "", presentiel: "", note: "" });
    }
  }

  return (
    <Card style={{ marginBottom: 14 }}>
      <Eyebrow>{title}</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {rows.map((r, idx) => (
          <div key={idx} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", background: C.cardAlt, borderRadius: 8, padding: 8 }}>
            <input value={r.name} onChange={e => updateRow(idx, { name: e.target.value })} style={{ ...inputStyle, flex: "1 1 160px" }} placeholder="Nom" />
            {isText ? (
              <input value={r.price} onChange={e => updateRow(idx, { price: e.target.value })} style={{ ...inputStyle, flex: "1 1 140px" }} placeholder="Prix (texte libre)" />
            ) : (
              <>
                <input type="number" value={r.online ?? ""} onChange={e => updateRow(idx, { online: Number(e.target.value) || 0 })} style={{ ...inputStyle, width: 100 }} placeholder="En ligne" />
                <input type="number" value={r.presentiel ?? ""} onChange={e => updateRow(idx, { presentiel: e.target.value === "" ? null : Number(e.target.value) })} style={{ ...inputStyle, width: 100 }} placeholder="Présentiel" />
                <input value={r.note || ""} onChange={e => updateRow(idx, { note: e.target.value })} style={{ ...inputStyle, flex: "1 1 100px" }} placeholder="Note (ex: Sur devis)" />
              </>
            )}
          </div>
        ))}
        {rows.length === 0 && <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 10 }}>Aucune offre pour l'instant.</div>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
        <input value={newRow.name} onChange={e => setNewRow({ ...newRow, name: e.target.value })} style={{ ...inputStyle, flex: "1 1 160px" }} placeholder="Nouvelle offre" />
        {isText ? (
          <input value={newRow.price} onChange={e => setNewRow({ ...newRow, price: e.target.value })} style={{ ...inputStyle, flex: "1 1 140px" }} placeholder="Prix" />
        ) : (
          <>
            <input type="number" value={newRow.online} onChange={e => setNewRow({ ...newRow, online: e.target.value })} style={{ ...inputStyle, width: 100 }} placeholder="En ligne" />
            <input type="number" value={newRow.presentiel} onChange={e => setNewRow({ ...newRow, presentiel: e.target.value })} style={{ ...inputStyle, width: 100 }} placeholder="Présentiel" />
          </>
        )}
        <button onClick={addRow} style={{ ...iconBtn, padding: "0 12px" }}><Plus size={14} /></button>
      </div>
    </Card>
  );
}

/* ---------------------------------- TAB: LIENS PARTAGÉS ---------------------------------- */
function TabLiens({ links, setLinks, team }) {
  const [form, setForm] = useState({ label: "", url: "", addedBy: team[0]?.id || "" });
  function add() {
    if (!form.label.trim() || !form.url.trim()) return;
    setLinks([...links, { ...form, id: Date.now() }]);
    setForm({ label: "", url: "", addedBy: team[0]?.id || "" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: C.muted, fontSize: 12.5 }}>Cet espace est partagé entre les 3 membres — tout ce que l'un ajoute, les autres le voient.</div>
      <Card>
        <Eyebrow>Ajouter un lien utile</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <input placeholder="Nom du lien / outil" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={inputStyle} />
          <input placeholder="https://…" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} style={inputStyle} />
          <select value={form.addedBy} onChange={e => setForm({ ...form, addedBy: e.target.value })} style={inputStyle}>
            {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button onClick={add} style={btnGold}><Plus size={14} /> Ajouter</button>
        </div>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Aucun lien ajouté pour l'instant.</div>}
        {links.slice().reverse().map(l => (
          <Card key={l.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{l.label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Ajouté par {team.find(m => m.id === l.addedBy)?.name}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: C.goldLight }}><ExternalLink size={16} /></a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- FORMATION: GUIDES EDITABLES ---------------------------------- */
// Format simple et editable dans Administration :
// "## Titre" = en-tete de section — "- texte" = puce — ligne normale = paragraphe
const DEFAULT_GUIDES = {
  catherine: `## Ta posture
Tu es le premier visage professionnel de KBS DIGITAL AGENCY.
- Tu réponds vite — moins de 30 min en journée. Un client qui attend va voir ailleurs.
- Tu ne mens jamais sur un délai, un prix ou une prestation.
- Tu gardes le contrôle poli de la conversation — c'est toi qui poses les questions.

## Les 3 canaux, 3 façons de parler
- Groupes / commentaires publics : réponse courte et chaleureuse, jamais commerciale. Objectif : faire passer en privé.
- WhatsApp privé : ici se fait 90% du travail réel. Toujours commencer par le prénom.
- Appel vocal/vidéo : réservé aux clients chauds (Packs 3, 4, 6, 7 ou budget important).

## La structure d'une conversation qui closes
- 1. Accroche — remercier + montrer qu'on a compris la situation.
- 2. Qualification — 2-3 questions AVANT d'envoyer un tarif (besoin, budget, urgence).
- 3. Offre adaptée — jamais toute la liste de prix, 1 ou 2 solutions maximum.
- 4. Objection — répondre par une question, jamais une excuse.
- 5. Closing — voir ci-dessous.

## Scripts prêts à adapter (avec nos vrais tarifs)
- Petit budget : « Pack 1 (Formation + Vente) à partir de 45 000 FCFA. »
- Présence pro complète : « Pack 4 (Présence Pro) à 170 000 FCFA. »
- Hésitant : « On peut commencer petit : une page de vente à 25 000 FCFA. »
- Relance douce : « Je reviens vers vous — vous avez eu le temps de regarder l'offre ? »

## Gérer les objections
- « C'est trop cher » → « Regardons ensemble ce qui compte le plus pour vous. »
- « Je vais réfléchir » → « Qu'est-ce qui vous ferait hésiter précisément ? »
- « Pas confiance » → Envoyer un exemple concret + devis/reçu officiel dès le 1er échange.
- « Un autre moins cher » → « La différence : un suivi réel, pas juste une livraison. »

## Le closing
- Par choix : « On part sur la version en ligne ou en présentiel ? »
- Par urgence légitime : « Je peux vous bloquer une place cette semaine. »
- Par confirmation simple : « Je vous envoie le devis, vous confirmez et on démarre. »
- Après un closing réussi : toujours envoyer un devis/reçu PDF dans les 10 minutes.

## Finance & Trésorerie
- Chaque paiement reçu = reçu PDF envoyé immédiatement.
- Chaque devis a une date de validité claire.
- Relance de paiement en retard : ferme mais respectueuse.
- Un message = un objectif — ne jamais mélanger technique et argent.

## Checklist quotidienne
- Tous les messages de la veille ont une réponse
- Aucun message resté plus de 30 min sans réponse
- Chaque prospect qualifié avant envoi d'un prix
- Chaque vente confirmée = devis/reçu PDF envoyé le jour même
- Chaque impayé de +3 jours = relance envoyée`,

  sacko: `## Ta posture
Double casquette : coordonner l'équipe et produire du visuel professionnel.
- Règle : auto-formation active — pratique le jour même sur un vrai projet client.
- 1 nouvel outil appris = 1 application immédiate sur un visuel réel.

## Applications & sites gratuits — Graphisme
- Canva (gratuit) — posts, carrousels, présentations
- Adobe Express — visuels rapides, retouche simple
- Figma (gratuit) — maquettes, pages de vente
- Remove.bg — détourage d'images en 1 clic
- Inkscape (gratuit) — logos, vectoriel
- CapCut — montage vidéo courts formats

## Intelligence Artificielle gratuite — Graphisme
- Canva IA — génération d'image + suppression d'arrière-plan
- Microsoft Designer — gratuit, bannières et posts LinkedIn/Instagram
- Adobe Firefly — génération d'image utilisable commercialement
- Leonardo AI / Krea.ai — génération plus créative, contrôle avancé
- Claude ou ChatGPT — prompts, brief, idées de concepts

## Outils gratuits — Coordination
- Trello (gratuit) — Kanban visuel d'équipe
- Notion (gratuit) — centraliser notes, plannings, documents
- Google Agenda + Google Sheets — suivi de planning
- WhatsApp Business — messages automatiques, catalogue

## Chaînes YouTube à suivre
- Balo — identité visuelle, redesign de logo
- Emmanuel Correia — Photoshop, Illustrator, InDesign
- AdobeFrance — nouveautés et astuces officielles Adobe
- PiXimperfect (anglais) — Photoshop niveau pro

## Mots-clés YouTube / TikTok
- graphisme débutant tuto / Canva tutoriel français
- règles de composition design / théorie des couleurs
- identité visuelle marque tuto / design post Instagram Canva
- CapCut tutoriel français / motion design débutant
- Canva IA astuce / Adobe Firefly tutoriel
- Trello tutoriel français débutant / Notion organisation équipe
- tendances graphisme 2026

## Plan d'auto-formation — 4 premières semaines
- Semaine 1 — Bases Canva + configurer un Trello simple pour l'équipe.
- Semaine 2 — Identité visuelle : refaire un visuel client existant.
- Semaine 3 — IA appliquée sur un client réel.
- Semaine 4 — Coordination avancée : planning complet sur Trello/Notion.

## Checklist hebdomadaire
- Au moins 1 nouvelle technique apprise et appliquée sur un vrai visuel
- Planning de l'équipe à jour
- Une chaîne YouTube ou un mot-clé exploré cette semaine
- Un visuel produit avec l'aide d'une IA, testé et validé`,

  oumou: `## Ta posture
Tu captes l'attention en 3 secondes — un contenu qui n'accroche pas est un contenu mort.

## Les fondamentaux d'un bon contenu
- Le hook — les 3 premières secondes, jamais un simple « Bonjour à tous ».
- Le storytelling — problème → solution → résultat.
- Un seul message par contenu.
- L'appel à l'action clair.
- La régularité — 3x/semaine bat 1x/mois parfait.

## Outils gratuits — Création
- Canva (gratuit) — posts, carrousels, miniatures
- CapCut — montage Reels/TikTok, sous-titres automatiques
- InShot — alternative simple sur mobile
- Adobe Express — visuels rapides par réseau

## Intelligence Artificielle gratuite — Contenu
- Claude ou ChatGPT — idées de hooks, scripts de Reel
- Canva Magic Media — génération d'images IA
- Microsoft Designer / Bing Image Creator — génération gratuite
- Lumen5 — transforme un texte en vidéo courte
- Conseil : utilise l'IA pour le 1er jet, réécris avec ta propre voix.

## Chaînes YouTube à suivre
- Les Mots Magiques — fondamentaux du copywriting
- Yann Leonardi — copywriting, storytelling
- Dan Noël — algorithmes Instagram, TikTok, LinkedIn

## Mots-clés YouTube / TikTok
- copywriting débutant / comment écrire une accroche
- storytelling réseaux sociaux / légende Instagram qui convertit
- créer du contenu TikTok débutant / script Reel Instagram
- hook vidéo première seconde / content creator tips
- algorithme TikTok 2026 / algorithme Instagram
- ChatGPT idées de contenu / prompt copywriting IA
- tendances TikTok 2026

## Plan d'auto-formation — 4 premières semaines
- Semaine 1 — Les hooks : réécrire les 5 derniers posts KBS.
- Semaine 2 — Storytelling : 3 posts problème → solution → résultat.
- Semaine 3 — Formats courts : maîtriser CapCut, 2 Reels test.
- Semaine 4 — IA appliquée : 10 idées générées puis réécrites.

## Checklist par contenu
- Le hook donne envie de rester dans les 3 premières secondes
- Un seul message clair
- Appel à l'action explicite à la fin
- Le texte sonne naturel, pas généré par IA
- Le format est adapté à la plateforme`,
};

function renderGuideText(text) {
  const lines = (text || "").split("\n");
  const blocks = [];
  let list = [];
  function flushList() {
    if (list.length) { blocks.push({ type: "list", items: list }); list = []; }
  }
  lines.forEach((line) => {
    const t = line.trim();
    if (!t) { flushList(); return; }
    if (t.startsWith("## ")) { flushList(); blocks.push({ type: "heading", text: t.slice(3) }); }
    else if (t.startsWith("- ")) { list.push(t.slice(2)); }
    else { flushList(); blocks.push({ type: "p", text: t }); }
  });
  flushList();
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "heading") return <Eyebrow key={i}>{b.text}</Eyebrow>;
        if (b.type === "list") return (
          <ul key={i} style={{ margin: "0 0 12px", paddingLeft: 18 }}>
            {b.items.map((it, j) => <li key={j} style={{ fontSize: 13, color: C.text, marginBottom: 5, lineHeight: 1.45 }}>{it}</li>)}
          </ul>
        );
        return <p key={i} style={{ fontSize: 13, color: C.text, marginBottom: 10, lineHeight: 1.5 }}>{b.text}</p>;
      })}
    </>
  );
}

/* ---------------------------------- TAB: FORMATION ---------------------------------- */
const FORMATION_SECTIONS = [
  { id: "guides", label: "Guide" },
  { id: "liens", label: "Liens" },
];

// Les sections de Formation suivent l'equipe : tout nouveau membre recrute dans
// Administration obtient automatiquement son guide et ses liens, deverrouilles
// par son propre code personnel.
function TabFormation({ team, codes, guides, formationLiens }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [unlockedId, setUnlockedId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [section, setSection] = useState("guides");

  const labels = Object.fromEntries(team.map(m => [m.id, m.name]));

  function tryUnlock() {
    // Comparaison stricte : le code de secours ne donne PAS acces aux guides des
    // autres membres. Seul le code Administration ouvre tout (vue CEO).
    if (codeMatchesStrict(code, codes.admin)) {
      setUnlockedId("admin"); setError(false); setCode(""); setViewing(team[0]?.id || null);
      return;
    }
    const member = team.find(m => codeMatchesStrict(code, m.code));
    if (member) {
      setUnlockedId(member.id); setError(false); setCode(""); setViewing(member.id);
      return;
    }
    setError(true);
  }

  if (!unlockedId) {
    return (
      <div>
        <H2>Formation</H2>
        <Card>
          <Eyebrow>Ton espace personnel</Eyebrow>
          <div style={{ color: C.muted, fontSize: 12, margin: "6px 0 10px" }}>Entre ton code personnel pour voir ton guide et tes liens — chaque guide est privé. Seul le code Administration ouvre ceux de toute l'équipe.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="password" placeholder="Ton code" value={code}
              onChange={e => { setCode(e.target.value); setError(false); }}
              onKeyDown={e => { if (e.key === "Enter") tryUnlock(); }}
              style={{ ...inputStyle, flex: 1 }} />
            <button onClick={tryUnlock} style={{ ...iconBtn, padding: "0 16px" }}>OK</button>
          </div>
          {error && <div style={{ color: C.rustLight, fontSize: 11, marginTop: 6 }}>Code incorrect.</div>}
        </Card>
      </div>
    );
  }

  const availableGuides = unlockedId === "admin" ? team.map(m => m.id) : [unlockedId];
  const activeId = (viewing && availableGuides.includes(viewing)) ? viewing : availableGuides[0];
  const liens = (formationLiens || {})[activeId] || [];
  const guideText = (guides || {})[activeId] || "";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <H2>Formation</H2>
        <button onClick={() => { setUnlockedId(null); setViewing(null); }} style={iconBtn}><Lock size={12} /></button>
      </div>
      {availableGuides.length > 1 && (
        <div className="kbs-navbar" style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
          {availableGuides.map(gid => (
            <button key={gid} onClick={() => setViewing(gid)} style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
              border: `1px solid ${activeId === gid ? C.gold : C.border}`,
              background: activeId === gid ? "rgba(193,95,60,0.16)" : "transparent",
              color: activeId === gid ? C.goldLight : C.muted,
            }}>{labels[gid]}</button>
          ))}
        </div>
      )}
      <div style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 800, fontSize: 17, marginBottom: 2 }}>Formation de {labels[activeId] || "—"}</div>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>KBS DIGITAL AGENCY</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {FORMATION_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            flex: 1, padding: "8px 10px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            border: `1px solid ${section === s.id ? C.gold : C.border}`,
            background: section === s.id ? "rgba(193,95,60,0.16)" : "transparent",
            color: section === s.id ? C.goldLight : C.muted,
          }}>{s.label}</button>
        ))}
      </div>

      {section === "guides" && (
        guideText.trim() === "" ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Aucun guide pour l'instant. Le CEO peut en ajouter un depuis Administration.</div>
        ) : <Card>{renderGuideText(guideText)}</Card>
      )}

      {section === "liens" && (
        liens.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Aucun lien ajoute pour l'instant.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {liens.map(l => (
              <Card key={l.id}>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>{l.label}</div>
                <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: C.goldLight, display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700 }}>Ouvrir <ExternalLink size={13} /></a>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}

/* ---------------------------------- TAB: ADMINISTRATION ---------------------------------- */
/* ---------------------------------- TAB: CAISSE PERSO (privée CEO, sous Administration) ---------------------------------- */
function TabCaissePerso({ caisse, setCaisse }) {
  const ops = caisse?.ops || [];
  const debts = caisse?.debts || [];
  const nowD = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const hhmm = (d) => d.toTimeString().slice(0, 5);
  const fmt = (n) => Math.abs(n).toLocaleString("fr-FR").replace(/\s/g, " ");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const monthLabel = (ym) => { const p = ym.split("-"); return cap(new Date(p[0], p[1] - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })); };

  const [view, setView] = useState("ops");
  const [masked, setMasked] = useState(true);
  const [viewMonth, setViewMonth] = useState(iso(nowD).slice(0, 7));

  const [oType, setOType] = useState("out");
  const [oMontant, setOMontant] = useState("");
  const [oLabel, setOLabel] = useState("");
  const [oDate, setODate] = useState(iso(nowD));
  const [oTime, setOTime] = useState(hhmm(nowD));
  const [editOp, setEditOp] = useState(null);

  const [dDir, setDDir] = useState("owed");
  const [dMontant, setDMontant] = useState("");
  const [dPrenom, setDPrenom] = useState("");
  const [dNom, setDNom] = useState("");
  const [dNumero, setDNumero] = useState("");
  const [dMotif, setDMotif] = useState("");
  const [dDate, setDDate] = useState(iso(nowD));
  const [dTime, setDTime] = useState(hhmm(nowD));
  const [editDebt, setEditDebt] = useState(null);

  function setOpsList(next) { setCaisse({ ...caisse, ops: next, debts }); }
  function setDebtsList(next) { setCaisse({ ...caisse, ops, debts: next }); }
  function prefillOp() { const n = new Date(); setODate(iso(n)); setOTime(hhmm(n)); }
  function prefillDebt() { const n = new Date(); setDDate(iso(n)); setDTime(hhmm(n)); }

  function saveOp() {
    const m = parseInt(oMontant, 10);
    if (!m || m <= 0) return;
    const label = oLabel.trim() || (oType === "out" ? "Dépense" : "Entrée");
    if (editOp) {
      setOpsList(ops.map(o => o.id === editOp ? { id: editOp, type: oType, montant: m, label, date: oDate, time: oTime } : o));
      setEditOp(null);
    } else {
      setOpsList([...ops, { id: Date.now(), type: oType, montant: m, label, date: oDate, time: oTime }]);
    }
    setViewMonth(oDate.slice(0, 7));
    setOMontant(""); setOLabel(""); setOType("out"); prefillOp();
  }
  function startEditOp(o) { setEditOp(o.id); setOType(o.type); setOMontant(String(o.montant)); setOLabel(o.label); setODate(o.date); setOTime(o.time); }
  function cancelEditOp() { setEditOp(null); setOType("out"); setOMontant(""); setOLabel(""); prefillOp(); }
  function delOp(id) { setOpsList(ops.filter(o => o.id !== id)); if (editOp === id) cancelEditOp(); }

  function saveDebt() {
    const m = parseInt(dMontant, 10);
    if (!m || m <= 0) return;
    const base = { dir: dDir, montant: m, prenom: dPrenom.trim(), nom: dNom.trim(), numero: dNumero.trim(), motif: dMotif.trim(), date: dDate, time: dTime };
    if (editDebt) {
      const old = debts.find(x => x.id === editDebt);
      setDebtsList(debts.map(x => x.id === editDebt ? { ...base, id: editDebt, settled: old ? old.settled : false, settledDate: old ? old.settledDate : null } : x));
      setEditDebt(null);
    } else {
      setDebtsList([...debts, { ...base, id: Date.now(), settled: false, settledDate: null }]);
    }
    clearDebtForm();
  }
  function clearDebtForm() { setDMontant(""); setDPrenom(""); setDNom(""); setDNumero(""); setDMotif(""); setDDir("owed"); prefillDebt(); }
  function startEditDebt(d) { setEditDebt(d.id); setDDir(d.dir); setDMontant(String(d.montant)); setDPrenom(d.prenom || ""); setDNom(d.nom || ""); setDNumero(d.numero || ""); setDMotif(d.motif || ""); setDDate(d.date); setDTime(d.time); }
  function cancelEditDebt() { setEditDebt(null); clearDebtForm(); }
  function toggleSettle(id) { setDebtsList(debts.map(d => d.id === id ? { ...d, settled: !d.settled, settledDate: !d.settled ? iso(new Date()) : null } : d)); }
  function delDebt(id) { setDebtsList(debts.filter(d => d.id !== id)); if (editDebt === id) cancelEditDebt(); }
  function shiftMonth(delta) { const p = viewMonth.split("-"); setViewMonth(iso(new Date(p[0], p[1] - 1 + delta, 1)).slice(0, 7)); }

  let tin = 0, tout = 0;
  ops.forEach(o => { if (o.type === "in") tin += o.montant; else tout += o.montant; });
  let settledOwed = 0, settledIOwe = 0, openOwed = 0, openIOwe = 0;
  debts.forEach(d => {
    if (d.settled) { if (d.dir === "owed") settledOwed += d.montant; else settledIOwe += d.montant; }
    else { if (d.dir === "owed") openOwed += d.montant; else openIOwe += d.montant; }
  });
  const solde = (tin - tout) + settledOwed - settledIOwe;

  const monthOps = ops.filter(o => o.date.slice(0, 7) === viewMonth);
  let mIn = 0, mOut = 0; monthOps.forEach(o => { if (o.type === "in") mIn += o.montant; else mOut += o.montant; });
  const byDay = {}; monthOps.forEach(o => { (byDay[o.date] = byDay[o.date] || []).push(o); });
  const days = Object.keys(byDay).sort().reverse();
  const prettyDate = (d) => { const p = d.split("-"); const dt = new Date(p[0], p[1] - 1, p[2]); if (d === iso(new Date())) return "Aujourd'hui"; if (d === iso(new Date(Date.now() - 86400000))) return "Hier"; return dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); };
  const openDebts = debts.filter(d => !d.settled).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const doneDebts = debts.filter(d => d.settled).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  function genPDF() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const list = monthOps.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    doc.setFontSize(16); doc.setTextColor(193, 95, 60); doc.text("KBS — Caisse Perso", 14, 18);
    doc.setFontSize(11); doc.setTextColor(40, 40, 40); doc.text("Releve : " + monthLabel(viewMonth), 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [["Date", "Libelle", "Type", "Montant (FCFA)"]],
      body: list.map(o => [o.date.split("-").reverse().join("/"), o.label, o.type === "in" ? "Entree" : "Depense", (o.type === "in" ? "+" : "-") + fmt(o.montant)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [193, 95, 60] },
    });
    let y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 40) + 10;
    doc.setFontSize(11); doc.setTextColor(30, 120, 70); doc.text("Total entrees : +" + fmt(mIn) + " FCFA", 14, y);
    doc.setTextColor(180, 60, 45); doc.text("Total depenses : -" + fmt(mOut) + " FCFA", 14, y + 7);
    doc.setTextColor(20, 20, 20); doc.setFontSize(13); doc.text("Net du mois : " + ((mIn - mOut) >= 0 ? "+" : "-") + fmt(mIn - mOut) + " FCFA", 14, y + 16);
    doc.save("caisse-perso-" + viewMonth + ".pdf");
  }

  function debtCard(d) {
    const isOwed = d.dir === "owed"; const col = isOwed ? C.greenLight : C.rustLight;
    const name = ((d.prenom || "") + " " + (d.nom || "")).trim() || "Sans nom";
    return (
      <Card key={d.id} style={{ opacity: d.settled ? 0.6 : 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{name}{d.settled && <span style={{ fontSize: 11, fontWeight: 800, color: C.greenLight, marginLeft: 6 }}>· Réglée</span>}</div>
            {d.numero && <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{d.numero}</div>}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: col, whiteSpace: "nowrap" }}>{(isOwed ? "+" : "−") + (masked ? "•••" : fmt(d.montant))}</div>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{(isOwed ? "On me doit" : "Je dois")}{d.motif ? " · " + d.motif : ""} · {d.date.split("-").reverse().join("/")} {d.time}</div>
        <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={() => toggleSettle(d.id)} style={{ ...iconBtn, padding: "7px 11px", color: d.settled ? C.muted : C.greenLight }}>{d.settled ? "↺ Remettre en cours" : "✓ Marquer réglée"}</button>
          <button onClick={() => startEditDebt(d)} style={{ ...iconBtn, padding: "7px 11px" }}>Modifier</button>
          <button onClick={() => delDebt(d.id)} style={{ ...iconBtn, padding: "7px 11px", color: C.rustLight }}>Supprimer</button>
        </div>
      </Card>
    );
  }

  const seg = (activeCol) => ({ flex: 1, padding: 9, border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 13 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: C.muted, fontSize: 11.5 }}>Espace privé — tes dépenses, entrées et dettes personnelles, séparées de la trésorerie de l'agence.</div>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>Solde disponible (total)</span>
          <button onClick={() => setMasked(!masked)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 0 }}>{masked ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: solde < 0 ? C.rustLight : C.text }}>{masked ? "•••••" : fmt(solde)} <span style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>FCFA</span></div>
        <div style={{ display: "flex", gap: 22, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: C.muted }}>Entrées<div style={{ fontSize: 14, fontWeight: 700, color: C.greenLight, marginTop: 2 }}>{masked ? "•••••" : fmt(tin + settledOwed)}</div></div>
          <div style={{ fontSize: 12, color: C.muted }}>Dépenses<div style={{ fontSize: 14, fontWeight: 700, color: C.rustLight, marginTop: 2 }}>{masked ? "•••••" : fmt(tout + settledIOwe)}</div></div>
        </div>
      </Card>

      <div style={{ display: "flex", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4 }}>
        <button onClick={() => setView("ops")} style={{ ...seg(), background: view === "ops" ? C.gold : "transparent", color: view === "ops" ? "#FFFFFF" : C.muted }}>Opérations</button>
        <button onClick={() => setView("debts")} style={{ ...seg(), background: view === "debts" ? C.gold : "transparent", color: view === "debts" ? "#FFFFFF" : C.muted }}>Dettes</button>
      </div>

      {view === "ops" && (<>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Eyebrow>{editOp ? "Modifier l'opération" : "Nouvelle opération"}</Eyebrow>
            {editOp && <button onClick={cancelEditOp} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Annuler</button>}
          </div>
          <div style={{ display: "flex", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, marginBottom: 8 }}>
            <button onClick={() => setOType("out")} style={{ ...seg(), background: oType === "out" ? "rgba(192,57,43,0.15)" : "transparent", color: oType === "out" ? C.rustLight : C.muted }}>− Dépense</button>
            <button onClick={() => setOType("in")} style={{ ...seg(), background: oType === "in" ? "rgba(46,139,111,0.15)" : "transparent", color: oType === "in" ? C.greenLight : C.muted }}>+ Entrée</button>
          </div>
          <input type="number" inputMode="numeric" placeholder="Montant (FCFA)" value={oMontant} onChange={e => setOMontant(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <input placeholder="Libellé (ex: taxi, carburant, achat...)" value={oLabel} onChange={e => setOLabel(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="date" value={oDate} onChange={e => setODate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="time" value={oTime} onChange={e => setOTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <button onClick={saveOp} style={btnGold}>{editOp ? "Mettre à jour" : "Enregistrer"}</button>
        </Card>

        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px" }}>
          <button onClick={() => shiftMonth(-1)} style={{ ...iconBtn, padding: "6px 9px" }}><ChevronLeft size={16} /></button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, textTransform: "capitalize" }}>{monthLabel(viewMonth)}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: (mIn - mOut) < 0 ? C.rustLight : C.greenLight }}>{masked ? "•••••" : ("Net " + ((mIn - mOut) >= 0 ? "+" : "−") + fmt(mIn - mOut) + " FCFA")}</div>
          </div>
          <button onClick={() => shiftMonth(1)} style={{ ...iconBtn, padding: "6px 9px" }}><ChevronRight size={16} /></button>
        </div>

        <button onClick={genPDF} style={{ ...iconBtn, width: "100%", padding: 11, color: C.gold, borderColor: C.gold, borderStyle: "dashed", display: "flex", justifyContent: "center", gap: 8, fontWeight: 700 }}><FileText size={15} /> Télécharger le relevé du mois (PDF)</button>

        {days.length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: 20 }}>Aucune opération en {monthLabel(viewMonth).toLowerCase()}.</div>}
        {days.map(d => {
          const list = byDay[d].slice().sort((a, b) => b.time.localeCompare(a.time));
          let sin = 0, sout = 0; list.forEach(e => { if (e.type === "in") sin += e.montant; else sout += e.montant; });
          const dayS = sin - sout;
          return (
            <div key={d}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 2px 6px" }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, textTransform: "capitalize" }}>{prettyDate(d)}</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: dayS < 0 ? C.rustLight : C.greenLight }}>{masked ? "•••••" : ((dayS >= 0 ? "+" : "−") + fmt(dayS) + " FCFA")}</span>
              </div>
              {list.map(o => {
                const isIn = o.type === "in"; const col = isIn ? C.greenLight : C.rustLight;
                return (
                  <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{o.label}</div>
                      <div style={{ fontSize: 11.5, color: C.muted }}>{o.time}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: col, whiteSpace: "nowrap" }}>{(isIn ? "+" : "−") + (masked ? "•••" : fmt(o.montant))}</span>
                    <button onClick={() => startEditOp(o)} style={{ ...iconBtn, padding: "5px 7px" }}><Pencil size={13} /></button>
                    <button onClick={() => delOp(o.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </>)}

      {view === "debts" && (<>
        <div style={{ display: "flex", gap: 10 }}>
          <Card style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>On me doit</div><div style={{ fontSize: 18, fontWeight: 800, color: C.greenLight, marginTop: 5 }}>{masked ? "•••••" : fmt(openOwed)} F</div></Card>
          <Card style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Je dois</div><div style={{ fontSize: 18, fontWeight: 800, color: C.rustLight, marginTop: 5 }}>{masked ? "•••••" : fmt(openIOwe)} F</div></Card>
        </div>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Eyebrow>{editDebt ? "Modifier la dette" : "Nouvelle dette"}</Eyebrow>
            {editDebt && <button onClick={cancelEditDebt} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Annuler</button>}
          </div>
          <div style={{ display: "flex", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, marginBottom: 8 }}>
            <button onClick={() => setDDir("owed")} style={{ ...seg(), background: dDir === "owed" ? "rgba(46,139,111,0.15)" : "transparent", color: dDir === "owed" ? C.greenLight : C.muted }}>On me doit</button>
            <button onClick={() => setDDir("iowe")} style={{ ...seg(), background: dDir === "iowe" ? "rgba(192,57,43,0.15)" : "transparent", color: dDir === "iowe" ? C.rustLight : C.muted }}>Je dois</button>
          </div>
          <input type="number" inputMode="numeric" placeholder="Montant (FCFA)" value={dMontant} onChange={e => setDMontant(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input placeholder="Prénom (facultatif)" value={dPrenom} onChange={e => setDPrenom(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input placeholder="Nom (facultatif)" value={dNom} onChange={e => setDNom(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <input placeholder="Numéro (facultatif)" value={dNumero} onChange={e => setDNumero(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <input placeholder="Motif (facultatif)" value={dMotif} onChange={e => setDMotif(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="date" value={dDate} onChange={e => setDDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="time" value={dTime} onChange={e => setDTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <button onClick={saveDebt} style={btnGold}>{editDebt ? "Mettre à jour" : "Enregistrer la dette"}</button>
        </Card>

        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", margin: "4px 2px" }}>En cours ({openDebts.length})</div>
        {openDebts.length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: 14 }}>Aucune dette en cours.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{openDebts.map(d => debtCard(d))}</div>
        {doneDebts.length > 0 && <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", margin: "14px 2px 4px" }}>Réglées ({doneDebts.length})</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{doneDebts.map(d => debtCard(d))}</div>
      </>)}
    </div>
  );
}

/* ---------------------------------- TAB: ARCHIVES ---------------------------------- */
// Historique fige, mois par mois. Chaque mois est archive automatiquement quand un
// nouveau mois commence (voir buildSnapshot dans App). Consultation en lecture seule.
function TabArchives({ archives, period, team }) {
  const list = (archives || []).slice().sort((a, b) => b.period.localeCompare(a.period)); // plus recent en premier
  const monthLabel = (ym) => {
    const p = (ym || "").split("-");
    if (p.length < 2) return ym || "—";
    const d = new Date(Number(p[0]), Number(p[1]) - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return d.charAt(0).toUpperCase() + d.slice(1);
  };
  const [openId, setOpenId] = useState(list[0]?.id || list[0]?.period || null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <Eyebrow>Archives mensuelles</Eyebrow>
        <div style={{ color: C.muted, fontSize: 12.5, marginTop: 4 }}>
          À chaque changement de mois, tout est mis de côté ici (clients &amp; CA, trésorerie &amp; dépenses, dettes, objectif atteint) puis les compteurs repartent à zéro. Appuie sur un mois pour revoir tout ce qui s'est passé, sans exception.
        </div>
        <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Mois en cours : <b style={{ color: C.goldLight }}>{monthLabel(period)}</b> (encore en direct, pas encore archivé).</div>
      </Card>

      {list.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <Archive size={26} color={C.muted} style={{ margin: "4px auto 8px", display: "block" }} />
          <div style={{ color: C.muted, fontSize: 13 }}>Aucune archive pour l'instant. Le premier mois sera archivé automatiquement au changement de mois.</div>
        </Card>
      )}

      {list.map(a => {
        const key = a.id || a.period;
        const open = openId === key;
        const clients = a.clients || [];
        const expenses = a.expenses || [];
        const dettes = a.dettes || [];
        return (
          <Card key={key}>
            <div onClick={() => setOpenId(open ? null : key)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <div>
                <div style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 800, fontSize: 16, textTransform: "capitalize" }}>{monthLabel(a.period)}</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>CA {fcfa(a.totalCA)} · {clients.length} client{clients.length > 1 ? "s" : ""}</div>
              </div>
              {open ? <ChevronDown size={18} color={C.gold} /> : <ChevronRight size={18} color={C.gold} />}
            </div>

            {open && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Résumé financier */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <ArchStat label="CA encaissé" value={fcfa(a.totalCA)} color={C.goldLight} />
                  <ArchStat label={`Commissions (${a.commissionRate ?? "—"}%)`} value={fcfa(a.totalCommission)} color={C.greenLight} />
                  <ArchStat label="Dépenses" value={fcfa(a.totalDepenses)} color={C.rustLight} />
                  <ArchStat label="Bénéfice net" value={fcfa(a.beneficeNet)} color={a.beneficeNet >= 0 ? C.greenLight : C.rustLight} />
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>Objectif atteint : <b style={{ color: C.goldLight }}>{a.pctObjectif}%</b> de {fcfa(a.goal)}</div>

                {/* Par personne */}
                {(a.byMember || []).some(m => m.ca > 0) && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Par personne</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(a.byMember || []).filter(m => m.ca > 0).map(m => (
                        <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                          <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: m.color, marginRight: 6 }} />{m.name} <span style={{ color: C.muted }}>· {m.rate}%</span></span>
                          <span style={{ color: C.muted }}>{fcfa(m.ca)} → <span style={{ color: C.greenLight }}>{fcfa(m.commission)}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clients du mois */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Clients &amp; CA ({clients.length})</div>
                  {clients.length === 0 && <div style={{ fontSize: 12, color: C.muted }}>Aucun client ce mois-là.</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {clients.map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, background: C.cardAlt, borderRadius: 8, padding: "6px 10px" }}>
                        <span>{c.prenom} {c.nom} <span style={{ color: C.muted }}>· {c.statut}</span></span>
                        <span style={{ fontWeight: 700, color: C.goldLight }}>{fcfa(c.montant)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dépenses du mois */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Trésorerie — dépenses ({expenses.length})</div>
                  {expenses.length === 0 && <div style={{ fontSize: 12, color: C.muted }}>Aucune dépense ce mois-là.</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {expenses.map((e, i) => (
                      <div key={e.id || i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, background: C.cardAlt, borderRadius: 8, padding: "6px 10px" }}>
                        <span>{e.label || e.nom || e.description || "Dépense"}</span>
                        <span style={{ fontWeight: 700, color: C.rustLight }}>{fcfa(e.montant)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dettes du mois */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Dettes &amp; rappels ({dettes.length})</div>
                  {dettes.length === 0 && <div style={{ fontSize: 12, color: C.muted }}>Aucune dette ce mois-là.</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dettes.map((d, i) => (
                      <div key={d.id || i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, background: C.cardAlt, borderRadius: 8, padding: "6px 10px" }}>
                        <span>{d.clientNom || "Dette"} <span style={{ color: C.muted }}>{d.statut ? "· " + d.statut : ""}</span></span>
                        <span style={{ fontWeight: 700, color: d.statut === "Payée" ? C.greenLight : C.goldLight }}>{fcfa(d.montantDu)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: 10.5, color: C.muted, textAlign: "right" }}>Archivé le {a.closedAt ? new Date(a.closedAt).toLocaleDateString("fr-FR") : "—"}</div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ArchStat({ label, value, color }) {
  return (
    <div style={{ background: C.cardAlt, borderRadius: 10, padding: "8px 10px" }}>
      <div style={{ fontSize: 10.5, color: C.muted }}>{label}</div>
      <div style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 800, fontSize: 14, color }}>{value}</div>
    </div>
  );
}

function TabAdministration({ section, caisse, setCaisse, team, setTeam, codes, setCodes, onResetAll, onCloseMonth, currentMonth, agency, setAgency, guides, setGuides, formationLiens, setFormationLiens, pricing, setPricing, commissionRate, setCommissionRate }) {
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  // Mois a archiver par defaut = le mois precedent (ex. aujourd'hui septembre -> "2026-08").
  const prevMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
  const [closeMonthValue, setCloseMonthValue] = useState(prevMonth);
  const [closeMonthStep, setCloseMonthStep] = useState(false);
  const [closeMonthDone, setCloseMonthDone] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", checklistText: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", checklistText: "", code: "", commissionPct: "" });
  const [rateForm, setRateForm] = useState(commissionRate);
  const [rateSaved, setRateSaved] = useState(false);
  const [codesForm, setCodesForm] = useState(codes);
  const [codesSaved, setCodesSaved] = useState(false);
  const [agencyForm, setAgencyForm] = useState(agency);
  const [agencySaved, setAgencySaved] = useState(false);
  const [guidesForm, setGuidesForm] = useState(guides || DEFAULT_GUIDES);
  const [guidesSaved, setGuidesSaved] = useState(false);
  const [lienForm, setLienForm] = useState({});
  const [resetStep, setResetStep] = useState(false);
  const [resetCodeInput, setResetCodeInput] = useState("");
  const [resetError, setResetError] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  function addMember() {
    if (!form.name.trim()) return;
    const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) + "-" + Date.now().toString().slice(-4);
    const color = TEAM_COLORS[team.length % TEAM_COLORS.length];
    const checklist = form.checklistText.split(",").map(s => s.trim()).filter(Boolean);
    setTeam([...team, { id, name: form.name, role: form.role || "Membre de l'équipe", color, code: autoCode(form.name),
      commissionPct: commissionRate,
      checklist: checklist.length ? checklist : ["Vérifier les tâches du jour", "Mettre à jour son suivi", "Communiquer avec l'équipe"] }]);
    setForm({ name: "", role: "", checklistText: "" });
  }
  function removeMember(id) {
    if (team.length <= 1) return;
    setTeam(team.filter(m => m.id !== id));
    if (editingId === id) setEditingId(null);
  }
  function startEdit(m) {
    setEditingId(m.id);
    setEditForm({ name: m.name, role: m.role, checklistText: (m.checklist || []).join(", "), code: m.code || autoCode(m.name),
      commissionPct: m.commissionPct != null ? m.commissionPct : commissionRate });
  }
  function saveEdit(id) {
    const checklist = editForm.checklistText.split(",").map(s => s.trim()).filter(Boolean);
    const pctRaw = Number(editForm.commissionPct);
    const pct = Number.isFinite(pctRaw) && editForm.commissionPct !== "" ? Math.max(0, Math.min(100, pctRaw)) : commissionRate;
    setTeam(team.map(m => m.id === id ? { ...m, name: editForm.name || m.name, role: editForm.role, code: editForm.code || m.code, commissionPct: pct, checklist } : m));
    setEditingId(null);
  }
  async function saveRate() {
    const v = Math.max(0, Math.min(100, Number(rateForm) || 0));
    setCommissionRate(v);
    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 2000);
  }
  async function saveCodes() {
    setCodes(codesForm);
    // On attend la vraie ecriture en base avant d'annoncer un succes.
    const err = await saveShared("kbs:codes", codesForm);
    if (err) { setCodesSaved(false); return; }
    setCodesSaved(true);
    setTimeout(() => setCodesSaved(false), 2000);
  }
  async function saveAgency() {
    setAgency(agencyForm);
    const err = await saveShared("kbs:agency", agencyForm);
    if (err) { setAgencySaved(false); return; }
    setAgencySaved(true);
    setTimeout(() => setAgencySaved(false), 2000);
  }
  async function saveGuides() {
    setGuides(guidesForm);
    const err = await saveShared("kbs:guides", guidesForm);
    if (err) { setGuidesSaved(false); return; }
    setGuidesSaved(true);
    setTimeout(() => setGuidesSaved(false), 2000);
  }
  function addLien(gid) {
    const entry = lienForm[gid];
    if (!entry?.label?.trim() || !entry?.url?.trim()) return;
    const current = (formationLiens || {})[gid] || [];
    setFormationLiens({ ...(formationLiens || {}), [gid]: [...current, { ...entry, id: Date.now() }] });
    setLienForm({ ...lienForm, [gid]: { label: "", url: "" } });
  }
  function removeLien(gid, id) {
    const current = (formationLiens || {})[gid] || [];
    setFormationLiens({ ...(formationLiens || {}), [gid]: current.filter(l => l.id !== id) });
  }
  function confirmReset() {
    if (resetCodeInput !== codes.reset) { setResetError(true); return; }
    onResetAll();
    setResetStep(false);
    setResetCodeInput("");
    setResetError(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  }

  if (!adminUnlocked) {
    return (
      <Card style={{ textAlign: "center" }}>
        <MiniUnlock code={codes.admin} label="Zone Administration — réservée au CEO" onUnlock={() => setAdminUnlocked(true)} />
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {section === "adminDiagnostics" && <AdminDiagnostics />}

      {section === "adminEquipe" && (<>
      <div>
        <H2>Taux de commission</H2>
        <Card style={{ borderColor: C.gold }}>
          <Eyebrow>Taux officiel de l'agence</Eyebrow>
          <div style={{ color: C.muted, fontSize: 12, margin: "4px 0 10px" }}>
            C'est le pourcentage appliqué par défaut à tous les membres. Tu peux le changer quand tu veux — tous les calculs de commission se recalculent automatiquement.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Percent size={16} color={C.gold} />
            <input type="number" min="0" max="100" value={rateForm}
              onChange={e => setRateForm(e.target.value)}
              style={{ ...inputStyle, width: 100 }} />
            <span style={{ fontSize: 13, color: C.muted }}>%</span>
            <button onClick={saveRate} style={{ ...btnGold, flex: 1 }}><Save size={14} /> {rateSaved ? "Enregistré ✓" : "Enregistrer le taux"}</button>
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>Taux actuel : <b style={{ color: C.goldLight }}>{commissionRate}%</b>. Pour donner un pourcentage différent à une personne précise, modifie sa fiche ci-dessous (crayon).</div>
        </Card>
      </div>

      <div>
        <H2>Équipe actuelle ({team.length})</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {team.map(m => {
            const editing = editingId === m.id;
            return (
              <Card key={m.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 999, background: m.color }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{m.name}</div>
                      <div style={{ fontSize: 11.5, color: C.muted }}>{m.role}</div>
                      <div style={{ fontSize: 11, color: C.greenLight, marginTop: 2, fontWeight: 700 }}>Commission : {memberRate(team, m.id, commissionRate)}%</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => editing ? setEditingId(null) : startEdit(m)} style={{ background: "none", border: "none", color: C.goldLight, cursor: "pointer" }}>
                      {editing ? <X size={16} /> : <Pencil size={15} />}
                    </button>
                    {team.length > 1 && <button onClick={() => removeMember(m.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><Trash2 size={16} /></button>}
                  </div>
                </div>

                {editing && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                    <input placeholder="Nom" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                    <input placeholder="Rôle / statut" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={inputStyle} />
                    <textarea placeholder="Checklist quotidienne (séparée par des virgules)" value={editForm.checklistText} onChange={e => setEditForm({ ...editForm, checklistText: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Percent size={14} color={C.muted} />
                      <input type="number" min="0" max="100" placeholder={`Commission (défaut ${commissionRate}%)`} value={editForm.commissionPct} onChange={e => setEditForm({ ...editForm, commissionPct: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                      <span style={{ fontSize: 13, color: C.muted }}>%</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <KeyRound size={14} color={C.muted} />
                      <CodeInput placeholder="Code personnel (checklist)" value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })} style={{ flex: 1 }} />
                    </div>
                    <button onClick={() => saveEdit(m.id)} style={btnGold}><Save size={14} /> Enregistrer</button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Le crayon permet de modifier le nom, le rôle, la checklist et le code personnel de chaque membre — uniquement pour cette personne.</div>
      </div>

      <div>
        <H2>Recruter un nouveau membre</H2>
        <Card>
          <Eyebrow>Ajouter automatiquement à l'outil</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <input placeholder="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            <input placeholder="Rôle / statut (ex: Développeur, Assistant commercial…)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle} />
            <input placeholder="Checklist quotidienne (séparée par des virgules, optionnel)" value={form.checklistText} onChange={e => setForm({ ...form, checklistText: e.target.value })} style={inputStyle} />
            <button onClick={addMember} style={btnGold}><UserPlus size={14} /> Ajouter à l'équipe</button>
          </div>
        </Card>
        <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>La personne apparaît immédiatement dans le CRM, la Trésorerie, le Kanban, les Disponibilités et les Liens partagés, avec un code personnel généré automatiquement (modifiable ensuite avec le crayon).</div>
      </div>
      </>)}

      {section === "adminCodes" && (<>
      <div>
        <H2>Codes d'accès — modifiables</H2>
        <Card style={{ borderColor: C.gold, marginBottom: 10 }}>
          <Eyebrow>Code de secours permanent</Eyebrow>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.goldLight, letterSpacing: 1, margin: "4px 0" }}>KBSAUTO2026</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>Ce code fonctionne toujours, sur tous les écrans verrouillés de l'app (connexion, Objectif, CRM, Planning, Administration, Checklists, Formation) — même si les codes ci-dessous sont oubliés ou mal enregistrés. Il n'est pas modifiable : c'est ton filet de sécurité pour ne jamais être bloqué dehors.</div>
        </Card>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
            <label style={{ color: C.muted }}>Mot de passe général de l'outil
              <CodeInput value={codesForm.app} onChange={e => setCodesForm({ ...codesForm, app: e.target.value.toUpperCase() })} style={{ marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Objectif (modifier le montant cible)
              <CodeInput value={codesForm.ceo} onChange={e => setCodesForm({ ...codesForm, ceo: e.target.value.toUpperCase() })} style={{ marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>CRM & Trésorerie (Catherine)
              <CodeInput value={codesForm.catherine} onChange={e => setCodesForm({ ...codesForm, catherine: e.target.value.toUpperCase() })} style={{ marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Ressources (Boîte à outils, Académie, Plan 30j, Liens, Formation)
              <CodeInput value={codesForm.ressources} onChange={e => setCodesForm({ ...codesForm, ressources: e.target.value.toUpperCase() })} style={{ marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Administration (cette section)
              <CodeInput value={codesForm.admin} onChange={e => setCodesForm({ ...codesForm, admin: e.target.value.toUpperCase() })} style={{ marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Réinitialisation totale (zone dangereuse — garde-le pour toi seul)
              <CodeInput value={codesForm.reset} onChange={e => setCodesForm({ ...codesForm, reset: e.target.value.toUpperCase() })} style={{ marginTop: 4 }} />
            </label>
          </div>
          <button onClick={saveCodes} style={{ ...btnGold, marginTop: 10 }}><Save size={14} /> {codesSaved ? "Enregistré ✓" : "Enregistrer les codes"}</button>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>Chaque code est indépendant : connaître l'un ne donne accès à aucun autre.</div>
        </Card>

        <H2 style={{ marginTop: 18 }}>Codes personnels de l'équipe</H2>
        <Card>
          <Eyebrow>Un code par personne — checklist Kanban + sa Formation</Eyebrow>
          <div style={{ color: C.muted, fontSize: 11.5, margin: "6px 0 12px" }}>
            Modifie ici le code de n'importe quel membre, y compris une nouvelle recrue. L'enregistrement est immédiat.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {team.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: m.color, flexShrink: 0 }} />
                <div style={{ flex: "1 1 90px", minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  <div style={{ fontSize: 10.5, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.role}</div>
                </div>
                <CodeInput
                  value={m.code || ""}
                  onChange={e => setTeam(team.map(x => x.id === m.id ? { ...x, code: e.target.value.toUpperCase() } : x))}
                  placeholder="CODE2026"
                  style={{ flex: "1 1 130px" }} />
              </div>
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 12 }}>
            Pour créer un nouveau membre (et donc un nouveau code), va dans l'onglet <b>Équipe</b> → "Recruter un nouveau membre".
          </div>
        </Card>
      </div>
      </>)}

      {section === "adminAgence" && (<>
      <div>
        <H2>Coordonnées de l'agence (reçus & devis PDF)</H2>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
            <label style={{ color: C.muted }}>Nom de l'entreprise
              <input value={agencyForm.name} onChange={e => setAgencyForm({ ...agencyForm, name: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Email
              <input value={agencyForm.email} onChange={e => setAgencyForm({ ...agencyForm, email: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Téléphone 1
              <input value={agencyForm.phone1} onChange={e => setAgencyForm({ ...agencyForm, phone1: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Téléphone 2 (optionnel)
              <input value={agencyForm.phone2} onChange={e => setAgencyForm({ ...agencyForm, phone2: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Adresse (optionnel)
              <input value={agencyForm.address} onChange={e => setAgencyForm({ ...agencyForm, address: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
          </div>
          <button onClick={saveAgency} style={{ ...btnGold, marginTop: 10 }}><Save size={14} /> {agencySaved ? "Enregistré ✓" : "Enregistrer les coordonnées"}</button>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>Ces informations apparaissent automatiquement en en-tête et en pied de page de chaque reçu et devis PDF.</div>
        </Card>
      </div>
      </>)}

      {section === "adminTarifs" && (<>
      <div>
        <H2>Tarifs</H2>
        <div style={{ color: C.muted, fontSize: 11.5, marginBottom: 10 }}>
          Ces prix s'appliquent partout dans l'appli : Tarifs, CRM (choix du pack) et Prospection Réseaux (scripts avec prix automatique). Chaque changement est enregistré immédiatement.
        </div>
        <PricingListEditor title="Packs stratégiques (En ligne / Présentiel)" rows={pricing.packs} onChange={(packs) => setPricing({ ...pricing, packs })} />
        <PricingListEditor title="Formations & Coaching (En ligne / Présentiel)" rows={pricing.formations} onChange={(formations) => setPricing({ ...pricing, formations })} />
        <PricingListEditor title="Prestations techniques & créatives" rows={pricing.prestations} onChange={(prestations) => setPricing({ ...pricing, prestations })} priceMode="text" />
      </div>
      </>)}

      {section === "adminFormation" && (<>
      <div>
        <H2>Formation — Guide & Liens (par personne)</H2>
        <div style={{ color: C.muted, fontSize: 11.5, marginBottom: 10 }}>
          Chaque personne ne voit que sa propre Formation, deverrouillee par son code personnel. Toute nouvelle recrue apparait ici automatiquement.
          Format du guide : une ligne commencant par <b>## </b> devient un titre, une ligne commencant par <b>- </b> devient une puce.
        </div>
        {team.map(m => (
          <Card key={m.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: m.color }} />
              <div style={{ fontFamily: "Baloo 2, sans-serif", fontWeight: 800, fontSize: 15, color: C.goldLight }}>{m.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>· code {m.code}</div>
            </div>

            <Eyebrow>Guide (texte)</Eyebrow>
            <textarea
              value={guidesForm[m.id] || ""}
              onChange={e => setGuidesForm({ ...guidesForm, [m.id]: e.target.value })}
              placeholder="Ecris ici le guide de cette personne…"
              style={{ ...inputStyle, marginTop: 6, marginBottom: 14, minHeight: 140, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
            />

            <Eyebrow>Liens</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6, marginBottom: 8 }}>
              {((formationLiens || {})[m.id] || []).map(l => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.cardAlt, borderRadius: 8, padding: "6px 10px" }}>
                  <span style={{ fontSize: 12.5 }}>{l.label}</span>
                  <button onClick={() => removeLien(m.id, l.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input placeholder="Titre du lien" value={lienForm[m.id]?.label || ""} onChange={e => setLienForm({ ...lienForm, [m.id]: { ...lienForm[m.id], label: e.target.value } })} style={{ ...inputStyle, flex: 1 }} />
              <input placeholder="https://…" value={lienForm[m.id]?.url || ""} onChange={e => setLienForm({ ...lienForm, [m.id]: { ...lienForm[m.id], url: e.target.value } })} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => addLien(m.id)} style={{ ...iconBtn, padding: "0 12px" }}><Plus size={14} /></button>
            </div>
          </Card>
        ))}
        <div style={{ color: C.muted, fontSize: 11.5, marginBottom: 6 }}>Les liens s'enregistrent immediatement. Pour le texte des guides, clique sur "Enregistrer les guides" une fois tes modifications faites.</div>
        <button onClick={saveGuides} style={btnGold}><Save size={14} /> {guidesSaved ? "Enregistré ✓" : "Enregistrer les guides"}</button>
      </div>
      </>)}

      {section === "adminCaisse" && <TabCaissePerso caisse={caisse} setCaisse={setCaisse} />}

      {section === "adminReset" && (<>
      <div>
        <H2>Clôturer un mois</H2>
        <Card style={{ borderColor: C.green }}>
          <Eyebrow>Archiver le mois puis repartir à zéro</Eyebrow>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>
            Les chiffres actuels (clients &amp; CA, trésorerie &amp; dépenses, dettes, objectif atteint) sont <b style={{ color: C.greenLight }}>sauvegardés dans les Archives sous le mois choisi</b>, puis les compteurs du mois repartent à zéro. L'équipe, les tarifs et le Kanban ne sont pas touchés.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, color: C.muted }}>Mois à archiver :</label>
            <input type="month" value={closeMonthValue} max={currentMonth}
              onChange={e => { setCloseMonthValue(e.target.value); setCloseMonthStep(false); }}
              style={{ ...inputStyle, width: 160 }} />
          </div>
          {!closeMonthStep ? (
            <button onClick={() => { setCloseMonthStep(true); setCloseMonthDone(false); }} style={{ ...btnGold, marginTop: 10, background: C.green }}>
              <Archive size={14} /> Clôturer ce mois
            </button>
          ) : (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: C.greenLight, fontWeight: 700, marginBottom: 6 }}>
                Confirmer : archiver les chiffres actuels sous « {closeMonthValue} » et remettre le mois en cours à zéro ?
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => { onCloseMonth(closeMonthValue); setCloseMonthStep(false); setCloseMonthDone(true); setTimeout(() => setCloseMonthDone(false), 3000); }}
                  style={{ ...btnGold, width: "auto", padding: "8px 14px", background: C.green }}>Oui, archiver et remettre à zéro</button>
                <button onClick={() => setCloseMonthStep(false)} style={iconBtn}>Annuler</button>
              </div>
            </div>
          )}
          {closeMonthDone && <div style={{ fontSize: 12, color: C.greenLight, marginTop: 8 }}>✓ Mois archivé. Consulte-le dans Ventes &amp; Finance → Archives.</div>}
        </Card>
      </div>

      <div>
        <H2>Zone dangereuse</H2>
        <Card style={{ borderColor: C.rust }}>
          <Eyebrow>Réinitialiser toutes les données</Eyebrow>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Efface tous les clients, dépenses, dettes, prospections, tâches Kanban, coches de checklist, disponibilités, devis et liens — remet l'objectif à 250 000 FCFA. L'équipe et les codes d'accès ne sont pas touchés. <b style={{ color: C.greenLight }}>Avant l'effacement, le mois en cours (clients &amp; CA, trésorerie, dettes, objectif) est automatiquement sauvegardé dans les Archives</b> — tu pourras toujours le reconsulter. Le reste de l'action est irréversible.</div>
          {!resetStep ? (
            <button onClick={() => setResetStep(true)} style={{ ...iconBtn, marginTop: 10, color: C.rustLight, borderColor: C.rust, padding: "8px 12px" }}>
              <RefreshCw size={13} /> Tout réinitialiser
            </button>
          ) : (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: C.rustLight, fontWeight: 700, marginBottom: 6 }}>Ce code est différent du code Administration — confirme pour continuer :</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input type="password" placeholder="Code de réinitialisation" value={resetCodeInput}
                  onChange={e => { setResetCodeInput(e.target.value); setResetError(false); }}
                  onKeyDown={e => { if (e.key === "Enter") confirmReset(); }}
                  style={{ ...inputStyle, width: 170 }} />
                <button onClick={confirmReset} style={{ ...btnGold, width: "auto", padding: "8px 14px", background: C.rust, color: C.white }}>Oui, tout effacer</button>
                <button onClick={() => { setResetStep(false); setResetCodeInput(""); setResetError(false); }} style={iconBtn}>Annuler</button>
              </div>
              {resetError && <div style={{ color: C.rustLight, fontSize: 11, marginTop: 6 }}>Code incorrect.</div>}
            </div>
          )}
          {resetDone && <div style={{ fontSize: 12, color: C.greenLight, marginTop: 8 }}>✓ Données réinitialisées.</div>}
        </Card>
      </div>
      </>)}
    </div>
  );
}

/* ---------------------------------- SHARED STYLES ---------------------------------- */
const inputStyle = { background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "9px 10px", fontSize: 13, width: "100%" };
const btnGold = { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.gold, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const iconBtn = { background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, padding: "3px 6px", fontSize: 11, cursor: "pointer" };
