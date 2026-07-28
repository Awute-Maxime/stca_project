// src/shared/cheminBaseM.ts
// Chemin du fichier « base STCA M » partagé entre l'app principale TCIT et Pointage.
// ⚠️ CE FICHIER EST DUPLIQUÉ À L'IDENTIQUE côté STCA-Electron (Phase 7).
import { join } from 'path'
import { homedir } from 'os'

export function cheminBaseM(): string {
  const racine = process.env.PROGRAMDATA || join(homedir(), '.tcit')
  return join(racine, 'TCIT', 'stca-m.json')
}
