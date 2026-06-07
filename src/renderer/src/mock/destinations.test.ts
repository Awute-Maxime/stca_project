import { describe, it, expect } from 'vitest'
import { mockDestinations } from './destinations'

describe('Données mock — destinations', () => {
  it('contient les 10 destinations documentées dans PARAMDESTINATION', () => {
    expect(mockDestinations).toHaveLength(10)
  })

  it('chaque destination a un code, un nom, un tarif et une lettre', () => {
    for (const d of mockDestinations) {
      expect(d.code).toBeTruthy()
      expect(d.nom).toBeTruthy()
      expect(d.tarif).toBe(10000)
      expect(d.lettre).toMatch(/^[A-Z]$/)
    }
  })

  it('contient la destination Tohoum avec le code TO', () => {
    const tohoum = mockDestinations.find(d => d.code === 'TO')
    expect(tohoum?.nom).toBe('Tohoum')
    expect(tohoum?.numImmatActuel).toBe(7490)
  })
})
