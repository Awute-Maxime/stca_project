import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Marques/Modèles
router.get('/marques', async (_req, res) => {
  const items = await prisma.marqueModele.findMany({ orderBy: [{ marque: 'asc' }, { modele: 'asc' }] })
  res.json(items)
})

router.post('/marques', async (req, res) => {
  const item = await prisma.marqueModele.create({ data: req.body })
  res.status(201).json(item)
})

router.put('/marques/:id', async (req, res) => {
  const item = await prisma.marqueModele.update({ where: { id: Number(req.params.id) }, data: req.body })
  res.json(item)
})

router.delete('/marques/:id', async (req, res) => {
  await prisma.marqueModele.delete({ where: { id: Number(req.params.id) } })
  res.status(204).end()
})

// Zones d'importation
router.get('/zones', async (_req, res) => {
  const items = await prisma.zoneImportation.findMany({ orderBy: { libelle: 'asc' } })
  res.json(items)
})

// Maisons de transit
router.get('/maisons-transit', async (_req, res) => {
  const items = await prisma.maisonTransit.findMany({ orderBy: { nom: 'asc' } })
  res.json(items)
})

export default router
