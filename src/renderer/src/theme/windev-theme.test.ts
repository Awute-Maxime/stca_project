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
