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
      onDbChanged:     (cb: (p: { domaine: string }) => void) => (() => void)
      importPickFile:  () => Promise<string | null>
      importPreview:   (chemin: string) => Promise<ImportPreview>
      importRun:       (p: { chemin: string; mapping: Record<string, string | undefined>; delimiter: string }) => Promise<ImportReport>
      onImportProgress:(cb: (p: { traite: number; importes: number }) => void) => (() => void)
      mdiSelfClose:    () => void
      mdiSelfMinimize: () => void
      mdiSelfMaximize: () => void
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
}
