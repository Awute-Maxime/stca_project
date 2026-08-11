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
