# Session 2026-07-25 — Migration utilisateurs (Phase 3) + Brainstorming Poste d'affichage

## Partie 1 — ✅ Migration UTILISATEURS en base (Phase 3) — TERMINÉE, VALIDÉE, COMMITÉE

**Commit `8fcbebf` (poussé sur `main`).** 5ᵉ domaine migré localStorage → SQLite (après types véhicule, destinations, marques, assurances). Reste seulement les **enregistrements** pour clore la Phase 3.

- Table `utilisateur` en base. Mots de passe **HACHÉS scrypt** (`salt:hash`) côté main, **jamais renvoyés** au renderer (liste masquée `••••••`, aucun champ `motDePasse` réel exposé).
- Auth login + garde admin (`adminPasswordValid`) vérifiées **côté main** via IPC async.
- Forçage admin persisté en table `Parametre` (`mdp.forcage`).
- Protection **« dernier administrateur actif »** (rétrograder / désactiver / supprimer les 3 refusés).
- Amorçage haché par l'app (`amorcerUtilisateurs`, 17 users) ; `seed.mjs` ne peuple plus les users.
- Fichiers : `referentiels.ts` (bloc users + scrypt), `utilisateursStore.ts` (async cache+hook), `adminConfig.ts` (async), `LoginPage`/`MdpAdminGate`/`ClefAdminFlow` (async), `UserManagementWindow` (async, mdp non consultable), `MenuBar.tsx`.
- **Tests E2E réels via CDP** (tous verts) : login correct/faux/casse-insensible, garde admin (forçage + admin actif + faux refusé), liste masquée, `authAdmin` admin/non-admin, ajout + login du nouveau (haché), doublon refusé, changement de mdp (nouveau ok / ancien refusé), suppression, protection dernier admin (3 opérations), forçage set/lu/effacé, synchro `db:changed('utilisateurs')`, **vrai login par l'UI** → MainScreen « utilisateur : awute ».
- **Bonus commités** : 4 erreurs de type latentes corrigées → **typecheck 100 % vert** (3× `const fermer = (): void => { window.dispatchEvent(...) }` avec accolades ; mock `MdiWindow.test.tsx` complété avec `defaultX/defaultY`). En-tête « utilisateur : » agrandi (12px) + **point vert de connexion** (comme « Mode Client/Serveur »).

Outillage de test réutilisable créé (scratchpad) : `cdp-eval.mjs` (évalue du JS async dans le renderer via CDP 9222, `WebSocket` global Node) et `cdp-shot.mjs` (capture d'écran CDP). ⚠️ Rappel : Node 24 a `WebSocket` global (ne pas importer `ws`), API navigateur (`onmessage`/`onopen`).

## Partie 2 — 🎨 BRAINSTORMING « Poste d'affichage N° Immatriculation + N° Tri » — DESIGN VALIDÉ, doc écrit

Reproduction modernisée du « Poste Plaques » de STCA II (petit logiciel séparé sur `192.168.0.25:8000` qui affiche aux opérateurs l'immat + tri après chaque enregistrement, pour retrouver la plaque pré-fabriquée). **Pas d'accès base** : il n'affiche que ce qu'on lui envoie.

**Ce que je savais vraiment de l'ancien** (dit honnêtement à l'utilisateur) : envoi par **socket TCP** après chaque save (config IP/port existante) — mais le **format WinDev exact n'a jamais été rétro-conçu**. Sans importance : on construit les deux bouts → on choisit notre protocole.

**Décisions validées (via questions) :**
- App Electron **autonome** ; écran = **serveur**, guichets STCA = **clients** ; transport **WebSocket**.
- Infos affichées : Immat, Tri, Marque/Modèle, Châssis, Destination (couleur), Guichet+Agent, ancienneté.
- Sortie de file = clic **« Plaque traitée »** (renommé depuis « Plaque remise » sur demande — pas la fin du circuit).
- Périmètre **bout en bout** : écran + émetteur STCA + fenêtre Config. Poste.
- Robustesse retenue : file **persistée** (survit au redémarrage), STCA **bufferise** si écran hors ligne (reconnexion + ack), **signal sonore** à l'arrivée. **PAS** de démarrage auto/kiosque imposé.

**Design visuel VALIDÉ** (« ok on garde ça », finition premium plus tard). Maquette : `prototype-html/poste-affichage-propositions.html` (2 modes : réduit + déroulé, boutons de bascule + « simuler perte réseau »). Itérations faites avec l'utilisateur :
- En-tête ET pied **bleu nuit** (`#1B3A6B`, comme les barres titre/statut de MainScreen), corps **blanc dominant dégradé** (effet 3D des cartes, ombres marquées).
- Immat géante marine + numéro central bleu accent (`#2563EB`) ; en mode réduit tient sur 1 ligne (`nowrap` + clamp).
- Badge destination coloré (palette plaques) ; panneau **« File d'attente » encadré** d'un trait fin ; **fin liseré bleu** (1,5px accent) tout autour ; **trait drapeau togolais subtil** (dégradé continu, bords fondus par masque, reflet glissant) sur le **bord supérieur du pied**.
- Badge « N en attente » **agrandi** (info importante).

**Document de conception écrit** : `docs/superpowers/specs/2026-07-25-poste-affichage-immatriculation-design.md` (architecture, protocole WS complet `hello`/`enregistrement`/`ack`, file+persistance, émetteur STCA+buffer, fenêtre Config, tests unitaires+E2E, structure fichiers).

## ▶️ REPRISE PROCHAINE SESSION — exactement ici

**Le design du poste d'affichage est figé, le doc de conception est écrit.** Il reste **2 décisions ouvertes** avant `/planification` :

1. **① Emplacement du code (À TRANCHER par l'utilisateur)** — ma reco : **projet Electron séparé** `STCA-Affichage/` (voisin, installateur indépendant) vs le garder dans STCA-Electron. **En attente de sa réponse.**
2. **② Fenêtre Config. Poste** — la vieille capture mentionnait aussi un « mode assurance » ; clarifier sa sémantique (même interrupteur que la mise en service de Config. Assurances ?) **avant** de coder cette fenêtre (Règle 20). Non bloquant pour démarrer l'app d'affichage.

**Étape suivante** : l'utilisateur répond sur ① (et ②), puis on invoque `/planification` pour le plan d'implémentation détaillé, puis on code (app d'affichage d'abord, puis émetteur STCA + Config).

**Rappel Phase 3** : après le poste d'affichage, il restera **les enregistrements** (le cœur, session dédiée) pour clore la migration base.
