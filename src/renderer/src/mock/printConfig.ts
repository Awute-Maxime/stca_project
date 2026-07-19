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

export interface Calibrage { dx: number; dy: number } // mm (négatif = gauche/haut

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
    cg: { dx: 0, dy: 0 },
    ficheId: { dx: 0, dy: 0 },
    feuillet1: { dx: 0, dy: 0 },
    feuillet2: { dx: 0, dy: 0 },
    feuillet3: { dx: 0, dy: 0 },
  },
}

export function getConfigImpression(): ConfigImpression {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<ConfigImpression>
      return {
        ...DEFAUT,
        ...p,
        imprimantes: { ...DEFAUT.imprimantes, ...p.imprimantes },
        calibrage: { ...DEFAUT.calibrage, ...p.calibrage },
      }
    }
  } catch { /* défauts */ }
  return DEFAUT
}

export function setConfigImpression(cfg: ConfigImpression): void {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg))
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

/** Calibrage d'un document pré-imprimé (décalage global en mm). */
export function getCalibrage(doc: DocCalibrable): Calibrage {
  return getConfigImpression().calibrage[doc] ?? { dx: 0, dy: 0 }
}
