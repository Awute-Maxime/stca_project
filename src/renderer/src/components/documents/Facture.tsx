import { useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import dayjs from 'dayjs'

// ─────────────────────────────────────────────────────────────────────────────
// FACTURE — document COMPLET A4 portrait, fidèle au modèle STCA II réel
// (PDF fourni le 18/07/2026) : deux volets sur la même page —
//   1. STCA (immatriculation) : coordonnées, n° facture, détails véhicule,
//      montant immatriculation.
//   2. POOL TPVM-VT (assurance) : coordonnées, code-barres, rappel facture,
//      montant assurance.
// Puis Montant Total encadré et NB de retrait des plaques & assurances.
// ─────────────────────────────────────────────────────────────────────────────

export interface FactureData {
  factureNum: string     // ex. 549 181 (réf. enregistrement formatée)
  dateEnreg: string      // Du : — DD/MM/YYYY (date de l'enregistrement)
  nom: string            // Nom acheteur
  pays: string           // Pays de destination (ex. BURKINA-FASO)
  destCode: string       // Code frontière (ex. CK)
  immat: string          // ex. N6917 — affichée « N 6917 »
  chassis: string
  marque: string         // ex. TOYOTA - RAV4-4 C
  natureVeh: string      // ex. Véhicule Léger
  montantStca: number    // volet STCA (immatriculation)
  montantAssurance: number // volet POOL (assurance)
}

// Montant assurance du modèle réel (POOL TPVM-VT)
export const MONTANT_ASSURANCE_FACTURE = 12000

const FONT = "Arial, 'Segoe UI', sans-serif"
const fmtMontant = (n: number): string => n.toLocaleString('fr-FR').replace(/ | /g, ' ')

/** Immatriculation « N6917 » → « N 6917 » (comme le modèle réel). */
function fmtImmat(immat: string): string {
  const m = immat.match(/^([A-Z]+)(\d+)$/i)
  return m ? `${m[1]} ${m[2]}` : immat
}

// ── Pseudo code-barres déterministe (SVG, aucune lib) ───────────────────────
function Barcode({ seed, width = 210, height = 42 }: { seed: string; width?: number; height?: number }): JSX.Element {
  // Générateur simple : hachage du seed → séquence de largeurs de barres
  let h = 2166136261
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  const bars: Array<{ x: number; w: number }> = []
  let x = 0
  let n = h >>> 0
  while (x < width - 4) {
    n = (Math.imul(n, 1103515245) + 12345) >>> 0
    const w = 1 + (n % 3)          // barre 1-3 px
    const gap = 1 + ((n >> 4) % 3) // espace 1-3 px
    bars.push({ x, w })
    x += w + gap
  }
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="#000" />
      ))}
    </svg>
  )
}

// ── Petites briques de mise en page ─────────────────────────────────────────
function Ligne({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 13 }}>
      <span style={{ width: 92, fontSize: 11, color: '#000', flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  )
}

function CadreFactureNum({ num, date }: { num: string; date: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22 }}>
      <div style={{
        border: '1px solid #000', padding: '7px 14px', width: '58%',
        display: 'flex', alignItems: 'baseline', gap: 8,
      }}>
        <span style={{ fontSize: 11 }}>Facture n° :</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{num}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11 }}>Du :</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{date}</span>
      </div>
    </div>
  )
}

// ── Le document ─────────────────────────────────────────────────────────────
export function FactureDoc({ data }: { data: FactureData }): JSX.Element {
  const maintenant = dayjs().format('DD/MM/YYYY HH:mm:ss')
  const immatAff = `${data.destCode}   ${fmtImmat(data.immat)}`
  const total = data.montantStca + data.montantAssurance

  const boiteArrondie: CSSProperties = {
    border: '1.5px solid #000', borderRadius: 14, padding: '12px 18px 10px',
  }

  return (
    <div
      id="facture-print-root"
      style={{
        width: '210mm', minHeight: '297mm', background: '#fff',
        padding: '16mm 20mm', fontFamily: FONT, color: '#000',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* ══ VOLET 1 — STCA (immatriculation) ══════════════════════════════ */}
      <div style={boiteArrondie}>
        <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: 6 }}>S T C A</div>
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>Lomé&nbsp; -&nbsp; Togo&nbsp; -&nbsp; Tél :&nbsp; 22 71 71 10</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 14, marginTop: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Facture</span>
          <span style={{ fontSize: 11 }}>Le :</span>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{maintenant}</span>
        </div>
      </div>

      <div style={{ height: 26 }} />
      <CadreFactureNum num={data.factureNum} date={data.dateEnreg} />

      <Ligne label="Nom :">
        <span style={{ fontSize: 13, fontWeight: 700 }}>{data.nom.toUpperCase()}</span>
        <span style={{ fontSize: 11.5, marginLeft: 60 }}>{data.pays.toUpperCase()}</span>
      </Ligne>
      <Ligne label="Destination :">
        <span style={{ fontSize: 13, fontWeight: 700 }}>{immatAff}</span>
      </Ligne>
      <Ligne label="N° Chassis :">
        <span style={{ fontSize: 13, fontWeight: 700 }}>{data.chassis}</span>
        <span style={{ fontSize: 11.5, marginLeft: 40 }}>{data.marque.toUpperCase()}</span>
      </Ligne>
      <Ligne label="Nature Véh. :">
        <span style={{ fontSize: 13, fontWeight: 700 }}>{data.natureVeh}</span>
      </Ligne>
      <Ligne label="Montant :">
        <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 110 }}>{fmtMontant(data.montantStca)}</span>
        <span style={{ fontSize: 10.5, marginLeft: 8 }}>FR CFA</span>
      </Ligne>

      {/* ══ VOLET 2 — POOL TPVM-VT (assurance) ═══════════════════════════ */}
      <div style={{ height: 58 }} />
      <div style={boiteArrondie}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>POOL TPVM-VT</div>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>01 BP 4866&nbsp; -&nbsp; Lomé&nbsp; -&nbsp; Togo</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>Tél. :&nbsp;&nbsp;&nbsp;&nbsp;22 20 55 77</div>
            <div style={{ fontSize: 11 }}>Fax :&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;22 20 55 80</div>
          </div>
          <Barcode seed={`${data.factureNum}-${data.immat}`} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 14, marginTop: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Facture</span>
          <span style={{ fontSize: 11 }}>Le :</span>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{maintenant}</span>
        </div>
      </div>

      <div style={{ height: 26 }} />
      <CadreFactureNum num={data.factureNum} date={data.dateEnreg} />

      <div style={{ height: 14 }} />
      <Ligne label="Nature Véh. :">
        <span style={{ fontSize: 13, fontWeight: 700 }}>{data.natureVeh}</span>
        <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 45 }}>{immatAff}</span>
      </Ligne>
      <div style={{ height: 6 }} />
      <Ligne label="Montant :">
        <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 110 }}>{fmtMontant(data.montantAssurance)}</span>
        <span style={{ fontSize: 10.5, marginLeft: 8 }}>FR CFA</span>
      </Ligne>

      {/* ══ Montant total ═════════════════════════════════════════════════ */}
      <div style={{ height: 22 }} />
      <div style={{
        border: '1px solid #000', padding: '9px 14px',
        display: 'flex', alignItems: 'baseline',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Montant Total</span>
        <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 130 }}>{fmtMontant(total)}</span>
        <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 10 }}>FR CFA</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700 }}>0</span>
        <span style={{ fontSize: 10, margin: '0 14px' }}>dont</span>
        <span style={{ fontSize: 12, fontWeight: 700 }}>0</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 9 }}>TCIT - {dayjs().format('YYYY')}</span>
      </div>

      {/* ══ NB ════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 40 }}>
        <span style={{ fontSize: 13, fontWeight: 700, textDecoration: 'underline', flexShrink: 0 }}>NB :</span>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 700, lineHeight: 1.5 }}>
          Pour retirer les plaques &amp; assurances, veuillez présenter cette facture.
          <br />Merci pour votre bonne compréhension.
        </div>
      </div>
    </div>
  )
}

// ── CSS d'impression : page A4, seule la facture sort ───────────────────────
export function FacturePrintCss(): JSX.Element {
  return (
    <style>{`
      @media print {
        @page { size: A4 portrait; margin: 0; }
        body * { visibility: hidden !important; }
        #facture-print-root, #facture-print-root * { visibility: visible !important; }
        #facture-print-root {
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
export function FacturePrintDirect({ data, onDone }: {
  data: FactureData
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
      <FacturePrintCss />
      <FactureDoc data={data} />
    </div>
  )
}
