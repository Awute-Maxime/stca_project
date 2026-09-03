// Prépare la base LIVRÉE avec les installeurs de test (prisma/stca.db) :
// pré-règle le poste d'affichage sur la machine locale pour que le flux
// inter-apps fonctionne dès l'installation, sans réglage manuel.
// Usage : node scripts/preparer-base-test.mjs
import { PrismaClient } from '@prisma/client'
import { join } from 'path'

const url = 'file:' + join(process.cwd(), 'prisma', 'stca.db').split('\\').join('/')
const p = new PrismaClient({ datasourceUrl: url })

const PARAMS = {
  'affichage.actif': '1',
  'affichage.ip': '127.0.0.1',      // test mono-machine
  'affichage.port': '8000',
  'affichage.nomPoste': 'Guichet Test',
}

try {
  for (const [cle, valeur] of Object.entries(PARAMS)) {
    await p.parametre.upsert({ where: { cle }, create: { cle, valeur }, update: { valeur } })
  }
  const lus = await p.parametre.findMany({ where: { cle: { startsWith: 'affichage.' } } })
  console.log('Paramètres afficheur de la base livrée :')
  for (const x of lus) console.log('  ', x.cle, '=', x.valeur)

  const n = await p.enregistrement.count()
  const u = await p.utilisateur.count()
  console.log(`\nContenu : ${n} enregistrement(s), ${u} utilisateur(s).`)
} finally {
  await p.$disconnect()
}
