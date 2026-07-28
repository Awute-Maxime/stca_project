// STCA-Electron/src/main/stcaMShared.ts
// Write-through ADDITIF vers la base STCA M partagée (lue par l'app Pointage).
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

export interface EnregistrementM {
  numRef: string; numTri: string; immat: string; codeTransit: string; nomParc: string
  maisonTransit: string; nomPrenom: string; adresse: string; marqueModele: string
  chassis: string; dateEnreg: string; flagSortie: boolean; dateSortie: string | null
}
export interface BaseM { version: number; enregistrements: EnregistrementM[] }

export function lireBase(chemin: string): BaseM {
  try {
    if (!existsSync(chemin)) return { version: 1, enregistrements: [] }
    const d = JSON.parse(readFileSync(chemin, 'utf-8')) as BaseM
    return d && Array.isArray(d.enregistrements) ? d : { version: 1, enregistrements: [] }
  } catch { return { version: 1, enregistrements: [] } }
}

export function upsertEnregistrement(chemin: string, rec: EnregistrementM): void {
  try {
    const base = lireBase(chemin)
    const i = base.enregistrements.findIndex(v => v.numRef === rec.numRef)
    if (i >= 0) base.enregistrements[i] = rec
    else base.enregistrements.unshift(rec)
    mkdirSync(dirname(chemin), { recursive: true })
    const tmp = chemin + '.tmp'
    writeFileSync(tmp, JSON.stringify(base, null, 2), 'utf-8')
    renameSync(tmp, chemin)
  } catch { /* best effort : ne bloque jamais la sauvegarde principale */ }
}
