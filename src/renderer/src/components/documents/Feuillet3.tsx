import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import dayjs from 'dayjs'
import { getCalibrage, getDimensionsDoc, styleCalibrage } from '@mock/printConfig'

// ─────────────────────────────────────────────────────────────────────────────
// FEUILLET N°3 — CONDITIONS PARTICULIÈRES ASSURANCE AUTOMOBILE (Blanc A4)
// Papier PRÉ-IMPRIMÉ « POOL TPVM-VT GIE » : comme la carte grise, on n'imprime
// QUE les données, positionnées pour tomber sur les zones du formulaire.
// Modèles fournis le 18/07/2026 : PDF des données imprimées par STCA II
// (positions) + photo du feuillet pré-imprimé rempli (contexte).
//
// Toutes les positions sont en mm sur A4 (210×297) — à affiner après un
// essai d'impression sur feuillet réel (constantes Y / X ci-dessous).
// ─────────────────────────────────────────────────────────────────────────────

export interface Feuillet3Data {
  numPolice: string      // ex. 1 - 567048 / 20220718
  dateEffet: string      // DD/MM/YYYY (date d'enregistrement)
  dateEcheance: string   // DD/MM/YYYY (effet + 14 jours)
  parc: string           // Nom du parc (ex. UNIPARK / SLTT)
  nom: string
  paysResidence: string
  paysDestination: string
  categorieUsage: string // ex. VÉHICULE LÉGER (type véhicule)
  marque: string
  chassis: string
  immatStac: string      // ex. TG WZ A 2173 NO
  mention: string        // '' à la 1re impression, 'DUPLICATA' en réédition
}

// ── Primes du modèle réel (véhicule léger) — TTC = montant assurance facture ─
export const PRIMES_FEUILLET3 = {
  rc: 5065,
  cedeao: 506,
  individuelle: 3750,
  accessoires: 2000,
  taxes: 679,
} as const
export const PRIME_TOTALE_NETTE =
  PRIMES_FEUILLET3.rc + PRIMES_FEUILLET3.cedeao + PRIMES_FEUILLET3.individuelle // 9 321
export const PRIME_TTC =
  PRIME_TOTALE_NETTE + PRIMES_FEUILLET3.accessoires + PRIMES_FEUILLET3.taxes   // 12 000

// ── Montant en toutes lettres (français, jusqu'à 999 999) ───────────────────
const UNITES = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
]

function moins100(n: number): string {
  if (n < 17) return UNITES[n]
  if (n < 20) return `dix-${UNITES[n - 10]}`
  const dizaines: Record<number, string> = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' }
  if (n < 70) {
    const d = Math.floor(n / 10), u = n % 10
    return u === 0 ? dizaines[d] : u === 1 ? `${dizaines[d]} et un` : `${dizaines[d]}-${UNITES[u]}`
  }
  if (n < 80) return n === 71 ? 'soixante et onze' : `soixante-${moins100(n - 60)}`
  if (n < 100) return n === 80 ? 'quatre-vingts' : `quatre-vingt-${moins100(n - 80)}`
  return ''
}

function moins1000(n: number): string {
  if (n < 100) return moins100(n)
  const c = Math.floor(n / 100), reste = n % 100
  const cent = c === 1 ? 'cent' : `${UNITES[c]} cent${reste === 0 ? 's' : ''}`
  return reste === 0 ? cent : `${cent} ${moins100(reste)}`
}

/** 12000 → « douze mille » ; 13500 → « treize mille cinq cents » (approx. usuelle). */
export function montantEnLettres(n: number): string {
  if (n <= 0) return 'zéro'
  const milliers = Math.floor(n / 1000), reste = n % 1000
  let out = ''
  if (milliers > 0) out = milliers === 1 ? 'mille' : `${moins1000(milliers)} mille`
  if (reste > 0) out += `${out ? ' ' : ''}${moins1000(reste)}`
  return out
}

const FONT = "Arial, 'Segoe UI', sans-serif"
const fmt = (n: number): string => n.toLocaleString('fr-FR').replace(/ | /g, ' ')

function pose(topMm: number, leftMm: number, opts?: { size?: number; bold?: boolean }): CSSProperties {
  return {
    position: 'absolute',
    top: `${topMm}mm`,
    left: `${leftMm}mm`,
    fontFamily: FONT,
    fontSize: `${opts?.size ?? 3.5}mm`,
    fontWeight: opts?.bold ? 700 : 400,
    color: '#111',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  }
}

// ── Une page du feuillet : feuille blanche + données positionnées ───────────
function Feuillet3Page({ data, derniere }: { data: Feuillet3Data; derniere: boolean }): JSX.Element {
  const maintenant = dayjs().format('DD/MM/YYYY')
  const cal = getCalibrage('feuillet3') // décalage global configurable (Config. Imprimantes)
  const dim = getDimensionsDoc('feuillet3') // dimensions papier configurables

  return (
    <div
      className="f3-page"
      style={{
        position: 'relative',
        width: `${dim.largeurMm}mm`,
        height: `${dim.hauteurMm}mm`,
        background: '#fff',
        overflow: 'hidden',
        flexShrink: 0,
        marginBottom: derniere ? 0 : 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      <div style={styleCalibrage(cal)}>
      {/* Ligne d'entête imprimée sur le bord haut du pré-imprimé */}
      <div style={pose(6.9, 3, { size: 3 })}>Assurances : Conditions Particulières (TCIT)</div>
      <div style={pose(6.9, 82, { size: 3 })}>Imprimée le :&nbsp; {maintenant}</div>
      {data.mention && <div style={pose(6.9, 183, { size: 3, bold: true })}>{data.mention}</div>}

      {/* N° Police + dates */}
      <div style={pose(60, 137, { size: 3.8, bold: true })}>{data.numPolice}</div>
      <div style={pose(68.5, 50, { size: 3.8, bold: true })}>{data.dateEffet}</div>
      <div style={pose(68.5, 137, { size: 3.8, bold: true })}>{data.dateEcheance}</div>

      {/* Nom du parc */}
      <div style={pose(85.7, 50, { size: 3.6 })}>{data.parc.toUpperCase()}</div>

      {/* Souscripteur */}
      <div style={pose(100.5, 50, { size: 3.8, bold: true })}>{data.nom.toUpperCase()}</div>
      <div style={pose(105.5, 50, { size: 3.4 })}>Résidence :&nbsp; {data.paysResidence.toUpperCase()}</div>
      <div style={pose(117.9, 50, { size: 3.4 })}>Destination :&nbsp; {data.paysDestination.toUpperCase()}</div>

      {/* Caractéristiques du véhicule */}
      <div style={pose(137.3, 54.8, { size: 3.4 })}>{data.categorieUsage.toUpperCase()}</div>
      <div style={pose(141.9, 54.8, { size: 3.4 })}>{data.marque.toUpperCase()}</div>
      <div style={pose(152.1, 54.8, { size: 3.8, bold: true })}>{data.chassis.toUpperCase()}</div>
      <div style={pose(161.3, 154, { size: 3.8, bold: true })}>{data.immatStac}</div>

      {/* Garanties souscrites et primes (colonnes du tableau pré-imprimé) */}
      <div style={pose(220.7, 17, { size: 3.4, bold: true })}>{fmt(PRIMES_FEUILLET3.rc)}</div>
      <div style={pose(220.7, 45.7, { size: 3.4, bold: true })}>{fmt(PRIMES_FEUILLET3.cedeao)}</div>
      <div style={pose(220.7, 70.8, { size: 3.4, bold: true })}>{fmt(PRIMES_FEUILLET3.individuelle)}</div>
      <div style={pose(220.7, 118.8, { size: 3.4, bold: true })}>{fmt(PRIME_TOTALE_NETTE)}</div>
      <div style={pose(220.7, 146.2, { size: 3.4, bold: true })}>{fmt(PRIMES_FEUILLET3.accessoires)}</div>
      <div style={pose(220.7, 160, { size: 3.4, bold: true })}>{fmt(PRIMES_FEUILLET3.taxes)}</div>
      <div style={pose(220.7, 178, { size: 3.4, bold: true })}>{fmt(PRIME_TTC)} F.Cfa</div>

      {/* Reçu */}
      <div style={pose(226.2, 19.4, { size: 3.4 })}>
        Reçu de {data.nom.toUpperCase()} la somme de {montantEnLettres(PRIME_TTC)} Francs CFA
      </div>
      </div>
    </div>
  )
}

// ── Le document : UN exemplaire (ajustement utilisateur du 25/07/2026 —
// la structure multi-pages est conservée si besoin de revenir à plusieurs) ──
export function Feuillet3Doc({ data }: { data: Feuillet3Data }): JSX.Element {
  return (
    <div id="feuillet3-print-root" style={{ display: 'flex', flexDirection: 'column' }}>
      <Feuillet3Page data={data} derniere={true} />
    </div>
  )
}

// ── CSS d'impression : page A4, seules les données du feuillet ──────────────
export function Feuillet3PrintCss(): JSX.Element {
  const dim = getDimensionsDoc('feuillet3')
  return (
    <style>{`
      @media print {
        @page { size: ${dim.largeurMm}mm ${dim.hauteurMm}mm; margin: 0; }
        body * { visibility: hidden !important; }
        #feuillet3-print-root, #feuillet3-print-root * { visibility: visible !important; }
        #feuillet3-print-root {
          position: absolute !important;
          left: 0 !important; top: 0 !important;
          margin: 0 !important;
          transform: none !important;
        }
        /* Deux exemplaires = deux pages A4 exactes, sans espace ni ombre */
        #feuillet3-print-root .f3-page {
          margin: 0 !important;
          box-shadow: none !important;
          break-after: page;
          page-break-after: always;
        }
        #feuillet3-print-root .f3-page:last-child {
          break-after: auto;
          page-break-after: auto;
        }
      }
    `}</style>
  )
}

// ── Impression directe (case Prévisualiser décochée) ────────────────────────
export function Feuillet3PrintDirect({ data, onDone }: {
  data: Feuillet3Data
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
      <Feuillet3PrintCss />
      <Feuillet3Doc data={data} />
    </div>
  )
}
