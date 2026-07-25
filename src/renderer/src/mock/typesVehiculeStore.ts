import { useState, useEffect } from 'react'
import { electronApi } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// Types de Véhicule — PREMIER DOMAINE MIGRÉ EN BASE (Phase 3, 25/07/2026).
// La table `categorie_vehicule` (← CATVEH du vrai STCA : RANG + nom) est la
// source unique ; le localStorage n'est plus utilisé pour ce domaine.
//
// MODÈLE ASYNCHRONE (à répliquer pour chaque domaine migré) :
//   - cache module partagé + useTypesVehicule() : même API qu'avant pour les
//     consommateurs (le hook rend d'abord le cache, se rafraîchit en fond),
//   - écriture via IPC → le main écrit en base puis DIFFUSE `db:changed` à
//     toutes les fenêtres (remplace l'événement `storage` du localStorage),
//   - le hook s'abonne à `db:changed` et recharge quand son domaine change.
//
// La RÉCONCILIATION des tarifs assurance (1 ligne par catégorie) est faite dans
// le main (referentiels.ts, categoriesSaveAll → reconcilierTarifs), qui diffuse
// aussi `db:changed('assurances')`. Plus de dépendance vers assurancesStore ici.
// ─────────────────────────────────────────────────────────────────────────────

export interface TypeVehicule {
  id: number
  rang: number // ordre d'affichage dans les listes déroulantes (combos)
  nom: string  // « Nom ou type de véhicule »
}

// Défauts utilisés uniquement si la base est injoignable (repli d'affichage)
const DEFAUT: TypeVehicule[] = [
  { id: 1, rang: 1, nom: 'Voiture' },
  { id: 2, rang: 2, nom: 'Camion' },
  { id: 3, rang: 3, nom: 'Autre' },
]

// Cache module : dernier état connu, servi immédiatement aux nouveaux hooks
let cache: TypeVehicule[] | null = null

/** Lecture asynchrone depuis la base (met le cache à jour). */
export async function chargerTypesVehicule(): Promise<TypeVehicule[]> {
  const r = await electronApi.dbCategoriesList()
  if (r.ok && r.items) {
    cache = r.items
    return r.items
  }
  console.error('[typesVehiculeStore] lecture base échouée :', r.error)
  return cache ?? DEFAUT
}

/** Dernier état connu, sans attendre (peut être le repli au tout premier appel). */
export function typesVehiculeCache(): TypeVehicule[] {
  return cache ?? DEFAUT
}

/**
 * Écriture asynchrone : la base est mise à jour, puis le main diffuse
 * `db:changed` → toutes les fenêtres (y compris celle-ci) se rafraîchissent.
 * Retourne un message d'erreur, ou null si OK.
 */
export async function setTypesVehicule(types: TypeVehicule[]): Promise<string | null> {
  const ordonnes = [...types].sort((a, b) => a.rang - b.rang)
  const r = await electronApi.dbCategoriesSaveAll(ordonnes.map(t => ({ rang: t.rang, nom: t.nom })))
  if (!r.ok) return r.error ?? 'Écriture en base échouée.'
  cache = r.items ?? ordonnes
  // Le main réconcilie les tarifs assurance et diffuse db:changed('assurances').
  return null
}

/** Hook React : liste des types, synchronisée entre toutes les fenêtres. */
export function useTypesVehicule(): TypeVehicule[] {
  const [types, setTypes] = useState<TypeVehicule[]>(typesVehiculeCache)

  useEffect(() => {
    let vivant = true
    const recharger = (): void => {
      void chargerTypesVehicule().then(l => { if (vivant) setTypes(l) })
    }
    recharger() // chargement initial (ou rafraîchissement du cache)
    const off = electronApi.onDbChanged(p => {
      if (p.domaine === 'categories') recharger()
    })
    return () => { vivant = false; off() }
  }, [])

  return types
}
