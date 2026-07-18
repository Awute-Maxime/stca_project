import dayjs from 'dayjs'
import type { MockVehicule } from '@mock/vehicules'
import type { CarteGriseData } from './CarteGrise'
import { type FactureData, MONTANT_ASSURANCE_FACTURE } from './Facture'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers partagés d'édition de documents (duplicata / renouvellement depuis
// la Liste ET la Recherche) : quels documents pour quel choix, données des
// documents à partir d'un véhicule, ouverture des fenêtres d'aperçu.
// Source unique — la Liste et la Recherche ne peuvent plus diverger.
// ─────────────────────────────────────────────────────────────────────────────

export type DocImp = 'facture' | 'cg'

// Choix du modal EditionDocsModal (WinDialogs.DOC_OPTIONS) → documents inclus
export const DOCS_AVEC_CG      = ['tous', 'facture_cg', 'cg_fiche_id', 'uniq_cg']
export const DOCS_AVEC_FACTURE = ['tous', 'facture_cg', 'uniq_facture']

/** Documents imprimables pour un choix (facture d'abord, comme le vrai STCA). */
export function docsPourChoix(choix: string): DocImp[] {
  const docs: DocImp[] = []
  if (DOCS_AVEC_FACTURE.includes(choix)) docs.push('facture')
  if (DOCS_AVEC_CG.includes(choix)) docs.push('cg')
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

/** Ouvre la fenêtre d'aperçu d'un document (BrowserWindow propre — Règle 10). */
export function ouvrirApercuDoc(doc: DocImp, v: MockVehicule, autoPrint: boolean, ts: number): void {
  const id  = doc === 'cg' ? 'apercu.carteGrise' : 'apercu.facture'
  const cle = doc === 'cg' ? 'tcit_apercu_carteGrise' : 'tcit_apercu_facture'
  const data = doc === 'cg' ? cgDataDe(v) : factureDataDe(v)
  localStorage.setItem(cle, JSON.stringify({ data, autoPrint, ts }))
  const cfg = WINDOW_REGISTRY[id]
  if (cfg) electronApi.mdiOpen({ id, x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
}
