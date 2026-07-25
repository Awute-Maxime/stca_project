// ─────────────────────────────────────────────────────────────────────────────
// Buffer d'envoi de l'émetteur — logique PURE (dédoublonnage + plafond).
// Garantit la livraison « au moins une fois » : un message reste dans le buffer
// jusqu'à réception de son ack.
// ─────────────────────────────────────────────────────────────────────────────
import type { EnregistrementMessage } from './protocoleAffichage'

export const MAX_BUFFER = 500

/** Ajoute un message (dédoublonne par référence), plafonne en jetant les plus vieux. */
export function empiler(buf: EnregistrementMessage[], m: EnregistrementMessage): EnregistrementMessage[] {
  const sansDoublon = buf.filter(x => x.reference !== m.reference)
  const suivant = [...sansDoublon, m]
  return suivant.length > MAX_BUFFER ? suivant.slice(suivant.length - MAX_BUFFER) : suivant
}

/** Retire un message à réception de son ack. */
export function retirerAck(buf: EnregistrementMessage[], reference: string): EnregistrementMessage[] {
  return buf.filter(x => x.reference !== reference)
}
