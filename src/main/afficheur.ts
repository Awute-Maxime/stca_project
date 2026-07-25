// ─────────────────────────────────────────────────────────────────────────────
// Émetteur : client WebSocket vers le poste d'affichage.
// - envoie un « hello » puis les enregistrements ;
// - bufferise hors ligne (persisté) et se reconnecte tout seul (backoff) ;
// - retire du buffer à réception de l'« ack » (livraison au moins une fois) ;
// - ne bloque JAMAIS la sauvegarde d'un enregistrement.
// ─────────────────────────────────────────────────────────────────────────────
import { WebSocket } from 'ws'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { empiler, retirerAck } from './afficheurBuffer'
import type {
  EnregistrementMessage, EnvoiPayload, AckMessage, AffichageConfig
} from './protocoleAffichage'

export interface EtatAfficheur {
  actif: boolean
  connecte: boolean
  enAttente: number
  cible: string
}

const BACKOFFS = [1000, 2000, 5000, 10000, 15000]

let config: AffichageConfig = { actif: false, nomPoste: '', ip: '192.168.0.25', port: 8000 }
let ws: WebSocket | null = null
let buffer: EnregistrementMessage[] = []
let cheminBuffer = ''
let onEtatCb: ((e: EtatAfficheur) => void) | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let backoffIndex = 0
let fermetureVolontaire = false

function etat(): EtatAfficheur {
  return {
    actif: config.actif,
    connecte: ws?.readyState === WebSocket.OPEN,
    enAttente: buffer.length,
    cible: `${config.ip}:${config.port}`
  }
}
function notifier(): void { onEtatCb?.(etat()) }

function chargerBuffer(): void {
  try { if (existsSync(cheminBuffer)) buffer = JSON.parse(readFileSync(cheminBuffer, 'utf-8')) as EnregistrementMessage[] }
  catch { buffer = [] }
}
function sauverBuffer(): void {
  try { writeFileSync(cheminBuffer, JSON.stringify(buffer), 'utf-8') } catch { /* best effort */ }
}

/** À appeler une fois au démarrage (fixe le fichier de buffer + le recharge). */
export function initAfficheur(chemin: string): void {
  cheminBuffer = chemin
  chargerBuffer()
}

/** (Re)configure l'émetteur : reconnecte si actif, coupe sinon. */
export function configurerAfficheur(cfg: AffichageConfig, onEtat?: (e: EtatAfficheur) => void): void {
  config = cfg
  if (onEtat) onEtatCb = onEtat
  deconnecter()
  if (cfg.actif) connecter()
  notifier()
}

function connecter(): void {
  if (!config.actif) return
  fermetureVolontaire = false
  try {
    ws = new WebSocket(`ws://${config.ip}:${config.port}`)
  } catch {
    planifierReconnexion()
    return
  }
  ws.on('open', () => {
    backoffIndex = 0
    ws?.send(JSON.stringify({ type: 'hello', guichet: config.nomPoste, version: '1.0' }))
    flush()
    notifier()
  })
  ws.on('message', (data) => {
    try {
      const m = JSON.parse(data.toString()) as AckMessage
      if (m.type === 'ack') { buffer = retirerAck(buffer, m.reference); sauverBuffer(); notifier() }
    } catch { /* message ignoré */ }
  })
  ws.on('close', () => { if (!fermetureVolontaire) planifierReconnexion(); notifier() })
  ws.on('error', () => { /* 'close' suivra et déclenchera la reconnexion */ })
}

function planifierReconnexion(): void {
  if (!config.actif || reconnectTimer) return
  const delai = BACKOFFS[Math.min(backoffIndex, BACKOFFS.length - 1)]
  backoffIndex++
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connecter() }, delai)
}

function deconnecter(): void {
  fermetureVolontaire = true
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  backoffIndex = 0
  try { ws?.close() } catch { /* ignore */ }
  ws = null
}

function flush(): void {
  if (ws?.readyState !== WebSocket.OPEN) return
  for (const m of buffer) ws.send(JSON.stringify(m))
}

/** Envoie (ou bufferise) un enregistrement. Ne bloque jamais l'appelant. */
export function envoyerEnregistrement(p: EnvoiPayload): void {
  if (!config.actif) return
  const m: EnregistrementMessage = {
    type: 'enregistrement',
    guichet: config.nomPoste,
    horodatage: new Date().toISOString(),
    ...p
  }
  buffer = empiler(buffer, m)
  sauverBuffer()
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m))
  notifier()
}

/** Test ponctuel de joignabilité (bouton « Tester » de la config). */
export function testerConnexion(ip: string, port: number): Promise<{ ok: boolean; message: string }> {
  return new Promise((resolve) => {
    let c: WebSocket
    try { c = new WebSocket(`ws://${ip}:${port}`) }
    catch { resolve({ ok: false, message: 'Adresse ou port invalide.' }); return }

    let regle = false
    const fin = (ok: boolean, message: string): void => {
      if (regle) return
      regle = true
      clearTimeout(t)
      try { c.close() } catch { /* ignore */ }
      resolve({ ok, message })
    }
    const t = setTimeout(() => fin(false, `Poste d'affichage injoignable (${ip}:${port}).`), 3000)
    c.on('open', () => fin(true, `Poste d'affichage joignable (${ip}:${port}).`))
    c.on('error', () => fin(false, `Poste d'affichage injoignable (${ip}:${port}).`))
  })
}

export function etatAfficheur(): EtatAfficheur { return etat() }
