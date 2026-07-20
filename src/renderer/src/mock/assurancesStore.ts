import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Assurances (menu Outils+Config.) — SOURCE UNIQUE des assureurs
// et des tarifs d'assurance par type de véhicule (captures STCA du 21/07/2026) :
// - mise en service : « Imprimer Facture + Cond. Part. + Assurances » OUI/NON,
// - assureur(s) : nom + coordonnées + table des tarifs par catégorie,
// - relations du modèle réel : Tarif brut = Tarif − Taxe ;
//   Commission STCA = brut × % (part reversée par l'assureur à STCA —
//   alimentera les rapports de revenus des partenaires).
// Consommée par : la Facture (montant assurance) et le Feuillet N°3 (primes).
// Persistée dans localStorage + synchro toutes fenêtres (storage + CustomEvent).
// ─────────────────────────────────────────────────────────────────────────────

// Détail des primes constituant le tarif (imprimées sur le Feuillet N°3)
export interface DetailPrimes {
  rc: number           // Responsabilité Civile
  cedeao: number       // Carte Brune CEDEAO
  individuelle: number // Individuelle Accidents
  accessoires: number  // Accessoires
}

export interface TarifAssurance {
  type: string          // catégorie : Voiture, Camion, Autre…
  tarif: number         // prix TTC payé par le client (F CFA)
  taxe: number          // part de taxes incluse
  commissionPct: number // % STCA sur le tarif brut
  detail?: DetailPrimes // saisi dans Config. Assurances — absent = dérivé proportionnellement
}

export interface Assureur {
  id: number
  nom: string
  coordonnees: string
  tarifs: TarifAssurance[]
}

export interface ConfigAssurances {
  imprimerAssurances: boolean // OUI/NON : imprimer Facture + Cond. Part. + Assurances
  assureurs: Assureur[]
}

const LS_KEY = 'tcit_config_assurances'
const LOCAL_EVENT = 'tcit:config-assurances-changed'

// Tarifs en vigueur (mis à jour par l'utilisateur le 21/07/2026 : Voiture
// 13 000, Camion 19 500 — les captures STCA montraient 12 000/18 500).
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

export function getConfigAssurances(): ConfigAssurances {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<ConfigAssurances>
      return {
        imprimerAssurances: p.imprimerAssurances ?? DEFAUT.imprimerAssurances,
        assureurs: p.assureurs && p.assureurs.length > 0 ? p.assureurs : DEFAUT.assureurs,
      }
    }
  } catch { /* défauts */ }
  return DEFAUT
}

export function setConfigAssurances(cfg: ConfigAssurances): void {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg))
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

// ── Calculs du modèle réel ───────────────────────────────────────────────────

/** Tarif brut = Tarif − Taxe (ex. 12 000 − 679 = 11 321). */
export const brutDe = (t: TarifAssurance): number => t.tarif - t.taxe

/** Commission STCA = brut × % (ex. 11 321 × 20 % = 2 264). */
export const commissionDe = (t: TarifAssurance): number => Math.round(brutDe(t) * t.commissionPct / 100)

/**
 * Montant à restituer à l'assureur = Tarif − Commission STCA
 * (ex. 12 000 − 2 264 = 9 736 ; 18 500 − 3 491 = 15 009 — capture réelle).
 * C'est la base de la fenêtre « Montant à restituer » du menu Assurances.
 */
export const montantARestituerDe = (t: TarifAssurance): number => t.tarif - commissionDe(t)

/**
 * Tarif applicable à un type de véhicule de l'application (Voiture, Camion,
 * Moto, Bus, Pick-up, Minibus…) : correspondance exacte, sinon « Autre »,
 * sinon la première ligne.
 */
export function tarifPourType(typeVehicule: string): TarifAssurance {
  const tarifs = getConfigAssurances().assureurs[0]?.tarifs ?? DEFAUT.assureurs[0].tarifs
  const exact = tarifs.find(t => t.type.toLowerCase() === typeVehicule.toLowerCase())
  if (exact) return exact
  return tarifs.find(t => t.type.toLowerCase() === 'autre') ?? tarifs[0]
}

// ── Primes du Feuillet N°3 (décomposition du modèle réel) ────────────────────
// Référence véhicule léger (modèle imprimé) : RC 5 065 + CEDEAO 506 +
// Individuelle 3 750 = nette 9 321 ; + Accessoires 2 000 + Taxes 679 = 12 000.
// Pour une autre catégorie : accessoires fixes, taxes de la config, et
// RC/CEDEAO/Individuelle répartis proportionnellement (sommes exactes).

const REF_PRIMES = { rc: 5065, cedeao: 506, individuelle: 3750, accessoires: 2000 }
const REF_NETTE = REF_PRIMES.rc + REF_PRIMES.cedeao + REF_PRIMES.individuelle // 9 321

export interface PrimesAssurance {
  rc: number
  cedeao: number
  individuelle: number
  accessoires: number
  taxes: number
  nette: number // rc + cedeao + individuelle
  ttc: number   // nette + accessoires + taxes = tarif de la catégorie
}

/**
 * Détail des primes d'une ligne de tarif : celui SAISI dans Config.
 * Assurances s'il existe, sinon dérivé proportionnellement de la référence
 * (point de départ modifiable dans la fenêtre).
 */
export function detailDe(t: TarifAssurance): DetailPrimes {
  if (t.detail) return t.detail
  const accessoires = REF_PRIMES.accessoires
  const nette = Math.max(0, t.tarif - accessoires - t.taxe)
  const rc = Math.round(nette * REF_PRIMES.rc / REF_NETTE)
  const cedeao = Math.round(nette * REF_PRIMES.cedeao / REF_NETTE)
  return { rc, cedeao, individuelle: nette - rc - cedeao, accessoires }
}

export function primesPourType(typeVehicule: string): PrimesAssurance {
  const t = tarifPourType(typeVehicule)
  const d = detailDe(t)
  const nette = d.rc + d.cedeao + d.individuelle
  return { ...d, taxes: t.taxe, nette, ttc: nette + d.accessoires + t.taxe }
}

/** Hook React : configuration synchronisée entre toutes les fenêtres. */
export function useConfigAssurances(): ConfigAssurances {
  const [cfg, setCfg] = useState<ConfigAssurances>(getConfigAssurances)

  useEffect(() => {
    const refresh = (): void => setCfg(getConfigAssurances())
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

  return cfg
}
