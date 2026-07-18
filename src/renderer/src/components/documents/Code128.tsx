// ─────────────────────────────────────────────────────────────────────────────
// Encodeur CODE 128 (jeu B) — implémentation complète, sans bibliothèque.
// Produit un code-barres SVG RÉELLEMENT scannable (checksum modulo 103,
// motifs officiels de la norme). Utilisé par la Fiche ID jaune (et
// réutilisable partout).
// ─────────────────────────────────────────────────────────────────────────────

// Motifs officiels Code 128 : 6 largeurs (barre/espace alternés) par symbole,
// valeurs 0 à 105, puis le motif STOP (7 largeurs).
const MOTIFS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232',
]
const MOTIF_STOP = '2331112'
const START_B = 104

/** Encode une chaîne (jeu B : ASCII 32-126) en séquence de largeurs de modules. */
function encoderCode128B(texte: string): string {
  // Caractères hors jeu B remplacés par un espace (sécurité)
  const valeurs = [...texte].map(c => {
    const v = c.charCodeAt(0) - 32
    return v >= 0 && v <= 94 ? v : 0
  })
  let checksum = START_B
  valeurs.forEach((v, i) => { checksum += v * (i + 1) })
  checksum %= 103
  return MOTIFS[START_B] + valeurs.map(v => MOTIFS[v]).join('') + MOTIFS[checksum] + MOTIF_STOP
}

/**
 * Code-barres Code 128-B en SVG.
 * - `value`   : texte à encoder (ASCII imprimable)
 * - `widthMm` : largeur cible — les modules sont dimensionnés pour la remplir
 * - `heightMm`: hauteur des barres
 */
export default function Code128({ value, widthMm = 68, heightMm = 13 }: {
  value: string
  widthMm?: number
  heightMm?: number
}): JSX.Element {
  const largeurs = encoderCode128B(value)
  const totalModules = [...largeurs].reduce((s, c) => s + Number(c), 0)
  const moduleMm = widthMm / totalModules

  const barres: Array<{ xMm: number; wMm: number }> = []
  let x = 0
  ;[...largeurs].forEach((c, i) => {
    const w = Number(c) * moduleMm
    if (i % 2 === 0) barres.push({ xMm: x, wMm: w }) // indices pairs = barres noires
    x += w
  })

  return (
    <svg
      width={`${widthMm}mm`}
      height={`${heightMm}mm`}
      viewBox={`0 0 ${widthMm} ${heightMm}`}
      style={{ display: 'block' }}
      shapeRendering="crispEdges"
    >
      {barres.map((b, i) => (
        <rect key={i} x={b.xMm} y={0} width={b.wMm} height={heightMm} fill="#000" />
      ))}
    </svg>
  )
}
