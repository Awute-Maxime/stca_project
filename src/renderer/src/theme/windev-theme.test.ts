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
