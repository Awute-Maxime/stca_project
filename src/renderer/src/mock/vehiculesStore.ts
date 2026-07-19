import { useState, useEffect } from 'react'
import { mockVehicules, type MockVehicule } from './vehicules'

// ─────────────────────────────────────────────────────────────────────────────
// Store véhicules partagé entre toutes les BrowserWindows.
// Équivalent du tableau global VEHICULES du prototype (une seule page),
// adapté au multi-fenêtres : les ajouts sont persistés dans localStorage
// (partagé par toutes les fenêtres Electron, même origine) et chaque fenêtre
// se synchronise via l'event `storage` (cross-fenêtres) + un CustomEvent
// local (la fenêtre émettrice ne reçoit pas son propre event storage).
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY     = 'tcit_vehicules_added'
const LS_UPDATED = 'tcit_vehicules_updated' // Record<ref, MockVehicule> — surcharges (modifs, y compris sur les mocks)
const LS_REMOVED = 'tcit_vehicules_removed' // refs supprimées (mocks inclus)
const LOCAL_EVENT = 'tcit:vehicules-changed'

function loadAdded(): MockVehicule[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as MockVehicule[]
  } catch {
    return []
  }
}

function loadUpdated(): Record<string, MockVehicule> {
  try {
    return JSON.parse(localStorage.getItem(LS_UPDATED) ?? '{}') as Record<string, MockVehicule>
  } catch {
    return {}
  }
}

function loadRemoved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_REMOVED) ?? '[]') as string[]
  } catch {
    return []
  }
}

function notifyChanged(): void {
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

/**
 * Tous les véhicules : ajouts récents d'abord (comme unshift du prototype),
 * puis les mocks — avec les modifications (surcharges par réf) appliquées et
 * les enregistrements supprimés retirés.
 */
export function getAllVehicules(): MockVehicule[] {
  const updated = loadUpdated()
  const removed = loadRemoved()
  return [...loadAdded(), ...mockVehicules]
    .filter(v => !removed.includes(v.ref))
    .map(v => updated[v.ref] ?? v)
}

/** Ajoute un véhicule et notifie toutes les fenêtres. */
export function addVehicule(v: MockVehicule): void {
  const added = loadAdded()
  added.unshift(v)
  localStorage.setItem(LS_KEY, JSON.stringify(added))
  notifyChanged()
}

/** Modifie un véhicule (par réf) et notifie toutes les fenêtres. */
export function updateVehicule(ref: string, changes: Partial<MockVehicule>): void {
  const current = getAllVehicules().find(v => v.ref === ref)
  if (!current) return
  const updated = loadUpdated()
  updated[ref] = { ...current, ...changes, ref } // la réf reste la clé stable
  localStorage.setItem(LS_UPDATED, JSON.stringify(updated))
  notifyChanged()
}

/**
 * Restaure un véhicule précédemment supprimé/archivé (retour à l'identique).
 * - réf marquée supprimée (mock de base) → on la démarque et on pose les
 *   données restaurées en surcharge (les modifs d'avant sont conservées) ;
 * - sinon → simple ajout.
 */
export function restaurerVehicule(v: MockVehicule): void {
  const removed = loadRemoved()
  if (removed.includes(v.ref)) {
    localStorage.setItem(LS_REMOVED, JSON.stringify(removed.filter(r => r !== v.ref)))
    const updated = loadUpdated()
    updated[v.ref] = v
    localStorage.setItem(LS_UPDATED, JSON.stringify(updated))
    notifyChanged()
  } else {
    addVehicule(v)
  }
}

/** Supprime un véhicule (par réf) et notifie toutes les fenêtres. */
export function removeVehicule(ref: string): void {
  // Ajout récent → on le retire directement de la liste des ajouts
  const added = loadAdded()
  const rest = added.filter(v => v.ref !== ref)
  if (rest.length !== added.length) {
    localStorage.setItem(LS_KEY, JSON.stringify(rest))
  } else {
    // Mock de base → on marque la réf comme supprimée
    const removed = loadRemoved()
    if (!removed.includes(ref)) {
      removed.push(ref)
      localStorage.setItem(LS_REMOVED, JSON.stringify(removed))
    }
  }
  // Purge la surcharge éventuelle
  const updated = loadUpdated()
  if (updated[ref]) {
    delete updated[ref]
    localStorage.setItem(LS_UPDATED, JSON.stringify(updated))
  }
  notifyChanged()
}

/** Prochaine référence (max + 1, format 6 chiffres — cohérent avec les mocks). */
export function nextRef(): string {
  const maxRef = getAllVehicules().reduce((m, v) => Math.max(m, parseInt(v.ref, 10) || 0), 0)
  return String(maxRef + 1).padStart(6, '0')
}

/** Prochain id numérique unique. */
export function nextId(): number {
  return getAllVehicules().reduce((m, v) => Math.max(m, v.id), 0) + 1
}

/** Nombre de véhicules déjà AJOUTÉS pour une destination (pour incrémenter le N° IMMAT). */
export function countAddedForDest(code: string): number {
  return loadAdded().filter(v => v.destination === code).length
}

/**
 * Hook React : liste des véhicules, re-rendue automatiquement quand un
 * enregistrement est ajouté — dans cette fenêtre (CustomEvent) ou dans
 * une autre BrowserWindow (event storage).
 */
export function useVehicules(): MockVehicule[] {
  const [list, setList] = useState<MockVehicule[]>(getAllVehicules)

  useEffect(() => {
    const refresh = (): void => setList(getAllVehicules())
    const onStorage = (e: StorageEvent): void => {
      if (e.key === LS_KEY || e.key === LS_UPDATED || e.key === LS_REMOVED) refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(LOCAL_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(LOCAL_EVENT, refresh)
    }
  }, [])

  return list
}
