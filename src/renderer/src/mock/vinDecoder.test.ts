import { describe, it, expect } from 'vitest'
import { decoderVin } from './vinDecoder'

describe('vinDecoder', () => {
  it('valide un VIN correct (chiffre de contrôle)', () => {
    // VIN canonique valide (Honda) — chiffre de contrôle « 3 » en position 9
    const r = decoderVin('1HGCM82633A004352')
    expect(r.valide).toBe(true)
    expect(r.raisonInvalide).toBeNull()
  })

  it('rejette un chiffre de contrôle incorrect', () => {
    const r = decoderVin('1HGCM82633A004353') // dernier chiffre modifié
    expect(r.valide).toBe(false)
    expect(r.raisonInvalide).toMatch(/contrôle/i)
  })

  it('rejette une longueur incorrecte', () => {
    expect(decoderVin('ABC123').valide).toBe(false)
    expect(decoderVin('ABC123').raisonInvalide).toMatch(/Longueur/)
  })

  it('rejette les caractères interdits I/O/Q', () => {
    const r = decoderVin('WMA06XZZ7CM12I456')
    expect(r.valide).toBe(false)
    expect(r.raisonInvalide).toMatch(/interdit/i)
  })

  it('suggère Camion (confiance élevée) pour un WMI poids lourd (MAN)', () => {
    const r = decoderVin('WMA06XZZ7CM123456')
    expect(r.constructeur).toContain('MAN')
    expect(r.pays).toBe('Allemagne')
    expect(r.categorie).toBe('Camion')
    expect(r.confiance).toBe('élevée')
  })

  it('décode l\'année-modèle (position 10)', () => {
    expect(decoderVin('WMA06XZZ7CM123456').annee).toBe('2012') // C = 2012
  })

  it('catégorie « à confirmer » (null) pour un constructeur mixte (Mercedes WDB)', () => {
    const r = decoderVin('WDB1234567A123456')
    expect(r.constructeur).toContain('Mercedes')
    expect(r.categorie).toBeNull()
  })
})
