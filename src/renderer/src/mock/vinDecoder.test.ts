import { describe, it, expect } from 'vitest'
import { decoderVin } from './vinDecoder'

describe('validation reformulée', () => {
  it('VIN nord-américain valide : structure OK + chiffre de contrôle OK/requis', () => {
    const r = decoderVin('1HGCM82633A004352') // Honda US, check digit valide
    expect(r.structureValide).toBe(true)
    expect(r.chiffreControleRequis).toBe(true)   // WMI commence par 1
    expect(r.chiffreControleOk).toBe(true)
    expect(r.source).toBe('local')
  })
  it('VIN hors NA (Europe) : structure OK, chiffre de contrôle NON requis même si non conforme', () => {
    const r = decoderVin('SB1EA56L60E0E0356') // Toyota UK
    expect(r.structureValide).toBe(true)
    expect(r.chiffreControleRequis).toBe(false)  // WMI commence par S
    expect(r.raisonInvalide).toBeNull()          // pas d'erreur bloquante
    expect(r.constructeur).toContain('Toyota')   // SB1 désormais reconnu
    expect(r.categorie).toBe('Voiture')
  })
  it('longueur incorrecte → structure invalide', () => {
    expect(decoderVin('TROPCOURT').structureValide).toBe(false)
  })
  it('caractère interdit I/O/Q → structure invalide', () => {
    expect(decoderVin('1HGCM8263IA004352').structureValide).toBe(false)
  })
  it('camion sûr (MAN WMA) → Camion élevée', () => {
    const r = decoderVin('WMA06XZZ7CM123456')
    expect(r.categorie).toBe('Camion'); expect(r.confiance).toBe('élevée')
  })
})

describe('vinDecoder', () => {
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
