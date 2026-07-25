// ─────────────────────────────────────────────────────────────────────────────
// Protocole émetteur → poste d'affichage (copie de STCA-Affichage/src/shared/protocole.ts,
// version émetteur : on n'a besoin que d'ÉMETTRE des enregistrements et de LIRE l'ack).
// ─────────────────────────────────────────────────────────────────────────────

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

export interface AckMessage {
  type: 'ack'
  reference: string
}

/** Configuration de connexion au poste d'affichage (persistée en Parametre). */
export interface AffichageConfig {
  actif: boolean
  nomPoste: string
  ip: string
  port: number
}

/** Charge utile fournie par le renderer après un enregistrement (sans guichet/horodatage,
 *  ajoutés par l'émetteur à partir de la config). */
export interface EnvoiPayload {
  reference: string
  immatriculation: string
  numeroTri: string
  marqueModele: string
  chassis: string
  destination: string
  agent: string
}
