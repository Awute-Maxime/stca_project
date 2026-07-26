import { useState, useEffect } from 'react'
import { electronApi, type DbArchive, type DbEnregistrement } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVES — MIGRÉ EN BASE (Phase 3, 26/07/2026).
// Dans la base, l'archivage n'est PAS une table séparée : c'est le champ
// `dateArchivage` (nul = actif, rempli = archivé). Ce store expose donc les
// archives « à la demande » : un cache des plus récentes (pour l'affichage) +
// des opérations en base (archiver / rappeler / purger) + une recherche.
// Synchro multi-fenêtres via db:changed('archives').
// ─────────────────────────────────────────────────────────────────────────────

export type VehiculeArchive = DbArchive

let cache: VehiculeArchive[] = []
const abonnes = new Set<() => void>()
let initialise = false

async function rechargerCache(): Promise<void> {
  const r = await electronApi.dbArchivesList()
  if (r.ok && r.items) {
    cache = r.items
    abonnes.forEach(fn => fn())
  } else {
    console.error('[archivesStore] lecture base échouée :', r.error)
  }
}

function assurerInit(): void {
  if (initialise) return
  initialise = true
  void rechargerCache()
  electronApi.onDbChanged(p => { if (p.domaine === 'archives') void rechargerCache() })
}
assurerInit()

/** Archives récentes (cache, les plus récemment archivées d'abord — plafonné). */
export function getAllArchives(): VehiculeArchive[] {
  assurerInit()
  return cache
}

/** Enregistrements ACTIFS jusqu'à la date limite incluse (aperçu avant archivage). */
export async function vehiculesArchivables(dateLimite: string): Promise<DbEnregistrement[]> {
  const r = await electronApi.dbArchivesArchivables(dateLimite)
  return r.ok && r.items ? r.items : []
}

/** Archive tous les actifs jusqu'à la date limite incluse. Retourne le nombre. */
export async function archiverJusquAu(dateLimite: string, par: string): Promise<number> {
  const r = await electronApi.dbArchivesArchiver(dateLimite, par)
  return r.ok ? (r.count ?? 0) : 0
}

/** Rappelle des archives (par réf) : retour dans la base active. Retourne le nombre. */
export async function rappelerArchives(refs: string[]): Promise<number> {
  const r = await electronApi.dbArchivesRappeler(refs)
  return r.ok ? (r.count ?? 0) : 0
}

/** Purge définitive d'archives (par réf) — irréversible. Retourne le nombre. */
export async function purgerArchives(refs: string[]): Promise<number> {
  const r = await electronApi.dbArchivesPurger(refs)
  return r.ok ? (r.count ?? 0) : 0
}

/** Recherche dans les archives (immat, châssis ou n° de référence). */
export async function rechercherArchive(query: string): Promise<VehiculeArchive[]> {
  const r = await electronApi.dbArchivesRechercher(query)
  return r.ok && r.items ? r.items : []
}

/** Hook React : archives récentes, synchronisées entre toutes les fenêtres. */
export function useArchives(): VehiculeArchive[] {
  const [liste, setListe] = useState<VehiculeArchive[]>(cache)

  useEffect(() => {
    assurerInit()
    const fn = (): void => setListe(cache)
    abonnes.add(fn)
    fn()
    void rechargerCache()
    return () => { abonnes.delete(fn) }
  }, [])

  return liste
}
