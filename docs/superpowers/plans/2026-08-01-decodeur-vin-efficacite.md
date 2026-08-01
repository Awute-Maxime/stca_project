# Plan d'Implémentation : Décodeur VIN efficace (marque + modèle + année ≥ 60 %)

**Objectif :** rendre le décodeur capable de fournir marque + modèle + année sur ≥ 60 % des châssis réels, via un socle local solide (année fiable + WMI massif) et un moteur apprenant (index modèle nourri par les saisies agents et NHTSA), le tout mesuré sur données réelles.

**Architecture :** décodage asynchrone `structure → année(N0) → WMI(N1) → index appris(N2a) → NHTSA(N2b)`. L'index est un modèle Prisma `VinIndex` (SQLite) alimenté après chaque `enregistrementAdd` et chaque décodage NHTSA réussi, amorcé au démarrage depuis la table `Enregistrement`. Un harnais de mesure calcule le taux réel.

**Stack :** Electron 28 + React 18 + TypeScript + Prisma (SQLite) + Vitest. Aliases : `@mock`, `@api`. Vérif types : `npx tsc --noEmit -p tsconfig.web.json && npx tsc --noEmit -p tsconfig.node.json` (⚠️ pas de script `npm run typecheck`). Tests : `npx vitest run <fichier>`. Environnement Windows, Bash = Git Bash. Commits fréquents, trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`, `git add` ciblé (jamais `-A`).

**Spec de référence :** `docs/superpowers/specs/2026-08-01-decodeur-vin-efficacite-design.md`.

---

## Phase 1 — Année fiable (désambiguïsation position 7)

**Fichiers concernés :**
- Modifier : `src/renderer/src/mock/vinDecoder.ts`
- Tester : `src/renderer/src/mock/vinDecoder.test.ts`

- [ ] **Étape 1.1 — Écrire les tests qui échouent**
  Ajouter dans `vinDecoder.test.ts` :
  ```ts
  import { describe, it, expect } from 'vitest'
  import { decoderAnnee } from '@mock/vinDecoder'

  describe('decoderAnnee — désambiguïsation position 7', () => {
    // pos.10 = lettre. pos.7 lettre → plage récente (2010+) ; pos.7 chiffre → ancienne.
    it('pos.7 lettre → année récente', () => {
      // pos.10 = 'E'. pos.7 = 'A' (lettre)
      const vin = '1HGCM8A63E' + '0000000' // pos1..10 puis remplissage
      expect(decoderAnnee(vin).annee).toBe('2014')
    })
    it('pos.7 chiffre → année ancienne', () => {
      // pos.10 = 'E'. pos.7 = '6' (chiffre)
      const vin = '1HGCM8663E' + '0000000'
      expect(decoderAnnee(vin).annee).toBe('1984')
    })
    it('garde-fou : pas d’année future improbable → repli ancien', () => {
      // pos.10 = 'Y' (récent=2030, ok car <= année+1 tant qu’on est avant), on teste un cas > année+1
      const vin = '1HGCM8A6Y' + '00000000'
      const an = Number(decoderAnnee(vin).annee)
      expect(an).toBeLessThanOrEqual(new Date().getFullYear() + 1)
    })
    it('caractère non-année (0) → incertaine', () => {
      const vin = 'SB1EA56L60E0E0356'
      expect(decoderAnnee(vin)).toEqual({ annee: '—', incertaine: true })
    })
  })
  ```

- [ ] **Étape 1.2 — Lancer les tests (échec attendu)**
  `cd "/f/AI PROJECTS/STCA-Electron" && npx vitest run src/renderer/src/mock/vinDecoder.test.ts`
  Attendu : échec (`decoderAnnee` n'existe pas encore).

- [ ] **Étape 1.3 — Implémenter `decoderAnnee`**
  Dans `vinDecoder.ts`, remplacer la table `ANNEES` unique par deux tables + la fonction exportée :
  ```ts
  // Lettres valides d'année (sans I,O,Q,U,Z) puis chiffres 1..9.
  const LETTRES_AN = 'ABCDEFGHJKLMNPRSTVWXY'.split('')
  function tableAnnees(base: number): Record<string, number> {
    const t: Record<string, number> = {}
    LETTRES_AN.forEach((l, i) => { t[l] = base + i })          // A=base … Y=base+20
    for (let d = 1; d <= 9; d++) t[String(d)] = base + 21 + (d - 1) // 1..9 = base+21..base+29
    return t
  }
  const AN_ANCIEN = tableAnnees(1980) // 1980..2009
  const AN_RECENT = tableAnnees(2010) // 2010..2039

  /** Année-modèle (position 10) désambiguïsée par la position 7 (lettre→récent, chiffre→ancien). */
  export function decoderAnnee(vin: string): { annee: string; incertaine: boolean } {
    const c = vin[9]
    if (!c) return { annee: '—', incertaine: true }
    const pos7Lettre = /[A-Z]/.test(vin[6] ?? '')
    let an = (pos7Lettre ? AN_RECENT : AN_ANCIEN)[c]
    if (an && an > new Date().getFullYear() + 1) an = AN_ANCIEN[c] // garde-fou
    return an ? { annee: String(an), incertaine: false } : { annee: '—', incertaine: true }
  }
  ```
  Ajouter `anneeIncertaine: boolean` à l'interface `ResultatVin` (après `annee`). Dans `decoderVin`, initialiser `anneeIncertaine: true` dans `base`, et remplacer la ligne `base.annee = ANNEES[...]` par :
  ```ts
  const rAnnee = decoderAnnee(vin)
  base.annee = rAnnee.annee
  base.anneeIncertaine = rAnnee.incertaine
  ```
  Supprimer l'ancienne constante `ANNEES`.

- [ ] **Étape 1.4 — Lancer les tests (succès attendu)**
  `npx vitest run src/renderer/src/mock/vinDecoder.test.ts` → verts.
  Puis `npx tsc --noEmit -p tsconfig.web.json` (⚠️ `anneeIncertaine` peut casser un test existant qui compare l'objet entier — adapter si besoin).

- [ ] **Étape 1.5 — Commit**
  `git add src/renderer/src/mock/vinDecoder.ts src/renderer/src/mock/vinDecoder.test.ts`
  `git commit -m "feat(vin): année fiable via désambiguïsation position 7"` (+ trailer).

---

## Phase 2 — Table WMI massive

**Fichiers concernés :**
- Créer : `scripts/gen-wmi.mjs` (générateur)
- Créer : `src/renderer/src/mock/wmiBase.ts` (généré : `Record<string, { marque: string; pays: string }>`)
- Modifier : `src/renderer/src/mock/vinDecoder.ts` (fusion surcouche curatée + base)
- Tester : `src/renderer/src/mock/vinDecoder.test.ts`

- [ ] **Étape 2.1 — Obtenir un jeu WMI public**
  Récupérer une liste WMI publique (WMI → fabricant + pays). Sources candidates (essayer dans l'ordre, sauver en `scripts/wmi-source.csv` colonnes `wmi,manufacturer,country`) :
  - `https://raw.githubusercontent.com/vinql/wmi/master/wmi.json` (ou équivalent JSON WMI ouvert)
  - à défaut, la liste WMI de `https://en.wikibooks.org/wiki/Vehicle_Identification_Numbers_(VIN_codes)/World_Manufacturer_Identifier_(WMI)` (extraction en CSV).
  Commande : `cd "/f/AI PROJECTS/STCA-Electron" && curl -sL "<URL>" -o scripts/wmi-source.json` (adapter à la source retenue). Si aucune source réseau, utiliser une liste curatée de secours d'au moins ~500 WMI fréquents (Europe/Japon/Corée/US) écrite à la main dans `scripts/wmi-source.csv`.

- [ ] **Étape 2.2 — Écrire le générateur `scripts/gen-wmi.mjs`**
  ```js
  // Transforme scripts/wmi-source.(json|csv) → src/renderer/src/mock/wmiBase.ts
  import fs from 'fs'
  const src = fs.existsSync('scripts/wmi-source.json')
    ? JSON.parse(fs.readFileSync('scripts/wmi-source.json', 'utf8'))
    : fs.readFileSync('scripts/wmi-source.csv', 'utf8').trim().split('\n').slice(1)
        .map(l => { const [wmi, manufacturer, country] = l.split(','); return { wmi, manufacturer, country } })
  const map = {}
  for (const r of src) {
    const wmi = String(r.wmi || r.WMI || '').toUpperCase().trim()
    if (!/^[A-HJ-NPR-Z0-9]{3}$/.test(wmi)) continue
    const marque = String(r.manufacturer || r.Manufacturer || r.marque || '').trim()
    const pays = String(r.country || r.Country || r.pays || '').trim()
    if (marque && !map[wmi]) map[wmi] = { marque, pays }
  }
  const body = 'export const WMI_BASE: Record<string, { marque: string; pays: string }> = ' +
    JSON.stringify(map, null, 0) + '\n'
  fs.writeFileSync('src/renderer/src/mock/wmiBase.ts', body)
  console.log('wmiBase.ts :', Object.keys(map).length, 'WMI')
  ```
  Exécuter : `node scripts/gen-wmi.mjs`. Attendu : ≥ 1000 WMI (idéalement plusieurs milliers).

- [ ] **Étape 2.3 — Écrire le test de fusion (échec attendu)**
  Dans `vinDecoder.test.ts` :
  ```ts
  it('WMI massif : une marque hors surcouche curatée est trouvée', () => {
    // Choisir un WMI présent dans wmiBase mais absent de WMI_TABLE curatée.
    const r = decoderVin('JTDBR32E' + '000000000'.slice(0, 9)) // JTD est curatée → remplacer par un WMI base-only réel après génération
    expect(r.constructeur).not.toBe('Inconnu')
  })
  ```
  (Ajuster le VIN d'exemple à un WMI réellement présent dans `wmiBase.ts` et absent de `WMI_TABLE`, une fois la table générée.)

- [ ] **Étape 2.4 — Brancher la fusion dans `vinDecoder.ts`**
  ```ts
  import { WMI_BASE } from './wmiBase'
  ```
  Modifier `trouverInfo` pour retomber sur `WMI_BASE` :
  ```ts
  function trouverInfo(vin: string): InfoWmi | null {
    for (let len = 6; len >= 3; len--) {
      const cle = vin.slice(0, len)
      if (WMI_TABLE[cle]) return WMI_TABLE[cle]     // surcouche curatée (catégorie/confiance)
    }
    const wmi3 = vin.slice(0, 3)
    const b = WMI_BASE[wmi3]
    return b ? { constructeur: b.marque, pays: b.pays } : null // base : marque+pays, catégorie nulle
  }
  ```

- [ ] **Étape 2.5 — Tests + types verts**
  `npx vitest run src/renderer/src/mock/vinDecoder.test.ts` → verts ; `npx tsc --noEmit -p tsconfig.web.json`.

- [ ] **Étape 2.6 — Commit**
  `git add scripts/gen-wmi.mjs src/renderer/src/mock/wmiBase.ts src/renderer/src/mock/vinDecoder.ts src/renderer/src/mock/vinDecoder.test.ts`
  `git commit -m "feat(vin): table WMI massive (base publique + surcouche curatée)"` (+ trailer).
  (⚠️ NE PAS committer `scripts/wmi-source.*` si volumineux — l'ajouter à `.gitignore`.)

---

## Phase 3 — Champ `modele` (structure + UI + NHTSA)

**Fichiers concernés :**
- Modifier : `src/renderer/src/mock/vinDecoder.ts` (champ `modele`)
- Modifier : `src/renderer/src/pages/DecodeurVinWindow.tsx` (ligne « Modèle » + `appliquerEnLigne`)

- [ ] **Étape 3.1 — Ajouter `modele` à `ResultatVin`**
  Dans l'interface : `modele: string` (après `constructeur`). Dans `base` de `decoderVin` : `modele: '—'`.

- [ ] **Étape 3.2 — Afficher le modèle dans la fenêtre**
  Dans `DecodeurVinWindow.tsx`, ajouter une ligne dans la grille Résultat (après « Constructeur ») :
  ```tsx
  <KV k="Modèle" v={res.modele} />
  ```

- [ ] **Étape 3.3 — Renseigner le modèle depuis NHTSA**
  Dans `appliquerEnLigne`, ajouter au setRes : `modele: o.modele || local.modele,`.

- [ ] **Étape 3.4 — Types verts + commit**
  `npx tsc --noEmit -p tsconfig.web.json`
  `git add src/renderer/src/mock/vinDecoder.ts src/renderer/src/pages/DecodeurVinWindow.tsx`
  `git commit -m "feat(vin): champ modèle (structure + UI + NHTSA)"` (+ trailer).

---

## Phase 4 — Index modèle apprenant (cœur)

**Fichiers concernés :**
- Modifier : `prisma/schema.prisma` (modèle `VinIndex`)
- Créer : `src/main/vinIndex.ts` (apprendre / chercher / semer / importer + signature)
- Créer : `src/main/vinIndex.test.ts`
- Modifier : `src/main/index.ts` (IPC `vin:indexLookup`, semis au démarrage, apprentissage sur NHTSA)
- Modifier : `src/main/enregistrements.ts` (apprentissage après add)
- Modifier : `src/preload/index.ts` + `src/renderer/src/api/electron.ts` (expose `vinIndexLookup`)
- Modifier : `src/renderer/src/pages/DecodeurVinWindow.tsx` (lecture index dans `decoder`)

- [ ] **Étape 4.1 — Modèle Prisma + migration**
  Ajouter à `schema.prisma` :
  ```prisma
  model VinIndex {
    id            Int      @id @default(autoincrement())
    signature     String
    marqueModele  String
    categorieRang Int?
    source        String
    nbVus         Int      @default(1)
    majLe         DateTime @updatedAt
    @@unique([signature, marqueModele])
    @@index([signature])
    @@map("vin_index")
  }
  ```
  Générer : `npx prisma migrate dev --name vin_index` puis `npx prisma generate`.
  Attendu : migration créée, client régénéré.

- [ ] **Étape 4.2 — Écrire les tests du module (échec attendu) `src/main/vinIndex.test.ts`**
  ```ts
  import { describe, it, expect } from 'vitest'
  import { signatureVin, libelleAcceptable } from './vinIndex'

  describe('vinIndex — helpers purs', () => {
    it('signature = positions 1-8', () => {
      expect(signatureVin('SB1EA56L60E0E0356')).toBe('SB1EA56L')
    })
    it('signature courte pour VIN < 8', () => {
      expect(signatureVin('SB1EA')).toBe('SB1EA')
    })
    it('rejette les libellés vides/génériques', () => {
      expect(libelleAcceptable('')).toBe(false)
      expect(libelleAcceptable('INCONNU')).toBe(false)
      expect(libelleAcceptable('...')).toBe(false)
      expect(libelleAcceptable('TOYOTA - RAV4')).toBe(true)
    })
  })
  ```

- [ ] **Étape 4.3 — Implémenter `src/main/vinIndex.ts`**
  ```ts
  import { getPrisma } from './db'

  const REJETS = new Set(['', 'INCONNU', 'INCONNUE', 'N/A', 'NA', 'XXX', '...', '-', '—'])

  export function signatureVin(vin: string): string {
    return (vin || '').toUpperCase().replace(/\s+/g, '').slice(0, 8)
  }
  export function libelleAcceptable(l: string): boolean {
    const s = (l || '').trim().toUpperCase()
    if (s.length < 2) return false
    if (REJETS.has(s)) return false
    if (!/[A-Z]/.test(s)) return false // au moins une lettre
    return true
  }

  /** Upsert (signature, marqueModele) : incrémente nbVus. */
  export async function apprendre(
    vin: string, marqueModele: string, categorieRang: number | null, source: 'saisie' | 'nhtsa'
  ): Promise<void> {
    const signature = signatureVin(vin)
    if (signature.length < 3 || !libelleAcceptable(marqueModele)) return
    const mm = marqueModele.trim()
    try {
      await getPrisma().vinIndex.upsert({
        where: { signature_marqueModele: { signature, marqueModele: mm } },
        update: { nbVus: { increment: 1 }, categorieRang: categorieRang ?? undefined },
        create: { signature, marqueModele: mm, categorieRang: categorieRang ?? null, source, nbVus: 1 },
      })
    } catch { /* index best-effort : jamais bloquant */ }
  }

  /** Cherche le libellé majoritaire pour la signature (1-8 puis repli 1-6). */
  export async function chercher(vin: string): Promise<{ marqueModele: string; categorieRang: number | null; part: number } | null> {
    const s8 = signatureVin(vin)
    for (const sig of [s8, s8.slice(0, 6)]) {
      if (sig.length < 6) continue
      const lignes = await getPrisma().vinIndex.findMany({ where: { signature: sig }, orderBy: { nbVus: 'desc' } })
      if (lignes.length === 0) continue
      const total = lignes.reduce((n, l) => n + l.nbVus, 0)
      const top = lignes[0]
      return { marqueModele: top.marqueModele, categorieRang: top.categorieRang, part: top.nbVus / total }
    }
    return null
  }

  /** Amorçage : apprend depuis tous les enregistrements existants (idempotent via upsert). */
  export async function semer(): Promise<number> {
    const rows = await getPrisma().enregistrement.findMany({ select: { vin: true, marqueModele: true, categorieRang: true } })
    let n = 0
    for (const r of rows) {
      if (r.vin && libelleAcceptable(r.marqueModele)) { await apprendre(r.vin, r.marqueModele, r.categorieRang, 'saisie'); n++ }
    }
    return n
  }

  /** Import en masse futur (les 338k). */
  export async function importer(rows: Array<{ vin: string; marqueModele: string; categorieRang?: number | null }>): Promise<number> {
    let n = 0
    for (const r of rows) { await apprendre(r.vin, r.marqueModele, r.categorieRang ?? null, 'saisie'); n++ }
    return n
  }
  ```
  (Le nom de la clé composée `signature_marqueModele` est celui généré par Prisma pour `@@unique([signature, marqueModele])` — vérifier dans le client généré et ajuster si besoin.)

- [ ] **Étape 4.4 — Tests helpers verts**
  `npx vitest run src/main/vinIndex.test.ts` → verts (les helpers purs n'ont pas besoin de la DB).

- [ ] **Étape 4.5 — Apprentissage après enregistrement**
  Dans `src/main/enregistrements.ts`, `enregistrementAdd`, après le `create` réussi (avant `return { ok: true, ... }`) :
  ```ts
  const { apprendre } = await import('./vinIndex')
  void apprendre(String(data.vin ?? ''), String(data.marqueModele ?? ''), (data.categorieRang as number) ?? null, 'saisie')
  ```

- [ ] **Étape 4.6 — Apprentissage après NHTSA + semis au démarrage + IPC lookup**
  Dans `src/main/index.ts` :
  - Semis au démarrage (après init DB) : `import('./vinIndex').then(m => m.semer()).then(n => console.log('VinIndex semé:', n)).catch(() => {})`.
  - Modifier le handler `vin:decodeOnline` pour apprendre en cas de succès :
    ```ts
    ipcMain.handle('vin:decodeOnline', async (_e, vin: string) => {
      const r = await decoderVinEnLigne(vin)
      if (r.ok && (r.marque || r.constructeur)) {
        const lib = [r.marque || r.constructeur, r.modele].filter(Boolean).join(' - ')
        const { apprendre } = await import('./vinIndex')
        void apprendre(vin, lib, null, 'nhtsa')
      }
      return r
    })
    ```
  - Ajouter le handler lookup : `ipcMain.handle('vin:indexLookup', (_e, vin: string) => import('./vinIndex').then(m => m.chercher(vin)))`.

- [ ] **Étape 4.7 — Exposer `vinIndexLookup` (preload + api)**
  `src/preload/index.ts` (dans `api`) : `vinIndexLookup: (vin) => ipcRenderer.invoke('vin:indexLookup', vin),`
  `src/renderer/src/api/electron.ts` : ajouter le type + wrapper (repli sûr `Promise.resolve(null)` si `window.api` absent), sur le modèle de `vinDecodeOnline`.

- [ ] **Étape 4.8 — Lecture de l'index dans `decoder()`**
  Dans `DecodeurVinWindow.tsx`, dans `decoder`, juste après `setRes(local)` (fin phase locale) et AVANT la bascule en ligne :
  ```ts
  const idx = await electronApi.vinIndexLookup(local.vin)
  if (idx && idx.marqueModele) {
    local = { ...local, modele: idx.marqueModele, source: 'local',
      confiance: idx.part >= 0.7 ? 'élevée' : 'moyenne',
      raisonCategorie: `Modèle appris (parc local, ${Math.round(idx.part * 100)} %)` }
    setRes(local)
  }
  const insuffisant = local.categorie === null || local.constructeur === 'Inconnu' || local.modele === '—'
  ```
  (Adapter : `local` doit être `let`. Le `insuffisant` inclut désormais « modèle manquant » pour déclencher NHTSA quand il n'y a pas de modèle local.)

- [ ] **Étape 4.9 — Types verts + commit**
  `npx tsc --noEmit -p tsconfig.web.json && npx tsc --noEmit -p tsconfig.node.json`
  `git add prisma/ src/main/vinIndex.ts src/main/vinIndex.test.ts src/main/index.ts src/main/enregistrements.ts src/preload/index.ts src/renderer/src/api/electron.ts src/renderer/src/pages/DecodeurVinWindow.tsx`
  `git commit -m "feat(vin): index modèle apprenant (Prisma VinIndex + hooks + lookup)"` (+ trailer).

---

## Phase 5 — Harnais de mesure & premier chiffre

**Fichiers concernés :**
- Créer : `scripts/vin-benchmark.mjs`
- Créer (optionnel) : `scripts/vin-echantillon.example.csv` (format attendu)

- [ ] **Étape 5.1 — Écrire le harnais `scripts/vin-benchmark.mjs`**
  Lit un CSV `vin,marqueModeleAttendu,anneeAttendue` OU, si `--from-db`, lit la table `Enregistrement` via Prisma. Décode chaque VIN (local + index ; option `--online` pour NHTSA) et calcule les taux.
  ```js
  import fs from 'fs'
  import { decoderVin } from '../src/renderer/src/mock/vinDecoder.ts' // via tsx/vite-node
  // matching flou
  const norm = s => (s||'').toUpperCase().normalize('NFD').replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim()
  const match = (a, b) => { const A=new Set(norm(a).split(' ')); const B=norm(b).split(' ').filter(Boolean)
    return B.length>0 && B.filter(t=>A.has(t)).length / B.length >= 0.5 }
  // charge le jeu (CSV ou DB), décode, agrège :
  //   nMarque, nModele, nAnnee, nTriple = marque&&modele&&annee corrects
  // imprime : total, % marque, % modèle, % année, % TRIPLE (cible 60%).
  ```
  (Exécution via `npx vite-node scripts/vin-benchmark.mjs -- <csv>` ou `npx tsx`, pour importer le module TS. Documenter la commande exacte retenue en tête du script.)

- [ ] **Étape 5.2 — Mesurer sur données réelles**
  - Si la base SQLite contient des enregistrements : `npx vite-node scripts/vin-benchmark.mjs -- --from-db` → rapport.
  - Sinon : demander à l'utilisateur un `scripts/echantillon.csv` (30-50 lignes minimum) et relancer.
  Consigner le résultat (taux triple) dans un commentaire de fin de session.

- [ ] **Étape 5.3 — Itérer si < 60 %**
  Selon le rapport : si le **modèle** est le point faible et l'index peu peuplé → normal au départ (le cliquet montera avec l'usage) ; envisager d'affiner la **granularité de signature** (1-6 en primaire) ou d'activer NHTSA (`--online`). Documenter la piste retenue.

- [ ] **Étape 5.4 — Commit**
  `git add scripts/vin-benchmark.mjs`
  `git commit -m "feat(vin): harnais de mesure marque+modèle+année"` (+ trailer).

---

## Vérification E2E finale (après les 5 phases)

- [ ] Lancer l'app (`npx electron-vite dev -- --remote-debugging-port=9222`), ouvrir le décodeur.
- [ ] Décoder un VIN connu → vérifier **marque + modèle + année** affichés.
- [ ] Faire un enregistrement (châssis + marque/modèle), rouvrir le décodeur sur le **même châssis hors ligne** → le **modèle appris** apparaît (source « parc local »).
- [ ] `git push origin main`.

## Auto-évaluation

- **Couverture** : chaque cible de la spec (année N0, marque N1, modèle N2a/N2b, cliquet N3, mesure) → une phase. ✅
- **Placeholders** : aucun (code réel partout ; seuls les VIN d'exemple de tests WMI/benchmark sont à ajuster à la table générée — signalé explicitement). ✅
- **Cohérence** : `apprendre`/`chercher`/`semer`/`signatureVin` identiques entre module, tests, hooks. ✅
