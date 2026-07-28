// STCA-Electron/tests/stcaMShared.test.ts
import { describe, it, expect } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { upsertEnregistrement, lireBase } from '../src/main/stcaMShared'

const rec = { numRef: '610300', numTri: '2500', immat: 'T7500', codeTransit: 'CK', nomParc: 'UNIPARK',
  maisonTransit: 'X-TRA', nomPrenom: 'TEST USER', adresse: 'Lomé/TG', marqueModele: 'TOYOTA',
  chassis: 'ZZZ00000000000001', dateEnreg: '2026-07-28', flagSortie: false, dateSortie: null }

describe('write-through STCA M', () => {
  it('upsert ajoute puis met à jour par numRef (pas de doublon)', () => {
    const chemin = join(mkdtempSync(join(tmpdir(), 'stcam-')), 'stca-m.json')
    upsertEnregistrement(chemin, rec)
    upsertEnregistrement(chemin, { ...rec, nomPrenom: 'MODIFIÉ' })
    const base = lireBase(chemin)
    const hits = base.enregistrements.filter(v => v.numRef === '610300')
    expect(hits).toHaveLength(1)
    expect(hits[0].nomPrenom).toBe('MODIFIÉ')
  })
})
