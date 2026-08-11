import { theme as antdTheme, type ThemeConfig } from 'antd'

export const appColors = {
  // Chrome fenêtre principale
  windowChromeBg:   '#1B3A6B',
  windowChromeText: '#FFFFFF',

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

  // Alias de compatibilité (anciens tokens utilisés par les autres composants)
  primaryBlue:             '#1B3A6B',
  mdiTitleGradientStart:   '#1B3A6B',
  mdiTitleGradientEnd:     '#1B3A6B',
  formPanelBg:             '#FFFFFF',
} as const

// Alias compat pour fichiers non encore migrés
export const winDevColors = appColors

export const appAntdTheme: ThemeConfig = {
  token: {
    colorPrimary:        '#2563EB',
    colorLink:           '#2563EB',
    borderRadius:        8,
    borderRadiusLG:      10,
    borderRadiusSM:      6,
    fontFamily:          "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontSize:            13,
    controlHeight:       32,
    boxShadow:           '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
    boxShadowSecondary:  '0 4px 20px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)',
    colorBorderSecondary: '#E8EEF6',
    colorBgContainer:    '#FFFFFF',
    colorBgLayout:       '#F0F2F5',
  },
  components: {
    Button: { borderRadius: 8, controlHeight: 32, fontWeight: 600 },
    Input:  { borderRadius: 8, controlHeight: 32 },
    Select: { borderRadius: 8, controlHeight: 32 },
    Table:  {
      borderRadius: 8,
      headerBg: '#EEF2FF',
      headerColor: '#1B3A6B',
      headerSortActiveBg: '#DBEAFE',
      rowHoverBg: '#F8FAFF',
    },
    Card: {
      borderRadiusLG: 10,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    },
    Modal:  { borderRadiusLG: 12 },
    Tag:    { borderRadius: 6 },
    Menu: {
      itemColor:         '#1B3A6B',
      itemHoverBg:       '#EEF2FF',
      itemSelectedBg:    '#DBEAFE',
      itemSelectedColor: '#1B3A6B',
    },
  },
}

// Alias compat
export const winDevAntdTheme = appAntdTheme

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
