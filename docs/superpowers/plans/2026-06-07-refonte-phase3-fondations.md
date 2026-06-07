# Plan d'Implémentation : Refonte Phase 3 — Fondations (Plan 1/4)

**Objectif :** Construire la coquille d'application fidèle à STCA II — thème WinDev strict,
barre de menus native, roue de navigation centrale, fenêtres MDI internes au chrome vert
olive, barre de statut — avec données mock, sans contenu métier dans les fenêtres (corps
vides "à construire" dans les plans suivants).

**Architecture :** Thème Ant Design centralisé (`theme/windev-theme.ts`) consommé par
`ConfigProvider`, composants sur-mesure pour les éléments propres à STCA II
(`MenuBar`, `NavigationWheel`, `MdiWindow`, `StatusBar`) regroupés dans
`components/shell/`, store Zustand généralisé pour gérer un nombre arbitraire de fenêtres
MDI par identifiant `string`, données mock dans `mock/`.

**Stack Technique :** React 18 + TypeScript + Ant Design 5 + Zustand + Framer Motion +
Vitest + React Testing Library (nouveau — à installer).

---

## Contexte pour l'exécutant

- Document de conception validé : `docs/superpowers/specs/2026-06-07-refonte-phase3-ui-design.md`
- Captures de référence clés pour ce plan :
  - `docs/screenshots/stca_menubar_zoom.png` — barre de titre + barre de menus de la fenêtre
    principale (chrome Windows natif gris/blanc, PAS de gradient sombre)
  - `docs/screenshots/stca_wheel_zoom.png` — roue de navigation (6 icônes + bouton power rouge)
  - `docs/screenshots/stca_main_clean.png` — vue d'ensemble écran principal (fond `#C8CAC8`,
    barre de statut rouge en bas avec "Fonctionnement en Mode Client/Serveur")
  - `docs/screenshots/stca_enreg_form_full.png` — chrome de fenêtre MDI interne (barre de
    titre dégradé vert olive `#5A7840 → #2A4018`, italique, boutons réduire/agrandir/fermer)
  - `docs/screenshots/live_statusbar.png` — barre de statut basse
- Le code actuel (`components/FloatingWindow.tsx`, `components/AppLayout.tsx`,
  `pages/DashboardPage.tsx`, `store/windowStore.ts`) sera **remplacé** — ces fichiers seront
  supprimés en fin de plan une fois la nouvelle coquille validée visuellement.
- Aucune infrastructure de test n'existe actuellement (`package.json` ne référence ni
  `vitest` ni `@testing-library`) — ce plan installe et configure Vitest + React Testing
  Library en première tâche.
- Alias TypeScript existants dans `tsconfig.web.json:13-18` : `@renderer`, `@components`,
  `@pages`, `@api`, `@store`. Ce plan ajoute `@theme`, `@mock`, `@windows`.

---

## Tâche 1 : Infrastructure de tests (Vitest + React Testing Library)

**Fichiers concernés :**
- Modifier : `package.json`
- Créer : `vitest.config.ts`
- Créer : `src/renderer/src/test/setup.ts`
- Créer : `src/renderer/src/test/smoke.test.tsx`

- [ ] **Étape 1 : Installer les dépendances de test**
  Exécuter :
  ```powershell
  cd "F:\AI PROJECTS\STCA-Electron"
  npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
  ```
  Attendu : les 6 paquets apparaissent dans `devDependencies` de `package.json`.

- [ ] **Étape 2 : Ajouter le script `test` dans `package.json`**
  Dans le bloc `"scripts"` de `package.json` (après la ligne `"preview": "electron-vite preview",`),
  ajouter :
  ```json
    "test": "vitest run",
    "test:watch": "vitest",
  ```

- [ ] **Étape 3 : Créer `vitest.config.ts` à la racine du projet**
  ```typescript
  import { resolve } from 'path'
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@components': resolve('src/renderer/src/components'),
        '@pages': resolve('src/renderer/src/pages'),
        '@api': resolve('src/renderer/src/api'),
        '@store': resolve('src/renderer/src/store'),
        '@theme': resolve('src/renderer/src/theme'),
        '@mock': resolve('src/renderer/src/mock'),
        '@windows': resolve('src/renderer/src/windows')
      }
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/renderer/src/test/setup.ts'],
      css: false
    }
  })
  ```

- [ ] **Étape 4 : Créer le fichier de setup `src/renderer/src/test/setup.ts`**
  ```typescript
  import '@testing-library/jest-dom'
  ```

- [ ] **Étape 5 : Écrire un test de fumée qui échoue**
  Créer `src/renderer/src/test/smoke.test.tsx` :
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'

  function Hello(): JSX.Element {
    return <span>Bonjour STCA</span>
  }

  describe('Infrastructure de test', () => {
    it('rend un composant React et trouve son texte', () => {
      render(<Hello />)
      expect(screen.getByText('Bonjour STCA')).toBeInTheDocument()
    })
  })
  ```

- [ ] **Étape 6 : Lancer les tests pour vérifier qu'ils passent**
  Exécuter : `npm run test`
  Attendu : `1 passed` — confirme que Vitest, jsdom et React Testing Library sont
  correctement câblés. (Ce test n'est pas censé échouer — il valide l'infrastructure
  elle-même ; s'il échoue, corriger la config avant de continuer.)

- [ ] **Étape 7 : Commit**
  ```powershell
  $git = "C:\Program Files\Git\cmd\git.exe"
  & $git add package.json package-lock.json vitest.config.ts src/renderer/src/test/
  & $git commit -m "[Phase 3] Infrastructure de tests Vitest + React Testing Library"
  ```

---

## Tâche 2 : Thème WinDev — tokens de couleur centralisés

**Fichiers concernés :**
- Créer : `src/renderer/src/theme/windev-theme.ts`
- Tester : `src/renderer/src/theme/windev-theme.test.ts`
- Modifier : `tsconfig.web.json:13-18`, `electron.vite.config.ts:30-37` (ajout alias `@theme`, `@mock`, `@windows`)

- [ ] **Étape 1 : Ajouter les alias dans `tsconfig.web.json`**
  Remplacer le bloc `"paths"` (lignes 13-18) par :
  ```json
      "paths": {
        "@renderer/*": ["src/renderer/src/*"],
        "@components/*": ["src/renderer/src/components/*"],
        "@pages/*": ["src/renderer/src/pages/*"],
        "@api/*": ["src/renderer/src/api/*"],
        "@store/*": ["src/renderer/src/store/*"],
        "@theme/*": ["src/renderer/src/theme/*"],
        "@mock/*": ["src/renderer/src/mock/*"],
        "@windows/*": ["src/renderer/src/windows/*"]
      }
  ```

- [ ] **Étape 2 : Ajouter les mêmes alias dans `electron.vite.config.ts`**
  Dans le bloc `resolve.alias` du `renderer` (lignes 31-37), ajouter après la ligne
  `'@store': resolve('src/renderer/src/store')` :
  ```typescript
          '@theme': resolve('src/renderer/src/theme'),
          '@mock': resolve('src/renderer/src/mock'),
          '@windows': resolve('src/renderer/src/windows')
  ```

- [ ] **Étape 3 : Écrire le test qui échoue pour les tokens de couleur**
  Créer `src/renderer/src/theme/windev-theme.test.ts` :
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { winDevColors, winDevAntdTheme } from './windev-theme'

  describe('Thème WinDev', () => {
    it('expose les couleurs de chrome de fenêtre natif Windows', () => {
      expect(winDevColors.windowChromeBg).toBe('#F0F0F0')
      expect(winDevColors.menuBarBg).toBe('#FFFFFF')
      expect(winDevColors.menuBarText).toBe('#0000CC')
    })

    it('expose le dégradé vert olive des fenêtres MDI internes', () => {
      expect(winDevColors.mdiTitleGradientStart).toBe('#5A7840')
      expect(winDevColors.mdiTitleGradientEnd).toBe('#2A4018')
    })

    it('expose le fond du bureau MDI et des formulaires', () => {
      expect(winDevColors.desktopBg).toBe('#C8CAC8')
      expect(winDevColors.formPanelBg).toBe('#E8E6D8')
    })

    it('expose un thème Ant Design avec rayons de bordure plats (style Windows classique)', () => {
      expect(winDevAntdTheme.token?.borderRadius).toBe(2)
      expect(winDevAntdTheme.token?.fontFamily).toContain('Tahoma')
    })
  })
  ```

- [ ] **Étape 4 : Lancer le test pour vérifier l'échec**
  Exécuter : `npm run test -- windev-theme`
  Attendu : échec avec `Cannot find module './windev-theme'` (le fichier n'existe pas encore).

- [ ] **Étape 5 : Créer `src/renderer/src/theme/windev-theme.ts`**
  ```typescript
  import type { ThemeConfig } from 'antd'

  /**
   * Tokens de couleur extraits des captures de référence STCA II
   * (docs/screenshots/). Source par couleur indiquée en commentaire.
   */
  export const winDevColors = {
    // Chrome de fenêtre principale — natif Windows 10 (stca_menubar_zoom.png)
    windowChromeBg:    '#F0F0F0',
    windowChromeText:  '#000000',
    menuBarBg:         '#FFFFFF',
    menuBarText:       '#0000CC',
    menuBarHoverBg:    '#E5F1FB',

    // Fenêtres MDI internes — dégradé vert olive (stca_enreg_form_full.png)
    mdiTitleGradientStart: '#5A7840',
    mdiTitleGradientEnd:   '#2A4018',
    mdiTitleText:          '#FFFFFF',

    // Bureau MDI et formulaires (stca_main_clean.png, stca_form_bottom_zoom.png)
    desktopBg:        '#C8CAC8',
    formPanelBg:      '#E8E6D8',
    inputBg:          '#FFFFFF',
    inputRequiredBg:  '#FFFDE7',

    // Barre de statut (live_statusbar.png, stca_main_clean.png)
    statusBarBg:   '#ECE9D8',
    statusBarText: '#8B0000',

    // Boutons d'action (stca_enreg_form_full.png — Valider vert / Annuler rouge)
    btnValiderBg: '#4CAF50',
    btnAnnulerBg: '#D32F2F',

    // Bandeau destination sélectionnée (stca_dest2_AFO.png)
    destHighlightBg:   '#E81313',
    destHighlightText: '#FFFFFF'
  } as const

  /**
   * Configuration Ant Design — applique le look WinDev partout
   * (police système, rayons plats, palette restreinte).
   */
  export const winDevAntdTheme: ThemeConfig = {
    token: {
      colorPrimary:   winDevColors.btnValiderBg,
      colorLink:      winDevColors.menuBarText,
      borderRadius:   2,
      fontFamily:     "'Tahoma', 'Segoe UI', Arial, sans-serif",
      fontSize:       12,
      controlHeight:  26
    },
    components: {
      Button: { borderRadius: 2, controlHeight: 26 },
      Input:  { borderRadius: 2, controlHeight: 24 },
      Select: { borderRadius: 2, controlHeight: 24 },
      Table:  { borderRadius: 0, headerBg: '#E5F1FB' },
      Modal:  { borderRadiusLG: 2 }
    }
  }
  ```

- [ ] **Étape 6 : Lancer le test pour vérifier la réussite**
  Exécuter : `npm run test -- windev-theme`
  Attendu : `4 passed`

- [ ] **Étape 7 : Commit**
  ```powershell
  & $git add tsconfig.web.json electron.vite.config.ts src/renderer/src/theme/
  & $git commit -m "[Phase 3] Thème WinDev — tokens de couleur fidèles aux captures STCA II"
  ```

---

## Tâche 3 : Données mock — Destinations (PARAMDESTINATION)

**Fichiers concernés :**
- Créer : `src/renderer/src/mock/destinations.ts`
- Tester : `src/renderer/src/mock/destinations.test.ts`

- [ ] **Étape 1 : Écrire le test qui échoue**
  Créer `src/renderer/src/mock/destinations.test.ts` :
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { mockDestinations } from './destinations'

  describe('Données mock — destinations', () => {
    it('contient les 10 destinations documentées dans PARAMDESTINATION', () => {
      expect(mockDestinations).toHaveLength(10)
    })

    it('chaque destination a un code, un nom, un tarif et une lettre', () => {
      for (const d of mockDestinations) {
        expect(d.code).toBeTruthy()
        expect(d.nom).toBeTruthy()
        expect(d.tarif).toBe(10000)
        expect(d.lettre).toMatch(/^[A-Z]$/)
      }
    })

    it('contient la destination Tohoum avec le code TO', () => {
      const tohoum = mockDestinations.find(d => d.code === 'TO')
      expect(tohoum?.nom).toBe('Tohoum')
      expect(tohoum?.numImmatActuel).toBe(7490)
    })
  })
  ```

- [ ] **Étape 2 : Lancer le test pour vérifier l'échec**
  Exécuter : `npm run test -- destinations`
  Attendu : échec `Cannot find module './destinations'`

- [ ] **Étape 3 : Créer `src/renderer/src/mock/destinations.ts`**
  Données reprises de `docs/session-exploration-STCA-II.md` (section "Destinations — PARAMDESTINATION complète") :
  ```typescript
  export interface MockDestination {
    code: string
    nom: string
    tarif: number
    lettre: string
    numImmatActuel: number
  }

  export const mockDestinations: MockDestination[] = [
    { code: 'AFO', nom: 'Afolé',           tarif: 10000, lettre: 'C', numImmatActuel: 7388 },
    { code: 'CK',  nom: 'Cinkassé',        tarif: 10000, lettre: 'T', numImmatActuel: 7467 },
    { code: 'KA',  nom: 'Kambolé',         tarif: 10000, lettre: 'E', numImmatActuel: 2182 },
    { code: 'KE',  nom: 'Kétao',           tarif: 10000, lettre: 'C', numImmatActuel: 3177 },
    { code: 'KP',  nom: 'Kpadapé',         tarif: 10000, lettre: 'C', numImmatActuel: 4419 },
    { code: 'KW',  nom: 'Kwodjoviakope',   tarif: 10000, lettre: 'C', numImmatActuel: 6637 },
    { code: 'NO',  nom: 'Noépé',           tarif: 10000, lettre: 'A', numImmatActuel: 3910 },
    { code: 'TO',  nom: 'Tohoum',          tarif: 10000, lettre: 'C', numImmatActuel: 7490 },
    { code: 'S\\C',nom: 'Sanvi condji',    tarif: 10000, lettre: 'A', numImmatActuel: 8039 },
    { code: 'POL', nom: 'Réexportation',   tarif: 10000, lettre: 'A', numImmatActuel: 3 }
  ]
  ```

- [ ] **Étape 4 : Lancer le test pour vérifier la réussite**
  Exécuter : `npm run test -- destinations`
  Attendu : `3 passed`

- [ ] **Étape 5 : Commit**
  ```powershell
  & $git add src/renderer/src/mock/destinations.ts src/renderer/src/mock/destinations.test.ts
  & $git commit -m "[Phase 3] Données mock — 10 destinations PARAMDESTINATION"
  ```

---

## Tâche 4 : Données mock — Utilisateurs (table Login)

**Fichiers concernés :**
- Créer : `src/renderer/src/mock/utilisateurs.ts`
- Tester : `src/renderer/src/mock/utilisateurs.test.ts`

- [ ] **Étape 1 : Écrire le test qui échoue**
  Créer `src/renderer/src/mock/utilisateurs.test.ts` :
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { mockUtilisateurs } from './utilisateurs'

  describe('Données mock — utilisateurs', () => {
    it('contient les 18 comptes documentés dans la table Login', () => {
      expect(mockUtilisateurs).toHaveLength(18)
    })

    it('compte 9 administrateurs', () => {
      expect(mockUtilisateurs.filter(u => u.administrateur)).toHaveLength(9)
    })

    it('compte 4 comptes désactivés', () => {
      expect(mockUtilisateurs.filter(u => !u.compteActif)).toHaveLength(4)
    })

    it('contient le compte awute, administrateur et actif', () => {
      const awute = mockUtilisateurs.find(u => u.login === 'awute')
      expect(awute?.administrateur).toBe(true)
      expect(awute?.compteActif).toBe(true)
    })
  })
  ```

- [ ] **Étape 2 : Lancer le test pour vérifier l'échec**
  Exécuter : `npm run test -- utilisateurs`
  Attendu : échec `Cannot find module './utilisateurs'`

- [ ] **Étape 3 : Créer `src/renderer/src/mock/utilisateurs.ts`**
  Données reprises de `docs/session-exploration-STCA-II.md` (section "Liste complète des
  utilisateurs — 18 comptes") :
  ```typescript
  export interface MockUtilisateur {
    login: string
    motDePasseMasque: string
    administrateur: boolean
    compteActif: boolean
  }

  export const mockUtilisateurs: MockUtilisateur[] = [
    { login: 'Administrateur',   motDePasseMasque: '••••••••', administrateur: true,  compteActif: true  },
    { login: 'Authority.Config', motDePasseMasque: '•••••',    administrateur: true,  compteActif: true  },
    { login: 'Odette',           motDePasseMasque: '••••',     administrateur: true,  compteActif: true  },
    { login: 'akilou',           motDePasseMasque: '•••',      administrateur: false, compteActif: true  },
    { login: 'aminou',           motDePasseMasque: '••••••',   administrateur: true,  compteActif: true  },
    { login: 'awute',            motDePasseMasque: '•••••',    administrateur: true,  compteActif: true  },
    { login: 'awute2',           motDePasseMasque: '••••••',   administrateur: true,  compteActif: true  },
    { login: 'celestine',        motDePasseMasque: '••••',     administrateur: false, compteActif: true  },
    { login: 'clemence',         motDePasseMasque: '••••',     administrateur: false, compteActif: false },
    { login: 'emmanuel',         motDePasseMasque: '',         administrateur: false, compteActif: true  },
    { login: 'jeanlin',          motDePasseMasque: '••••••',   administrateur: true,  compteActif: true  },
    { login: 'mathieu',          motDePasseMasque: '••••',     administrateur: false, compteActif: true  },
    { login: 'mohamed',          motDePasseMasque: '••••',     administrateur: false, compteActif: false },
    { login: 'nicole',           motDePasseMasque: '••••',     administrateur: false, compteActif: false },
    { login: 'oliadmin',         motDePasseMasque: '•••••••',  administrateur: true,  compteActif: true  },
    { login: 'victor',           motDePasseMasque: '••••',     administrateur: false, compteActif: true  },
    { login: 'victoradm',        motDePasseMasque: '•••••••',  administrateur: true,  compteActif: true  },
    { login: 'visiteur',         motDePasseMasque: '',         administrateur: false, compteActif: false }
  ]
  ```

- [ ] **Étape 4 : Lancer le test pour vérifier la réussite**
  Exécuter : `npm run test -- utilisateurs`
  Attendu : `4 passed`

- [ ] **Étape 5 : Commit**
  ```powershell
  & $git add src/renderer/src/mock/utilisateurs.ts src/renderer/src/mock/utilisateurs.test.ts
  & $git commit -m "[Phase 3] Données mock — 18 utilisateurs table Login"
  ```

---

## Tâche 5 : `StatusBar` — barre de statut basse

**Fichiers concernés :**
- Créer : `src/renderer/src/components/shell/StatusBar.tsx`
- Tester : `src/renderer/src/components/shell/StatusBar.test.tsx`

Référence visuelle : `docs/screenshots/stca_main_clean.png` (bandeau bas, texte rouge sur
fond clair, 3 zones : mode C/S | nbr véhicules | horloge).

- [ ] **Étape 1 : Écrire le test qui échoue**
  Créer `src/renderer/src/components/shell/StatusBar.test.tsx` :
  ```tsx
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import StatusBar from './StatusBar'

  describe('StatusBar', () => {
    it('affiche le mode de fonctionnement Client/Serveur', () => {
      render(<StatusBar nbVehiculesAujourdhui={0} />)
      expect(screen.getByText('Fonctionnement en Mode Client/Serveur')).toBeInTheDocument()
    })

    it('affiche le nombre de véhicules enregistrés aujourd\'hui', () => {
      render(<StatusBar nbVehiculesAujourdhui={42} />)
      expect(screen.getByText(/Nbr de véhicule\(s\) enregistré\(s\) aujourd'hui : 42/)).toBeInTheDocument()
    })

    it('affiche la date du jour au format JJ/MM/AAAA', () => {
      render(<StatusBar nbVehiculesAujourdhui={0} />)
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      expect(screen.getByText(new RegExp(`${dd}/${mm}/${today.getFullYear()}`))).toBeInTheDocument()
    })
  })
  ```

- [ ] **Étape 2 : Lancer le test pour vérifier l'échec**
  Exécuter : `npm run test -- StatusBar`
  Attendu : échec `Cannot find module './StatusBar'`

- [ ] **Étape 3 : Créer `src/renderer/src/components/shell/StatusBar.tsx`**
  ```tsx
  import { useEffect, useState } from 'react'
  import { winDevColors } from '@theme/windev-theme'

  interface StatusBarProps {
    nbVehiculesAujourdhui: number
  }

  function formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd}/${mm}/${d.getFullYear()}`
  }

  function formatHeure(d: Date): string {
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${hh}:${mi}:${ss}`
  }

  export default function StatusBar({ nbVehiculesAujourdhui }: StatusBarProps): JSX.Element {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
      const timer = setInterval(() => setNow(new Date()), 1000)
      return () => clearInterval(timer)
    }, [])

    return (
      <div style={{
        height: 24,
        background: winDevColors.statusBarBg,
        borderTop: '1px solid #C0BCA8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        fontSize: 11,
        color: winDevColors.statusBarText,
        fontWeight: 600
      }}>
        <span style={{ paddingRight: 16, borderRight: '1px solid #C0BCA8' }}>
          Fonctionnement en Mode Client/Serveur
        </span>
        <span style={{ padding: '0 16px', borderRight: '1px solid #C0BCA8', flex: 1 }}>
          {`Nbr de véhicule(s) enregistré(s) aujourd'hui : ${nbVehiculesAujourdhui}`}
        </span>
        <span style={{ paddingLeft: 16, fontFamily: 'monospace' }}>
          {`${formatDate(now)} — ${formatHeure(now)}`}
        </span>
      </div>
    )
  }
  ```

- [ ] **Étape 4 : Lancer le test pour vérifier la réussite**
  Exécuter : `npm run test -- StatusBar`
  Attendu : `3 passed`

- [ ] **Étape 5 : Commit**
  ```powershell
  & $git add src/renderer/src/components/shell/StatusBar.tsx src/renderer/src/components/shell/StatusBar.test.tsx
  & $git commit -m "[Phase 3] StatusBar — barre de statut fidèle (mode C/S, compteur, horloge)"
  ```

---

## Tâche 6 : `MenuBar` — barre de menus native

**Fichiers concernés :**
- Créer : `src/renderer/src/components/shell/MenuBar.tsx`
- Tester : `src/renderer/src/components/shell/MenuBar.test.tsx`

Référence visuelle : `docs/screenshots/stca_menubar_zoom.png` — chrome Windows natif gris
clair (`#F0F0F0`) avec titre "STCA : Enregistrement des Véhicules" + infos utilisateur,
puis barre de menus blanche avec liens bleus soulignés : Fichier, Enregistrements des
véhicules, Analyse, Assurances, Outils+Config., ?

- [ ] **Étape 1 : Écrire le test qui échoue**
  Créer `src/renderer/src/components/shell/MenuBar.test.tsx` :
  ```tsx
  import { describe, it, expect, vi } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import MenuBar from './MenuBar'

  const noop = (): void => {}

  describe('MenuBar', () => {
    it('affiche le titre de la fenêtre et les informations utilisateur', () => {
      render(<MenuBar utilisateurLogin="awute" onMenuItemClick={noop} />)
      expect(screen.getByText('STCA : Enregistrement des Véhicules')).toBeInTheDocument()
      expect(screen.getByText(/utilisateur connecté : awute/)).toBeInTheDocument()
      expect(screen.getByText(/utilisateur avec pouvoir : OUI/)).toBeInTheDocument()
    })

    it('affiche les 6 menus de premier niveau dans l\'ordre de l\'original', () => {
      render(<MenuBar utilisateurLogin="awute" onMenuItemClick={noop} />)
      const labels = ['Fichier', 'Enregistrements des véhicules', 'Analyse', 'Assurances', 'Outils+Config.', '?']
      const menuLabels = screen.getAllByRole('menuitem').map(el => el.textContent?.trim())
      expect(menuLabels).toEqual(labels)
    })

    it('ouvre le sous-menu Fichier et déclenche onMenuItemClick au clic sur "Quitter"', async () => {
      const onMenuItemClick = vi.fn()
      render(<MenuBar utilisateurLogin="awute" onMenuItemClick={onMenuItemClick} />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('menuitem', { name: 'Fichier' }))
      const quitter = await screen.findByRole('menuitem', { name: 'Quitter' })
      await user.click(quitter)

      expect(onMenuItemClick).toHaveBeenCalledWith('fichier.quitter')
    })
  })
  ```

- [ ] **Étape 2 : Lancer le test pour vérifier l'échec**
  Exécuter : `npm run test -- MenuBar`
  Attendu : échec `Cannot find module './MenuBar'`

- [ ] **Étape 3 : Créer `src/renderer/src/components/shell/MenuBar.tsx`**
  ```tsx
  import { Menu } from 'antd'
  import type { MenuProps } from 'antd'
  import { winDevColors } from '@theme/windev-theme'

  interface MenuBarProps {
    utilisateurLogin: string
    onMenuItemClick: (key: string) => void
  }

  const items: MenuProps['items'] = [
    {
      key: 'fichier',
      label: 'Fichier',
      children: [
        { key: 'fichier.marques', label: 'Marques et modèles de véhicules' },
        { key: 'fichier.fermerSession', label: 'Fermer la session' },
        { key: 'fichier.quitter', label: 'Quitter' }
      ]
    },
    {
      key: 'enregistrements',
      label: 'Enregistrements des véhicules',
      children: [
        { key: 'enregistrements.listeChassis', label: 'Liste véhicules par N°Chassis (VIN)' }
      ]
    },
    {
      key: 'analyse',
      label: 'Analyse',
      children: [
        { key: 'analyse.stca', label: 'Edition des rapports d\'analyse — STCA' },
        { key: 'analyse.assurance', label: 'Gain généré par les assurances' }
      ]
    },
    {
      key: 'assurances',
      label: 'Assurances',
      children: [
        { key: 'assurances.montantRestituer', label: 'Montant à restituer' }
      ]
    },
    {
      key: 'outils',
      label: 'Outils+Config.',
      children: [
        { key: 'outils.sauvegardeBd', label: 'Sauvegarde la Base de Données', disabled: true },
        { key: 'outils.clefAdmin', label: 'Clef d\'administration' },
        { key: 'outils.archivage', label: 'Archivage' },
        { key: 'outils.fixerRef', label: 'Fixer N° Référence' },
        { key: 'outils.impressionPlaque', label: 'Impression de plaque d\'immatriculation', disabled: true },
        { key: 'outils.posteImmat', label: 'Config. Poste N° IMMAT.' },
        { key: 'outils.configAssurances', label: 'Configuration Assurances' },
        { key: 'outils.typesVehicule', label: 'Types Véhicule' },
        { key: 'outils.paramDestinations', label: 'Paramètres Destinations' },
        { key: 'outils.configImprimantes', label: 'Config. Imprimantes' },
        { key: 'outils.exporter', label: 'Exporter les enregistrements de véhicules' },
        { key: 'outils.pointage', label: 'Pointage des véhicules' }
      ]
    },
    {
      key: 'aide',
      label: '?',
      children: [
        { key: 'aide.copyright', label: 'Copyright' },
        { key: 'aide.version', label: 'Version' },
        { key: 'aide.idReseau', label: 'ID réseau' }
      ]
    }
  ]

  export default function MenuBar({ utilisateurLogin, onMenuItemClick }: MenuBarProps): JSX.Element {
    return (
      <div style={{ flexShrink: 0 }}>
        {/* Barre de titre — chrome Windows natif gris clair */}
        <div style={{
          height: 30,
          background: winDevColors.windowChromeBg,
          borderBottom: '1px solid #D4D4D4',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          fontSize: 12,
          color: winDevColors.windowChromeText,
          gap: 24
        }}>
          <span style={{ fontWeight: 600 }}>STCA : Enregistrement des Véhicules</span>
          <span style={{ color: '#666' }}>{`utilisateur connecté : ${utilisateurLogin}`}</span>
          <span style={{ color: '#666' }}>utilisateur avec pouvoir : OUI</span>
        </div>

        {/* Barre de menus — fond blanc, liens bleus */}
        <Menu
          mode="horizontal"
          selectable={false}
          items={items}
          onClick={({ key }) => onMenuItemClick(key)}
          style={{
            background: winDevColors.menuBarBg,
            borderBottom: '1px solid #D4D4D4',
            color: winDevColors.menuBarText,
            fontSize: 12,
            lineHeight: '28px'
          }}
        />
      </div>
    )
  }
  ```

- [ ] **Étape 4 : Lancer le test pour vérifier la réussite**
  Exécuter : `npm run test -- MenuBar`
  Attendu : `3 passed`

- [ ] **Étape 5 : Commit**
  ```powershell
  & $git add src/renderer/src/components/shell/MenuBar.tsx src/renderer/src/components/shell/MenuBar.test.tsx
  & $git commit -m "[Phase 3] MenuBar — barre de menus native fidèle (Fichier/Enregistrements/Analyse/Assurances/Outils+Config./?)"
  ```

---

## Tâche 7 : `NavigationWheel` — roue de navigation centrale

**Fichiers concernés :**
- Créer : `src/renderer/src/components/shell/NavigationWheel.tsx`
- Tester : `src/renderer/src/components/shell/NavigationWheel.test.tsx`

Référence visuelle : `docs/screenshots/stca_wheel_zoom.png` — 6 icônes disposées en cercle
(Enregistrement en haut, Destination à gauche, Analyse à droite, Liste Véhicules en bas
gauche, Recherche IMMAT. en bas droite, Recherche N°Chassis en bas centre) autour d'un
bouton power rouge central.

- [ ] **Étape 1 : Écrire le test qui échoue**
  Créer `src/renderer/src/components/shell/NavigationWheel.test.tsx` :
  ```tsx
  import { describe, it, expect, vi } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import NavigationWheel, { WHEEL_ITEMS } from './NavigationWheel'

  describe('NavigationWheel', () => {
    it('définit les 6 items de la roue dans l\'ordre documenté', () => {
      expect(WHEEL_ITEMS.map(i => i.id)).toEqual([
        'enregistrement', 'destination', 'analyse', 'listeVehicules', 'rechercheImmat', 'rechercheChassis'
      ])
    })

    it('affiche les libellés des 6 items et le bouton central', () => {
      render(<NavigationWheel onSelect={vi.fn()} />)
      expect(screen.getByText('Enregistrement')).toBeInTheDocument()
      expect(screen.getByText('Destination')).toBeInTheDocument()
      expect(screen.getByText('Analyse')).toBeInTheDocument()
      expect(screen.getByText('Liste Véhicules')).toBeInTheDocument()
      expect(screen.getByText('Recherche IMMAT.')).toBeInTheDocument()
      expect(screen.getByText('Recherche N°Chassis')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /accueil|power/i })).toBeInTheDocument()
    })

    it('appelle onSelect avec l\'identifiant correct au clic sur un item', async () => {
      const onSelect = vi.fn()
      render(<NavigationWheel onSelect={onSelect} />)
      const user = userEvent.setup()

      await user.click(screen.getByText('Enregistrement'))
      expect(onSelect).toHaveBeenCalledWith('enregistrement')

      await user.click(screen.getByText('Recherche N°Chassis'))
      expect(onSelect).toHaveBeenCalledWith('rechercheChassis')
    })
  })
  ```

- [ ] **Étape 2 : Lancer le test pour vérifier l'échec**
  Exécuter : `npm run test -- NavigationWheel`
  Attendu : échec `Cannot find module './NavigationWheel'`

- [ ] **Étape 3 : Créer `src/renderer/src/components/shell/NavigationWheel.tsx`**
  ```tsx
  import { winDevColors } from '@theme/windev-theme'

  export interface WheelItem {
    id: 'enregistrement' | 'destination' | 'analyse' | 'listeVehicules' | 'rechercheImmat' | 'rechercheChassis'
    label: string
    /** Position en pourcentage relatif au conteneur circulaire (centre = 50/50) */
    top: number
    left: number
  }

  export const WHEEL_ITEMS: WheelItem[] = [
    { id: 'enregistrement',  label: 'Enregistrement',      top: 12, left: 50 },
    { id: 'destination',     label: 'Destination',         top: 50, left: 10 },
    { id: 'analyse',         label: 'Analyse',             top: 50, left: 90 },
    { id: 'listeVehicules',  label: 'Liste Véhicules',     top: 84, left: 22 },
    { id: 'rechercheImmat',  label: 'Recherche IMMAT.',    top: 84, left: 78 },
    { id: 'rechercheChassis',label: 'Recherche N°Chassis', top: 92, left: 50 }
  ]

  interface NavigationWheelProps {
    onSelect: (id: WheelItem['id']) => void
  }

  export default function NavigationWheel({ onSelect }: NavigationWheelProps): JSX.Element {
    return (
      <div style={{
        position: 'relative',
        width: 360,
        height: 360,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 40%, #EAF2FB 0%, #C9DCF2 100%)',
        border: '1px solid #A9C3DE'
      }}>
        {WHEEL_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              position: 'absolute',
              top: `${item.top}%`,
              left: `${item.left}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              color: '#39577A',
              width: 90
            }}
          >
            <span style={{
              width: 38, height: 38, borderRadius: 6,
              background: '#FFFFFF', border: '1px solid #B9CEE6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Bouton central — accueil / mise en veille */}
        <button
          aria-label="Bouton power — accueil"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D8D8D8 60%, #B0B0B0 100%)',
            border: '1px solid #9A9A9A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <span style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #FF7B4A 0%, #D9420C 70%)',
            border: '2px solid #FFFFFF'
          }} />
        </button>
      </div>
    )
  }
  ```

- [ ] **Étape 4 : Lancer le test pour vérifier la réussite**
  Exécuter : `npm run test -- NavigationWheel`
  Attendu : `3 passed`

- [ ] **Étape 5 : Commit**
  ```powershell
  & $git add src/renderer/src/components/shell/NavigationWheel.tsx src/renderer/src/components/shell/NavigationWheel.test.tsx
  & $git commit -m "[Phase 3] NavigationWheel — roue de navigation centrale (6 items + bouton power)"
  ```

---

## Tâche 8 : Généralisation du store de fenêtres MDI

Le store actuel (`store/windowStore.ts:3`) limite `WindowId` à une union fixe de 3 valeurs
(`'enregistrement' | 'liste' | 'statistiques'`). Les plans suivants ouvriront ~25 fenêtres
différentes : le store doit accepter un identifiant `string` arbitraire et une config de
fenêtre fournie à l'ouverture (titre, taille, position).

**Fichiers concernés :**
- Modifier : `src/renderer/src/store/windowStore.ts` (réécriture complète — remplace les
  lignes 1-95)
- Tester : `src/renderer/src/store/windowStore.test.ts`

- [ ] **Étape 1 : Écrire le test qui échoue**
  Créer `src/renderer/src/store/windowStore.test.ts` :
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { useWindowStore } from './windowStore'

  const config = { title: 'Test', defaultX: 10, defaultY: 20, width: 400, height: 300 }

  describe('windowStore (généralisé, IDs string arbitraires)', () => {
    beforeEach(() => {
      useWindowStore.setState({ windows: {} })
    })

    it('ouvre une fenêtre avec un identifiant arbitraire et la config fournie', () => {
      useWindowStore.getState().openWindow('rechercheImmat', config)
      const win = useWindowStore.getState().windows['rechercheImmat']
      expect(win.isOpen).toBe(true)
      expect(win.title).toBe('Test')
      expect(win.x).toBe(10)
      expect(win.width).toBe(400)
    })

    it('ré-ouvrir une fenêtre déjà ouverte la met au premier plan sans changer sa position', () => {
      const store = useWindowStore.getState()
      store.openWindow('liste', config)
      store.updatePosition('liste', 222, 333)
      const zBefore = useWindowStore.getState().windows['liste'].zIndex

      store.openWindow('liste', config)
      const win = useWindowStore.getState().windows['liste']
      expect(win.x).toBe(222)
      expect(win.zIndex).toBeGreaterThan(zBefore)
    })

    it('ferme une fenêtre — isOpen passe à false', () => {
      const store = useWindowStore.getState()
      store.openWindow('analyse', config)
      store.closeWindow('analyse')
      expect(useWindowStore.getState().windows['analyse'].isOpen).toBe(false)
    })

    it('bascule l\'état minimisé', () => {
      const store = useWindowStore.getState()
      store.openWindow('enregistrement', config)
      store.minimizeWindow('enregistrement')
      expect(useWindowStore.getState().windows['enregistrement'].isMinimized).toBe(true)
      store.minimizeWindow('enregistrement')
      expect(useWindowStore.getState().windows['enregistrement'].isMinimized).toBe(false)
    })
  })
  ```

- [ ] **Étape 2 : Lancer le test pour vérifier l'échec**
  Exécuter : `npm run test -- windowStore`
  Attendu : échec — `openWindow` actuel n'accepte qu'un seul argument (`WindowId`), pas de
  `config`, et `windows` est pré-rempli avec 3 clés fixes au lieu d'un objet vide.

- [ ] **Étape 3 : Réécrire `src/renderer/src/store/windowStore.ts`**
  Remplacer l'intégralité du fichier (lignes 1-95) par :
  ```typescript
  import { create } from 'zustand'

  export interface WindowConfig {
    title: string
    defaultX: number
    defaultY: number
    width: number
    height: number
  }

  export interface WindowState extends WindowConfig {
    id: string
    isOpen: boolean
    isMinimized: boolean
    x: number
    y: number
    zIndex: number
  }

  let maxZ = 10

  interface WindowStore {
    windows: Record<string, WindowState>
    openWindow:     (id: string, config: WindowConfig) => void
    closeWindow:    (id: string) => void
    focusWindow:    (id: string) => void
    minimizeWindow: (id: string) => void
    updatePosition: (id: string, x: number, y: number) => void
  }

  export const useWindowStore = create<WindowStore>((set, get) => ({
    windows: {},

    openWindow: (id, config) => set(state => {
      maxZ++
      const existing = state.windows[id]
      return {
        windows: {
          ...state.windows,
          [id]: existing
            ? { ...existing, isOpen: true, isMinimized: false, zIndex: maxZ }
            : {
                id,
                ...config,
                isOpen: true,
                isMinimized: false,
                x: config.defaultX,
                y: config.defaultY,
                zIndex: maxZ
              }
        }
      }
    }),

    closeWindow: (id) => set(state => {
      const win = state.windows[id]
      if (!win) return state
      return { windows: { ...state.windows, [id]: { ...win, isOpen: false, isMinimized: false } } }
    }),

    focusWindow: (id) => set(state => {
      const win = state.windows[id]
      if (!win) return state
      maxZ++
      return { windows: { ...state.windows, [id]: { ...win, zIndex: maxZ } } }
    }),

    minimizeWindow: (id) => set(state => {
      const win = state.windows[id]
      if (!win) return state
      return { windows: { ...state.windows, [id]: { ...win, isMinimized: !win.isMinimized } } }
    }),

    updatePosition: (id, x, y) => set(state => {
      const win = state.windows[id]
      if (!win) return state
      return { windows: { ...state.windows, [id]: { ...win, x, y } } }
    })
  }))

  // Conservé pour compatibilité de lecture par les futurs composants de fenêtre
  export const getWindow = (id: string): WindowState | undefined => useWindowStore.getState().windows[id]
  ```

- [ ] **Étape 4 : Lancer le test pour vérifier la réussite**
  Exécuter : `npm run test -- windowStore`
  Attendu : `4 passed`

- [ ] **Étape 5 : Commit**
  ```powershell
  & $git add src/renderer/src/store/windowStore.ts src/renderer/src/store/windowStore.test.ts
  & $git commit -m "[Phase 3] windowStore généralisé — identifiants string arbitraires + config par ouverture"
  ```

---

## Tâche 9 : `MdiWindow` — fenêtre interne au chrome vert olive (refonte de FloatingWindow)

**Fichiers concernés :**
- Créer : `src/renderer/src/components/shell/MdiWindow.tsx`
- Tester : `src/renderer/src/components/shell/MdiWindow.test.tsx`
- Supprimer (à la fin du plan, Tâche 11) : `src/renderer/src/components/FloatingWindow.tsx`

Référence visuelle : `docs/screenshots/stca_enreg_form_full.png` — barre de titre dégradé
vert olive (`#5A7840 → #2A4018`), texte blanc italique, boutons réduire/agrandir/fermer à
droite, fond du corps `#E8E6D8`.

- [ ] **Étape 1 : Écrire le test qui échoue**
  Créer `src/renderer/src/components/shell/MdiWindow.test.tsx` :
  ```tsx
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import MdiWindow from './MdiWindow'
  import { useWindowStore } from '@store/windowStore'

  const config = { title: 'Enregistrement des véhicules', defaultX: 40, defaultY: 30, width: 700, height: 500 }

  describe('MdiWindow', () => {
    beforeEach(() => {
      useWindowStore.setState({ windows: {} })
      useWindowStore.getState().openWindow('enregistrement', config)
    })

    it('affiche le titre de la fenêtre et son contenu', () => {
      render(<MdiWindow id="enregistrement"><p>Contenu du formulaire</p></MdiWindow>)
      expect(screen.getByText('Enregistrement des véhicules')).toBeInTheDocument()
      expect(screen.getByText('Contenu du formulaire')).toBeInTheDocument()
    })

    it('le bouton Fermer appelle closeWindow du store', async () => {
      render(<MdiWindow id="enregistrement"><p>Contenu</p></MdiWindow>)
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /fermer/i }))
      expect(useWindowStore.getState().windows['enregistrement'].isOpen).toBe(false)
    })

    it('le bouton Réduire appelle minimizeWindow du store', async () => {
      render(<MdiWindow id="enregistrement"><p>Contenu</p></MdiWindow>)
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /réduire/i }))
      expect(useWindowStore.getState().windows['enregistrement'].isMinimized).toBe(true)
    })

    it('ne rend rien si la fenêtre est fermée', () => {
      useWindowStore.getState().closeWindow('enregistrement')
      const { container } = render(<MdiWindow id="enregistrement"><p>Contenu</p></MdiWindow>)
      expect(container).toBeEmptyDOMElement()
    })
  })
  ```

- [ ] **Étape 2 : Lancer le test pour vérifier l'échec**
  Exécuter : `npm run test -- MdiWindow`
  Attendu : échec `Cannot find module './MdiWindow'`

- [ ] **Étape 3 : Créer `src/renderer/src/components/shell/MdiWindow.tsx`**
  ```tsx
  import { ReactNode, useState } from 'react'
  import { useWindowStore } from '@store/windowStore'
  import { winDevColors } from '@theme/windev-theme'

  interface MdiWindowProps {
    id: string
    children: ReactNode
  }

  export default function MdiWindow({ id, children }: MdiWindowProps): JSX.Element | null {
    const win         = useWindowStore(s => s.windows[id])
    const focusWindow = useWindowStore(s => s.focusWindow)
    const closeWindow = useWindowStore(s => s.closeWindow)
    const minimize    = useWindowStore(s => s.minimizeWindow)
    const updatePos   = useWindowStore(s => s.updatePosition)

    const [isMaximized, setIsMaximized] = useState(false)

    if (!win || !win.isOpen) return null

    const handleTitleMouseDown = (e: React.MouseEvent): void => {
      if (isMaximized) return
      e.preventDefault()
      focusWindow(id)

      const startX = e.clientX
      const startY = e.clientY
      const startWinX = win.x
      const startWinY = win.y

      const onMove = (ev: MouseEvent): void =>
        updatePos(id, Math.max(0, startWinX + ev.clientX - startX), Math.max(0, startWinY + ev.clientY - startY))
      const onUp = (): void => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }

    return (
      <div
        onMouseDown={() => focusWindow(id)}
        style={{
          position: 'absolute',
          left:   isMaximized ? 0 : win.x,
          top:    isMaximized ? 0 : win.y,
          width:  isMaximized ? '100%' : win.width,
          height: isMaximized ? '100%' : win.isMinimized ? 30 : win.height,
          zIndex: win.zIndex,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #2A4018',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          overflow: 'hidden'
        }}
      >
        {/* Barre de titre — dégradé vert olive fidèle à l'original */}
        <div
          onMouseDown={handleTitleMouseDown}
          style={{
            height: 30,
            flexShrink: 0,
            background: `linear-gradient(180deg, ${winDevColors.mdiTitleGradientStart} 0%, ${winDevColors.mdiTitleGradientEnd} 100%)`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 6px 0 12px',
            cursor: isMaximized ? 'default' : 'grab',
            userSelect: 'none'
          }}
        >
          <span style={{
            color: winDevColors.mdiTitleText,
            fontSize: 13,
            fontStyle: 'italic',
            fontWeight: 600,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {win.title}
          </span>

          <div style={{ display: 'flex', gap: 2 }} onMouseDown={e => e.stopPropagation()}>
            <TitleBarButton label="Réduire" onClick={() => minimize(id)} symbol="–" />
            <TitleBarButton
              label={isMaximized ? 'Restaurer' : 'Agrandir'}
              onClick={() => setIsMaximized(m => !m)}
              symbol={isMaximized ? '❐' : '☐'}
            />
            <TitleBarButton label="Fermer" onClick={() => closeWindow(id)} symbol="✕" danger />
          </div>
        </div>

        {/* Corps */}
        {!win.isMinimized && (
          <div style={{ flex: 1, overflow: 'auto', background: winDevColors.formPanelBg, padding: 16 }}>
            {children}
          </div>
        )}
      </div>
    )
  }

  function TitleBarButton({ label, onClick, symbol, danger }: {
    label: string
    onClick: () => void
    symbol: string
    danger?: boolean
  }): JSX.Element {
    return (
      <button
        aria-label={label}
        onClick={onClick}
        style={{
          width: 26,
          height: 22,
          border: 'none',
          background: danger ? '#B82020' : 'rgba(255,255,255,0.15)',
          color: '#fff',
          fontSize: 11,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {symbol}
      </button>
    )
  }
  ```

- [ ] **Étape 4 : Lancer le test pour vérifier la réussite**
  Exécuter : `npm run test -- MdiWindow`
  Attendu : `4 passed`

- [ ] **Étape 5 : Commit**
  ```powershell
  & $git add src/renderer/src/components/shell/MdiWindow.tsx src/renderer/src/components/shell/MdiWindow.test.tsx
  & $git commit -m "[Phase 3] MdiWindow — fenêtre MDI interne fidèle (chrome vert olive, store généralisé)"
  ```

---

## Tâche 10 : `MainScreen` — assemblage de la coquille

Assemble `MenuBar`, `NavigationWheel`, `StatusBar` et la zone de bureau MDI. Remplace
`pages/DashboardPage.tsx` et `components/AppLayout.tsx`. Au clic sur un item de la roue ou
un sous-menu, une `MdiWindow` générique s'ouvre avec un texte indicatif "Contenu à venir —
Plan N" (le contenu réel sera développé dans les Plans 2-4).

**Fichiers concernés :**
- Créer : `src/renderer/src/windows/MainScreen.tsx`
- Tester : `src/renderer/src/windows/MainScreen.test.tsx`
- Créer : `src/renderer/src/windows/WINDOW_REGISTRY.ts`

- [ ] **Étape 1 : Créer le registre de fenêtres `src/renderer/src/windows/WINDOW_REGISTRY.ts`**
  Centralise la config (titre, taille, position par défaut) de chaque fenêtre ouvrable
  depuis la roue ou les menus — utilisé par `MainScreen` pour appeler `openWindow`.
  ```typescript
  import type { WindowConfig } from '@store/windowStore'

  export const WINDOW_REGISTRY: Record<string, WindowConfig> = {
    enregistrement:        { title: 'Enregistrement des véhicules',                 defaultX: 60,  defaultY: 30, width: 760, height: 540 },
    destination:           { title: 'Nombre Véhicules par Frontières',              defaultX: 80,  defaultY: 50, width: 680, height: 460 },
    analyse:               { title: 'Edition des rapports d\'analyse',              defaultX: 100, defaultY: 60, width: 560, height: 380 },
    listeVehicules:        { title: 'Nombre Véhicules par Frontières',              defaultX: 80,  defaultY: 50, width: 680, height: 460 },
    rechercheImmat:        { title: 'Recherche par N° Immatriculation',             defaultX: 120, defaultY: 80, width: 480, height: 320 },
    rechercheChassis:      { title: 'Recherche par N° Chassis',                     defaultX: 120, defaultY: 80, width: 480, height: 320 },
    'fichier.marques':           { title: 'Liste des Marques / Modèles de véhicules',     defaultX: 140, defaultY: 70,  width: 580, height: 430 },
    'enregistrements.listeChassis': { title: 'Liste Véhicules Enregistrés par N°Chassis (VIN)', defaultX: 100, defaultY: 60, width: 680, height: 460 },
    'analyse.stca':              { title: 'Edition des rapports d\'analyse — STCA',        defaultX: 100, defaultY: 60,  width: 560, height: 380 },
    'analyse.assurance':         { title: 'Gain généré par les assurances',               defaultX: 100, defaultY: 60,  width: 760, height: 480 },
    'assurances.montantRestituer': { title: 'Montant à restituer',                        defaultX: 100, defaultY: 60,  width: 760, height: 480 },
    'outils.clefAdmin':          { title: 'Clef d\'administration',                       defaultX: 160, defaultY: 90,  width: 460, height: 320 },
    'outils.archivage':          { title: 'Enregistrements archivés',                     defaultX: 100, defaultY: 60,  width: 760, height: 480 },
    'outils.fixerRef':           { title: 'Fixer N° Référence',                           defaultX: 200, defaultY: 120, width: 420, height: 220 },
    'outils.posteImmat':         { title: 'Activation du mode assurance',                 defaultX: 160, defaultY: 90,  width: 460, height: 320 },
    'outils.configAssurances':   { title: 'Configuration Assurances',                     defaultX: 140, defaultY: 80,  width: 520, height: 360 },
    'outils.typesVehicule':      { title: 'Types Véhicule',                               defaultX: 200, defaultY: 120, width: 380, height: 320 },
    'outils.paramDestinations':  { title: 'Paramètres Destinations',                      defaultX: 140, defaultY: 80,  width: 580, height: 420 },
    'outils.configImprimantes':  { title: 'Configuration des éditions et imprimantes',    defaultX: 120, defaultY: 70,  width: 620, height: 460 },
    'outils.exporter':           { title: 'Exportation des enregistrements de véhicules', defaultX: 160, defaultY: 90,  width: 480, height: 280 },
    'outils.pointage':           { title: 'Pointage / Dépointage de la sortie des véhicules', defaultX: 100, defaultY: 60, width: 760, height: 480 },
    'aide.copyright':            { title: 'Copyright',   defaultX: 260, defaultY: 160, width: 360, height: 180 },
    'aide.version':              { title: 'Version',     defaultX: 260, defaultY: 160, width: 360, height: 220 },
    'aide.idReseau':             { title: 'ID réseau',   defaultX: 260, defaultY: 160, width: 360, height: 240 }
  }
  ```

- [ ] **Étape 2 : Écrire le test qui échoue**
  Créer `src/renderer/src/windows/MainScreen.test.tsx` :
  ```tsx
  import { describe, it, expect, beforeEach } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import userEvent from '@testing-library/user-event'
  import { ConfigProvider } from 'antd'
  import MainScreen from './MainScreen'
  import { useWindowStore } from '@store/windowStore'
  import { winDevAntdTheme } from '@theme/windev-theme'

  function renderWithTheme(ui: JSX.Element): ReturnType<typeof render> {
    return render(<ConfigProvider theme={winDevAntdTheme}>{ui}</ConfigProvider>)
  }

  describe('MainScreen', () => {
    beforeEach(() => {
      useWindowStore.setState({ windows: {} })
    })

    it('affiche la barre de menus, la roue de navigation et la barre de statut', () => {
      renderWithTheme(<MainScreen utilisateurLogin="awute" />)
      expect(screen.getByText('STCA : Enregistrement des Véhicules')).toBeInTheDocument()
      expect(screen.getByText('Enregistrement')).toBeInTheDocument()
      expect(screen.getByText('Fonctionnement en Mode Client/Serveur')).toBeInTheDocument()
    })

    it('ouvre une fenêtre MDI au clic sur un item de la roue', async () => {
      renderWithTheme(<MainScreen utilisateurLogin="awute" />)
      const user = userEvent.setup()

      await user.click(screen.getByText('Recherche IMMAT.'))

      expect(await screen.findByText('Recherche par N° Immatriculation')).toBeInTheDocument()
      expect(useWindowStore.getState().windows['rechercheImmat'].isOpen).toBe(true)
    })

    it('ouvre une fenêtre MDI au clic sur un sous-menu', async () => {
      renderWithTheme(<MainScreen utilisateurLogin="awute" />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('menuitem', { name: 'Fichier' }))
      await user.click(await screen.findByRole('menuitem', { name: 'Marques et modèles de véhicules' }))

      expect(await screen.findByText('Liste des Marques / Modèles de véhicules')).toBeInTheDocument()
    })
  })
  ```

- [ ] **Étape 3 : Lancer le test pour vérifier l'échec**
  Exécuter : `npm run test -- MainScreen`
  Attendu : échec `Cannot find module './MainScreen'`

- [ ] **Étape 4 : Créer `src/renderer/src/windows/MainScreen.tsx`**
  ```tsx
  import { winDevColors } from '@theme/windev-theme'
  import { useWindowStore } from '@store/windowStore'
  import MenuBar from '@components/shell/MenuBar'
  import StatusBar from '@components/shell/StatusBar'
  import NavigationWheel, { type WheelItem } from '@components/shell/NavigationWheel'
  import MdiWindow from '@components/shell/MdiWindow'
  import { WINDOW_REGISTRY } from './WINDOW_REGISTRY'

  interface MainScreenProps {
    utilisateurLogin: string
  }

  export default function MainScreen({ utilisateurLogin }: MainScreenProps): JSX.Element {
    const windows    = useWindowStore(s => s.windows)
    const openWindow = useWindowStore(s => s.openWindow)

    const openById = (id: string): void => {
      const config = WINDOW_REGISTRY[id]
      if (!config) return
      openWindow(id, config)
    }

    const handleWheelSelect = (id: WheelItem['id']): void => openById(id)

    const handleMenuItemClick = (key: string): void => {
      // Ignorer les clés de menus parents (ex: "fichier") — seules les feuilles ouvrent une fenêtre
      if (WINDOW_REGISTRY[key]) openById(key)
    }

    const openWindowIds = Object.keys(windows).filter(id => windows[id].isOpen)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
        <MenuBar utilisateurLogin={utilisateurLogin} onMenuItemClick={handleMenuItemClick} />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: winDevColors.desktopBg }}>
          {openWindowIds.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <NavigationWheel onSelect={handleWheelSelect} />
            </div>
          )}

          {openWindowIds.map(id => (
            <MdiWindow key={id} id={id}>
              <p style={{ fontSize: 13, color: '#555' }}>
                {`Contenu à venir — fenêtre "${windows[id].title}" sera développée dans un plan ultérieur.`}
              </p>
            </MdiWindow>
          ))}
        </div>

        <StatusBar nbVehiculesAujourdhui={0} />
      </div>
    )
  }
  ```

- [ ] **Étape 5 : Lancer le test pour vérifier la réussite**
  Exécuter : `npm run test -- MainScreen`
  Attendu : `3 passed`

- [ ] **Étape 6 : Commit**
  ```powershell
  & $git add src/renderer/src/windows/
  & $git commit -m "[Phase 3] MainScreen — assemblage coquille MDI fidèle (MenuBar + NavigationWheel + StatusBar)"
  ```

---

## Tâche 11 : Câblage dans l'app + suppression de l'ancien shell

Remplace l'ancien shell (`AppLayout` + `DashboardPage` + `FloatingWindow`) par `MainScreen`
dans le routeur, puis supprime les fichiers devenus orphelins.

**Fichiers concernés :**
- Modifier : `src/renderer/src/App.tsx:1-21`
- Supprimer : `src/renderer/src/components/AppLayout.tsx`
- Supprimer : `src/renderer/src/components/FloatingWindow.tsx`
- Supprimer : `src/renderer/src/pages/DashboardPage.tsx`

- [ ] **Étape 1 : Modifier `App.tsx` pour utiliser `MainScreen`**
  Remplacer le contenu de `src/renderer/src/App.tsx:1-21` par :
  ```tsx
  import { Routes, Route, Navigate } from 'react-router-dom'
  import LoginPage from '@pages/LoginPage'
  import MainScreen from '@windows/MainScreen'
  import { useAuthStore } from '@store/authStore'

  function App(): JSX.Element {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const user = useAuthStore((s) => s.user)

    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            isAuthenticated
              ? <MainScreen utilisateurLogin={user?.login ?? ''} />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    )
  }

  export default App
  ```

- [ ] **Étape 2 : Lancer la suite de tests complète pour vérifier qu'aucune régression n'apparaît**
  Exécuter : `npm run test`
  Attendu : tous les tests passent, y compris ceux des Tâches 1-10. Si un test référence
  encore `AppLayout`, `DashboardPage` ou `FloatingWindow`, le corriger avant de continuer
  (aucun de ces fichiers n'a de test dédié actuellement — seul `App.tsx` les importe).

- [ ] **Étape 3 : Supprimer les fichiers orphelins**
  ```powershell
  Remove-Item "F:\AI PROJECTS\STCA-Electron\src\renderer\src\components\AppLayout.tsx" -Confirm:$false
  Remove-Item "F:\AI PROJECTS\STCA-Electron\src\renderer\src\components\FloatingWindow.tsx" -Confirm:$false
  Remove-Item "F:\AI PROJECTS\STCA-Electron\src\renderer\src\pages\DashboardPage.tsx" -Confirm:$false
  ```

- [ ] **Étape 4 : Lancer `npm run dev`, se connecter (awute / Awmax), valider visuellement**
  Exécuter : `npm run dev`
  Vérifier dans la fenêtre Electron :
  - La barre de menus en haut affiche bien "STCA : Enregistrement des Véhicules" + les 6 menus
  - La roue de navigation est centrée, avec ses 6 items et le bouton power rouge
  - Cliquer sur "Enregistrement" ouvre une fenêtre MDI au chrome vert olive avec le texte
    "Contenu à venir..."
  - La barre de statut en bas affiche "Fonctionnement en Mode Client/Serveur", le compteur
    et l'horloge qui avance
  - Comparer côte à côte avec `docs/screenshots/stca_main_clean.png` et
    `docs/screenshots/stca_wheel_zoom.png` — ajuster les couleurs/tailles si l'écart est
    visible (les tokens sont centralisés dans `theme/windev-theme.ts`, un seul endroit à
    corriger)

- [ ] **Étape 5 : Capturer une preuve visuelle dans `docs/screenshots/`**
  Sauvegarder une capture de l'écran principal sous
  `docs/screenshots/refonte_p1_mainscreen.png` pour le suivi de validation.

- [ ] **Étape 6 : Commit final du plan**
  ```powershell
  & $git add -A
  & $git commit -m "[Phase 3] Câblage MainScreen + suppression ancien shell (AppLayout/FloatingWindow/DashboardPage)"
  ```

---

## Auto-évaluation

1. **Couverture** — Chaque élément du périmètre "Fondations" du design doc (thème,
   `MenuBar`, `NavigationWheel`, `MdiWindow`/MDI, `StatusBar`, données mock destinations et
   utilisateurs) correspond à une tâche numérotée (T2, T6, T7, T9/T8, T5, T3, T4).
2. **Pas de placeholders** — Chaque tâche contient le code exact à écrire, les commandes
   exactes à exécuter et le résultat attendu. Aucune mention de "TODO" ou "à définir".
3. **Cohérence des noms** — `useWindowStore`, `openWindow`/`closeWindow`/`focusWindow`/
   `minimizeWindow`/`updatePosition`, `winDevColors`/`winDevAntdTheme`, `WHEEL_ITEMS`,
   `WINDOW_REGISTRY` sont utilisés de manière identique à travers toutes les tâches qui les
   consomment.

---

## Suite

Une fois ce plan exécuté et validé visuellement, les plans suivants seront détaillés un à
un :
- **Plan 2** — Authentification fidèle (Login sobre, Gestion utilisateurs, Modification mot
  de passe) + écran d'accueil opérationnel
- **Plan 3** — Cœur métier (Enregistrement, Liste véhicules, Recherches IMMAT/Chassis, Destination)
- **Plan 4** — Menus secondaires (Analyse, Assurances, Outils+Config., Fichier → Marques et modèles)
