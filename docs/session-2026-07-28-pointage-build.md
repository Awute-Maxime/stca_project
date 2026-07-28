# Session 2026-07-28 — Nouvelle app « Pointage Sortie Véhicules » (STCA-Pointage) : brainstorming → maquette → build Phases 0-7

Nouvelle **application Electron autonome** de l'écosystème TCIT qui pointe la **sortie** des véhicules prêts à
être escortés par les douaniers (écrit `FlagSortie`/`DateSortie`), imprime le **Bordereau d'Escorte**, et édite
les **listes de véhicules sortis**. Se connecte à la base STCA M (contrairement à l'app d'affichage).

## Déroulé
1. **Brainstorming** → décisions validées (mock partagé d'abord + adaptateur ; « Pointage Véh. » écrit la sortie /
   « Générer Bordereau » imprime seulement ; projet séparé ; pas de login v1 ; signature « TCIT · Pointage » ;
   **fichier partagé** app principale ↔ Pointage). Spec : `docs/superpowers/specs/2026-07-28-pointage-sortie-vehicules-design.md`.
2. **Maquette HTML** interactive validée par l'utilisateur (« on valide comme ça, ajustements au fil de l'eau »),
   + ajout d'une **footbar** (connexion base, poste, sorties du jour, horloge live, filet Togo).
   Fichier : `prototype-html/pointage-sortie-vehicules.html`.
3. **Plan** : `docs/superpowers/plans/2026-07-28-pointage-sortie-vehicules-app.md` (8 phases, TDD).
4. **Build par sous-agents (Sonnet) + revue** — Phases 0 à 7.

## Ce qui est fait (Phases 0-7)
- **Projet `F:\AI PROJECTS\STCA-Pointage\`** (Electron 28 + React 18 + AntD + TS, cloné d'Affichage).
- **Base STCA M** = fichier partagé `%PROGRAMDATA%\TCIT\stca-m.json` (semé au 1er lancement, écriture atomique
  temp+rename, `fs.watch` → synchro live). Logique **pure testée** (`src/main/baseM.ts`, 8 tests) : `chercher`
  (immat / immat+code / TRI), `marquerSortie`, `annulerSortie`, `listerSorties`, `chargerBase`, `ecrireBase`.
- **Electron** : `main/index.ts` (fenêtre, watch, IPC `base:*`), `preload` (`window.pointage`).
- **UI** (copie fidèle de la maquette) : coquille (TitleBar, TabBar, FootBar horloge live), 3 onglets
  (Saisie ZIP, Rech. TRI/IMMAT, Impressions), liste de travail, actions, 2 documents (Bordereau d'Escorte +
  Liste des sorties, impression scindée via `@media print`).
- **Touche additive app principale TCIT** (feu vert utilisateur) : miroir write-through **dans le handler main
  `db:enreg:add`** (plus additif que le plan — ne touche ni preload ni EnregistrementPage), best-effort try/catch.
  Fichiers : `src/main/stcaMShared.ts`, `src/shared/cheminBaseM.ts`, `+ src/shared/**` dans tsconfig.node.

## Vérifications (CDP, apps réelles)
- Rendu identique à la maquette ; IPC round-trip (`chercher('T7471CK')` → KOLO KOSSI depuis le fichier partagé).
- Scan + recherche + pointage → lignes SORTI, compteurs, « Sorties du jour ».
- **Intégration 2 apps** : `window.api.dbEnregAdd(...)` dans TCIT → record apparu dans `stca-m.json` avec le bon
  mapping → record de test supprimé (TCIT DB + fichier). typecheck + build verts (STCA-Pointage ET STCA-Electron).

## Commits
- STCA-Pointage : `a0f1882` scaffold → `c796240`/`bd50fc2`/`ad687d4` base TDD → `f535b6f` electron →
  `669ba60`/`4fc380b` UI onglets → `2aae1eb`/`f679ae9` documents+Impressions. (dépôt git local, sans remote GitHub)
- STCA-Electron : `7c773ee` (module write-through + test) → `f07a05d` (branchement db:enreg:add).

## Reste (non fait)
- **Phase 8** : packaging electron-builder (installeur .exe) — non demandé pour l'instant.
- Remote GitHub pour STCA-Pointage (et STCA-Affichage) — dépôts locaux seulement.
- Ajustements/améliorations « au fil de l'eau » (l'utilisateur).
- Un jour : vrai connecteur HFSQL (remplace l'adaptateur mock, Phase 4 écosystème) ; NomDuParc distinct de
  MaisonTransit dans le modèle de l'app principale (actuellement un seul champ).
