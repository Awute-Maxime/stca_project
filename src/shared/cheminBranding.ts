// Chemin du fichier de personnalisation partagé. ⚠️ À DUPLIQUER à l'identique dans
// tcit-ui / Affichage / Pointage (Plan C), comme cheminBaseM.ts.
import { join } from 'path'
import { homedir } from 'os'

export function cheminBranding(): string {
  const racine = process.env.PROGRAMDATA || join(homedir(), '.tcit')
  return join(racine, 'TCIT', 'branding.json')
}
