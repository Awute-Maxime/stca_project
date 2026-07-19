import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import type { MockVehicule } from './vehicules'
import { getAllVehicules, restaurerVehicule, removeVehicule } from './vehiculesStore'

// ─────────────────────────────────────────────────────────────────────────────
// Store des ARCHIVES (menu Outils+Config. → Archivage) — même modèle que
// vehiculesStore : persisté dans localStorage (partagé entre toutes les
// BrowserWindows), synchronisé via l'event `storage` + un CustomEvent local.
//
// L'archivage ALLÈGE la base active : les enregistrements de la période
// choisie sont RETIRÉS des véhicules actifs et conservés ici, intacts.
// Ils restent consultables et peuvent être RAPPELÉS (retour dans la base
// active) à tout moment.
// ─────────────────────────────────────────────────────────────────────────────

export interface VehiculeArchive extends MockVehicule {
  dateArchivage: string // YYYY-MM-DD
  archivePar: string    // login de l'administrateur qui a lancé l'archivage
}

const LS_KEY = 'tcit_archives'
const LOCAL_EVENT = 'tcit:archives-changed'

function loadArchives(): VehiculeArchive[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as VehiculeArchive[]
  } catch {
    return []
  }
}

function saveArchives(liste: VehiculeArchive[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(liste))
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

/** Toutes les archives, les plus récemment archivées d'abord. */
export function getAllArchives(): VehiculeArchive[] {
  return loadArchives()
}

/** Véhicules actifs enregistrés jusqu'à la date limite incluse (aperçu avant archivage). */
export function vehiculesArchivables(dateLimite: string): MockVehicule[] {
  const limite = dayjs(dateLimite).endOf('day')
  return getAllVehicules().filter(v => dayjs(v.date).isBefore(limite))
}

/**
 * Archive tous les enregistrements actifs jusqu'à la date limite incluse :
 * retirés de la base active, conservés dans les archives. Retourne le nombre.
 */
export function archiverJusquAu(dateLimite: string, par: string): number {
  const cibles = vehiculesArchivables(dateLimite)
  if (cibles.length === 0) return 0
  const dateArchivage = dayjs().format('YYYY-MM-DD')
  const archives = loadArchives()
  for (const v of cibles) {
    archives.unshift({ ...v, dateArchivage, archivePar: par })
    removeVehicule(v.ref)
  }
  saveArchives(archives)
  return cibles.length
}

/**
 * Rappelle des archives (par réf) : retour dans la base active, retrait des
 * archives. Retourne le nombre rappelé.
 */
export function rappelerArchives(refs: string[]): number {
  const archives = loadArchives()
  const rappelees = archives.filter(a => refs.includes(a.ref))
  for (const a of rappelees) {
    const { dateArchivage: _da, archivePar: _ap, ...vehicule } = a
    restaurerVehicule(vehicule)
  }
  saveArchives(archives.filter(a => !refs.includes(a.ref)))
  return rappelees.length
}

/** Purge définitive d'archives (par réf) — irréversible. Retourne le nombre. */
export function purgerArchives(refs: string[]): number {
  const archives = loadArchives()
  const restantes = archives.filter(a => !refs.includes(a.ref))
  const nb = archives.length - restantes.length
  if (nb > 0) saveArchives(restantes)
  return nb
}

/** Hook React : archives synchronisées entre toutes les fenêtres. */
export function useArchives(): VehiculeArchive[] {
  const [liste, setListe] = useState<VehiculeArchive[]>(getAllArchives)

  useEffect(() => {
    const refresh = (): void => setListe(getAllArchives())
    const onStorage = (e: StorageEvent): void => {
      if (e.key === LS_KEY) refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(LOCAL_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(LOCAL_EVENT, refresh)
    }
  }, [])

  return liste
}
