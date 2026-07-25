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

// ── Marques / modèles (← TYPEVEH). Libellé combiné = clé unique ──────────────

export interface MarqueDto { id: number; nom: string }

// Liste de base (fusion des deux anciennes listes de l'app) — amorçage si vide
const MARQUES_DEFAUT = [
  '140 H', '3256 33', 'A.C.M. VQ-2485SA3/ ALLOY TIPPER', 'ABG DD74', 'ABI E.B.G 1200',
  'ACAM M 2770 G', 'ACERBI 03G', 'ACERBI 08R', 'ACERBI 0L8451-BT0',
  'ACERBI 0L 88308T0/ ALLOY TIPPER', 'ACERBI 11L537', 'ACERBI 125 MG', 'ACERBI 125 PS',
  'ACERBI 135MG', 'ACERBI 135MHS', 'ACERBI 135 MSH', 'ACERBI 135PG', 'ACERBI 135 PS',
  'ACERBI 135PS00', 'ACERBI 135 PSA', 'ACERBI 135PSF', 'ACERBI 135 PSR', 'ACTM',
  'ACTM 55315', 'ACTM A24320C', 'ACTM ORIGINAL', 'ACTM R3232', 'ACTM R 35315',
  'A.C.T.M R44315', 'ACTM S070415', 'ACTM S 322', 'ACTM S32215C', 'ACTM S32215E',
  'ACTM S32215H', 'ACTM S3322/ ALLOY TIPPER', 'ACTM S34320', 'ACTM S34320A',
  'ACTM S 443', 'ACTM S 44315', 'DAF XF 105', 'FIAT DUCATO', 'FOTON BJ1069',
  'HONDA ACCORD', 'HONDA CB 125', 'HOWO A7', 'ISUZU D-MAX', 'ISUZU NQR 75P',
  'MAN TGX 18.440', 'MAN TGX 18.480', 'MERCEDES ACTROS', 'MERCEDES ACTROS 1844',
  'MERCEDES SPRINTER', 'MITSUBISHI L200', 'NISSAN NAVARA', 'NISSAN PATROL',
  'OPEL ASTRA', 'PEUGEOT 306', 'PEUGEOT BOXER', 'RENAULT MASTER', 'RENAULT TRAFIC',
  'RENAULT TRUCKS T 480', 'SCANIA R500', 'TOYOTA COROLLA', 'TOYOTA HIACE',
  'TOYOTA HILUX', 'TOYOTA LAND CRUISER', 'TOYOTA LAND CRUISER 79',
  'VOLKSWAGEN GOLF', 'VOLKSWAGEN TRANSPORTER', 'VOLVO FH16 750', 'YAMAHA FZ 150',
]

function dedupTri(noms: string[]): string[] {
  const vus = new Set<string>()
  const out: string[] = []
  for (const n of noms) {
    const cle = n.trim().toUpperCase()
    if (cle && !vus.has(cle)) { vus.add(cle); out.push(n.trim()) }
  }
  return out.sort((a, b) => a.localeCompare(b, 'fr'))
}

export async function marquesList(): Promise<MarqueDto[]> {
  const db = getPrisma()
  let rows = await db.marqueModele.findMany({ orderBy: { libelle: 'asc' } })
  if (rows.length === 0) {
    await db.marqueModele.createMany({
      data: dedupTri(MARQUES_DEFAUT).map(nom => ({ marque: nom, libelle: nom })),
    })
    rows = await db.marqueModele.findMany({ orderBy: { libelle: 'asc' } })
  }
  return rows.map(r => ({ id: r.id, nom: r.libelle }))
}

/** Vérifie l'unicité du libellé (insensible à la casse — SQLite est sensible). */
async function libelleExiste(val: string, saufId?: number): Promise<boolean> {
  const db = getPrisma()
  const rows = await db.marqueModele.findMany()
  return rows.some(m => m.id !== saufId && m.libelle.toUpperCase() === val.toUpperCase())
}

export async function marqueAdd(nom: string): Promise<MarqueDto> {
  const val = nom.trim()
  if (!val) throw new Error('Le libellé est vide.')
  if (await libelleExiste(val)) throw new Error('Cette marque existe déjà.')
  const r = await getPrisma().marqueModele.create({ data: { marque: val, libelle: val } })
  diffuserChangement('marques')
  return { id: r.id, nom: r.libelle }
}

export async function marqueRename(id: number, nom: string): Promise<MarqueDto> {
  const val = nom.trim()
  if (!val) throw new Error('Le libellé est vide.')
  if (await libelleExiste(val, id)) throw new Error('Cette marque existe déjà.')
  const r = await getPrisma().marqueModele.update({ where: { id }, data: { marque: val, libelle: val } })
  diffuserChangement('marques')
  return { id: r.id, nom: r.libelle }
}

export async function marqueRemove(id: number): Promise<void> {
  await getPrisma().marqueModele.deleteMany({ where: { id } })
  diffuserChangement('marques')
}
