import { describe, it, expect } from 'vitest'
import { decoderVin, choisirAnnee, estAmeriqueNord, anneesCandidates, nettoyerLibelle, nettoyerCarrosserie } from './vinDecoder'

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

  it('VIN nord-américain : année-modèle décodée depuis la seule position 10', () => {
    // Honda US — pos.10='3', pos.7='2' (chiffre) → cycle ancien → 2003
    const r = decoderVin('1HGCM82633A004352')
    expect(r.annee).toBe('2003')
    expect(r.anneeSource).toBe('position10')
  })

  it('VIN hors Amérique du Nord, décodage synchrone (sans index) : année honnêtement inconnue', () => {
    // MAN (Allemagne) — non-NA ; decoderVin() n'a aucun historique de signature
    // à ce stade (l'index est consulté à part, en async) → pas de devinette.
    const r = decoderVin('WMA06XZZ7CM123456')
    expect(r.annee).toBe('—')
    expect(r.anneeSource).toBe('aucune')
  })

  it('catégorie « à confirmer » (null) pour un constructeur mixte (Mercedes WDB)', () => {
    const r = decoderVin('WDB1234567A123456')
    expect(r.constructeur).toContain('Mercedes')
    expect(r.categorie).toBeNull()
  })
})

describe('choisirAnnee — règle NA/signature (recette mesurée)', () => {
  it('Amérique du Nord (WMI 1-5) → position 10 seule, quel que soit l\'historique', () => {
    expect(choisirAnnee('1HGCM82633A004352', [])).toEqual({ annee: '2003', source: 'position10' })
  })

  it('hors NA, sans historique de signature → aucune (honnête, pas de devinette)', () => {
    expect(choisirAnnee('WMA06XZZ7CM123456', [])).toEqual({ annee: '—', source: 'aucune' })
  })

  it('hors NA avec historique, position 10 non décodable (code « 0 ») → médiane pondérée', () => {
    // Toyota Avensis UK réel (SB1EA56L…) — pos.10='0', absente des tables année.
    const hist: Array<[number, number]> = [[2005, 2], [2006, 2], [2007, 1], [2008, 1]]
    const r = choisirAnnee('SB1EA56L60E0E0356', hist)
    expect(r.source).toBe('signature')
    expect(r.annee).toBe('2006') // aplati [2005,2005,2006,2006,2007,2008] → index 3
  })

  it('hors NA, position 10 dans la plage de l\'historique → position 10 retenue (désambiguïsation)', () => {
    // Même VIN avec pos.10='6' → candidats [2006, 2036]. Historique 2005-2008 :
    // seul 2006 tombe dans la plage → préféré à la pure médiane (2008 ici).
    const hist: Array<[number, number]> = [[2005, 3], [2008, 3]] // médiane pure = 2008
    const r = choisirAnnee('SB1EA56L66E0E0356', hist)
    expect(r.source).toBe('position10')
    expect(r.annee).toBe('2006')
  })
})

describe('estAmeriqueNord / anneesCandidates', () => {
  it('reconnaît un WMI nord-américain (1re lettre 1-5)', () => {
    expect(estAmeriqueNord('1HGCM82633A004352')).toBe(true)
  })
  it('rejette un WMI hors Amérique du Nord', () => {
    expect(estAmeriqueNord('SB1EA56L60E0E0356')).toBe(false)
    expect(estAmeriqueNord('WMA06XZZ7CM123456')).toBe(false)
  })
  it('donne les deux cycles possibles (ancien + récent) pour un code décodable', () => {
    expect(anneesCandidates('C')).toEqual([1982, 2012])
  })
  it('renvoie une liste vide pour un code non décodable', () => {
    expect(anneesCandidates('0')).toEqual([])
  })
})

describe('nettoyerLibelle — nettoyage des libellés bruités du corpus (index seed)', () => {
  it('« MARQUE - MODELE gen-range >> MODELE \'YY » (Avensis, exemple réel du seed)', () => {
    expect(nettoyerLibelle("TOYOTA - AVENSIS KOMBI 03-06 >> AVENSIS '03"))
      .toEqual({ marque: 'TOYOTA', modele: 'AVENSIS' })
  })
  it('même forme sans suffixe \'YY après « >> » (Peugeot 607, exemple réel du seed)', () => {
    expect(nettoyerLibelle('PEUGEOT - 607 00-04 >> 607'))
      .toEqual({ marque: 'PEUGEOT', modele: '607' })
  })
  it('modèle à espace, sans suffixe \'YY (Golf IV, exemple réel du seed)', () => {
    expect(nettoyerLibelle('VOLKSWAGEN - GOLF IV 97-03 >> GOLF IV'))
      .toEqual({ marque: 'VOLKSWAGEN', modele: 'GOLF IV' })
  })
  it('libellé sans « - » ni « >> » : pas de marque isolée, modèle = libellé trimé', () => {
    expect(nettoyerLibelle('TOYOTA CAMRY'))
      .toEqual({ marque: '', modele: 'TOYOTA CAMRY' })
  })
})

describe('nettoyerCarrosserie — enlève le préfixe « Voit. » du libellé de carrosserie', () => {
  it('« Voit. Hatchback 5 p. » → « Hatchback 5 p. »', () => {
    expect(nettoyerCarrosserie('Voit. Hatchback 5 p.')).toBe('Hatchback 5 p.')
  })
  it('garde « Camion Tracteur » tel quel (pas de préfixe Voit.)', () => {
    expect(nettoyerCarrosserie('Camion Tracteur')).toBe('Camion Tracteur')
  })
  it('chaîne vide → « — »', () => {
    expect(nettoyerCarrosserie('')).toBe('—')
  })
})
