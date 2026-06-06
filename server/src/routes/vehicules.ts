import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /api/vehicules — liste paginée
router.get('/', async (req, res) => {
  const page = Number(req.query.page ?? 1)
  const limit = Number(req.query.limit ?? 50)
  const search = req.query.search as string | undefined

  const where = search ? {
    OR: [
      { numeroImmat: { contains: search, mode: 'insensitive' as const } },
      { numeroChassis: { contains: search, mode: 'insensitive' as const } }
    ]
  } : {}

  const [items, total] = await Promise.all([
    prisma.vehicule.findMany({
      where,
      include: { marqueModele: true, zoneImportation: true, proprietaire: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dateEnregistrement: 'desc' }
    }),
    prisma.vehicule.count({ where })
  ])

  res.json({ items, total, page, limit })
})

// POST /api/vehicules — nouvel enregistrement
router.post('/', async (req, res) => {
  try {
    const vehicule = await prisma.vehicule.create({
      data: req.body,
      include: { marqueModele: true, zoneImportation: true }
    })
    res.status(201).json(vehicule)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/vehicules/:immat
router.get('/:immat', async (req, res) => {
  const vehicule = await prisma.vehicule.findUnique({
    where: { numeroImmat: req.params.immat },
    include: { marqueModele: true, zoneImportation: true, maisonTransit: true, proprietaire: true, documents: true }
  })
  if (!vehicule) { res.status(404).json({ error: 'Véhicule non trouvé' }); return }
  res.json(vehicule)
})

export default router
