# Plan d'Implémentation (v2 — recette PROUVÉE) : Décodeur VIN efficace

**Objectif :** marque + modèle + année sur ≥ 60 % des châssis réels. **Mesuré à 77 %** (Marque 99 %, Modèle 93 %, Année ±1 79 %) sur ~19 649 VIN jamais vus, via train/test sur la table réelle de 100k fournie par l'utilisateur (`scripts/feasibility*.py`).

**Architecture prouvée :**
- **Cœur = index seedé sur le corpus de 100k.** Clé = **signature** (VIN positions 1-8, repli 1-6) → (marque, modèle) **majoritaires** + **histogramme d'années**. Couverture signature 97 %.
- **Année (règle verrouillée par l'expérience + les données) :** VIN **nord-américain** (WMI commence par 1-5, 14 % du parc) → **position 10** (99 % exact) ; **sinon** (85 %) → **médiane des années de la signature**, désambiguïsée par la position 10 uniquement si elle tombe dans la plage.
- **Secours en ligne (N2c, optionnel, mis en cache)** : NHTSA (déjà là) ; providers pluggables plus tard. **Bouton « site constructeur »** (ouvre toyodiy & co. dans le navigateur, VIN pré-rempli) pour les cas durs + l'année exacte, **sans scraping**.
- Apprentissage continu : chaque **saisie agent** et chaque **décodage NHTSA** nourrissent l'index.

**Stack :** Electron 28 + React + TS + Prisma (SQLite) + Vitest. Types : `npx tsc --noEmit -p tsconfig.web.json && npx tsc --noEmit -p tsconfig.node.json`. Tests : `npx vitest run <f>`. Bash = Git Bash. Commits ciblés (`git add` précis), trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

**Données :** corpus déjà extrait en `scripts/echantillon.csv` (98 821 VIN valides ; colonnes `vin,marque,modele,annee,vehicule`). Spec : `docs/superpowers/specs/2026-08-01-decodeur-vin-efficacite-design.md`.

---

## Phase 1 — Corpus → seed pré-calculé + table WMI (données, hors ligne)

**Fichiers :** créer `scripts/gen-vin-seed.mjs`, `src/main/vinSeed.json` (généré), `src/renderer/src/mock/wmiBase.ts` (généré) ; modifier `.gitignore`.

- [ ] **1.1 — Ignorer les données brutes.** Ajouter à `.gitignore` : `scripts/echantillon.csv` et `scripts/*.xlsx`.
- [ ] **1.2 — Écrire `scripts/gen-vin-seed.mjs`** (Node) : lit `scripts/echantillon.csv`, ne garde que les VIN valides `^[A-HJ-NPR-Z0-9]{17}$`, et produit deux sorties :
  - `src/main/vinSeed.json` — index compact :
    ```json
    { "sig8": { "SB1EA56L": { "mm": [["TOYOTA - RAV4", 120]], "an": [[2014,40],[2015,55],[2016,25]] } },
      "sig6": { "SB1EA5":   { "mm": [["TOYOTA - RAV4", 300]], "an": [[2013,...]] } } }
    ```
    Pour chaque signature (1-8 et 1-6) : top marque-modèle (garder le top 3 avec comptes) + histogramme d'années `[[annee, nb]…]`. Le libellé combine `Marque` + ` - ` + `Modele` (ex. `TOYOTA - RAV4`).
  - `src/renderer/src/mock/wmiBase.ts` — `export const WMI_BASE: Record<string,{marque:string}> = …` : par WMI (3 car.), la **marque majoritaire** du corpus.
  Code clé :
  ```js
  import fs from 'fs'
  const rows = fs.readFileSync('scripts/echantillon.csv','utf8').trim().split(/\r?\n/).slice(1)
  const V = /^[A-HJ-NPR-Z0-9]{17}$/
  const sig = {8:{},6:{}}, wmi = {}
  for (const line of rows) {
    const [vin, marque, modele, annee] = line.split(',')  // ⚠ gérer les virgules dans modele : préférer un vrai parseur CSV
    if (!V.test(vin)) continue
    const lib = [marque, modele].filter(Boolean).join(' - ').trim()
    const an = parseInt(annee, 10)
    for (const n of [8,6]) {
      const s = vin.slice(0,n); const e = (sig[n][s] ??= {mm:{}, an:{}})
      if (lib) e.mm[lib] = (e.mm[lib]||0)+1
      if (an) e.an[an] = (e.an[an]||0)+1
    }
    const w = vin.slice(0,3); (wmi[w] ??= {})[marque] = (wmi[w][marque]||0)+1
  }
  const top3 = o => Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,3)
  const pack = m => Object.fromEntries(Object.entries(m).map(([s,e])=>[s,{mm:top3(e.mm),an:Object.entries(e.an).map(([y,n])=>[+y,n])}]))
  fs.writeFileSync('src/main/vinSeed.json', JSON.stringify({sig8:pack(sig[8]), sig6:pack(sig[6])}))
  const wmiMap = Object.fromEntries(Object.entries(wmi).map(([w,o])=>[w,{marque:top3(o)[0][0]}]))
  fs.writeFileSync('src/renderer/src/mock/wmiBase.ts', 'export const WMI_BASE: Record<string,{marque:string}> = '+JSON.stringify(wmiMap)+'\n')
  ```
  ⚠️ Utiliser un vrai parseur CSV (le champ `modele` contient des virgules/`>>`). Régénérer `echantillon.csv` avec des guillemets, OU parser en gérant les guillemets. **Tâche du sous-agent : garantir un parsing CSV correct** (ex. relire le xlsx via python `scripts/extract_vin.py` en quotant, ou `csv` robuste en JS).
- [ ] **1.3 — Générer** : `node scripts/gen-vin-seed.mjs` → vérifier `vinSeed.json` (≈ 9 937 sig8) et `wmiBase.ts` (≈ 604 WMI).
- [ ] **1.4 — Commit** : `git add scripts/gen-vin-seed.mjs src/main/vinSeed.json src/renderer/src/mock/wmiBase.ts .gitignore` → `"feat(vin): seed index + table WMI générés depuis le corpus 100k"`.

## Phase 2 — Modèle Prisma + module `vinIndex` + import du seed

**Fichiers :** modifier `prisma/schema.prisma` ; créer `src/main/vinIndex.ts`, `src/main/vinIndex.test.ts` ; modifier `src/main/index.ts` (semis+import au démarrage).

- [ ] **2.1 — Prisma** (`schema.prisma`) :
  ```prisma
  model VinIndex {
    id Int @id @default(autoincrement())
    signature String
    marqueModele String
    nbVus Int @default(1)
    source String @default("seed")
    majLe DateTime @updatedAt
    @@unique([signature, marqueModele])
    @@index([signature])
    @@map("vin_index")
  }
  model VinIndexAnnee {
    id Int @id @default(autoincrement())
    signature String
    annee Int
    nb Int @default(1)
    @@unique([signature, annee])
    @@index([signature])
    @@map("vin_index_annee")
  }
  ```
  `npx prisma migrate dev --name vin_index && npx prisma generate`.
- [ ] **2.2 — Tests helpers (échec attendu)** dans `vinIndex.test.ts` : `signatureVin('SB1EA56L60E0E0356')==='SB1EA56L'` ; `libelleAcceptable` rejette `''`/`'INCONNU'`, accepte `'TOYOTA - RAV4'` ; `medianeAnnee([[2014,1],[2015,3],[2016,1]])===2015`.
- [ ] **2.3 — `src/main/vinIndex.ts`** : `signatureVin`, `libelleAcceptable`, `medianeAnnee(hist)`, `apprendre(vin, marqueModele, annee, source)` (upsert VinIndex + VinIndexAnnee), `chercher(vin)` → `{ marqueModele, part, annees: [[an,nb]…] } | null` (sig8 puis repli sig6), `importerSeed()` (lit `./vinSeed.json`, insère en masse, **une seule fois** via flag Parametre `vinSeedImported`), `semer()` (depuis `Enregistrement`). Best-effort (jamais bloquant).
- [ ] **2.4 — Tests helpers verts** : `npx vitest run src/main/vinIndex.test.ts`.
- [ ] **2.5 — Démarrage** (`main/index.ts`, après init DB) : `await importerSeed()` puis `void semer()`. Log des compteurs.
- [ ] **2.6 — Types + commit** : tsc node ; `git add prisma src/main/vinIndex.ts src/main/vinIndex.test.ts src/main/index.ts` → `"feat(vin): index Prisma VinIndex + import du seed 100k"`.

## Phase 3 — Décodeur branché (année NA/signature + modèle)

**Fichiers :** modifier `src/renderer/src/mock/vinDecoder.ts`, `src/renderer/src/mock/vinDecoder.test.ts`, `src/preload/index.ts`, `src/renderer/src/api/electron.ts`, `src/renderer/src/pages/DecodeurVinWindow.tsx` ; IPC dans `src/main/index.ts`.

- [ ] **3.1 — `ResultatVin`** : ajouter `modele: string` (défaut `'—'`) et `anneeSource: 'position10' | 'signature' | 'aucune'`. Garder `annee`/`anneeIncertaine`.
- [ ] **3.2 — Règle année** dans `vinDecoder.ts` (test d'abord) :
  ```ts
  export function estAmeriqueNord(vin: string): boolean { return /^[1-5]/.test(vin) }
  // années possibles depuis le code position 10 (deux cycles)
  export function anneesCandidates(code: string): number[] { /* AN_ANCIEN[code], AN_RECENT[code] */ }
  export function choisirAnnee(vin: string, hist: Array<[number,number]>): { annee: string; source: string } {
    // NA → position 10 (désambig pos.7) ; sinon → médiane(hist), et si un candidat pos10 ∈ [min,max] de hist → le préférer
  }
  ```
  Tests : NA VIN → pos10 ; non-NA avec hist → médiane ; non-NA avec pos10 dans la plage → pos10.
- [ ] **3.3 — IPC lookup** (`main/index.ts`) : `ipcMain.handle('vin:indexLookup', (_e, vin) => import('./vinIndex').then(m => m.chercher(vin)))`. Exposer `vinIndexLookup` (preload + `api/electron.ts`, repli `null`), sur le modèle de `vinDecodeOnline`.
- [ ] **3.4 — `decoder()`** (DecodeurVinWindow) : après décodage local, `const idx = await electronApi.vinIndexLookup(local.vin)` ; si hit → `modele = idx.marqueModele`, `annee = choisirAnnee(vin, idx.annees)`, confiance selon `idx.part`. `insuffisant = !idx || idx.part < seuil` déclenche NHTSA.
- [ ] **3.5 — UI** : lignes « Modèle » et « Année » (avec indicateur d'estimation si `anneeSource==='signature'`, ex. « ≈ 2018 »). tsc + commit `"feat(vin): décodeur branché sur l'index (modèle + année NA/signature)"`.

## Phase 4 — Apprentissage live + bouton « site constructeur » + N2c

**Fichiers :** modifier `src/main/enregistrements.ts`, `src/main/index.ts` (NHTSA apprend + openExternal) ; `preload` + `api/electron.ts` ; `DecodeurVinWindow.tsx`.

- [ ] **4.1 — Apprendre après saisie** : dans `enregistrementAdd` après succès, `void (await import('./vinIndex')).apprendre(String(data.vin), String(data.marqueModele), 0, 'saisie')` (année via VIN si dispo, sinon 0 = ignorée).
- [ ] **4.2 — Apprendre après NHTSA** : dans `vin:decodeOnline`, si succès → `apprendre(vin, "<marque> - <modele>", annee, 'nhtsa')`.
- [ ] **4.3 — Bouton « site constructeur »** : IPC `vin:ouvrirConstructeur(vin, marque)` → `shell.openExternal(url)` avec routage par marque (`TOYOTA`/`LEXUS`→`https://www.toyodiy.com/parts/q?vin=<VIN>` ; défaut → un décodeur généraliste, ex. `https://www.vindecoder.net/?q=<VIN>`). Bouton dans le pied du décodeur. **Aucun scraping** — ouverture navigateur.
- [ ] **4.4 — Types + commit** `"feat(vin): apprentissage live + bouton site constructeur"`.

## Phase 5 — Harnais de mesure (train/test) → confirmer le taux

**Fichiers :** créer `scripts/vin-benchmark.mjs`.

- [ ] **5.1 — Harnais** : reproduit le train/test des scripts `feasibility` mais **sur la logique réelle** du décodeur (signature + choisirAnnee + WMI_BASE). Split 80/20 stable (hash VIN). Sortie : total, couverture, % marque, % modèle, % année (exact/±1), **% triple (M+Mo+Année±1)**.
- [ ] **5.2 — Mesurer** : `node scripts/vin-benchmark.mjs` → doit retrouver ~**77 %** triple. Consigner le chiffre.
- [ ] **5.3 — Commit** `"feat(vin): harnais de mesure (confirme le taux marque+modèle+année)"`.

## Vérif E2E finale
- App lancée, décoder un VIN → marque + modèle + année. Enregistrer un châssis, rouvrir hors ligne → modèle appris. Bouton « site constructeur » ouvre le bon site. `git push origin main`.

## Auto-évaluation
- Couverture : seed/WMI (P1) · index+import (P2) · décodeur année/modèle (P3) · apprentissage+bouton (P4) · mesure (P5). ✅
- Placeholders : aucun (code réel ; VIN d'exemples de tests à ajuster au seed généré — signalé). ✅
- Cohérence : `signatureVin`/`apprendre`/`chercher`/`choisirAnnee` identiques partout. ✅
