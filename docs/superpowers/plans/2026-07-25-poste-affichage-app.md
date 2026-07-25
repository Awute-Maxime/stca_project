# Plan d'Implémentation : Poste d'affichage (Plan A — l'application autonome)

**Objectif :** Construire `STCA-Affichage/`, une app Electron autonome qui reçoit par WebSocket les enregistrements des guichets et les affiche (héros + file d'attente), avec persistance, modes réduit/déroulé/plein écran, clic « Plaque traitée » et signal sonore.

**Architecture :** Processus principal Electron = serveur WebSocket (`ws`) sur `:8000`, qui valide/dédoublonne les messages et pousse la file au renderer par IPC ; la file est persistée dans un fichier `userData`. Le renderer React affiche la maquette validée. Logique pure (protocole, file) isolée et testée par Vitest ; l'UI testée en E2E via CDP avec un client WebSocket factice.

**Stack Technique :** Electron + electron-vite + React 18 + Ant Design 5 + TypeScript + `ws` ; tests Vitest + CDP (port 9223 pour ne pas entrer en conflit avec STCA-Electron sur 9222).

**Référence design (à porter tel quel) :** `../../prototype-html/poste-affichage-propositions.html` (validée). Doc de conception : `../specs/2026-07-25-poste-affichage-immatriculation-design.md`.

---

## Cartographie des fichiers (Plan A)

```
STCA-Affichage/
├── package.json                         # deps + scripts (dev/build/test)
├── electron.vite.config.ts              # config electron-vite (main/preload/renderer)
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── vitest.config.ts                     # tests unitaires (logique pure)
├── .gitignore
├── src/
│   ├── shared/
│   │   └── protocole.ts                 # types de messages (partagés avec STCA plus tard)
│   ├── main/
│   │   ├── index.ts                     # fenêtre + démarrage serveur + IPC
│   │   ├── serveur.ts                    # serveur WebSocket (ws) : hello/enregistrement/ack, heartbeat
│   │   ├── fileStore.ts                  # file d'attente : ajouter/retirer/dédoublonner/charger/sauver
│   │   └── palette.ts                    # couleurs destinations (copie TCIT)
│   ├── preload/
│   │   └── index.ts                      # pont IPC (onFile, onEtatConnexions, traiter, sonReglage)
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── PosteAffichage.tsx        # l'écran (héros + file, modes)
│           ├── theme.ts                  # jetons TCIT
│           ├── styles.css                # CSS porté de la maquette
│           └── assets/bip.wav            # signal sonore
└── tests/
    ├── fileStore.test.ts
    └── serveur.test.ts
```

---

## Tâche 0 : Scaffolder le projet Electron autonome

**Fichiers concernés :**
- Créer : `STCA-Affichage/package.json`, `electron.vite.config.ts`, les `tsconfig*.json`, `.gitignore`, `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/index.html`, `src/renderer/src/main.tsx`, `src/renderer/src/PosteAffichage.tsx`

- [ ] **Étape 1 : `package.json`**
```json
{
  "name": "stca-affichage",
  "version": "1.0.0",
  "description": "TCIT — Poste d'affichage Immatriculation + Tri",
  "main": "./out/main/index.js",
  "author": "TCIT",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "start": "electron-vite preview",
    "test": "vitest run",
    "typecheck": "tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json"
  },
  "dependencies": { "ws": "^8.18.0" },
  "devDependencies": {
    "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18", "@types/ws": "^8",
    "@vitejs/plugin-react": "^4", "antd": "^5", "electron": "^28", "electron-vite": "^2",
    "react": "^18", "react-dom": "^18", "typescript": "^5", "vite": "^5", "vitest": "^2"
  }
}
```

- [ ] **Étape 2 : `electron.vite.config.ts`**
```ts
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: {
    resolve: { alias: { '@shared': resolve('src/shared') } },
    plugins: [react()]
  }
})
```

- [ ] **Étape 3 : `tsconfig.node.json` (main+preload) et `tsconfig.web.json` (renderer)** — mêmes réglages stricts que STCA-Electron (copier, adapter les `include`). `tsconfig.json` référence les deux.

- [ ] **Étape 4 : main/preload/renderer minimal** — `src/main/index.ts` ouvre une `BrowserWindow` 1280×800 chargeant le renderer ; `PosteAffichage.tsx` affiche « Poste d'affichage — en attente ». But : l'app démarre.

- [ ] **Étape 5 : installer + lancer**
  Exécuter : `cd STCA-Affichage && npm install && npm run dev`
  Attendu : une fenêtre s'ouvre avec le texte de départ.

- [ ] **Étape 6 : commit**
  `git add STCA-Affichage && git commit -m "feat(affichage): scaffold projet Electron autonome"`

---

## Tâche 1 : Protocole partagé (types)

**Fichiers concernés :** Créer `STCA-Affichage/src/shared/protocole.ts`

- [ ] **Étape 1 : les types**
```ts
export interface HelloMessage { type: 'hello'; guichet: string; version: string }
export interface EnregistrementMessage {
  type: 'enregistrement'
  reference: string
  immatriculation: string
  numeroTri: string
  marqueModele: string
  chassis: string
  destination: string
  guichet: string
  agent: string
  horodatage: string
}
export interface AckMessage { type: 'ack'; reference: string }
export type MessageEntrant = HelloMessage | EnregistrementMessage
export type MessageSortant = AckMessage

/** Valide un objet reçu du réseau. Retourne le message typé ou null si invalide. */
export function parserMessage(brut: unknown): MessageEntrant | null {
  if (typeof brut !== 'object' || brut === null) return null
  const m = brut as Record<string, unknown>
  if (m.type === 'hello' && typeof m.guichet === 'string') {
    return { type: 'hello', guichet: m.guichet, version: String(m.version ?? '') }
  }
  if (m.type === 'enregistrement' && typeof m.reference === 'string' && m.reference.length > 0
      && typeof m.immatriculation === 'string') {
    return {
      type: 'enregistrement',
      reference: m.reference,
      immatriculation: m.immatriculation,
      numeroTri: String(m.numeroTri ?? ''),
      marqueModele: String(m.marqueModele ?? ''),
      chassis: String(m.chassis ?? ''),
      destination: String(m.destination ?? ''),
      guichet: String(m.guichet ?? ''),
      agent: String(m.agent ?? ''),
      horodatage: String(m.horodatage ?? new Date().toISOString())
    }
  }
  return null
}
```

- [ ] **Étape 2 : test** `tests/protocole.test.ts` — hello valide, enregistrement valide, JSON sans `type` → null, enregistrement sans `reference` → null.
- [ ] **Étape 3 : `npx vitest run tests/protocole.test.ts`** → vert.
- [ ] **Étape 4 : commit** `feat(affichage): protocole de messages + validation`

---

## Tâche 2 : File d'attente (logique pure + persistance)

**Fichiers concernés :** Créer `src/main/fileStore.ts`, `tests/fileStore.test.ts`

- [ ] **Étape 1 : test qui échoue** (`tests/fileStore.test.ts`)
```ts
import { describe, it, expect } from 'vitest'
import { ajouterVehicule, retirerVehicule, purger, type VehiculeFile } from '../src/main/fileStore'
import type { EnregistrementMessage } from '../src/shared/protocole'

const msg = (ref: string): EnregistrementMessage => ({
  type: 'enregistrement', reference: ref, immatriculation: 'TG WZ C '+ref+' KE',
  numeroTri: '021', marqueModele: 'TOYOTA', chassis: 'X', destination: 'KE',
  guichet: 'P', agent: 'awute', horodatage: new Date().toISOString()
})

describe('fileStore', () => {
  it('ajoute en tête', () => {
    let f: VehiculeFile[] = []
    f = ajouterVehicule(f, msg('1'), 1000)
    f = ajouterVehicule(f, msg('2'), 2000)
    expect(f.map(v => v.reference)).toEqual(['2', '1'])
  })
  it('dédoublonne par référence', () => {
    let f: VehiculeFile[] = []
    f = ajouterVehicule(f, msg('1'), 1000)
    f = ajouterVehicule(f, msg('1'), 2000)
    expect(f).toHaveLength(1)
  })
  it('retire par référence', () => {
    let f = ajouterVehicule([], msg('1'), 1000)
    f = retirerVehicule(f, '1')
    expect(f).toHaveLength(0)
  })
  it('purge les entrées de plus de 24 h', () => {
    const vieux = ajouterVehicule([], msg('1'), 0)
    expect(purger(vieux, 25 * 3600 * 1000)).toHaveLength(0)
  })
})
```

- [ ] **Étape 2 : lancer → échec** `npx vitest run tests/fileStore.test.ts`
- [ ] **Étape 3 : implémentation** (`src/main/fileStore.ts`)
```ts
import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { EnregistrementMessage } from '../shared/protocole'

export interface VehiculeFile {
  reference: string; immatriculation: string; numeroTri: string; marqueModele: string
  chassis: string; destination: string; guichet: string; agent: string; recuLe: number
}
const MAX_AGE = 24 * 3600 * 1000

export function ajouterVehicule(file: VehiculeFile[], m: EnregistrementMessage, now: number): VehiculeFile[] {
  const sansDoublon = file.filter(v => v.reference !== m.reference)
  const v: VehiculeFile = { ...m, recuLe: now }
  delete (v as Partial<EnregistrementMessage>).type
  return [v, ...sansDoublon]
}
export function retirerVehicule(file: VehiculeFile[], reference: string): VehiculeFile[] {
  return file.filter(v => v.reference !== reference)
}
export function purger(file: VehiculeFile[], now: number): VehiculeFile[] {
  return file.filter(v => now - v.recuLe < MAX_AGE)
}

// Persistance
const chemin = (): string => join(app.getPath('userData'), 'file-attente.json')
export function chargerFile(now: number): VehiculeFile[] {
  try {
    if (!existsSync(chemin())) return []
    return purger(JSON.parse(readFileSync(chemin(), 'utf-8')) as VehiculeFile[], now)
  } catch { return [] }
}
export function sauvegarderFile(file: VehiculeFile[]): void {
  try { writeFileSync(chemin(), JSON.stringify(file), 'utf-8') } catch { /* disque plein : on continue */ }
}
```
> Note : les tests unitaires n'importent QUE les fonctions pures (`ajouter/retirer/purger`) ; `charger/sauvegarder` (qui touchent `electron.app`) sont couverts en E2E.

- [ ] **Étape 4 : lancer → vert.**
- [ ] **Étape 5 : commit** `feat(affichage): file d'attente + persistance`

---

## Tâche 3 : Serveur WebSocket (main)

**Fichiers concernés :** Créer `src/main/serveur.ts`, `tests/serveur.test.ts`

- [ ] **Étape 1 : test qui échoue** — démarrer le serveur sur un port libre, connecter un client `ws`, envoyer un `enregistrement`, attendre l'`ack` et l'appel du callback `onEnregistrement`.
```ts
import { describe, it, expect, vi } from 'vitest'
import { WebSocket } from 'ws'
import { demarrerServeur } from '../src/main/serveur'

describe('serveur', () => {
  it('accuse réception et notifie', async () => {
    const onEnr = vi.fn()
    const srv = demarrerServeur({ port: 0, onEnregistrement: onEnr, onEtat: () => {} })
    const port = srv.port()
    const ack = await new Promise<string>((res) => {
      const c = new WebSocket('ws://127.0.0.1:'+port)
      c.on('open', () => c.send(JSON.stringify({ type:'enregistrement', reference:'42', immatriculation:'TG WZ C 42 KE' })))
      c.on('message', (d) => { const m = JSON.parse(d.toString()); if (m.type==='ack') res(m.reference) })
    })
    expect(ack).toBe('42')
    expect(onEnr).toHaveBeenCalledOnce()
    srv.arreter()
  })
})
```

- [ ] **Étape 2 : lancer → échec.**
- [ ] **Étape 3 : implémentation** (`src/main/serveur.ts`)
```ts
import { WebSocketServer, WebSocket } from 'ws'
import { parserMessage, type EnregistrementMessage } from '../shared/protocole'

export interface EtatConnexion { guichet: string; adresseIp: string }
interface Options {
  port: number
  onEnregistrement: (m: EnregistrementMessage) => void
  onEtat: (connexions: EtatConnexion[]) => void
}
interface Client { ws: WebSocket; guichet: string; ip: string; vivant: boolean }

export function demarrerServeur(opts: Options) {
  const wss = new WebSocketServer({ port: opts.port })
  const clients = new Set<Client>()
  const diffuserEtat = (): void =>
    opts.onEtat([...clients].map(c => ({ guichet: c.guichet, adresseIp: c.ip })))

  wss.on('connection', (ws, req) => {
    const client: Client = { ws, guichet: '', ip: req.socket.remoteAddress ?? '?', vivant: true }
    clients.add(client)
    ws.on('pong', () => { client.vivant = true })
    ws.on('message', (data) => {
      const m = parserMessage(JSON.parse(data.toString()))
      if (!m) return
      if (m.type === 'hello') { client.guichet = m.guichet; diffuserEtat(); return }
      if (m.type === 'enregistrement') {
        if (!client.guichet) client.guichet = m.guichet
        opts.onEnregistrement(m)
        ws.send(JSON.stringify({ type: 'ack', reference: m.reference }))
        diffuserEtat()
      }
    })
    ws.on('close', () => { clients.delete(client); diffuserEtat() })
    ws.on('error', () => { clients.delete(client); diffuserEtat() })
    diffuserEtat()
  })

  // Heartbeat : coupe les clients muets
  const battement = setInterval(() => {
    for (const c of clients) {
      if (!c.vivant) { c.ws.terminate(); clients.delete(c); continue }
      c.vivant = false; c.ws.ping()
    }
    diffuserEtat()
  }, 10000)

  return {
    port: () => (wss.address() as { port: number }).port,
    arreter: () => { clearInterval(battement); wss.close() }
  }
}
```

- [ ] **Étape 4 : lancer → vert.**
- [ ] **Étape 5 : commit** `feat(affichage): serveur WebSocket + heartbeat + ack`

---

## Tâche 4 : Intégration main + IPC + preload

**Fichiers concernés :** Modifier `src/main/index.ts` ; Créer `src/preload/index.ts` ; Créer `src/main/palette.ts`

- [ ] **Étape 1 : `palette.ts`** — copie des couleurs destinations TCIT (AFO/CK/KA/KE/TO `#DC2626`, KP/KW/NO `#16A34A`, S/C `#EAB308`, POL `#94A3B8`, défaut `#64748B`) + `couleurDestination(code): string`.

- [ ] **Étape 2 : `main/index.ts`** — au `whenReady` :
  1. `let file = chargerFile(Date.now())`
  2. `demarrerServeur({ port: 8000, onEnregistrement, onEtat })`
  3. `onEnregistrement(m)` : `file = ajouterVehicule(file, m, Date.now())` ; `sauvegarderFile(file)` ; `envoyer('file:maj', file)`.
  4. `onEtat(connexions)` : `envoyer('connexions:maj', connexions)`.
  5. IPC `ipcMain.handle('file:traiter', (_e, ref) => { file = retirerVehicule(file, ref); sauvegarderFile(file); diffuser })` ; `ipcMain.handle('file:courante', () => file)`.
  `envoyer(canal, payload)` = `BrowserWindow.getAllWindows().forEach(w => w.webContents.send(canal, payload))`.

- [ ] **Étape 3 : `preload/index.ts`** — expose via `contextBridge` :
```ts
import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('affichage', {
  fileCourante: () => ipcRenderer.invoke('file:courante'),
  onFile: (cb) => ipcRenderer.on('file:maj', (_e, f) => cb(f)),
  onConnexions: (cb) => ipcRenderer.on('connexions:maj', (_e, c) => cb(c)),
  traiter: (ref) => ipcRenderer.invoke('file:traiter', ref)
})
```
(+ déclaration de type `window.affichage` dans un `env.d.ts`.)

- [ ] **Étape 4 : lancer `npm run dev`**, connecter un client `ws` manuel (`node -e ...`), envoyer un enregistrement → vérifier que le main relaie (log renderer).
- [ ] **Étape 5 : commit** `feat(affichage): intégration serveur↔renderer (IPC)`

---

## Tâche 5 : L'écran (renderer) — port de la maquette

**Fichiers concernés :** Créer `src/renderer/src/PosteAffichage.tsx`, `theme.ts`, `styles.css` ; Créer `assets/bip.wav`

- [ ] **Étape 1 : porter le CSS** — copier le `<style>` de `prototype-html/poste-affichage-propositions.html` dans `styles.css` (retirer la `.demo-bar` et le `.caption` : ce sont des éléments de maquette). Conserver `.screen/.flag/.head/.current/.queue-wrap/.row/...` à l'identique (design validé).

- [ ] **Étape 2 : `PosteAffichage.tsx`** — état `file: VehiculeFile[]`, `connexions: EtatConnexion[]`, `mode: 'reduit'|'deroule'`, `sonActif`. `useEffect` : `affichage.fileCourante().then(setFile)`, `affichage.onFile(setFile)`, `affichage.onConnexions(setConnexions)`. Rendu = la structure de la maquette, alimentée par les données réelles ; couleur via `couleurDestination(v.destination)` ; ancienneté « il y a … » recalculée via un tick de 15 s ; bouton « Plaque traitée » → `affichage.traiter(v.reference)`. Barre de connexion : `connexions.length ? '● {guichet} connecté' : '● Aucun guichet connecté'`.

- [ ] **Étape 3 : signal sonore** — à l'arrivée d'une nouvelle `reference` (diff avec l'état précédent), si `sonActif`, jouer `new Audio(bip).play()`. Icône haut-parleur dans l'en-tête (persistée `localStorage`).

- [ ] **Étape 4 : plein écran** — touche F11 → `ipcRenderer`/`win.setFullScreen` (IPC `fenetre:pleinEcran`).

- [ ] **Étape 5 : vérif visuelle** — capture CDP (port 9223), comparer à la maquette.
- [ ] **Étape 6 : commit** `feat(affichage): écran React (héros + file + son + modes)`

---

## Tâche 6 : Test E2E réel (client factice via CDP)

**Fichiers concernés :** Créer `tests/e2e-affichage.mjs` (script CDP, modèle `cdp-eval.mjs` de STCA)

- [ ] **Étape 1 : lancer l'app** `electron-vite dev -- --remote-debugging-port=9223`.
- [ ] **Étape 2 : client factice** — un script Node ouvre un `WebSocket` vers `ws://127.0.0.1:8000`, envoie `hello` puis 3 `enregistrement`.
- [ ] **Étape 3 : asserts CDP** — via 9223, vérifier que le DOM montre 3 lignes, le bon héros, l'indicateur « connecté ». Cliquer « Plaque traitée » → 2 lignes. Fermer/relancer l'app → la file persiste (2 lignes rechargées).
- [ ] **Étape 4 : capturer** l'écran final, contrôler visuellement.
- [ ] **Étape 5 : commit** `test(affichage): E2E client factice + persistance`

---

## Auto-évaluation

- **Couverture** : scaffold (T0), protocole (T1), file+persistance (T2), serveur WS+heartbeat+ack (T3), IPC (T4), UI+son+modes (T5), E2E+persistance (T6). Toutes les exigences du doc §3/§4 sont couvertes. La sécurité LAN (§7) = hypothèse, aucun code. Kiosque auto = hors périmètre (F11 manuel inclus).
- **Placeholders** : aucun — code réel fourni pour la logique ; le CSS est un port explicite d'un fichier existant validé (DRY).
- **Cohérence** : noms stables — `parserMessage`, `ajouterVehicule`, `retirerVehicule`, `purger`, `chargerFile`, `sauvegarderFile`, `demarrerServeur`, `couleurDestination`, IPC `file:maj`/`connexions:maj`/`file:traiter`/`file:courante`.

## Suite
Plan B (émetteur STCA + fenêtre « Configuration des connexions ») sera rédigé après validation du Plan A — le protocole y sera déjà rodé.
