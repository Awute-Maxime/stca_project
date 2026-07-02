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

const LS_KEY = 'tcit_vehicules_added'
const LOCAL_EVENT = 'tcit:vehicules-changed'

function loadAdded(): MockVehicule[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as MockVehicule[]
  } catch {
    return []
  }
}

/** Tous les véhicules : ajouts récents d'abord (comme unshift du prototype), puis les mocks. */
export function getAllVehicules(): MockVehicule[] {
  return [...loadAdded(), ...mockVehicules]
}

/** Ajoute un véhicule et notifie toutes les fenêtres. */
export function addVehicule(v: MockVehicule): void {
  const added = loadAdded()
  added.unshift(v)
  localStorage.setItem(LS_KEY, JSON.stringify(added))
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
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
      if (e.key === LS_KEY) refresh()
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
