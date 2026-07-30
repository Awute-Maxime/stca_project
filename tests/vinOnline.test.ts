import { describe, it, expect } from 'vitest'
import { mapNhtsaCategorie } from '../src/main/vinOnline'
describe('mapNhtsaCategorie', () => {
  it('PASSENGER CAR → Voiture', () => expect(mapNhtsaCategorie('PASSENGER CAR', '')).toBe('Voiture'))
  it('TRUCK → Camion', () => expect(mapNhtsaCategorie('TRUCK', '')).toBe('Camion'))
  it('MPV → Voiture', () => expect(mapNhtsaCategorie('MULTIPURPOSE PASSENGER VEHICLE (MPV)', '')).toBe('Voiture'))
  it('BUS → Autre', () => expect(mapNhtsaCategorie('BUS', '')).toBe('Autre'))
  it('vide + BodyClass Pickup → Camion', () => expect(mapNhtsaCategorie('', 'Pickup')).toBe('Camion'))
  it('inconnu total → null', () => expect(mapNhtsaCategorie('', '')).toBeNull())
})
