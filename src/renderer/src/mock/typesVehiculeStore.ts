import { useState, useEffect } from 'react'
import { electronApi } from '@api/electron'
import { getConfigAssurances, setConfigAssurances, type TarifAssurance } from './assurancesStore'

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
// PÉRIODE HYBRIDE : Config. Assurances est encore sur localStorage — la
// réconciliation des tarifs (1 ligne par type, ordre du rang) reste donc ici,
// côté renderer, jusqu'à la migration du domaine assurances.
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
  reconcilierAssurances(cache) // période hybride : assurances encore sur localStorage
  return null
}

// ── Lien SOURCE UNIQUE vers Config. Assurances (période hybride) ─────────────
// La liste des types pilote les catégories de tarifs : pour chaque assureur on
// garde une ligne de tarif par type, dans l'ordre du rang.
const TARIF_DEFAUT = { tarif: 13000, taxe: 679, commissionPct: 20 }

function reconcilierAssurances(types: TypeVehicule[]): void {
  const cfg = getConfigAssurances()
  let modifie = false

  const assureurs = cfg.assureurs.map(a => {
    const parNom = new Map(a.tarifs.map(t => [t.type.toLowerCase(), t] as const))
    const tarifs: TarifAssurance[] = types.map(t => {
      const exist = parNom.get(t.nom.toLowerCase())
      if (exist) return { ...exist, type: t.nom } // resync du libellé
      return { type: t.nom, ...TARIF_DEFAUT }
    })
    // Ajout, suppression, renommage OU réordonnancement → l'ordre des tarifs
    // doit suivre le rang des types (comparaison de la séquence complète).
    const avant = a.tarifs.map(t => t.type).join('|')
    const apres = tarifs.map(t => t.type).join('|')
    if (avant !== apres) modifie = true
    return { ...a, tarifs }
  })

  if (modifie) setConfigAssurances({ ...cfg, assureurs })
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
