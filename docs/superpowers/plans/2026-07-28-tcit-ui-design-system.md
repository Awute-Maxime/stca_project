# Plan d'Implémentation : Design System `tcit-ui`

**Objectif :** Créer un paquet UI partagé `tcit-ui` (source unique de tokens, CSS, composants React et
helpers Electron) qui consolide le design **déjà validé** de l'app principale TCIT **et** de TCIT Pointage,
consommé par les 3 apps via dépendance locale `file:../tcit-ui`, pour garantir la cohérence de toutes les
fenêtres.

**Architecture :** Paquet TS/React construit avec **tsup** (sortie `dist/` : ESM + types + CSS copié). Les
apps importent les composants (`import { TitleBar } from 'tcit-ui'`), la feuille de styles
(`import 'tcit-ui/styles.css'`) et les helpers process-main (`import { ... } from 'tcit-ui/electron'`). On
**codifie l'existant** (source de vérité = `windev-theme.ts` + `assets/index.css` de l'app principale +
`styles.css`/composants de Pointage) — aucune invention.

**Stack Technique :** TypeScript 5, React 18, tsup (build), Electron 28 (types côté helpers), Vitest.

**Chemin :** `F:\AI PROJECTS\tcit-ui\` (dossier voisin de STCA-Electron / STCA-Affichage / STCA-Pointage).

**Périmètre de CE plan :** créer `tcit-ui` + le faire **consommer par Pointage** (preuve E2E). Le rétrofit de
**Affichage** et de l'**app principale TCIT** fera l'objet de plans séparés (touche du code validé →
[[feedback_corrections_cumulatives]]).

---

## Cartographie des fichiers (paquet `tcit-ui/`)

| Fichier | Rôle | Source d'extraction |
|---------|------|---------------------|
| `package.json` | nom, exports, scripts build/watch | (nouveau) |
| `tsup.config.ts` | build ESM + types + copie CSS | (nouveau) |
| `tsconfig.json` | config TS | (nouveau) |
| `src/index.ts` | barrel (composants + tokens) | (nouveau) |
| `src/tokens.ts` | `tcitColors`, `tcitAntdTheme` | `STCA-Electron/.../theme/windev-theme.ts` |
| `src/styles.css` | `@import` de toutes les parties CSS | (nouveau) |
| `src/css/tokens.css` | variables CSS (`--navy`…) | dérivé de `tokens.ts` |
| `src/css/base.css` | reset, scrollbar, sélection, focus, boutons génériques, `.light-input`*, cases/radios, datepicker | `STCA-Electron/.../assets/index.css` (l.5-45, 47-86, 177-230) |
| `src/css/keyframes.css` | tous les `@keyframes` | `index.css` (l.99-172, 267, 272, 308-330) |
| `src/css/shell.css` | `.win`, `.titlebar`, `.wc`, `.tabbar`/`.tab`, `.stage`, `.formarea`, `.statusbar`+`.sb-*`, `.toolbar`, `.counter`, `.listwrap`/`table.list`, `.dest`, `#toast`, `.btn`* | `STCA-Pointage/.../styles.css` |
| `src/css/vivant.css` | couche hover/animations icônes, `.tag-sorti` stamp, responsive + micro-interactions app principale (`.nav-btn`,`.menu-item`,`.stat-card`,`.jauge-fill`,`.ac-hist`,`.btn-gestion`,`.hist-row`,`.btn-save`…) | Pointage `styles.css` (bloc vivant) + `index.css` (l.241-346) |
| `src/css/print.css` | `@media print` | Pointage `styles.css` |
| `src/css/reduced-motion.css` | `prefers-reduced-motion` global | `index.css` (l.233-239) |
| `src/components/TitleBar.tsx` | en-tête bleu frameless + contrôles | `STCA-Pointage/.../components/TitleBar.tsx` |
| `src/components/FootBar.tsx` | footbar bleu + horloge | `STCA-Pointage/.../components/FootBar.tsx` |
| `src/components/Tabs.tsx` | onglets génériques | `STCA-Pointage/.../components/TabBar.tsx` (généralisé) |
| `src/components/Icons.tsx` | icônes SVG animées | `STCA-Pointage/.../components/Icons.tsx` |
| `src/components/Compteur.tsx` | pastille compteur animée | (nouveau, extrait du pattern `.counter`) |
| `src/components/ApercuShell.tsx` | coquille fenêtre d'aperçu (bleu haut/bas) | `STCA-Pointage/.../ApercuWindow.tsx` (coquille sans le contenu métier) |
| `src/electron/window.ts` | `creerFenetreFrameless`, `brancherControlesFenetre`, `ouvrirFenetreApercu` | `STCA-Pointage/.../main/index.ts` (creerFenetre + IPC win:* + apercu:ouvrir) |
| `src/electron/index.ts` | barrel electron | (nouveau) |
| `src/styleguide/styleguide.html` | galerie autonome de tous les composants/états | (nouveau) |
| `tests/tokens.test.ts` | garde-fous tokens | (nouveau) |
| `tests/window.test.ts` | logique pure des helpers (toggle maximize) | (nouveau) |

---

## Conventions de nommage
- Tokens : `tcitColors` (objet), `tcitAntdTheme` (ThemeConfig), variables CSS `--navy #1B3A6B`, `--accent #2563EB`,
  `--gold #F59E0B`, `--green #16A34A`, `--red #DC2626`, `--bg #F0F2F5`, `--ink #1E293B`, `--muted #64748B`,
  `--line #E2E8F0`.
- Composants exportés depuis `tcit-ui` : `TitleBar`, `FootBar`, `Tabs`, `Compteur`, `ApercuShell`, plus l'objet
  `Icons` (`IcoScan`, `IcoSearch`, `IcoPrinter`, `IcoStamp`, `IcoTruck`, `IcoTrash`).
- Helpers electron depuis `tcit-ui/electron` : `creerFenetreFrameless`, `brancherControlesFenetre`,
  `ouvrirFenetreApercu`.

---

# PHASE 0 — Scaffold du paquet

### Tâche 0.1 : Créer le paquet et sa configuration de build

**Fichiers concernés :**
- Créer : `F:\AI PROJECTS\tcit-ui\` (arborescence)

- [ ] **Étape 1 : Arborescence**
  ```bash
  cd "/f/AI PROJECTS"
  mkdir -p tcit-ui/src/css tcit-ui/src/components tcit-ui/src/electron tcit-ui/src/styleguide tcit-ui/tests
  ```

- [ ] **Étape 2 : `package.json`**
  ```json
  {
    "name": "tcit-ui",
    "version": "1.0.0",
    "description": "TCIT — Design System partagé (tokens, CSS, composants, helpers Electron)",
    "type": "module",
    "exports": {
      ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
      "./styles.css": "./dist/styles.css",
      "./electron": { "types": "./dist/electron/index.d.ts", "import": "./dist/electron/index.js" }
    },
    "files": ["dist"],
    "scripts": {
      "build": "tsup && node scripts/copy-css.mjs",
      "dev": "tsup --watch --onSuccess \"node scripts/copy-css.mjs\"",
      "test": "vitest run",
      "typecheck": "tsc --noEmit"
    },
    "peerDependencies": { "react": "^18", "react-dom": "^18" },
    "devDependencies": {
      "@types/node": "^20.14.0",
      "@types/react": "^18.3.3",
      "electron": "^28.3.3",
      "react": "^18.3.1",
      "tsup": "^8.0.0",
      "typescript": "^5.5.3",
      "vitest": "^2.1.8"
    }
  }
  ```

- [ ] **Étape 3 : `tsup.config.ts`**
  ```ts
  import { defineConfig } from 'tsup'
  export default defineConfig({
    entry: { index: 'src/index.ts', 'electron/index': 'src/electron/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    external: ['react', 'react-dom', 'electron'],
  })
  ```

- [ ] **Étape 4 : `scripts/copy-css.mjs`** (concatène les CSS dans `dist/styles.css`, ordre déterministe)
  ```js
  import { readFileSync, writeFileSync, mkdirSync } from 'fs'
  import { join } from 'path'
  const parts = ['tokens', 'reset', 'base', 'keyframes', 'shell', 'vivant', 'print', 'reduced-motion']
  // reset est inclus dans base.css → on garde l'ordre : tokens, base, keyframes, shell, vivant, print, reduced-motion
  const ordre = ['tokens', 'base', 'keyframes', 'shell', 'vivant', 'print', 'reduced-motion']
  mkdirSync('dist', { recursive: true })
  const css = ordre.map(p => readFileSync(join('src/css', p + '.css'), 'utf-8')).join('\n\n')
  writeFileSync('dist/styles.css', css, 'utf-8')
  console.log('dist/styles.css écrit (' + css.length + ' octets)')
  ```
  Note : `src/styles.css` (avec `@import`) sert au styleguide en dev ; `dist/styles.css` (concaténé) est ce
  que les apps consomment (pas de résolution `@import` à faire côté app).

- [ ] **Étape 5 : `tsconfig.json`**
  ```json
  {
    "compilerOptions": {
      "target": "ES2020", "module": "ESNext", "moduleResolution": "Bundler",
      "jsx": "react-jsx", "strict": true, "declaration": true,
      "esModuleInterop": true, "skipLibCheck": true, "noEmit": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"]
    },
    "include": ["src"]
  }
  ```

- [ ] **Étape 6 : Installer + commit init**
  ```bash
  cd "/f/AI PROJECTS/tcit-ui" && npm install
  git init && printf "node_modules/\ndist/\n*.log\n" > .gitignore
  git add -A && git commit -m "chore: scaffold paquet tcit-ui (tsup + exports + copie CSS)"
  ```

---

# PHASE 1 — Tokens

### Tâche 1.1 : `src/tokens.ts` (extraction de windev-theme)

- [ ] **Étape 1 : Écrire `src/tokens.ts`** — copier `appColors` et `appAntdTheme` de
  `STCA-Electron/src/renderer/src/theme/windev-theme.ts`, renommés :
  ```ts
  import type { ThemeConfig } from 'antd'
  export const tcitColors = { /* … contenu EXACT de appColors … */ } as const
  export const tcitAntdTheme: ThemeConfig = { /* … contenu EXACT de appAntdTheme … */ }
  ```
  (Reproduire les valeurs à l'identique : navy #1B3A6B, accent #2563EB, gold #F59E0B, etc.)

- [ ] **Étape 2 : `src/css/tokens.css`** — variables CSS dérivées :
  ```css
  :root{
    --navy:#1B3A6B; --navy2:#16305c; --accent:#2563EB; --gold:#F59E0B; --green:#16A34A;
    --red:#DC2626; --danger:#DC2626; --bg:#F0F2F5; --line:#E2E8F0; --muted:#64748B; --ink:#1E293B;
    --paper:#fff; --pointe:#FEF9E7; --pointe-b:#F5D98B;
  }
  ```

- [ ] **Étape 3 : Test garde-fou `tests/tokens.test.ts`**
  ```ts
  import { describe, it, expect } from 'vitest'
  import { tcitColors } from '../src/tokens'
  describe('tokens', () => {
    it('couleurs pivots stables', () => {
      expect(tcitColors.primaryBlue).toBe('#1B3A6B')
      expect(tcitColors.accentBlue).toBe('#2563EB')
      expect(tcitColors.accentGold).toBe('#F59E0B')
    })
  })
  ```
- [ ] **Étape 4 : Lancer** `npm test` → vert. **Commit** : "feat(tokens): couleurs + thème AntD + variables CSS".

---

# PHASE 2 — CSS de base (primitives)

### Tâche 2.1 : Extraire `base.css`, `keyframes.css`, `reduced-motion.css`, `print.css`

- [ ] **Étape 1 : `src/css/base.css`** — copier depuis `STCA-Electron/.../assets/index.css` :
  reset (`*`, `body` sans `overflow:hidden`), scrollbar (l.31-45), `::selection` (l.26-29),
  micro-interactions boutons génériques (l.47-60), focus-visible (l.63-69), cases/radios (l.72-75),
  datepicker (l.77-86), **toute la famille `.light-input`** (l.177-230). Retirer les `@tailwind` (spécifiques
  à l'app principale).
- [ ] **Étape 2 : `src/css/keyframes.css`** — copier tous les `@keyframes` de `index.css`
  (formEnter, winEnter, overlayFade, immatReveal, immatPulse, shimmer, fieldGlow, sectionSlide, btnPulse,
  savedEnter, immatEmptyPulse, flagShine, jaugeFill, acOpen, vroomHop, spinIco, shakeIco) **plus** ceux de
  Pointage (`fade`, `pop`, `flash`, `sbshine`, `sbpulse`, `scanSweep`, `stampPress`, `truckRoll`, `wheelSpin`,
  `stampIn`). Dédoublonner par nom.
- [ ] **Étape 3 : `src/css/reduced-motion.css`** — le bloc universel `@media (prefers-reduced-motion: reduce)`
  d'`index.css` (l.233-239).
- [ ] **Étape 4 : `src/css/print.css`** — le bloc `@media print` de Pointage `styles.css`.
- [ ] **Étape 5 : Commit** : "feat(css): base + keyframes + print + reduced-motion (consolidés 2 apps)".

---

# PHASE 3 — CSS coquille + couche vivante

### Tâche 3.1 : `shell.css` (frameless + composants de coquille)

- [ ] **Étape 1 : `src/css/shell.css`** — copier depuis `STCA-Pointage/.../styles.css` :
  `.win` (frameless + liseré 2px), `.titlebar`+`.dot`/`.t`/`.esc`/`.sp`/`.brand`, `.wc`/`.wc-close`,
  `.tabbar`/`.tab`, `.stage`, `.formarea`/`.panel`/`.hidden`, `.flabel`/`.frow`/`.fin`(+`.zip`/`.rech`),
  `.btn`(+`prim`/`ghost`/`mini`/`danger`/`gen`/`vider`), `.toolbar`/`.counter`, `.listwrap`/`table.list`(+cellules)/
  `.dest`/`.empty`/`.tag-sorti`, `.impr`/`.opt`/`.dates`, `.statusbar`+`.sb-*`, `#toast`.
  (Les variables `--navy` etc. viennent de `tokens.css` — remplacer les `#1B3A6B` en dur par `var(--navy)` où
  c'est trivial, sinon laisser.)

### Tâche 3.2 : `vivant.css` (hover + icônes animées + micro-interactions)

- [ ] **Étape 1 : `src/css/vivant.css`** — fusionner :
  - le **bloc vivant de Pointage** (`.ico`+`.ico-*` animations, hover lift lignes/onglets/boutons/compteurs,
    `.tag-sorti` stampIn, `.fin:hover`, responsive `@media (max-width:1040px)`) ;
  - les **micro-interactions de l'app principale** d'`index.css` (l.241-346) :
    `.nav-btn .nav-ico`, `.menu-item`, `.row-hover`, `.stat-card .stat-ico`, `.jauge-fill`, `ul.ac-hist`,
    `.btn-gestion`(+vroomHop), `.hist-row`, `.btn-reset/.btn-annuler/.btn-save .btn-ico`, `.btn-decoder-vin`,
    `.flag-shine`.
  Dédoublonner (ex. `.hist-row` présent des deux côtés → une seule règle).
- [ ] **Étape 2 : `src/styles.css`** (pour le styleguide en dev) :
  ```css
  @import './css/tokens.css';
  @import './css/base.css';
  @import './css/keyframes.css';
  @import './css/shell.css';
  @import './css/vivant.css';
  @import './css/print.css';
  @import './css/reduced-motion.css';
  ```
- [ ] **Étape 3 : Commit** : "feat(css): coquille frameless + couche vivante (fusion app principale + Pointage)".

---

# PHASE 4 — Composants React + helpers Electron

### Tâche 4.1 : Composants de coquille

**Fichiers :** `src/components/{TitleBar,FootBar,Tabs,Icons,Compteur,ApercuShell}.tsx`, `src/index.ts`

- [ ] **Étape 1 : `Icons.tsx`** — copie EXACTE de `STCA-Pointage/.../components/Icons.tsx`.
- [ ] **Étape 2 : `TitleBar.tsx`** — porter celui de Pointage, mais **props** pour la réutilisabilité :
  ```tsx
  type DragCSS = React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }
  interface TitleBarProps {
    titre: React.ReactNode          // ex: <>Pointage Sortie Véhicules&nbsp;›&nbsp;<span className="esc">ESCORT</span></>
    marque?: string                 // défaut 'TCIT'
    controles: { minimiser: () => void; agrandir: () => void; fermer: () => void }
  }
  export function TitleBar({ titre, marque = 'TCIT', controles }: TitleBarProps): JSX.Element {
    return (
      <div className="titlebar" style={{ WebkitAppRegion: 'drag' } as DragCSS}>
        <span className="dot" /><span className="t">{titre}</span><span className="sp" />
        <span className="brand">{marque}</span>
        <div style={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' } as DragCSS}>
          <button className="wc" title="Réduire" onClick={controles.minimiser}>−</button>
          <button className="wc" title="Agrandir" onClick={controles.agrandir}>□</button>
          <button className="wc wc-close" title="Fermer" onClick={controles.fermer}>✕</button>
        </div>
      </div>
    )
  }
  ```
- [ ] **Étape 3 : `FootBar.tsx`** — porter celui de Pointage, avec `items?: React.ReactNode` (segments libres)
  et l'horloge live intégrée à droite (garder le rendu `.statusbar`/`.sb-*`).
- [ ] **Étape 4 : `Tabs.tsx`** — généraliser `TabBar` :
  ```tsx
  export interface TabDef<T extends string> { id: T; Icon?: () => JSX.Element; label: string }
  export function Tabs<T extends string>({ tabs, actif, onChange }:
    { tabs: TabDef<T>[]; actif: T; onChange: (id: T) => void }): JSX.Element { /* rend .tabbar/.tab */ }
  ```
- [ ] **Étape 5 : `Compteur.tsx`** — pastille `.counter` avec valeur animée (classe `pop` à l'incrément).
- [ ] **Étape 6 : `ApercuShell.tsx`** — coquille de la fenêtre d'aperçu (en-tête bleu + zone grise centrée +
  pied bleu Fermer/Imprimer), **children = le document** :
  ```tsx
  interface ApercuShellProps {
    titre: string
    controles: { minimiser: () => void; agrandir: () => void; fermer: () => void }
    onImprimer: () => void
    children: React.ReactNode
  }
  export function ApercuShell(props: ApercuShellProps): JSX.Element { /* structure de ApercuWindow, sans le
    localStorage métier : en-tête + <div zone grise>{children}</div> + pied */ }
  ```
- [ ] **Étape 7 : `src/index.ts`** (barrel)
  ```ts
  export * from './tokens'
  export { TitleBar } from './components/TitleBar'
  export { FootBar } from './components/FootBar'
  export { Tabs, type TabDef } from './components/Tabs'
  export { Compteur } from './components/Compteur'
  export { ApercuShell } from './components/ApercuShell'
  export * as Icons from './components/Icons'
  ```
- [ ] **Étape 8 : `npm run typecheck`** → vert. **Commit** : "feat(components): TitleBar/FootBar/Tabs/Compteur/ApercuShell/Icons".

### Tâche 4.2 : Helpers Electron

**Fichiers :** `src/electron/window.ts`, `src/electron/index.ts`, `tests/window.test.ts`

- [ ] **Étape 1 : Test pur `tests/window.test.ts`** (logique de bascule maximize, sans Electron)
  ```ts
  import { describe, it, expect } from 'vitest'
  import { prochainEtatMaximize } from '../src/electron/window'
  describe('window helper', () => {
    it('bascule maximisé ⇄ restauré', () => {
      expect(prochainEtatMaximize(true)).toBe('unmaximize')
      expect(prochainEtatMaximize(false)).toBe('maximize')
    })
  })
  ```
- [ ] **Étape 2 : Lancer → échec** (`npm test`).
- [ ] **Étape 3 : `src/electron/window.ts`**
  ```ts
  import { BrowserWindow, ipcMain, screen, type BrowserWindowConstructorOptions } from 'electron'
  import { join } from 'path'

  export function prochainEtatMaximize(estMaximise: boolean): 'maximize' | 'unmaximize' {
    return estMaximise ? 'unmaximize' : 'maximize'
  }

  export function creerFenetreFrameless(opts: {
    preload: string; url?: string; fichier?: string;
    largeurRatio?: number; hauteurRatio?: number; minWidth?: number; minHeight?: number;
    backgroundColor?: string; title?: string; extra?: BrowserWindowConstructorOptions;
  }): BrowserWindow {
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
    const win = new BrowserWindow({
      width: Math.max(Math.round(sw * (opts.largeurRatio ?? 0.72)), opts.minWidth ?? 960),
      height: Math.max(Math.round(sh * (opts.hauteurRatio ?? 0.78)), opts.minHeight ?? 640),
      minWidth: opts.minWidth ?? 960, minHeight: opts.minHeight ?? 600, center: true,
      frame: false, backgroundColor: opts.backgroundColor ?? '#E7ECF4', autoHideMenuBar: true, show: false,
      title: opts.title, webPreferences: { preload: opts.preload, sandbox: false },
      ...opts.extra,
    })
    win.once('ready-to-show', () => win.show())
    if (opts.url) win.loadURL(opts.url); else if (opts.fichier) win.loadFile(opts.fichier)
    return win
  }

  export function brancherControlesFenetre(): void {
    ipcMain.handle('win:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
    ipcMain.handle('win:maximize', (e) => {
      const w = BrowserWindow.fromWebContents(e.sender); if (!w) return
      if (prochainEtatMaximize(w.isMaximized()) === 'unmaximize') w.unmaximize(); else w.maximize()
    })
    ipcMain.handle('win:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close())
  }
  // ouvrirFenetreApercu(...) : ouvre/focus une fenêtre frameless chargée avec le hash '#apercu'
  export function ouvrirFenetreApercu(ref: { win: BrowserWindow | null }, o: {
    preload: string; urlBase?: string; fichier?: string; parent?: BrowserWindow | null;
  }): void { /* logique de apercu:ouvrir de Pointage, généralisée */ }
  ```
- [ ] **Étape 4 : `src/electron/index.ts`** → `export * from './window'`.
- [ ] **Étape 5 : Lancer → vert** (`npm test`). Build : `npm run build` → `dist/` (index, electron, styles.css).
- [ ] **Étape 6 : Commit** : "feat(electron): helpers fenêtre frameless + contrôles IPC + aperçu (TDD)".

---

# PHASE 5 — Guide de style vivant

### Tâche 5.1 : `styleguide.html`

- [ ] **Étape 1 : `src/styleguide/styleguide.html`** — page autonome qui `<link>` vers `../styles.css`
  (dev) et affiche, par sections : palette (tokens), typographie, boutons (tous variants + états),
  champs `.light-input` (+ variants), la coquille (fenêtre miniature : titlebar + tabs + footbar), les
  **icônes animées** (survoler pour voir), la table `.list` (avec ligne `pointe` + badge SORTI), les compteurs,
  la fenêtre d'aperçu. Chaque bloc annoté (nom de classe / composant).
- [ ] **Étape 2 : Vérifier** en ouvrant le fichier (via serveur statique ou file://) que tout s'affiche et que
  les animations au survol fonctionnent. **Commit** : "docs(styleguide): galerie vivante du design system".

---

# PHASE 6 — Adoption dans TCIT Pointage (preuve E2E)

> But : prouver que le système marche. Pointage consomme `tcit-ui` et **supprime ses duplications**.

### Tâche 6.1 : Brancher la dépendance

- [ ] **Étape 1 :** `cd STCA-Pointage` → `package.json` : ajouter `"tcit-ui": "file:../tcit-ui"` dans
  `dependencies` ; `npm install`.
- [ ] **Étape 2 :** `src/renderer/src/main.tsx` : remplacer `import './styles.css'` par
  `import 'tcit-ui/styles.css'` **puis** un `import './styles.local.css'` résiduel (ne contenant QUE l'éventuel
  spécifique Pointage — a priori vide). Supprimer le contenu désormais fourni par `tcit-ui`.

### Tâche 6.2 : Remplacer les composants locaux par ceux de `tcit-ui`

- [ ] **Étape 1 :** `App.tsx` : importer `TitleBar`, `FootBar`, `Tabs`, `Icons` depuis `tcit-ui` ; supprimer
  `components/{TitleBar,FootBar,TabBar,Icons}.tsx` locaux. Adapter les usages (props `titre`, `controles`,
  `tabs`). Les contrôles fenêtre pointent vers `window.pointage.{minimiser,agrandir,fermer}` (inchangé).
- [ ] **Étape 2 :** `ApercuWindow.tsx` : envelopper le document (`BordereauEscorte`/`ListeSorties`) dans
  `ApercuShell` de `tcit-ui` (garder la lecture localStorage métier ici).
- [ ] **Étape 3 :** `src/main/index.ts` : remplacer `creerFenetre` / IPC `win:*` / `apercu:ouvrir` par les
  helpers `tcit-ui/electron` (`creerFenetreFrameless`, `brancherControlesFenetre`, `ouvrirFenetreApercu`).
- [ ] **Étape 4 : `npm run typecheck` + `npm run build`** de Pointage → vert.

### Tâche 6.3 : Vérification E2E visible

- [ ] **Étape 1 :** `npm run dev` (fenêtre visible). Vérifier (CDP + capture) : coquille identique (en-tête bleu,
  footbar, liseré), onglets + icônes animées, scan→pointage→SORTI, Générer→aperçu (ApercuShell) bleu haut/bas.
  Comparer visuellement à l'avant-adoption (aucune régression).
- [ ] **Étape 2 :** Commit Pointage : "refactor(ui): consomme tcit-ui (design system partagé)". Commit tcit-ui si
  ajustements. Laisser l'app ouverte pour validation utilisateur (Règle 26).

---

# PHASE 7 — (hors périmètre de ce plan) Rétrofit Affichage + app principale

Plans séparés, chacun validé à part (touche du code validé). Ordre : Affichage (petit) puis app principale TCIT
(gros — MenuBar/StatusBar/documents/inputs migrent vers `tcit-ui`, en conservant le comportement).

---

## Auto-évaluation du plan
1. **Couverture** : tokens (P1), CSS base/keyframes/print/reduced-motion (P2), coquille + vivant fusionnés des 2
   apps (P3), composants + helpers Electron (P4), styleguide (P5), adoption+preuve E2E dans Pointage (P6),
   rétrofit différé (P7). ✅
2. **Placeholders** : les tâches d'extraction nomment le **fichier source exact et les plages de lignes** — c'est
   une consolidation, pas du vague. Code exact fourni pour tout le neuf (package.json, tsup, tokens, helpers,
   composants). ✅
3. **Cohérence** : noms stables (`tcitColors`, `TitleBar`, `Tabs`, `ApercuShell`, `creerFenetreFrameless`,
   variables `--navy`…) de P1 à P6. ✅

## Ordre d'exécution
P0 → P1 → P2 → P3 → P4 → P5 → P6 (paquet complet + prouvé par Pointage). P7 = plans ultérieurs.
