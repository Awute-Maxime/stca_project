export interface DbUser {
  id: number
  login: string
  nom: string
  administrateur: boolean
  compteActif: boolean
  motDePasseMasque: string
}
export interface DbUserInput {
  login: string
  motDePasse: string
  nom: string
  administrateur: boolean
  compteActif: boolean
}

// Enregistrements (shape historique MockVehicule, servi par la base)
export interface DbEnregistrement {
  id: number
  ref: string
  date: string
  immat: string
  chassis: string
  typeVehicule: string
  marqueModele: string
  destination: string
  montant: number
  nomAcheteur: string
  paysResidence: string
  paysDestination: string
  parc: string
  agent: string
  recyclerPlaque: boolean
  numTri: string
  dateTri: string
}
export type DbEnregistrementInput = Omit<DbEnregistrement, 'id' | 'ref'>
export interface DbArchive extends DbEnregistrement {
  dateArchivage: string
  archivePar: string
}

export interface DbAssurTarif {
  type: string; tarif: number; taxe: number; commissionPct: number
  detail: { rc: number; cedeao: number; individuelle: number; accessoires: number }
}
export interface DbAssurConfig {
  imprimerAssurances: boolean
  assureurs: Array<{ id: number; nom: string; coordonnees: string; tarifs: DbAssurTarif[] }>
}

export interface DbDestination {
  id: number
  code: string
  nom: string
  lettre: string
  tarif: number
  numImmatActuel: number
  couleur: string
  contact: string | null
  description: string | null
}
export interface DbDestinationInput {
  code: string
  nom: string
  lettre: string
  tarif: number
  numImmatActuel: number
  couleur: string
}

export interface ImportPreview {
  ok: boolean
  error?: string
  columns?: string[]
  rows?: string[][]
  delimiter?: string
  totalApprox?: number
}
export interface ImportReport {
  ok: boolean
  error?: string
  total: number
  importes: number
  doublons: number
  erreurs: { ligne: number; raison: string }[]
}

// ── Poste d'affichage (émetteur) ──────────────────────────────────────────────
export interface AffichageConfig {
  actif: boolean
  nomPoste: string
  ip: string
  port: number
}
export interface AffichageEtat {
  actif: boolean
  connecte: boolean
  enAttente: number
  cible: string
}
export interface AffichagePayload {
  reference: string
  immatriculation: string
  numeroTri: string
  marqueModele: string
  chassis: string
  destination: string
  agent: string
}

// ── Décodeur VIN en ligne (NHTSA, exécuté côté main) ──────────────────────────
export interface VinEnLigne {
  ok: boolean
  erreur?: string
  constructeur: string
  pays: string
  annee: string
  marque: string
  modele: string
  typeVehicule: string
  categorie: 'Voiture' | 'Camion' | 'Autre' | null
}

// ── Index VIN appris (Phase 3, lu côté main via Prisma) ───────────────────────
export interface VinIndexHit {
  marqueModele: string
  part: number
  annees: Array<[number, number]>
}

declare global {
  interface Window {
    api: {
      resizeForLogin:      () => void
      resizeForLoginAdmin: () => void
      resizeForMain:       () => void
      closeWindow:     () => void
      minimizeWindow:  () => void
      maximizeWindow:  () => void
      mdiOpen:         (data: { id: string; x: number; y: number; width: number; height: number }) => void
      mdiListOpen:     () => Promise<string[]>
      mdiCloseId:      (id: string) => void
      printersList:    () => Promise<Array<{ name: string; isDefault: boolean }>>
      dbCounts:        () => Promise<{ ok: boolean; counts?: Record<string, number>; error?: string }>
      dbCategoriesList:    () => Promise<{ ok: boolean; items?: Array<{ id: number; rang: number; nom: string }>; error?: string }>
      dbCategoriesSaveAll: (items: { rang: number; nom: string }[]) => Promise<{ ok: boolean; items?: Array<{ id: number; rang: number; nom: string }>; error?: string }>
      dbDestinationsList:  () => Promise<{ ok: boolean; items?: DbDestination[]; error?: string }>
      dbDestinationUpsert: (d: DbDestinationInput) => Promise<{ ok: boolean; item?: DbDestination; error?: string }>
      dbDestinationRemove: (code: string) => Promise<{ ok: boolean; error?: string }>
      dbMarquesList:   () => Promise<{ ok: boolean; items?: Array<{ id: number; nom: string }>; error?: string }>
      dbMarqueAdd:     (nom: string) => Promise<{ ok: boolean; item?: { id: number; nom: string }; error?: string }>
      dbMarqueRename:  (id: number, nom: string) => Promise<{ ok: boolean; item?: { id: number; nom: string }; error?: string }>
      dbMarqueRemove:  (id: number) => Promise<{ ok: boolean; error?: string }>
      dbAssurancesGet:  () => Promise<{ ok: boolean; config?: DbAssurConfig; error?: string }>
      dbAssurancesSave: (cfg: DbAssurConfig) => Promise<{ ok: boolean; config?: DbAssurConfig; error?: string }>
      dbUsersList:      () => Promise<{ ok: boolean; items?: DbUser[]; error?: string }>
      dbUsersAuth:      (login: string, motDePasse: string) => Promise<{ ok: boolean; user?: DbUser | null; error?: string }>
      dbUsersAuthAdmin: (login: string, motDePasse: string) => Promise<{ ok: boolean; user?: DbUser | null; error?: string }>
      dbUsersAdd:       (input: DbUserInput) => Promise<{ ok: boolean; error?: string | null }>
      dbUsersUpdate:    (id: number, changes: Partial<DbUserInput>) => Promise<{ ok: boolean; error?: string | null }>
      dbUsersRemove:    (id: number) => Promise<{ ok: boolean; error?: string | null }>
      dbAdminPasswordValid: (mdp: string) => Promise<{ ok: boolean; valide?: boolean; error?: string }>
      dbAdminGetForcage: () => Promise<{ ok: boolean; mdp?: string; error?: string }>
      dbAdminSetForcage: (mdp: string) => Promise<{ ok: boolean; error?: string }>
      affichageConfigGet: () => Promise<{ ok: boolean; config?: AffichageConfig; error?: string }>
      affichageConfigSet: (cfg: AffichageConfig) => Promise<{ ok: boolean; error?: string }>
      affichageEnvoyer:   (payload: AffichagePayload) => Promise<{ ok: boolean; error?: string }>
      affichageTester:    (ip: string, port: number) => Promise<{ ok: boolean; message: string }>
      affichageEtat:      () => Promise<{ ok: boolean; etat?: AffichageEtat }>
      onAffichageEtat:    (cb: (etat: AffichageEtat) => void) => (() => void)
      onDbChanged:     (cb: (p: { domaine: string }) => void) => (() => void)
      dbEnregListActifs: () => Promise<{ ok: boolean; items?: DbEnregistrement[]; error?: string }>
      dbEnregAdd:      (input: DbEnregistrementInput) => Promise<{ ok: boolean; ref?: string; error?: string }>
      dbEnregUpdate:   (ref: string, changes: Partial<DbEnregistrement>) => Promise<{ ok: boolean; error?: string }>
      dbEnregRemove:   (ref: string) => Promise<{ ok: boolean; error?: string }>
      dbEnregNextRef:  () => Promise<{ ok: boolean; ref?: string; error?: string }>
      dbEnregRefCompteurGet: () => Promise<{ ok: boolean; compteur?: number; maxBase?: number; error?: string }>
      dbEnregRefCompteurSet: (n: number) => Promise<{ ok: boolean; error?: string }>
      dbEnregCountForDest: (code: string) => Promise<{ ok: boolean; count?: number; error?: string }>
      dbEnregMaxImmatForDest: (code: string) => Promise<{ ok: boolean; max?: number; error?: string }>
      dbEnregRechercherActif: (query: string) => Promise<{ ok: boolean; items?: DbEnregistrement[]; error?: string }>
      dbArchivesList:  () => Promise<{ ok: boolean; items?: DbArchive[]; error?: string }>
      dbArchivesRechercher: (query: string) => Promise<{ ok: boolean; items?: DbArchive[]; error?: string }>
      dbArchivesArchivables: (dateLimite: string) => Promise<{ ok: boolean; items?: DbEnregistrement[]; error?: string }>
      dbArchivesArchiver: (dateLimite: string, par: string) => Promise<{ ok: boolean; count?: number; error?: string }>
      dbArchivesRappeler: (refs: string[]) => Promise<{ ok: boolean; count?: number; error?: string }>
      dbArchivesPurger: (refs: string[]) => Promise<{ ok: boolean; count?: number; error?: string }>
      importPickFile:  () => Promise<string | null>
      importPreview:   (chemin: string) => Promise<ImportPreview>
      importRun:       (p: { chemin: string; mapping: Record<string, string | undefined>; delimiter: string }) => Promise<ImportReport>
      onImportProgress:(cb: (p: { traite: number; importes: number }) => void) => (() => void)
      mdiSelfClose:    () => void
      mdiSelfMinimize: () => void
      mdiSelfMaximize: () => void
      vinDecodeOnline: (vin: string) => Promise<VinEnLigne>
      vinIndexLookup:  (vin: string) => Promise<VinIndexHit | null>
      vinOuvrirConstructeur: (vin: string, marque: string) => Promise<void>
    }
  }
}

export const electronApi = {
  resizeForLogin:      () => window.api?.resizeForLogin?.(),
  resizeForLoginAdmin: () => window.api?.resizeForLoginAdmin?.(),
  resizeForMain:       () => window.api?.resizeForMain?.(),
  closeWindow:     () => window.api?.closeWindow?.(),
  minimizeWindow:  () => window.api?.minimizeWindow?.(),
  maximizeWindow:  () => window.api?.maximizeWindow?.(),
  mdiOpen:         (data: { id: string; x: number; y: number; width: number; height: number }) =>
    window.api?.mdiOpen?.(data),
  mdiListOpen:     (): Promise<string[]> => window.api?.mdiListOpen?.() ?? Promise.resolve([]),
  mdiCloseId:      (id: string) => window.api?.mdiCloseId?.(id),
  printersList:    (): Promise<Array<{ name: string; isDefault: boolean }>> =>
    window.api?.printersList?.() ?? Promise.resolve([]),
  dbCounts:        (): Promise<{ ok: boolean; counts?: Record<string, number>; error?: string }> =>
    window.api?.dbCounts?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbCategoriesList:    (): Promise<{ ok: boolean; items?: Array<{ id: number; rang: number; nom: string }>; error?: string }> =>
    window.api?.dbCategoriesList?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbCategoriesSaveAll: (items: { rang: number; nom: string }[]): Promise<{ ok: boolean; items?: Array<{ id: number; rang: number; nom: string }>; error?: string }> =>
    window.api?.dbCategoriesSaveAll?.(items) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbDestinationsList:  (): Promise<{ ok: boolean; items?: DbDestination[]; error?: string }> =>
    window.api?.dbDestinationsList?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbDestinationUpsert: (d: DbDestinationInput): Promise<{ ok: boolean; item?: DbDestination; error?: string }> =>
    window.api?.dbDestinationUpsert?.(d) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbDestinationRemove: (code: string): Promise<{ ok: boolean; error?: string }> =>
    window.api?.dbDestinationRemove?.(code) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbMarquesList:   (): Promise<{ ok: boolean; items?: Array<{ id: number; nom: string }>; error?: string }> =>
    window.api?.dbMarquesList?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbMarqueAdd:     (nom: string): Promise<{ ok: boolean; item?: { id: number; nom: string }; error?: string }> =>
    window.api?.dbMarqueAdd?.(nom) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbMarqueRename:  (id: number, nom: string): Promise<{ ok: boolean; item?: { id: number; nom: string }; error?: string }> =>
    window.api?.dbMarqueRename?.(id, nom) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbMarqueRemove:  (id: number): Promise<{ ok: boolean; error?: string }> =>
    window.api?.dbMarqueRemove?.(id) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbAssurancesGet:  (): Promise<{ ok: boolean; config?: DbAssurConfig; error?: string }> =>
    window.api?.dbAssurancesGet?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbAssurancesSave: (cfg: DbAssurConfig): Promise<{ ok: boolean; config?: DbAssurConfig; error?: string }> =>
    window.api?.dbAssurancesSave?.(cfg) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbUsersList:      (): Promise<{ ok: boolean; items?: DbUser[]; error?: string }> =>
    window.api?.dbUsersList?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbUsersAuth:      (login: string, motDePasse: string): Promise<{ ok: boolean; user?: DbUser | null; error?: string }> =>
    window.api?.dbUsersAuth?.(login, motDePasse) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbUsersAuthAdmin: (login: string, motDePasse: string): Promise<{ ok: boolean; user?: DbUser | null; error?: string }> =>
    window.api?.dbUsersAuthAdmin?.(login, motDePasse) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbUsersAdd:       (input: DbUserInput): Promise<{ ok: boolean; error?: string | null }> =>
    window.api?.dbUsersAdd?.(input) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbUsersUpdate:    (id: number, changes: Partial<DbUserInput>): Promise<{ ok: boolean; error?: string | null }> =>
    window.api?.dbUsersUpdate?.(id, changes) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbUsersRemove:    (id: number): Promise<{ ok: boolean; error?: string | null }> =>
    window.api?.dbUsersRemove?.(id) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbAdminPasswordValid: (mdp: string): Promise<{ ok: boolean; valide?: boolean; error?: string }> =>
    window.api?.dbAdminPasswordValid?.(mdp) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbAdminGetForcage: (): Promise<{ ok: boolean; mdp?: string; error?: string }> =>
    window.api?.dbAdminGetForcage?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbAdminSetForcage: (mdp: string): Promise<{ ok: boolean; error?: string }> =>
    window.api?.dbAdminSetForcage?.(mdp) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  onDbChanged:     (cb: (p: { domaine: string }) => void): (() => void) =>
    window.api?.onDbChanged?.(cb) ?? (() => {}),

  // Enregistrements + archives
  dbEnregListActifs: (): Promise<{ ok: boolean; items?: DbEnregistrement[]; error?: string }> =>
    window.api?.dbEnregListActifs?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbEnregAdd: (input: DbEnregistrementInput): Promise<{ ok: boolean; ref?: string; error?: string }> =>
    window.api?.dbEnregAdd?.(input) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbEnregUpdate: (ref: string, changes: Partial<DbEnregistrement>): Promise<{ ok: boolean; error?: string }> =>
    window.api?.dbEnregUpdate?.(ref, changes) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbEnregRemove: (ref: string): Promise<{ ok: boolean; error?: string }> =>
    window.api?.dbEnregRemove?.(ref) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbEnregNextRef: (): Promise<{ ok: boolean; ref?: string; error?: string }> =>
    window.api?.dbEnregNextRef?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbEnregRefCompteurGet: (): Promise<{ ok: boolean; compteur?: number; maxBase?: number; error?: string }> =>
    window.api?.dbEnregRefCompteurGet?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbEnregRefCompteurSet: (n: number): Promise<{ ok: boolean; error?: string }> =>
    window.api?.dbEnregRefCompteurSet?.(n) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbEnregCountForDest: (code: string): Promise<{ ok: boolean; count?: number; error?: string }> =>
    window.api?.dbEnregCountForDest?.(code) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbEnregMaxImmatForDest: (code: string): Promise<{ ok: boolean; max?: number; error?: string }> =>
    window.api?.dbEnregMaxImmatForDest?.(code) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbEnregRechercherActif: (query: string): Promise<{ ok: boolean; items?: DbEnregistrement[]; error?: string }> =>
    window.api?.dbEnregRechercherActif?.(query) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbArchivesList: (): Promise<{ ok: boolean; items?: DbArchive[]; error?: string }> =>
    window.api?.dbArchivesList?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbArchivesRechercher: (query: string): Promise<{ ok: boolean; items?: DbArchive[]; error?: string }> =>
    window.api?.dbArchivesRechercher?.(query) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbArchivesArchivables: (dateLimite: string): Promise<{ ok: boolean; items?: DbEnregistrement[]; error?: string }> =>
    window.api?.dbArchivesArchivables?.(dateLimite) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbArchivesArchiver: (dateLimite: string, par: string): Promise<{ ok: boolean; count?: number; error?: string }> =>
    window.api?.dbArchivesArchiver?.(dateLimite, par) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbArchivesRappeler: (refs: string[]): Promise<{ ok: boolean; count?: number; error?: string }> =>
    window.api?.dbArchivesRappeler?.(refs) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  dbArchivesPurger: (refs: string[]): Promise<{ ok: boolean; count?: number; error?: string }> =>
    window.api?.dbArchivesPurger?.(refs) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  affichageConfigGet: (): Promise<{ ok: boolean; config?: AffichageConfig; error?: string }> =>
    window.api?.affichageConfigGet?.() ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  affichageConfigSet: (cfg: AffichageConfig): Promise<{ ok: boolean; error?: string }> =>
    window.api?.affichageConfigSet?.(cfg) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  affichageEnvoyer: (payload: AffichagePayload): Promise<{ ok: boolean; error?: string }> =>
    window.api?.affichageEnvoyer?.(payload) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  affichageTester: (ip: string, port: number): Promise<{ ok: boolean; message: string }> =>
    window.api?.affichageTester?.(ip, port) ?? Promise.resolve({ ok: false, message: 'window.api indisponible' }),
  affichageEtat: (): Promise<{ ok: boolean; etat?: AffichageEtat }> =>
    window.api?.affichageEtat?.() ?? Promise.resolve({ ok: false }),
  onAffichageEtat: (cb: (etat: AffichageEtat) => void): (() => void) =>
    window.api?.onAffichageEtat?.(cb) ?? (() => {}),
  importPickFile:  (): Promise<string | null> => window.api?.importPickFile?.() ?? Promise.resolve(null),
  importPreview:   (chemin: string): Promise<ImportPreview> =>
    window.api?.importPreview?.(chemin) ?? Promise.resolve({ ok: false, error: 'window.api indisponible' }),
  importRun:       (p: { chemin: string; mapping: Record<string, string | undefined>; delimiter: string }): Promise<ImportReport> =>
    window.api?.importRun?.(p) ?? Promise.resolve({ ok: false, error: 'window.api indisponible', total: 0, importes: 0, doublons: 0, erreurs: [] }),
  onImportProgress:(cb: (p: { traite: number; importes: number }) => void): (() => void) =>
    window.api?.onImportProgress?.(cb) ?? (() => {}),
  mdiSelfClose:    () => window.api?.mdiSelfClose?.(),
  mdiSelfMinimize: () => window.api?.mdiSelfMinimize?.(),
  mdiSelfMaximize: () => window.api?.mdiSelfMaximize?.(),

  // Décodeur VIN en ligne (NHTSA, exécuté côté main)
  vinDecodeOnline: (vin: string): Promise<VinEnLigne> =>
    window.api?.vinDecodeOnline?.(vin) ?? Promise.resolve({
      ok: false, erreur: 'window.api indisponible', constructeur: 'Inconnu', pays: '—', annee: '—',
      marque: '', modele: '', typeVehicule: '', categorie: null,
    }),

  // Index VIN appris (Phase 3)
  vinIndexLookup: (vin: string): Promise<VinIndexHit | null> =>
    window.api?.vinIndexLookup?.(vin) ?? Promise.resolve(null),

  // Fiche constructeur (Phase 4) — ouvre le site du constructeur dans le navigateur (aucun scraping)
  vinOuvrirConstructeur: (vin: string, marque: string): Promise<void> =>
    window.api?.vinOuvrirConstructeur?.(vin, marque) ?? Promise.resolve(),
}
