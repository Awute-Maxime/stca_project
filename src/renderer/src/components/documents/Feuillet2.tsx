import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { getCalibrage } from '@mock/printConfig'

// ─────────────────────────────────────────────────────────────────────────────
// FEUILLET N°2 — ASSURANCE (ROSE) : bande PRÉ-IMPRIMÉE de 28,2 × 7,51 cm —
// CARTE BRUNE CEDEAO (ECOWAS Brown Card). Comme la carte grise : on n'imprime
// QUE les données, en QUATRE zones (relevées sur le PDF STCA II du 25/07/2026) :
//   1. Exemplaire Assureur        : nom, immat, marque, assureur, châssis, police, dates
//   2. Exemplaire Bureau National : identique à la zone 1
//   3. Section CEDEAO (gauche)    : nom, immat, assureur
//   4. Section CEDEAO (droite)    : police, dates, châssis, marque
// + un petit tag vertical « TCIT » à l'extrémité.
// Positions en mm — à affiner après essai d'impression sur feuillet réel.
// ─────────────────────────────────────────────────────────────────────────────

export interface Feuillet2Data {
  nom: string
  numPolice: string    // ex. 1 - 567048 / 20220718
  dateEffet: string    // DD/MM/YYYY
  dateEcheance: string // DD/MM/YYYY
  marque: string       // ex. TOYOTA PRADO
  immatStac: string    // ex. TG WZ A 2173 NO
  chassis: string
}

export const FEUILLET2_WIDTH_MM = 282
export const FEUILLET2_HEIGHT_MM = 75.1

// Assureur émetteur (bloc fixe du modèle réel)
const ASSUREUR_L1 = 'POOL TPVM-VT'
const ASSUREUR_L2 = 'STCA - Lomé'

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

// Zones 1 & 2 — « Exemplaire » (offsets relatifs à l'origine gauche)
function ZoneExemplaire({ data, xMm }: { data: Feuillet2Data; xMm: number }): JSX.Element {
  return (
    <>
      <div style={pose(10.2, xMm, { size: 3, bold: true })}>{data.nom.toUpperCase()}</div>
      <div style={pose(15.8, xMm + 17.7, { size: 3, bold: true })}>{data.immatStac}</div>
      <div style={pose(21.5, xMm + 14.4, { size: 2.9 })}>{data.marque.toUpperCase()}</div>
      <div style={{ ...pose(26.6, xMm + 19.4, { size: 2.9 }), lineHeight: 1.25 }}>
        {ASSUREUR_L1}<br />{ASSUREUR_L2}
      </div>
      <div style={pose(38.6, xMm, { size: 3, bold: true })}>{data.chassis.toUpperCase()}</div>
      <div style={pose(42.5, xMm + 10.8, { size: 3, bold: true })}>{data.numPolice}</div>
      <div style={pose(49.2, xMm + 5, { size: 2.9 })}>{data.dateEffet}</div>
      <div style={pose(49.2, xMm + 30.7, { size: 2.9 })}>{data.dateEcheance}</div>
    </>
  )
}

// ── Le document : bande blanche + données des 4 zones ───────────────────────
export function Feuillet2Doc({ data }: { data: Feuillet2Data }): JSX.Element {
  const cal = getCalibrage('feuillet2') // décalage global configurable (Config. Imprimantes)
  return (
    <div
      id="feuillet2-print-root"
      style={{
        position: 'relative',
        width: `${FEUILLET2_WIDTH_MM}mm`,
        height: `${FEUILLET2_HEIGHT_MM}mm`,
        background: '#fff',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', left: `${cal.dx}mm`, top: `${cal.dy}mm`, width: '100%', height: '100%' }}>
      {/* Zone 1 — Exemplaire Assureur */}
      <ZoneExemplaire data={data} xMm={10.3} />
      {/* Zone 2 — Exemplaire Bureau National */}
      <ZoneExemplaire data={data} xMm={76.2} />

      {/* Zone 3 — Section CEDEAO (gauche) : nom, immat, assureur */}
      <div style={pose(17.8, 137.7, { size: 3, bold: true })}>{data.nom.toUpperCase()}</div>
      <div style={pose(26.4, 158.1, { size: 3, bold: true })}>{data.immatStac}</div>
      <div style={{ ...pose(38.6, 158.1, { size: 2.9 }), lineHeight: 1.25 }}>
        {ASSUREUR_L1}<br />{ASSUREUR_L2}
      </div>

      {/* Zone 4 — Section CEDEAO (droite) : police, dates, châssis, marque */}
      <div style={pose(8.4, 220.3, { size: 3, bold: true })}>{data.numPolice}</div>
      <div style={pose(14, 217.9, { size: 2.9 })}>{data.dateEffet}</div>
      <div style={pose(14, 242.4, { size: 2.9 })}>{data.dateEcheance}</div>
      <div style={pose(33, 213.2, { size: 3, bold: true })}>{data.chassis.toUpperCase()}</div>
      <div style={pose(42.9, 213.2, { size: 2.9 })}>{data.marque.toUpperCase()}</div>

      {/* Tag vertical à l'extrémité */}
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
export function Feuillet2PrintCss(): JSX.Element {
  return (
    <style>{`
      @media print {
        @page { size: ${FEUILLET2_WIDTH_MM}mm ${FEUILLET2_HEIGHT_MM}mm; margin: 0; }
        body * { visibility: hidden !important; }
        #feuillet2-print-root, #feuillet2-print-root * { visibility: visible !important; }
        #feuillet2-print-root {
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
export function Feuillet2PrintDirect({ data, onDone }: {
  data: Feuillet2Data
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
      <Feuillet2PrintCss />
      <Feuillet2Doc data={data} />
    </div>
  )
}
