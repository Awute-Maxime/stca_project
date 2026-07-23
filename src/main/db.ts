import { app } from 'electron'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Accès à la base SQLite depuis le PROCESS PRINCIPAL (Prisma tourne ici ; le
// renderer y accède par IPC). Le chemin de la base est passé explicitement à
// Prisma (chemin ABSOLU) — plus fiable qu'une URL relative dans Electron.
//  - Dev  : prisma/stca.db à la racine du projet (celle créée par la migration).
//  - Prod : userData/stca.db (à copier/migrer au 1er lancement — Phase 4).
// ─────────────────────────────────────────────────────────────────────────────

function dbUrl(): string {
  const chemin = app.isPackaged
    ? join(app.getPath('userData'), 'stca.db')
    : join(app.getAppPath(), 'prisma', 'stca.db')
  // URL file: avec slashs avant (compatible Windows)
  return 'file:' + chemin.replace(/\\/g, '/')
}

let prisma: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({ datasourceUrl: dbUrl() })
  }
  return prisma
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

/** Compte des lignes par table — sonde de santé de la base. */
export async function dbCounts(): Promise<Record<string, number>> {
  const db = getPrisma()
  const [categories, destinations, marques, pays, assureurs, tarifs, enregistrements, utilisateurs, parametres] =
    await Promise.all([
      db.categorieVehicule.count(),
      db.destination.count(),
      db.marqueModele.count(),
      db.pays.count(),
      db.assureur.count(),
      db.tarifAssurance.count(),
      db.enregistrement.count(),
      db.utilisateur.count(),
      db.parametre.count(),
    ])
  return { categories, destinations, marques, pays, assureurs, tarifs, enregistrements, utilisateurs, parametres }
}
