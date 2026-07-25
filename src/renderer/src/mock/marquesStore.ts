import { useState, useEffect } from 'react'
import { electronApi } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// Marques / modèles — MIGRÉ EN BASE (Phase 3, 25/07/2026).
// La table `marque_modele` (← TYPEVEH) est la source unique ; le Fichier Marques
// et le modal « Marque - Modèle » de l'Enregistrement lisent la même liste.
// Le localStorage n'est plus utilisé pour ce domaine.
//
// Modèle asynchrone : hook réactif + rechargement sur `db:changed('marques')`.
// add/rename/remove passent par IPC et retournent un message d'erreur (ou null).
// ─────────────────────────────────────────────────────────────────────────────

export interface Marque {
  id: number
  nom: string
}

let cache: Marque[] = []

async function recharger(setter?: (l: Marque[]) => void): Promise<void> {
  const r = await electronApi.dbMarquesList()
  if (r.ok && r.items) {
    cache = r.items
    if (setter) setter(cache)
  } else {
    console.error('[marquesStore] lecture base échouée :', r.error)
  }
}

export function getAllMarques(): Marque[] {
  return cache
}

/** Ajoute une marque. Retourne un message d'erreur (doublon…), ou null si OK. */
export async function addMarque(nom: string): Promise<string | null> {
  const r = await electronApi.dbMarqueAdd(nom)
  if (!r.ok) return r.error ?? 'Ajout échoué.'
  await recharger()
  return null
}

/** Renomme une marque. Retourne un message d'erreur, ou null si OK. */
export async function renameMarque(id: number, nom: string): Promise<string | null> {
  const r = await electronApi.dbMarqueRename(id, nom)
  if (!r.ok) return r.error ?? 'Modification échouée.'
  await recharger()
  return null
}

/** Supprime une marque. Retourne un message d'erreur, ou null si OK. */
export async function removeMarque(id: number): Promise<string | null> {
  const r = await electronApi.dbMarqueRemove(id)
  if (!r.ok) return r.error ?? 'Suppression échouée.'
  await recharger()
  return null
}

/** Hook React : liste des marques, synchronisée entre toutes les fenêtres. */
export function useMarques(): Marque[] {
  const [list, setList] = useState<Marque[]>(cache)

  useEffect(() => {
    let vivant = true
    const rafraichir = (): void => { void recharger(l => { if (vivant) setList(l) }) }
    setList(cache)   // sert d'abord le cache courant
    rafraichir()     // puis recharge depuis la base
    const off = electronApi.onDbChanged(p => { if (p.domaine === 'marques') rafraichir() })
    return () => { vivant = false; off() }
  }, [])

  return list
}
