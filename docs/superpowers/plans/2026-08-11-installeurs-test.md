# Plan — Installeurs de test des 3 apps TCIT — ✅ EXÉCUTÉ le 03/09/2026

> **BILAN — les 4 chantiers sont faits, les installeurs sont livrés et testés.**
>
> **Livrable :** `F:\AI PROJECTS\TCIT-Test-0.9.0.zip` (286 Mo) = 3 setups NSIS numérotés +
> `LISEZ-MOI.txt` (notice utilisateur en français). Sources : `F:\AI PROJECTS\livraison-test\`.
>
> **Vérifié en conditions réelles** : installation des 3 apps dans un dossier choisi
> (`F:\AI PROJECTS\TCIT Install doc`), démarrage des 3, serveur d'affichage actif sur le port
> 8000, base copiée automatiquement vers `userData` au 1er lancement, raccourcis bureau à
> l'icône TCIT. Puis désinstallation complète re-vérifiée (registre, dossiers, raccourcis).
>
> ### 🔴 Pièges rencontrés (à ne pas réapprendre)
> 1. **Prisma** — `node_modules/.prisma` n'est **jamais** inclus dans l'asar par electron-builder
>    (dossier masqué, filtré même en le listant dans `files`). Le copier à côté ne suffit pas : la
>    résolution part de l'asar → *« Cannot find module '.prisma/client/default' »* au démarrage.
>    **Solution retenue : `"asar": false` + extraResources `node_modules/.prisma/client` →
>    `app/node_modules/.prisma/client`.**
> 2. **`ELECTRON_RUN_AS_NODE=1`** est présent dans l'environnement de la session Claude : tout
>    `.exe` Electron lancé depuis là démarre en mode Node et sort aussitôt. Le retirer avant tout
>    test de build.
> 3. **NSIS `/D=` ne supporte pas les espaces** en installation silencieuse (« F:\AI PROJECTS\… »
>    devient `F:\AI`). Contournement pour les tests : jonction sans espace
>    (`mklink /J`). Sans impact pour l'utilisateur final (l'installeur graphique gère les espaces).
> 4. Le dossier `userData` s'appelle **`tcit-desktop`** (champ `name`), pas `TCIT`.
>
> ### Reste éventuel
> Un **installeur unique** posant les 3 apps d'un coup — mis en pause à la demande de
> l'utilisateur (le choix initial était 3 setups séparés).

---

## Plan d'origine (référence)

**Objectif :** Produire 3 installeurs Windows (NSIS) de test — TCIT (principale), Affichage,
Pointage — réunis dans un ZIP avec notice, pour qu'un collaborateur installe et teste le **flux
complet sur une seule machine**, afin de remonter bugs/améliorations avant finalisation.

**Décisions validées :**
- **Portée :** tester AUSSI le flux inter-apps (sur une seule machine).
- **Format :** 3 installeurs NSIS séparés + ZIP + `LISEZ-MOI.txt`.
- **Icône :** générer une icône TCIT pour les 3 apps.

## Faisabilité inter-apps — CONFIRMÉE (mono-machine, sans réseau)
- **TCIT → Pointage : automatique.** Les deux utilisent `cheminBaseM()` =
  `%PROGRAMDATA%\TCIT\stca-m.json` (fichier identique dupliqué dans les 2 repos). L'app
  principale fait un write-through additif : `STCA-Electron/src/main/index.ts:242`
  `upsertEnregistrement(cheminBaseM(), …)`. Pointage lit + surveille ce fichier → live.
- **Guichet → Affichage :** l'app principale envoie sur `ws://<ip>:8000` (défaut IP
  `192.168.0.25`, `STCA-Electron/src/main/afficheur.ts:24`). Pour un test mono-machine →
  **pré-régler l'IP afficheur sur `127.0.0.1`** (paramètre `affichage.ip`).

---

## Chantier A — Packaging de l'app principale (Prisma/SQLite) 🔴 LE point délicat
Fichiers : `STCA-Electron/package.json` (bloc `build`), `STCA-Electron/src/main/db.ts:11-16`.
1. **asarUnpack du moteur Prisma** — ajouter au `build` :
   `"asarUnpack": ["**/node_modules/.prisma/**", "**/node_modules/@prisma/client/**"]`
   (sinon l'app **plante au lancement** : moteur natif introuvable dans l'asar).
2. **Expédier la base seedée** — `"extraResources": [{ "from": "prisma/stca.db", "to": "stca.db" }]`
   (contient l'index VIN + référentiels).
3. **Copie au 1er lancement (la « Phase 4 » manquante)** dans `db.ts` : si `userData/stca.db`
   absent → copier depuis `process.resourcesPath/stca.db`. Garder le fallback dev inchangé.
   `getPrisma()` utilise déjà `datasourceUrl: dbUrl()` → OK une fois la copie faite.
4. **`prisma generate` avant le build** (client + moteur natif présents dans node_modules).

Affichage et Pointage n'ont **pas** de base native → packaging simple (juste icône + build).
Rappel dépendance : `tcit-ui` en `file:../tcit-ui` → **builder `tcit-ui` d'abord**.

## Chantier B — Icône TCIT (les 3 apps)
1. Générer `resources/icon.ico` (256/128/64/48/32/16), motif étoile TCIT cohérent avec le splash.
2. STCA-Electron : `resources/icon.ico` **déjà référencé** dans le build → juste créer le fichier.
3. Affichage + Pointage : créer `resources/icon.ico` + ajouter `"icon": "resources/icon.ico"`
   dans `build.win`.

## Chantier C — Données d'exemple + config de test
1. Semer ~8-10 enregistrements de démo (`prisma/seed.mjs` ou script dédié) → visibles dans TCIT,
   l'Affichage et Pointage (via write-through).
2. Pré-semer les paramètres : `affichage.ip = 127.0.0.1`, `affichage.actif = true`,
   `affichage.port = 8000`.
3. **Un seul compte de démo** documenté (⚠️ le build contient les comptes d'amorçage à mdp en
   clair — item 🔴 B1 de la revue ; ne pas diffuser largement, ne donner que le compte de démo).
4. Étiquetage : `version` → `0.9.0-test` dans les 3 `package.json` ; `artifactName` clair.

## Chantier D — Fabrication + livraison
1. `npm run package` dans chaque app (ordre : **tcit-ui build** → Affichage/Pointage → principale).
   Sortie : `dist/*.exe`.
2. Réunir les 3 `setup.exe` dans un **ZIP + `LISEZ-MOI.txt`** :
   - Ordre d'installation ; avertissement **SmartScreen** (non signé → *Informations
     complémentaires → Exécuter quand même*) ; compte de démo.
   - **Scénario de test du flux :** « Connecte-toi à TCIT → active l'afficheur (127.0.0.1) →
     enregistre un véhicule → vérifie qu'il apparaît sur l'Affichage et devient pointable dans
     Pointage. »
3. **Test à blanc par moi** : installer les 3 sur cette machine, dérouler le scénario, corriger
   AVANT livraison.

## Risques / notes
- **Prisma = le point qui peut casser le lancement** → tester en tout premier après le build.
- Non signé → SmartScreen (documenté, acceptable pour un test de confiance).
- Build de test = comptes d'amorçage embarqués (mdp en clair) → limiter au compte de démo.

## Voir aussi
- Revue application : `docs/superpowers/revue-application-checklist.md` (items B1, A1…).
