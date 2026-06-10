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
      itemColor:         '#1B3A6B',
      itemHoverBg:       '#EEF2FF',
      itemSelectedBg:    '#DBEAFE',
      itemSelectedColor: '#1B3A6B',
    },
  },
}

// Alias compat
export const winDevAntdTheme = appAntdTheme
