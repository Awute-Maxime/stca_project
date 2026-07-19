import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { getCalibrage } from '@mock/printConfig'

// ─────────────────────────────────────────────────────────────────────────────
// FEUILLET N°1 — ASSURANCE (BLEU) : bande PRÉ-IMPRIMÉE de 28,2 × 7,51 cm
// (certificat d'assurance CIMA « POOL VT » en 4 sections : assuré, partie à
// enlever pour le pare-brise, certificat principal, attestation).
// Comme la carte grise : on n'imprime QUE les données, en TROIS zones le long
// de la bande (relevées sur le PDF STCA II fourni le 25/07/2026) :
//   1. Zone « Assuré »            : nom + police + dates + marque + immat + châssis
//   2. Zone « Pare-brise »        : police + dates + marque + immat + châssis (SANS nom)
//   3. Zone « Certificat »        : nom (en haut) + police + dates + marque + immat + châssis
// + un petit tag vertical « TCIT » vers l'extrémité (attestation).
// Positions en mm — à affiner après essai d'impression sur feuillet réel.
// ─────────────────────────────────────────────────────────────────────────────

export interface Feuillet1Data {
  nom: string
  numPolice: string    // ex. 1 - 567048 / 20220718
  dateEffet: string    // DD/MM/YYYY
  dateEcheance: string // DD/MM/YYYY
  marque: string       // ex. TOYOTA PRADO
  immatStac: string    // ex. TG WZ A 2173 NO
  chassis: string
}

export const FEUILLET1_WIDTH_MM = 282
export const FEUILLET1_HEIGHT_MM = 75.1

const FONT = "Arial, 'Segoe UI', sans-serif"

function pose(topMm: number, leftMm: number, opts?: { size?: number; bold?: boolean }): CSSProperties {
  return {
    position: 'absolute',
    top: `${topMm}mm`,
    left: `${leftMm}mm`,
    fontFamily: FONT,
    fontSize: `${opts?.size ?? 3}mm`,
    fontWeight: opts?.bold ? 700 : 400,
    color: '#111',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  }
}

// Une zone de données (offsets relatifs à son origine gauche)
function Zone({ data, xMm, avecNom, nomEnHaut }: {
  data: Feuillet1Data
  xMm: number
  avecNom: boolean
  nomEnHaut: boolean
}): JSX.Element {
  return (
    <>
      {avecNom && (
        <div style={pose(nomEnHaut ? 11.1 : 16.9, xMm + (nomEnHaut ? 0 : 0), { size: 3, bold: true })}>
          {data.nom.toUpperCase()}
        </div>
      )}
      <div style={pose(nomEnHaut ? 21.2 : 24.2, xMm + 13, { size: 3, bold: true })}>{data.numPolice}</div>
      <div style={pose(nomEnHaut ? 27.6 : 29.4, xMm + 6, { size: 2.9 })}>{data.dateEffet}</div>
      <div style={pose(nomEnHaut ? 27.6 : 29.4, xMm + 29, { size: 2.9 })}>{data.dateEcheance}</div>
      <div style={pose(nomEnHaut ? 34.6 : 34.8, xMm + 15, { size: 2.9 })}>{data.marque.toUpperCase()}</div>
      <div style={pose(nomEnHaut ? 41.1 : 41.1, xMm + 17, { size: 3, bold: true })}>{data.immatStac}</div>
      <div style={pose(nomEnHaut ? 45.4 : 45.6, xMm + 16, { size: 3, bold: true })}>{data.chassis.toUpperCase()}</div>
    </>
  )
}

// ── Le document : bande blanche + données des 3 zones ───────────────────────
export function Feuillet1Doc({ data }: { data: Feuillet1Data }): JSX.Element {
  const cal = getCalibrage('feuillet1') // décalage global configurable (Config. Imprimantes)
  return (
    <div
      id="feuillet1-print-root"
      style={{
        position: 'relative',
        width: `${FEUILLET1_WIDTH_MM}mm`,
        height: `${FEUILLET1_HEIGHT_MM}mm`,
        background: '#fff',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', left: `${cal.dx}mm`, top: `${cal.dy}mm`, width: '100%', height: '100%' }}>
      {/* Zone 1 — section « Assuré » */}
      <Zone data={data} xMm={7} avecNom nomEnHaut={false} />
      {/* Zone 2 — partie à enlever (pare-brise), sans le nom */}
      <Zone data={data} xMm={81} avecNom={false} nomEnHaut={false} />
      {/* Zone 3 — certificat principal, nom en haut */}
      <Zone data={data} xMm={145} avecNom nomEnHaut />

      {/* Tag vertical vers l'attestation */}
      <div style={{
        position: 'absolute', top: '38mm', left: '276mm',
        fontFamily: FONT, fontSize: '2.2mm', color: '#333',
        transform: 'rotate(90deg)', transformOrigin: 'left top',
        whiteSpace: 'nowrap',
      }}>
        TCIT
      </div>
      </div>
    </div>
  )
}

// ── CSS d'impression : page 282×75,1mm, seules les données du feuillet ──────
export function Feuillet1PrintCss(): JSX.Element {
  return (
    <style>{`
      @media print {
        @page { size: ${FEUILLET1_WIDTH_MM}mm ${FEUILLET1_HEIGHT_MM}mm; margin: 0; }
        body * { visibility: hidden !important; }
        #feuillet1-print-root, #feuillet1-print-root * { visibility: visible !important; }
        #feuillet1-print-root {
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
export function Feuillet1PrintDirect({ data, onDone }: {
  data: Feuillet1Data
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
      <Feuillet1PrintCss />
      <Feuillet1Doc data={data} />
    </div>
  )
}
