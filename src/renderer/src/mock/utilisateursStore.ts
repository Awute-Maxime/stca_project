import { useState, useEffect } from 'react'
import { mockUtilisateurs, type MockUtilisateur } from './utilisateurs'

// ─────────────────────────────────────────────────────────────────────────────
// Store utilisateurs partagé — même architecture que vehiculesStore :
// liste complète persistée dans localStorage (initialisée depuis les mocks),
// synchro toutes fenêtres via event storage + CustomEvent local.
// Le LOGIN lit ce store : un utilisateur créé ici peut se connecter aussitôt.
// Protection : impossible de supprimer/désactiver/rétrograder le DERNIER
// administrateur actif (sinon verrouillage définitif hors de l'application).
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_utilisateurs'
const LOCAL_EVENT = 'tcit:utilisateurs-changed'

function load(): MockUtilisateur[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as MockUtilisateur[]
  } catch { /* liste de base */ }
  return mockUtilisateurs.map(u => ({ ...u }))
}

function save(list: MockUtilisateur[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

export function getAllUtilisateurs(): MockUtilisateur[] {
  return load()
}

/** true si cet utilisateur est le dernier admin ACTIF de la liste. */
function estDernierAdminActif(list: MockUtilisateur[], id: number): boolean {
  const u = list.find(x => x.id === id)
  if (!u || !u.administrateur || !u.compteActif) return false
  return list.filter(x => x.administrateur && x.compteActif).length <= 1
}

const MSG_DERNIER_ADMIN =
  "Impossible : c'est le dernier administrateur actif. Créez ou réactivez d'abord un autre administrateur."

/** Ajoute un utilisateur (id auto). */
export function addUtilisateur(u: Omit<MockUtilisateur, 'id'>): void {
  const list = load()
  list.push({ ...u, id: list.reduce((m, x) => Math.max(m, x.id), 0) + 1 })
  save(list)
}

/** Modifie un utilisateur. Retourne un message d'erreur, ou null si OK. */
export function updateUtilisateur(id: number, changes: Partial<MockUtilisateur>): string | null {
  const list = load()
  const retireAdmin = changes.administrateur === false || changes.compteActif === false
  if (retireAdmin && estDernierAdminActif(list, id)) return MSG_DERNIER_ADMIN
  save(list.map(u => (u.id === id ? { ...u, ...changes, id } : u)))
  return null
}

/** Supprime un utilisateur. Retourne un message d'erreur, ou null si OK. */
export function removeUtilisateur(id: number): string | null {
  const list = load()
  if (estDernierAdminActif(list, id)) return MSG_DERNIER_ADMIN
  save(list.filter(u => u.id !== id))
  return null
}

/** Hook React : liste re-rendue à chaque changement (cette fenêtre ou une autre). */
export function useUtilisateurs(): MockUtilisateur[] {
  const [list, setList] = useState<MockUtilisateur[]>(load)

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
