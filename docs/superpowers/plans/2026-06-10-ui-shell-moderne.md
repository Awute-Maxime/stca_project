# Plan d'Implémentation : UI Shell Moderne — Palette Bleue + NavSidebar

**Objectif :** Remplacer le thème WinDev vert olive et la roue de navigation par une palette bleu marine professionnelle et une sidebar à gros boutons icônes, en conservant intégralement la logique MDI, les menus et les 24 fenêtres.

**Architecture :** Les tokens de couleur sont centralisés dans `app-theme.ts` (remplace `windev-theme.ts`). La `NavigationWheel` est supprimée et remplacée par `NavSidebar` (liste verticale de 6 boutons). Le `MainScreen` passe d'un layout "roue centrée" à un layout "sidebar fixe gauche + zone MDI droite". Toutes les autres logiques (windowStore, WINDOW_REGISTRY, menus, MDI drag) restent identiques.

**Stack Technique :** Electron + React + Ant Design 5 + TypeScript + Vitest + React Testing Library + `@ant-design/icons`

---

## Cartographie des fichiers

| Action | Fichier |
|--------|---------|
| **Réécrire** | `src/renderer/src/theme/windev-theme.ts` |
| Mettre à jour | `src/renderer/src/theme/windev-theme.test.ts` |
| **Supprimer** | `src/renderer/src/components/shell/NavigationWheel.tsx` |
| **Supprimer** | `src/renderer/src/components/shell/NavigationWheel.test.tsx` |
| **Créer** | `src/renderer/src/components/shell/NavSidebar.tsx` |
| **Créer** | `src/renderer/src/components/shell/NavSidebar.test.tsx` |
| Modifier | `src/renderer/src/components/shell/MdiWindow.tsx` |
| Modifier | `src/renderer/src/components/shell/MdiWindow.test.tsx` |
| Modifier | `src/renderer/src/components/shell/StatusBar.tsx` |
| Modifier | `src/renderer/src/components/shell/StatusBar.test.tsx` |
| Modifier | `src/renderer/src/components/shell/MenuBar.tsx` |
| Modifier | `src/renderer/src/components/shell/MenuBar.test.tsx` |
| Modifier | `src/renderer/src/windows/MainScreen.tsx` |
| Modifier | `src/renderer/src/windows/MainScreen.test.tsx` |
| Modifier | `src/renderer/src/pages/LoginPage.tsx` |

---

## Tâche 1 : Thème bleu professionnel

**Fichiers concernés :**
- Réécrire : `src/renderer/src/theme/windev-theme.ts`
- Mettre à jour : `src/renderer/src/theme/windev-theme.test.ts`

- [ ] **Étape 1 : Mettre à jour le test pour la nouvelle palette**

```typescript
// src/renderer/src/theme/windev-theme.test.ts
import { describe, it, expect } from 'vitest'
import { appColors, appAntdTheme } from '@theme/windev-theme'

describe('appColors — palette bleu professionnel', () => {
  it('définit la couleur primaire bleu marine', () => {
    expect(appColors.primaryBlue).toBe('#1B3A6B')
  })

  it('définit la couleur de fond sidebar', () => {
    expect(appColors.sidebarBg).toBe('#1B3A6B')
  })

  it('définit le fond bureau MDI gris clair', () => {
    expect(appColors.desktopBg).toBe('#F0F2F5')
  })

  it('exporte un ThemeConfig Ant Design valide avec colorPrimary bleu', () => {
    expect(appAntdTheme.token?.colorPrimary).toBe('#2563EB')
  })
})
```

- [ ] **Étape 2 : Lancer les tests pour vérifier l'échec**
  ```
  npm test
  ```
  Attendu : 4 tests échouent (`appColors is not defined` / `appAntdTheme is not defined`)

- [ ] **Étape 3 : Réécrire `windev-theme.ts` avec la palette bleue**

```typescript
// src/renderer/src/theme/windev-theme.ts
import type { ThemeConfig } from 'antd'

export const appColors = {
  // Chrome fenêtre principale
  windowChromeBg:   '#F5F5F5',
  windowChromeText: '#1B3A6B',

  // Sidebar navigation
  sidebarBg:        '#1B3A6B',
  sidebarText:      '#FFFFFF',
  sidebarHoverBg:   '#2563EB',
  sidebarActiveBg:  '#2563EB',

  // Barre de menus
  menuBarBg:        '#FFFFFF',
  menuBarText:      '#1B3A6B',
  menuBarHoverBg:   '#EEF2FF',

  // Fenêtres MDI internes
  mdiTitleBg:       '#1B3A6B',
  mdiTitleText:     '#FFFFFF',
  mdiBodyBg:        '#FFFFFF',

  // Bureau MDI
  desktopBg:        '#F0F2F5',

  // Barre de statut
  statusBarBg:      '#1B3A6B',
  statusBarText:    '#FFFFFF',
  statusBarBorder:  'rgba(255,255,255,0.2)',

  // Boutons d'action
  btnValiderBg:     '#2563EB',
  btnAnnulerBg:     '#6B7280',

  // Inputs
  inputBg:          '#FFFFFF',
  inputRequiredBg:  '#EFF6FF',

  // Accents
  accentBlue:       '#2563EB',
  accentGold:       '#F59E0B',
  accentDanger:     '#DC2626',
} as const

// Compat alias pour les fichiers encore non migrés
export const winDevColors = appColors

export const appAntdTheme: ThemeConfig = {
  token: {
    colorPrimary:  '#2563EB',
    colorLink:     '#2563EB',
    borderRadius:  4,
    fontFamily:    "'Segoe UI', Arial, sans-serif",
    fontSize:      13,
    controlHeight: 32,
  },
  components: {
    Button: { borderRadius: 4, controlHeight: 32 },
    Input:  { borderRadius: 4, controlHeight: 32 },
    Select: { borderRadius: 4, controlHeight: 32 },
    Table:  { borderRadius: 4, headerBg: '#EEF2FF' },
    Modal:  { borderRadiusLG: 6 },
    Menu: {
      itemColor:        '#1B3A6B',
      itemHoverBg:      '#EEF2FF',
      itemSelectedBg:   '#DBEAFE',
      itemSelectedColor: '#1B3A6B',
    },
  },
}

// Compat alias
export const winDevAntdTheme = appAntdTheme
```

- [ ] **Étape 4 : Lancer les tests**
  ```
  npm test
  ```
  Attendu : tous les tests passent (y compris anciens qui utilisent `winDevColors` via l'alias)

- [ ] **Étape 5 : Commit**
  ```
  git add src/renderer/src/theme/
  git commit -m "[Plan 2] Thème bleu professionnel — remplace palette WinDev olive"
  ```

---

## Tâche 2 : NavSidebar (remplace NavigationWheel)

**Fichiers concernés :**
- Supprimer : `src/renderer/src/components/shell/NavigationWheel.tsx`
- Supprimer : `src/renderer/src/components/shell/NavigationWheel.test.tsx`
- Créer : `src/renderer/src/components/shell/NavSidebar.tsx`
- Créer : `src/renderer/src/components/shell/NavSidebar.test.tsx`

- [ ] **Étape 1 : Supprimer les fichiers NavigationWheel**
  ```
  rm src/renderer/src/components/shell/NavigationWheel.tsx
  rm src/renderer/src/components/shell/NavigationWheel.test.tsx
  ```

- [ ] **Étape 2 : Écrire le test NavSidebar**

```typescript
// src/renderer/src/components/shell/NavSidebar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavSidebar, { SIDEBAR_ITEMS } from './NavSidebar'

describe('NavSidebar', () => {
  it('définit les 6 items dans l\'ordre documenté', () => {
    expect(SIDEBAR_ITEMS.map(i => i.id)).toEqual([
      'enregistrement', 'destination', 'analyse',
      'listeVehicules', 'rechercheImmat', 'rechercheChassis'
    ])
  })

  it('affiche les 6 boutons avec leur libellé', () => {
    render(<NavSidebar onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: /enregistrement/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /destination/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyse/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /liste véhicules/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recherche immat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recherche n°chassis/i })).toBeInTheDocument()
  })

  it('appelle onSelect avec l\'identifiant correct au clic', async () => {
    const onSelect = vi.fn()
    render(<NavSidebar onSelect={onSelect} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /enregistrement/i }))
    expect(onSelect).toHaveBeenCalledWith('enregistrement')

    await user.click(screen.getByRole('button', { name: /destination/i }))
    expect(onSelect).toHaveBeenCalledWith('destination')
  })
})
```

- [ ] **Étape 3 : Lancer les tests pour vérifier l'échec**
  ```
  npm test
  ```
  Attendu : 3 tests échouent (`NavSidebar` introuvable)

- [ ] **Étape 4 : Créer `NavSidebar.tsx`**

```typescript
// src/renderer/src/components/shell/NavSidebar.tsx
import {
  FileAddOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  CarOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { appColors } from '@theme/windev-theme'

export interface SidebarItem {
  id: 'enregistrement' | 'destination' | 'analyse' | 'listeVehicules' | 'rechercheImmat' | 'rechercheChassis'
  label: string
  icon: ReactNode
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'enregistrement',   label: 'Enregistrement',      icon: <FileAddOutlined /> },
  { id: 'destination',      label: 'Destination',         icon: <EnvironmentOutlined /> },
  { id: 'analyse',          label: 'Analyse',             icon: <BarChartOutlined /> },
  { id: 'listeVehicules',   label: 'Liste Véhicules',     icon: <UnorderedListOutlined /> },
  { id: 'rechercheImmat',   label: 'Recherche IMMAT.',    icon: <SearchOutlined /> },
  { id: 'rechercheChassis', label: 'Recherche N°Chassis', icon: <CarOutlined /> },
]

interface NavSidebarProps {
  onSelect: (id: SidebarItem['id']) => void
  activeId?: string
}

export default function NavSidebar({ onSelect, activeId }: NavSidebarProps): JSX.Element {
  return (
    <div style={{
      width: 100,
      flexShrink: 0,
      background: appColors.sidebarBg,
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 0',
      gap: 4,
      overflowY: 'auto',
    }}>
      {SIDEBAR_ITEMS.map(item => {
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            aria-label={item.label}
            onClick={() => onSelect(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '14px 8px',
              margin: '0 6px',
              border: 'none',
              borderRadius: 6,
              background: isActive ? appColors.sidebarActiveBg : 'transparent',
              color: appColors.sidebarText,
              cursor: 'pointer',
              transition: 'background 0.15s',
              fontSize: 10,
              fontWeight: 600,
              lineHeight: 1.3,
              textAlign: 'center',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = appColors.sidebarHoverBg
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Étape 5 : Lancer les tests**
  ```
  npm test
  ```
  Attendu : tous les tests NavSidebar passent

- [ ] **Étape 6 : Commit**
  ```
  git add src/renderer/src/components/shell/
  git commit -m "[Plan 2] NavSidebar — remplace NavigationWheel (sidebar 6 boutons icônes)"
  ```

---

## Tâche 3 : MdiWindow — barre de titre bleue

**Fichiers concernés :**
- Modifier : `src/renderer/src/components/shell/MdiWindow.tsx` lignes 54–68 et 97–99
- Modifier : `src/renderer/src/components/shell/MdiWindow.test.tsx`

- [ ] **Étape 1 : Mettre à jour le test MdiWindow**

Ouvrir `src/renderer/src/components/shell/MdiWindow.test.tsx` et remplacer le test qui vérifie la couleur de la barre de titre :

```typescript
// src/renderer/src/components/shell/MdiWindow.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MdiWindow from './MdiWindow'
import { useWindowStore } from '@store/windowStore'

const openWindow = (id: string): void => {
  useWindowStore.setState({
    windows: {
      [id]: { id, title: 'Test Fenêtre', x: 100, y: 50, width: 400, height: 300, isOpen: true, isMinimized: false, zIndex: 1 }
    }
  })
}

describe('MdiWindow', () => {
  beforeEach(() => useWindowStore.setState({ windows: {} }))

  it('ne rend rien si la fenêtre est fermée', () => {
    const { container } = render(<MdiWindow id="test"><p>contenu</p></MdiWindow>)
    expect(container.firstChild).toBeNull()
  })

  it('affiche le titre et le contenu quand la fenêtre est ouverte', () => {
    openWindow('test')
    render(<MdiWindow id="test"><p>contenu enfant</p></MdiWindow>)
    expect(screen.getByText('Test Fenêtre')).toBeInTheDocument()
    expect(screen.getByText('contenu enfant')).toBeInTheDocument()
  })

  it('la barre de titre a un fond bleu marine', () => {
    openWindow('test')
    render(<MdiWindow id="test"><p>x</p></MdiWindow>)
    const titleBar = screen.getByText('Test Fenêtre').parentElement!
    expect(titleBar.style.background).toContain('#1B3A6B')
  })

  it('ferme la fenêtre au clic sur le bouton Fermer', async () => {
    openWindow('test')
    render(<MdiWindow id="test"><p>x</p></MdiWindow>)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(useWindowStore.getState().windows['test'].isOpen).toBe(false)
  })
})
```

- [ ] **Étape 2 : Lancer les tests pour vérifier l'échec**
  ```
  npm test
  ```
  Attendu : le test "barre de titre bleue" échoue (contient encore `#5A7840`)

- [ ] **Étape 3 : Modifier `MdiWindow.tsx`** — remplacer uniquement les références de couleur

Ligne 54 — remplacer `border: '1px solid #2A4018'` par `border: '1px solid #1B3A6B'`

Lignes 62–65 — remplacer le bloc `background` du titre :
```typescript
// AVANT
background: `linear-gradient(180deg, ${winDevColors.mdiTitleGradientStart} 0%, ${winDevColors.mdiTitleGradientEnd} 100%)`,
// APRÈS
background: appColors.mdiTitleBg,
```

Ligne 72–74 — remplacer couleur texte titre :
```typescript
// AVANT
color: winDevColors.mdiTitleText,
// APRÈS
color: appColors.mdiTitleText,
```

Ligne 98 — remplacer fond du corps :
```typescript
// AVANT
background: winDevColors.formPanelBg, padding: 16
// APRÈS
background: appColors.mdiBodyBg, padding: 16
```

Mettre à jour l'import ligne 3 :
```typescript
// AVANT
import { winDevColors } from '@theme/windev-theme'
// APRÈS
import { appColors } from '@theme/windev-theme'
```

- [ ] **Étape 4 : Lancer les tests**
  ```
  npm test
  ```
  Attendu : tous les tests MdiWindow passent

- [ ] **Étape 5 : Commit**
  ```
  git add src/renderer/src/components/shell/MdiWindow.tsx src/renderer/src/components/shell/MdiWindow.test.tsx
  git commit -m "[Plan 2] MdiWindow — barre de titre bleu marine"
  ```

---

## Tâche 4 : StatusBar — fond bleu marine

**Fichiers concernés :**
- Modifier : `src/renderer/src/components/shell/StatusBar.tsx` lignes 31–50
- Modifier : `src/renderer/src/components/shell/StatusBar.test.tsx`

- [ ] **Étape 1 : Mettre à jour le test StatusBar**

```typescript
// src/renderer/src/components/shell/StatusBar.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBar from './StatusBar'

describe('StatusBar', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('affiche le mode Client/Serveur', () => {
    render(<StatusBar nbVehiculesAujourdhui={0} />)
    expect(screen.getByText(/Mode Client\/Serveur/i)).toBeInTheDocument()
  })

  it('affiche le nombre de véhicules passé en prop', () => {
    render(<StatusBar nbVehiculesAujourdhui={42} />)
    expect(screen.getByText(/42/)).toBeInTheDocument()
  })

  it('a un fond bleu marine', () => {
    const { container } = render(<StatusBar nbVehiculesAujourdhui={0} />)
    const bar = container.firstChild as HTMLElement
    expect(bar.style.background).toBe('#1B3A6B')
  })
})
```

- [ ] **Étape 2 : Lancer les tests pour vérifier l'échec**
  ```
  npm test
  ```
  Attendu : le test "fond bleu marine" échoue

- [ ] **Étape 3 : Modifier `StatusBar.tsx`**

Remplacer l'import et les tokens de couleur :
```typescript
// AVANT (ligne 2)
import { winDevColors } from '@theme/windev-theme'
// APRÈS
import { appColors } from '@theme/windev-theme'
```

Remplacer le style du conteneur (lignes 31–40) :
```typescript
// AVANT
background: winDevColors.statusBarBg,
borderTop: '1px solid #C0BCA8',
color: winDevColors.statusBarText,
// APRÈS
background: appColors.statusBarBg,
borderTop: `1px solid ${appColors.statusBarBorder}`,
color: appColors.statusBarText,
```

Remplacer les bordures séparateur (lignes 42 et 44) :
```typescript
// AVANT
borderRight: '1px solid #C0BCA8'
// APRÈS (les deux occurrences)
borderRight: `1px solid ${appColors.statusBarBorder}`
```

- [ ] **Étape 4 : Lancer les tests**
  ```
  npm test
  ```
  Attendu : tous les tests StatusBar passent

- [ ] **Étape 5 : Commit**
  ```
  git add src/renderer/src/components/shell/StatusBar.tsx src/renderer/src/components/shell/StatusBar.test.tsx
  git commit -m "[Plan 2] StatusBar — fond bleu marine"
  ```

---

## Tâche 5 : MenuBar — tokens couleur bleus

**Fichiers concernés :**
- Modifier : `src/renderer/src/components/shell/MenuBar.tsx` lignes 1–10, 75–104
- Modifier : `src/renderer/src/components/shell/MenuBar.test.tsx`

- [ ] **Étape 1 : Mettre à jour le test MenuBar**

```typescript
// src/renderer/src/components/shell/MenuBar.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigProvider } from 'antd'
import MenuBar from './MenuBar'
import { appAntdTheme } from '@theme/windev-theme'

function wrap(ui: JSX.Element): JSX.Element {
  return <ConfigProvider theme={appAntdTheme}>{ui}</ConfigProvider>
}

describe('MenuBar', () => {
  it('affiche le titre et les 6 menus principaux', () => {
    render(wrap(<MenuBar utilisateurLogin="awute" onMenuItemClick={() => {}} />))
    expect(screen.getByText('STCA : Enregistrement des Véhicules')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Fichier' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Enregistrements des véhicules' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Analyse' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Assurances' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Outils+Config.' })).toBeInTheDocument()
  })

  it('affiche le login utilisateur dans le chrome', () => {
    render(wrap(<MenuBar utilisateurLogin="awute" onMenuItemClick={() => {}} />))
    expect(screen.getByText(/utilisateur connecté : awute/)).toBeInTheDocument()
  })

  it('appelle onMenuItemClick avec la bonne clé au clic sous-menu', async () => {
    const spy = vi.fn()
    render(wrap(<MenuBar utilisateurLogin="awute" onMenuItemClick={spy} />))
    const user = userEvent.setup()
    await user.click(screen.getByRole('menuitem', { name: 'Fichier' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Marques et modèles de véhicules' }))
    expect(spy).toHaveBeenCalledWith('fichier.marques')
  })
})
```

- [ ] **Étape 2 : Lancer les tests pour vérifier qu'ils passent déjà** (les tests ne testent pas les couleurs)
  ```
  npm test
  ```
  Attendu : tests MenuBar passent déjà (la mise à jour est pour la cohérence avec les nouveaux exports)

- [ ] **Étape 3 : Modifier `MenuBar.tsx`** — mettre à jour import et tokens

Remplacer l'import (ligne 2) :
```typescript
// AVANT
import { winDevColors } from '@theme/windev-theme'
// APRÈS
import { appColors } from '@theme/windev-theme'
```

Mettre à jour le style du chrome (lignes 76–88) :
```typescript
style={{
  height: 30,
  background: appColors.windowChromeBg,
  borderBottom: '1px solid #D4D4D4',
  display: 'flex',
  alignItems: 'center',
  padding: '0 10px',
  fontSize: 12,
  color: appColors.windowChromeText,
  gap: 24
}}
```

Mettre à jour le style du `Menu` (lignes 94–104) :
```typescript
style={{
  background: appColors.menuBarBg,
  borderBottom: '1px solid #D4D4D4',
  color: appColors.menuBarText,
  fontSize: 13,
  lineHeight: '32px'
}}
```

- [ ] **Étape 4 : Lancer les tests**
  ```
  npm test
  ```
  Attendu : tous les tests passent

- [ ] **Étape 5 : Commit**
  ```
  git add src/renderer/src/components/shell/MenuBar.tsx src/renderer/src/components/shell/MenuBar.test.tsx
  git commit -m "[Plan 2] MenuBar — tokens couleur bleu professionnel"
  ```

---

## Tâche 6 : MainScreen — layout sidebar + zone MDI

**Fichiers concernés :**
- Modifier : `src/renderer/src/windows/MainScreen.tsx` (réécriture complète)
- Modifier : `src/renderer/src/windows/MainScreen.test.tsx`

- [ ] **Étape 1 : Mettre à jour les tests MainScreen**

```typescript
// src/renderer/src/windows/MainScreen.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigProvider } from 'antd'
import MainScreen from './MainScreen'
import { useWindowStore } from '@store/windowStore'
import { appAntdTheme } from '@theme/windev-theme'

function renderWithTheme(ui: JSX.Element): ReturnType<typeof render> {
  return render(<ConfigProvider theme={appAntdTheme}>{ui}</ConfigProvider>)
}

describe('MainScreen', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: {} })
  })

  it('affiche la barre de menus, la sidebar et la barre de statut', () => {
    renderWithTheme(<MainScreen utilisateurLogin="awute" />)
    expect(screen.getByText('STCA : Enregistrement des Véhicules')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enregistrement/i })).toBeInTheDocument()
    expect(screen.getByText(/Mode Client\/Serveur/i)).toBeInTheDocument()
  })

  it('ouvre une fenêtre MDI au clic sur un bouton sidebar', async () => {
    renderWithTheme(<MainScreen utilisateurLogin="awute" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /recherche immat/i }))

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

- [ ] **Étape 2 : Lancer les tests pour vérifier l'échec**
  ```
  npm test
  ```
  Attendu : le test "bouton sidebar" échoue (MainScreen utilise encore NavigationWheel)

- [ ] **Étape 3 : Réécrire `MainScreen.tsx`**

```typescript
// src/renderer/src/windows/MainScreen.tsx
import { appColors } from '@theme/windev-theme'
import { useWindowStore } from '@store/windowStore'
import MenuBar from '@components/shell/MenuBar'
import StatusBar from '@components/shell/StatusBar'
import NavSidebar, { type SidebarItem } from '@components/shell/NavSidebar'
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

  const handleSidebarSelect = (id: SidebarItem['id']): void => openById(id)

  const handleMenuItemClick = (key: string): void => {
    if (WINDOW_REGISTRY[key]) openById(key)
  }

  const openWindowIds = Object.keys(windows).filter(id => windows[id].isOpen)

  const lastOpenId = openWindowIds.length > 0
    ? openWindowIds.reduce((a, b) => windows[a].zIndex > windows[b].zIndex ? a : b)
    : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <MenuBar utilisateurLogin={utilisateurLogin} onMenuItemClick={handleMenuItemClick} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavSidebar onSelect={handleSidebarSelect} activeId={lastOpenId} />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: appColors.desktopBg }}>
          {openWindowIds.map(id => (
            <MdiWindow key={id} id={id}>
              <p style={{ fontSize: 13, color: '#555' }}>
                {`Contenu à venir — fenêtre "${windows[id].title}" sera développée dans un plan ultérieur.`}
              </p>
            </MdiWindow>
          ))}
        </div>
      </div>

      <StatusBar nbVehiculesAujourdhui={0} />
    </div>
  )
}
```

- [ ] **Étape 4 : Lancer les tests**
  ```
  npm test
  ```
  Attendu : tous les tests MainScreen passent

- [ ] **Étape 5 : Commit**
  ```
  git add src/renderer/src/windows/MainScreen.tsx src/renderer/src/windows/MainScreen.test.tsx
  git commit -m "[Plan 2] MainScreen — layout sidebar gauche + zone MDI (remplace roue centrée)"
  ```

---

## Tâche 7 : LoginPage — redesign bleu professionnel

**Fichiers concernés :**
- Modifier : `src/renderer/src/pages/LoginPage.tsx` (réécriture complète du rendu)

> Note : pas de test unitaire pour LoginPage (composant de page avec navigation — couvert par tests e2e futurs). Les tests existants suffisent pour vérifier la non-régression de la logique auth.

- [ ] **Étape 1 : Réécrire `LoginPage.tsx`**

```typescript
// src/renderer/src/pages/LoginPage.tsx
import { useState } from 'react'
import { Input, Button } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { appColors } from '@theme/windev-theme'

export default function LoginPage(): JSX.Element {
  const [username, setUsername] = useState('awute')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const login    = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleValider = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 400))
      if (username === 'awute' && password === 'Awmax') {
        login({ id: 1, login: 'awute', nom: 'Awute Maxime', role: 'admin' }, 'mock-token')
        navigate('/')
      } else {
        setError("Nom d'utilisateur ou mot de passe incorrect\n(respectez les minuscules / majuscules)")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F2F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 8,
        width: 420,
        boxShadow: '0 4px 24px rgba(27,58,107,0.15)',
        overflow: 'hidden',
        border: '1px solid #DBEAFE',
      }}>
        {/* En-tête */}
        <div style={{
          background: appColors.primaryBlue,
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 40, height: 40,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LockOutlined style={{ color: '#FFFFFF', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>
              Identification de l'utilisateur
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
              STCA — Enregistrement des Véhicules
            </div>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px 28px 20px' }}>
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 4,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 12,
              color: '#991B1B',
              whiteSpace: 'pre-line',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <label style={{ width: 120, fontSize: 13, color: '#374151', textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
              Nom d'utilisateur :
            </label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <label style={{ width: 120, fontSize: 13, color: '#374151', textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
              Mot de passe :
            </label>
            <Input.Password
              value={password}
              onChange={e => setPassword(e.target.value)}
              onPressEnter={handleValider}
              prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
              style={{ flex: 1 }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button
              onClick={() => { setPassword(''); setError(null) }}
              style={{ color: '#6B7280', borderColor: '#D1D5DB' }}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              onClick={handleValider}
              loading={loading}
              icon={<span style={{ marginRight: 4 }}>✓</span>}
            >
              Valider
            </Button>
          </div>
        </div>

        {/* Bande drapeau Togo */}
        <div style={{ height: 4, display: 'flex' }}>
          <div style={{ flex: 1, background: '#006A4E' }} />
          <div style={{ flex: 1, background: '#FFDF00' }} />
          <div style={{ flex: 1, background: '#D21034' }} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Lancer tous les tests pour vérifier la non-régression**
  ```
  npm test
  ```
  Attendu : tous les tests de la suite passent (LoginPage n'a pas de test unitaire)

- [ ] **Étape 3 : Commit**
  ```
  git add src/renderer/src/pages/LoginPage.tsx
  git commit -m "[Plan 2] LoginPage — redesign bleu professionnel (fond gris clair, header bleu marine)"
  ```

---

## Récapitulatif des commits attendus

| # | Commit | Fichiers |
|---|--------|---------|
| 1 | `[Plan 2] Thème bleu professionnel` | `windev-theme.ts`, `windev-theme.test.ts` |
| 2 | `[Plan 2] NavSidebar` | `NavSidebar.tsx`, `NavSidebar.test.tsx`, suppression `NavigationWheel.*` |
| 3 | `[Plan 2] MdiWindow barre bleue` | `MdiWindow.tsx`, `MdiWindow.test.tsx` |
| 4 | `[Plan 2] StatusBar fond bleu` | `StatusBar.tsx`, `StatusBar.test.tsx` |
| 5 | `[Plan 2] MenuBar tokens bleus` | `MenuBar.tsx`, `MenuBar.test.tsx` |
| 6 | `[Plan 2] MainScreen layout sidebar` | `MainScreen.tsx`, `MainScreen.test.tsx` |
| 7 | `[Plan 2] LoginPage redesign bleu` | `LoginPage.tsx` |

---

## Auto-évaluation

1. **Couverture** ✅ — chaque fichier listé en "Ce qui CHANGE" a une tâche dédiée
2. **Placeholders** ✅ — zéro TODO, tout le code est fourni intégralement
3. **Cohérence** ✅ — `appColors` / `appAntdTheme` utilisés partout, alias `winDevColors` conservé pour compatibilité
