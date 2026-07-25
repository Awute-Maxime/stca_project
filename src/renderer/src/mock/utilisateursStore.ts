import { useState, useEffect } from 'react'
import { electronApi, type DbUser, type DbUserInput } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// Utilisateurs — MIGRÉ EN BASE (Phase 3, 25/07/2026).
// Table `utilisateur` (mots de passe HACHÉS côté main, jamais renvoyés ici).
// Le login et la garde admin sont vérifiés dans le main (referentiels.ts).
// Le store ne manipule que des données SANS mot de passe (masque « •••••• »).
//
// Modèle asynchrone : cache module + useUtilisateurs réactif via
// db:changed('utilisateurs'). add/update/remove passent par IPC.
// Protection « dernier admin actif » appliquée dans le main.
// ─────────────────────────────────────────────────────────────────────────────

export type Utilisateur = DbUser

let cache: Utilisateur[] = []
const abonnes = new Set<() => void>()
let initialise = false

async function rechargerCache(): Promise<void> {
  const r = await electronApi.dbUsersList()
  if (r.ok && r.items) {
    cache = r.items
    abonnes.forEach(fn => fn())
  } else {
    console.error('[utilisateursStore] lecture base échouée :', r.error)
  }
}

function assurerInit(): void {
  if (initialise) return
  initialise = true
  void rechargerCache()
  electronApi.onDbChanged(p => { if (p.domaine === 'utilisateurs') void rechargerCache() })
}
assurerInit()

/** Liste courante (sans mot de passe) — cache synchrone. */
export function getAllUtilisateurs(): Utilisateur[] {
  assurerInit()
  return cache
}

/** Ajoute un utilisateur. Retourne un message d'erreur (login pris…), ou null. */
export async function addUtilisateur(input: DbUserInput): Promise<string | null> {
  const r = await electronApi.dbUsersAdd(input)
  if (!r.ok) return r.error ?? 'Ajout échoué.'
  await rechargerCache()
  return r.error ?? null // erreur métier éventuelle (ex. login déjà pris)
}

/** Modifie un utilisateur. `changes.motDePasse` (si présent) sera haché côté main. */
export async function updateUtilisateur(id: number, changes: Partial<DbUserInput>): Promise<string | null> {
  const r = await electronApi.dbUsersUpdate(id, changes)
  if (!r.ok) return r.error ?? 'Modification échouée.'
  await rechargerCache()
  return r.error ?? null // ex. « dernier administrateur actif »
}

/** Supprime un utilisateur. Retourne un message d'erreur, ou null. */
export async function removeUtilisateur(id: number): Promise<string | null> {
  const r = await electronApi.dbUsersRemove(id)
  if (!r.ok) return r.error ?? 'Suppression échouée.'
  await rechargerCache()
  return r.error ?? null
}

/** Hook React : liste des utilisateurs, synchronisée entre toutes les fenêtres. */
export function useUtilisateurs(): Utilisateur[] {
  const [list, setList] = useState<Utilisateur[]>(cache)

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
