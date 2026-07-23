import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Main window controls
  resizeForLogin:      () => ipcRenderer.send('window:resize-for-login'),
  resizeForLoginAdmin: () => ipcRenderer.send('window:resize-for-login-admin'),
  resizeForMain:       () => ipcRenderer.send('window:resize-for-main'),
  closeWindow:    () => ipcRenderer.send('window:close'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),

  // Open a new MDI child window (called from main window)
  mdiOpen: (data: { id: string; x: number; y: number; width: number; height: number }) =>
    ipcRenderer.send('mdi:open', data),

  // Liste des fenêtres MDI ouvertes / fermeture ciblée (exclusivité des
  // fenêtres secondaires principales avec confirmation côté renderer)
  mdiListOpen: (): Promise<string[]> => ipcRenderer.invoke('mdi:list-open'),
  mdiCloseId:  (id: string) => ipcRenderer.send('mdi:close-id', id),

  // Imprimantes du système (Config. Imprimantes)
  printersList: (): Promise<Array<{ name: string; isDefault: boolean }>> =>
    ipcRenderer.invoke('printers:list'),

  // Base de données (Prisma dans le main) — sonde de santé
  dbCounts: (): Promise<{ ok: boolean; counts?: Record<string, number>; error?: string }> =>
    ipcRenderer.invoke('db:counts'),

  // Assistant d'import de l'ancienne base STCA (CSV)
  importPickFile: (): Promise<string | null> => ipcRenderer.invoke('import:pickFile'),
  importPreview: (chemin: string): Promise<unknown> => ipcRenderer.invoke('import:preview', chemin),
  importRun: (p: { chemin: string; mapping: Record<string, string | undefined>; delimiter: string }): Promise<unknown> =>
    ipcRenderer.invoke('import:run', p),
  onImportProgress: (cb: (p: { traite: number; importes: number }) => void): (() => void) => {
    const h = (_: unknown, data: { traite: number; importes: number }): void => cb(data)
    ipcRenderer.on('import:progress', h)
    return () => ipcRenderer.removeListener('import:progress', h)
  },

  // Self-control for child MDI windows
  mdiSelfClose:    () => ipcRenderer.send('mdi:self:close'),
  mdiSelfMinimize: () => ipcRenderer.send('mdi:self:minimize'),
  mdiSelfMaximize: () => ipcRenderer.send('mdi:self:maximize'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}
