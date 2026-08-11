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
