import { getPrisma } from './db'
import vinSeedData from './vinSeed.json'

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Index VIN appris : signature (positions 1-8, repli 1-6) → marque +
// modèle majoritaires + histogramme d'années. Deux alimentations :
//  - importerSeed() : le seed pré-calculé sur le corpus 100k (Phase 1), une
//    seule fois (flag Parametre `vinSeedImported`).
//  - apprendre()    : apprentissage continu — saisie agent + décodage NHTSA
//    (branché en Phase 4), best-effort (ne doit JAMAIS faire échouer l'appelant).
// Lu par le décodeur via chercher() (Phase 3).
// ─────────────────────────────────────────────────────────────────────────────

interface SeedEntree { mm: Array<[string, number]>; an: Array<[number, number]> }
interface SeedFichier { sig8: Record<string, SeedEntree>; sig6: Record<string, SeedEntree> }
// Le JSON est importé statiquement (resolveJsonModule) ; on retype vers notre
// forme exacte plutôt que de laisser TS inférer le littéral géant du fichier.
const seed = vinSeedData as unknown as SeedFichier

const FLAG_SEED_IMPORTE = 'vinSeedImported'
const TAILLE_LOT = 5000
const ANNEE_MIN = 1950

// ── Signature ─────────────────────────────────────────────────────────────
export function signatureVin(vin: string): string {
  return (vin || '').toUpperCase().replace(/\s+/g, '').slice(0, 8)
}
export function signature6(vin: string): string {
  return (vin || '').toUpperCase().replace(/\s+/g, '').slice(0, 6)
}

// ── Libellé marque/modèle acceptable (filtre le bruit du corpus/de la saisie) ─
export function libelleAcceptable(l: string): boolean {
  const v = (l ?? '').trim()
  if (v.length < 2) return false
  if (v === '...') return false
  if (v.toUpperCase() === 'INCONNU') return false
  if (!/[A-Za-zÀ-ÿ]/.test(v)) return false // au moins une lettre
  return true
}

// ── Médiane PONDÉRÉE d'un histogramme [[année, compte], …] ──────────────────
export function medianeAnnee(hist: Array<[number, number]>): number | null {
  const propre = hist.filter(([, n]) => n > 0)
  if (propre.length === 0) return null
  const trie = [...propre].sort((a, b) => a[0] - b[0])
  const total = trie.reduce((s, [, n]) => s + n, 0)
  const seuil = total / 2
  let cumul = 0
  for (const [annee, n] of trie) {
    cumul += n
    if (cumul >= seuil) return annee
  }
  return trie[trie.length - 1][0] // filet défensif, jamais atteint
}

function anneePlausible(annee: number): boolean {
  return Number.isFinite(annee) && annee >= ANNEE_MIN && annee <= new Date().getFullYear() + 1
}

// ── Apprentissage (best-effort — jamais bloquant pour l'appelant) ───────────
export async function apprendre(
  vin: string,
  marqueModele: string,
  annee: number,
  source: string
): Promise<void> {
  try {
    const sig8 = signatureVin(vin)
    const sig6 = signature6(vin)
    if (sig6.length < 6) return
    if (!libelleAcceptable(marqueModele)) return
    const libelle = marqueModele.trim()
    const db = getPrisma()
    // sig8 et sig6 peuvent coïncider sur un VIN anormalement court : on
    // dédoublonne pour ne jamais compter deux fois la même signature.
    const signatures = [...new Set([sig8, sig6])]

    for (const signature of signatures) {
      await db.vinIndex.upsert({
        where: { signature_marqueModele: { signature, marqueModele: libelle } },
        create: { signature, marqueModele: libelle, nbVus: 1, source },
        update: { nbVus: { increment: 1 } },
      })
    }

    if (anneePlausible(annee)) {
      for (const signature of signatures) {
        await db.vinIndexAnnee.upsert({
          where: { signature_annee: { signature, annee } },
          create: { signature, annee, nb: 1 },
          update: { nb: { increment: 1 } },
        })
      }
    }
  } catch {
    // Best-effort : un souci d'index n'empêche jamais l'opération appelante.
  }
}

// ── Lecture (décodeur — Phase 3) ─────────────────────────────────────────────
export async function chercher(
  vin: string
): Promise<{ marqueModele: string; part: number; annees: Array<[number, number]> } | null> {
  const db = getPrisma()
  const sig8 = signatureVin(vin)
  const sig6 = signature6(vin)

  let signature = sig8
  let lignes = await db.vinIndex.findMany({ where: { signature: sig8 }, orderBy: { nbVus: 'desc' } })
  if (lignes.length === 0) {
    signature = sig6
    lignes = await db.vinIndex.findMany({ where: { signature: sig6 }, orderBy: { nbVus: 'desc' } })
  }
  if (lignes.length === 0) return null

  const top = lignes[0]
  const somme = lignes.reduce((s, l) => s + l.nbVus, 0)
  const anneesLignes = await db.vinIndexAnnee.findMany({
    where: { signature },
    orderBy: { annee: 'asc' },
  })

  return {
    marqueModele: top.marqueModele,
    part: somme > 0 ? top.nbVus / somme : 0,
    annees: anneesLignes.map((a): [number, number] => [a.annee, a.nb]),
  }
}

// ── Import du seed pré-calculé (une seule fois, flag Parametre) ─────────────
async function creerParLots<T>(lignes: T[], inserer: (lot: T[]) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < lignes.length; i += TAILLE_LOT) {
    await inserer(lignes.slice(i, i + TAILLE_LOT))
  }
}

export async function importerSeed(): Promise<{ importe: boolean; lignes: number }> {
  const db = getPrisma()
  const deja = await db.parametre.findUnique({ where: { cle: FLAG_SEED_IMPORTE } })
  if (deja) return { importe: false, lignes: 0 }

  const indexRows: Array<{ signature: string; marqueModele: string; nbVus: number; source: string }> = []
  const anneeRows: Array<{ signature: string; annee: number; nb: number }> = []

  for (const table of [seed.sig8, seed.sig6]) {
    for (const [signature, entree] of Object.entries(table ?? {})) {
      for (const [label, count] of entree.mm ?? []) {
        if (libelleAcceptable(label)) {
          indexRows.push({ signature, marqueModele: label.trim(), nbVus: count, source: 'seed' })
        }
      }
      for (const [annee, nb] of entree.an ?? []) {
        if (anneePlausible(annee)) anneeRows.push({ signature, annee, nb })
      }
    }
  }

  // Pas de skipDuplicates (non supporté par le connecteur SQLite) : sans
  // risque ici, le flag Parametre garantit un import unique et les clés
  // (signature, marqueModele) / (signature, annee) sont déjà dédoublonnées
  // à la génération du seed (Phase 1).
  await creerParLots(indexRows, lot => db.vinIndex.createMany({ data: lot }))
  await creerParLots(anneeRows, lot => db.vinIndexAnnee.createMany({ data: lot }))

  await db.parametre.upsert({
    where: { cle: FLAG_SEED_IMPORTE },
    create: { cle: FLAG_SEED_IMPORTE, valeur: new Date().toISOString() },
    update: { valeur: new Date().toISOString() },
  })

  return { importe: true, lignes: indexRows.length + anneeRows.length }
}

// ── Apprentissage depuis la base existante (démarrage) ───────────────────────
export async function semer(): Promise<number> {
  const db = getPrisma()
  const lignes = await db.enregistrement.findMany({ select: { vin: true, marqueModele: true } })
  let traites = 0
  for (const l of lignes) {
    if (!libelleAcceptable(l.marqueModele)) continue
    await apprendre(l.vin, l.marqueModele, 0, 'saisie')
    traites++
  }
  return traites
}
