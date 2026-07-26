import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Historiques de saisie — mémoire des champs du formulaire d'enregistrement.
// Une entrée par domaine (nom, pays, parc, transit, préfixes de châssis).
// Stocké en localStorage (clé tcit_hist_<domaine>) ET synchronisé entre toutes
// les fenêtres (event `storage` inter-fenêtres + abonnés même fenêtre), pour que
// la fenêtre de gestion et le formulaire restent toujours d'accord.
// Le domaine « marque » est un VRAI référentiel (marquesStore) — pas ici.
// ─────────────────────────────────────────────────────────────────────────────

export type DomaineHistorique = 'nom' | 'pays' | 'parc' | 'transit' | 'chassis'

export interface DomaineConfig {
  cle: DomaineHistorique
  label: string       // titre de la fenêtre de gestion
  icone: string       // emoji (suggestions + bouton)
  placeholder: string
  aide: string        // courte explication dans la fenêtre de gestion
}

export const DOMAINES: Record<DomaineHistorique, DomaineConfig> = {
  nom:     { cle: 'nom',     icone: '👤', label: 'Noms & Prénoms des acheteurs', placeholder: 'Nom et prénom de l\'acheteur',       aide: 'Noms déjà saisis, proposés à la frappe.' },
  pays:    { cle: 'pays',    icone: '🌍', label: 'Pays (résidence & destination)', placeholder: 'Pays',                             aide: 'Pays partagés entre Résidence et Destination.' },
  parc:    { cle: 'parc',    icone: '🅿️', label: 'Parcs de provenance',           placeholder: 'Nom du parc de provenance du véhicule', aide: 'Parcs de vente d\'où proviennent les véhicules.' },
  transit: { cle: 'transit', icone: '🏢', label: 'Maisons de transit',            placeholder: 'Maison de transit',                 aide: 'Maisons de transit qui font la sortie du véhicule.' },
  chassis: { cle: 'chassis', icone: '🔩', label: 'Préfixes de châssis (VIN)',     placeholder: 'Début du N° de châssis',            aide: 'Les 11 premiers caractères d\'un VIN (constructeur/modèle/année) sont répétitifs ; seuls les 6 derniers sont uniques. On mémorise le début pour aider la saisie.' },
}

/** Longueur du préfixe de châssis mémorisé (WMI+VDS+année+usine ; les 6 derniers = série unique). */
export const CHASSIS_PREFIXE_LEN = 11

const MAX = 60
const prefixeCle = (cle: string): string => `tcit_hist_${cle}`

// Socle de départ des préfixes de châssis = WMI réels (World Manufacturer
// Identifier, 3 premiers caractères du VIN) des marques les plus courantes en
// transit ouest-africain. L'opérateur tape 1-3 lettres → la marque est proposée.
// La liste s'enrichit ensuite avec les vrais préfixes (11 car.) des véhicules saisis.
const CHASSIS_DEFAUT = [
  'JTD', // Toyota Japon (berlines : Corolla…)
  'JTE', // Toyota Japon (4x4 : Land Cruiser…)
  'JTF', // Toyota Japon (Hiace)
  'MR0', // Toyota Thaïlande (Hilux, Fortuner)
  'NMT', // Toyota Turquie (Corolla, Auris)
  'JN1', // Nissan Japon
  'WDB', // Mercedes-Benz
  'WDC', // Mercedes-Benz (SUV)
  'WDF', // Mercedes-Benz (Sprinter)
  'KMH', // Hyundai Corée (berlines)
  'KMF', // Hyundai Corée (utilitaires)
  'KNA', // Kia Corée
  'KND', // Kia Corée (SUV)
  'JHM', // Honda Japon
  'VF1', // Renault
  'VF3', // Peugeot
  'WVW', // Volkswagen
  'JMB', // Mitsubishi
  'MPA', // Isuzu Thaïlande (D-Max)
  'WMA', // MAN (camions)
  'XLR', // DAF (camions)
]

// Amorçage unique : au tout premier lancement, on remplit l'historique châssis.
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem('tcit_hist_amorce')) {
      if (!localStorage.getItem(prefixeCle('chassis'))) {
        localStorage.setItem(prefixeCle('chassis'), JSON.stringify(CHASSIS_DEFAUT))
      }
      localStorage.setItem('tcit_hist_amorce', '1')
    }
  } catch { /* localStorage indisponible : on ignore */ }
}

export function getHistorique(cle: DomaineHistorique): string[] {
  try {
    const s = localStorage.getItem(prefixeCle(cle))
    return s ? (JSON.parse(s) as string[]) : []
  } catch { return [] }
}

const abonnes = new Map<string, Set<() => void>>()
function notifier(cle: string): void { abonnes.get(cle)?.forEach(fn => fn()) }

function ecrire(cle: DomaineHistorique, liste: string[]): void {
  localStorage.setItem(prefixeCle(cle), JSON.stringify(liste))
  notifier(cle) // même fenêtre (l'event `storage` ne s'émet que vers les AUTRES)
}

/** Ajoute une valeur en tête (dédoublonnée). */
export function addHistorique(cle: DomaineHistorique, valeur: string): void {
  const v = valeur.trim()
  if (!v) return
  const liste = getHistorique(cle)
  if (liste[0] === v) return
  ecrire(cle, [v, ...liste.filter(x => x !== v)].slice(0, MAX))
}

export function removeHistorique(cle: DomaineHistorique, valeur: string): void {
  ecrire(cle, getHistorique(cle).filter(x => x !== valeur))
}

export function renameHistorique(cle: DomaineHistorique, ancien: string, nouveau: string): void {
  const v = nouveau.trim()
  if (!v) return
  ecrire(cle, getHistorique(cle).map(x => (x === ancien ? v : x)))
}

export function viderHistorique(cle: DomaineHistorique): void { ecrire(cle, []) }

// Synchro inter-fenêtres : l'event `storage` se déclenche dans les AUTRES fenêtres.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key && e.key.startsWith('tcit_hist_')) notifier(e.key.slice('tcit_hist_'.length))
  })
}

/** Hook réactif : liste d'un domaine, synchronisée entre toutes les fenêtres. */
export function useHistorique(cle: DomaineHistorique): string[] {
  const [liste, setListe] = useState<string[]>(() => getHistorique(cle))
  useEffect(() => {
    const fn = (): void => setListe(getHistorique(cle))
    if (!abonnes.has(cle)) abonnes.set(cle, new Set())
    abonnes.get(cle)!.add(fn)
    fn()
    return () => { abonnes.get(cle)!.delete(fn) }
  }, [cle])
  return liste
}
