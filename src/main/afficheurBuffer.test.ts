import { describe, it, expect } from 'vitest'
import { empiler, retirerAck, MAX_BUFFER } from './afficheurBuffer'
import type { EnregistrementMessage } from './protocoleAffichage'

const msg = (ref: string): EnregistrementMessage => ({
  type: 'enregistrement', reference: ref, immatriculation: 'TG WZ C ' + ref + ' KE',
  numeroTri: '', marqueModele: '', chassis: '', destination: 'KE',
  guichet: 'P', agent: 'awute', horodatage: ''
})

describe('afficheurBuffer', () => {
  it('empile à la suite', () => {
    let b: EnregistrementMessage[] = []
    b = empiler(b, msg('1'))
    b = empiler(b, msg('2'))
    expect(b.map(m => m.reference)).toEqual(['1', '2'])
  })

  it('dédoublonne par référence', () => {
    let b: EnregistrementMessage[] = []
    b = empiler(b, msg('1'))
    b = empiler(b, msg('1'))
    expect(b).toHaveLength(1)
  })

  it('plafonne à MAX_BUFFER en jetant les plus vieux', () => {
    let b: EnregistrementMessage[] = []
    for (let i = 0; i < MAX_BUFFER + 10; i++) b = empiler(b, msg(String(i)))
    expect(b).toHaveLength(MAX_BUFFER)
    expect(b[0].reference).toBe('10') // les 10 premiers ont été jetés
    expect(b[b.length - 1].reference).toBe(String(MAX_BUFFER + 9))
  })

  it('retire un message à l\'ack', () => {
    let b = empiler(empiler([], msg('1')), msg('2'))
    b = retirerAck(b, '1')
    expect(b.map(m => m.reference)).toEqual(['2'])
  })
})
