// ─────────────────────────────────────────────────────────────────────────────
// Configuration des éditions et imprimantes (menu Outils+Config.) — persistée
// dans localStorage et partagée entre toutes les fenêtres :
// - une imprimante par document (comme le vrai STCA II),
// - type d'imprimante pour les feuillets 1/2 (rouleau/laser),
// - options d'édition (Fiche ID, nom d'état, code-barres facture),
// - CALIBRAGE des positions d'impression par document pré-imprimé :
//   décalage global dx/dy en millimètres appliqué à l'impression ET à
//   l'aperçu (pour compenser les marges d'entraînement de chaque imprimante).
// ─────────────────────────────────────────────────────────────────────────────

export type DocCalibrable = 'cg' | 'ficheId' | 'feuillet1' | 'feuillet2' | 'feuillet3'

// dx/dy : décalage en mm (négatif = gauche/haut).
// ex/ey : échelle d'impression en % (100 = taille réelle) — compense les
//         imprimantes qui étirent ou rétrécissent légèrement la page.
export interface Calibrage { dx: number; dy: number; ex: number; ey: number }

export const CALIBRAGE_NEUTRE: Calibrage = { dx: 0, dy: 0, ex: 100, ey: 100 }

// Dimensions physiques du papier de chaque document (mm) — modifiables dans
// Config. Imprimantes si le stock de pré-imprimés change de format un jour.
export interface DimensionsDoc { largeurMm: number; hauteurMm: number }

export const DIMENSIONS_DEFAUT: Record<DocCalibrable, DimensionsDoc> = {
  cg:        { largeurMm: 105, hauteurMm: 212 },   // Carte Grise 10,5 × 21,2 cm
  ficheId:   { largeurMm: 105, hauteurMm: 212 },   // Fiche ID jaune, même format
  feuillet1: { largeurMm: 282, hauteurMm: 75.1 },  // bande bleue 28,2 × 7,51 cm
  feuillet2: { largeurMm: 282, hauteurMm: 75.1 },  // bande rose, même format
  feuillet3: { largeurMm: 210, hauteurMm: 297 },   // A4 pré-imprimé
}

export interface ConfigImpression {
  imprimantes: {
    facture: string
    cg: string
    feuillet1: string
    feuillet2: string
    feuillet3: string
    ficheId: string
  }
  typeFeuillets12: 'rouleau' | 'laser'
  imprimerFicheId: boolean
  nomEtatCondPart: string
  factureAvecCodeBarre: boolean
  calibrage: Record<DocCalibrable, Calibrage>
  dimensions: Record<DocCalibrable, DimensionsDoc>
}

const LS_KEY = 'tcit_config_impression'
const LOCAL_EVENT = 'tcit:config-impression-changed'

const DEFAUT: ConfigImpression = {
  imprimantes: { facture: '', cg: '', feuillet1: '', feuillet2: '', feuillet3: '', ficheId: '' },
  typeFeuillets12: 'laser',
  imprimerFicheId: true,
  nomEtatCondPart: 'ETAT_AssuranceCondPartLaserA4',
  factureAvecCodeBarre: true,
  calibrage: {
    cg: { ...CALIBRAGE_NEUTRE },
    ficheId: { ...CALIBRAGE_NEUTRE },
    feuillet1: { ...CALIBRAGE_NEUTRE },
    feuillet2: { ...CALIBRAGE_NEUTRE },
    feuillet3: { ...CALIBRAGE_NEUTRE },
  },
  dimensions: {
    cg: { ...DIMENSIONS_DEFAUT.cg },
    ficheId: { ...DIMENSIONS_DEFAUT.ficheId },
    feuillet1: { ...DIMENSIONS_DEFAUT.feuillet1 },
    feuillet2: { ...DIMENSIONS_DEFAUT.feuillet2 },
    feuillet3: { ...DIMENSIONS_DEFAUT.feuillet3 },
  },
}

export function getConfigImpression(): ConfigImpression {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<ConfigImpression>
      // Fusion par document : les configs enregistrées avant l'échelle
      // d'impression (sans ex/ey) reçoivent les valeurs neutres.
      const calibrage = { ...DEFAUT.calibrage }
      const dimensions = { ...DEFAUT.dimensions }
      for (const doc of Object.keys(calibrage) as DocCalibrable[]) {
        calibrage[doc] = { ...CALIBRAGE_NEUTRE, ...p.calibrage?.[doc] }
        dimensions[doc] = { ...DIMENSIONS_DEFAUT[doc], ...p.dimensions?.[doc] }
      }
      return {
        ...DEFAUT,
        ...p,
        imprimantes: { ...DEFAUT.imprimantes, ...p.imprimantes },
        calibrage,
        dimensions,
      }
    }
  } catch { /* défauts */ }
  return DEFAUT
}

export function setConfigImpression(cfg: ConfigImpression): void {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg))
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

/** Calibrage d'un document pré-imprimé (décalage mm + échelle %). */
export function getCalibrage(doc: DocCalibrable): Calibrage {
  return getConfigImpression().calibrage[doc] ?? { ...CALIBRAGE_NEUTRE }
}

/** Dimensions physiques configurées du papier d'un document (mm). */
export function getDimensionsDoc(doc: DocCalibrable): DimensionsDoc {
  return getConfigImpression().dimensions[doc] ?? { ...DIMENSIONS_DEFAUT[doc] }
}

/** Style CSS du wrapper de calibrage appliqué dans chaque document. */
export function styleCalibrage(cal: Calibrage): import('react').CSSProperties {
  return {
    position: 'absolute',
    left: `${cal.dx}mm`,
    top: `${cal.dy}mm`,
    width: '100%',
    height: '100%',
    transform: `scale(${cal.ex / 100}, ${cal.ey / 100})`,
    transformOrigin: 'top left',
  }
}
