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

// ── Amorçage UNIQUE et sérialisé de tous les référentiels ────────────────────
// Plusieurs fenêtres appellent les *List en parallèle : sans garde, chacune
// verrait la table vide et amorcerait → DOUBLONS (surtout l'assureur qui n'a pas
// de contrainte d'unicité). Ce verrou garantit un seul amorçage par process.
let amorcagePromise: Promise<void> | null = null

export function amorcerReferentiels(): Promise<void> {
  if (!amorcagePromise) amorcagePromise = faireAmorcage()
  return amorcagePromise
}

async function faireAmorcage(): Promise<void> {
  const db = getPrisma()
  if (await db.categorieVehicule.count() === 0) {
    await db.categorieVehicule.createMany({ data: CATEGORIES_DEFAUT })
  }
  if (await db.destination.count() === 0) {
    await db.destination.createMany({ data: DESTINATIONS_DEFAUT })
  }
  if (await db.marqueModele.count() === 0) {
    await db.marqueModele.createMany({ data: dedupTri(MARQUES_DEFAUT).map(nom => ({ marque: nom, libelle: nom })) })
  }
  if (await db.assureur.count() === 0) {
    const cats = await db.categorieVehicule.findMany({ orderBy: { rang: 'asc' } })
    const a = await db.assureur.create({ data: ASSUREUR_DEFAUT })
    const rangs = cats.length ? cats : [{ rang: 1 }, { rang: 2 }, { rang: 3 }]
    await db.tarifAssurance.createMany({
      data: rangs.map(c => {
        const b = baseTarifRang(c.rang)
        return { assureurId: a.id, categorieRang: c.rang, ...b, commissionPct: 20, ...deriverDetail(b.tarif, b.taxe) }
      }),
    })
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
  await amorcerReferentiels()
  return getPrisma().categorieVehicule.findMany({ orderBy: { rang: 'asc' } })
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
  await reconcilierTarifs()   // les tarifs assurance suivent les catégories (1 par catégorie)
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
  await amorcerReferentiels()
  return getPrisma().destination.findMany({ orderBy: { id: 'asc' } })
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
  await amorcerReferentiels()
  const rows = await getPrisma().marqueModele.findMany({ orderBy: { libelle: 'asc' } })
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

// ── Paramètres singletons (clé → valeur) ─────────────────────────────────────
async function getParam(cle: string): Promise<string | null> {
  const p = await getPrisma().parametre.findUnique({ where: { cle } })
  return p?.valeur ?? null
}
async function setParam(cle: string, valeur: string): Promise<void> {
  await getPrisma().parametre.upsert({ where: { cle }, create: { cle, valeur }, update: { valeur } })
}

// ── Assurances (← TYPEASSURANCE + VEHASSURANCE) ──────────────────────────────
// Un seul point de vérité : assureurs + tarifs par catégorie (avec le détail des
// primes) + le flag « mise en service » (Parametre). La RÉCONCILIATION des
// tarifs avec les catégories est faite ICI (fin de la période hybride).

export interface DetailPrimesDto { rc: number; cedeao: number; individuelle: number; accessoires: number }
export interface TarifDto { type: string; tarif: number; taxe: number; commissionPct: number; detail: DetailPrimesDto }
export interface AssureurDto { id: number; nom: string; coordonnees: string; tarifs: TarifDto[] }
export interface ConfigAssurancesDto { imprimerAssurances: boolean; assureurs: AssureurDto[] }

const ASSUREUR_DEFAUT = { nom: 'POOL TPV VT - MOTO', coordonnees: '01 BP 2689 Lomé Togo tel : 221 70 92' }
const TARIF_DEFAUT = { tarif: 13000, taxe: 679, commissionPct: 20 }
// Dérivation du détail des primes (Accessoires/CEDEAO fixes, RC/Individuelle au prorata)
const REF = { rc: 5065, cedeao: 506, individuelle: 3750, accessoires: 2000 }
function deriverDetail(tarif: number, taxe: number): DetailPrimesDto {
  const reste = Math.max(0, tarif - taxe - REF.accessoires - REF.cedeao)
  const rc = Math.round(reste * REF.rc / (REF.rc + REF.individuelle))
  return { rc, cedeao: REF.cedeao, individuelle: reste - rc, accessoires: REF.accessoires }
}
function baseTarifRang(rang: number): { tarif: number; taxe: number } {
  return rang === 2 ? { tarif: 19500, taxe: 1047 } : { tarif: 13000, taxe: 679 }
}

export async function configAssurancesGet(): Promise<ConfigAssurancesDto> {
  await amorcerReferentiels()
  const db = getPrisma()
  const cats = await db.categorieVehicule.findMany({ orderBy: { rang: 'asc' } })
  const rangNom = new Map(cats.map(c => [c.rang, c.nom]))

  const assureurs = await db.assureur.findMany({ include: { tarifs: true }, orderBy: { id: 'asc' } })
  const imprimer = (await getParam('assurances.miseEnService')) !== 'false'
  return {
    imprimerAssurances: imprimer,
    assureurs: assureurs.map(a => ({
      id: a.id,
      nom: a.nom,
      coordonnees: a.coordonnees ?? '',
      tarifs: [...a.tarifs].sort((x, y) => x.categorieRang - y.categorieRang).map(t => ({
        type: rangNom.get(t.categorieRang) ?? `#${t.categorieRang}`,
        tarif: t.tarif, taxe: t.taxe, commissionPct: t.commissionPct,
        detail: { rc: t.rc, cedeao: t.cedeao, individuelle: t.individuelle, accessoires: t.accessoires },
      })),
    })),
  }
}

export async function configAssurancesSave(cfg: ConfigAssurancesDto): Promise<ConfigAssurancesDto> {
  const db = getPrisma()
  const cats = await db.categorieVehicule.findMany()
  const nomRang = new Map(cats.map(c => [c.nom.toLowerCase(), c.rang]))

  await db.$transaction([db.tarifAssurance.deleteMany(), db.assureur.deleteMany()])
  for (const a of cfg.assureurs) {
    const created = await db.assureur.create({ data: { nom: a.nom, coordonnees: a.coordonnees } })
    const data = a.tarifs.map(t => {
      const d = t.detail ?? deriverDetail(t.tarif, t.taxe)
      return {
        assureurId: created.id,
        categorieRang: nomRang.get(t.type.toLowerCase()) ?? 0,
        tarif: t.tarif, taxe: t.taxe, commissionPct: t.commissionPct,
        rc: d.rc, cedeao: d.cedeao, individuelle: d.individuelle, accessoires: d.accessoires,
      }
    })
    if (data.length) await db.tarifAssurance.createMany({ data })
  }
  await setParam('assurances.miseEnService', cfg.imprimerAssurances ? 'true' : 'false')
  diffuserChangement('assurances')
  return configAssurancesGet()
}

/** Aligne les tarifs de chaque assureur sur les catégories (appelée quand elles changent). */
async function reconcilierTarifs(): Promise<void> {
  const db = getPrisma()
  const cats = await db.categorieVehicule.findMany({ orderBy: { rang: 'asc' } })
  const rangsValides = new Set(cats.map(c => c.rang))
  const assureurs = await db.assureur.findMany({ include: { tarifs: true } })
  let modifie = false

  for (const a of assureurs) {
    const rangsPresents = new Set(a.tarifs.map(t => t.categorieRang))
    for (const t of a.tarifs) {
      if (!rangsValides.has(t.categorieRang)) {
        await db.tarifAssurance.delete({ where: { id: t.id } }); modifie = true
      }
    }
    for (const c of cats) {
      if (!rangsPresents.has(c.rang)) {
        await db.tarifAssurance.create({
          data: { assureurId: a.id, categorieRang: c.rang, ...TARIF_DEFAUT, ...deriverDetail(TARIF_DEFAUT.tarif, TARIF_DEFAUT.taxe) },
        })
        modifie = true
      }
    }
  }
  if (modifie) diffuserChangement('assurances')
}
