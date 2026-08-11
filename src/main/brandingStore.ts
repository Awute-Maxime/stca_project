import { readFileSync, writeFileSync, mkdirSync, watch, type FSWatcher } from 'fs'
import { dirname } from 'path'
import { cheminBranding } from '../shared/cheminBranding'
import { fusionnerBranding, type BrandingConfig } from '../shared/branding'

export function lireBranding(): BrandingConfig {
  try {
    return fusionnerBranding(JSON.parse(readFileSync(cheminBranding(), 'utf-8')))
  } catch {
    return fusionnerBranding({}) // absent / illisible / JSON invalide → défauts
  }
}

export function ecrireBranding(entree: BrandingConfig): BrandingConfig {
  const complet = fusionnerBranding(entree)
  const chemin = cheminBranding()
  mkdirSync(dirname(chemin), { recursive: true })
  writeFileSync(chemin, JSON.stringify(complet, null, 2), 'utf-8')
  return complet
}

export function surveillerBranding(onChange: () => void): FSWatcher | null {
  try {
    return watch(cheminBranding(), () => onChange())
  } catch {
    return null // le fichier peut ne pas exister encore
  }
}
