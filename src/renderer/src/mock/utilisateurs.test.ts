import { describe, it, expect } from 'vitest'
import { mockUtilisateurs } from './utilisateurs'

describe('Données mock — utilisateurs', () => {
  it('contient les 18 comptes documentés dans la table Login', () => {
    expect(mockUtilisateurs).toHaveLength(18)
  })

  it('compte 9 administrateurs', () => {
    expect(mockUtilisateurs.filter(u => u.administrateur)).toHaveLength(9)
  })

  it('compte 4 comptes désactivés', () => {
    expect(mockUtilisateurs.filter(u => !u.compteActif)).toHaveLength(4)
  })

  it('contient le compte awute, administrateur et actif', () => {
    const awute = mockUtilisateurs.find(u => u.login === 'awute')
    expect(awute?.administrateur).toBe(true)
    expect(awute?.compteActif).toBe(true)
  })
})
