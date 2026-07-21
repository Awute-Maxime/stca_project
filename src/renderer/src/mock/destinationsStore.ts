import { useState, useEffect } from 'react'
import { mockDestinations, type MockDestination } from './destinations'

// ─────────────────────────────────────────────────────────────────────────────
// Paramètres Destinations (menu Outils+Config., captures STCA du 22/07/2026) —
// SOURCE UNIQUE des destinations (bureaux douaniers frontière) : code, tarif,
// nom, lettre, n° d'immatriculation courant.
//
// NOUVEAU dans TCIT : chaque destination porte la COULEUR de sa plaque
// pré-imprimée (les plaques sont pré-fabriquées par couleur selon la
// destination). Cette couleur est éditable ici et pilote toutes les pastilles
// de l'app (Dashboard, Liste, Recherche, Enregistrement, Pointage, Analyse…) —
// avant, la couleur était recopiée en dur dans 8 fichiers.
//
// Persistée dans localStorage + synchro toutes fenêtres (storage + CustomEvent).
// ─────────────────────────────────────────────────────────────────────────────

export interface DestinationParam extends MockDestination {
  couleur: string // couleur de la plaque pré-imprimée liée à la destination
}

// Palette des couleurs de plaques standard proposée dans le formulaire
// (l'utilisateur peut aussi saisir une couleur personnalisée).
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

// Association couleur↔destination actuelle (reprise des DEST_COLORS codés en
// dur jusqu'ici) — sert de valeur par défaut avant toute personnalisation.
const COULEURS_DEFAUT: Record<string, string> = {
  AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
  KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
  'S/C': '#FFD700', POL: '#94A3B8',
}
export const COULEUR_FALLBACK = '#2563EB'

const LS_KEY = 'tcit_destinations'
const LOCAL_EVENT = 'tcit:destinations-changed'

const DEFAUT: DestinationParam[] = mockDestinations.map(d => ({
  ...d,
  couleur: COULEURS_DEFAUT[d.code] ?? COULEUR_FALLBACK,
}))

export function getDestinations(): DestinationParam[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as DestinationParam[]
      if (Array.isArray(p) && p.length > 0) {
        // Migration douce : garantir une couleur sur chaque ligne
        return p.map(d => ({ ...d, couleur: d.couleur ?? COULEURS_DEFAUT[d.code] ?? COULEUR_FALLBACK }))
      }
    }
  } catch { /* défauts */ }
  return DEFAUT
}

export function setDestinations(list: DestinationParam[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

/** Ajoute ou met à jour une destination (clé = code, insensible à la casse). */
export function upsertDestination(d: DestinationParam): void {
  const list = getDestinations()
  const i = list.findIndex(x => x.code.toLowerCase() === d.code.toLowerCase())
  if (i >= 0) list[i] = d
  else list.push(d)
  setDestinations(list)
}

export function removeDestination(code: string): void {
  setDestinations(getDestinations().filter(d => d.code.toLowerCase() !== code.toLowerCase()))
}

/** Table couleur par code — remplace les DEST_COLORS codés en dur. */
export function getDestColors(): Record<string, string> {
  const m: Record<string, string> = {}
  for (const d of getDestinations()) m[d.code] = d.couleur
  return m
}

/** Couleur de plaque d'une destination (avec repli). */
export function couleurDe(code: string): string {
  return getDestinations().find(d => d.code === code)?.couleur ?? COULEUR_FALLBACK
}

/** Hook React : liste des destinations synchronisée entre toutes les fenêtres. */
export function useDestinations(): DestinationParam[] {
  const [dests, setDests] = useState<DestinationParam[]>(getDestinations)

  useEffect(() => {
    const refresh = (): void => setDests(getDestinations())
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

  return dests
}

/** Hook React : table couleur par code, réactive (pastilles de destination). */
export function useDestColors(): Record<string, string> {
  const dests = useDestinations()
  const m: Record<string, string> = {}
  for (const d of dests) m[d.code] = d.couleur
  return m
}
