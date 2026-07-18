import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import dayjs from 'dayjs'
import Code128 from './Code128'

// ─────────────────────────────────────────────────────────────────────────────
// FICHE ID JAUNE — 10,5 × 21,2 cm, ENTIÈREMENT imprimée (contrairement à la
// carte grise pré-imprimée). Elle ACCOMPAGNE la carte grise : ses codes-barres
// contiennent les informations d'authentification (les données de la carte
// grise s'effacent parfois avec le temps — la fiche permet de les retrouver).
// Modèle : photo de la fiche réelle STCA II fournie le 18/07/2026.
//
// Codes-barres = VRAI Code 128 scannable. Scan de la fiche réelle : les deux
// codes-barres contiennent « Y9209CK » (immat + code frontière) — une simple
// répétition. Choix validé par l'utilisateur (18/07/2026), on fait mieux :
// - HAUT : N° de CHÂSSIS (VIN) — l'identifiant mondial unique du véhicule.
// - BAS  : immat+frontière | N° Tri | clé d'authentification (4 caractères
//   dérivés de l'immat, du châssis et du N° Tri).
// → À eux deux, les codes-barres permettent de reconstituer TOUTES les
//   informations essentielles d'une carte grise effacée (châssis, immat,
//   frontière, N° Tri) et de détecter une fiche falsifiée.
// ─────────────────────────────────────────────────────────────────────────────

// Clé secrète de dérivation (authentification des fiches émises par TCIT)
const SECRET_AUTH = 'TCIT-FICHE-ID-2026'

/**
 * Clé d'authentification (4 caractères, alphabet sans ambigus) dérivée de
 * l'immatriculation, du châssis et du N° Tri. Une fiche falsifiée (données
 * modifiées) produit une clé différente — vérifiable en scannant le
 * code-barres bas.
 */
export function cleAuthentification(immat: string, destCode: string, chassis: string, numTri: string): string {
  const texte = `${immat}${destCode}|${chassis}|${numTri}|${SECRET_AUTH}`.toUpperCase()
  let h = 2166136261
  for (const c of texte) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  h = h >>> 0
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let cle = ''
  for (let i = 0; i < 4; i++) { cle += alphabet[h % 32]; h = Math.floor(h / 32) }
  return cle
}

export interface FicheIdData {
  nom: string
  pays: string        // pays de destination (ex. BURKINA-FASO)
  chassis: string
  marque: string      // ex. TOYOTA - RAV4
  parc: string        // transit / maison (ex. SLTT)
  destCode: string    // ex. CK
  immat: string       // ex. Y9209 — affichée « Y 9209 »
  numTri: string
  dateTri: string     // DD/MM/YYYY
}

export const FICHE_ID_WIDTH_MM = 105
export const FICHE_ID_HEIGHT_MM = 212

const FONT = "Arial, 'Segoe UI', sans-serif"

/** Immatriculation « Y9209 » → « Y 9209 » (comme le modèle réel). */
function fmtImmat(immat: string): string {
  const m = immat.match(/^([A-Z]+)(\d+)$/i)
  return m ? `${m[1]} ${m[2]}` : immat
}

function champ(topMm: number, opts?: { leftMm?: number; size?: number; bold?: boolean; spacing?: number }): CSSProperties {
  return {
    position: 'absolute',
    top: `${topMm}mm`,
    left: `${opts?.leftMm ?? 14}mm`,
    fontFamily: FONT,
    fontSize: `${opts?.size ?? 4}mm`,
    fontWeight: opts?.bold ? 700 : 400,
    letterSpacing: opts?.spacing != null ? `${opts.spacing}mm` : undefined,
    color: '#111',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  }
}

// ── Le document ─────────────────────────────────────────────────────────────
export function FicheIdDoc({ data }: { data: FicheIdData }): JSX.Element {
  const maintenant = dayjs().format('DD/MM/YYYY HH:mm:ss')
  // Codes-barres (cf. commentaire d'entête) :
  // haut = châssis (VIN) ; bas = immat+frontière | N° Tri | clé d'auth.
  const idComplet = `${data.immat}${data.destCode}`.toUpperCase()
  const codeHaut = data.chassis.toUpperCase() || idComplet || 'TCIT'
  const codeBas = idComplet
    ? `${idComplet}|${data.numTri}|${cleAuthentification(data.immat, data.destCode, data.chassis, data.numTri)}`
    : 'TCIT'

  return (
    <div
      id="ficheid-print-root"
      style={{
        position: 'relative',
        width: `${FICHE_ID_WIDTH_MM}mm`,
        height: `${FICHE_ID_HEIGHT_MM}mm`,
        background: '#fff',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Entête : STCA + date/heure d'impression */}
      <div style={champ(6.5, { size: 6, bold: true, spacing: 0.8 })}>STCA</div>
      <div style={{ ...champ(7.5, { size: 3 }), left: 'auto', right: '10mm' }}>
        Le :&nbsp; {maintenant}
      </div>

      {/* Code-barres haut — authentification (châssis) */}
      <div style={{ position: 'absolute', top: '24mm', left: '14mm' }}>
        <Code128 value={codeHaut} widthMm={68} heightMm={13} />
      </div>

      {/* Identité */}
      <div style={champ(48, { size: 4.2, bold: true })}>{data.nom.toUpperCase()}</div>
      <div style={champ(55.5, { size: 3.8 })}>{data.pays.toUpperCase()}</div>

      {/* Véhicule */}
      <div style={champ(72.5, { size: 4.2, bold: true })}>{data.chassis}</div>
      <div style={champ(83.5, { size: 3.8 })}>{data.marque.toUpperCase()}</div>

      {/* Transit / maison */}
      <div style={champ(100.5, { size: 4.2, bold: true })}>{data.parc.toUpperCase()}</div>

      {/* N° Immat. / N° Tri / Du */}
      <div style={champ(115, { size: 3.6 })}>N° Immat. :</div>
      <div style={champ(114.4, { leftMm: 42, size: 5.2, bold: true })}>
        {data.destCode}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{fmtImmat(data.immat)}
      </div>

      <div style={champ(128, { size: 3.6 })}>N° Tri :</div>
      <div style={champ(127.6, { leftMm: 42, size: 4.5, bold: true })}>{data.numTri}</div>

      <div style={champ(135.5, { size: 3.6 })}>Du :</div>
      <div style={champ(135.1, { leftMm: 42, size: 4.5, bold: true })}>{data.dateTri}</div>

      {/* Code-barres bas — authentification (frontière + immat + tri) */}
      <div style={{ position: 'absolute', top: '152mm', left: '14mm' }}>
        <Code128 value={codeBas} widthMm={68} heightMm={13} />
      </div>

      {/* Texte de remplacement de la photocopie */}
      <div style={{
        position: 'absolute', top: '175mm', left: '8mm', right: '8mm',
        textAlign: 'center', fontFamily: FONT, fontSize: '3.6mm', fontWeight: 600,
        color: '#111', lineHeight: 1.45,
      }}>
        Cette fiche de description du véhicule remplace la
        <br />photocopie de la Carte Grise.
        <br />(la photocopie n&apos;est plus demandée)
      </div>

      {/* Pied de page */}
      <div style={{
        position: 'absolute', top: '199mm', left: 0, right: '6mm',
        textAlign: 'right', fontFamily: FONT, fontSize: '2.2mm', color: '#555',
      }}>
        Usage strictement réservé à TCIT&nbsp; [v{dayjs().format('YYYY')}-1]&nbsp;&nbsp; Toute reproduction interdite.
      </div>
    </div>
  )
}

// ── CSS d'impression : page 105×212mm, seule la fiche sort ──────────────────
export function FicheIdPrintCss(): JSX.Element {
  return (
    <style>{`
      @media print {
        @page { size: ${FICHE_ID_WIDTH_MM}mm ${FICHE_ID_HEIGHT_MM}mm; margin: 0; }
        body * { visibility: hidden !important; }
        #ficheid-print-root, #ficheid-print-root * { visibility: visible !important; }
        #ficheid-print-root {
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
export function FicheIdPrintDirect({ data, onDone }: {
  data: FicheIdData
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
      <FicheIdPrintCss />
      <FicheIdDoc data={data} />
    </div>
  )
}
