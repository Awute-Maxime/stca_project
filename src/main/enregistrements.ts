import type { Enregistrement } from '@prisma/client'
import { getPrisma } from './db'
import { diffuserChangement, categoriesList } from './referentiels'

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — Domaine ENREGISTREMENTS (le cœur), process principal.
// Approche « cache actif + archives à la demande » :
//   - la base ACTIVE (dateArchivage nul) est listée et mise en cache côté renderer ;
//   - les ARCHIVES (dateArchivage rempli, gros volume) sont interrogées à la demande.
// Le DTO renvoyé au renderer garde le shape historique MockVehicule (aucun
// consommateur à réécrire). Le mapping DB↔DTO et rang↔nom de catégorie vit ici.
// ─────────────────────────────────────────────────────────────────────────────

/** Shape historique consommé par le renderer (ex-MockVehicule). */
export interface EnregistrementDto {
  id: number
  ref: string
  date: string // 'YYYY-MM-DD HH:mm'
  immat: string
  chassis: string
  typeVehicule: string
  marqueModele: string
  destination: string
  montant: number
  nomAcheteur: string
  paysResidence: string
  paysDestination: string
  parc: string
  agent: string
  recyclerPlaque: boolean
  numTri: string
  dateTri: string // 'YYYY-MM-DD'
}

export interface ArchiveDto extends EnregistrementDto {
  dateArchivage: string // 'YYYY-MM-DD'
  archivePar: string
}

/** Entrée d'un NOUVEL enregistrement (id + ref attribués par le main). */
export type EnregistrementInput = Omit<EnregistrementDto, 'id' | 'ref'>

// ── Utilitaires de date (sans dépendance, heure locale) ──────────────────────
const p2 = (n: number): string => String(n).padStart(2, '0')
function fmtDateTime(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`
}
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
}

// ── Correspondance catégorie rang ↔ nom (ex. 1 ↔ « Voiture ») ────────────────
interface CartesCategories {
  parRang: Map<number, string>
  parNom: Map<string, number>
}
async function cartesCategories(): Promise<CartesCategories> {
  const cats = await categoriesList()
  return {
    parRang: new Map(cats.map(c => [c.rang, c.nom])),
    parNom: new Map(cats.map(c => [c.nom.trim().toLowerCase(), c.rang])),
  }
}

// ── Mapping Prisma → DTO ─────────────────────────────────────────────────────
function toDto(e: Enregistrement, parRang: Map<number, string>): EnregistrementDto {
  return {
    id: e.id,
    ref: String(e.numRef).padStart(6, '0'),
    date: fmtDateTime(e.dateEnreg),
    immat: e.numImmatriculation,
    chassis: e.vin,
    typeVehicule: (e.categorieRang != null ? parRang.get(e.categorieRang) : '') ?? '',
    marqueModele: e.marqueModele,
    destination: e.codeTransit,
    montant: e.montant,
    nomAcheteur: e.nomPrenomProprio,
    paysResidence: e.adresseProprio ?? '',
    paysDestination: e.paysDestination ?? '',
    parc: e.maisonTransit ?? '',
    agent: e.nomUtilisateur ?? '',
    recyclerPlaque: e.flagSortie,
    numTri: e.numTri ?? '',
    dateTri: e.dateTri ? fmtDate(e.dateTri) : '',
  }
}

function toArchiveDto(e: Enregistrement, parRang: Map<number, string>): ArchiveDto {
  return {
    ...toDto(e, parRang),
    dateArchivage: e.dateArchivage ? fmtDate(e.dateArchivage) : '',
    archivePar: e.archivePar ?? '',
  }
}

// ── Mapping DTO → colonnes DB (pour add / update partiel) ─────────────────────
function champsDb(
  v: Partial<EnregistrementDto>,
  parNom: Map<string, number>
): Record<string, unknown> {
  const d: Record<string, unknown> = {}
  if (v.nomAcheteur !== undefined) d.nomPrenomProprio = v.nomAcheteur
  if (v.paysResidence !== undefined) d.adresseProprio = v.paysResidence || null
  if (v.paysDestination !== undefined) d.paysDestination = v.paysDestination || null
  if (v.typeVehicule !== undefined) d.categorieRang = parNom.get(v.typeVehicule.trim().toLowerCase()) ?? null
  if (v.destination !== undefined) d.codeTransit = v.destination
  if (v.parc !== undefined) d.maisonTransit = v.parc || null
  if (v.marqueModele !== undefined) d.marqueModele = v.marqueModele
  if (v.chassis !== undefined) d.vin = v.chassis
  if (v.numTri !== undefined) d.numTri = v.numTri || null
  if (v.dateTri !== undefined) d.dateTri = v.dateTri ? new Date(v.dateTri) : null
  if (v.immat !== undefined) d.numImmatriculation = v.immat
  if (v.montant !== undefined) d.montant = v.montant
  if (v.date !== undefined) d.dateEnreg = new Date(v.date)
  if (v.recyclerPlaque !== undefined) d.flagSortie = v.recyclerPlaque
  if (v.agent !== undefined) d.nomUtilisateur = v.agent || null
  return d
}

// ── Paramètre « compteur de référence » ──────────────────────────────────────
async function getParam(cle: string): Promise<string | null> {
  const p = await getPrisma().parametre.findUnique({ where: { cle } })
  return p?.valeur ?? null
}
async function setParam(cle: string, valeur: string): Promise<void> {
  await getPrisma().parametre.upsert({ where: { cle }, create: { cle, valeur }, update: { valeur } })
}

/** Réf. la plus élevée réellement utilisée (actifs ET archivés). */
export async function maxRefEnBase(): Promise<number> {
  const r = await getPrisma().enregistrement.aggregate({ _max: { numRef: true } })
  return r._max.numRef ?? 0
}
/** « N° de référence en cours » = compteur persisté (initialisé depuis la base). */
export async function getRefCompteur(): Promise<number> {
  const raw = await getParam('refCompteur')
  if (raw !== null) { const n = parseInt(raw, 10); if (!isNaN(n) && n >= 0) return n }
  return maxRefEnBase()
}
export async function setRefCompteur(n: number): Promise<void> {
  await setParam('refCompteur', String(Math.max(0, Math.floor(n))))
  diffuserChangement('enregistrements')
}
/** Prochaine référence (défensif : jamais sous ce qui existe déjà). */
export async function nextRef(): Promise<string> {
  const base = Math.max(await getRefCompteur(), await maxRefEnBase())
  return String(base + 1).padStart(6, '0')
}
/** Nombre d'ACTIFS déjà enregistrés pour une destination (incrément N° IMMAT). */
export async function countActifsForDest(code: string): Promise<number> {
  return getPrisma().enregistrement.count({ where: { codeTransit: code, dateArchivage: null } })
}

/**
 * Plus grand n° d'immatriculation (partie numérique) utilisé pour une destination
 * (actifs ET archivés). Base de la génération du prochain N° IMMAT. Les immats
 * étant « lettre + 4 chiffres zéro-préfixés », l'ordre alphabétique = numérique.
 */
export async function maxNumImmatForDest(code: string): Promise<number> {
  const top = await getPrisma().enregistrement.findFirst({
    where: { codeTransit: code },
    orderBy: { numImmatriculation: 'desc' },
    select: { numImmatriculation: true },
  })
  if (!top) return 0
  const n = parseInt(top.numImmatriculation.replace(/^[A-Za-z]+/, ''), 10)
  return isNaN(n) ? 0 : n
}

// ── Liste ACTIVE (base de travail, mise en cache renderer) ────────────────────
export async function enregistrementsActifsList(): Promise<EnregistrementDto[]> {
  const { parRang } = await cartesCategories()
  const lignes = await getPrisma().enregistrement.findMany({
    where: { dateArchivage: null },
    orderBy: [{ dateEnreg: 'desc' }, { id: 'desc' }],
  })
  return lignes.map(l => toDto(l, parRang))
}

// ── CRUD ─────────────────────────────────────────────────────────────────────
export interface ResultatAdd { ok: boolean; ref?: string; error?: string }

/** Ajoute un enregistrement ; le main attribue la référence (max+1 défensif). */
export async function enregistrementAdd(input: EnregistrementInput): Promise<ResultatAdd> {
  const { parNom } = await cartesCategories()
  const numRef = Math.max(await getRefCompteur(), await maxRefEnBase()) + 1
  const data = {
    numRef,
    ...champsDb(input, parNom),
  } as Record<string, unknown>
  // Champs requis avec valeurs sûres si absents
  if (data.nomPrenomProprio === undefined) data.nomPrenomProprio = input.nomAcheteur ?? ''
  if (data.codeTransit === undefined) data.codeTransit = input.destination ?? ''
  if (data.marqueModele === undefined) data.marqueModele = input.marqueModele ?? ''
  if (data.vin === undefined) data.vin = input.chassis ?? ''
  if (data.numImmatriculation === undefined) data.numImmatriculation = input.immat ?? ''
  if (data.dateEnreg === undefined) data.dateEnreg = input.date ? new Date(input.date) : new Date()
  try {
    await getPrisma().enregistrement.create({ data: data as never })
    await setParam('refCompteur', String(numRef))
    diffuserChangement('enregistrements')
    return { ok: true, ref: String(numRef).padStart(6, '0') }
  } catch (e) {
    const msg = e instanceof Error && e.message.includes('Unique')
      ? 'Doublon : ce châssis ou ce couple immatriculation/code existe déjà.'
      : (e as Error).message
    return { ok: false, error: msg }
  }
}

/** Modifie un enregistrement (par réf). */
export async function enregistrementUpdate(
  ref: string,
  changes: Partial<EnregistrementDto>
): Promise<{ ok: boolean; error?: string }> {
  const numRef = parseInt(ref, 10)
  if (isNaN(numRef)) return { ok: false, error: 'Référence invalide.' }
  const { parNom } = await cartesCategories()
  try {
    await getPrisma().enregistrement.update({
      where: { numRef },
      data: champsDb(changes, parNom) as never,
    })
    diffuserChangement('enregistrements')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Supprime un enregistrement (par réf). */
export async function enregistrementRemove(ref: string): Promise<{ ok: boolean; error?: string }> {
  const numRef = parseInt(ref, 10)
  if (isNaN(numRef)) return { ok: false, error: 'Référence invalide.' }
  try {
    await getPrisma().enregistrement.delete({ where: { numRef } })
    diffuserChangement('enregistrements')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── ARCHIVES (à la demande — gros volume) ────────────────────────────────────
/** Enregistrements ACTIFS enregistrés jusqu'à la date limite incluse (aperçu). */
export async function vehiculesArchivables(dateLimite: string): Promise<EnregistrementDto[]> {
  const { parRang } = await cartesCategories()
  const limite = new Date(dateLimite + 'T23:59:59')
  const lignes = await getPrisma().enregistrement.findMany({
    where: { dateArchivage: null, dateEnreg: { lte: limite } },
    orderBy: [{ dateEnreg: 'desc' }],
  })
  return lignes.map(l => toDto(l, parRang))
}

/** Archive tous les actifs jusqu'à la date limite incluse. Retourne le nombre. */
export async function archiverJusquAu(dateLimite: string, par: string): Promise<number> {
  const limite = new Date(dateLimite + 'T23:59:59')
  const r = await getPrisma().enregistrement.updateMany({
    where: { dateArchivage: null, dateEnreg: { lte: limite } },
    data: { dateArchivage: new Date(), archivePar: par },
  })
  if (r.count > 0) { diffuserChangement('enregistrements'); diffuserChangement('archives') }
  return r.count
}

/** Liste des archives (les plus récentes d'abord, plafonnée). */
export async function archivesList(limite = 500): Promise<ArchiveDto[]> {
  const { parRang } = await cartesCategories()
  const lignes = await getPrisma().enregistrement.findMany({
    where: { dateArchivage: { not: null } },
    orderBy: [{ dateArchivage: 'desc' }],
    take: limite,
  })
  return lignes.map(l => toArchiveDto(l, parRang))
}

/** Recherche dans les archives (immat, châssis ou n° de référence). */
export async function rechercherArchive(query: string): Promise<ArchiveDto[]> {
  const q = query.trim()
  if (!q) return []
  const { parRang } = await cartesCategories()
  const numRef = /^\d+$/.test(q) ? parseInt(q, 10) : undefined
  const lignes = await getPrisma().enregistrement.findMany({
    where: {
      dateArchivage: { not: null },
      OR: [
        { numImmatriculation: { contains: q } },
        { vin: { contains: q } },
        ...(numRef !== undefined ? [{ numRef }] : []),
      ],
    },
    orderBy: [{ dateArchivage: 'desc' }],
    take: 200,
  })
  return lignes.map(l => toArchiveDto(l, parRang))
}

/** Rappelle des archives (par réf) : retour dans la base active. */
export async function rappelerArchives(refs: string[]): Promise<number> {
  const nums = refs.map(r => parseInt(r, 10)).filter(n => !isNaN(n))
  if (nums.length === 0) return 0
  const r = await getPrisma().enregistrement.updateMany({
    where: { numRef: { in: nums }, dateArchivage: { not: null } },
    data: { dateArchivage: null, archivePar: null },
  })
  if (r.count > 0) { diffuserChangement('enregistrements'); diffuserChangement('archives') }
  return r.count
}

/** Purge définitive d'archives (par réf) — irréversible. */
export async function purgerArchives(refs: string[]): Promise<number> {
  const nums = refs.map(r => parseInt(r, 10)).filter(n => !isNaN(n))
  if (nums.length === 0) return 0
  const r = await getPrisma().enregistrement.deleteMany({
    where: { numRef: { in: nums }, dateArchivage: { not: null } },
  })
  if (r.count > 0) diffuserChangement('archives')
  return r.count
}

/** Recherche dans la base ACTIVE (immat, châssis ou réf) — appoint serveur. */
export async function rechercherActif(query: string): Promise<EnregistrementDto[]> {
  const q = query.trim()
  if (!q) return []
  const { parRang } = await cartesCategories()
  const numRef = /^\d+$/.test(q) ? parseInt(q, 10) : undefined
  const lignes = await getPrisma().enregistrement.findMany({
    where: {
      dateArchivage: null,
      OR: [
        { numImmatriculation: { contains: q } },
        { vin: { contains: q } },
        ...(numRef !== undefined ? [{ numRef }] : []),
      ],
    },
    take: 200,
  })
  return lignes.map(l => toDto(l, parRang))
}
