import { getAllUtilisateurs } from './utilisateursStore'

// ─────────────────────────────────────────────────────────────────────────────
// Mot de passe de forçage Administrateur (menu Outils+Config. → Clef
// d'administration). Persisté dans localStorage — configurable via la fenêtre
// « Configuration 'Mots de passe' Administrateur ».
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_mdp_forcage'

export function getMdpForcage(): string {
  return localStorage.getItem(LS_KEY) ?? ''
}

export function setMdpForcage(mdp: string): void {
  localStorage.setItem(LS_KEY, mdp)
}

/**
 * Un mot de passe donne accès aux fonctions d'Administrateur s'il correspond
 * au mot de passe de forçage configuré, OU au mot de passe d'un compte
 * administrateur actif (ex. awute) — ainsi l'accès reste possible tant que le
 * forçage n'a pas encore été configuré.
 */
export function estMdpAdminValide(mdp: string): boolean {
  if (!mdp) return false
  const forcage = getMdpForcage()
  if (forcage && mdp === forcage) return true
  return getAllUtilisateurs().some(u => u.administrateur && u.compteActif && u.motDePasse === mdp)
}
