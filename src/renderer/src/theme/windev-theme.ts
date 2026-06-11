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
