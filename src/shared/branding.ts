// Module PUR (aucune dépendance Node/DOM) : importable par le main ET le renderer.
export type ThemeChoix = 'clair' | 'sombre' | 'auto'

export interface Coordonnees {
  adresse: string; tel: string; email: string; siteWeb: string; nif: string; rccm: string
}
export interface BrandingIdentite {
  nom: string; sigle: string; slogan: string; logo: string | null; coordonnees: Coordonnees
}
export interface BrandingApparence { theme: ThemeChoix; couleurAccent: string }
export interface BrandingDocuments {
  logo: string | null; cachet: string | null; enTete: string; piedDePage: string
  mentionsLegales: string; numeroAgrement: string; devise: string; coordonneesBancaires: string
}
export interface BrandingConfig {
  version: number
  identite: BrandingIdentite
  apparence: BrandingApparence
  documents: BrandingDocuments
}

const ACCENT_DEFAUT = '#2563EB'

export const BRANDING_DEFAUT: BrandingConfig = {
  version: 1,
  identite: {
    nom: "TCIT — Togolaise de Contrôle et d'Immatriculation Transit",
    sigle: 'TCIT',
    slogan: 'Contrôle · Immatriculation · Transit',
    logo: null,
    coordonnees: { adresse: '', tel: '', email: '', siteWeb: '', nif: '', rccm: '' },
  },
  apparence: { theme: 'clair', couleurAccent: ACCENT_DEFAUT },
  documents: {
    logo: null, cachet: null, enTete: '', piedDePage: '', mentionsLegales: '',
    numeroAgrement: '', devise: 'FCFA', coordonneesBancaires: '',
  },
}

const estObjet = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const chaine = (v: unknown, def: string): string => (typeof v === 'string' ? v : def)

export function normaliserCouleur(v: unknown): string {
  return typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : '#2563EB'
}

export function resoudreTheme(theme: ThemeChoix, prefereSombre: boolean): 'clair' | 'sombre' {
  if (theme === 'sombre') return 'sombre'
  if (theme === 'auto') return prefereSombre ? 'sombre' : 'clair'
  return 'clair'
}

/** Fusionne une valeur (potentiellement partielle/corrompue) avec les défauts TCIT. */
export function fusionnerBranding(entree: unknown): BrandingConfig {
  if (!estObjet(entree)) return structuredClone(BRANDING_DEFAUT)
  const d = BRANDING_DEFAUT
  const idt = estObjet(entree.identite) ? entree.identite : {}
  const coo = estObjet(idt.coordonnees) ? idt.coordonnees : {}
  const app = estObjet(entree.apparence) ? entree.apparence : {}
  const doc = estObjet(entree.documents) ? entree.documents : {}
  const theme = (['clair', 'sombre', 'auto'] as const).includes(app.theme as ThemeChoix)
    ? (app.theme as ThemeChoix) : 'clair'
  return {
    version: typeof entree.version === 'number' ? entree.version : 1,
    identite: {
      nom: chaine(idt.nom, d.identite.nom),
      sigle: chaine(idt.sigle, d.identite.sigle),
      slogan: chaine(idt.slogan, d.identite.slogan),
      logo: typeof idt.logo === 'string' ? idt.logo : null,
      coordonnees: {
        adresse: chaine(coo.adresse, ''), tel: chaine(coo.tel, ''), email: chaine(coo.email, ''),
        siteWeb: chaine(coo.siteWeb, ''), nif: chaine(coo.nif, ''), rccm: chaine(coo.rccm, ''),
      },
    },
    apparence: { theme, couleurAccent: normaliserCouleur(app.couleurAccent) },
    documents: {
      logo: typeof doc.logo === 'string' ? doc.logo : null,
      cachet: typeof doc.cachet === 'string' ? doc.cachet : null,
      enTete: chaine(doc.enTete, ''), piedDePage: chaine(doc.piedDePage, ''),
      mentionsLegales: chaine(doc.mentionsLegales, ''), numeroAgrement: chaine(doc.numeroAgrement, ''),
      devise: chaine(doc.devise, 'FCFA'), coordonneesBancaires: chaine(doc.coordonneesBancaires, ''),
    },
  }
}
