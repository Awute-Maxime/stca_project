import { describe, it, expect } from 'vitest'
import { mapNhtsaCategorie, construireMotorisation } from '../src/main/vinOnline'
describe('mapNhtsaCategorie', () => {
  it('PASSENGER CAR → Voiture', () => expect(mapNhtsaCategorie('PASSENGER CAR', '')).toBe('Voiture'))
  it('TRUCK → Camion', () => expect(mapNhtsaCategorie('TRUCK', '')).toBe('Camion'))
  it('MPV → Voiture', () => expect(mapNhtsaCategorie('MULTIPURPOSE PASSENGER VEHICLE (MPV)', '')).toBe('Voiture'))
  it('BUS → Autre', () => expect(mapNhtsaCategorie('BUS', '')).toBe('Autre'))
  it('vide + BodyClass Pickup → Camion', () => expect(mapNhtsaCategorie('', 'Pickup')).toBe('Camion'))
  it('inconnu total → null', () => expect(mapNhtsaCategorie('', '')).toBeNull())
})

describe('construireMotorisation', () => {
  it('cylindrée + cylindres → "<L>L <cyl> cyl."', () =>
    expect(construireMotorisation('2.2', '4', '')).toBe('2.2L 4 cyl.'))
  it('cylindrée arrondie à 1 décimale', () =>
    expect(construireMotorisation('1.998', '4', '')).toBe('2L 4 cyl.'))
  it('cylindres seuls → "<cyl> cyl."', () =>
    expect(construireMotorisation('', '6', '')).toBe('6 cyl.'))
  it('ni cylindrée ni cylindres, Engine Model présent → moteur brut', () =>
    expect(construireMotorisation('', '', '2ZR-FE')).toBe('2ZR-FE'))
  it('tout manquant → chaîne vide', () =>
    expect(construireMotorisation('', '', '')).toBe(''))
})
