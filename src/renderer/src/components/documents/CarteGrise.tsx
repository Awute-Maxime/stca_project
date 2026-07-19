import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { getCalibrage, styleCalibrage } from '@mock/printConfig'

// ─────────────────────────────────────────────────────────────────────────────
// CARTE GRISE — Certificat d'immatriculation provisoire de véhicule
// d'occasion en transit.
//
// Impression sur fiche PRÉ-IMPRIMÉE de 10,50 × 21,2 cm chargée dans
// l'imprimante : on n'imprime QUE les données, positionnées pour tomber
// exactement sur les zones du pré-imprimé (comme le vrai STCA II).
// L'aperçu écran affiche la fiche blanche avec ces mêmes données.
//
// Toutes les positions sont en mm, calibrées sur la photo du certificat
// réel (ex. « TG WZ C 1847 KE ») — à affiner après un essai d'impression.
// ─────────────────────────────────────────────────────────────────────────────

export interface CarteGriseData {
  immat: string          // ex. C7389
  destCode: string       // ex. AFO — code frontière
  nom: string            // Attribué à
  adresse: string        // Adresse (pays de résidence)
  numTri: string         // N° Tri
  dateTri: string        // Du (date du N° Tri) — DD/MM/YYYY
  marque: string         // Marque - Modèle
  chassis: string        // N° Chassis (VIN)
  parc: string           // Nom du Parc (transit/maison)
  dateDelivrance: string // Date de délivrance — DD/MM/YYYY
}

// Dimensions physiques de la fiche pré-imprimée
export const CG_WIDTH_MM = 105
export const CG_HEIGHT_MM = 212

// ── Positions verticales (mm depuis le HAUT de la fiche) ────────────────────
// CALIBRAGE : ajuster ces valeurs après un essai sur fiche réelle.
const POS = {
  numero:      76,   // TG WZ {immat} {code} — gros, centré
  nom:         93,   // Attribué à
  adresse:    104,   // Adresse
  tri:        111,   // N° Tri … Du …
  marque:     126,   // Marque
  chassis:    134,   // N° Chassis
  parc:       141,   // Nom du Parc
  delivrance: 148,   // Date de délivrance
}

// Positions horizontales (mm depuis la GAUCHE) pour les champs non centrés
const X = {
  adresse:    30,
  tri:        30,
  triDate:    66,
  parc:       42,
  delivrance: 50,
}

// ── Styles de texte (police lisible type impression matricielle/laser) ──────
const FONT = "Arial, 'Segoe UI', sans-serif"

function fieldStyle(topMm: number, opts?: { center?: boolean; leftMm?: number; size?: number; spacing?: number }): CSSProperties {
  const s: CSSProperties = {
    position: 'absolute',
    top: `${topMm}mm`,
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: `${opts?.size ?? 3.4}mm`,
    letterSpacing: opts?.spacing != null ? `${opts.spacing}mm` : undefined,
    color: '#111',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    textTransform: 'uppercase',
  }
  if (opts?.center) {
    s.left = 0
    s.width = '100%'
    s.textAlign = 'center'
  } else {
    s.left = `${opts?.leftMm ?? 0}mm`
  }
  return s
}

// ── Le document : fiche blanche + données positionnées ──────────────────────
export function CarteGriseDoc({ data }: { data: CarteGriseData }): JSX.Element {
  const numeroComplet = `TG WZ ${data.immat} ${data.destCode}`.replace(/\s+/g, ' ').trim()
  const cal = getCalibrage('cg') // décalage global configurable (Config. Imprimantes)

  return (
    <div
      id="cg-print-root"
      style={{
        position: 'relative',
        width: `${CG_WIDTH_MM}mm`,
        height: `${CG_HEIGHT_MM}mm`,
        background: '#fff',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={styleCalibrage(cal)}>
      {/* N° d'immatriculation complet — TG WZ C7389 AFO */}
      <div style={fieldStyle(POS.numero, { center: true, size: 7, spacing: 1.2 })}>
        {numeroComplet}
      </div>

      {/* Attribué à */}
      <div style={fieldStyle(POS.nom, { center: true })}>
        {data.nom}
      </div>

      {/* Adresse */}
      <div style={fieldStyle(POS.adresse, { leftMm: X.adresse })}>
        {data.adresse}
      </div>

      {/* N° Tri + Du */}
      <div style={fieldStyle(POS.tri, { leftMm: X.tri })}>
        {data.numTri}
      </div>
      <div style={fieldStyle(POS.tri, { leftMm: X.triDate })}>
        {data.dateTri}
      </div>

      {/* Marque */}
      <div style={fieldStyle(POS.marque, { center: true })}>
        {data.marque}
      </div>

      {/* N° Chassis */}
      <div style={fieldStyle(POS.chassis, { center: true })}>
        {data.chassis}
      </div>

      {/* Nom du Parc */}
      <div style={fieldStyle(POS.parc, { leftMm: X.parc })}>
        {data.parc}
      </div>

      {/* Date de délivrance */}
      <div style={fieldStyle(POS.delivrance, { leftMm: X.delivrance })}>
        {data.dateDelivrance}
      </div>
      </div>
    </div>
  )
}

// ── CSS d'impression : page 105×212mm, seules les données du document ───────
export function PrintCss(): JSX.Element {
  return (
    <style>{`
      @media print {
        @page { size: ${CG_WIDTH_MM}mm ${CG_HEIGHT_MM}mm; margin: 0; }
        body * { visibility: hidden !important; }
        #cg-print-root, #cg-print-root * { visibility: visible !important; }
        #cg-print-root {
          position: fixed !important;
          left: 0 !important; top: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
          transform: none !important;
        }
      }
    `}</style>
  )
}

// ── Impression directe (case Prévisualiser décochée) ────────────────────────
// Monte le document hors écran, déclenche l'impression, puis se retire.
export function CarteGrisePrintDirect({ data, onDone }: {
  data: CarteGriseData
  onDone: () => void
}): JSX.Element {
  useEffect(() => {
    const t = setTimeout(() => {
      window.print()
      onDone()
    }, 80)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ position: 'fixed', left: '-500mm', top: 0 }}>
      <PrintCss />
      <CarteGriseDoc data={data} />
    </div>
  )
}
