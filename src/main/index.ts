import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'

const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged

// ── MDI child windows registry ────────────────────────────────────────────────
const mdiWindows = new Map<string, BrowserWindow>()
let mainWin: BrowserWindow | null = null

// IPC handlers for MDI child windows (set up once, before any window is created)
function setupMdiIPC(): void {
  ipcMain.on('mdi:open', (_, payload: { id: string; x: number; y: number; width: number; height: number }) => {
    // If already open, just focus it
    const existing = mdiWindows.get(payload.id)
    if (existing && !existing.isDestroyed()) {
      if (existing.isMinimized()) existing.restore()
      existing.focus()
      return
    }

    const mainBounds = mainWin?.getBounds() ?? { x: 0, y: 0 }

    const child = new BrowserWindow({
      x: mainBounds.x + payload.x,
      y: mainBounds.y + payload.y,
      width: payload.width,
      height: payload.height,
      frame: false,
      transparent: false,
      backgroundColor: '#FFFFFF',
      hasShadow: true,
      resizable: true,
      minimizable: true,
      maximizable: true,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    })

    mdiWindows.set(payload.id, child)
    child.on('closed', () => mdiWindows.delete(payload.id))
    child.once('ready-to-show', () => child.show())

    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
      child.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/mdi/${payload.id}`)
    } else {
      child.loadFile(join(__dirname, '../renderer/index.html'), { hash: `/mdi/${payload.id}` })
    }
  })

  // Child window controls itself via these IPC messages
  ipcMain.on('mdi:self:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })

  ipcMain.on('mdi:self:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })

  ipcMain.on('mdi:self:maximize', (e) => {
    const w = BrowserWindow.fromWebContents(e.sender)
    if (!w) return
    if (w.isMaximized()) w.unmaximize()
    else w.maximize()
  })
}

// ── Main window ───────────────────────────────────────────────────────────────
function createWindow(): void {
  mainWin = new BrowserWindow({
    width: 500,
    height: 320,
    resizable: false,
    center: true,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#081030',
    autoHideMenuBar: true,
    title: 'TCIT — Contrôle et Immatriculation Transit',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  const win = mainWin

  ipcMain.on('window:resize-for-login', () => {
    win.setResizable(true)
    win.setSize(440, 360)
    win.setResizable(false)
    win.center()
  })

  ipcMain.on('window:resize-for-login-admin', () => {
    win.setResizable(true)
    win.setSize(440, 400)
    win.setResizable(false)
    win.center()
  })

  ipcMain.on('window:resize-for-main', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    const w = Math.max(Math.round(width  * 0.8), 1024)
    const h = Math.max(Math.round(height * 0.8),  700)
    win.setResizable(true)
    win.setMinimumSize(1024, 700)
    win.setSize(w, h)
    win.center()
  })

  ipcMain.on('window:close',    () => win.close())
  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  // Close all MDI children when main closes
  win.on('closed', () => {
    mainWin = null
    mdiWindows.forEach(w => { try { if (!w.isDestroyed()) w.destroy() } catch {} })
    mdiWindows.clear()
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

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  app.setAppUserModelId('tg.tcit')

  setupMdiIPC()

  app.on('browser-window-created', (_, window) => {
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
