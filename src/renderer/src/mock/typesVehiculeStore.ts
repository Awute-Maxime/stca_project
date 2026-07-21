import { useState, useEffect } from 'react'
import { getConfigAssurances, setConfigAssurances, type TarifAssurance } from './assurancesStore'

// ─────────────────────────────────────────────────────────────────────────────
// Types de Véhicule (menu Outils+Config. → « Liste des Types de Véhicules
// (pour assurances) », capture STCA du 22/07/2026) — SOURCE UNIQUE des
// catégories de véhicule de l'application. Confirmé par l'utilisateur : ce sont
// EXACTEMENT les types sélectionnés dans le formulaire d'Enregistrement
// (« Véhicule à assurer ») ET les catégories de tarifs de Config. Assurances.
//
// Une seule liste maître pilote donc :
//   1. le menu déroulant « Type de véhicule » de l'Enregistrement,
//   2. les lignes de tarifs de la Configuration Assurances (lien automatique
//      ci-dessous : reconcilierAssurances — ajouter un type crée sa ligne de
//      tarif, en supprimer un la retire, l'ordre suit le rang).
//
// Chaque type a un « Rang dans la combos » = ordre d'affichage dans les listes
// déroulantes. Persistée dans localStorage + synchro toutes fenêtres.
// ─────────────────────────────────────────────────────────────────────────────

export interface TypeVehicule {
  id: number
  rang: number // ordre d'affichage dans les listes déroulantes (combos)
  nom: string  // « Nom ou type de véhicule »
}

const LS_KEY = 'tcit_types_vehicule'
const LOCAL_EVENT = 'tcit:types-vehicule-changed'

// Types réels du STCA (capture) — alignés avec les catégories de tarifs déjà
// présentes dans assurancesStore (Voiture, Camion, Autre).
const DEFAUT: TypeVehicule[] = [
  { id: 1, rang: 1, nom: 'Voiture' },
  { id: 2, rang: 2, nom: 'Camion' },
  { id: 3, rang: 3, nom: 'Autre' },
]

function trierParRang(types: TypeVehicule[]): TypeVehicule[] {
  return [...types].sort((a, b) => a.rang - b.rang)
}

export function getTypesVehicule(): TypeVehicule[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as TypeVehicule[]
      if (Array.isArray(p) && p.length > 0) return trierParRang(p)
    }
  } catch { /* défauts */ }
  return DEFAUT
}

export function setTypesVehicule(types: TypeVehicule[]): void {
  const ordonnes = trierParRang(types)
  localStorage.setItem(LS_KEY, JSON.stringify(ordonnes))
  reconcilierAssurances(ordonnes) // lien source unique → Config. Assurances
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

/** Noms des types, dans l'ordre du rang — alimente les menus déroulants. */
export function nomsTypesVehicule(): string[] {
  return getTypesVehicule().map(t => t.nom)
}

// ── Lien SOURCE UNIQUE vers Config. Assurances ───────────────────────────────
// La liste des types pilote les catégories de tarifs : pour chaque assureur on
// garde une ligne de tarif par type, dans l'ordre du rang. Les nouveaux types
// reçoivent des valeurs par défaut ; les types retirés voient leur ligne
// supprimée. La correspondance se fait par NOM (un renommage repart donc sur un
// tarif par défaut — cas rare, l'utilisateur ressaisit la valeur si besoin).
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

/** Hook React : liste des types synchronisée entre toutes les fenêtres. */
export function useTypesVehicule(): TypeVehicule[] {
  const [types, setTypes] = useState<TypeVehicule[]>(getTypesVehicule)

  useEffect(() => {
    const refresh = (): void => setTypes(getTypesVehicule())
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

  return types
}
