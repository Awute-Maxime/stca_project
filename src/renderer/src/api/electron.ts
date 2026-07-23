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
