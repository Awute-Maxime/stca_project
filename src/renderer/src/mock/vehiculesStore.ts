import { useState, useEffect } from 'react'
import { electronApi, type DbEnregistrement, type DbEnregistrementInput } from '@api/electron'
import type { MockVehicule } from './vehicules'

// ─────────────────────────────────────────────────────────────────────────────
// Enregistrements — MIGRÉ EN BASE (Phase 3, 26/07/2026).
// Approche « cache actif + archives à la demande » : ce store met en cache la
// base ACTIVE (dateArchivage nul), le vrai plan de travail. Les archives (gros
// volume) sont interrogées à la demande via archivesStore.
//
// L'API publique reste identique (getAllVehicules sync depuis le cache,
// useVehicules réactif) pour ne pas toucher les 19 consommateurs. Les écritures
// passent par IPC ; la synchro multi-fenêtres se fait via db:changed('enregistrements').
// ─────────────────────────────────────────────────────────────────────────────

// Le DTO base a exactement le shape de MockVehicule → interchangeables.
let cache: MockVehicule[] = []
const abonnes = new Set<() => void>()
let initialise = false

async function rechargerCache(): Promise<void> {
  const r = await electronApi.dbEnregListActifs()
  if (r.ok && r.items) {
    cache = r.items as MockVehicule[]
    abonnes.forEach(fn => fn())
  } else {
    console.error('[vehiculesStore] lecture base échouée :', r.error)
  }
}

function assurerInit(): void {
  if (initialise) return
  initialise = true
  void rechargerCache()
  electronApi.onDbChanged(p => { if (p.domaine === 'enregistrements') void rechargerCache() })
}
assurerInit()

/** Tous les véhicules ACTIFS — cache synchrone (le plus récent d'abord). */
export function getAllVehicules(): MockVehicule[] {
  assurerInit()
  return cache
}

/**
 * Ajoute un enregistrement. Le main attribue la référence (max+1 défensif) et
 * la retourne. Retourne null en cas d'échec (doublon châssis/immat…).
 */
export async function addVehicule(input: DbEnregistrementInput): Promise<string | null> {
  const r = await electronApi.dbEnregAdd(input)
  if (!r.ok) { console.error('[addVehicule]', r.error); return null }
  await rechargerCache()
  return r.ref ?? null
}

/** Modifie un enregistrement (par réf). */
export async function updateVehicule(ref: string, changes: Partial<DbEnregistrement>): Promise<void> {
  const r = await electronApi.dbEnregUpdate(ref, changes)
  if (!r.ok) console.error('[updateVehicule]', r.error)
  await rechargerCache()
}

/** Supprime un enregistrement (par réf). */
export async function removeVehicule(ref: string): Promise<void> {
  const r = await electronApi.dbEnregRemove(ref)
  if (!r.ok) console.error('[removeVehicule]', r.error)
  await rechargerCache()
}

// ── Compteur du N° de référence (Outils+Config. → Fixer N° Référence) ────────
/** Réf. la plus élevée réellement utilisée (actifs ET archivés). */
export async function maxRefEnBase(): Promise<number> {
  const r = await electronApi.dbEnregRefCompteurGet()
  return r.ok ? (r.maxBase ?? 0) : 0
}
/** « N° de référence en cours » = compteur persisté. */
export async function getRefCompteur(): Promise<number> {
  const r = await electronApi.dbEnregRefCompteurGet()
  return r.ok ? (r.compteur ?? 0) : 0
}
export async function setRefCompteur(n: number): Promise<void> {
  await electronApi.dbEnregRefCompteurSet(n)
}
/** Prochaine référence (défensif côté main : jamais sous ce qui existe déjà). */
export async function nextRef(): Promise<string> {
  const r = await electronApi.dbEnregNextRef()
  return r.ok ? (r.ref ?? '000001') : '000001'
}

/**
 * Prochain n° d'immatriculation (partie numérique) pour une destination :
 * max(base référentiel, max réel en base) + 1 — anti-doublon.
 */
export async function prochainNumImmat(code: string, baseReferentiel: number): Promise<number> {
  const r = await electronApi.dbEnregMaxImmatForDest(code)
  const maxBase = r.ok ? (r.max ?? 0) : 0
  return Math.max(baseReferentiel, maxBase) + 1
}

/**
 * Hook React : liste des véhicules actifs, re-rendue quand la base change
 * (cette fenêtre ou une autre, via db:changed('enregistrements')).
 */
export function useVehicules(): MockVehicule[] {
  const [list, setList] = useState<MockVehicule[]>(cache)

  useEffect(() => {
    assurerInit()
    const fn = (): void => setList(cache)
    abonnes.add(fn)
    fn()
    void rechargerCache()
    return () => { abonnes.delete(fn) }
  }, [])

  return list
}
