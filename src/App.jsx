import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Target, Users, LayoutGrid, Sparkles, CalendarDays, MessageSquare,
  Wallet, Link2, Plus, Trash2, ChevronDown, ChevronRight, ExternalLink,
  CheckCircle2, Circle, RotateCcw, TrendingUp, Banknote, Flame, GraduationCap,
  Award, TrendingDown, Lock, LogOut, CalendarClock, Send, History, FileText,
  Shield, UserPlus, AlertTriangle, Search, Copy, Radar, CalendarCheck,
  Pencil, Save, KeyRound, RefreshCw, X
} from "lucide-react";

/* ---------------------------------- SUPABASE ---------------------------------- */
const supabase = createClient(
  "https://vspepqwipgjkmnemwlfa.supabase.co",
  "sb_publishable_olyJ2hEstrKN7KR4v4mNaQ_sYXVjw04"
);

/* ---------------------------------- PALETTE ---------------------------------- */
const C = {
  bg: "#0A1310", card: "#111E17", cardAlt: "#16261C", border: "#243828",
  gold: "#C9A227", goldLight: "#E4C158", green: "#1F7A4D", greenLight: "#3CBE7C",
  rust: "#B7402F", rustLight: "#DD6A54", text: "#F2EDE4", muted: "#93A392",
  white: "#FFFFFF",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');`;

/* Codes d'accès par défaut — modifiables ensuite directement dans l'onglet Administration */
const DEFAULT_CODES = {
  app: "KBS2026",       // mot de passe général de l'outil
  ceo: "CEO2026",       // Objectif (CEO)
  catherine: "CATH2026", // CRM & Trésorerie (Catherine)
  planning: "AGENDA2026", // Mon Planning (CEO)
  admin: "ADMIN2026",   // Administration — accès total
  reset: "RESET2026",   // Confirmation supplémentaire pour tout réinitialiser
};
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
  { id: "ceo", name: "CEO (Toi)", role: "Stratégie, Technique, Enseignement", color: C.gold, code: "CEO2026",
    checklist: ["Vérifier les tâches à valider", "Monter la vidéo finale du jour", "Avancer sur un projet client", "Point d'équipe 15 min"] },
  { id: "catherine", name: "Catherine", role: "Commercial, Closing, Trésorerie", color: C.greenLight, code: "CATH2026",
    checklist: ["Traiter les messages WhatsApp", "Accueillir les nouveaux élèves", "Relancer les prospects en attente", "Mettre à jour la trésorerie"] },
  { id: "sacko", name: "Sacko", role: "Coordination, Graphisme", color: C.rustLight, code: "SACKO2026",
    checklist: ["Coordonner les tâches de l'équipe", "Créer les visuels du jour", "Vérifier la cohérence graphique", "Point d'équipe 15 min"] },
  { id: "oumou", name: "Oumou", role: "Créatrice de contenu", color: "#7FB3E8", code: "OUMOU2026",
    checklist: ["Écrire un script vidéo", "Tourner une vidéo", "Analyser une tendance TikTok", "Répondre aux commentaires"] },
];

const PACKS = [
  { name: "Pack 1 : Formation + Vente", online: 45000, presentiel: 80000 },
  { name: "Pack 2 : Lancement Produit", online: 50000, presentiel: 85000 },
  { name: "Pack 3 : Visibilité (Mensuel)", online: 140000, presentiel: 160000 },
  { name: "Pack 4 : Présence Pro", online: 170000, presentiel: 190000 },
  { name: "Pack 5 : Conversion & Ventes", online: 65000, presentiel: 80000 },
  { name: "Pack 6 : IA & Automatisation", online: 70000, presentiel: 95000 },
  { name: "Pack 7 : Tech / Projet Avancé", online: 350000, presentiel: null, note: "Sur devis" },
];

const FORMATIONS = [
  { name: "Formation Alibaba", online: 10000, presentiel: 20000 },
  { name: "Formation E-commerce", online: 20000, presentiel: 35000 },
  { name: "Intelligence Artificielle (IA)", online: 20000, presentiel: 35000 },
  { name: "Montage vidéo CapCut", online: 15000, presentiel: 25000 },
  { name: "Campagne publicitaire (Meta/TikTok)", online: 25000, presentiel: 35000 },
  { name: "Formation au Closing", online: 15000, presentiel: 25000 },
];

const PRESTATIONS = [
  { name: "Création de page de vente", price: "25 000 FCFA" },
  { name: "Création de site web dynamique", price: "100 000 FCFA" },
  { name: "Community Management", price: "100 000 FCFA / mois" },
  { name: "Création de SaaS / Application", price: "À partir de 300 000 FCFA" },
];

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
    "CEO : distribuer les premières commissions de 25 %.",
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

const SERVICES_CATALOGUE = [
  { groupe: "Packs stratégiques", options: PACKS.map(p => p.name) },
  { groupe: "Formations & Coaching", options: FORMATIONS.map(f => f.name) },
  { groupe: "Prestations techniques & créatives", options: PRESTATIONS.map(p => p.name) },
];

const DETTE_STATUTS = ["En attente", "Payée"];

const PROSPECTION_STATUTS = ["À répondu", "Intéressé", "Contacté", "Objection prix", "Pas intéressé", "Archivé"];
const INTERET_NIVEAUX = ["Chaud", "Tiède", "Froid"];
const ALL_SERVICES_FLAT = [...PACKS.map(p => p.name), ...FORMATIONS.map(p => p.name), ...PRESTATIONS.map(p => p.name)];

function findServiceInfo(name) {
  const pack = PACKS.find(p => p.name === name);
  if (pack) return { price: fcfa(pack.online) };
  const f = FORMATIONS.find(p => p.name === name);
  if (f) return { price: fcfa(f.online) };
  const pr = PRESTATIONS.find(p => p.name === name);
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

function defaultPlanning() {
  const d = {};
  for (let i = 1; i <= 30; i++) d[i] = { occupied: false, note: "", heure: "" };
  return d;
}

function defaultDispoDays() {
  const d = {};
  for (let i = 1; i <= 30; i++) d[i] = { disponible: false, heure: "", note: "" };
  return d;
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

  doc.setTextColor(...PDF_GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(agency.name || "KBS DIGITAL AGENCY", 15, 17);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Stratégie, Ventes & Production digitale", 15, 24);
  const contactLine = [agency.phone1, agency.phone2].filter(Boolean).join("  /  ") + (agency.email ? `   •   ${agency.email}` : "");
  doc.text(contactLine, 15, 30);
  if (agency.address) doc.text(agency.address, 15, 35);

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
async function saveShared(key, value) {
  try {
    await supabase.from("kbs_storage").upsert({ key, value, updated_at: new Date().toISOString() });
  } catch { /* ignore */ }
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
function H2({ children }) {
  return <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 12px" }}>{children}</h2>;
}
function fcfa(n) { return `${Number(n || 0).toLocaleString("fr-FR")} FCFA`; }

function MiniUnlock({ code, label, onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  function tryUnlock() { if (input === code) onUnlock(); else setError(true); }
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
  const [expenses, setExpenses] = useState([]);
  const [planning, setPlanning] = useState(defaultPlanning());
  const [dettes, setDettes] = useState([]);
  const [prospection, setProspection] = useState([]);
  const [dispos, setDispos] = useState({});
  const [codes, setCodes] = useState(DEFAULT_CODES);
  const [agency, setAgency] = useState(DEFAULT_AGENCY);
  const [devis, setDevis] = useState([]);

  useEffect(() => {
    (async () => {
      setTeam(await loadShared("kbs:team", DEFAULT_TEAM));
      setGoal(await loadShared("kbs:goal", 250000));
      setProspects(await loadShared("kbs:prospects", []));
      setKanban(await loadShared("kbs:kanban", { todo: [], doing: [], review: [], done: [] }));
      setChecks(await loadShared("kbs:checks", { ceo: [], catherine: [], sacko: [] }));
      setLinks(await loadShared("kbs:links", []));
      setExpenses(await loadShared("kbs:expenses", []));
      setPlanning(await loadShared("kbs:planning", defaultPlanning()));
      setDettes(await loadShared("kbs:dettes", []));
      setProspection(await loadShared("kbs:prospection", []));
      setDispos(await loadShared("kbs:dispos", {}));
      setCodes(await loadShared("kbs:codes", DEFAULT_CODES));
      setAgency(await loadShared("kbs:agency", DEFAULT_AGENCY));
      setDevis(await loadShared("kbs:devis", []));
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) saveShared("kbs:team", team); }, [team, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:goal", goal); }, [goal, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:prospects", prospects); }, [prospects, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:kanban", kanban); }, [kanban, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:checks", checks); }, [checks, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:links", links); }, [links, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:expenses", expenses); }, [expenses, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:planning", planning); }, [planning, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:dettes", dettes); }, [dettes, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:prospection", prospection); }, [prospection, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:dispos", dispos); }, [dispos, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:codes", codes); }, [codes, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:agency", agency); }, [agency, loaded]);
  useEffect(() => { if (loaded) saveShared("kbs:devis", devis); }, [devis, loaded]);

  const totalCA = useMemo(() => prospects.reduce((s, p) => s + (Number(p.montant) || 0), 0), [prospects]);
  const totalCommission = totalCA * 0.25;
  const totalDepenses = useMemo(() => expenses.reduce((s, e) => s + (Number(e.montant) || 0), 0), [expenses]);
  const beneficeNet = totalCA - totalCommission - totalDepenses;
  const pct = Math.min(100, Math.round((totalCA / (goal || 1)) * 100));

  function resetAllData() {
    setProspects([]);
    setKanban({ todo: [], doing: [], review: [], done: [] });
    setChecks({});
    setLinks([]);
    setExpenses([]);
    setPlanning(defaultPlanning());
    setDettes([]);
    setProspection([]);
    setDispos({});
    setDevis([]);
    setGoal(250000);
  }

  const TAB_META = {
    objectif: { label: "Objectif", icon: Target },
    planning: { label: "Mon Planning", icon: CalendarClock },
    dispos: { label: "Disponibilités équipe", icon: CalendarCheck },
    kanban: { label: "Kanban", icon: LayoutGrid },
    crm: { label: "CRM & Clients", icon: Users },
    devis: { label: "Devis", icon: FileText },
    tresorerie: { label: "Trésorerie", icon: Banknote },
    dettes: { label: "Dettes & Rappels", icon: AlertTriangle },
    tarifs: { label: "Tarifs", icon: Wallet },
    cible: { label: "Cible", icon: MessageSquare },
    copywriting: { label: "Laboratoire Copywriting", icon: Flame },
    prospection: { label: "Prospection Réseaux", icon: Radar },
    outils: { label: "Boîte à outils IA", icon: Sparkles },
    academie: { label: "Académie Gratuite", icon: GraduationCap },
    plan: { label: "Plan 30 jours", icon: CalendarDays },
    liens: { label: "Liens partagés", icon: Link2 },
    administration: { label: "Administration", icon: Shield },
  };

  const CATEGORIES = [
    { id: "pilotage", label: "Pilotage", icon: Target, tabs: ["objectif", "planning", "dispos", "kanban"] },
    { id: "ventes", label: "Ventes & Finance", icon: Wallet, tabs: ["crm", "devis", "tresorerie", "dettes", "tarifs"] },
    { id: "marketing", label: "Marketing", icon: Flame, tabs: ["cible", "copywriting", "prospection"] },
    { id: "ressources", label: "Ressources", icon: Sparkles, tabs: ["outils", "academie", "plan", "liens"] },
    { id: "admin", label: "Administration", icon: Shield, tabs: ["administration"] },
  ];

  function selectCategory(catId) {
    setCategory(catId);
    const cat = CATEGORIES.find(c => c.id === catId);
    setTab(cat.tabs[0]);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {!loaded ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>Chargement…</div>
      ) : !unlocked ? (
        <LoginScreen onUnlock={() => setUnlocked(true)} codes={codes} />
      ) : (
      <>
      {/* HEADER */}
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 22, color: C.gold }}>KBS</span>
            <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 16 }}>Digital Agency</span>
          </div>
          <div style={{ color: C.muted, fontSize: 12.5, marginTop: 2 }}>QG de l'équipe — Stratégie, Ventes & Production</div>
        </div>
        <button onClick={() => setUnlocked(false)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, padding: "6px 10px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
          <LogOut size={13} /> Déconnexion
        </button>
      </div>

      {/* CATEGORY BAR */}
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "10px 12px 6px", background: C.cardAlt }}>
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          const active = category === c.id;
          return (
            <button key={c.id} onClick={() => selectCategory(c.id)} style={{
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
              padding: "8px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700,
              border: `1px solid ${active ? C.gold : C.border}`,
              background: active ? C.gold : "transparent",
              color: active ? "#1A1300" : C.text, flexShrink: 0, cursor: "pointer"
            }}>
              <Icon size={14} /> {c.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB BAR */}
      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "6px 12px 10px", borderBottom: `1px solid ${C.border}`, background: C.cardAlt }}>
        {CATEGORIES.find(c => c.id === category).tabs.map(tid => {
          const meta = TAB_META[tid];
          const Icon = meta.icon;
          const active = tab === tid;
          return (
            <button key={tid} onClick={() => setTab(tid)} style={{
              display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
              padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
              border: `1px solid ${active ? C.greenLight : C.border}`,
              background: active ? "rgba(60,190,124,0.15)" : "transparent",
              color: active ? C.greenLight : C.muted, flexShrink: 0, cursor: "pointer"
            }}>
              <Icon size={12} /> {meta.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
        {tab === "objectif" && <TabObjectif goal={goal} setGoal={setGoal} totalCA={totalCA} totalCommission={totalCommission} pct={pct} prospects={prospects} team={team} codes={codes} />}
        {tab === "planning" && <TabPlanning planning={planning} setPlanning={setPlanning} codes={codes} />}
        {tab === "dispos" && <TabDispos dispos={dispos} setDispos={setDispos} team={team} />}
        {tab === "kanban" && <TabKanban kanban={kanban} setKanban={setKanban} checks={checks} setChecks={setChecks} team={team} codes={codes} />}
        {tab === "crm" && <TabCRM prospects={prospects} setProspects={setProspects} totalCA={totalCA} totalCommission={totalCommission} team={team} codes={codes} agency={agency} />}
        {tab === "devis" && <TabDevis devis={devis} setDevis={setDevis} prospects={prospects} team={team} agency={agency} />}
        {tab === "tresorerie" && <TabTresorerie prospects={prospects} setProspects={setProspects} expenses={expenses} setExpenses={setExpenses} totalCA={totalCA} totalCommission={totalCommission} totalDepenses={totalDepenses} beneficeNet={beneficeNet} team={team} codes={codes} />}
        {tab === "dettes" && <TabDettes dettes={dettes} setDettes={setDettes} prospects={prospects} />}
        {tab === "tarifs" && <TabTarifs />}
        {tab === "cible" && <TabCible />}
        {tab === "copywriting" && <TabCopywriting />}
        {tab === "prospection" && <TabProspection prospection={prospection} setProspection={setProspection} prospects={prospects} setProspects={setProspects} team={team} />}
        {tab === "outils" && <TabOutils />}
        {tab === "academie" && <TabAcademie />}
        {tab === "plan" && <TabPlan />}
        {tab === "liens" && <TabLiens links={links} setLinks={setLinks} team={team} />}
        {tab === "administration" && <TabAdministration team={team} setTeam={setTeam} codes={codes} setCodes={setCodes} onResetAll={resetAllData} agency={agency} setAgency={setAgency} />}
      </div>
      </>
      )}
    </div>
  );
}

/* ---------------------------------- LOGIN SCREEN ---------------------------------- */
function LoginScreen({ onUnlock, codes }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);

  function tryUnlock() {
    if (pwd === codes.app) { setError(false); onUnlock(); }
    else { setError(true); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Lock size={24} color={C.gold} />
      </div>
      <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>KBS Digital Agency</div>
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
function TabObjectif({ goal, setGoal, totalCA, totalCommission, pct, prospects, team, codes }) {
  const [ceoUnlocked, setCeoUnlocked] = useState(false);
  const r = 70, circ = 2 * Math.PI * r;
  const perPerson = team.map(m => ({
    ...m,
    ca: prospects.filter(p => p.owner === m.id).reduce((s, p) => s + (Number(p.montant) || 0), 0),
  }));

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
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 30, fontWeight: 800, color: C.goldLight }}>{pct}%</div>
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
        <Eyebrow>Commission d'équipe (25%)</Eyebrow>
        <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 800, color: C.greenLight }}>{fcfa(totalCommission)}</div>
        <div style={{ color: C.muted, fontSize: 12.5, marginTop: 2 }}>Calculée automatiquement sur le CA encaissé dans le CRM.</div>
      </Card>

      <Card>
        <Eyebrow>Performance par personne</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {perPerson.map(m => (
            <div key={m.id}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ color: C.muted }}>{fcfa(m.ca)}</span>
              </div>
              <div style={{ height: 6, background: C.cardAlt, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (m.ca / (goal || 1)) * 100)}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- TAB: CRM ---------------------------------- */
function TabCRM({ prospects, setProspects, totalCA, totalCommission, team, codes, agency }) {
  const [form, setForm] = useState({
    nom: "", prenom: "", whatsapp: "", email: "", adresse: "", quartier: "",
    dateInscription: new Date().toISOString().slice(0, 10),
    pack: PACKS[0].name, statut: "À contacter", montant: "", owner: team[0]?.id || ""
  });
  const [catherineUnlocked, setCatherineUnlocked] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [noteText, setNoteText] = useState("");

  function addProspect() {
    if (!form.nom.trim()) return;
    setProspects([...prospects, { ...form, id: Date.now(), historique: [] }]);
    setForm({ nom: "", prenom: "", whatsapp: "", email: "", adresse: "", quartier: "", dateInscription: new Date().toISOString().slice(0, 10), pack: PACKS[0].name, statut: "À contacter", montant: "", owner: team[0]?.id || "" });
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
              {SERVICES_CATALOGUE.map(g => (
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
          <div style={{ fontWeight: 800, fontFamily: "Sora, sans-serif", color: C.goldLight }}>{fcfa(totalCA)}</div>
        </Card>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>Commission 25%</div>
          <div style={{ fontWeight: 800, fontFamily: "Sora, sans-serif", color: C.greenLight }}>{fcfa(totalCommission)}</div>
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
            {Number(p.montant) > 0 && <div style={{ fontSize: 11, color: C.greenLight, marginTop: 4 }}>Commission : {fcfa(p.montant * 0.25)}</div>}

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
              </div>
            )}
          </Card>
        );})}
      </div>
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
    setKanban({ ...kanban, todo: [...kanban.todo, { id: Date.now(), text: newTask }] });
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
    if (member && unlockCode === (member.code || "")) { setMyUnlock(member.id); setUnlockError(false); setUnlockCode(""); }
    else setUnlockError(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Card>
        <Eyebrow>Nouvelle tâche</Eyebrow>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input placeholder="Décrire la tâche…" value={newTask} onChange={e => setNewTask(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <button onClick={addTask} style={{ ...btnGold, width: "auto", padding: "0 14px" }}><Plus size={16} /></button>
        </div>
      </Card>

      <div>
        <H2>Tableau Kanban</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cols.map((col, colIdx) => (
            <Card key={col.id}>
              <Eyebrow>{col.label} ({kanban[col.id]?.length || 0})</Eyebrow>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {(kanban[col.id] || []).map(t => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.cardAlt, borderRadius: 8, padding: "8px 10px" }}>
                    <span style={{ fontSize: 13 }}>{t.text}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {colIdx > 0 && <button onClick={() => move(col.id, t.id, -1)} style={iconBtn}>←</button>}
                      {colIdx < 3 && <button onClick={() => move(col.id, t.id, 1)} style={iconBtn}>→</button>}
                      <button onClick={() => removeTask(col.id, t.id)} style={iconBtn}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
                {(kanban[col.id] || []).length === 0 && <div style={{ fontSize: 12, color: C.muted }}>Vide</div>}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <H2>Checklists quotidiennes</H2>
        <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>Chacun voit toutes les checklists, mais ne peut cocher que la sienne avec son code personnel. Le CEO peut tout cocher avec le code Administration.</div>

        {!adminUnlocked && (
          <Card style={{ marginBottom: 10 }}>
            <Eyebrow>Déverrouiller ma checklist</Eyebrow>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
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
            {myUnlock && <div style={{ color: C.greenLight, fontSize: 11, marginTop: 6 }}>✓ {team.find(m => m.id === myUnlock)?.name} peut cocher sa checklist.</div>}
            <div style={{ marginTop: 8 }}>
              <MiniUnlock code={codes.admin} label="Ou code Administration (CEO — tout déverrouiller)" onUnlock={() => setAdminUnlocked(true)} />
            </div>
          </Card>
        )}
        {adminUnlocked && <div style={{ color: C.greenLight, fontSize: 12, marginBottom: 10 }}>✓ Mode Administration : toutes les checklists sont modifiables.</div>}

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

/* ---------------------------------- TAB: MON PLANNING ---------------------------------- */
function TabPlanning({ planning, setPlanning, codes }) {
  const [ceoUnlocked, setCeoUnlocked] = useState(false);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  function toggleDay(d) {
    setPlanning({ ...planning, [d]: { ...planning[d], occupied: !planning[d]?.occupied } });
  }
  function setNote(d, note) {
    setPlanning({ ...planning, [d]: { ...planning[d], note } });
  }
  function setHeure(d, heure) {
    setPlanning({ ...planning, [d]: { ...planning[d], heure } });
  }
  function resetMonth() { setPlanning(defaultPlanning()); }

  const occupiedCount = days.filter(d => planning[d]?.occupied).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ background: C.cardAlt }}>
        <div style={{ fontSize: 13 }}>📅 Planning du CEO (Jour 1 à 30 du mois). Catherine peut vérifier ici avant de proposer un rendez-vous à un client.</div>
      </Card>

      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, color: C.muted }}>Jours occupés ce mois-ci</div>
        <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 800, color: C.white }}>{occupiedCount} / 30</div>
      </Card>

      {!ceoUnlocked && (
        <Card style={{ textAlign: "center" }}>
          <MiniUnlock code={codes.planning} label="Réservé au CEO pour modifier" onUnlock={() => setCeoUnlocked(true)} />
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Eyebrow>Grille du mois</Eyebrow>
          {ceoUnlocked && <button onClick={resetMonth} style={iconBtn}><RotateCcw size={12} /> Réinitialiser</button>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
          {days.map(d => {
            const occ = planning[d]?.occupied;
            return (
              <button key={d}
                onClick={() => ceoUnlocked && toggleDay(d)}
                title={[planning[d]?.heure, planning[d]?.note].filter(Boolean).join(" — ")}
                style={{
                  aspectRatio: "1", borderRadius: 8, border: `1px solid ${occ ? C.rust : C.white}`,
                  background: occ ? "rgba(183,64,47,0.18)" : "rgba(255,255,255,0.10)",
                  color: occ ? C.rustLight : C.white, fontWeight: 700, fontSize: 13,
                  cursor: ceoUnlocked ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1
                }}>
                {d}
                {occ && planning[d]?.heure && <span style={{ fontSize: 8, fontWeight: 600 }}>{planning[d].heure}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: C.muted }}>
          <span><span style={{ color: C.white }}>●</span> Libre</span>
          <span><span style={{ color: C.rustLight }}>●</span> Occupé</span>
        </div>
      </Card>

      {ceoUnlocked && (
        <Card>
          <Eyebrow>Ajouter une heure et une note sur un jour occupé</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {days.filter(d => planning[d]?.occupied).map(d => (
              <div key={d} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 26, fontSize: 12, fontWeight: 700, color: C.rustLight }}>J{d}</span>
                <input type="time" value={planning[d]?.heure || ""} onChange={e => setHeure(d, e.target.value)} style={{ ...inputStyle, width: 90, fontSize: 12, padding: "6px 8px" }} />
                <input placeholder="Ex: RDV client, formation…" value={planning[d]?.note || ""} onChange={e => setNote(d, e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 12, padding: "6px 8px" }} />
              </div>
            ))}
            {occupiedCount === 0 && <div style={{ fontSize: 12, color: C.muted }}>Coche un jour occupé ci-dessus pour ajouter une note.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}
/* ---------------------------------- TAB: DISPONIBILITÉS ÉQUIPE ---------------------------------- */
function TabDispos({ dispos, setDispos, team }) {
  const [whoAmI, setWhoAmI] = useState(null);
  const [viewing, setViewing] = useState(null);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

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
                background: active ? "rgba(255,255,255,0.06)" : "transparent",
                color: active ? m.color : C.muted, cursor: "pointer", flexShrink: 0
              }}>{m.name}{m.id === whoAmI ? " (toi)" : ""}</button>
            );
          })}
        </div>

        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: C.muted }}>Jours disponibles — {viewingMember?.name}</div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 800, color: C.white }}>{availableCount} / 30</div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Eyebrow>{isEditing ? "Ton calendrier (modifiable)" : `Calendrier de ${viewingMember?.name} (lecture seule)`}</Eyebrow>
            {isEditing && <button onClick={resetMine} style={iconBtn}><RotateCcw size={12} /> Réinitialiser</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {days.map(d => {
              const av = dayData[d]?.disponible;
              return (
                <button key={d}
                  onClick={() => toggleDay(d)}
                  title={[dayData[d]?.heure, dayData[d]?.note].filter(Boolean).join(" — ")}
                  style={{
                    aspectRatio: "1", borderRadius: 8, border: `1px solid ${av ? C.greenLight : C.white}`,
                    background: av ? "rgba(60,190,124,0.18)" : "rgba(255,255,255,0.10)",
                    color: av ? C.greenLight : C.white, fontWeight: 700, fontSize: 13,
                    cursor: isEditing ? "pointer" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1
                  }}>
                  {d}
                  {av && dayData[d]?.heure && <span style={{ fontSize: 8, fontWeight: 600 }}>{dayData[d].heure}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: C.muted }}>
            <span><span style={{ color: C.white }}>●</span> Indisponible</span>
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
              <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 14 }}>{group.cat}</span>
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
              <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 14 }}>{w.title}</span>
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
function TabTresorerie({ prospects, setProspects, expenses, setExpenses, totalCA, totalCommission, totalDepenses, beneficeNet, team, codes }) {
  const [form, setForm] = useState({ label: "", categorie: DEPENSES_CATEGORIES[0], montant: "", addedBy: team[0]?.id || "" });
  const [catherineUnlocked, setCatherineUnlocked] = useState(false);
  const clientsPayants = prospects.filter(p => Number(p.montant) > 0);

  function addExpense() {
    if (!form.label.trim() || !form.montant) return;
    setExpenses([...expenses, { ...form, id: Date.now(), date: new Date().toISOString().slice(0, 10) }]);
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
            <div style={{ fontWeight: 800, fontFamily: "Sora, sans-serif", color: C.goldLight, fontSize: 15 }}>{fcfa(totalCA)}</div>
          </Card>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Commissions équipe</div>
            <div style={{ fontWeight: 800, fontFamily: "Sora, sans-serif", color: C.rustLight, fontSize: 15 }}>{fcfa(totalCommission)}</div>
          </Card>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Dépenses</div>
            <div style={{ fontWeight: 800, fontFamily: "Sora, sans-serif", color: C.rustLight, fontSize: 15 }}>{fcfa(totalDepenses)}</div>
          </Card>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>Bénéfice net</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontWeight: 800, fontFamily: "Sora, sans-serif", color: beneficeNet >= 0 ? C.greenLight : C.rustLight, fontSize: 15 }}>
              {beneficeNet >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {fcfa(beneficeNet)}
            </div>
          </Card>
        </div>
        <div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>Bénéfice net = Revenus encaissés − Commissions (25%) − Dépenses. Recalculé automatiquement.</div>
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
          <div style={{ fontWeight: 800, fontFamily: "Sora, sans-serif", color: C.goldLight, fontSize: 15 }}>{fcfa(totalDu)}</div>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted }}>Échéances en retard</div>
          <div style={{ fontWeight: 800, fontFamily: "Sora, sans-serif", color: enRetard > 0 ? C.rustLight : C.greenLight, fontSize: 15 }}>{enRetard}</div>
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
                <span style={{ fontSize: 11, fontWeight: 700, color, background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 6 }}>{label}</span>
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
                  <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 14 }}>{group.cat} ({group.items.length})</span>
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
                  <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 13.5 }}>{s.title}</span>
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
function TabProspection({ prospection, setProspection, prospects, setProspects, team }) {
  const [service, setService] = useState(ALL_SERVICES_FLAT[0]);
  const [copiedStage, setCopiedStage] = useState(null);
  const [form, setForm] = useState({ nom: "", whatsapp: "", source: "", commentaire: "", interet: "Chaud", statut: "À répondu", scriptUtilise: DM_SCRIPTS[0].stage, note: "" });

  const priceInfo = findServiceInfo(service);

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
      dateInscription: new Date().toISOString().slice(0, 10), pack: PACKS[0].name, statut: "En discussion",
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
          {ALL_SERVICES_FLAT.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Card>

      <div>
        <H2>Scripts DM — copier-coller</H2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DM_SCRIPTS.map(s => (
            <Card key={s.stage}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.gold }}>{s.stage}</span>
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
function TabTarifs() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <H2>Formations & Coaching</H2>
        <Card><PriceTable rows={FORMATIONS} /></Card>
      </div>
      <div>
        <H2>Prestations techniques & créatives</H2>
        <Card>
          {PRESTATIONS.map(p => (
            <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span>{p.name}</span><span style={{ color: C.goldLight, fontWeight: 700 }}>{p.price}</span>
            </div>
          ))}
        </Card>
      </div>
      <div>
        <H2>Packs stratégiques</H2>
        <Card><PriceTable rows={PACKS} /></Card>
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

/* ---------------------------------- TAB: LIENS PARTAGÉS ---------------------------------- */
function TabLiens({ links, setLinks, team }) {
  const [form, setForm] = useState({ label: "", url: "", addedBy: team[0]?.id || "" });
  function add() {
    if (!form.label.trim() || !form.url.trim()) return;
    setLinks([...links, { ...form, id: Date.now() }]);
    setForm({ label: "", url: "", addedBy: team[0]?.id || "" });
  }
  function remove(id) { setLinks(links.filter(l => l.id !== id)); }

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
                <button onClick={() => remove(l.id)} style={{ background: "none", border: "none", color: C.rustLight, cursor: "pointer" }}><Trash2 size={16} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- TAB: ADMINISTRATION ---------------------------------- */
function TabAdministration({ team, setTeam, codes, setCodes, onResetAll, agency, setAgency }) {
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", checklistText: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", checklistText: "", code: "" });
  const [codesForm, setCodesForm] = useState(codes);
  const [codesSaved, setCodesSaved] = useState(false);
  const [agencyForm, setAgencyForm] = useState(agency);
  const [agencySaved, setAgencySaved] = useState(false);
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
    setEditForm({ name: m.name, role: m.role, checklistText: (m.checklist || []).join(", "), code: m.code || autoCode(m.name) });
  }
  function saveEdit(id) {
    const checklist = editForm.checklistText.split(",").map(s => s.trim()).filter(Boolean);
    setTeam(team.map(m => m.id === id ? { ...m, name: editForm.name || m.name, role: editForm.role, code: editForm.code || m.code, checklist } : m));
    setEditingId(null);
  }
  function saveCodes() {
    setCodes(codesForm);
    setCodesSaved(true);
    setTimeout(() => setCodesSaved(false), 2000);
  }
  function saveAgency() {
    setAgency(agencyForm);
    setAgencySaved(true);
    setTimeout(() => setAgencySaved(false), 2000);
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
                      <KeyRound size={14} color={C.muted} />
                      <input placeholder="Code personnel (checklist)" value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })} style={{ ...inputStyle, flex: 1 }} />
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

      <div>
        <H2>Codes d'accès — modifiables</H2>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
            <label style={{ color: C.muted }}>Mot de passe général de l'outil
              <input value={codesForm.app} onChange={e => setCodesForm({ ...codesForm, app: e.target.value.toUpperCase() })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Objectif (modifier le montant cible)
              <input value={codesForm.ceo} onChange={e => setCodesForm({ ...codesForm, ceo: e.target.value.toUpperCase() })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>CRM & Trésorerie (Catherine)
              <input value={codesForm.catherine} onChange={e => setCodesForm({ ...codesForm, catherine: e.target.value.toUpperCase() })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Mon Planning (agenda CEO)
              <input value={codesForm.planning} onChange={e => setCodesForm({ ...codesForm, planning: e.target.value.toUpperCase() })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Administration (cette section)
              <input value={codesForm.admin} onChange={e => setCodesForm({ ...codesForm, admin: e.target.value.toUpperCase() })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
            <label style={{ color: C.muted }}>Réinitialisation totale (zone dangereuse — garde-le pour toi seul)
              <input value={codesForm.reset} onChange={e => setCodesForm({ ...codesForm, reset: e.target.value.toUpperCase() })} style={{ ...inputStyle, marginTop: 4 }} />
            </label>
          </div>
          <button onClick={saveCodes} style={{ ...btnGold, marginTop: 10 }}><Save size={14} /> {codesSaved ? "Enregistré ✓" : "Enregistrer les codes"}</button>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>Chaque code est indépendant : connaître l'un ne donne accès à aucun autre. Les codes personnels de checklist se modifient individuellement ci-dessus, dans la fiche de chaque membre.</div>
        </Card>
      </div>

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

      <div>
        <H2>Zone dangereuse</H2>
        <Card style={{ borderColor: C.rust }}>
          <Eyebrow>Réinitialiser toutes les données</Eyebrow>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Efface tous les clients, dépenses, dettes, prospections, tâches Kanban, coches de checklist, disponibilités, devis et liens — remet l'objectif à 250 000 FCFA. L'équipe et les codes d'accès ne sont pas touchés. Action irréversible.</div>
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
    </div>
  );
}

/* ---------------------------------- SHARED STYLES ---------------------------------- */
const inputStyle = { background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "9px 10px", fontSize: 13, width: "100%" };
const btnGold = { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: C.gold, color: "#1A1300", border: "none", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const iconBtn = { background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, padding: "3px 6px", fontSize: 11, cursor: "pointer" };
