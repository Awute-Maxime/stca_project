# Plan d'Implémentation : Application « Pointage Sortie Véhicules » (STCA-Pointage)

**Objectif :** Construire l'application Electron autonome `STCA-Pointage` qui pointe la sortie des véhicules
prêts à être escortés (écriture `FlagSortie`/`DateSortie` dans une base STCA M partagée), imprime le Bordereau
d'Escorte, et édite les listes de véhicules sortis — d'après la spec `2026-07-28-pointage-sortie-vehicules-design.md`
et la maquette validée `prototype-html/pointage-sortie-vehicules.html`.

**Architecture :** Projet Electron séparé cloné sur `STCA-Affichage` (electron-vite + React 18 + AntD + TS + Vitest).
Le **processus main** possède un fichier JSON partagé `%PROGRAMDATA%\TCIT\stca-m.json` (simule la table
`ENREGISTREMENTS`), l'expose au renderer via IPC, et le surveille (`fs.watch`) pour une synchro live. La logique
de base (recherche / marquage sortie / liste) vit dans un module **pur testable** (`baseM.ts`, aucun import Electron),
exactement comme `fileStore.ts` de l'affichage. L'app principale TCIT reçoit une **touche additive isolée**
(write-through : chaque enregistrement sauvegardé est upserté dans le fichier partagé).

**Stack Technique :** Electron 28, React 18, Ant Design 5, TypeScript 5, electron-vite 2, Vitest 2, dayjs.

**Chemin projet :** `F:\AI PROJECTS\STCA-Pointage\` (voisin de `STCA-Electron` et `STCA-Affichage`).

---

## Cartographie des fichiers

### Nouveau projet `STCA-Pointage/`
| Fichier | Responsabilité |
|---------|----------------|
| `package.json`, `electron.vite.config.ts`, `tsconfig*.json`, `vitest.config.ts` | Scaffold (cloné d'Affichage + antd/dayjs) |
| `src/shared/typesM.ts` | Types `EnregistrementM`, `BaseM`, `LigneListe` |
| `src/shared/cheminBaseM.ts` | Chemin du fichier partagé (dupliqué à l'identique côté TCIT) |
| `src/shared/seedM.ts` | Jeu d'amorçage (2 véhicules des captures + générateur déterministe) |
| `src/main/baseM.ts` | **Logique PURE** : charger/écrire, chercher, marquerSortie, listerSorties |
| `src/main/index.ts` | Câblage Electron : fenêtre, `fs.watch`, IPC |
| `src/preload/index.ts` | Pont `window.pointage` |
| `src/renderer/src/main.tsx`, `index.html`, `env.d.ts` | Entrée React |
| `src/renderer/src/App.tsx` | Racine : état onglets + liste de travail |
| `src/renderer/src/styles.css` | CSS copié fidèlement de la maquette |
| `src/renderer/src/components/TitleBar.tsx` `TabBar.tsx` `FootBar.tsx` | Coquille |
| `src/renderer/src/components/OngletZip.tsx` `OngletRech.tsx` `OngletImpressions.tsx` | Onglets |
| `src/renderer/src/components/Toolbar.tsx` `ListeTravail.tsx` | Zone commune |
| `src/renderer/src/components/BordereauEscorte.tsx` `ListeSorties.tsx` | Documents |
| `src/renderer/src/lib/destColors.ts` | Couleurs destination (copie shared) |
| `tests/baseM.test.ts` | Tests unitaires de la logique pure |

### Modifs additives `STCA-Electron/` (Phase 7, isolée)
| Fichier | Modif |
|---------|-------|
| `src/shared/cheminBaseM.ts` | **Créer** (copie identique) |
| `src/main/stcaMShared.ts` | **Créer** : `upsertEnregistrement()` (write-through atomique) |
| `src/main/index.ts` | **Modifier** : handler IPC `stcaM:upsert` |
| `src/preload/index.ts` | **Modifier** : exposer `stcaMUpsert` |
| `src/renderer/src/pages/EnregistrementPage.tsx` | **Modifier** : 1 appel après la sauvegarde |
| `tests/stcaMShared.test.ts` | **Créer** : test upsert |

---

## Conventions de nommage (cohérence inter-tâches)

- Type record : `EnregistrementM` avec champs `numRef, numTri, immat, codeTransit, nomParc, maisonTransit,
  nomPrenom, adresse, marqueModele, chassis, dateEnreg, flagSortie, dateSortie`.
- Fonctions pures : `chargerBase, ecrireBase, chercher, rechercherParImmat, rechercherParTri,
  marquerSortie, annulerSortie, listerSorties`.
- Canaux IPC : `base:courante`, `base:chercher`, `base:marquerSortie`, `base:annulerSortie`,
  `base:listerSorties`, `base:maj` (push).
- API renderer : `window.pointage.{baseCourante, chercher, marquerSortie, annulerSortie, listerSorties, onBaseMaj}`.

---

# PHASE 0 — Scaffold du projet

### Tâche 0.1 : Créer le squelette par copie de STCA-Affichage

**Fichiers concernés :**
- Créer : `F:\AI PROJECTS\STCA-Pointage\` (arborescence)

- [ ] **Étape 1 : Copier le squelette (hors node_modules / out / .git)**
  Exécuter (bash) :
  ```bash
  cd "/f/AI PROJECTS"
  mkdir -p STCA-Pointage/src/main STCA-Pointage/src/preload STCA-Pointage/src/shared \
           STCA-Pointage/src/renderer/src/components STCA-Pointage/src/renderer/src/lib STCA-Pointage/tests
  cp STCA-Affichage/electron.vite.config.ts STCA-Affichage/tsconfig.json \
     STCA-Affichage/tsconfig.node.json STCA-Affichage/tsconfig.web.json \
     STCA-Affichage/vitest.config.ts STCA-Pointage/
  cp STCA-Affichage/src/renderer/index.html STCA-Pointage/src/renderer/index.html
  cp STCA-Affichage/src/renderer/src/env.d.ts STCA-Pointage/src/renderer/src/env.d.ts
  ```
  Attendu : arborescence créée, configs copiées.

- [ ] **Étape 2 : Écrire `package.json`**
  Créer `STCA-Pointage/package.json` :
  ```json
  {
    "name": "stca-pointage",
    "version": "1.0.0",
    "description": "TCIT — Pointage Sortie Véhicules (ESCORT)",
    "main": "./out/main/index.js",
    "author": "Awute Maxime",
    "scripts": {
      "dev": "electron-vite dev",
      "build": "electron-vite build",
      "preview": "electron-vite preview",
      "test": "vitest run",
      "test:watch": "vitest",
      "typecheck": "tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json",
      "package": "electron-builder --win"
    },
    "dependencies": {
      "antd": "^5.21.0",
      "dayjs": "^1.11.13"
    },
    "devDependencies": {
      "@types/node": "^20.14.0",
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.1",
      "electron": "^28.3.3",
      "electron-builder": "^24.13.3",
      "electron-vite": "^2.3.0",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "typescript": "^5.5.3",
      "vite": "^5.3.3",
      "vitest": "^2.1.8"
    },
    "build": {
      "appId": "tg.tcit.pointage",
      "productName": "TCIT Pointage",
      "win": { "target": "nsis" },
      "nsis": { "oneClick": false, "allowToChangeInstallationDirectory": true }
    }
  }
  ```

- [ ] **Étape 3 : Aligner les alias dans `electron.vite.config.ts`**
  Vérifier/garder les alias `@shared` → `src/shared`, `@renderer` → `src/renderer/src`
  (déjà présents dans la copie ; aucune modif si identiques).

- [ ] **Étape 4 : Installer les dépendances**
  Exécuter : `cd "/f/AI PROJECTS/STCA-Pointage" && npm install`
  Attendu : `node_modules` créé, aucune erreur bloquante.

- [ ] **Étape 5 : Commit initial**
  ```bash
  cd "/f/AI PROJECTS/STCA-Pointage" && git init && \
  printf "node_modules/\nout/\ndist/\n*.log\n" > .gitignore && \
  git add -A && git commit -m "chore: scaffold STCA-Pointage (clone squelette Affichage + antd/dayjs)"
  ```

---

# PHASE 1 — Modèle de données + base mock partagée (TDD)

### Tâche 1.1 : Types partagés

**Fichiers concernés :**
- Créer : `src/shared/typesM.ts`

- [ ] **Étape 1 : Écrire les types**
  ```ts
  // src/shared/typesM.ts
  // Reflet mock de la table ENREGISTREMENTS de STCA M (champs utiles au pointage).
  export interface EnregistrementM {
    numRef: string          // NumRef
    numTri: string          // NumTri
    immat: string           // NumImmatriculation
    codeTransit: string     // Destination (KA, CK, NO…)
    nomParc: string         // NomDuParc
    maisonTransit: string   // MaisonTransit
    nomPrenom: string       // NomPrenomProprio
    adresse: string         // AdresseProprio
    marqueModele: string    // MarqueModele
    chassis: string         // Vin_Vehicule
    dateEnreg: string       // DateEnreg — 'YYYY-MM-DD'
    flagSortie: boolean     // FlagSortie
    dateSortie: string | null // DateSortie — 'YYYY-MM-DD' | null
  }

  export interface BaseM {
    version: number
    enregistrements: EnregistrementM[]
  }

  // Ligne de la liste de travail côté renderer (record + états d'UI).
  export interface LigneListe extends EnregistrementM {
    coche: boolean
    pointe: boolean
  }
  ```

- [ ] **Étape 2 : Typecheck**
  Exécuter : `npm run typecheck`
  Attendu : aucune erreur.

### Tâche 1.2 : Chemin du fichier partagé

**Fichiers concernés :**
- Créer : `src/shared/cheminBaseM.ts`

- [ ] **Étape 1 : Écrire le helper**
  ```ts
  // src/shared/cheminBaseM.ts
  // Chemin du fichier « base STCA M » partagé entre l'app principale TCIT et Pointage.
  // ⚠️ CE FICHIER EST DUPLIQUÉ À L'IDENTIQUE côté STCA-Electron (Phase 7).
  import { join } from 'path'
  import { homedir } from 'os'

  export function cheminBaseM(): string {
    const racine = process.env.PROGRAMDATA || join(homedir(), '.tcit')
    return join(racine, 'TCIT', 'stca-m.json')
  }
  ```

### Tâche 1.3 : Jeu d'amorçage (seed)

**Fichiers concernés :**
- Créer : `src/shared/seedM.ts`

- [ ] **Étape 1 : Écrire le seed (2 véhicules des captures + générateur déterministe)**
  ```ts
  // src/shared/seedM.ts
  import type { BaseM, EnregistrementM } from './typesM'

  const PARCS = ['UNIPARK', 'DJ - LOMÉ / TG', 'Parc Agoé', 'Parc Baguida', 'Parc Adakpamé', 'Parc Port Autonome']
  const TRANSITS = ['AFRIQUE ATTACHED', 'ABC-TRA', 'TRANS-SAHEL', 'SODICOM', 'GLOBAL TRANSIT']
  const MARQUES = ['TOYOTA HILUX', 'MAN TGX 18.480', 'MERCEDES ACTROS', 'DAF XF 105', 'TOYOTA COROLLA', 'ACERBI 135PS']
  const NOMS = ['Kofi Mensah', 'Ibrahim Traoré', 'Aminata Bah', 'Kwame Asare', 'Moussa Coulibaly']
  const ADRESSES = ['Accra/Ghana', 'Ouaga/Burkina', 'Cotonou/Bénin', 'Bamako/Mali', 'Niamey/Niger']
  const DESTS = ['CK', 'NO', 'KA', 'AFO', 'KE']

  function chassis(i: number): string {
    const c = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
    let s = ''
    for (let k = 0; k < 17; k++) s += c[(i * 7 + k * 13) % c.length]
    return s
  }

  // Les 2 véhicules EXACTS des captures utilisateur.
  const CAPTURES: EnregistrementM[] = [
    { numRef: '610270', numTri: '2107', immat: 'T7471', codeTransit: 'CK', nomParc: 'UNIPARK',
      maisonTransit: 'AFRIQUE ATTACHED', nomPrenom: 'KOLO KOSSI', adresse: 'Bub/Burkina-Faso',
      marqueModele: 'ACERBI 135PS', chassis: '2M5XYZUDLAXDG1220', dateEnreg: '2026-07-20',
      flagSortie: false, dateSortie: null },
    { numRef: '610271', numTri: '2207', immat: 'T7472', codeTransit: 'CK', nomParc: 'DJ - LOMÉ / TG',
      maisonTransit: 'ABC-TRA', nomPrenom: 'SDSDF', adresse: 'Sdfdsfs/Sdf',
      marqueModele: 'ACERBI AB01P', chassis: '2T1LE40E59C008932', dateEnreg: '2026-07-20',
      flagSortie: false, dateSortie: null },
  ]

  function genererAutres(n: number): EnregistrementM[] {
    const out: EnregistrementM[] = []
    for (let i = 0; i < n; i++) {
      const lettre = ['A', 'C', 'E', 'T'][i % 4]
      out.push({
        numRef: String(610272 + i),
        numTri: String(1300 + i),
        immat: `${lettre}${String(2050 + i).padStart(4, '0')}`,
        codeTransit: DESTS[i % DESTS.length],
        nomParc: PARCS[i % PARCS.length],
        maisonTransit: TRANSITS[i % TRANSITS.length],
        nomPrenom: NOMS[i % NOMS.length],
        adresse: ADRESSES[i % ADRESSES.length],
        marqueModele: MARQUES[i % MARQUES.length],
        chassis: chassis(i),
        dateEnreg: '2026-07-' + String(21 + (i % 7)).padStart(2, '0'),
        flagSortie: false,
        dateSortie: null,
      })
    }
    return out
  }

  export const SEED: BaseM = {
    version: 1,
    enregistrements: [...CAPTURES, ...genererAutres(28)],
  }
  ```

### Tâche 1.4 : Logique pure `baseM.ts` — recherche (TDD)

**Fichiers concernés :**
- Créer : `src/main/baseM.ts`
- Tester : `tests/baseM.test.ts`

- [ ] **Étape 1 : Écrire le test qui échoue (recherche)**
  ```ts
  // tests/baseM.test.ts
  import { describe, it, expect } from 'vitest'
  import { chercher, rechercherParImmat, rechercherParTri, marquerSortie, listerSorties } from '../src/main/baseM'
  import type { BaseM } from '../src/shared/typesM'

  const base: BaseM = {
    version: 1,
    enregistrements: [
      { numRef: '610270', numTri: '2107', immat: 'T7471', codeTransit: 'CK', nomParc: 'UNIPARK',
        maisonTransit: 'AFRIQUE ATTACHED', nomPrenom: 'KOLO KOSSI', adresse: 'Bub/Burkina-Faso',
        marqueModele: 'ACERBI 135PS', chassis: '2M5XYZUDLAXDG1220', dateEnreg: '2026-07-20',
        flagSortie: false, dateSortie: null },
      { numRef: '610271', numTri: '2207', immat: 'T7472', codeTransit: 'CK', nomParc: 'DJ - LOMÉ / TG',
        maisonTransit: 'ABC-TRA', nomPrenom: 'SDSDF', adresse: 'Sdfdsfs/Sdf',
        marqueModele: 'ACERBI AB01P', chassis: '2T1LE40E59C008932', dateEnreg: '2026-07-20',
        flagSortie: true, dateSortie: '2026-07-28' },
    ],
  }

  describe('recherche', () => {
    it('trouve par immat exacte', () => {
      expect(rechercherParImmat(base, 'T7471')?.numRef).toBe('610270')
    })
    it('trouve par immat + code transit', () => {
      expect(rechercherParImmat(base, 'T7471CK')?.numRef).toBe('610270')
    })
    it('trouve par n° TRI', () => {
      expect(rechercherParTri(base, '2207')?.numRef).toBe('610271')
    })
    it('chercher() unifie immat / immat+code / TRI', () => {
      expect(chercher(base, ' t7471ck ')?.numRef).toBe('610270')
      expect(chercher(base, '2107')?.numRef).toBe('610270')
      expect(chercher(base, 'INEXISTANT')).toBeNull()
    })
  })
  ```

- [ ] **Étape 2 : Lancer le test → échec attendu**
  Exécuter : `npm test`
  Attendu : échec (module `baseM` inexistant).

- [ ] **Étape 3 : Implémenter la recherche dans `baseM.ts`**
  ```ts
  // src/main/baseM.ts
  // Logique PURE de la base STCA M (aucun import Electron ; testable seule).
  import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'fs'
  import { dirname } from 'path'
  import type { BaseM, EnregistrementM } from '../shared/typesM'
  import { SEED } from '../shared/seedM'

  const norm = (s: string): string => s.trim().toUpperCase().replace(/\s+/g, '')

  export function rechercherParImmat(base: BaseM, saisie: string): EnregistrementM | null {
    const q = norm(saisie)
    return base.enregistrements.find(v => v.immat === q || (v.immat + v.codeTransit) === q) ?? null
  }

  export function rechercherParTri(base: BaseM, tri: string): EnregistrementM | null {
    const q = norm(tri)
    return base.enregistrements.find(v => v.numTri === q) ?? null
  }

  export function chercher(base: BaseM, saisie: string): EnregistrementM | null {
    return rechercherParImmat(base, saisie) ?? rechercherParTri(base, saisie)
  }
  ```

- [ ] **Étape 4 : Lancer le test → succès**
  Exécuter : `npm test`
  Attendu : les 4 tests de `recherche` passent.

- [ ] **Étape 5 : Commit**
  ```bash
  git add -A && git commit -m "feat(base): types, seed, chemin partagé + recherche immat/TRI (TDD)"
  ```

### Tâche 1.5 : Logique pure — marquer/annuler sortie + lister (TDD)

**Fichiers concernés :**
- Modifier : `src/main/baseM.ts`
- Modifier : `tests/baseM.test.ts`

- [ ] **Étape 1 : Ajouter les tests qui échouent**
  ```ts
  describe('sortie', () => {
    it('marquerSortie écrit flagSortie + dateSortie sur les numRefs', () => {
      const b2 = marquerSortie(base, ['610270'], '2026-07-28')
      const v = b2.enregistrements.find(x => x.numRef === '610270')!
      expect(v.flagSortie).toBe(true)
      expect(v.dateSortie).toBe('2026-07-28')
      // immuabilité : la base d'origine n'est pas modifiée
      expect(base.enregistrements.find(x => x.numRef === '610270')!.flagSortie).toBe(false)
    })
    it('listerSorties filtre par plage de dateSortie', () => {
      const r = listerSorties(base, '2026-07-01', '2026-07-28')
      expect(r.map(v => v.numRef)).toEqual(['610271'])
    })
  })
  ```

- [ ] **Étape 2 : Lancer → échec attendu** (`npm test`).

- [ ] **Étape 3 : Implémenter dans `baseM.ts`**
  ```ts
  export function marquerSortie(base: BaseM, numRefs: string[], dateSortie: string): BaseM {
    const set = new Set(numRefs)
    return {
      ...base,
      enregistrements: base.enregistrements.map(v =>
        set.has(v.numRef) ? { ...v, flagSortie: true, dateSortie } : v),
    }
  }

  export function annulerSortie(base: BaseM, numRefs: string[]): BaseM {
    const set = new Set(numRefs)
    return {
      ...base,
      enregistrements: base.enregistrements.map(v =>
        set.has(v.numRef) ? { ...v, flagSortie: false, dateSortie: null } : v),
    }
  }

  export function listerSorties(base: BaseM, debut: string, fin: string): EnregistrementM[] {
    return base.enregistrements.filter(v =>
      v.flagSortie && v.dateSortie !== null && v.dateSortie >= debut && v.dateSortie <= fin)
  }
  ```

- [ ] **Étape 4 : Lancer → succès** (`npm test`).

- [ ] **Étape 5 : Commit**
  ```bash
  git add -A && git commit -m "feat(base): marquerSortie/annulerSortie/listerSorties (TDD)"
  ```

### Tâche 1.6 : Persistance fichier partagé (charger + écrire atomique) (TDD)

**Fichiers concernés :**
- Modifier : `src/main/baseM.ts`
- Modifier : `tests/baseM.test.ts`

- [ ] **Étape 1 : Test qui échoue (charger seed si absent, round-trip écriture)**
  ```ts
  import { chargerBase, ecrireBase } from '../src/main/baseM'
  import { mkdtempSync } from 'fs'
  import { tmpdir } from 'os'
  import { join } from 'path'

  describe('persistance', () => {
    it('chargerBase amorce depuis le SEED si le fichier est absent', () => {
      const chemin = join(mkdtempSync(join(tmpdir(), 'stcam-')), 'stca-m.json')
      const b = chargerBase(chemin)
      expect(b.enregistrements.length).toBeGreaterThan(0)
      expect(b.enregistrements.find(v => v.immat === 'T7471')).toBeTruthy()
    })
    it('ecrireBase puis chargerBase = round-trip fidèle', () => {
      const chemin = join(mkdtempSync(join(tmpdir(), 'stcam-')), 'stca-m.json')
      const b = chargerBase(chemin)
      const b2 = marquerSortie(b, ['610270'], '2026-07-28')
      ecrireBase(chemin, b2)
      const relu = chargerBase(chemin)
      expect(relu.enregistrements.find(v => v.numRef === '610270')?.flagSortie).toBe(true)
    })
  })
  ```
  Note : le SEED contient `610270` (véhicule capture) → l'assertion round-trip est valide.

- [ ] **Étape 2 : Lancer → échec attendu** (`npm test`).

- [ ] **Étape 3 : Implémenter la persistance**
  ```ts
  export function chargerBase(chemin: string): BaseM {
    try {
      if (!existsSync(chemin)) {
        ecrireBase(chemin, SEED)
        return structuredClone(SEED)
      }
      const data = JSON.parse(readFileSync(chemin, 'utf-8')) as BaseM
      if (!data || !Array.isArray(data.enregistrements)) return structuredClone(SEED)
      return data
    } catch {
      return structuredClone(SEED)
    }
  }

  export function ecrireBase(chemin: string, base: BaseM): void {
    try {
      mkdirSync(dirname(chemin), { recursive: true })
      const tmp = chemin + '.tmp'
      writeFileSync(tmp, JSON.stringify(base, null, 2), 'utf-8')
      renameSync(tmp, chemin) // écriture atomique (évite la corruption en écriture concurrente)
    } catch {
      /* best effort : disque plein / droits — l'app continue en mémoire */
    }
  }
  ```

- [ ] **Étape 4 : Lancer → succès** (`npm test` : tous verts).

- [ ] **Étape 5 : Commit**
  ```bash
  git add -A && git commit -m "feat(base): chargerBase(seed si absent) + ecrireBase atomique (TDD)"
  ```

---

# PHASE 2 — Câblage Electron (main + preload)

### Tâche 2.1 : Processus main — fenêtre, watch, IPC

**Fichiers concernés :**
- Créer : `src/main/index.ts`

- [ ] **Étape 1 : Écrire `src/main/index.ts`**
  ```ts
  import { app, BrowserWindow, ipcMain, screen } from 'electron'
  import { join } from 'path'
  import { watch, type FSWatcher } from 'fs'
  import { cheminBaseM } from '../shared/cheminBaseM'
  import { chargerBase, ecrireBase, chercher, marquerSortie, annulerSortie, listerSorties } from './baseM'
  import type { BaseM } from '../shared/typesM'

  const isDev = !app.isPackaged
  let mainWin: BrowserWindow | null = null
  let base: BaseM = { version: 1, enregistrements: [] }
  let chemin = ''
  let watcher: FSWatcher | null = null
  let rechargeTimer: NodeJS.Timeout | null = null

  if (!app.requestSingleInstanceLock()) app.quit()
  app.on('second-instance', () => {
    if (mainWin && !mainWin.isDestroyed()) { if (mainWin.isMinimized()) mainWin.restore(); mainWin.focus() }
  })

  function diffuser(canal: string, payload: unknown): void {
    for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send(canal, payload)
  }

  // Recharge la base quand le fichier partagé change (écriture par l'app TCIT) — synchro live.
  function surveiller(): void {
    try {
      watcher = watch(chemin, () => {
        if (rechargeTimer) clearTimeout(rechargeTimer)
        rechargeTimer = setTimeout(() => { base = chargerBase(chemin); diffuser('base:maj', base) }, 150)
      })
    } catch { /* le fichier peut ne pas exister encore : ignoré */ }
  }

  function creerFenetre(): void {
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
    mainWin = new BrowserWindow({
      width: Math.max(Math.round(sw * 0.72), 1040),
      height: Math.max(Math.round(sh * 0.78), 640),
      minWidth: 960, minHeight: 600, center: true,
      backgroundColor: '#E7ECF4', autoHideMenuBar: true, show: false,
      title: 'TCIT — Pointage Sortie Véhicules',
      webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false },
    })
    mainWin.once('ready-to-show', () => mainWin?.show())
    if (isDev && process.env['ELECTRON_RENDERER_URL']) mainWin.loadURL(process.env['ELECTRON_RENDERER_URL'])
    else mainWin.loadFile(join(__dirname, '../renderer/index.html'))
  }

  app.whenReady().then(() => {
    chemin = cheminBaseM()
    base = chargerBase(chemin)
    surveiller()

    ipcMain.handle('base:courante', () => base)
    ipcMain.handle('base:chercher', (_e, saisie: string) => chercher(base, saisie))
    ipcMain.handle('base:marquerSortie', (_e, numRefs: string[], dateSortie: string) => {
      base = marquerSortie(base, numRefs, dateSortie); ecrireBase(chemin, base); diffuser('base:maj', base); return base
    })
    ipcMain.handle('base:annulerSortie', (_e, numRefs: string[]) => {
      base = annulerSortie(base, numRefs); ecrireBase(chemin, base); diffuser('base:maj', base); return base
    })
    ipcMain.handle('base:listerSorties', (_e, debut: string, fin: string) => listerSorties(base, debut, fin))

    creerFenetre()
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) creerFenetre() })
  })

  app.on('window-all-closed', () => { watcher?.close(); if (process.platform !== 'darwin') app.quit() })
  ```

- [ ] **Étape 2 : Typecheck main**
  Exécuter : `npx tsc --noEmit -p tsconfig.node.json`
  Attendu : aucune erreur.

### Tâche 2.2 : Preload — pont `window.pointage`

**Fichiers concernés :**
- Créer : `src/preload/index.ts`

- [ ] **Étape 1 : Écrire le preload**
  ```ts
  import { contextBridge, ipcRenderer } from 'electron'
  import type { BaseM, EnregistrementM } from '../shared/typesM'

  const api = {
    baseCourante: (): Promise<BaseM> => ipcRenderer.invoke('base:courante'),
    chercher: (saisie: string): Promise<EnregistrementM | null> => ipcRenderer.invoke('base:chercher', saisie),
    marquerSortie: (numRefs: string[], dateSortie: string): Promise<BaseM> =>
      ipcRenderer.invoke('base:marquerSortie', numRefs, dateSortie),
    annulerSortie: (numRefs: string[]): Promise<BaseM> => ipcRenderer.invoke('base:annulerSortie', numRefs),
    listerSorties: (debut: string, fin: string): Promise<EnregistrementM[]> =>
      ipcRenderer.invoke('base:listerSorties', debut, fin),
    onBaseMaj: (cb: (base: BaseM) => void): void => { ipcRenderer.on('base:maj', (_e, b: BaseM) => cb(b)) },
  }

  contextBridge.exposeInMainWorld('pointage', api)
  export type PointageApi = typeof api
  ```

- [ ] **Étape 2 : Déclarer le type global (renderer)**
  Créer/compléter `src/renderer/src/env.d.ts` :
  ```ts
  /// <reference types="vite/client" />
  import type { PointageApi } from '../../preload'
  declare global {
    interface Window { pointage: PointageApi }
  }
  export {}
  ```

- [ ] **Étape 3 : Commit**
  ```bash
  git add -A && git commit -m "feat(electron): main (fenêtre+watch+IPC) + preload window.pointage"
  ```

---

# PHASE 3 — Coquille React (fenêtre, onglets, footbar)

### Tâche 3.1 : CSS + entrée React

**Fichiers concernés :**
- Créer : `src/renderer/src/styles.css`
- Créer : `src/renderer/src/main.tsx`
- Modifier : `src/renderer/index.html`

- [ ] **Étape 1 : Copier le CSS de la maquette (copie fidèle)**
  Copier l'intégralité du bloc `<style>` de `STCA-Electron/prototype-html/pointage-sortie-vehicules.html`
  (lignes 7–~190, du `:root{…}` jusqu'à la fin de `#toast`) dans `src/renderer/src/styles.css`, en RETIRANT
  la règle `body{…display:flex;…}` de centrage maquette et en la remplaçant par :
  ```css
  html,body,#root{height:100%;margin:0;}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#E7ECF4;color:#1B3A6B;}
  ```
  Ajouter en fin de fichier les règles d'impression :
  ```css
  @media print {
    body * { visibility: hidden; }
    .print-zone, .print-zone * { visibility: visible; }
    .print-zone { position: absolute; inset: 0; margin: 0; box-shadow: none; border: none; }
  }
  ```

- [ ] **Étape 2 : Écrire `main.tsx`**
  ```tsx
  import React from 'react'
  import { createRoot } from 'react-dom/client'
  import App from './App'
  import './styles.css'
  createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
  ```

- [ ] **Étape 3 : Vérifier `index.html`** contient `<div id="root"></div>` et
  `<script type="module" src="/src/renderer/src/main.tsx"></script>` (adapter le chemin comme dans Affichage).

### Tâche 3.2 : Composants coquille (TitleBar, TabBar, FootBar)

**Fichiers concernés :**
- Créer : `src/renderer/src/components/TitleBar.tsx`, `TabBar.tsx`, `FootBar.tsx`
- Créer : `src/renderer/src/lib/destColors.ts`

- [ ] **Étape 1 : `destColors.ts`**
  ```ts
  export const DEST: Record<string, string> = { CK:'#16A34A', NO:'#334155', KA:'#2563EB', KE:'#9333EA', AFO:'#DC2626', TO:'#0891B2', KP:'#B45309', KW:'#DB2777' }
  export const destColor = (c: string): string => DEST[c] ?? '#6B7280'
  ```

- [ ] **Étape 2 : `TitleBar.tsx`** (porter la `.titlebar` de la maquette)
  ```tsx
  export default function TitleBar(): JSX.Element {
    return (
      <div className="titlebar">
        <span className="dot" />
        <span className="t">Pointage Sortie Véhicules&nbsp;&nbsp;›&nbsp;&nbsp;<span className="esc">ESCORT</span></span>
        <span className="sp" />
        <span className="brand">TCIT · Pointage</span>
        <span className="wbtn">─</span><span className="wbtn">□</span>
        <span className="quit" onClick={() => window.close()}>✕ Quitter</span>
      </div>
    )
  }
  ```

- [ ] **Étape 3 : `TabBar.tsx`**
  ```tsx
  export type Onglet = 'zip' | 'rech' | 'impr'
  const TABS: Array<{ id: Onglet; ic: string; label: string }> = [
    { id: 'zip', ic: '🎫', label: 'Saisie ZIP' },
    { id: 'rech', ic: '🔍', label: 'Rech. N° TRI/IMMAT' },
    { id: 'impr', ic: '🖨️', label: 'Impressions' },
  ]
  export default function TabBar({ actif, onChange }: { actif: Onglet; onChange: (o: Onglet) => void }): JSX.Element {
    return (
      <div className="tabbar">
        {TABS.map(t => (
          <div key={t.id} className={'tab' + (actif === t.id ? ' on' : '')} onClick={() => onChange(t.id)}>
            <span className="ic">{t.ic}</span> {t.label}
          </div>
        ))}
      </div>
    )
  }
  ```

- [ ] **Étape 4 : `FootBar.tsx`** (porter `.statusbar` + horloge live)
  ```tsx
  import { useEffect, useState } from 'react'
  export default function FootBar({ sortiesJour }: { sortiesJour: number }): JSX.Element {
    const [horloge, setHorloge] = useState('')
    useEffect(() => {
      const jours = ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.']
      const p = (n: number): string => String(n).padStart(2, '0')
      const tick = (): void => { const d = new Date()
        setHorloge(`🕑 ${jours[d.getDay()]} ${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`) }
      tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
    }, [])
    return (
      <div className="statusbar">
        <span className="sb-item"><span className="sb-dot" /> Base <b>STCA&nbsp;M</b> — connectée</span>
        <span className="sb-sep" /><span className="sb-item">🖥️ Poste&nbsp;: <b>DOUANE-PC01</b></span>
        <span className="sb-sep" /><span className="sb-item">🚗 Sorties du jour&nbsp;: <b>{sortiesJour}</b></span>
        <span className="sb-sp" />
        <span className="sb-item">{horloge}</span>
        <span className="sb-sep" /><span className="sb-item sb-ver">TCIT · Pointage <b>v1.0</b></span>
      </div>
    )
  }
  ```

- [ ] **Étape 5 : Commit**
  ```bash
  git add -A && git commit -m "feat(ui): coquille (styles, TitleBar, TabBar, FootBar horloge live)"
  ```

---

# PHASE 4 — Onglets ZIP/Rech + liste de travail + actions

### Tâche 4.1 : `App.tsx` — état, chargement base, orchestration

**Fichiers concernés :**
- Créer : `src/renderer/src/App.tsx`

- [ ] **Étape 1 : Écrire `App.tsx`**
  ```tsx
  import { useEffect, useState, useCallback } from 'react'
  import { message } from 'antd'
  import TitleBar from './components/TitleBar'
  import TabBar, { type Onglet } from './components/TabBar'
  import FootBar from './components/FootBar'
  import OngletZip from './components/OngletZip'
  import OngletRech from './components/OngletRech'
  import OngletImpressions from './components/OngletImpressions'
  import Toolbar from './components/Toolbar'
  import ListeTravail from './components/ListeTravail'
  import BordereauEscorte from './components/BordereauEscorte'
  import ListeSorties from './components/ListeSorties'
  import type { BaseM, EnregistrementM, LigneListe } from '../../shared/typesM'
  import dayjs from 'dayjs'

  export default function App(): JSX.Element {
    const [onglet, setOnglet] = useState<Onglet>('zip')
    const [base, setBase] = useState<BaseM>({ version: 1, enregistrements: [] })
    const [liste, setListe] = useState<LigneListe[]>([])
    const [sortiesJour, setSortiesJour] = useState(0)
    const [docVisible, setDocVisible] = useState<'bord' | 'liste' | null>('bord')
    const [sortiesDoc, setSortiesDoc] = useState<EnregistrementM[]>([])
    const [docMode, setDocMode] = useState<{ periode: 'jour'|'periode'; mode: 'standard'|'parc'; d1: string; d2: string }>(
      { periode: 'jour', mode: 'parc', d1: '2026-07-01', d2: dayjs().format('YYYY-MM-DD') })

    useEffect(() => {
      window.pointage.baseCourante().then(setBase)
      window.pointage.onBaseMaj(setBase)
    }, [])

    const ajouter = useCallback(async (saisie: string): Promise<boolean> => {
      const v = await window.pointage.chercher(saisie)
      if (!v) { message.error('Véhicule introuvable : « ' + saisie + ' »'); return false }
      if (v.flagSortie) { message.error(v.immat + ' est déjà sorti (pointé antérieurement)'); return false }
      let ok = true
      setListe(prev => {
        if (prev.some(x => x.numRef === v.numRef)) { message.warning(v.immat + ' est déjà dans la liste'); ok = false; return prev }
        return [{ ...v, coche: true, pointe: false }, ...prev]
      })
      if (ok) message.success(v.immat + ' ajouté à la liste')
      return ok
    }, [])

    const pointer = useCallback(async () => {
      const cibles = liste.filter(l => l.coche && !l.pointe)
      if (cibles.length === 0) { message.error('Cochez au moins un véhicule non encore sorti'); return }
      await window.pointage.marquerSortie(cibles.map(c => c.numRef), dayjs().format('YYYY-MM-DD'))
      setListe(prev => prev.map(l => (l.coche && !l.pointe) ? { ...l, pointe: true } : l))
      setSortiesJour(n => n + cibles.length)
      message.success(cibles.length + ' véhicule(s) pointé(s) — FlagSortie ✔ / DateSortie du jour')
    }, [liste])

    const supprSelection = useCallback(() => setListe(prev => prev.filter(l => !l.coche)), [])
    const vider = useCallback(() => { setListe([]); message.info('Liste de pointage vidée (sorties déjà écrites conservées)') }, [])
    const toggleCoche = useCallback((numRef: string) =>
      setListe(prev => prev.map(l => l.numRef === numRef ? { ...l, coche: !l.coche } : l)), [])

    const generer = useCallback(() => {
      const pts = liste.filter(l => l.pointe)
      if (pts.length === 0) { message.error('Aucun véhicule pointé à escorter'); return }
      setDocVisible('bord'); setDocPts(pts)
      setTimeout(() => window.print(), 200)
    }, [liste])
    const [docPts, setDocPts] = useState<EnregistrementM[]>([])

    const imprimerListe = useCallback(async () => {
      const [d1, d2] = docMode.periode === 'jour'
        ? [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
        : [docMode.d1, docMode.d2]
      const rows = await window.pointage.listerSorties(d1, d2)
      setSortiesDoc(rows); setDocVisible('liste')
      setTimeout(() => window.print(), 200)
    }, [docMode])

    const nbPointe = liste.filter(l => l.pointe).length

    return (
      <div style={{ minHeight: '100%', padding: '18px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div className="win" style={{ width: 1040, maxWidth: '100%' }}>
          <TitleBar />
          <TabBar actif={onglet} onChange={setOnglet} />
          <div className="stage">
            <div className="formarea">
              {onglet === 'zip'  && <OngletZip onAjouter={ajouter} />}
              {onglet === 'rech' && <OngletRech onAjouter={ajouter} onPointer={pointer} onSuppr={supprSelection} />}
              {onglet === 'impr' && <OngletImpressions mode={docMode} onMode={setDocMode} onImprimer={imprimerListe} />}
            </div>
            {onglet !== 'impr' && (
              <div>
                <Toolbar nbPointe={nbPointe} nbTotal={liste.length} onGenerer={generer} onVider={vider} />
                <ListeTravail liste={liste} onToggle={toggleCoche} />
              </div>
            )}
          </div>
          <FootBar sortiesJour={sortiesJour} />
        </div>

        {/* Documents (aperçus + zone d'impression) */}
        {docVisible === 'bord'  && <BordereauEscorte rows={docPts} />}
        {docVisible === 'liste' && <ListeSorties rows={sortiesDoc} mode={docMode} />}
      </div>
    )
  }
  ```
  Note : le doublon `docPts`/`setDocPts` est volontairement déclaré près de `generer` pour lisibilité ;
  regrouper les `useState` en tête du composant lors de l'écriture (garder les noms).

- [ ] **Étape 2 : Typecheck** `npx tsc --noEmit -p tsconfig.web.json` (des composants manquent encore → OK d'itérer).

### Tâche 4.2 : `OngletZip.tsx` + `OngletRech.tsx`

**Fichiers concernés :**
- Créer : `src/renderer/src/components/OngletZip.tsx`, `OngletRech.tsx`

- [ ] **Étape 1 : `OngletZip.tsx`**
  ```tsx
  import { useRef, useState } from 'react'
  export default function OngletZip({ onAjouter }: { onAjouter: (s: string) => Promise<boolean> }): JSX.Element {
    const [val, setVal] = useState('')
    const ref = useRef<HTMLInputElement>(null)
    const go = async (): Promise<void> => { if (await onAjouter(val)) setVal(''); ref.current?.focus() }
    return (
      <div className="panel">
        <div className="flabel"><b>ZIP Fiche ID Jaune</b> agrafée à la C.G. (ex : A0001CK) — afin de retrouver et pointer le véhicule</div>
        <div className="frow">
          <label>Véhicule à pointer :</label>
          <input ref={ref} className="fin zip" placeholder="Scannez…" autoFocus value={val}
            onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go() }} />
          <button className="btn prim" onClick={go}>🔎 Rech. + Pointer</button>
          <span style={{ fontSize: 11, color: '#64748B' }}>↵ le scanner valide automatiquement</span>
        </div>
      </div>
    )
  }
  ```

- [ ] **Étape 2 : `OngletRech.tsx`**
  ```tsx
  import { useRef, useState } from 'react'
  export default function OngletRech(
    { onAjouter, onPointer, onSuppr }:
    { onAjouter: (s: string) => Promise<boolean>; onPointer: () => void; onSuppr: () => void }
  ): JSX.Element {
    const [val, setVal] = useState('')
    const ref = useRef<HTMLInputElement>(null)
    const go = async (): Promise<void> => { if (await onAjouter(val)) setVal(''); ref.current?.focus() }
    return (
      <div className="panel">
        <div className="flabel">Saisir un <b>N° de TRI</b> (ex : 125) ou un <b>N° d'IMMAT</b> complet (ex : A0001CK) afin de rechercher le véhicule</div>
        <div className="frow">
          <label>Véhicule à rechercher :</label>
          <input ref={ref} className="fin rech" placeholder="TRI ou immat…" value={val}
            onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go() }} />
          <button className="btn prim" onClick={go}>🔍 Rechercher</button>
          <span style={{ width: 14 }} />
          <label>Suppr. sélection :</label>
          <button className="btn danger mini" title="Retirer les lignes cochées" onClick={onSuppr}>➖</button>
          <button className="btn ghost" onClick={onPointer}>🔄 Pointage Véh.</button>
        </div>
      </div>
    )
  }
  ```

### Tâche 4.3 : `Toolbar.tsx` + `ListeTravail.tsx`

**Fichiers concernés :**
- Créer : `src/renderer/src/components/Toolbar.tsx`, `ListeTravail.tsx`

- [ ] **Étape 1 : `Toolbar.tsx`**
  ```tsx
  export default function Toolbar(
    { nbPointe, nbTotal, onGenerer, onVider }:
    { nbPointe: number; nbTotal: number; onGenerer: () => void; onVider: () => void }
  ): JSX.Element {
    return (
      <div className="toolbar">
        <button className="btn gen" disabled={nbPointe === 0} onClick={onGenerer}>✅ Générer Bordereau Escort</button>
        <button className="btn vider" onClick={onVider}>⊘ Vider Liste Pointage</button>
        <span className="sp" />
        <span className="counter">Pointés&nbsp;: <span className="n" style={{ color: '#16A34A' }}>{nbPointe}</span></span>
        <span className="counter">En liste&nbsp;: <span className="n" style={{ color: '#1B3A6B' }}>{nbTotal}</span></span>
      </div>
    )
  }
  ```

- [ ] **Étape 2 : `ListeTravail.tsx`** (porter le `<table class="list">`)
  ```tsx
  import { destColor } from '../lib/destColors'
  import type { LigneListe } from '../../../shared/typesM'
  export default function ListeTravail(
    { liste, onToggle }: { liste: LigneListe[]; onToggle: (numRef: string) => void }
  ): JSX.Element {
    return (
      <div className="listwrap">
        <table className="list">
          <thead><tr>
            <th className="cell-chk">Sortie</th><th>Réf.</th><th>N° TRI</th><th>N° Immat.</th><th>Dest.</th>
            <th>NomDuParc</th><th>MaisonTransit</th><th>Nom et prénom</th><th>Marque / Modèle</th><th>N° Chassis</th><th>Enregistré le</th>
          </tr></thead>
          <tbody>
            {liste.length === 0 ? (
              <tr><td colSpan={11} className="empty">Aucun véhicule en liste — scannez ou recherchez un véhicule pour commencer.</td></tr>
            ) : liste.map(v => (
              <tr key={v.numRef} className={v.pointe ? 'pointe' : ''}>
                <td className="cell-chk"><input type="checkbox" checked={v.coche} onChange={() => onToggle(v.numRef)} /></td>
                <td className="c-ref">{v.numRef}</td>
                <td className="c-tri">{v.numTri}</td>
                <td className="c-immat">{v.immat}{v.pointe && <span className="tag-sorti">SORTI</span>}</td>
                <td><span className="dest" style={{ background: destColor(v.codeTransit) }}>{v.codeTransit}</span></td>
                <td>{v.nomParc}</td><td>{v.maisonTransit}</td><td>{v.nomPrenom}</td>
                <td>{v.marqueModele}</td><td className="c-chassis">{v.chassis}</td>
                <td>{dateFr(v.dateEnreg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  function dateFr(iso: string): string { const [a, m, j] = iso.split('-'); return `${j}/${m}/${a}` }
  ```

- [ ] **Étape 3 : Lancer l'app et vérifier (CDP)**
  Exécuter : `npm run dev` (dans un terminal dédié).
  Vérifier visuellement : fenêtre, onglets ZIP/Rech, scan `T7471CK` ajoute la ligne, coche + Pointage Véh.
  passe la ligne en jaune + badge SORTI, compteurs corrects, Vider fonctionne.
  Méthode CDP (cf. mémoire) : `electron-vite dev -- --remote-debugging-port=9222`.

- [ ] **Étape 4 : Commit**
  ```bash
  git add -A && git commit -m "feat(ui): App orchestration + onglets ZIP/Rech + toolbar + liste de travail"
  ```

---

# PHASE 5 — Documents (Bordereau d'Escorte + Liste des sorties)

### Tâche 5.1 : `BordereauEscorte.tsx`

**Fichiers concernés :**
- Créer : `src/renderer/src/components/BordereauEscorte.tsx`

- [ ] **Étape 1 : Écrire le composant (porter `.paper` #doc-bord)**
  ```tsx
  import dayjs from 'dayjs'
  import type { EnregistrementM } from '../../../shared/typesM'
  export default function BordereauEscorte({ rows }: { rows: EnregistrementM[] }): JSX.Element {
    const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']
    const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    const d = dayjs()
    const dateLongue = `${cap(jours[d.day()])} ${d.date()} ${mois[d.month()]} ${d.year()}`
    return (
      <div className="docs" style={{ width: 1040, maxWidth: '100%' }}>
        <div className="paper print-zone">
          <div className="doc-head">
            <svg className="logo" viewBox="0 0 48 48"><polygon points="24,3 45,40 3,40" fill="none" stroke="#1c3f6e" strokeWidth="3"/><polygon points="24,14 35,34 13,34" fill="#F59E0B"/></svg>
            <div><div className="doc-org">Douanes Togolaises<small>TCIT</small></div></div>
            <div className="doc-edit">Édition du : <b>{dateLongue}</b><br />{d.format('HH:mm')}</div>
          </div>
          <div className="doc-title">Bordereau d'Escorte</div>
          <table className="doc">
            <thead><tr><th>N° TRI</th><th>N° Immatriculation</th><th>Destination</th><th>Nom Parc</th><th>Maison Transit</th><th>Marque / Modèle</th><th>N° Chassis</th></tr></thead>
            <tbody>
              {rows.map(v => (
                <tr key={v.numRef}>
                  <td className="c">{v.numTri}</td><td className="c">{v.immat}</td><td className="c">{v.codeTransit}</td>
                  <td className="l">{v.nomParc}</td><td className="l">{v.maisonTransit}</td><td className="l">{v.marqueModele}</td><td className="l">{v.chassis}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="doc-count">Nombre de véhicules escortés : <b>{rows.length}</b></div>
          <div className="doc-foot"><span></span><span className="sig">TCIT · Pointage — v1.0</span></div>
        </div>
      </div>
    )
  }
  const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
  ```

### Tâche 5.2 : `ListeSorties.tsx` (standard + par parc)

**Fichiers concernés :**
- Créer : `src/renderer/src/components/ListeSorties.tsx`

- [ ] **Étape 1 : Écrire le composant**
  ```tsx
  import dayjs from 'dayjs'
  import type { EnregistrementM } from '../../../shared/typesM'
  type Mode = { periode: 'jour'|'periode'; mode: 'standard'|'parc'; d1: string; d2: string }
  export default function ListeSorties({ rows, mode }: { rows: EnregistrementM[]; mode: Mode }): JSX.Element {
    const titre = mode.periode === 'jour'
      ? `Liste des véhicules sortis pour la journée du : ${fr(dayjs().format('YYYY-MM-DD'))}`
      : `Liste des véhicules sortis pour la période du : ${fr(mode.d1)} au ${fr(mode.d2)}`
    const colParc = mode.periode === 'periode' && mode.mode === 'standard'
    const Entete = (): JSX.Element => (
      <tr><th>Nom et prénom</th><th>Adresse</th><th>N° de Tri</th><th>Immatriculation</th><th>Destination</th>
        <th>Marque et modèle</th><th>N° Chassis</th>{colParc && <th>Parc</th>}<th>Enregistré le</th><th>Sortie le</th></tr>
    )
    const Ligne = (v: EnregistrementM): JSX.Element => (
      <tr key={v.numRef}><td className="l">{v.nomPrenom}</td><td className="l">{v.adresse}</td><td className="c">{v.numTri}</td>
        <td className="c">{v.immat}</td><td className="c">{v.codeTransit}</td><td className="l">{v.marqueModele}</td><td className="l">{v.chassis}</td>
        {colParc && <td className="l">{v.nomParc}</td>}<td className="c">{fr(v.dateEnreg)}</td><td className="c">{fr(v.dateSortie ?? '')}</td></tr>
    )
    const parcs = [...new Set(rows.map(v => v.nomParc))].sort()
    return (
      <div className="docs" style={{ width: 1040, maxWidth: '100%' }}>
        <div className="paper print-zone">
          <div className="doc-title" style={{ marginTop: 6 }}>{titre}</div>
          {mode.mode === 'parc' ? parcs.map(p => {
            const g = rows.filter(v => v.nomParc === p)
            return (
              <div key={p}>
                <div className="doc-sub">Nom du parc : <b>{p}</b></div>
                <table className="doc"><thead><Entete /></thead><tbody>{g.map(Ligne)}</tbody></table>
                <div className="doc-count" style={{ marginBottom: 12 }}>Nombre de véhicules sortis de ce parc : <b>{g.length}</b></div>
              </div>
            )
          }) : <table className="doc"><thead><Entete /></thead><tbody>{rows.map(Ligne)}</tbody></table>}
          <div className="doc-count">Nombre de véhicules sortis : <b>{rows.length}</b></div>
          <div className="doc-foot"><span>Édition du : {dayjs().format('DD/MM/YYYY HH:mm')}</span><span>1 / 1</span></div>
        </div>
      </div>
    )
  }
  const fr = (iso: string): string => { if (!iso) return ''; const [a, m, j] = iso.split('-'); return `${j}/${m}/${a}` }
  ```

- [ ] **Étape 2 : Confirmation avant impression du bordereau**
  Dans `App.tsx` (fonction `generer`), envelopper l'impression d'une confirmation AntD :
  ```tsx
  import { Modal } from 'antd'
  // …
  Modal.confirm({
    title: 'Générer le PDF', content: "Êtes-vous sûr de vouloir générer le PDF du Bordereau d'Escorte ?",
    okText: 'Oui', cancelText: 'Non',
    onOk: () => { setDocVisible('bord'); setDocPts(pts); setTimeout(() => window.print(), 200) },
  })
  ```

- [ ] **Étape 3 : Vérifier l'impression (dev)**
  `npm run dev` → pointer 2 véhicules → Générer Bordereau → confirmer → l'aperçu d'impression n'affiche
  QUE le bordereau (grâce à `.print-zone`). Idem onglet Impressions → Imprimer.

- [ ] **Étape 4 : Commit**
  ```bash
  git add -A && git commit -m "feat(ui): documents Bordereau d'Escorte + Liste des sorties + impression scindée"
  ```

---

# PHASE 6 — Onglet Impressions

### Tâche 6.1 : `OngletImpressions.tsx`

**Fichiers concernés :**
- Créer : `src/renderer/src/components/OngletImpressions.tsx`

- [ ] **Étape 1 : Écrire le composant (porter `.impr`)**
  ```tsx
  type Mode = { periode: 'jour'|'periode'; mode: 'standard'|'parc'; d1: string; d2: string }
  export default function OngletImpressions(
    { mode, onMode, onImprimer }: { mode: Mode; onMode: (m: Mode) => void; onImprimer: () => void }
  ): JSX.Element {
    const per = mode.periode === 'periode'
    return (
      <div className="panel">
        <div className="flabel"><b>Édition des listes de véhicules sortis</b></div>
        <div className="impr">
          <label className={'opt' + (mode.periode === 'jour' ? ' on' : '')}>
            <input type="radio" checked={mode.periode === 'jour'} onChange={() => onMode({ ...mode, periode: 'jour' })} /> Véhicules sortis aujourd'hui</label>
          <label className={'opt' + (per ? ' on' : '')}>
            <input type="radio" checked={per} onChange={() => onMode({ ...mode, periode: 'periode' })} /> Véhicules sortis sur une période</label>
          <label className={'opt' + (mode.mode === 'standard' ? ' on' : '')}>
            <input type="radio" checked={mode.mode === 'standard'} onChange={() => onMode({ ...mode, mode: 'standard' })} /> Imprimé standard</label>
          <label className={'opt' + (mode.mode === 'parc' ? ' on' : '')}>
            <input type="radio" checked={mode.mode === 'parc'} onChange={() => onMode({ ...mode, mode: 'parc' })} /> Imprimé par parc</label>
          <div className="dates">
            <label>Du</label><input type="date" value={mode.d1} disabled={!per} onChange={e => onMode({ ...mode, d1: e.target.value })} />
            <label>au</label><input type="date" value={mode.d2} disabled={!per} onChange={e => onMode({ ...mode, d2: e.target.value })} />
          </div>
          <button className="btn prim go" onClick={onImprimer}>🖨️ Imprimer</button>
        </div>
      </div>
    )
  }
  ```

- [ ] **Étape 2 : Typecheck complet**
  Exécuter : `npm run typecheck`
  Attendu : aucune erreur (main + web).

- [ ] **Étape 3 : Commit**
  ```bash
  git add -A && git commit -m "feat(ui): onglet Impressions (jour/période × standard/par parc)"
  ```

---

# PHASE 7 — Touche additive app principale TCIT (ISOLÉE — validée à part)

> ⚠️ **Règle des corrections cumulatives** : ces modifications sont **strictement additives** (aucun flux
> existant modifié). À exécuter et faire valider **séparément** du reste. Elles rendent l'écosystème vivant
> (un véhicule enregistré dans TCIT apparaît dans Pointage).

### Tâche 7.1 : Chemin partagé + module write-through (TDD)

**Fichiers concernés :**
- Créer : `STCA-Electron/src/shared/cheminBaseM.ts` (copie IDENTIQUE de Pointage)
- Créer : `STCA-Electron/src/main/stcaMShared.ts`
- Créer : `STCA-Electron/tests/stcaMShared.test.ts`

- [ ] **Étape 1 : Copier `cheminBaseM.ts`**
  Copier le contenu exact de `STCA-Pointage/src/shared/cheminBaseM.ts` dans `STCA-Electron/src/shared/cheminBaseM.ts`.

- [ ] **Étape 2 : Test qui échoue**
  ```ts
  // STCA-Electron/tests/stcaMShared.test.ts
  import { describe, it, expect } from 'vitest'
  import { mkdtempSync } from 'fs'
  import { tmpdir } from 'os'
  import { join } from 'path'
  import { upsertEnregistrement, lireBase } from '../src/main/stcaMShared'

  const rec = { numRef: '610300', numTri: '2500', immat: 'T7500', codeTransit: 'CK', nomParc: 'UNIPARK',
    maisonTransit: 'X-TRA', nomPrenom: 'TEST USER', adresse: 'Lomé/TG', marqueModele: 'TOYOTA',
    chassis: 'ZZZ00000000000001', dateEnreg: '2026-07-28', flagSortie: false, dateSortie: null }

  describe('write-through STCA M', () => {
    it('upsert ajoute puis met à jour par numRef (pas de doublon)', () => {
      const chemin = join(mkdtempSync(join(tmpdir(), 'stcam-')), 'stca-m.json')
      upsertEnregistrement(chemin, rec)
      upsertEnregistrement(chemin, { ...rec, nomPrenom: 'MODIFIÉ' })
      const base = lireBase(chemin)
      const hits = base.enregistrements.filter(v => v.numRef === '610300')
      expect(hits).toHaveLength(1)
      expect(hits[0].nomPrenom).toBe('MODIFIÉ')
    })
  })
  ```

- [ ] **Étape 3 : Lancer → échec** (`cd STCA-Electron && npm test`).

- [ ] **Étape 4 : Implémenter `stcaMShared.ts`**
  ```ts
  // STCA-Electron/src/main/stcaMShared.ts
  // Write-through ADDITIF vers la base STCA M partagée (lue par l'app Pointage).
  import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'fs'
  import { dirname } from 'path'

  export interface EnregistrementM {
    numRef: string; numTri: string; immat: string; codeTransit: string; nomParc: string
    maisonTransit: string; nomPrenom: string; adresse: string; marqueModele: string
    chassis: string; dateEnreg: string; flagSortie: boolean; dateSortie: string | null
  }
  export interface BaseM { version: number; enregistrements: EnregistrementM[] }

  export function lireBase(chemin: string): BaseM {
    try {
      if (!existsSync(chemin)) return { version: 1, enregistrements: [] }
      const d = JSON.parse(readFileSync(chemin, 'utf-8')) as BaseM
      return d && Array.isArray(d.enregistrements) ? d : { version: 1, enregistrements: [] }
    } catch { return { version: 1, enregistrements: [] } }
  }

  export function upsertEnregistrement(chemin: string, rec: EnregistrementM): void {
    try {
      const base = lireBase(chemin)
      const i = base.enregistrements.findIndex(v => v.numRef === rec.numRef)
      if (i >= 0) base.enregistrements[i] = rec
      else base.enregistrements.unshift(rec)
      mkdirSync(dirname(chemin), { recursive: true })
      const tmp = chemin + '.tmp'
      writeFileSync(tmp, JSON.stringify(base, null, 2), 'utf-8')
      renameSync(tmp, chemin)
    } catch { /* best effort : ne bloque jamais la sauvegarde principale */ }
  }
  ```

- [ ] **Étape 5 : Lancer → succès** (`npm test`).

- [ ] **Étape 6 : Commit**
  ```bash
  cd "/f/AI PROJECTS/STCA-Electron" && git add -A && git commit -m "feat(stca-m): write-through additif vers base partagée (TDD)"
  ```

### Tâche 7.2 : Brancher IPC + preload + appel après sauvegarde

**Fichiers concernés :**
- Modifier : `STCA-Electron/src/main/index.ts`
- Modifier : `STCA-Electron/src/preload/index.ts`
- Modifier : `STCA-Electron/src/renderer/src/pages/EnregistrementPage.tsx`

- [ ] **Étape 1 : Lire les points d'insertion**
  Exécuter :
  ```bash
  grep -n "ipcMain.handle" "/f/AI PROJECTS/STCA-Electron/src/main/index.ts" | head
  grep -n "exposeInMainWorld\|contextBridge" "/f/AI PROJECTS/STCA-Electron/src/preload/index.ts"
  grep -n "updateVehicule\|addVehicule\|sauvegard\|enregistrer\|handleSave\|onSave" "/f/AI PROJECTS/STCA-Electron/src/renderer/src/pages/EnregistrementPage.tsx"
  ```
  Attendu : localiser un bloc `ipcMain.handle(...)`, la ligne `contextBridge.exposeInMainWorld(...)`,
  et le handler de sauvegarde de l'enregistrement.

- [ ] **Étape 2 : Ajouter le handler IPC (main)**
  Dans `STCA-Electron/src/main/index.ts`, après les imports ajouter :
  ```ts
  import { upsertEnregistrement, type EnregistrementM } from './stcaMShared'
  import { cheminBaseM } from '../shared/cheminBaseM'
  ```
  Et dans le bloc `app.whenReady()` (à côté des autres `ipcMain.handle`) :
  ```ts
  ipcMain.handle('stcaM:upsert', (_e, rec: EnregistrementM) => { upsertEnregistrement(cheminBaseM(), rec) })
  ```

- [ ] **Étape 3 : Exposer dans le preload**
  Dans `STCA-Electron/src/preload/index.ts`, ajouter à l'objet API exposé :
  ```ts
  stcaMUpsert: (rec: unknown): Promise<void> => ipcRenderer.invoke('stcaM:upsert', rec),
  ```
  (respecter la forme existante de l'API : si elle est nommée `api`/`electron`, ajouter la propriété au bon objet).

- [ ] **Étape 4 : Appeler après la sauvegarde (renderer, ADDITIF)**
  Dans `EnregistrementPage.tsx`, **immédiatement après** l'écriture du store véhicule réussie
  (là où l'enregistrement est confirmé, réf. auto-incrémentée disponible), ajouter :
  ```ts
  // Write-through additif vers la base STCA M partagée (app Pointage). N'altère aucun flux existant.
  try {
    ;(window as unknown as { electronAPI?: { stcaMUpsert?: (r: unknown) => void }, api?: { stcaMUpsert?: (r: unknown) => void } })
    // Appel via le pont réellement exposé (adapter au nom présent : window.api / window.electron …) :
    // window.<pont>.stcaMUpsert({...})
    window.api?.stcaMUpsert?.({
      numRef: String(reference), numTri, immat: immatGeneree, codeTransit: destination,
      nomParc: description, maisonTransit, nomPrenom: nomAcheteur, adresse: paysResidence,
      marqueModele, chassis, dateEnreg: dayjs().format('YYYY-MM-DD'), flagSortie: false, dateSortie: null,
    })
  } catch { /* le pointage partagé est best-effort */ }
  ```
  Adapter les noms de variables aux identifiants réels du composant (repérés à l'Étape 1). Le mapping des
  champs suit la spec §3.2.

- [ ] **Étape 5 : Typecheck + build**
  Exécuter : `cd "/f/AI PROJECTS/STCA-Electron" && npm run typecheck`
  Attendu : aucune erreur.

- [ ] **Étape 6 : Vérification manuelle (2 apps)**
  Lancer TCIT (`npm run dev` dans STCA-Electron) → enregistrer un véhicule. Lancer Pointage
  (`npm run dev` dans STCA-Pointage) → rechercher l'immat du véhicule enregistré → il apparaît.

- [ ] **Étape 7 : Commit**
  ```bash
  git add -A && git commit -m "feat(stca-m): brancher write-through après sauvegarde enregistrement (additif)"
  ```

---

# PHASE 8 — Finitions, vérification E2E, packaging

### Tâche 8.1 : Vérification E2E complète (STCA-Pointage)

- [ ] **Étape 1 : Lancer** `cd STCA-Pointage && npm run dev` (port debug 9222 si CDP).
- [ ] **Étape 2 : Dérouler le scénario complet**
  - ZIP `T7471CK` + `A2050…` → 2 lignes ; recherche TRI `2207` → 3ᵉ ligne ; anti-doublon OK.
  - Cocher + `Pointage Véh.` → lignes jaunes + SORTI + « Sorties du jour » incrémenté (footbar).
  - `Générer Bordereau Escort` → confirmation → aperçu impression = bordereau seul.
  - Onglet Impressions : journée/par parc puis période/standard → doc conforme.
  - Vérifier `fs` : `%PROGRAMDATA%\TCIT\stca-m.json` contient `flagSortie:true` pour les pointés.
- [ ] **Étape 3 : Corriger tout écart** au CSS/comportement par rapport à la maquette (copie fidèle).

### Tâche 8.2 : Qualité + packaging

- [ ] **Étape 1 : Tests + typecheck verts**
  Exécuter : `npm test && npm run typecheck`
  Attendu : tous verts.
- [ ] **Étape 2 : Build de production**
  Exécuter : `npm run build`
  Attendu : `out/` généré sans erreur.
- [ ] **Étape 3 : Commit final + doc de session**
  Créer `STCA-Electron/docs/session-2026-07-28-pointage-build.md` (résumé build) puis :
  ```bash
  cd "/f/AI PROJECTS/STCA-Pointage" && git add -A && git commit -m "chore: app Pointage v1 — E2E vérifié, build OK"
  ```
- [ ] **Étape 4 : Mémoire** — mettre à jour `project_stca_pointage.md` (statut : build v1 fait).

---

## Auto-évaluation du plan

1. **Couverture spec** : ✅ 3 onglets (P4, P6), liste de travail (P4), Pointage Véh. écrit la sortie (P1.5 + P2 + P4.1),
   Générer Bordereau imprime seul (P5), Vider (P4.1), 2 documents fidèles (P5), fichier STCA M partagé + adaptateur
   (P1, P2), write-through additif TCIT (P7), règles/cas limites (P4.1 : introuvable, déjà sorti, doublon, liste vide).
2. **Placeholders** : ✅ aucun « TODO/à définir » ; code exact fourni ; les rares adaptations (noms de variables réels
   d'EnregistrementPage, forme du pont preload existant) sont explicitement repérées par un `grep` en Étape 1 de P7.2.
3. **Cohérence** : ✅ noms stables (`EnregistrementM`, `chercher`, `marquerSortie`, `listerSorties`, canaux `base:*`,
   `window.pointage.*`) identiques de la Phase 1 à la Phase 6.

## Ordre d'exécution recommandé
P0 → P1 → P2 → P3 → P4 → P5 → P6 (app autonome complète et testable) **puis** P7 (touche additive TCIT, validée à part)
→ P8 (finitions/packaging).
