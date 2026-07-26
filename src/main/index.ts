import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { dbCounts, disconnectPrisma } from './db'
import { pickCsvFile, previewCsv, runImport, type Mapping } from './import'
import {
  categoriesList, categoriesSaveAll,
  destinationsList, destinationUpsert, destinationRemove, type DestinationInput,
  marquesList, marqueAdd, marqueRename, marqueRemove,
  configAssurancesGet, configAssurancesSave, type ConfigAssurancesDto,
  usersList, userAuth, userAuthAdmin, userAdd, userUpdate, userRemove, type UtilisateurInput,
  getMdpForcage, setMdpForcage, adminPasswordValid,
  getAffichageConfig, setAffichageConfig,
} from './referentiels'
import {
  initAfficheur, configurerAfficheur, envoyerEnregistrement, testerConnexion, etatAfficheur
} from './afficheur'
import type { AffichageConfig, EnvoiPayload } from './protocoleAffichage'
import {
  enregistrementsActifsList, enregistrementAdd, enregistrementUpdate, enregistrementRemove,
  getRefCompteur, setRefCompteur, maxRefEnBase, nextRef, countActifsForDest, maxNumImmatForDest, rechercherActif,
  vehiculesArchivables, archiverJusquAu, archivesList, rechercherArchive,
  rappelerArchives, purgerArchives,
  type EnregistrementInput, type EnregistrementDto,
} from './enregistrements'

const isDev = process.env['NODE_ENV'] === 'development' || !app.isPackaged

// ── MDI child windows registry ────────────────────────────────────────────────
const mdiWindows = new Map<string, BrowserWindow>()
let mainWin: BrowserWindow | null = null

// Diffuse un message à TOUTES les fenêtres (état émetteur d'affichage, etc.)
function diffuserTous(canal: string, payload: unknown): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(canal, payload)
  }
}

// ── Instance unique ───────────────────────────────────────────────────────────
// Une seule instance de TCIT à la fois : un second lancement se ferme
// immédiatement et ramène la fenêtre de l'instance existante au premier plan.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}
app.on('second-instance', () => {
  if (mainWin && !mainWin.isDestroyed()) {
    if (mainWin.isMinimized()) mainWin.restore()
    mainWin.focus()
  }
})

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

    // Toutes les fenêtres secondaires s'ouvrent CENTRÉES par rapport à la
    // fenêtre principale (payload.x/y ignorés), sans déborder de l'écran.
    const mainBounds = mainWin && !mainWin.isDestroyed()
      ? mainWin.getBounds()
      : screen.getPrimaryDisplay().workArea
    const workArea = screen.getDisplayMatching(mainBounds).workArea
    let childX = Math.round(mainBounds.x + (mainBounds.width - payload.width) / 2)
    let childY = Math.round(mainBounds.y + (mainBounds.height - payload.height) / 2)
    childX = Math.max(workArea.x, Math.min(childX, workArea.x + workArea.width - payload.width))
    childY = Math.max(workArea.y, Math.min(childY, workArea.y + workArea.height - payload.height))

    const child = new BrowserWindow({
      x: childX,
      y: childY,
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

  // Liste des fenêtres MDI ouvertes (pour l'exclusivité côté renderer)
  ipcMain.handle('mdi:list-open', () =>
    [...mdiWindows.entries()].filter(([, w]) => !w.isDestroyed()).map(([id]) => id)
  )

  // Base de données (Prisma dans le main) — sonde de santé
  ipcMain.handle('db:counts', async () => {
    try {
      return { ok: true, counts: await dbCounts() }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })

  // Phase 3 — référentiels en base (modèle : list / saveAll + db:changed)
  ipcMain.handle('db:categories:list', async () => {
    try { return { ok: true, items: await categoriesList() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:categories:saveAll', async (_, items: { rang: number; nom: string }[]) => {
    try { return { ok: true, items: await categoriesSaveAll(items) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:destinations:list', async () => {
    try { return { ok: true, items: await destinationsList() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:destinations:upsert', async (_, d: DestinationInput) => {
    try { return { ok: true, item: await destinationUpsert(d) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:destinations:remove', async (_, code: string) => {
    try { await destinationRemove(code); return { ok: true } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:marques:list', async () => {
    try { return { ok: true, items: await marquesList() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:marques:add', async (_, nom: string) => {
    try { return { ok: true, item: await marqueAdd(nom) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:marques:rename', async (_, p: { id: number; nom: string }) => {
    try { return { ok: true, item: await marqueRename(p.id, p.nom) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:marques:remove', async (_, id: number) => {
    try { await marqueRemove(id); return { ok: true } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:assurances:get', async () => {
    try { return { ok: true, config: await configAssurancesGet() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:assurances:save', async (_, cfg: ConfigAssurancesDto) => {
    try { return { ok: true, config: await configAssurancesSave(cfg) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  // Utilisateurs (mots de passe hachés — vérification côté main)
  ipcMain.handle('db:users:list', async () => {
    try { return { ok: true, items: await usersList() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:users:auth', async (_, p: { login: string; motDePasse: string }) => {
    try { return { ok: true, user: await userAuth(p.login, p.motDePasse) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:users:authAdmin', async (_, p: { login: string; motDePasse: string }) => {
    try { return { ok: true, user: await userAuthAdmin(p.login, p.motDePasse) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:users:add', async (_, input: UtilisateurInput) => {
    try { return { ok: true, error: await userAdd(input) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:users:update', async (_, p: { id: number; changes: Partial<UtilisateurInput> }) => {
    try { return { ok: true, error: await userUpdate(p.id, p.changes) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:users:remove', async (_, id: number) => {
    try { return { ok: true, error: await userRemove(id) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  // Garde administrateur (forçage + validation)
  ipcMain.handle('db:admin:passwordValid', async (_, mdp: string) => {
    try { return { ok: true, valide: await adminPasswordValid(mdp) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:admin:getForcage', async () => {
    try { return { ok: true, mdp: await getMdpForcage() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:admin:setForcage', async (_, mdp: string) => {
    try { await setMdpForcage(mdp); return { ok: true } }
    catch (err) { return { ok: false, error: String(err) } }
  })

  // ── Enregistrements (le cœur — cache actif + archives à la demande) ──────────
  ipcMain.handle('db:enreg:listActifs', async () => {
    try { return { ok: true, items: await enregistrementsActifsList() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:enreg:add', async (_, input: EnregistrementInput) => {
    try { return await enregistrementAdd(input) }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:enreg:update', async (_, p: { ref: string; changes: Partial<EnregistrementDto> }) => {
    try { return await enregistrementUpdate(p.ref, p.changes) }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:enreg:remove', async (_, ref: string) => {
    try { return await enregistrementRemove(ref) }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:enreg:nextRef', async () => {
    try { return { ok: true, ref: await nextRef() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:enreg:refCompteur:get', async () => {
    try { return { ok: true, compteur: await getRefCompteur(), maxBase: await maxRefEnBase() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:enreg:refCompteur:set', async (_, n: number) => {
    try { await setRefCompteur(n); return { ok: true } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:enreg:countForDest', async (_, code: string) => {
    try { return { ok: true, count: await countActifsForDest(code) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:enreg:maxImmatForDest', async (_, code: string) => {
    try { return { ok: true, max: await maxNumImmatForDest(code) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:enreg:rechercherActif', async (_, query: string) => {
    try { return { ok: true, items: await rechercherActif(query) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  // ── Archives (à la demande) ──────────────────────────────────────────────────
  ipcMain.handle('db:archives:list', async () => {
    try { return { ok: true, items: await archivesList() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:archives:rechercher', async (_, query: string) => {
    try { return { ok: true, items: await rechercherArchive(query) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:archives:archivables', async (_, dateLimite: string) => {
    try { return { ok: true, items: await vehiculesArchivables(dateLimite) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:archives:archiver', async (_, p: { dateLimite: string; par: string }) => {
    try { return { ok: true, count: await archiverJusquAu(p.dateLimite, p.par) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:archives:rappeler', async (_, refs: string[]) => {
    try { return { ok: true, count: await rappelerArchives(refs) } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('db:archives:purger', async (_, refs: string[]) => {
    try { return { ok: true, count: await purgerArchives(refs) } }
    catch (err) { return { ok: false, error: String(err) } }
  })

  // Poste d'affichage (émetteur WebSocket vers l'app d'affichage)
  ipcMain.handle('affichage:config:get', async () => {
    try { return { ok: true, config: await getAffichageConfig() } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('affichage:config:set', async (_, cfg: AffichageConfig) => {
    try {
      await setAffichageConfig(cfg)
      configurerAfficheur(cfg, etat => diffuserTous('affichage:etat', etat))
      return { ok: true }
    } catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('affichage:envoyer', (_, payload: EnvoiPayload) => {
    try { envoyerEnregistrement(payload); return { ok: true } }
    catch (err) { return { ok: false, error: String(err) } }
  })
  ipcMain.handle('affichage:tester', (_, p: { ip: string; port: number }) => testerConnexion(p.ip, p.port))
  ipcMain.handle('affichage:etat', () => ({ ok: true, etat: etatAfficheur() }))

  // Assistant d'import de l'ancienne base STCA (CSV)
  ipcMain.handle('import:pickFile', () => pickCsvFile())
  ipcMain.handle('import:preview', (_, chemin: string) => previewCsv(chemin))
  ipcMain.handle('import:run', (e, p: { chemin: string; mapping: Mapping; delimiter: string }) =>
    runImport(e, p.chemin, p.mapping, p.delimiter))

  // Imprimantes du système (nom + défaut) — pour Config. Imprimantes
  ipcMain.handle('printers:list', async (e) => {
    try {
      const liste = await e.sender.getPrintersAsync()
      return liste.map(p => ({ name: p.name, isDefault: p.isDefault }))
    } catch {
      return []
    }
  })

  // Fermeture ciblée d'une fenêtre MDI par son id
  ipcMain.on('mdi:close-id', (_, id: string) => {
    const w = mdiWindows.get(id)
    if (w && !w.isDestroyed()) w.close()
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
    // Format compact de l'image flash — en harmonie avec la fenêtre de
    // connexion (440×360) vers laquelle la fenêtre se réduit ensuite.
    width: 500,
    height: 320,
    resizable: false,
    center: true,
    show: false,
    frame: false,
    // Fenêtre transparente : permet l'effet « verre » de l'image flash
    // (on aperçoit le bureau au travers). Le login et l'écran principal
    // posent leur propre fond opaque pour ne pas être affectés.
    transparent: true,
    backgroundColor: '#00000000',
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
    // Annule le minimum 1024×700 posé par resize-for-main, sinon Electron
    // refuse de rétrécir et le login s'affiche dans la grande fenêtre
    win.setMinimumSize(1, 1)
    win.setSize(440, 360)
    win.setResizable(false)
    win.center()
  })

  ipcMain.on('window:resize-for-login-admin', () => {
    win.setResizable(true)
    win.setMinimumSize(1, 1)
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

  // Émetteur poste d'affichage : buffer persistant + connexion selon la config.
  initAfficheur(join(app.getPath('userData'), 'affichage-buffer.json'))
  void getAffichageConfig().then(cfg =>
    configurerAfficheur(cfg, etat => diffuserTous('affichage:etat', etat))
  )

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

app.on('before-quit', () => {
  void disconnectPrisma()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
