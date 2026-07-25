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
