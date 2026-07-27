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
  valide: boolean
  raisonInvalide: string | null
  wmi: string
  constructeur: string
  pays: string
  annee: string
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
  // Constructeurs POIDS LOURDS exclusifs → Camion (confiance élevée)
  WMA: { constructeur: 'MAN Truck & Bus', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
  XLR: { constructeur: 'DAF Trucks', pays: 'Pays-Bas', categorie: 'Camion', confiance: 'élevée' },
  YS2: { constructeur: 'Scania', pays: 'Suède', categorie: 'Camion', confiance: 'élevée' },
  XLE: { constructeur: 'Scania', pays: 'Pays-Bas', categorie: 'Camion', confiance: 'élevée' },
  YV2: { constructeur: 'Volvo Trucks', pays: 'Suède', categorie: 'Camion', confiance: 'élevée' },
  VF6: { constructeur: 'Renault Trucks', pays: 'France', categorie: 'Camion', confiance: 'élevée' },
  ZCF: { constructeur: 'Iveco', pays: 'Italie', categorie: 'Camion', confiance: 'élevée' },
  // Mercedes : mixte (berlines + Sprinter + Actros) — à confirmer, sauf WDB963x = Actros
  WDB963: { constructeur: 'Mercedes-Benz (Actros)', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
  WDB934: { constructeur: 'Mercedes-Benz (Axor)', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
  WDB: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
  WDC: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
  WDD: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
  WDF: { constructeur: 'Mercedes-Benz (Sprinter)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
  // Toyota : mixte
  JTD: { constructeur: 'Toyota', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  JTN: { constructeur: 'Toyota', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  JTE: { constructeur: 'Toyota (4x4)', pays: 'Japon' },
  JTF: { constructeur: 'Toyota (Hiace)', pays: 'Japon', categorie: 'Autre', confiance: 'moyenne' },
  MR0: { constructeur: 'Toyota', pays: 'Thaïlande' },
  NMT: { constructeur: 'Toyota', pays: 'Turquie', categorie: 'Voiture', confiance: 'moyenne' },
  // Nissan
  JN1: { constructeur: 'Nissan', pays: 'Japon' },
  // Corée
  KMH: { constructeur: 'Hyundai', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
  KMF: { constructeur: 'Hyundai (utilitaire)', pays: 'Corée du Sud', categorie: 'Camion', confiance: 'moyenne' },
  KNA: { constructeur: 'Kia', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
  KND: { constructeur: 'Kia (SUV)', pays: 'Corée du Sud' },
  // Europe / autres passagers
  JHM: { constructeur: 'Honda', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
  VF1: { constructeur: 'Renault', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
  VF3: { constructeur: 'Peugeot', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
  WVW: { constructeur: 'Volkswagen', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
  WV1: { constructeur: 'Volkswagen (utilitaire)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
  WV2: { constructeur: 'Volkswagen (Transporter)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
  JMB: { constructeur: 'Mitsubishi', pays: 'Japon' },
  MMB: { constructeur: 'Mitsubishi', pays: 'Thaïlande' },
  MPA: { constructeur: 'Isuzu (D-Max)', pays: 'Thaïlande' },
  JAL: { constructeur: 'Isuzu (camion)', pays: 'Japon', categorie: 'Camion', confiance: 'moyenne' },
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

// Année-modèle (position 10). Lettres = 2010-2039 ; chiffres = 2001-2009.
const ANNEES: Record<string, number> = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017, J: 2018,
  K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025, T: 2026, V: 2027,
  W: 2028, X: 2029, Y: 2030, '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
  '6': 2006, '7': 2007, '8': 2008, '9': 2009,
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
    vin, valide: false, raisonInvalide: null, wmi: vin.slice(0, 3),
    constructeur: 'Inconnu', pays: '—', annee: '—', usine: vin[10] ?? '—',
    serie: vin.slice(11), categorie: null, confiance: 'faible', raisonCategorie: '',
  }

  // Validation
  if (vin.length !== 17) { base.raisonInvalide = `Longueur ${vin.length}/17 caractères`; return base }
  if (/[IOQ]/.test(vin)) { base.raisonInvalide = 'Contient un caractère interdit (I, O ou Q)'; return base }
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(vin)) { base.raisonInvalide = 'Caractères non valides'; return base }
  const attendu = chiffreControle(vin)
  base.valide = vin[8] === attendu
  if (!base.valide) base.raisonInvalide = `Chiffre de contrôle (pos. 9) incorrect : « ${vin[8]} » au lieu de « ${attendu} »`

  // Structure
  const info = trouverInfo(vin)
  if (info) { base.constructeur = info.constructeur; base.pays = info.pays }
  else { base.pays = REGIONS.find(([re]) => re.test(vin))?.[1] ?? '—' }
  base.annee = ANNEES[vin[9]] ? String(ANNEES[vin[9]]) : '—'

  // Catégorie suggérée
  if (info?.categorie) {
    base.categorie = info.categorie
    base.confiance = info.confiance ?? 'moyenne'
    base.raisonCategorie = base.confiance === 'élevée'
      ? `Constructeur ${info.constructeur} (WMI « ${vin.slice(0, 3)} »)`
      : `Basé sur le constructeur ${info.constructeur} — à confirmer`
  } else {
    base.categorie = null
    base.confiance = 'faible'
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
