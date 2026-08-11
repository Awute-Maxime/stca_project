import { resoudreTheme, type BrandingConfig } from '../../../shared/branding'

export function prefereSombreOS(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
}

/** Pose data-theme (light|dark) + --accent sur <html>. Le clair ne change RIEN au rendu actuel. */
export function appliquerBranding(cfg: BrandingConfig): void {
  const sombre = resoudreTheme(cfg.apparence.theme, prefereSombreOS()) === 'sombre'
  const root = document.documentElement
  root.setAttribute('data-theme', sombre ? 'dark' : 'light')
  root.style.setProperty('--accent', cfg.apparence.couleurAccent)
}
