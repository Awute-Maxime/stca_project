import { contextBridge, ipcRenderer } from 'electron'

const api = {
  resizeForLogin: () => ipcRenderer.send('window:resize-for-login'),
  resizeForMain:  () => ipcRenderer.send('window:resize-for-main'),
  closeWindow:    () => ipcRenderer.send('window:close'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
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
