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

  // Phase 3 — référentiels en base
  dbCategoriesList: (): Promise<unknown> => ipcRenderer.invoke('db:categories:list'),
  dbCategoriesSaveAll: (items: { rang: number; nom: string }[]): Promise<unknown> =>
    ipcRenderer.invoke('db:categories:saveAll', items),
  dbDestinationsList: (): Promise<unknown> => ipcRenderer.invoke('db:destinations:list'),
  dbDestinationUpsert: (d: unknown): Promise<unknown> => ipcRenderer.invoke('db:destinations:upsert', d),
  dbDestinationRemove: (code: string): Promise<unknown> => ipcRenderer.invoke('db:destinations:remove', code),
  dbMarquesList: (): Promise<unknown> => ipcRenderer.invoke('db:marques:list'),
  dbMarqueAdd: (nom: string): Promise<unknown> => ipcRenderer.invoke('db:marques:add', nom),
  dbMarqueRename: (id: number, nom: string): Promise<unknown> => ipcRenderer.invoke('db:marques:rename', { id, nom }),
  dbMarqueRemove: (id: number): Promise<unknown> => ipcRenderer.invoke('db:marques:remove', id),
  dbAssurancesGet: (): Promise<unknown> => ipcRenderer.invoke('db:assurances:get'),
  dbAssurancesSave: (cfg: unknown): Promise<unknown> => ipcRenderer.invoke('db:assurances:save', cfg),
  dbUsersList: (): Promise<unknown> => ipcRenderer.invoke('db:users:list'),
  dbUsersAuth: (login: string, motDePasse: string): Promise<unknown> => ipcRenderer.invoke('db:users:auth', { login, motDePasse }),
  dbUsersAuthAdmin: (login: string, motDePasse: string): Promise<unknown> => ipcRenderer.invoke('db:users:authAdmin', { login, motDePasse }),
  dbUsersAdd: (input: unknown): Promise<unknown> => ipcRenderer.invoke('db:users:add', input),
  dbUsersUpdate: (id: number, changes: unknown): Promise<unknown> => ipcRenderer.invoke('db:users:update', { id, changes }),
  dbUsersRemove: (id: number): Promise<unknown> => ipcRenderer.invoke('db:users:remove', id),
  dbAdminPasswordValid: (mdp: string): Promise<unknown> => ipcRenderer.invoke('db:admin:passwordValid', mdp),
  dbAdminGetForcage: (): Promise<unknown> => ipcRenderer.invoke('db:admin:getForcage'),
  dbAdminSetForcage: (mdp: string): Promise<unknown> => ipcRenderer.invoke('db:admin:setForcage', mdp),
  // Synchro multi-fenêtres : le main diffuse db:changed après chaque écriture
  onDbChanged: (cb: (p: { domaine: string }) => void): (() => void) => {
    const h = (_: unknown, data: { domaine: string }): void => cb(data)
    ipcRenderer.on('db:changed', h)
    return () => ipcRenderer.removeListener('db:changed', h)
  },

  // Enregistrements (cache actif + archives à la demande)
  dbEnregListActifs: (): Promise<unknown> => ipcRenderer.invoke('db:enreg:listActifs'),
  dbEnregAdd: (input: unknown): Promise<unknown> => ipcRenderer.invoke('db:enreg:add', input),
  dbEnregUpdate: (ref: string, changes: unknown): Promise<unknown> => ipcRenderer.invoke('db:enreg:update', { ref, changes }),
  dbEnregRemove: (ref: string): Promise<unknown> => ipcRenderer.invoke('db:enreg:remove', ref),
  dbEnregNextRef: (): Promise<unknown> => ipcRenderer.invoke('db:enreg:nextRef'),
  dbEnregRefCompteurGet: (): Promise<unknown> => ipcRenderer.invoke('db:enreg:refCompteur:get'),
  dbEnregRefCompteurSet: (n: number): Promise<unknown> => ipcRenderer.invoke('db:enreg:refCompteur:set', n),
  dbEnregCountForDest: (code: string): Promise<unknown> => ipcRenderer.invoke('db:enreg:countForDest', code),
  dbEnregMaxImmatForDest: (code: string): Promise<unknown> => ipcRenderer.invoke('db:enreg:maxImmatForDest', code),
  dbEnregRechercherActif: (query: string): Promise<unknown> => ipcRenderer.invoke('db:enreg:rechercherActif', query),
  dbArchivesList: (): Promise<unknown> => ipcRenderer.invoke('db:archives:list'),
  dbArchivesRechercher: (query: string): Promise<unknown> => ipcRenderer.invoke('db:archives:rechercher', query),
  dbArchivesArchivables: (dateLimite: string): Promise<unknown> => ipcRenderer.invoke('db:archives:archivables', dateLimite),
  dbArchivesArchiver: (dateLimite: string, par: string): Promise<unknown> => ipcRenderer.invoke('db:archives:archiver', { dateLimite, par }),
  dbArchivesRappeler: (refs: string[]): Promise<unknown> => ipcRenderer.invoke('db:archives:rappeler', refs),
  dbArchivesPurger: (refs: string[]): Promise<unknown> => ipcRenderer.invoke('db:archives:purger', refs),

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

  // Poste d'affichage (émetteur)
  affichageConfigGet: (): Promise<unknown> => ipcRenderer.invoke('affichage:config:get'),
  affichageConfigSet: (cfg: unknown): Promise<unknown> => ipcRenderer.invoke('affichage:config:set', cfg),
  affichageEnvoyer: (payload: unknown): Promise<unknown> => ipcRenderer.invoke('affichage:envoyer', payload),
  affichageTester: (ip: string, port: number): Promise<{ ok: boolean; message: string }> =>
    ipcRenderer.invoke('affichage:tester', { ip, port }),
  affichageEtat: (): Promise<unknown> => ipcRenderer.invoke('affichage:etat'),
  onAffichageEtat: (cb: (etat: { actif: boolean; connecte: boolean; enAttente: number; cible: string }) => void): (() => void) => {
    const h = (_: unknown, data: { actif: boolean; connecte: boolean; enAttente: number; cible: string }): void => cb(data)
    ipcRenderer.on('affichage:etat', h)
    return () => ipcRenderer.removeListener('affichage:etat', h)
  },

  // Self-control for child MDI windows
  mdiSelfClose:    () => ipcRenderer.send('mdi:self:close'),
  mdiSelfMinimize: () => ipcRenderer.send('mdi:self:minimize'),
  mdiSelfMaximize: () => ipcRenderer.send('mdi:self:maximize'),

  // Décodage VIN en ligne (NHTSA, exécuté côté main)
  vinDecodeOnline: (vin: string): Promise<{
    ok: boolean; erreur?: string; constructeur: string; pays: string; annee: string;
    marque: string; modele: string; typeVehicule: string; categorie: 'Voiture'|'Camion'|'Autre'|null
  }> => ipcRenderer.invoke('vin:decodeOnline', vin),

  // Consultation de l'index VIN appris (Phase 3) — signature → marque/modèle + histogramme d'années
  vinIndexLookup: (vin: string): Promise<{ marqueModele: string; part: number; annees: Array<[number, number]> } | null> =>
    ipcRenderer.invoke('vin:indexLookup', vin),

  // Fiche constructeur (Phase 4) — ouvre le site du constructeur dans le navigateur (aucun scraping)
  vinOuvrirConstructeur: (vin: string, marque: string): Promise<void> =>
    ipcRenderer.invoke('vin:ouvrirConstructeur', vin, marque),

  // Personnalisation (branding.json partagé, lu/écrit côté main)
  brandingCourant: (): Promise<unknown> => ipcRenderer.invoke('branding:courant'),
  brandingEcrire:  (cfg: unknown): Promise<unknown> => ipcRenderer.invoke('branding:ecrire', cfg),
  onBrandingMaj:   (cb: (cfg: unknown) => void): (() => void) => {
    const h = (_: unknown, data: unknown): void => cb(data)
    ipcRenderer.on('branding:maj', h)
    return () => ipcRenderer.removeListener('branding:maj', h)
  },
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
