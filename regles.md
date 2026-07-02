# Règles & Méthodes de travail — STCA-Electron

---

## Contexte projet
- **App :** STCA-Electron — reproduction moderne de STCA II (enregistrement véhicules en transit, Togo)
- **Stack :**
  - Frontend : Electron + React + Ant Design + Framer Motion + Tailwind CSS
  - Backend : Node.js + Express + Prisma + PostgreSQL
  - Packaging : Electron Builder (.exe)
- **Architecture :** Client/Serveur — clients Electron sur postes, serveur Node.js+PG (LAN ou VPS)
- **Repo GitHub :** https://github.com/Awute-Maxime/stca_project.git
- **Dossier de travail :** `F:\AI PROJECTS\STCA-Electron\`
- **Phase actuelle :** Phase 2 — Exploration STCA II (en cours) → interrompu au menu Analyse (choix type rapport)

---

## Checklist début de session

1. Lire `MEMORY.md` (mémoire Claude)
2. Lire ce fichier (`regles.md`)
3. Annoncer en 3 lignes : **ce qui est fait / où on en est / prochaine étape**

---

## Règle 1 — Langue & Communication

- Toujours répondre en **français**
- Réponses courtes et directes — pas de longs résumés non demandés
- À la fin d'une tâche longue : une ligne **"Fait / Prochaine étape"**
- Utiliser des tableaux et listes pour les récapitulatifs

---

## Règle 2 — Mode de travail

- **Autonomie totale** sur les actions locales et réversibles (pas de confirmation pour chaque étape)
- Confirmation requise uniquement pour actions **destructives ou irréversibles**
- Principe fondamental : **explorer entièrement avant de développer**
  - Ne pas commencer la Phase 3 (dev) sans avoir terminé la Phase 2 (exploration)

---

## Règle 3 — Commande `sauvegarde`

Quand l'utilisateur dit **"sauvegarde"**, exécuter dans l'ordre :

1. **Créer/mettre à jour** `docs/session-AAAA-MM-JJ.md` avec le résumé complet de la session
2. **Mettre à jour la mémoire** Claude : `C:\Users\MaxFox II\.claude\projects\C--Users-MaxFox-II\memory\`
   - Mettre à jour `project-stca-electron.md` (phase actuelle, dernière étape)
   - Mettre à jour `MEMORY.md` (index)
3. **Git commit + push** :
   ```
   git add -A
   git commit -m "Sauvegarde session AAAA-MM-JJ"
   git push
   ```
   - git : `C:\Program Files\Git\cmd\git.exe`
   - gh CLI : `C:\Program Files\GitHub CLI\gh.exe`
   - Branche : `main`

---

## Règle 4 — Automatisation UI Win32 (dual-monitor)

Configuration machine :
- Écran primaire : X=0 à 1920, Y=0 à 1080
- Écran secondaire : X=-1920 à 0, Y=0 à 1080 (STCA II tourne ici)
- DPI : 96 (pas de scaling)

Règles impératives :
- **Toujours ajouter `MOUSEEVENTF_VIRTUALDESK` (0x4000)** aux flags `mouse_event` pour l'écran secondaire
  - Move+Abs : `0xC001` | Left down : `0xC002` | Left up : `0xC004`
  - Formule : `ax = (screenX + 1920) * 65535.0 / 3840`
  - Sans ce flag → les coords mappent sur l'écran primaire seulement (bug silencieux)
- **`Add-Type` doit être redéfini dans chaque appel PowerShell** — ne persiste pas entre sessions
- **Prendre un screenshot de vérification** après chaque action UI critique
- Si une approche échoue **2 fois** → tester une alternative (ne pas répéter)

Coordonnées STCA II (fenêtre secondaire) :
- Fenêtre principale : L=-1547, T=161, R=-266, B=891
- Menu "Analyse" : screen x=-1275, y=201
- Menu "Assurances" : screen x=-1204, y=201
- Menu "Outils+Config." : screen x=-1110, y=201

---

## Règle 5 — Identifiants & Accès

| Système | Utilisateur | Mot de passe |
|---------|-------------|-------------|
| STCA II (login) | awute | Awmax |
| STCA II (forçage admin) | — | Awmax |
| HFSQL C/S | Admin | Admin |

---

## Règle 6 — Git & GitHub

```powershell
$git = "C:\Program Files\Git\cmd\git.exe"
$gh  = "C:\Program Files\GitHub CLI\gh.exe"
```

- Remote : `https://github.com/Awute-Maxime/stca_project.git`
- Branche principale : `main`
- Commit message format : `"[Phase X] Description courte"`

---

## Règle 7 — Emplacement des fichiers créés

**Règle absolue : ne jamais créer de fichier dans `C:\Users\MaxFox\` ni sur le Bureau.**

Tout output (captures d'écran, fichiers temporaires, notes) doit aller directement dans le dossier projet :
```
F:\AI PROJECTS\STCA-Electron\
```
- Captures d'écran → `docs\screenshots\`
- Notes session → `docs\`
- Code → sous-dossiers appropriés

---

## Règle 8 — Structure des fichiers projet

```
STCA-Electron\
├── docs\
│   ├── session-exploration-STCA-II.md   ← notes exploration complètes
│   └── session-AAAA-MM-JJ.md            ← notes par session (sauvegarde)
├── regles.md                             ← CE FICHIER
├── CLAUDE.md                             ← lu automatiquement par Claude Code
├── README.md
└── .gitignore
```

---

## Règle 9 — Sauvegarde automatique en fin de session

**Quand le contexte de session approche 90% de la limite :**
- Déclencher automatiquement la commande `sauvegarde` (Règle 3) sans attendre l'instruction de l'utilisateur
- Annoncer clairement : "⚠️ Limite de session à 90% — sauvegarde automatique en cours"
- Inclure dans le résumé session tout ce qui a été exploré depuis la dernière sauvegarde

---

## Règle 10 — Architecture MDI Electron (ajoutée 10/06/2026)

**Règle absolue : les fenêtres MDI = BrowserWindows Electron séparées, jamais des éléments HTML.**

Raison : les éléments HTML (même avec `position:fixed`) ne peuvent jamais dépasser le bord de la fenêtre Electron hôte au niveau OS. Pour des fenêtres vraiment libres (comme STCA-II original), il faut de vraies `BrowserWindow`.

Architecture implémentée :
- Sidebar/menu click → `electronApi.mdiOpen({ id, x, y, width, height })`
- IPC `mdi:open` → main process crée une `BrowserWindow` frameless
- Chaque enfant charge `#/mdi/:id` → `MdiWindowHost` component
- Barre de titre : `WebkitAppRegion: 'drag'` (drag natif OS, va partout)
- Boutons : IPC `mdi:self:close/minimize/maximize` → `BrowserWindow.fromWebContents(e.sender)`
- Un seul instance par id (focus si déjà ouverte)

---

## Règle 11 — Variable d'environnement ELECTRON_RUN_AS_NODE (ajoutée 10/06/2026)

**Toujours exécuter `unset ELECTRON_RUN_AS_NODE` avant `npm run dev` dans Bash.**

Raison : si `ELECTRON_RUN_AS_NODE=1`, Electron se comporte comme Node.js et `require('electron')` retourne le chemin de l'exécutable (string) au lieu du module Electron. Résultat : `electron.app` est `undefined` et l'app plante au démarrage avec `TypeError: Cannot read properties of undefined (reading 'whenReady')`.

Dans PowerShell : `$env:ELECTRON_RUN_AS_NODE = $null`

**Méthode complète pour lancer ET piloter l'app Electron réelle (validée 02/07/2026) :**
```bash
cd "F:\AI PROJECTS\STCA-Electron"
unset ELECTRON_RUN_AS_NODE
npx electron-vite dev -- --remote-debugging-port=9222   # en background

# Pilotage via CLI chrome-devtools (npm i -g chrome-devtools-mcp, une fois) :
chrome-devtools stop
chrome-devtools start --browserUrl "http://127.0.0.1:9222"
chrome-devtools list_pages   # chaque BrowserWindow = une page
```
- Inputs React contrôlés : setter natif + `dispatchEvent(new Event('input'|'change', {bubbles:true}))`
- Lire l'état APRÈS un clic dans un 2e `evaluate_script` (re-render asynchrone)
- « Protocol error: Target closed » pendant une fermeture de fenêtre = comportement attendu

---

## Règle 12 — Design visuel : PREMIUM DARK uniquement (ajoutée 10/06/2026)

**Ne jamais proposer un design "safe" ou basique pour STCA-Electron.**

L'utilisateur veut un design digne d'un designer senior 15 ans grands comptes. Référence : Vercel, Linear, Stripe dashboard — dark, clean, premium.

Palette officielle du projet :
```
bg:          #080f1d   (deep navy — fond principal fenêtres MDI)
surface:     rgba(255,255,255,0.04)
border:      rgba(255,255,255,0.09)
borderFocus: rgba(79,156,249,0.55)
accent:      #4F9CF9   (electric blue — interactions)
gold:        #F5A623   (gold — badge IMMAT, highlights importants)
green:       #10B981   (montant, succès)
text:        #E8EDF5
muted:       #7890A8
label:       #546A82
```

Animations obligatoires : `formEnter`, `immatReveal`, `immatPulse`, `shimmer` (définis dans `index.css`).
Classe CSS `.mdi-dark` sur le container root de chaque fenêtre enfant.

---

## Règle 13 — Formulaire enregistrement : compact, une page, sans scroll (ajoutée 10/06/2026)

Le formulaire d'enregistrement (`EnregistrementPage.tsx`) DOIT tenir en une seule page sans scroll dans une fenêtre de ~590px de hauteur.

Contraintes :
- Pas de `<Card>` Ant Design (trop de padding)
- Labels : 10px, inputs : 26-28px de hauteur
- Grid layout 2 colonnes pour les sections
- N° Tri + Date N° Tri sur la même rangée
- `MdiWindow body padding` = 8px (pas 16px)
- `WINDOW_REGISTRY enregistrement height` = 590px

---

## Règle 14 — Port Vite dev (ajoutée 10/06/2026)

Le serveur Vite dev peut utiliser le port **5174** si 5173 est occupé (par une session précédente non terminée).
Toujours tuer les processus Electron/Vite avant de relancer : `pkill -f electron; pkill -f vite`
Puis vérifier le port réel dans la sortie de `npm run dev`.

---

## Règle 15 — Corrections cumulatives, jamais substitutives

Quand une nouvelle correction est demandée, appliquer **uniquement** ce qui est demandé. Ne pas modifier ce qui a été validé précédemment.

- Si résoudre le nouveau problème semble nécessiter de toucher à quelque chose de déjà validé → **signaler d'abord, attendre validation avant d'agir**
- Chaque correction ne cible que l'élément demandé. Le reste est intouchable
- La disposition des champs (ordre, sections, labels) est **verrouillée** dès qu'elle a été validée
- `F:\AI PROJECTS\STCA-Electron\prototype-html\index.html` = **NE JAMAIS TOUCHER** sans demande explicite

---

## Règle 16 — Copie fidèle prototype → Electron (pixel par pixel)

Quand on dit « mise à jour », « copier », « reproduire » ou « porter » du prototype `index.html` vers l'Electron : reproduire **pixel par pixel**. Pas d'approximation, pas d'interprétation libre.

**Méthode obligatoire :**
1. Lire le CSS exact du prototype (couleurs hex, paddings en px, font-sizes, border-radius, gaps)
2. Lire le HTML exact du prototype (même structure, même ordre)
3. Convertir fidèlement en inline styles React avec les MÊMES valeurs numériques
4. Ne jamais inventer — si le prototype a `padding: 9px 14px`, mettre `'9px 14px'`
5. Ne jamais substituer — si le prototype utilise un emoji 📄, ne pas le remplacer par une icône Ant Design

**Violations interdites :**
- Prototype `background: #F5F3EE` → Electron `'#F8FAFF'` ❌
- Prototype `font-size: 10.5px` → Electron `fontSize: 10` ❌
- Prototype `<fieldset>` → Electron `SectionCard` ❌
- Prototype emoji 🕐 → Electron `<ClockCircleOutlined />` ❌

---

## Règle 17 — Modals overlay : pas de fenêtre MDI pour les écrans avec permission admin

Quand une fonctionnalité nécessite un mot de passe admin avant d'afficher son contenu (Analyse, Montant à restituer, etc.) :

- **Intercepter le clic** dans `MainScreen.tsx` (sidebar ou menu) — ne PAS ouvrir de fenêtre MDI
- Afficher le modal mot de passe en **overlay `position:fixed`** sur le MainScreen
- **Aucune fenêtre blanche** ne doit apparaître derrière le modal
- Après validation du mot de passe → afficher la fenêtre complète dans l'overlay
- Les fenêtres overlay doivent avoir : barre de titre (drag), boutons −/□/✕ fonctionnels, redimensionnement (handle coin bas-droit), maximize (double-clic titre)

---

## Règle 18 — Boutons fonctionnels : chaque bouton reproduit l'action exacte du prototype

Chaque bouton de l'interface doit reproduire **l'action exacte** de son équivalent dans le prototype. Pas de placeholder `notification.info()`.

**Actions obligatoires :**
- **Modifier** → ouvre Enregistrement + charge les données du véhicule + ferme la fenêtre source + passe en mode Modification
- **Supprimer** → `WinConfirm` "Voulez-vous supprimer ?" → supprime → rafraîchit la liste
- **Imprimer** → vérifie qu'il y a des données → ouvre l'aperçu impression A4 complet (toolbar, paramètres, miniature, preview)
- **DUPLICATA / Renouvellement** → vérifie sélection → `EditionDocsModal` avec 10 options radio + prévisualiser
- **NON Sortie** → vérifie si véhicule sorti → `WinConfirm` → toggle sortie → rafraîchit

**L'app STCA II réelle est aussi une référence** pour l'organisation des colonnes (14 colonnes Liste Véhicules), le format d'adresse (Pays/Pays), et la disposition visuelle des fenêtres.

---

## Règle 19 — Posture : expert designer & développeur senior (15+ ans, grands comptes)

**Toujours travailler comme un expert designer et développeur avec plus de 15 ans d'expérience auprès de grandes entreprises** (niveau de référence : Vercel, Linear, Stripe). Cela s'applique à chaque proposition, chaque fenêtre, chaque ligne de code — dès le premier jet, pas après corrections.

**Côté design :**
- Finitions soignées d'office : alignements, espacements, hiérarchie typographique, états hover/focus/disabled, cohérence des couleurs
- Exploiter intelligemment l'espace disponible — jamais d'éléments agglutinés ni d'espaces morts
- Fenêtres complètes et professionnelles : boutons réduire/agrandir/fermer fonctionnels, déplaçables, redimensionnables
- Chaque écran doit être **présentable à un client** sans retouche

**Côté code :**
- Code propre, typé (zéro erreur TypeScript sur les fichiers touchés), structuré, commenté là où c'est utile
- Bugs corrigés **à la racine**, jamais de rustine ; vérifier les effets de bord (récursions, states obsolètes, fuites d'événements)
- **Tester réellement dans l'app Electron avant de livrer** — ne jamais annoncer « ça marche » sans preuve

**Côté attitude :**
- Anticiper les cas limites et les signaler avant qu'ils ne deviennent des bugs
- Quand une demande peut être améliorée, proposer mieux — sans jamais imposer

---

## Plan d'exécution (rappel rapide)

| Phase | Description | Statut |
|-------|-------------|--------|
| 1 | Analyse & Architecture | ✅ Terminé |
| 2 | Exploration STCA II | ✅ Terminé (06/06/2026) |
| 3 | Développement Electron (app principale) | 🔄 En cours |
| 4 | Backend PostgreSQL + Express + Prisma | ❌ |
| 5 | Tests & Déploiement | ❌ |

**Phase 3 — État au 10/06/2026 :**
- ✅ Splash screen bleu radial + voiture SVG cyan
- ✅ Login glassmorphism transparent
- ✅ MainScreen (sidebar + menu + statusbar)
- ✅ Architecture MDI multi-BrowserWindow (fenêtres vraiment libres)
- ✅ EnregistrementPage compact (une page, sans scroll)
- ✅ Mock data : 52 véhicules, 10 destinations
- 🔄 Redesign premium dark (interrompu — reprendre avec MdiWindowHost + EnregistrementPage)
- ❌ Autres fenêtres (Destination, Analyse, Liste, Recherche...)

**Phase 4 — Applications connexes prévues :**
- App affichage **N° de Tri** (192.168.0.25:8000) — source fournie par l'utilisateur
- Connexion PostgreSQL via Express/Prisma
