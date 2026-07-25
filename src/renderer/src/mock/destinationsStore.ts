import { useState, useEffect } from 'react'
import { electronApi } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// Paramètres Destinations — MIGRÉ EN BASE (Phase 3, 25/07/2026).
// La table `destination` (← ZoneImportation + couleur de plaque TCIT) est la
// source unique ; le localStorage n'est plus utilisé pour ce domaine.
//
// La couleur de plaque de chaque destination pilote toutes les pastilles de
// l'app (Dashboard, Liste, Recherche, Enregistrement, Pointage, Analyse…).
//
// MODÈLE ASYNCHRONE (identique aux types de véhicule) :
//   - un CACHE module (rempli au chargement + rafraîchi sur `db:changed`) permet
//     de garder des getters SYNCHRONES (getDestinations/getDestColors/couleurDe)
//     pour les nombreux appels hors composant (recherches par code, dropdowns),
//   - les hooks useDestinations/useDestColors se ré-abonnent au cache et
//     re-rendent quand il change (dans n'importe quelle fenêtre),
//   - écriture via IPC → le main diffuse `db:changed` à toutes les fenêtres.
// ─────────────────────────────────────────────────────────────────────────────

export interface DestinationParam {
  code: string
  nom: string
  lettre: string
  tarif: number
  numImmatActuel: number
  couleur: string
  contact?: string | null
  description?: string | null
}

export const PALETTE_PLAQUES: { nom: string; hex: string }[] = [
  { nom: 'Rouge',  hex: '#DC2626' },
  { nom: 'Vert',   hex: '#16A34A' },
  { nom: 'Jaune',  hex: '#FFD700' },
  { nom: 'Bleu',   hex: '#2563EB' },
  { nom: 'Orange', hex: '#EA580C' },
  { nom: 'Violet', hex: '#7C3AED' },
  { nom: 'Gris',   hex: '#94A3B8' },
  { nom: 'Noir',   hex: '#1F2937' },
]
export const COULEUR_FALLBACK = '#2563EB'

// Repli d'affichage si la base est injoignable (les vraies valeurs viennent de la base)
const DEFAUT: DestinationParam[] = [
  { code: 'AFO', nom: 'Afolé',         lettre: 'C', tarif: 10000, numImmatActuel: 7388, couleur: '#DC2626' },
  { code: 'CK',  nom: 'Cinkassé',      lettre: 'T', tarif: 10000, numImmatActuel: 7467, couleur: '#DC2626' },
  { code: 'KA',  nom: 'Kambolé',       lettre: 'E', tarif: 10000, numImmatActuel: 2182, couleur: '#DC2626' },
  { code: 'KE',  nom: 'Kétao',         lettre: 'C', tarif: 10000, numImmatActuel: 3177, couleur: '#DC2626' },
  { code: 'KP',  nom: 'Kpadapé',       lettre: 'C', tarif: 10000, numImmatActuel: 4419, couleur: '#16A34A' },
  { code: 'KW',  nom: 'Kwodjoviakope', lettre: 'C', tarif: 10000, numImmatActuel: 6637, couleur: '#16A34A' },
  { code: 'NO',  nom: 'Noépé',         lettre: 'A', tarif: 10000, numImmatActuel: 3910, couleur: '#16A34A' },
  { code: 'TO',  nom: 'Tohoum',        lettre: 'C', tarif: 10000, numImmatActuel: 7490, couleur: '#DC2626' },
  { code: 'S/C', nom: 'Sanvi condji',  lettre: 'A', tarif: 10000, numImmatActuel: 8039, couleur: '#FFD700' },
  { code: 'POL', nom: 'Réexportation', lettre: 'A', tarif: 10000, numImmatActuel: 3,    couleur: '#94A3B8' },
]

// ── Cache module partagé ─────────────────────────────────────────────────────
let cache: DestinationParam[] = DEFAUT
const abonnes = new Set<() => void>() // hooks à re-rendre quand le cache change
let initialise = false

async function rechargerCache(): Promise<void> {
  const r = await electronApi.dbDestinationsList()
  if (r.ok && r.items) {
    cache = r.items
    abonnes.forEach(fn => fn())
  } else {
    console.error('[destinationsStore] lecture base échouée :', r.error)
  }
}

/** Amorçage unique : charge la base + s'abonne à db:changed pour ce domaine. */
function assurerInit(): void {
  if (initialise) return
  initialise = true
  void rechargerCache()
  electronApi.onDbChanged(p => { if (p.domaine === 'destinations') void rechargerCache() })
}
assurerInit()

// ── Getters synchrones (servent le cache) ────────────────────────────────────
export function getDestinations(): DestinationParam[] {
  assurerInit()
  return cache
}

export function getDestColors(): Record<string, string> {
  const m: Record<string, string> = {}
  for (const d of cache) m[d.code] = d.couleur
  return m
}

export function couleurDe(code: string): string {
  return cache.find(d => d.code === code)?.couleur ?? COULEUR_FALLBACK
}

// ── Écritures asynchrones (retournent un message d'erreur, ou null si OK) ─────
export async function upsertDestination(d: DestinationParam): Promise<string | null> {
  const r = await electronApi.dbDestinationUpsert({
    code: d.code.trim().toUpperCase(),
    nom: d.nom, lettre: d.lettre, tarif: d.tarif, numImmatActuel: d.numImmatActuel, couleur: d.couleur,
  })
  if (!r.ok) return r.error ?? 'Écriture en base échouée.'
  await rechargerCache()
  return null
}

export async function removeDestination(code: string): Promise<string | null> {
  const r = await electronApi.dbDestinationRemove(code)
  if (!r.ok) return r.error ?? 'Suppression en base échouée.'
  await rechargerCache()
  return null
}

// ── Hooks réactifs ───────────────────────────────────────────────────────────
export function useDestinations(): DestinationParam[] {
  const [dests, setDests] = useState<DestinationParam[]>(cache)

  useEffect(() => {
    assurerInit()
    const fn = (): void => setDests(cache)
    abonnes.add(fn)
    fn()                  // synchro immédiate avec le cache courant
    void rechargerCache() // et on rafraîchit au montage
    return () => { abonnes.delete(fn) }
  }, [])

  return dests
}

/** Table couleur par code, réactive (pastilles de destination). */
export function useDestColors(): Record<string, string> {
  const dests = useDestinations()
  const m: Record<string, string> = {}
  for (const d of dests) m[d.code] = d.couleur
  return m
}
