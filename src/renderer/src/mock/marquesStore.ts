import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Store marques/modèles partagé — SOURCE UNIQUE de vérité (règle projet) :
// le Fichier Marques est LA référence, et le modal « Marque - Modèle » de
// l'Enregistrement lit exactement la même liste. Tout ajout/modif/suppression
// est persisté (localStorage) et synchronisé entre toutes les fenêtres.
// Liste de base = fusion dédoublonnée des deux anciennes listes.
// ─────────────────────────────────────────────────────────────────────────────

export interface Marque {
  id: number
  nom: string
}

const LS_KEY = 'tcit_marques'
const LOCAL_EVENT = 'tcit:marques-changed'

// Fusion des deux anciennes listes (Fichier Marques + modal Enregistrement)
const BASE_NOMS = [
  '140 H', '3256 33', 'A.C.M. VQ-2485SA3/ ALLOY TIPPER', 'ABG DD74', 'ABI E.B.G 1200',
  'ACAM M 2770 G', 'ACERBI 03G', 'ACERBI 08R', 'ACERBI 0L8451-BT0',
  'ACERBI 0L 88308T0/ ALLOY TIPPER', 'ACERBI 11L537', 'ACERBI 125 MG', 'ACERBI 125 PS',
  'ACERBI 135MG', 'ACERBI 135MHS', 'ACERBI 135 MSH', 'ACERBI 135PG', 'ACERBI 135 PS',
  'ACERBI 135PS00', 'ACERBI 135 PSA', 'ACERBI 135PSF', 'ACERBI 135 PSR', 'ACTM',
  'ACTM 55315', 'ACTM A24320C', 'ACTM ORIGINAL', 'ACTM R3232', 'ACTM R 35315',
  'A.C.T.M R44315', 'ACTM S070415', 'ACTM S 322', 'ACTM S32215C', 'ACTM S32215E',
  'ACTM S32215H', 'ACTM S3322/ ALLOY TIPPER', 'ACTM S34320', 'ACTM S34320A',
  'ACTM S 443', 'ACTM S 44315', 'DAF XF 105', 'FIAT DUCATO', 'FOTON BJ1069',
  'HONDA ACCORD', 'HONDA CB 125', 'HOWO A7', 'ISUZU D-MAX', 'ISUZU NQR 75P',
  'MAN TGX 18.440', 'MAN TGX 18.480', 'MERCEDES ACTROS', 'MERCEDES ACTROS 1844',
  'MERCEDES SPRINTER', 'MITSUBISHI L200', 'NISSAN NAVARA', 'NISSAN PATROL',
  'OPEL ASTRA', 'PEUGEOT 306', 'PEUGEOT BOXER', 'RENAULT MASTER', 'RENAULT TRAFIC',
  'RENAULT TRUCKS T 480', 'SCANIA R500', 'TOYOTA COROLLA', 'TOYOTA HIACE',
  'TOYOTA HILUX', 'TOYOTA LAND CRUISER', 'TOYOTA LAND CRUISER 79',
  'VOLKSWAGEN GOLF', 'VOLKSWAGEN TRANSPORTER', 'VOLVO FH16 750', 'YAMAHA FZ 150',
]

function baseList(): Marque[] {
  // Dédoublonnage insensible à la casse, tri français
  const vus = new Set<string>()
  const noms: string[] = []
  for (const n of BASE_NOMS) {
    const cle = n.trim().toUpperCase()
    if (!vus.has(cle)) { vus.add(cle); noms.push(n.trim()) }
  }
  noms.sort((a, b) => a.localeCompare(b, 'fr'))
  return noms.map((nom, i) => ({ id: i + 1, nom }))
}

function load(): Marque[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as Marque[]
  } catch { /* liste de base */ }
  return baseList()
}

function save(list: Marque[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

export function getAllMarques(): Marque[] {
  return load()
}

/** Ajoute une marque. Retourne un message d'erreur (doublon), ou null si OK. */
export function addMarque(nom: string): string | null {
  const val = nom.trim()
  if (!val) return 'Le libellé est vide.'
  const list = load()
  if (list.some(m => m.nom.toUpperCase() === val.toUpperCase())) return 'Cette marque existe déjà.'
  list.push({ id: list.reduce((m, x) => Math.max(m, x.id), 0) + 1, nom: val })
  save(list)
  return null
}

/** Renomme une marque. Retourne un message d'erreur, ou null si OK. */
export function renameMarque(id: number, nom: string): string | null {
  const val = nom.trim()
  if (!val) return 'Le libellé est vide.'
  const list = load()
  if (list.some(m => m.id !== id && m.nom.toUpperCase() === val.toUpperCase())) return 'Cette marque existe déjà.'
  save(list.map(m => (m.id === id ? { ...m, nom: val } : m)))
  return null
}

/** Supprime une marque. */
export function removeMarque(id: number): void {
  save(load().filter(m => m.id !== id))
}

/** Hook React : liste re-rendue à chaque changement (cette fenêtre ou une autre). */
export function useMarques(): Marque[] {
  const [list, setList] = useState<Marque[]>(load)

  useEffect(() => {
    const refresh = (): void => setList(load())
    const onStorage = (e: StorageEvent): void => {
      if (e.key === LS_KEY) refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(LOCAL_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(LOCAL_EVENT, refresh)
    }
  }, [])

  return list
}
