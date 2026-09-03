// Génère l'icône TCIT (resources/icon.ico) — étoile dorée sur fond bleu marine
// arrondi, cohérente avec le splash et l'identité TCIT.
// Pur Node (zlib), sans dépendance : rasterisation + anti-crénelage 4×4, PNG
// écrit à la main puis emballé dans un conteneur ICO (PNG embarqué, Windows ≥ Vista).
// Usage : node scripts/gen-icon.mjs [dossier-de-sortie]
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const N = 256            // taille finale
const SS = 4             // super-échantillonnage (anti-crénelage)
const RADIUS = 52        // rayon des coins (sur 256)

// Étoile TCIT — mêmes points que le SVG du splash (viewBox 56×56), mise à l'échelle
const ETOILE_56 = [
  [28, 2], [33.8, 18.4], [51.8, 18.4], [37.4, 28.4], [43.2, 44.8],
  [28, 34.8], [12.8, 44.8], [18.6, 28.4], [4.2, 18.4], [22.2, 18.4],
]
const ECHELLE = N / 56 * 0.62               // étoile à 62 % de la tuile
const DECALAGE = (N - 56 * ECHELLE) / 2
const ETOILE = ETOILE_56.map(([x, y]) => [x * ECHELLE + DECALAGE, y * ECHELLE + DECALAGE])

const dansPolygone = (x, y, pts) => {
  let dedans = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans
  }
  return dedans
}

/** Coin arrondi : le point est-il dans le rectangle à coins arrondis ? */
const dansTuile = (x, y) => {
  const r = RADIUS
  const cx = x < r ? r : x > N - r ? N - r : x
  const cy = y < r ? r : y > N - r ? N - r : y
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

const melange = (a, b, t) => Math.round(a + (b - a) * t)

// Palette TCIT
const FOND_HAUT = [30, 64, 128]   // #1E4080
const FOND_BAS = [13, 32, 64]     // #0D2040
const OR = [255, 223, 0]          // #FFDF00
const OR_OMBRE = [214, 168, 0]

const px = Buffer.alloc(N * N * 4)
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    let aTuile = 0, aEtoile = 0
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const px2 = x + (sx + 0.5) / SS
        const py2 = y + (sy + 0.5) / SS
        if (dansTuile(px2, py2)) aTuile++
        if (dansPolygone(px2, py2, ETOILE)) aEtoile++
      }
    }
    const total = SS * SS
    const at = aTuile / total
    const ae = (aEtoile / total) * at        // l'étoile est bornée par la tuile
    const t = y / N
    const fond = [
      melange(FOND_HAUT[0], FOND_BAS[0], t),
      melange(FOND_HAUT[1], FOND_BAS[1], t),
      melange(FOND_HAUT[2], FOND_BAS[2], t),
    ]
    // dégradé subtil sur l'étoile (haut plus clair)
    const or = [
      melange(OR[0], OR_OMBRE[0], t),
      melange(OR[1], OR_OMBRE[1], t),
      melange(OR[2], OR_OMBRE[2], t),
    ]
    const i = (y * N + x) * 4
    px[i] = melange(fond[0], or[0], ae)
    px[i + 1] = melange(fond[1], or[1], ae)
    px[i + 2] = melange(fond[2], or[2], ae)
    px[i + 3] = Math.round(at * 255)
  }
}

// ── Encodage PNG (RGBA, sans filtre) ────────────────────────────────────────
const crcTable = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4)
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
const brut = Buffer.alloc((N * 4 + 1) * N)
for (let y = 0; y < N; y++) {
  brut[y * (N * 4 + 1)] = 0
  px.copy(brut, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4)
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(brut, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

// ── Conteneur ICO (une image PNG 256×256) ───────────────────────────────────
const dir = Buffer.alloc(6)
dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(1, 4)
const entree = Buffer.alloc(16)
entree[0] = 0; entree[1] = 0          // 0 = 256 px
entree[2] = 0; entree[3] = 0
entree.writeUInt16LE(1, 4); entree.writeUInt16LE(32, 6)
entree.writeUInt32LE(png.length, 8); entree.writeUInt32LE(22, 12)
const ico = Buffer.concat([dir, entree, png])

const sortie = process.argv[2] ?? 'resources'
mkdirSync(sortie, { recursive: true })
writeFileSync(join(sortie, 'icon.ico'), ico)
writeFileSync(join(sortie, 'icon.png'), png)   // utile pour Linux/aperçu
console.log(`icône TCIT écrite → ${join(sortie, 'icon.ico')} (${(ico.length / 1024).toFixed(1)} Ko)`)
