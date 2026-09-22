# ETAT.md — Avancement du projet KBSAUTO

But de ce fichier : garder une trace claire de ce qui est décidé/fait, pour
reprendre le travail sans repartir de zéro (même dans une nouvelle session).
Les entrées les plus récentes sont en haut.

---

## 2026-09-22 — Session commissions, archives, notifications, logo, ébauche SaaS

### ✅ Déployé en production (`app.kbsdigitalagency.com`, branche `main`)
1. **Commissions individuelles uniquement** — pas de "commission d'équipe" :
   chaque membre a son propre pourcentage (10 % par défaut) sur ses propres
   ventes du mois. Taux officiel réglable par le CEO dans
   Administration → Équipe, + pourcentage personnalisable par membre.
2. **Archives mensuelles** (onglet Archives, Ventes & Finance) :
   - Archivage **automatique** au changement de mois (clients & CA,
     trésorerie & dépenses, dettes, objectif atteint), puis remise à zéro.
   - Bouton **« Clôturer un mois »** (Administration → Réinitialisation)
     pour archiver manuellement un mois choisi.
   - La réinitialisation totale archive désormais avant d'effacer.
3. **Police** : Baloo 2 (titres/chiffres) + Nunito (texte), style arrondi.
4. **Navigation** : sous-onglets en pastilles, tous visibles (plus de
   défilement horizontal).
5. **Logo** : nouveau monogramme « K » (dégradé terracotta), régénéré pour
   toutes les icônes (192/512/maskable/apple-touch/favicon) + en-tête + PDF.
6. **Notifications** :
   - Push à l'équipe pour : nouveau client, nouvelle dépense, nouvelle dette,
     nouveau devis.
   - Vibration + `renotify` sur le service worker.
   - Carillon sonore interne (WebAudio, 2 notes) quand l'app est ouverte.
   - Pastilles rouges de non-lus par onglet/catégorie (localStorage) +
     badge système sur l'icône de l'app installée (`navigator.setAppBadge`).
7. **Hébergement** : migration Netlify → Cloudflare Pages
   (`public/_redirects`, `.nvmrc` Node 20, `netlify.toml` supprimé).

### 🟡 Décidé, mais PAS déployé (en pause — priorité repassée sur KBS Gestion)
8. **Vendre KBSAUTO en SaaS** (abonnements 1 mois / 6 mois / 1 an, paiement
   Wave + Orange Money + carte, essai gratuit 7 jours).
   - Une **ébauche Phase 1** (comptes entreprises par email/mot de passe +
     isolation des données par préfixe `org:<uid>:` + écran d'essai/abonnement)
     existe sur la **PR #7** (branche `claude/kbsauto-update-reorganize-qp7iki`),
     **jamais fusionnée, jamais déployée**.
   - ⚠️ **Ne pas fusionner PR #7 en l'état** : l'isolation des données est
     **côté application uniquement** — aucune règle RLS en base ne l'empêche
     techniquement. C'est le point bloquant avant toute vente réelle.
   - Reste à faire avant de vendre pour de vrai : RLS liée à `auth.uid()` sur
     `kbs_storage` ; adapter les fonctions Edge (`generate-client-diagnostic`,
     `send-notification`) au multi-compte ; paiement en ligne (Phase 3, via
     PayDunya ou CinetPay — compte marchand à ouvrir par Kader).
9. **Prix des 3 formules d'abonnement** : encore **provisoires** dans le code
   (`DEFAULT_ABONNEMENTS` : 35 000 / 180 000 / 300 000 FCFA) — jamais
   confirmés par Kader. À corriger avant toute utilisation réelle.
10. **Assistant IA conversationnel** (bulle flottante, accessible partout) —
    pas commencé. Faisable : l'app utilise déjà l'API Anthropic (Claude
    Sonnet) via une fonction Edge Supabase (`generate-client-diagnostic`),
    réutilisable pour un nouvel assistant.
11. **Vente de produits** (catalogue/boutique) — mis en attente à la demande
    de Kader, rien de fait.

### Repères techniques
- Production : branche `main`, dépôt `niangkader62-hue/kbsauto-io`.
- PR de test (ne pas fusionner) : #7 — ébauche SaaS Phase 1.
- Base de données partagée : Supabase (`kbs_storage`, clé/valeur), même
  projet pour la prod et le test SaaS (isolation actuelle = uniquement les
  clés préfixées `org:*`, pas de RLS).
