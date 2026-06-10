import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'

const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged

function createWindow(): void {
  const win = new BrowserWindow({
    width: 500,
    height: 320,
    resizable: false,
    center: true,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    title: 'TCIT — Contrôle et Immatriculation Transit',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  ipcMain.on('window:resize-for-login', () => {
    win.setResizable(true)
    win.setSize(440, 290)
    win.setResizable(false)
    win.center()
  })

  ipcMain.on('window:resize-for-main', () => {
    win.setResizable(true)
    win.setMinimumSize(1024, 700)
    win.setSize(1280, 800)
    win.center()
  })

  ipcMain.on('window:close',    () => win.close())
  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('tg.tcit')

  app.on('browser-window-created', (_, window) => {
    // Activer les raccourcis de dev (F12, Ctrl+R)
    if (isDev) {
      window.webContents.on('before-input-event', (_, input) => {
        if (input.key === 'F12') window.webContents.openDevTools()
      })
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
