# Plan d'Implémentation : Personnalisation — Plan A (Fondation, app principale TCIT)

**Objectif :** Doter l'app principale d'une infrastructure de personnalisation (fichier partagé
`branding.json`) et d'une **bascule de thème clair/sombre + accent** pilotée par ce fichier, sans
toucher au rendu clair existant.

**Architecture :** Un module pur partagé (types + défauts + fusion), un helper de chemin
(`%PROGRAMDATA%\TCIT\branding.json`), un magasin fichier côté main (lire/écrire/surveiller) exposé au
renderer par IPC/preload, un applieur qui pose `data-theme` + `--accent` sur `<html>`, et les deux
`ConfigProvider` Ant Design rendus dynamiques (`darkAlgorithm`). Le mode sombre est **additif** :
inactif tant que `theme` vaut `"clair"` (défaut).

**Stack :** Electron 28 · React 18 · Ant Design 5 · TypeScript · Vitest + Testing-Library (déjà en place).

**Périmètre de CE plan :** infrastructure + bascule (AntD + surfaces de base). **Hors Plan A** (voir fin) :
A-bis (recoloration fine des composants coquille qui codent leurs couleurs en dur), Plan B (écran
Personnalisation + bouton ⚙️ sidebar), Plan C (Affichage + Pointage).

**Commandes de référence :**
- Test ciblé : `npx vitest run <fichier>` · Typecheck : `npx tsc --noEmit -p tsconfig.web.json && npx tsc --noEmit -p tsconfig.node.json`
- Répertoire projet : `F:\AI PROJECTS\STCA-Electron`

---

## Cartographie des fichiers

| Action | Fichier | Rôle |
|---|---|---|
| Créer | `src/shared/branding.ts` | Types + défauts + logique pure (fusion, thème, couleur) |
| Créer | `src/shared/branding.test.ts` | Tests unitaires du module pur |
| Créer | `src/shared/cheminBranding.ts` | Chemin du fichier partagé (dupliqué comme `cheminBaseM.ts`) |
| Créer | `src/main/brandingStore.ts` | Lire/écrire/surveiller `branding.json` (Node fs) |
| Créer | `src/main/brandingStore.test.ts` | Tests du magasin (dossier temporaire) |
| Modifier | `src/main/index.ts` | IPC `branding:courant`/`branding:ecrire` + surveillance → `diffuserTous('branding:maj')` |
| Modifier | `src/preload/index.ts` | Exposer `branding` sur `window.api` |
| Modifier | `src/renderer/src/api/electron.ts` | Types `window.api.branding` + `electronApi.branding` |
| Créer | `src/renderer/src/theme/appliquerBranding.ts` | Pose `data-theme` + `--accent` sur `<html>` |
| Créer | `src/renderer/src/theme/appliquerBranding.test.ts` | Test DOM (jsdom) |
| Créer | `src/renderer/src/theme/useBranding.ts` | Hook : charge + s'abonne + applique, retourne la config |
| Modifier | `src/renderer/src/theme/windev-theme.ts` | `appColorsDark` + `construireAntdTheme(sombre, accent)` |
| Modifier | `src/renderer/src/main.tsx` | `ConfigProvider` dynamique + applique le branding au démarrage |
| Modifier | `src/renderer/src/pages/MdiWindowHost.tsx` | `ConfigProvider` dynamique dans chaque fenêtre MDI |
| Modifier | `src/renderer/src/assets/index.css` | Bloc `:root[data-theme="dark"]` (surfaces de base + scrollbar) |

---

## Tâche 1 : Module partagé `branding` (types, défauts, logique pure)

**Fichiers :** Créer `src/shared/branding.ts` · Tester `src/shared/branding.test.ts`

- [ ] **Étape 1 — Écrire le test qui échoue** (`src/shared/branding.test.ts`)
  ```ts
  import { describe, it, expect } from 'vitest'
  import { BRANDING_DEFAUT, fusionnerBranding, resoudreTheme, normaliserCouleur } from './branding'

  describe('fusionnerBranding', () => {
    it('objet vide → défauts TCIT', () => {
      expect(fusionnerBranding({})).toEqual(BRANDING_DEFAUT)
    })
    it('valeur non-objet → défauts (fichier corrompu)', () => {
      expect(fusionnerBranding(null)).toEqual(BRANDING_DEFAUT)
      expect(fusionnerBranding('x')).toEqual(BRANDING_DEFAUT)
    })
    it('fusionne partiellement sans écraser le reste', () => {
      const r = fusionnerBranding({ identite: { sigle: 'ACME' } })
      expect(r.identite.sigle).toBe('ACME')
      expect(r.identite.nom).toBe(BRANDING_DEFAUT.identite.nom)
      expect(r.apparence.theme).toBe('clair')
    })
  })

  describe('resoudreTheme', () => {
    it('auto suit l’OS', () => {
      expect(resoudreTheme('auto', true)).toBe('sombre')
      expect(resoudreTheme('auto', false)).toBe('clair')
    })
    it('valeur explicite respectée, inconnue → clair', () => {
      expect(resoudreTheme('sombre', false)).toBe('sombre')
      expect(resoudreTheme('bidon' as never, true)).toBe('clair')
    })
  })

  describe('normaliserCouleur', () => {
    it('hex valide conservé, invalide → bleu TCIT', () => {
      expect(normaliserCouleur('#10B981')).toBe('#10B981')
      expect(normaliserCouleur('rouge')).toBe('#2563EB')
    })
  })
  ```

- [ ] **Étape 2 — Lancer le test (échec attendu)**
  Exécuter : `npx vitest run src/shared/branding.test.ts`
  Attendu : échec « Cannot find module './branding' ».

- [ ] **Étape 3 — Implémenter** (`src/shared/branding.ts`)
  ```ts
  // Module PUR (aucune dépendance Node/DOM) : importable par le main ET le renderer.
  export type ThemeChoix = 'clair' | 'sombre' | 'auto'

  export interface Coordonnees {
    adresse: string; tel: string; email: string; siteWeb: string; nif: string; rccm: string
  }
  export interface BrandingIdentite {
    nom: string; sigle: string; slogan: string; logo: string | null; coordonnees: Coordonnees
  }
  export interface BrandingApparence { theme: ThemeChoix; couleurAccent: string }
  export interface BrandingDocuments {
    logo: string | null; cachet: string | null; enTete: string; piedDePage: string
    mentionsLegales: string; numeroAgrement: string; devise: string; coordonneesBancaires: string
  }
  export interface BrandingConfig {
    version: number
    identite: BrandingIdentite
    apparence: BrandingApparence
    documents: BrandingDocuments
  }

  const ACCENT_DEFAUT = '#2563EB'

  export const BRANDING_DEFAUT: BrandingConfig = {
    version: 1,
    identite: {
      nom: "TCIT — Togolaise de Contrôle et d'Immatriculation Transit",
      sigle: 'TCIT',
      slogan: 'Contrôle · Immatriculation · Transit',
      logo: null,
      coordonnees: { adresse: '', tel: '', email: '', siteWeb: '', nif: '', rccm: '' },
    },
    apparence: { theme: 'clair', couleurAccent: ACCENT_DEFAUT },
    documents: {
      logo: null, cachet: null, enTete: '', piedDePage: '', mentionsLegales: '',
      numeroAgrement: '', devise: 'FCFA', coordonneesBancaires: '',
    },
  }

  const estObjet = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v)

  const chaine = (v: unknown, def: string): string => (typeof v === 'string' ? v : def)

  export function normaliserCouleur(v: unknown): string {
    return typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : '#2563EB'
  }

  export function resoudreTheme(theme: ThemeChoix, prefereSombre: boolean): 'clair' | 'sombre' {
    if (theme === 'sombre') return 'sombre'
    if (theme === 'auto') return prefereSombre ? 'sombre' : 'clair'
    return 'clair'
  }

  /** Fusionne une valeur (potentiellement partielle/corrompue) avec les défauts TCIT. */
  export function fusionnerBranding(entree: unknown): BrandingConfig {
    if (!estObjet(entree)) return structuredClone(BRANDING_DEFAUT)
    const d = BRANDING_DEFAUT
    const idt = estObjet(entree.identite) ? entree.identite : {}
    const coo = estObjet(idt.coordonnees) ? idt.coordonnees : {}
    const app = estObjet(entree.apparence) ? entree.apparence : {}
    const doc = estObjet(entree.documents) ? entree.documents : {}
    const theme = (['clair', 'sombre', 'auto'] as const).includes(app.theme as ThemeChoix)
      ? (app.theme as ThemeChoix) : 'clair'
    return {
      version: typeof entree.version === 'number' ? entree.version : 1,
      identite: {
        nom: chaine(idt.nom, d.identite.nom),
        sigle: chaine(idt.sigle, d.identite.sigle),
        slogan: chaine(idt.slogan, d.identite.slogan),
        logo: typeof idt.logo === 'string' ? idt.logo : null,
        coordonnees: {
          adresse: chaine(coo.adresse, ''), tel: chaine(coo.tel, ''), email: chaine(coo.email, ''),
          siteWeb: chaine(coo.siteWeb, ''), nif: chaine(coo.nif, ''), rccm: chaine(coo.rccm, ''),
        },
      },
      apparence: { theme, couleurAccent: normaliserCouleur(app.couleurAccent) },
      documents: {
        logo: typeof doc.logo === 'string' ? doc.logo : null,
        cachet: typeof doc.cachet === 'string' ? doc.cachet : null,
        enTete: chaine(doc.enTete, ''), piedDePage: chaine(doc.piedDePage, ''),
        mentionsLegales: chaine(doc.mentionsLegales, ''), numeroAgrement: chaine(doc.numeroAgrement, ''),
        devise: chaine(doc.devise, 'FCFA'), coordonneesBancaires: chaine(doc.coordonneesBancaires, ''),
      },
    }
  }
  ```

- [ ] **Étape 4 — Lancer le test (réussite attendue)** : `npx vitest run src/shared/branding.test.ts` → 3 blocs verts.
- [ ] **Étape 5 — Commit** : `git add src/shared/branding.ts src/shared/branding.test.ts && git commit -m "feat(branding): module partagé — types, défauts, fusion, thème"`

---

## Tâche 2 : Chemin du fichier partagé

**Fichiers :** Créer `src/shared/cheminBranding.ts`

- [ ] **Étape 1 — Implémenter** (aligné sur `src/shared/cheminBaseM.ts`)
  ```ts
  // Chemin du fichier de personnalisation partagé. ⚠️ À DUPLIQUER à l'identique dans
  // tcit-ui / Affichage / Pointage (Plan C), comme cheminBaseM.ts.
  import { join } from 'path'
  import { homedir } from 'os'

  export function cheminBranding(): string {
    const racine = process.env.PROGRAMDATA || join(homedir(), '.tcit')
    return join(racine, 'TCIT', 'branding.json')
  }
  ```
- [ ] **Étape 2 — Typecheck node** : `npx tsc --noEmit -p tsconfig.node.json` → 0 erreur.
- [ ] **Étape 3 — Commit** : `git add src/shared/cheminBranding.ts && git commit -m "feat(branding): chemin partagé %PROGRAMDATA%/TCIT/branding.json"`

---

## Tâche 3 : Magasin fichier côté main (lire/écrire/surveiller)

**Fichiers :** Créer `src/main/brandingStore.ts` · Tester `src/main/brandingStore.test.ts`

- [ ] **Étape 1 — Écrire le test qui échoue** (`src/main/brandingStore.test.ts`)
  ```ts
  import { describe, it, expect, beforeEach, afterEach } from 'vitest'
  import { mkdtempSync, rmSync, existsSync } from 'fs'
  import { tmpdir } from 'os'
  import { join } from 'path'

  let dir = ''
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'tcit-brand-')); process.env.PROGRAMDATA = dir })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  describe('brandingStore', () => {
    it('lit les défauts quand le fichier est absent', async () => {
      const { lireBranding } = await import('./brandingStore')
      expect(lireBranding().identite.sigle).toBe('TCIT')
    })
    it('écrit puis relit (round-trip), crée le dossier', async () => {
      const { lireBranding, ecrireBranding } = await import('./brandingStore')
      const cfg = lireBranding()
      cfg.apparence.theme = 'sombre'; cfg.identite.sigle = 'ACME'
      ecrireBranding(cfg)
      expect(existsSync(join(dir, 'TCIT', 'branding.json'))).toBe(true)
      const relu = lireBranding()
      expect(relu.apparence.theme).toBe('sombre')
      expect(relu.identite.sigle).toBe('ACME')
    })
  })
  ```

- [ ] **Étape 2 — Lancer (échec attendu)** : `npx vitest run src/main/brandingStore.test.ts` → module introuvable.

- [ ] **Étape 3 — Implémenter** (`src/main/brandingStore.ts`)
  ```ts
  import { readFileSync, writeFileSync, mkdirSync, watch, type FSWatcher } from 'fs'
  import { dirname } from 'path'
  import { cheminBranding } from '../shared/cheminBranding'
  import { fusionnerBranding, type BrandingConfig } from '../shared/branding'

  export function lireBranding(): BrandingConfig {
    try {
      return fusionnerBranding(JSON.parse(readFileSync(cheminBranding(), 'utf-8')))
    } catch {
      return fusionnerBranding({}) // absent / illisible / JSON invalide → défauts
    }
  }

  export function ecrireBranding(entree: BrandingConfig): BrandingConfig {
    const complet = fusionnerBranding(entree)
    const chemin = cheminBranding()
    mkdirSync(dirname(chemin), { recursive: true })
    writeFileSync(chemin, JSON.stringify(complet, null, 2), 'utf-8')
    return complet
  }

  export function surveillerBranding(onChange: () => void): FSWatcher | null {
    try {
      return watch(cheminBranding(), () => onChange())
    } catch {
      return null // le fichier peut ne pas exister encore
    }
  }
  ```

- [ ] **Étape 4 — Lancer (réussite)** : `npx vitest run src/main/brandingStore.test.ts` → vert.
- [ ] **Étape 5 — Commit** : `git add src/main/brandingStore.ts src/main/brandingStore.test.ts && git commit -m "feat(branding): magasin fichier main (lire/écrire/surveiller)"`

---

## Tâche 4 : IPC branding + diffusion (main)

**Fichiers :** Modifier `src/main/index.ts`

> Repère : `src/main/index.ts` possède déjà un helper `diffuserTous(canal, payload)` (utilisé pour
> `affichage:etat`) et un bloc `app.whenReady().then(() => { … ipcMain.handle(…) … })`.

- [ ] **Étape 1 — Importer le magasin** (en tête de fichier, avec les autres imports `./`)
  ```ts
  import { lireBranding, ecrireBranding, surveillerBranding } from './brandingStore'
  ```
- [ ] **Étape 2 — Enregistrer les handlers + la surveillance** (à l'intérieur de `app.whenReady().then(...)`, à côté des autres `ipcMain.handle`)
  ```ts
  ipcMain.handle('branding:courant', () => lireBranding())
  ipcMain.handle('branding:ecrire', (_e, cfg) => {
    const complet = ecrireBranding(cfg)
    diffuserTous('branding:maj', complet)
    return complet
  })
  // Fichier modifié par une autre app (Plan C) → rediffuser (anti-rebond 150 ms)
  let rebondBranding: NodeJS.Timeout | null = null
  surveillerBranding(() => {
    if (rebondBranding) clearTimeout(rebondBranding)
    rebondBranding = setTimeout(() => diffuserTous('branding:maj', lireBranding()), 150)
  })
  ```
- [ ] **Étape 3 — Typecheck node** : `npx tsc --noEmit -p tsconfig.node.json` → 0 erreur.
- [ ] **Étape 4 — Commit** : `git add src/main/index.ts && git commit -m "feat(branding): IPC courant/ecrire + surveillance + diffusion"`

---

## Tâche 5 : Preload + wrapper `electronApi`

**Fichiers :** Modifier `src/preload/index.ts` · `src/renderer/src/api/electron.ts`

- [ ] **Étape 1 — Preload** : ajouter dans l'objet `api` (avant l'accolade fermante `}` de `const api = { … }`)
  ```ts
    // Personnalisation (branding.json partagé, lu/écrit côté main)
    brandingCourant: (): Promise<unknown> => ipcRenderer.invoke('branding:courant'),
    brandingEcrire:  (cfg: unknown): Promise<unknown> => ipcRenderer.invoke('branding:ecrire', cfg),
    onBrandingMaj:   (cb: (cfg: unknown) => void): (() => void) => {
      const h = (_: unknown, data: unknown): void => cb(data)
      ipcRenderer.on('branding:maj', h)
      return () => ipcRenderer.removeListener('branding:maj', h)
    },
  ```
- [ ] **Étape 2 — Types `window.api`** (`electron.ts`, dans `interface Window { api: { … } }`)
  ```ts
      brandingCourant: () => Promise<BrandingConfig>
      brandingEcrire:  (cfg: BrandingConfig) => Promise<BrandingConfig>
      onBrandingMaj:   (cb: (cfg: BrandingConfig) => void) => (() => void)
  ```
  et en tête du fichier : `import type { BrandingConfig } from '../../../shared/branding'`
  *(chemin relatif depuis `src/renderer/src/api/` vers `src/shared/` — ajuster à l'alias `@shared` s'il existe dans `tsconfig`/`electron.vite.config`).*
- [ ] **Étape 3 — Wrapper `electronApi`** (ajouter dans l'objet `export const electronApi = { … }`)
  ```ts
    brandingCourant: (): Promise<BrandingConfig> =>
      window.api?.brandingCourant?.() ?? Promise.resolve(fusionnerBranding({})),
    brandingEcrire: (cfg: BrandingConfig): Promise<BrandingConfig> =>
      window.api?.brandingEcrire?.(cfg) ?? Promise.resolve(cfg),
    onBrandingMaj: (cb: (cfg: BrandingConfig) => void): (() => void) =>
      window.api?.onBrandingMaj?.(cb) ?? (() => {}),
  ```
  et importer `fusionnerBranding` : `import { fusionnerBranding, type BrandingConfig } from '../../../shared/branding'`
- [ ] **Étape 4 — Typecheck** : `npx tsc --noEmit -p tsconfig.web.json && npx tsc --noEmit -p tsconfig.node.json` → 0 erreur.
- [ ] **Étape 5 — Commit** : `git add src/preload/index.ts src/renderer/src/api/electron.ts && git commit -m "feat(branding): pont preload + wrapper electronApi"`

---

## Tâche 6 : Applieur de thème (renderer)

**Fichiers :** Créer `src/renderer/src/theme/appliquerBranding.ts` · Tester `…/appliquerBranding.test.ts`

- [ ] **Étape 1 — Écrire le test qui échoue** (jsdom déjà configuré)
  ```ts
  import { describe, it, expect, afterEach } from 'vitest'
  import { appliquerBranding } from './appliquerBranding'
  import { fusionnerBranding } from '../../../shared/branding'

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.removeProperty('--accent')
  })

  describe('appliquerBranding', () => {
    it('clair par défaut : data-theme="light" + accent posé', () => {
      appliquerBranding(fusionnerBranding({}))
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#2563EB')
    })
    it('sombre : data-theme="dark" + accent personnalisé', () => {
      appliquerBranding(fusionnerBranding({ apparence: { theme: 'sombre', couleurAccent: '#10B981' } }))
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#10B981')
    })
  })
  ```
  > Note : `data-theme` utilise les valeurs CSS `light`/`dark` (cohérent avec la maquette), tandis que
  > `theme` dans le JSON utilise `clair`/`sombre` (métier FR). L'applieur fait la conversion.

- [ ] **Étape 2 — Lancer (échec)** : `npx vitest run src/renderer/src/theme/appliquerBranding.test.ts`

- [ ] **Étape 3 — Implémenter**
  ```ts
  import { resoudreTheme, type BrandingConfig } from '../../../shared/branding'

  export function prefereSombreOS(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
  }

  /** Pose data-theme (light|dark) + --accent sur <html>. Le clair ne change RIEN au rendu actuel. */
  export function appliquerBranding(cfg: BrandingConfig): void {
    const sombre = resoudreTheme(cfg.apparence.theme, prefereSombreOS()) === 'sombre'
    const root = document.documentElement
    root.setAttribute('data-theme', sombre ? 'dark' : 'light')
    root.style.setProperty('--accent', cfg.apparence.couleurAccent)
  }
  ```
- [ ] **Étape 4 — Lancer (réussite)** : `npx vitest run src/renderer/src/theme/appliquerBranding.test.ts` → vert.
- [ ] **Étape 5 — Commit** : `git add src/renderer/src/theme/appliquerBranding.ts src/renderer/src/theme/appliquerBranding.test.ts && git commit -m "feat(branding): applieur data-theme + accent (renderer)"`

---

## Tâche 7 : Hook `useBranding` + thème AntD dynamique

**Fichiers :** Créer `src/renderer/src/theme/useBranding.ts` · Modifier `windev-theme.ts`, `main.tsx`, `pages/MdiWindowHost.tsx`

- [ ] **Étape 1 — `useBranding.ts`** (charge, applique, s'abonne aux mises à jour + à l'OS en mode auto)
  ```ts
  import { useEffect, useState } from 'react'
  import { electronApi } from '@api/electron'
  import { fusionnerBranding, type BrandingConfig } from '../../../shared/branding'
  import { appliquerBranding } from './appliquerBranding'

  export function useBranding(): BrandingConfig {
    const [cfg, setCfg] = useState<BrandingConfig>(() => fusionnerBranding({}))
    useEffect(() => {
      let vivant = true
      const poser = (c: BrandingConfig): void => { if (vivant) { setCfg(c); appliquerBranding(c) } }
      electronApi.brandingCourant().then(poser)
      const off = electronApi.onBrandingMaj(poser)
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const onOS = (): void => appliquerBranding(cfg)
      mq.addEventListener('change', onOS)
      return () => { vivant = false; off(); mq.removeEventListener('change', onOS) }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return cfg
  }
  ```
- [ ] **Étape 2 — `windev-theme.ts`** : ajouter la variante sombre + le constructeur de thème (SANS modifier `appAntdTheme` clair existant)
  ```ts
  import { theme as antdTheme, type ThemeConfig } from 'antd'

  // Palette sombre (miroir de appColors) — utilisée par A-bis pour la coquille.
  export const appColorsDark = {
    windowChromeBg: '#0E1626', windowChromeText: '#E9EEF6',
    sidebarBg: '#0E1626', sidebarText: '#E9EEF6', sidebarHoverBg: '#16223A', sidebarActiveBg: '#16223A',
    menuBarBg: '#0C1320', menuBarText: '#E9EEF6', menuBarHoverBg: '#16223A',
    mdiTitleBg: '#0A1018', mdiTitleText: '#E9EEF6', mdiBodyBg: '#111826',
    desktopBg: '#05080D',
    statusBarBg: '#0A1018', statusBarText: '#E9EEF6', statusBarBorder: 'rgba(255,255,255,0.10)',
    btnValiderBg: '#2563EB', btnAnnulerBg: '#334155',
    inputBg: '#0B111C', inputRequiredBg: '#0E1A2E',
    accentBlue: '#2563EB', accentGold: '#F59E0B', accentDanger: '#F87171',
    primaryBlue: '#111826', mdiTitleGradientStart: '#0E1626', mdiTitleGradientEnd: '#0A1018',
    formPanelBg: '#111826',
  } as const

  /** Construit le thème AntD selon le mode et l'accent. Le clair reste appAntdTheme tel quel. */
  export function construireAntdTheme(sombre: boolean, accent: string): ThemeConfig {
    if (!sombre) {
      return { ...appAntdTheme, token: { ...appAntdTheme.token, colorPrimary: accent, colorLink: accent } }
    }
    return {
      ...appAntdTheme,
      algorithm: antdTheme.darkAlgorithm,
      token: {
        ...appAntdTheme.token,
        colorPrimary: accent, colorLink: accent,
        colorBgContainer: '#111826', colorBgLayout: '#05080D', colorBorderSecondary: '#1E2A3D',
      },
      components: {
        ...appAntdTheme.components,
        Table: { ...appAntdTheme.components?.Table, headerBg: '#16223A', headerColor: '#E9EEF6', rowHoverBg: '#16223A' },
        Menu:  { ...appAntdTheme.components?.Menu, itemColor: '#E9EEF6', itemHoverBg: '#16223A', itemSelectedBg: '#1E2A3D', itemSelectedColor: '#E9EEF6' },
      },
    }
  }
  ```
- [ ] **Étape 3 — `main.tsx`** : piloter le `ConfigProvider` racine
  ```tsx
  import { theme as _antdTheme } from 'antd' // (si besoin) — sinon supprimer
  import { useBranding } from './theme/useBranding'
  import { construireAntdTheme } from './theme/windev-theme'
  import { resoudreTheme } from '../../shared/branding'
  import { prefereSombreOS } from './theme/appliquerBranding'

  function Racine(): JSX.Element {
    const cfg = useBranding()
    const sombre = resoudreTheme(cfg.apparence.theme, prefereSombreOS()) === 'sombre'
    return (
      <ConfigProvider locale={frFR} theme={construireAntdTheme(sombre, cfg.apparence.couleurAccent)}>
        <App />
      </ConfigProvider>
    )
  }
  // …render(<React.StrictMode><HashRouter><Racine /></HashRouter></React.StrictMode>)
  ```
  *(Remplacer l'ancien `<ConfigProvider theme={{ token: { colorPrimary:'#1B3A6B', … } }}>` inline par `<Racine/>`. `useBranding` doit être appelé SOUS un composant — d'où `Racine`.)*
- [ ] **Étape 4 — `MdiWindowHost.tsx`** : idem pour les fenêtres MDI
  ```tsx
  const cfg = useBranding()
  const sombre = resoudreTheme(cfg.apparence.theme, prefereSombreOS()) === 'sombre'
  // Remplacer : <ConfigProvider locale={frFR} theme={appAntdTheme}>
  // Par :       <ConfigProvider locale={frFR} theme={construireAntdTheme(sombre, cfg.apparence.couleurAccent)}>
  ```
- [ ] **Étape 5 — Typecheck + tests** : `npx tsc --noEmit -p tsconfig.web.json` puis `npx vitest run` → tout vert.
- [ ] **Étape 6 — Commit** : `git add src/renderer/src/theme/ src/renderer/src/main.tsx src/renderer/src/pages/MdiWindowHost.tsx && git commit -m "feat(branding): thème AntD dynamique piloté par branding (clair/sombre + accent)"`

---

## Tâche 8 : Tokens sombres de base (CSS)

**Fichiers :** Modifier `src/renderer/src/assets/index.css`

- [ ] **Étape 1 — Ajouter en fin de fichier** (bloc additif ; le clair reste identique)
  ```css
  /* ══ Mode sombre — surfaces de base (le reste : algorithme AntD + Plan A-bis) ══
     Ne s'active QUE si <html data-theme="dark"> est posé par appliquerBranding(). */
  :root[data-theme='dark'] body { background: #05080D; color: #E9EEF6; }
  :root[data-theme='dark'] #root { background: #05080D; }
  :root[data-theme='dark'] ::selection { background: rgba(37,99,235,0.30); }
  :root[data-theme='dark'] ::-webkit-scrollbar-thumb { background: #23324a; }
  :root[data-theme='dark'] ::-webkit-scrollbar-thumb:hover { background: #33455f; }
  ```
- [ ] **Étape 2 — Vérif non-régression clair** : lancer l'app (`unset ELECTRON_RUN_AS_NODE; npx electron-vite dev`), se connecter, confirmer que **le rendu clair est identique à aujourd'hui** (aucun `data-theme` posé tant que `theme='clair'`).
- [ ] **Étape 3 — Vérif sombre (manuel, provisoire)** : dans la console devtools, `document.documentElement.setAttribute('data-theme','dark')` → le bureau/fenêtres AntD passent en sombre ; le retirer revient au clair.
- [ ] **Étape 4 — Commit** : `git add src/renderer/src/assets/index.css && git commit -m "feat(branding): tokens sombres de base (surfaces + scrollbar)"`

---

## Auto-évaluation

1. **Couverture** — chaque brique de la fondation (schéma, chemin, magasin, IPC, pont, applieur, thème
   AntD, tokens) est couverte par une tâche exacte. La recoloration fine des composants coquille est
   explicitement **hors Plan A** (voir ci-dessous), pas éludée.
2. **Placeholders** — aucun ; tout le code de la fondation est fourni.
3. **Cohérence des noms** — `BrandingConfig`, `fusionnerBranding`, `resoudreTheme`, `appliquerBranding`,
   `useBranding`, `construireAntdTheme`, `lireBranding`/`ecrireBranding`/`surveillerBranding`,
   canaux `branding:courant`/`branding:ecrire`/`branding:maj` — identiques d'une tâche à l'autre.

## Suites (hors périmètre de CE plan)
- **Plan A-bis — Recoloration fine de la coquille** : migrer les composants qui codent leurs couleurs en
  dur vers `appColors`/`appColorsDark` (ou variables CSS) : `NavSidebar.tsx`, `MenuBar.tsx`,
  `StatusBar.tsx`, `MdiWindow.tsx`/`MdiWindowHost.tsx`, `LoginPage.tsx`, `MainScreen.tsx`,
  `SplashScreen.tsx`. À cataloguer fichier par fichier (audit couleurs).
- **Plan B** — Fenêtre « Personnalisation » (3 onglets + aperçu live) + bouton ⚙️ en bas de `NavSidebar.tsx`
  + écriture via `electronApi.brandingEcrire`.
- **Plan C** — `tcit-ui` (module branding + tokens sombres) puis Affichage + Pointage (lecture du fichier
  partagé + application + splash).
