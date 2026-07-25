import { useState, useEffect } from 'react'
import { electronApi, type DbAssurConfig } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Assurances — MIGRÉE EN BASE (Phase 3, 25/07/2026).
// Tables `assureur` + `tarif_assurance` (← TYPEASSURANCE + VEHASSURANCE) + le
// flag « mise en service » (Parametre). Fin de la période hybride : la
// réconciliation des tarifs avec les catégories est désormais faite dans le main
// (referentiels.ts), plus ici.
//
// Modèle asynchrone : cache module (getters synchrones pour la Facture / le
// Feuillet N°3) + useConfigAssurances réactif via db:changed('assurances').
// Les fonctions de CALCUL restent pures (opèrent sur des objets TarifAssurance).
// ─────────────────────────────────────────────────────────────────────────────

export interface DetailPrimes {
  rc: number           // Responsabilité Civile
  cedeao: number       // Carte Brune CEDEAO
  individuelle: number // Individuelle Accidents
  accessoires: number  // Accessoires
}

export interface TarifAssurance {
  type: string
  tarif: number
  taxe: number
  commissionPct: number
  detail?: DetailPrimes
}

export interface Assureur {
  id: number
  nom: string
  coordonnees: string
  tarifs: TarifAssurance[]
}

export interface ConfigAssurances {
  imprimerAssurances: boolean
  assureurs: Assureur[]
}

// Repli d'affichage si la base est injoignable (les vraies valeurs viennent de la base)
const DEFAUT: ConfigAssurances = {
  imprimerAssurances: true,
  assureurs: [
    {
      id: 1,
      nom: 'POOL TPV VT - MOTO',
      coordonnees: '01 BP 2689 Lomé Togo tel : 221 70 92',
      tarifs: [
        { type: 'Voiture', tarif: 13000, taxe: 679,  commissionPct: 20 },
        { type: 'Camion',  tarif: 19500, taxe: 1047, commissionPct: 20 },
        { type: 'Autre',   tarif: 13000, taxe: 679,  commissionPct: 20 },
      ],
    },
  ],
}

// ── Cache module ─────────────────────────────────────────────────────────────
let cache: ConfigAssurances = DEFAUT
const abonnes = new Set<() => void>()
let initialise = false

async function rechargerCache(): Promise<void> {
  const r = await electronApi.dbAssurancesGet()
  if (r.ok && r.config) {
    cache = r.config as ConfigAssurances
    abonnes.forEach(fn => fn())
  } else {
    console.error('[assurancesStore] lecture base échouée :', r.error)
  }
}

function assurerInit(): void {
  if (initialise) return
  initialise = true
  void rechargerCache()
  electronApi.onDbChanged(p => { if (p.domaine === 'assurances') void rechargerCache() })
}
assurerInit()

export function getConfigAssurances(): ConfigAssurances {
  assurerInit()
  return cache
}

/** Écrit toute la configuration en base. Retourne un message d'erreur, ou null. */
export async function setConfigAssurances(cfg: ConfigAssurances): Promise<string | null> {
  const r = await electronApi.dbAssurancesSave(cfg as DbAssurConfig)
  if (!r.ok) return r.error ?? 'Écriture en base échouée.'
  if (r.config) cache = r.config as ConfigAssurances
  abonnes.forEach(fn => fn())
  return null
}

// ── Calculs du modèle réel (purs) ────────────────────────────────────────────
export const brutDe = (t: TarifAssurance): number => t.tarif - t.taxe
export const commissionDe = (t: TarifAssurance): number => Math.round(brutDe(t) * t.commissionPct / 100)
export const montantARestituerDe = (t: TarifAssurance): number => t.tarif - commissionDe(t)

export function tarifPourType(typeVehicule: string): TarifAssurance {
  const tarifs = getConfigAssurances().assureurs[0]?.tarifs ?? DEFAUT.assureurs[0].tarifs
  const exact = tarifs.find(t => t.type.toLowerCase() === typeVehicule.toLowerCase())
  if (exact) return exact
  return tarifs.find(t => t.type.toLowerCase() === 'autre') ?? tarifs[0]
}

// Référence véhicule léger (modèle imprimé)
const REF_PRIMES = { rc: 5065, cedeao: 506, individuelle: 3750, accessoires: 2000 }

export interface PrimesAssurance {
  rc: number
  cedeao: number
  individuelle: number
  accessoires: number
  taxes: number
  nette: number
  ttc: number
}

export function detailDe(t: TarifAssurance): DetailPrimes {
  if (t.detail) return t.detail
  const accessoires = REF_PRIMES.accessoires
  const cedeao = REF_PRIMES.cedeao
  const reste = Math.max(0, t.tarif - t.taxe - accessoires - cedeao)
  const rc = Math.round(reste * REF_PRIMES.rc / (REF_PRIMES.rc + REF_PRIMES.individuelle))
  return { rc, cedeao, individuelle: reste - rc, accessoires }
}

export function appliquerTarif(t: TarifAssurance, nouveauTarif: number): TarifAssurance {
  const d = detailDe(t)
  const reste = Math.max(0, nouveauTarif - t.taxe - d.accessoires - d.cedeao)
  const base = d.rc + d.individuelle
  const refRcInd = REF_PRIMES.rc + REF_PRIMES.individuelle
  const rc = Math.round(reste * (base > 0 ? d.rc / base : REF_PRIMES.rc / refRcInd))
  const detail = { ...d, rc, individuelle: reste - rc }
  return { ...t, detail, tarif: reste + d.cedeao + d.accessoires + t.taxe }
}

export function primesPourType(typeVehicule: string): PrimesAssurance {
  const t = tarifPourType(typeVehicule)
  const d = detailDe(t)
  const nette = d.rc + d.cedeao + d.individuelle
  return { ...d, taxes: t.taxe, nette, ttc: nette + d.accessoires + t.taxe }
}

/** Hook React : configuration synchronisée entre toutes les fenêtres. */
export function useConfigAssurances(): ConfigAssurances {
  const [cfg, setCfg] = useState<ConfigAssurances>(cache)

  useEffect(() => {
    assurerInit()
    const fn = (): void => setCfg(cache)
    abonnes.add(fn)
    fn()
    void rechargerCache()
    return () => { abonnes.delete(fn) }
  }, [])

  return cfg
}
