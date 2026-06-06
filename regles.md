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
- **Dossier de travail :** `D:\Programmation Doc\AI PROJECTS\STCA-Electron\`
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
2. **Mettre à jour la mémoire** Claude : `C:\Users\MaxFox\.claude\projects\C--Users-MaxFox\memory\`
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
D:\Programmation Doc\AI PROJECTS\STCA-Electron\
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

## Plan d'exécution (rappel rapide)

| Phase | Description | Statut |
|-------|-------------|--------|
| 1 | Analyse & Architecture | ✅ Terminé |
| 2 | Exploration STCA II | 🔄 En cours |
| 2.3 | Menu Analyse → rapports | 🔄 **Reprendre ici** |
| 2.4 | Menu Assurances | ❌ |
| 2.5 | Menu Outils+Config. | ❌ |
| 2.6 | Tables PARAMDESTINATION + TYPEASSURANCE | ❌ |
| 3 | Développement Electron | ❌ |
| 4 | Tests & Déploiement | ❌ |
