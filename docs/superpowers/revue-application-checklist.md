# Revue de l'application TCIT — Checklist (à démarrer plus tard)

**Date de la revue :** 2026-08-06
**Statut :** ⏸️ EN ATTENTE — à traiter lors de la passe de finalisation, avant la mise en production sur serveur Windows Server.
**Contexte :** revue complète (coquilles vides, sécurité, fonctions en suspens, améliorations) sur `STCA-Electron`. Première passe sur les zones à risque — à approfondir au cas par cas au moment de l'exécution.

---

## 🎯 Ordre de priorité conseillé
1. 🔴 **B1** — Mots de passe en clair dans le code source (à traiter AVANT le serveur).
2. 🟠 **A1** — Compteurs "véhicules/destination" calculés sur des données fictives.
3. 🟠 **B3 + B2** — Fenêtres MDI ouvrables sans login + comptes sans mot de passe.
4. Le reste selon le temps / la valeur.

---

## A. Coquilles vides / fonctions fantômes

- [ ] **A1 — Données FICTIVES en production** 🟠
  Les compteurs « véhicules par destination » sont calculés depuis `mockVehicules` (≈100 véhicules bidons codés en dur), PAS la vraie base → chiffres faux affichés.
  📍 `src/renderer/src/pages/OutilsConfigWindows.tsx:232` (import ligne 7).
  → **Corriger** : brancher sur la vraie base (via un IPC de comptage par destination).

- [ ] **A2 — Onglet « Mode assurance — à venir » (vide)**
  Onglet réservé, purement placeholder.
  📍 `src/renderer/src/pages/ConfigConnexionsWindow.tsx:151-165` (`OngletReserve`).
  → Compléter la fonctionnalité **ou** masquer l'onglet tant qu'elle n'existe pas.

- [ ] **A3 — Code mort « Document non encore implémenté »**
  Vestige : les 10 options d'édition mènent TOUTES à des documents implémentés (facture, CG, fiche ID, feuillets 1/2/3), donc la branche `notImplemented()` + la simulation `setTimeout(800)` sont **inatteignables**. Commentaire trompeur (« pas encore implémentés »).
  📍 `src/renderer/src/pages/EnregistrementPage.tsx:1019-1023, 1042, 1063-1068`.
  → Retirer le code mort + le commentaire.

- [ ] **A4 — Champ « plage de pages » désactivé**
  Input `disabled` (impression par plage « 1-10, 25-30, 35 ») jamais branché.
  📍 `src/renderer/src/components/PrintPreviewShell.tsx:64`.
  → Implémenter l'impression par plage **ou** retirer le champ.

- [ ] **A5 — Dossier `mock/` = nom trompeur (dette de nommage)**
  Les 10 stores (`vehiculesStore`, `assurancesStore`, `printConfig`, `adminConfig`, `historiquesStore`, `destinationsStore`, `marquesStore`, `typesVehiculeStore`, `utilisateursStore`, `archivesStore`) servent en réalité de **vraies données persistées** (base / localStorage), pas des mocks.
  📍 `src/renderer/src/mock/` (+ type `MockVehicule` partout).
  → Renommer `mock/` → `stores/` (et `MockVehicule` → `VehiculeDto`) pour la clarté. Retirer le vrai faux restant : `mockVehicules` / `creerVehicule` (`mock/vehicules.ts`) une fois A1 corrigé.

- [ ] **A6 — Filet « fenêtre non configurée »** (pour info, pas un bug)
  Fallback affiché si un id de fenêtre n'est pas routé.
  📍 `src/renderer/src/windows/WindowContent.tsx:148-153`.
  → Vérifier qu'aucun item de menu/sidebar ne tombe dessus (a priori non). Laisser tel quel.

## B. Sécurité

- [ ] **B1 — 🔴 CRITIQUE : mots de passe en clair dans le code source**
  17 comptes d'amorçage avec mots de passe **en clair** (dont 9 admins : `Admin2024`, `Conf#2024`, `Ode7788`, `Awmax`, `Oli#2024`, `Vict#2024`…), **poussés sur GitHub**. En prod, ces comptes existent avec ces mots de passe connus. (L'auth elle-même hache bien — c'est la SEED en clair le problème.)
  📍 `src/main/referentiels.ts:388-406`.
  → **Écran « premier lancement »** qui force l'admin à (re)définir les mots de passe + supprimer les comptes de démo ; sortir les mdp du code (saisis au 1er lancement / variable d'env). **Vérifier que le dépôt GitHub est PRIVÉ.** Faire tourner les mots de passe compromis.

- [ ] **B2 — 🟠 Comptes sans mot de passe autorisés**
  Un compte peut être créé sans mot de passe → connexion avec mot de passe vide.
  📍 `src/renderer/src/pages/UserManagementWindow.tsx:298, 341` (« Laisser vide = aucun mot de passe »).
  → Décider si acceptable (opérateurs à saisie rapide) ; sinon imposer un mot de passe minimal.

- [ ] **B3 — 🟠 Fenêtres MDI ouvrables sans session authentifiée**
  La route `#/mdi/:id` et le handler `mdi:open` ne revérifient pas qu'une session est active (déjà relevé le 2026-08-03, voir [[project-stca-mdi-architecture]]). Non exploitable en prod (pas de port debug), mais faille de défense en profondeur.
  📍 `src/main/index.ts` (handler `mdi:open`).
  → Le main refuse `mdi:open` tant qu'aucune session n'est signalée active (le renderer notifie après login).

- [ ] **B4 — 🟡 `sandbox: false` sur les BrowserWindows**
  Le préload tourne avec accès Node complet.
  📍 `src/main/index.ts:117` (MDI) et `:425` (fenêtre principale).
  → Évaluer l'activation du sandbox (demande d'adapter le préload). Faible priorité (préload = notre code).

- [x] **✅ Bons points (rien à faire)** — auth **scrypt + sel + timingSafeEqual**, mots de passe **jamais renvoyés au renderer** (`••••••`), **CSP stricte** (`default-src 'self'`, pas de script externe/inline), `contextIsolation` activé (défaut Electron 28), `nodeIntegration` désactivé.

## C. Fonctions en suspens (décisions déjà prises)

- [ ] **C1 — Migration base SQLite locale → serveur** (PostgreSQL, « Phase 4 » prévue au schéma). Chaque poste a sa base locale aujourd'hui. → Serveur Windows Server à venir.
- [ ] **C2 — Partage de l'apprentissage du décodeur entre postes** — reporté à la migration serveur (décision 2026-08-03).
- [ ] **C3 — Import des 338k historiques (HFSQL)** dans l'index du décodeur — quand l'accès sera possible (gros bond attendu).
- [ ] **C4 — Config/calibrage d'impression en localStorage** (`src/renderer/src/mock/printConfig.ts`) — par poste (OK pour les imprimantes physiques) MAIS **non sauvegardé centralement** (perdu si cache vidé / poste réinstallé → recalibrer). Certaines options « métier » (nom d'état, code-barres) gagneraient à être partagées. → À trancher à la migration serveur (voir D5).

## D. Améliorations proposées

- [ ] **D1 — Écran « premier lancement »** : forcer la définition des mots de passe admin + purge des comptes démo (résout B1 ; le plus urgent avant le serveur).
- [ ] **D2 — Journal d'audit** : tracer connexions et créations/modifications/suppressions d'enregistrements (précieux pour un logiciel officiel gouvernemental + traçabilité). Aujourd'hui `NomUtilisateur` est saisi mais il n'y a pas de journal d'événements.
- [ ] **D3 — Sauvegarde automatique quotidienne** de la base (hors-machine) — surtout avant/dès le serveur.
- [ ] **D4 — Déconnexion / verrouillage auto** après inactivité (poste laissé ouvert).
- [ ] **D5 — Calibrage & config d'impression en base** (partagé + sauvegardé) plutôt que localStorage (voir C4).
- [ ] **D6 — Décodeur « et plus »** : providers API en ligne pluggables (17vin MB/BMW, vindecoder.eu) au-delà de NHTSA ; affiner la granularité de signature.

---

## Reprise
Ce fichier est la **liste de travail** de la finalisation. À la reprise : trancher item par item (corriger / éliminer / laisser), cocher au fur et à mesure. Voir aussi [[project-stca-mdi-architecture]] (B3) et [[project-stca-vin-decodeur]] (C2/C3/D6).
