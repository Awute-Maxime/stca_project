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
