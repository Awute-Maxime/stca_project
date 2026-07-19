import dayjs from 'dayjs'
import type { MockVehicule } from '@mock/vehicules'
import type { CarteGriseData } from './CarteGrise'
import { type FactureData, MONTANT_ASSURANCE_FACTURE } from './Facture'
import type { FicheIdData } from './FicheId'
import type { Feuillet3Data } from './Feuillet3'
import type { Feuillet1Data } from './Feuillet1'
import type { Feuillet2Data } from './Feuillet2'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers partagés d'édition de documents (duplicata / renouvellement depuis
// la Liste ET la Recherche) : quels documents pour quel choix, données des
// documents à partir d'un véhicule, ouverture des fenêtres d'aperçu.
// Source unique — la Liste et la Recherche ne peuvent plus diverger.
// ─────────────────────────────────────────────────────────────────────────────

export type DocImp = 'facture' | 'cg' | 'ficheId' | 'feuillet1' | 'feuillet2' | 'feuillet3'

// Choix du modal EditionDocsModal (WinDialogs.DOC_OPTIONS) → documents inclus
export const DOCS_AVEC_CG      = ['tous', 'facture_cg', 'cg_fiche_id', 'uniq_cg']
export const DOCS_AVEC_FACTURE = ['tous', 'facture_cg', 'uniq_facture']
export const DOCS_AVEC_FICHEID = ['tous', 'cg_fiche_id', 'uniq_fiche_id']
export const DOCS_AVEC_FEUILLET3 = ['tous', 'toutes_assur', 'feuillet3']
export const DOCS_AVEC_FEUILLET1 = ['tous', 'toutes_assur', 'feuillet1']
export const DOCS_AVEC_FEUILLET2 = ['tous', 'toutes_assur', 'feuillet2']

/** Documents imprimables pour un choix (facture, carte grise, puis fiche ID — comme le vrai STCA). */
export function docsPourChoix(choix: string): DocImp[] {
  const docs: DocImp[] = []
  if (DOCS_AVEC_FACTURE.includes(choix)) docs.push('facture')
  if (DOCS_AVEC_CG.includes(choix)) docs.push('cg')
  if (DOCS_AVEC_FICHEID.includes(choix)) docs.push('ficheId')
  if (DOCS_AVEC_FEUILLET1.includes(choix)) docs.push('feuillet1')
  if (DOCS_AVEC_FEUILLET2.includes(choix)) docs.push('feuillet2')
  if (DOCS_AVEC_FEUILLET3.includes(choix)) docs.push('feuillet3')
  return docs
}

/** Données Carte Grise depuis un véhicule du store. */
export function cgDataDe(v: MockVehicule): CarteGriseData {
  return {
    immat: v.immat, destCode: v.destination, nom: v.nomAcheteur,
    adresse: v.paysResidence, numTri: v.numTri || '',
    dateTri: v.dateTri ? dayjs(v.dateTri).format('DD/MM/YYYY') : '',
    marque: v.marqueModele, chassis: v.chassis, parc: v.parc,
    dateDelivrance: dayjs(v.date).format('DD/MM/YYYY'),
  }
}

/** Données Facture depuis un véhicule du store. */
export function factureDataDe(v: MockVehicule): FactureData {
  return {
    factureNum: parseInt(v.ref, 10).toLocaleString('fr-FR'),
    dateEnreg: dayjs(v.date).format('DD/MM/YYYY'),
    nom: v.nomAcheteur, pays: v.paysDestination || v.paysResidence,
    destCode: v.destination, immat: v.immat, chassis: v.chassis,
    marque: v.marqueModele, natureVeh: v.typeVehicule,
    montantStca: v.montant, montantAssurance: MONTANT_ASSURANCE_FACTURE,
  }
}

/** Données Fiche ID jaune depuis un véhicule du store. */
export function ficheIdDataDe(v: MockVehicule): FicheIdData {
  return {
    nom: v.nomAcheteur, pays: v.paysDestination || v.paysResidence,
    chassis: v.chassis, marque: v.marqueModele, parc: v.parc,
    destCode: v.destination, immat: v.immat,
    numTri: v.numTri || '',
    dateTri: v.dateTri ? dayjs(v.dateTri).format('DD/MM/YYYY') : '',
  }
}

/** Immatriculation « Y9209 » → « Y 9209 ». */
function fmtImmatEspacee(immat: string): string {
  const m = immat.match(/^([A-Z]+)(\d+)$/i)
  return m ? `${m[1]} ${m[2]}` : immat
}

/** Données Feuillet N°3 Conditions Particulières depuis un véhicule du store. */
export function feuillet3DataDe(v: MockVehicule, mention = ''): Feuillet3Data {
  const effet = dayjs(v.date)
  return {
    numPolice: `1 - ${String(parseInt(v.ref, 10)).padStart(6, '0')} / ${effet.format('YYYYMMDD')}`,
    dateEffet: effet.format('DD/MM/YYYY'),
    dateEcheance: effet.add(14, 'day').format('DD/MM/YYYY'),
    parc: v.parc, nom: v.nomAcheteur,
    paysResidence: v.paysResidence, paysDestination: v.paysDestination || v.paysResidence,
    categorieUsage: v.typeVehicule, marque: v.marqueModele, chassis: v.chassis,
    immatStac: `TG WZ ${fmtImmatEspacee(v.immat)} ${v.destination}`,
    mention,
  }
}

/** Données Feuillet N°1 Assurance (Bleu) depuis un véhicule du store. */
export function feuillet1DataDe(v: MockVehicule): Feuillet1Data {
  const f3 = feuillet3DataDe(v)
  return {
    nom: v.nomAcheteur,
    numPolice: f3.numPolice,
    dateEffet: f3.dateEffet,
    dateEcheance: f3.dateEcheance,
    marque: v.marqueModele,
    immatStac: f3.immatStac,
    chassis: v.chassis,
  }
}

/** Données Feuillet N°2 Assurance (Rose) — mêmes champs que le N°1. */
export function feuillet2DataDe(v: MockVehicule): Feuillet2Data {
  return feuillet1DataDe(v)
}

const APERCU_IDS:  Record<DocImp, string> = { cg: 'apercu.carteGrise',      facture: 'apercu.facture',      ficheId: 'apercu.ficheId',      feuillet1: 'apercu.feuillet1',      feuillet2: 'apercu.feuillet2',      feuillet3: 'apercu.feuillet3' }
const APERCU_CLES: Record<DocImp, string> = { cg: 'tcit_apercu_carteGrise', facture: 'tcit_apercu_facture', ficheId: 'tcit_apercu_ficheId', feuillet1: 'tcit_apercu_feuillet1', feuillet2: 'tcit_apercu_feuillet2', feuillet3: 'tcit_apercu_feuillet3' }

/** Ouvre la fenêtre d'aperçu d'un document (BrowserWindow propre — Règle 10). */
export function ouvrirApercuDoc(doc: DocImp, v: MockVehicule, autoPrint: boolean, ts: number, mention = ''): void {
  const data = doc === 'cg' ? cgDataDe(v) : doc === 'facture' ? factureDataDe(v) : doc === 'ficheId' ? ficheIdDataDe(v) : doc === 'feuillet1' ? feuillet1DataDe(v) : doc === 'feuillet2' ? feuillet2DataDe(v) : feuillet3DataDe(v, mention)
  localStorage.setItem(APERCU_CLES[doc], JSON.stringify({ data, autoPrint, ts }))
  const id = APERCU_IDS[doc]
  const cfg = WINDOW_REGISTRY[id]
  if (cfg) electronApi.mdiOpen({ id, x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
}
