// ─────────────────────────────────────────────────────────────────────────────
// Décodeur de numéro de châssis (VIN) — HORS LIGNE.
// Décode la structure normalisée ISO 3779 : WMI (1-3) + VDS (4-9, chiffre de
// contrôle en 9) + VIS (10-17, année=10, usine=11, série=12-17). La CATÉGORIE
// (Voiture/Camion/Autre) est une SUGGESTION : sûre pour les constructeurs
// exclusivement poids lourds, « à confirmer » pour les constructeurs mixtes.
// (Une version en ligne NHTSA vPIC pourra affiner plus tard.)
// ─────────────────────────────────────────────────────────────────────────────

export type Categorie = 'Voiture' | 'Camion' | 'Autre'
export type Confiance = 'élevée' | 'moyenne' | 'faible'

export interface ResultatVin {
  vin: string
  source: 'local' | 'en ligne'
  structureValide: boolean          // 17 car., charset VIN, pas de I/O/Q
  raisonInvalide: string | null     // renseigné seulement si structure invalide
  chiffreControleRequis: boolean    // WMI nord-américain (1re lettre 1-5)
  chiffreControleOk: boolean        // le chiffre pos.9 correspond
  noteControle: string              // message secondaire (jamais bloquant)
  wmi: string
  constructeur: string
  modele: string                    // marque+modèle nettoyés depuis l'index (Phase 3), '—' si non trouvé
  confianceModele?: number          // fiabilité du hit d'index (idx.part, 0-1) — distincte de `confiance` (catégorie)
  pays: string
  annee: string
  anneeSource: 'position10' | 'signature' | 'aucune'  // provenance de l'année affichée
  usine: string
  serie: string
  categorie: Categorie | null
  confiance: Confiance
  raisonCategorie: string
}

interface InfoWmi { constructeur: string; pays: string; categorie?: Categorie; confiance?: Confiance }

// Table curatée (contexte transit ouest-africain). Clé = WMI (3 car.) OU préfixe
// plus long (prioritaire). Catégorie renseignée seulement quand pertinent.
const WMI_TABLE: Record<string, InfoWmi> = {
  // ── POIDS LOURDS exclusifs → Camion (confiance élevée) ──
  WMA: { constructeur: 'MAN Truck & Bus', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
  XLR: { constructeur: 'DAF Trucks', pays: 'Pays-Bas', categorie: 'Camion', confiance: 'élevée' },
  XLD: { constructeur: 'DAF Trucks', pays: 'Pays-Bas', categorie: 'Camion', confiance: 'élevée' },
  YS2: { constructeur: 'Scania', pays: 'Suède', categorie: 'Camion', confiance: 'élevée' },
  XLE: { constructeur: 'Scania', pays: 'Pays-Bas', categorie: 'Camion', confiance: 'élevée' },
  YV2: { constructeur: 'Volvo Trucks', pays: 'Suède', categorie: 'Camion', confiance: 'élevée' },
  YB1: { constructeur: 'Volvo Trucks (Gand)', pays: 'Belgique', categorie: 'Camion', confiance: 'élevée' },
  VF6: { constructeur: 'Renault Trucks', pays: 'France', categorie: 'Camion', confiance: 'élevée' },
  ZCF: { constructeur: 'Iveco', pays: 'Italie', categorie: 'Camion', confiance: 'élevée' },
  WJM: { constructeur: 'Iveco', pays: 'Italie', categorie: 'Camion', confiance: 'élevée' },
  // Mercedes poids lourds (préfixes longs prioritaires)
  WDB963: { constructeur: 'Mercedes-Benz (Actros)', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
  WDB934: { constructeur: 'Mercedes-Benz (Axor)', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
  WDB930: { constructeur: 'Mercedes-Benz (Atego)', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
  // ── MERCEDES (mixte, sinon à confirmer) ──
  WDB: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
  WDC: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
  WDD: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
  W1K: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
  W1N: { constructeur: 'Mercedes-Benz (SUV)', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
  WDF: { constructeur: 'Mercedes-Benz (Sprinter)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
  W1V: { constructeur: 'Mercedes-Benz (Sprinter)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
  // ── TOYOTA (usines) ──
  JTD: { constructeur: 'Toyota', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  JTN: { constructeur: 'Toyota', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  JTM: { constructeur: 'Toyota (SUV)', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  JTE: { constructeur: 'Toyota (4x4)', pays: 'Japon' },
  JTF: { constructeur: 'Toyota (Hiace)', pays: 'Japon', categorie: 'Autre', confiance: 'moyenne' },
  JTG: { constructeur: 'Toyota (Coaster/bus)', pays: 'Japon', categorie: 'Autre', confiance: 'moyenne' },
  JTL: { constructeur: 'Toyota', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  SB1: { constructeur: 'Toyota (usine UK)', pays: 'Royaume-Uni', categorie: 'Voiture', confiance: 'moyenne' },
  VNK: { constructeur: 'Toyota (usine Turquie)', pays: 'Turquie', categorie: 'Voiture', confiance: 'moyenne' },
  NMT: { constructeur: 'Toyota (usine Turquie)', pays: 'Turquie', categorie: 'Voiture', confiance: 'moyenne' },
  MR0: { constructeur: 'Toyota (usine Thaïlande)', pays: 'Thaïlande' },
  MHF: { constructeur: 'Toyota (usine Indonésie)', pays: 'Indonésie' },
  AHT: { constructeur: 'Toyota (Hilux)', pays: 'Afrique du Sud', categorie: 'Camion', confiance: 'moyenne' },
  // ── LEXUS / DAIHATSU ──
  JTH: { constructeur: 'Lexus', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  // ── NISSAN ──
  JN1: { constructeur: 'Nissan', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  JN6: { constructeur: 'Nissan (utilitaire)', pays: 'Japon', categorie: 'Autre', confiance: 'moyenne' },
  VSK: { constructeur: 'Nissan (usine Espagne)', pays: 'Espagne' },
  VWA: { constructeur: 'Nissan (usine UK)', pays: 'Royaume-Uni', categorie: 'Voiture', confiance: 'moyenne' },
  // ── HONDA ──
  JHM: { constructeur: 'Honda', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  JHL: { constructeur: 'Honda (SUV)', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  SHH: { constructeur: 'Honda (usine UK)', pays: 'Royaume-Uni', categorie: 'Voiture', confiance: 'moyenne' },
  // ── CORÉE ──
  KMH: { constructeur: 'Hyundai', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
  KMF: { constructeur: 'Hyundai (utilitaire)', pays: 'Corée du Sud', categorie: 'Camion', confiance: 'moyenne' },
  TMA: { constructeur: 'Hyundai (usine Tchéquie)', pays: 'Tchéquie', categorie: 'Voiture', confiance: 'moyenne' },
  KNA: { constructeur: 'Kia', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
  KNB: { constructeur: 'Kia', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
  KND: { constructeur: 'Kia (SUV)', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
  U5Y: { constructeur: 'Kia (usine Slovaquie)', pays: 'Slovaquie', categorie: 'Voiture', confiance: 'moyenne' },
  KL:  { constructeur: 'GM Korea / Daewoo', pays: 'Corée du Sud' },
  // ── FRANCE (PSA / Renault / Dacia) ──
  VF1: { constructeur: 'Renault', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
  VF7: { constructeur: 'Citroën', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
  VF3: { constructeur: 'Peugeot', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
  UU1: { constructeur: 'Dacia', pays: 'Roumanie', categorie: 'Voiture', confiance: 'moyenne' },
  VF8: { constructeur: 'Matra/DS', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
  // ── VW GROUP ──
  WVW: { constructeur: 'Volkswagen', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
  WVG: { constructeur: 'Volkswagen (SUV)', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
  WV1: { constructeur: 'Volkswagen (utilitaire)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
  WV2: { constructeur: 'Volkswagen (Transporter)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
  WAU: { constructeur: 'Audi', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
  TMB: { constructeur: 'Škoda', pays: 'Tchéquie', categorie: 'Voiture', confiance: 'moyenne' },
  VSS: { constructeur: 'SEAT', pays: 'Espagne', categorie: 'Voiture', confiance: 'moyenne' },
  // ── BMW ──
  WBA: { constructeur: 'BMW', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
  WBS: { constructeur: 'BMW M', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
  WBY: { constructeur: 'BMW i', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
  // ── FORD ──
  WF0: { constructeur: 'Ford (Europe)', pays: 'Allemagne' },
  MAJ: { constructeur: 'Ford (usine Inde)', pays: 'Inde' },
  // ── FIAT ──
  ZFA: { constructeur: 'Fiat', pays: 'Italie', categorie: 'Voiture', confiance: 'moyenne' },
  ZFC: { constructeur: 'Fiat (utilitaire)', pays: 'Italie', categorie: 'Autre', confiance: 'moyenne' },
  // ── JAPON divers ──
  JMB: { constructeur: 'Mitsubishi', pays: 'Japon' },
  MMB: { constructeur: 'Mitsubishi', pays: 'Thaïlande' },
  MMT: { constructeur: 'Mitsubishi (Triton/pick-up)', pays: 'Thaïlande', categorie: 'Camion', confiance: 'moyenne' },
  MPA: { constructeur: 'Isuzu (D-Max)', pays: 'Thaïlande', categorie: 'Camion', confiance: 'moyenne' },
  MP1: { constructeur: 'Isuzu (D-Max)', pays: 'Thaïlande', categorie: 'Camion', confiance: 'moyenne' },
  JAL: { constructeur: 'Isuzu (camion)', pays: 'Japon', categorie: 'Camion', confiance: 'moyenne' },
  JAA: { constructeur: 'Isuzu (camion)', pays: 'Japon', categorie: 'Camion', confiance: 'moyenne' },
  JS3: { constructeur: 'Suzuki', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  JM1: { constructeur: 'Mazda', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  JF1: { constructeur: 'Subaru', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  // ── HINO / camions japonais ──
  JHD: { constructeur: 'Hino (camion)', pays: 'Japon', categorie: 'Camion', confiance: 'élevée' },
}

// Région d'origine par 1ère lettre du WMI (indicatif, si constructeur inconnu)
const REGIONS: Array<[RegExp, string]> = [
  [/^[A-H]/, 'Afrique'], [/^[J-R]/, 'Asie'], [/^[S-Z]/, 'Europe'],
  [/^[1-5]/, 'Amérique du Nord'], [/^[6-7]/, 'Océanie'], [/^[8-9]/, 'Amérique du Sud'],
]

// Valeurs de translittération pour le chiffre de contrôle
const TRANSLIT: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
}
const POIDS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

/** Chiffre de contrôle attendu (position 9) : 0-9 ou 'X' (=10). */
function chiffreControle(vin: string): string {
  let somme = 0
  for (let i = 0; i < 17; i++) somme += (TRANSLIT[vin[i]] ?? 0) * POIDS[i]
  const r = somme % 11
  return r === 10 ? 'X' : String(r)
}

// Année-modèle (position 10) — deux cycles de 30 ans : « ancien » (1980-2009)
// et « récent » (2010-2039). Le code seul est structurellement ambigu entre
// les deux cycles ; choisirAnnee() lève l'ambiguïté (cf. commentaire associé).
const LET_AN = 'ABCDEFGHJKLMNPRSTVWXY'.split('')
function tableAn(base: number): Record<string, number> {
  const t: Record<string, number> = {}
  LET_AN.forEach((l, i) => { t[l] = base + i })
  for (let d = 1; d <= 9; d++) t[String(d)] = base + 21 + (d - 1)
  return t
}
const AN_ANCIEN = tableAn(1980)
const AN_RECENT = tableAn(2010)

/** VIN nord-américain (WMI 1re lettre 1-5) : la position 10 seule y est fiable (99 %). */
export function estAmeriqueNord(vin: string): boolean { return /^[1-5]/.test(vin) }

/** Années candidates (un ou deux cycles) pour un code de position 10 donné. */
export function anneesCandidates(code: string): number[] {
  return [AN_ANCIEN[code], AN_RECENT[code]].filter(Boolean) as number[]
}

/** Médiane PONDÉRÉE d'un histogramme [[année, compte], …] (aplatit puis médiane simple). */
function medianePonderee(hist: Array<[number, number]>): number | null {
  const plat: number[] = []
  for (const [an, nb] of hist) for (let i = 0; i < nb; i++) plat.push(an)
  if (!plat.length) return null
  plat.sort((a, b) => a - b)
  return plat[Math.floor(plat.length / 2)]
}

/**
 * Règle année PROUVÉE (mesurée sur 100k châssis réels, cf. plan Phase 3) :
 *  - VIN nord-américain (WMI 1-5, 14 % du parc) → position 10 seule (99 % exact),
 *    désambiguïsée entre les deux cycles par la position 7 (lettre → cycle
 *    récent 2010-2039, chiffre → cycle ancien 1980-2009).
 *  - Sinon (85 % du parc) → médiane pondérée de l'histogramme d'années de la
 *    signature ; la position 10 sert d'appoint SEULEMENT si un de ses candidats
 *    tombe dans la plage observée (désambiguïsation, pas une source à elle seule).
 * `annees` = histogramme de la signature (peut être vide — ex. décodage
 * synchrone sans index consulté), auquel cas la branche hors-NA répond
 * honnêtement 'aucune' plutôt que de deviner.
 */
export function choisirAnnee(
  vin: string,
  annees: Array<[number, number]>
): { annee: string; source: 'position10' | 'signature' | 'aucune' } {
  const code = vin[9] ?? ''
  const posNA = estAmeriqueNord(vin)
  // Amérique du Nord : position 10 fiable (désambiguïsée par pos.7)
  if (posNA) {
    const rec = /[A-Z]/.test(vin[6] ?? '')
    let an = (rec ? AN_RECENT : AN_ANCIEN)[code]
    if (an && an > new Date().getFullYear() + 1) an = AN_ANCIEN[code]
    return an ? { annee: String(an), source: 'position10' } : { annee: '—', source: 'aucune' }
  }
  // Hors NA : s'appuyer sur la signature
  const med = medianePonderee(annees)
  if (med != null) {
    const min = Math.min(...annees.map(a => a[0])), max = Math.max(...annees.map(a => a[0]))
    const dansPlage = anneesCandidates(code).filter(y => y >= min - 1 && y <= max + 1)
    if (dansPlage.length) {
      const an = dansPlage.reduce((b, y) => Math.abs(y - med) < Math.abs(b - med) ? y : b)
      return { annee: String(an), source: 'position10' }
    }
    return { annee: String(med), source: 'signature' }
  }
  return { annee: '—', source: 'aucune' } // hors NA, aucune info signature → honnête
}

/** Sépare et nettoie « TOYOTA - AVENSIS KOMBI 03-06 >> AVENSIS '03 » → { marque:'TOYOTA', modele:'AVENSIS' }. */
export function nettoyerLibelle(raw: string): { marque: string; modele: string } {
  let s = (raw || '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').trim()
  let marque = '', reste = s
  const i = s.indexOf(' - ')
  if (i >= 0) { marque = s.slice(0, i).trim(); reste = s.slice(i + 3).trim() }
  if (reste.includes('>>')) reste = reste.split('>>').pop()!.trim()   // forme courte après >>
  reste = reste.replace(/'\d{2}\b/g, '').replace(/\b\d{2}-\d{2}\b/g, '').replace(/\s+/g, ' ').trim() // ôte 'YY et gen-range
  return { marque, modele: reste }
}

const nettoyer = (v: string): string => v.trim().toUpperCase().replace(/\s+/g, '')

/** Cherche l'info constructeur : préfixe le plus long d'abord, sinon WMI (3 car.). */
function trouverInfo(vin: string): InfoWmi | null {
  for (let len = 6; len >= 3; len--) {
    const cle = vin.slice(0, len)
    if (WMI_TABLE[cle]) return WMI_TABLE[cle]
  }
  return null
}

export function decoderVin(brut: string): ResultatVin {
  const vin = nettoyer(brut)
  const base: ResultatVin = {
    vin, source: 'local', structureValide: false, raisonInvalide: null,
    chiffreControleRequis: /^[1-5]/.test(vin), chiffreControleOk: false, noteControle: '',
    wmi: vin.slice(0, 3), constructeur: 'Inconnu', modele: '—', pays: '—', annee: '—', anneeSource: 'aucune',
    usine: vin[10] ?? '—', serie: vin.slice(11), categorie: null, confiance: 'faible', raisonCategorie: '',
  }

  // Validation de STRUCTURE (seule bloquante)
  if (vin.length !== 17) { base.raisonInvalide = `Longueur ${vin.length}/17 caractères`; return base }
  if (/[IOQ]/.test(vin)) { base.raisonInvalide = 'Contient un caractère interdit (I, O ou Q)'; return base }
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(vin)) { base.raisonInvalide = 'Caractères non valides'; return base }
  base.structureValide = true

  // Chiffre de contrôle — informatif (obligatoire seulement en Amérique du Nord)
  const attendu = chiffreControle(vin)
  base.chiffreControleOk = vin[8] === attendu
  base.noteControle = base.chiffreControleOk
    ? 'Chiffre de contrôle conforme.'
    : base.chiffreControleRequis
      ? `Chiffre de contrôle incorrect (« ${vin[8]} » ≠ « ${attendu} ») — VIN nord-américain suspect.`
      : 'Chiffre de contrôle non applicable (VIN hors Amérique du Nord).'

  // Structure : constructeur / pays (inchangé)
  const info = trouverInfo(vin)
  if (info) { base.constructeur = info.constructeur; base.pays = info.pays }
  else { base.pays = REGIONS.find(([re]) => re.test(vin))?.[1] ?? '—' }

  // Année — règle NA/signature (recette mesurée). Décodage synchrone : aucun
  // historique de signature disponible ici (l'index est consulté à part, en
  // async, par DecodeurVinWindow) ; seule la branche Amérique du Nord (position
  // 10 seule) peut donc aboutir à ce stade.
  const { annee, source } = choisirAnnee(vin, [])
  base.annee = annee
  base.anneeSource = source

  // Catégorie suggérée (inchangé)
  if (info?.categorie) {
    base.categorie = info.categorie
    base.confiance = info.confiance ?? 'moyenne'
    base.raisonCategorie = base.confiance === 'élevée'
      ? `Constructeur ${info.constructeur} (WMI « ${vin.slice(0, 3)} »)`
      : `Basé sur le constructeur ${info.constructeur} — à confirmer`
  } else {
    base.raisonCategorie = info
      ? `Constructeur mixte (${info.constructeur}) — catégorie à confirmer par l'opérateur`
      : 'Constructeur non répertorié — catégorie à confirmer'
  }
  return base
}

/** Zones colorées pour l'affichage caractère par caractère. */
export function zoneVin(position: number): 'wmi' | 'vds' | 'vis' {
  if (position < 3) return 'wmi'
  if (position < 9) return 'vds'
  return 'vis'
}
