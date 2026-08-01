import { describe, it, expect } from 'vitest'
import { signatureVin, signature6, libelleAcceptable, medianeAnnee } from './vinIndex'

// ─────────────────────────────────────────────────────────────────────────────
// Tests des helpers PURS de vinIndex.ts uniquement (aucun accès DB — apprendre/
// chercher/importerSeed/semer sont couverts par le smoke E2E, cf. plan Phase 2).
// ─────────────────────────────────────────────────────────────────────────────

describe('signatureVin / signature6', () => {
  it('garde les 8 premiers caractères (majuscules, sans espaces)', () => {
    expect(signatureVin('SB1EA56L60E0E0356')).toBe('SB1EA56L')
  })

  it('garde les 6 premiers caractères', () => {
    expect(signature6('SB1EA56L60E0E0356')).toBe('SB1EA5')
  })

  it('met en majuscules et retire les espaces', () => {
    expect(signatureVin(' sb1 ea56l 60e0e0356')).toBe('SB1EA56L')
  })

  it('gère les entrées vides/absentes', () => {
    expect(signatureVin('')).toBe('')
    expect(signature6(undefined as unknown as string)).toBe('')
  })
})

describe('libelleAcceptable', () => {
  it('rejette la chaîne vide', () => {
    expect(libelleAcceptable('')).toBe(false)
  })

  it("rejette 'INCONNU' (insensible à la casse)", () => {
    expect(libelleAcceptable('INCONNU')).toBe(false)
    expect(libelleAcceptable('inconnu')).toBe(false)
  })

  it("rejette '...'", () => {
    expect(libelleAcceptable('...')).toBe(false)
  })

  it('rejette les libellés trop courts (< 2 caractères)', () => {
    expect(libelleAcceptable('A')).toBe(false)
  })

  it('rejette un libellé sans aucune lettre', () => {
    expect(libelleAcceptable('12345')).toBe(false)
  })

  it('accepte un libellé marque - modèle valide', () => {
    expect(libelleAcceptable('TOYOTA - RAV4')).toBe(true)
  })
})

describe('medianeAnnee', () => {
  it('calcule la médiane pondérée par le compte', () => {
    expect(medianeAnnee([[2014, 1], [2015, 3], [2016, 1]])).toBe(2015)
  })

  it('renvoie null pour un histogramme vide', () => {
    expect(medianeAnnee([])).toBeNull()
  })

  it('ignore les entrées à compte nul ou négatif', () => {
    expect(medianeAnnee([[2010, 0], [2015, 5]])).toBe(2015)
  })
})
