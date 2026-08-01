// ─────────────────────────────────────────────────────────────────────────────
// Harnais de mesure — Décodeur VIN (Phase 5 du plan
// docs/superpowers/plans/2026-08-01-decodeur-vin-efficacite.md).
//
// Mesure le taux réel Marque + Modèle + Année sur le corpus de ~100k châssis,
// en TRAIN/TEST (index construit sur 80 % des VIN, évalué sur les 20 %
// restants — jamais vus pendant la construction de l'index), en appelant la
// VRAIE logique livrée du décodeur : `choisirAnnee` et `nettoyerLibelle` sont
// IMPORTÉES depuis src/renderer/src/mock/vinDecoder.ts (pas réécrites ici),
// pour mesurer exactement ce que l'app livre.
//
// N'importe PAS src/main/vinIndex.ts (async, tire Prisma/SQLite) : la
// "signature" qu'il consulte est triviale (vin.slice(0,8), repli
// vin.slice(0,6) — cf. `signatureVin`/`signature6`) et recalculée ici
// directement sur le CSV, en mémoire, dans le même ordre de priorité
// (sig8 d'abord, sig6 en repli — cf. src/main/vinIndex.ts `chercher()`).
//
// ── COMMANDE D'EXÉCUTION RETENUE (testée sur ce poste, fonctionne) ──────────
//
//     npx tsx scripts/vin-benchmark.mjs
//
// Pourquoi tsx et pas vite-node (pourtant suggéré en premier, déjà tiré par
// vitest en dépendance transitive) : `npx vite-node scripts/vin-benchmark.mjs`
// échoue systématiquement ici avec `ERR_MODULE_NOT_FOUND` / `ERR_LOAD_URL` en
// essayant de résoudre l'import relatif de vinDecoder.ts, alors que le fichier
// existe bel et bien — le chemin du projet contient un espace
// (« F:\AI PROJECTS\STCA-Electron\... ») qui casse la résolution d'URL de
// Vite/vite-node pour un import hors du dossier du script. `tsx` (esbuild,
// sans serveur de dev ni résolution par URL de module) importe le .ts réel
// sans problème — c'est la commande retenue et documentée ci-dessus.
//
// Prérequis : scripts/echantillon.csv présent en local (gitignored, cf. Phase 1
// — colonnes `vin,marque,modele,annee,vehicule`, CSV quoté RFC4180 : le champ
// `modele` peut contenir des virgules, ex. `"SPRINTER ... 3,5T 00"`). Parsé ici
// avec `csv-parse` (déjà une dépendance du projet) plutôt qu'un split naïf.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'
import { choisirAnnee, nettoyerLibelle } from '../src/renderer/src/mock/vinDecoder.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH = path.join(__dirname, 'echantillon.csv')

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/
const CIBLE = 0.6
const REPERE_ATTENDU = 0.77

// ── 1. Parse CSV robuste (guillemets, virgules/guillemets échappés dans `modele`) ──
if (!fs.existsSync(CSV_PATH)) {
  console.error(`Corpus introuvable : ${CSV_PATH}`)
  console.error('Fichier gitignored — le déposer en local (scripts/echantillon.csv) avant de lancer le harnais.')
  process.exit(1)
}
const brut = fs.readFileSync(CSV_PATH, 'utf8')
const enregistrements = parse(brut, { columns: true, skip_empty_lines: true, relax_column_count: true })

const lignes = []
for (const r of enregistrements) {
  const vin = String(r.vin || '').trim().toUpperCase()
  if (!VIN_RE.test(vin)) continue
  const marque = String(r.marque || '').trim()
  const modele = String(r.modele || '').trim()
  const anneeNum = parseInt(String(r.annee || '').trim(), 10)
  lignes.push({ vin, marque, modele, annee: Number.isFinite(anneeNum) ? anneeNum : null })
}

// ── 2. Split 80/20 STABLE (hash MD5 du VIN — indépendant de l'ordre du fichier) ──
function hashMd5(vin) {
  const hex = crypto.createHash('md5').update(vin).digest('hex')
  return parseInt(hex.slice(0, 8), 16) // 32 bits suffisent pour un modulo 5
}
const estTest = (vin) => hashMd5(vin) % 5 === 0

const train = []
const test = []
for (const l of lignes) (estTest(l.vin) ? test : train).push(l)

// ── 3. Construire l'index depuis le TRAIN uniquement (sig8 + repli sig6) ──
// Même construction de libellé que scripts/gen-vin-seed.py (`Marque - Modele`,
// les deux nettoyés/joints) — le libellé BRUT est stocké dans l'index, exactement
// comme idx.marqueModele en prod ; nettoyerLibelle() n'intervient qu'à la lecture
// (cf. src/renderer/src/pages/DecodeurVinWindow.tsx : `nettoyerLibelle(idx.marqueModele)`).
function libelle(marque, modele) {
  return [marque, modele].filter(Boolean).join(' - ').trim()
}

function nouvelleEntree() {
  return { labels: new Map(), annees: new Map() } // valeur -> compte
}
const sig8 = new Map() // signature (8 car.) -> entrée
const sig6 = new Map() // signature (6 car.) -> entrée

function compter(index, sig, label, annee) {
  let e = index.get(sig)
  if (!e) { e = nouvelleEntree(); index.set(sig, e) }
  if (label) e.labels.set(label, (e.labels.get(label) || 0) + 1)
  if (annee != null) e.annees.set(annee, (e.annees.get(annee) || 0) + 1)
}

for (const l of train) {
  const lib = libelle(l.marque, l.modele)
  compter(sig8, l.vin.slice(0, 8), lib, l.annee)
  compter(sig6, l.vin.slice(0, 6), lib, l.annee)
}

function majoritaire(labels) {
  let meilleur = null
  let meilleurCompte = -1
  for (const [label, compte] of labels) if (compte > meilleurCompte) { meilleur = label; meilleurCompte = compte }
  return meilleur
}
function histogramme(annees) {
  return [...annees.entries()].sort((a, b) => a[0] - b[0])
}

// ── 4. Matching flou marque/modèle : normalise casse/accents/ponctuation,
//       accepte l'inclusion ou un recouvrement de jetons ≥ 0.5 ──
function normaliser(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // accents
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ') // ponctuation -> espace
    .trim()
    .replace(/\s+/g, ' ')
}
function correspondFloue(a, b) {
  const na = normaliser(a)
  const nb = normaliser(b)
  if (!na || !nb) return false
  if (na === nb || na.includes(nb) || nb.includes(na)) return true
  const ta = new Set(na.split(' '))
  const tb = new Set(nb.split(' '))
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  return inter / Math.min(ta.size, tb.size) >= 0.5
}

// ── 5. Évaluer sur le TEST (jamais vus pendant la construction de l'index) ──
let nSig8 = 0, nSig6Repli = 0, nAucune = 0
let nMarque = 0, nModele = 0, nMarqueModele = 0
let nAnneeExacte = 0, nAnneePm1 = 0, nTriple = 0

for (const l of test) {
  const s8 = l.vin.slice(0, 8)
  const s6 = l.vin.slice(0, 6)
  let entree = sig8.get(s8)
  if (entree) nSig8++
  else {
    entree = sig6.get(s6)
    if (entree) nSig6Repli++
    else nAucune++
  }

  // Libellé prédit = majoritaire de sig8, sinon sig6 ; nettoyé par la VRAIE fonction.
  const libellePredit = entree ? majoritaire(entree.labels) : ''
  const pred = nettoyerLibelle(libellePredit || '')
  // Vérité terrain : même construction de libellé, nettoyée par la même fonction
  // (comparaison juste — les deux côtés passent par nettoyerLibelle).
  const vraie = nettoyerLibelle(libelle(l.marque, l.modele))

  const marqueOk = correspondFloue(pred.marque, vraie.marque)
  const modeleOk = correspondFloue(pred.modele, vraie.modele)
  if (marqueOk) nMarque++
  if (modeleOk) nModele++
  const mmOk = marqueOk && modeleOk
  if (mmOk) nMarqueModele++

  // Année prédite = VRAIE fonction choisirAnnee(vin, histogramme des années du TRAIN
  // pour la signature qui a matché — même signature que le libellé ci-dessus).
  const histAnnees = entree ? histogramme(entree.annees) : []
  const { annee: anneePrediteStr } = choisirAnnee(l.vin, histAnnees)
  const anneePredite = parseInt(anneePrediteStr, 10)
  let exacte = false
  let pm1 = false
  if (Number.isFinite(anneePredite) && l.annee != null) {
    const diff = Math.abs(anneePredite - l.annee)
    exacte = diff === 0
    pm1 = diff <= 1
  }
  if (exacte) nAnneeExacte++
  if (pm1) nAnneePm1++
  if (mmOk && pm1) nTriple++
}

// ── 6. Rapport ──
const nTest = test.length
const pct = (n) => (nTest ? ((100 * n) / nTest).toFixed(1) : '0.0')
const fmt = (n) => `${pct(n)} % (${n}/${nTest})`

console.log('═'.repeat(78))
console.log('  HARNAIS DE MESURE — Décodeur VIN (train/test 80/20, logique réelle livrée)')
console.log('═'.repeat(78))
console.log(`Corpus                        : ${CSV_PATH}`)
console.log(`VIN valides (regex 17 car.)   : ${lignes.length}`)
console.log(`  Train (80 %, indexé)        : ${train.length}`)
console.log(`  Test  (20 %, jamais vus)    : ${nTest}`)
console.log('')
console.log('Couverture signature (sur le test, index = TRAIN uniquement) :')
console.log(`  sig8 (positions 1-8)          : ${fmt(nSig8)}`)
console.log(`  sig8 + repli sig6             : ${fmt(nSig8 + nSig6Repli)}`)
console.log(`  Aucune signature connue       : ${fmt(nAucune)}`)
console.log('')
console.log('Résultats (choisirAnnee + nettoyerLibelle RÉELLES, importées de vinDecoder.ts) :')
console.log(`  Marque                          : ${fmt(nMarque)}`)
console.log(`  Modèle                          : ${fmt(nModele)}`)
console.log(`  Marque + Modèle                 : ${fmt(nMarqueModele)}`)
console.log(`  Année exacte                    : ${fmt(nAnneeExacte)}`)
console.log(`  Année ±1                        : ${fmt(nAnneePm1)}`)
console.log(`  TRIPLE (Marque+Modèle+Année±1)  : ${fmt(nTriple)}   ← métrique cible`)
console.log('')
console.log(`Cible plan     : ≥ ${(CIBLE * 100).toFixed(0)} %`)
console.log(`Repère attendu : ~${(REPERE_ATTENDU * 100).toFixed(0)} % (Marque ~99 %, Modèle ~93 %, Année ±1 ~79 %) — mesuré en amont (feasibility)`)
const triplePct = nTest ? nTriple / nTest : 0
console.log(`Statut         : ${triplePct >= CIBLE ? '>>> CIBLE ATTEINTE' : '>>> CIBLE NON ATTEINTE'} (TRIPLE = ${pct(nTriple)} %)`)
console.log('═'.repeat(78))
