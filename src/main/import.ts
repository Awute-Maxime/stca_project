import { dialog, BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { createReadStream, promises as fsp } from 'fs'
import { parse } from 'csv-parse'
import { parse as parseSync } from 'csv-parse/sync'
import { getPrisma } from './db'

// ─────────────────────────────────────────────────────────────────────────────
// Assistant d'import de l'ancienne base STCA M (export CSV) → base TCIT.
// - pickCsvFile : dialogue d'ouverture
// - previewCsv  : en-têtes + 20 premières lignes (lecture d'un extrait seulement)
// - runImport   : import par lots des ENREGISTREMENTS avec rapport détaillé
//   (importés / doublons / erreurs ligne par ligne) + progression.
// Correspondance des colonnes fournie par l'UI (champ cible → colonne source).
// ─────────────────────────────────────────────────────────────────────────────

export interface PreviewResult {
  ok: boolean
  error?: string
  columns?: string[]
  rows?: string[][]
  delimiter?: string
  totalApprox?: number
}

export type Mapping = Partial<Record<string, string>> // champ cible → nom de colonne source

export interface ImportReport {
  ok: boolean
  error?: string
  total: number
  importes: number
  doublons: number
  erreurs: { ligne: number; raison: string }[]
}

// Champs cibles de l'Enregistrement (ordre d'affichage dans l'UI de mapping)
export const CHAMPS_CIBLE: { cle: string; libelle: string; requis: boolean }[] = [
  { cle: 'numRef',                  libelle: 'N° Référence',            requis: true },
  { cle: 'nomPrenomProprio',        libelle: 'Nom et prénom',           requis: true },
  { cle: 'adresseProprio',          libelle: 'Adresse',                 requis: false },
  { cle: 'codeTransit',             libelle: 'Code frontière',          requis: true },
  { cle: 'categorieRang',           libelle: 'Catégorie (rang)',        requis: false },
  { cle: 'marqueModele',            libelle: 'Marque et modèle',        requis: true },
  { cle: 'vin',                     libelle: 'N° Châssis (VIN)',        requis: true },
  { cle: 'numImmatriculation',      libelle: 'N° Immatriculation',      requis: true },
  { cle: 'numTri',                  libelle: 'N° de Tri',               requis: false },
  { cle: 'montant',                 libelle: 'Montant',                 requis: false },
  { cle: 'dateEnreg',               libelle: 'Date d\'enregistrement',  requis: false },
  { cle: 'flagSortie',              libelle: 'Sorti (oui/non)',         requis: false },
  { cle: 'dateSortie',              libelle: 'Date de sortie',          requis: false },
  { cle: 'nomUtilisateur',          libelle: 'Agent',                   requis: false },
  { cle: 'maisonTransit',           libelle: 'Maison de transit',       requis: false },
  { cle: 'nomDuParc',               libelle: 'Nom du parc',             requis: false },
  { cle: 'ancienneImmatriculation', libelle: 'Ancienne immatriculation',requis: false },
  { cle: 'dateAncienneCG',          libelle: 'Date ancienne CG',        requis: false },
  { cle: 'dateArchivage',           libelle: 'Date d\'archivage',       requis: false },
]

const REQUIS = CHAMPS_CIBLE.filter(c => c.requis).map(c => c.cle)

function detecterDelimiteur(entete: string): string {
  const counts = { ';': 0, ',': 0, '\t': 0 }
  for (const c of entete) if (c in counts) counts[c as keyof typeof counts]++
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) || ','
}

export async function pickCsvFile(): Promise<string | null> {
  const res = await dialog.showOpenDialog({
    title: 'Sélectionner l\'export CSV de l\'ancienne base STCA',
    filters: [{ name: 'Fichiers CSV / texte', extensions: ['csv', 'txt'] }],
    properties: ['openFile'],
  })
  if (res.canceled || res.filePaths.length === 0) return null
  return res.filePaths[0]
}

export async function previewCsv(chemin: string): Promise<PreviewResult> {
  try {
    // Lire seulement le début du fichier (aperçu, sans charger 100 Mo)
    const fh = await fsp.open(chemin, 'r')
    const buf = Buffer.alloc(96 * 1024)
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0)
    const taille = (await fh.stat()).size
    await fh.close()

    let texte = buf.subarray(0, bytesRead).toString('utf-8')
    // Couper la dernière ligne potentiellement incomplète
    const dernierNL = texte.lastIndexOf('\n')
    if (bytesRead >= buf.length && dernierNL > 0) texte = texte.slice(0, dernierNL)

    const premiereLigne = texte.split(/\r?\n/)[0] ?? ''
    const delimiter = detecterDelimiteur(premiereLigne)

    const enr: string[][] = parseSync(texte, {
      delimiter, relax_column_count: true, skip_empty_lines: true, bom: true,
    })
    if (enr.length === 0) return { ok: false, error: 'Fichier vide ou illisible.' }

    const columns = enr[0]
    const rows = enr.slice(1, 21)
    // Estimation grossière du nombre de lignes (taille totale / taille moyenne d'une ligne lue)
    const lignesLues = enr.length
    const totalApprox = bytesRead > 0 ? Math.max(0, Math.round((taille / bytesRead) * (lignesLues - 1))) : lignesLues - 1

    return { ok: true, columns, rows, delimiter, totalApprox }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

// ── Coercition des valeurs vers les types du schéma ──────────────────────────
function toInt(v: string | undefined): number | null {
  if (v == null || v.trim() === '') return null
  const n = parseInt(v.replace(/[^\d-]/g, ''), 10)
  return isNaN(n) ? null : n
}
function toBool(v: string | undefined): boolean {
  if (!v) return false
  const s = v.trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'vrai' || s === 'oui' || s === 'o'
}
function toDate(v: string | undefined): Date | null {
  if (!v || v.trim() === '') return null
  const s = v.trim()
  // AAAAMMJJ
  if (/^\d{8}$/.test(s)) {
    const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00`)
    return isNaN(d.getTime()) ? null : d
  }
  // JJ/MM/AAAA
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) {
    const d = new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T00:00:00`)
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function construireData(rec: Record<string, string>, mapping: Mapping): { data?: Record<string, unknown>; erreur?: string } {
  const get = (cle: string): string | undefined => {
    const col = mapping[cle]
    return col ? rec[col] : undefined
  }
  // Champs requis
  for (const req of REQUIS) {
    const val = get(req)
    if (req === 'numRef') { if (toInt(val) == null) return { erreur: 'N° Référence manquant ou invalide' } }
    else if (!val || val.trim() === '') return { erreur: `Champ requis manquant : ${req}` }
  }
  const data: Record<string, unknown> = {
    numRef: toInt(get('numRef')),
    nomPrenomProprio: get('nomPrenomProprio')!.trim(),
    codeTransit: get('codeTransit')!.trim(),
    marqueModele: get('marqueModele')!.trim(),
    vin: get('vin')!.trim(),
    numImmatriculation: get('numImmatriculation')!.trim(),
    adresseProprio: get('adresseProprio')?.trim() || null,
    categorieRang: toInt(get('categorieRang')),
    numTri: get('numTri')?.trim() || null,
    montant: toInt(get('montant')) ?? 10000,
    flagSortie: toBool(get('flagSortie')),
    nomUtilisateur: get('nomUtilisateur')?.trim() || null,
    maisonTransit: get('maisonTransit')?.trim() || null,
    nomDuParc: get('nomDuParc')?.trim() || null,
    ancienneImmatriculation: get('ancienneImmatriculation')?.trim() || null,
    dateSortie: toDate(get('dateSortie')),
    dateAncienneCG: toDate(get('dateAncienneCG')),
    dateArchivage: toDate(get('dateArchivage')),
  }
  const de = toDate(get('dateEnreg'))
  if (de) data.dateEnreg = de // sinon défaut now()
  return { data }
}

export async function runImport(
  event: IpcMainInvokeEvent, chemin: string, mapping: Mapping, delimiter: string,
): Promise<ImportReport> {
  const db = getPrisma()
  const rapport: ImportReport = { ok: true, total: 0, importes: 0, doublons: 0, erreurs: [] }
  const win = BrowserWindow.fromWebContents(event.sender)
  const BATCH = 500
  let buffer: Record<string, unknown>[] = []
  let ligne = 1 // 1 = en-tête

  const flush = async (): Promise<void> => {
    if (buffer.length === 0) return
    const lot = buffer
    buffer = []
    try {
      const r = await db.enregistrement.createMany({ data: lot as never })
      rapport.importes += r.count
    } catch {
      // Le lot a échoué (doublon/erreur) : on réessaie ligne par ligne pour isoler
      for (const d of lot) {
        try {
          await db.enregistrement.create({ data: d as never })
          rapport.importes++
        } catch (e) {
          const msg = String(e)
          if (msg.includes('Unique constraint') || msg.includes('UNIQUE')) rapport.doublons++
          else rapport.erreurs.push({ ligne: -1, raison: msg.slice(0, 140) })
        }
      }
    }
  }

  try {
    const parser = createReadStream(chemin).pipe(parse({
      delimiter, columns: true, relax_column_count: true, skip_empty_lines: true, bom: true, trim: true,
    }))
    for await (const rec of parser) {
      ligne++
      rapport.total++
      const { data, erreur } = construireData(rec as Record<string, string>, mapping)
      if (erreur) { rapport.erreurs.push({ ligne, raison: erreur }); continue }
      buffer.push(data!)
      if (buffer.length >= BATCH) {
        await flush()
        if (win && !win.isDestroyed()) win.webContents.send('import:progress', { traite: rapport.total, importes: rapport.importes })
      }
    }
    await flush()
    if (win && !win.isDestroyed()) win.webContents.send('import:progress', { traite: rapport.total, importes: rapport.importes })
    return rapport
  } catch (err) {
    return { ...rapport, ok: false, error: String(err) }
  }
}
