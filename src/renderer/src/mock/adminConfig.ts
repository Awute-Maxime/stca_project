import { electronApi } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// Garde Administrateur — MIGRÉ EN BASE (Phase 3, 25/07/2026).
// Le mot de passe de forçage vit dans la table `parametre` (clé mdp.forcage) et
// la validation se fait dans le MAIN (mots de passe utilisateurs hachés).
// Ces fonctions sont désormais ASYNCHRONES (aller-retour IPC).
// ─────────────────────────────────────────────────────────────────────────────

export async function getMdpForcage(): Promise<string> {
  const r = await electronApi.dbAdminGetForcage()
  return r.ok ? (r.mdp ?? '') : ''
}

export async function setMdpForcage(mdp: string): Promise<void> {
  await electronApi.dbAdminSetForcage(mdp)
}

/**
 * true si le mot de passe correspond au forçage configuré OU au mot de passe
 * d'un compte administrateur actif. Vérification côté main (hachage).
 */
export async function estMdpAdminValide(mdp: string): Promise<boolean> {
  if (!mdp) return false
  const r = await electronApi.dbAdminPasswordValid(mdp)
  return r.ok ? !!r.valide : false
}
