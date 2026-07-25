import { BrowserWindow } from 'electron'
import { getPrisma } from './db'

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — Accès BASE DE DONNÉES des référentiels (process principal).
// Modèle répliqué pour chaque domaine migré :
//   - list  : lecture (avec amorçage des valeurs par défaut si table vide),
//   - save  : écriture complète (remplace),
//   - après chaque écriture → diffusion `db:changed` à TOUTES les fenêtres
//     (remplace l'événement `storage` du localStorage pour la synchro MDI).
// ─────────────────────────────────────────────────────────────────────────────

/** Prévient toutes les fenêtres (principale + MDI) qu'un domaine a changé. */
export function diffuserChangement(domaine: string): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send('db:changed', { domaine })
  }
}

// ── Catégories de véhicule (← CATVEH : rang + nom) ───────────────────────────

export interface CategorieDto {
  id: number
  rang: number
  nom: string
}

const CATEGORIES_DEFAUT = [
  { rang: 1, nom: 'Voiture' },
  { rang: 2, nom: 'Camion' },
  { rang: 3, nom: 'Autre' },
]

export async function categoriesList(): Promise<CategorieDto[]> {
  const db = getPrisma()
  let liste = await db.categorieVehicule.findMany({ orderBy: { rang: 'asc' } })
  if (liste.length === 0) {
    // Premier lancement sur base vierge : amorcer les valeurs du vrai STCA
    await db.categorieVehicule.createMany({ data: CATEGORIES_DEFAUT })
    liste = await db.categorieVehicule.findMany({ orderBy: { rang: 'asc' } })
  }
  return liste
}

/** Remplace la liste complète (l'UI édite la liste entière puis Enregistre). */
export async function categoriesSaveAll(
  items: { rang: number; nom: string }[],
): Promise<CategorieDto[]> {
  const db = getPrisma()
  const propres = items
    .map(t => ({ rang: t.rang, nom: t.nom.trim() }))
    .filter(t => t.nom !== '')
  if (propres.length === 0) throw new Error('Au moins une catégorie est requise.')

  await db.$transaction([
    db.categorieVehicule.deleteMany(),
    db.categorieVehicule.createMany({ data: propres }),
  ])
  diffuserChangement('categories')
  return db.categorieVehicule.findMany({ orderBy: { rang: 'asc' } })
}

// ── Destinations (← ZoneImportation + couleur de plaque TCIT) ────────────────

export interface DestinationDto {
  id: number
  code: string
  nom: string
  lettre: string
  tarif: number
  numImmatActuel: number
  couleur: string
  contact: string | null
  description: string | null
}

export interface DestinationInput {
  code: string
  nom: string
  lettre: string
  tarif: number
  numImmatActuel: number
  couleur: string
}

const DESTINATIONS_DEFAUT = [
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

export async function destinationsList(): Promise<DestinationDto[]> {
  const db = getPrisma()
  let liste = await db.destination.findMany({ orderBy: { id: 'asc' } })
  if (liste.length === 0) {
    await db.destination.createMany({ data: DESTINATIONS_DEFAUT })
    liste = await db.destination.findMany({ orderBy: { id: 'asc' } })
  }
  return liste
}

/** Crée ou met à jour une destination (clé métier = code). */
export async function destinationUpsert(d: DestinationInput): Promise<DestinationDto> {
  const db = getPrisma()
  const code = d.code.trim()
  if (!code) throw new Error('Le code destination est obligatoire.')
  const data = {
    nom: d.nom.trim(),
    lettre: (d.lettre ?? '').trim(),
    tarif: Math.round(d.tarif) || 0,
    numImmatActuel: Math.round(d.numImmatActuel) || 0,
    couleur: d.couleur,
  }
  const res = await db.destination.upsert({
    where: { code },
    create: { code, ...data },
    update: data,
  })
  diffuserChangement('destinations')
  return res
}

export async function destinationRemove(code: string): Promise<void> {
  const db = getPrisma()
  await db.destination.deleteMany({ where: { code } })
  diffuserChangement('destinations')
}
