import { app } from 'electron'
import { join } from 'path'
import { existsSync, copyFileSync, mkdirSync } from 'fs'
import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Accès à la base SQLite depuis le PROCESS PRINCIPAL (Prisma tourne ici ; le
// renderer y accède par IPC). Le chemin de la base est passé explicitement à
// Prisma (chemin ABSOLU) — plus fiable qu'une URL relative dans Electron.
//  - Dev  : prisma/stca.db à la racine du projet (celle créée par la migration).
//  - Prod : userData/stca.db, COPIÉE au 1er lancement depuis la base livrée
//    avec l'installeur (resources/stca.db). La base de travail vit ainsi dans
//    userData (inscriptible, conservée aux mises à jour) et jamais dans
//    Program Files (lecture seule).
// ─────────────────────────────────────────────────────────────────────────────

/** Chemin de la base de travail (dev : dépôt ; prod : userData). */
function cheminBase(): string {
  return app.isPackaged
    ? join(app.getPath('userData'), 'stca.db')
    : join(app.getAppPath(), 'prisma', 'stca.db')
}

/**
 * Prépare la base au démarrage (prod uniquement) : si userData/stca.db n'existe
 * pas encore — première installation — on y copie la base livrée dans les
 * ressources de l'application. Idempotent : ne réécrit JAMAIS une base
 * existante (les données de l'utilisateur sont préservées à chaque mise à jour).
 */
export function preparerBase(): void {
  if (!app.isPackaged) return
  const cible = cheminBase()
  if (existsSync(cible)) return
  const source = join(process.resourcesPath, 'stca.db')
  if (!existsSync(source)) {
    console.error('[db] base livrée introuvable :', source)
    return
  }
  mkdirSync(app.getPath('userData'), { recursive: true })
  copyFileSync(source, cible)
  console.log('[db] base initialisée depuis les ressources →', cible)
}

function dbUrl(): string {
  // URL file: avec slashs avant (compatible Windows)
  return 'file:' + cheminBase().replace(/\\/g, '/')
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
