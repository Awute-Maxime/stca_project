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
