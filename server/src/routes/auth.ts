import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET ?? 'tcit-secret-dev'

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { login, password } = req.body
  if (!login || !password) {
    res.status(400).json({ error: 'Login et mot de passe requis' })
    return
  }

  const user = await prisma.utilisateur.findUnique({ where: { login } })
  if (!user || !user.actif) {
    res.status(401).json({ error: 'Identifiants incorrects' })
    return
  }

  const valid = await bcrypt.compare(password, user.motDePasseHash)
  if (!valid) {
    res.status(401).json({ error: 'Identifiants incorrects' })
    return
  }

  const token = jwt.sign(
    { userId: user.id, login: user.login, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  res.json({
    token,
    user: { id: user.id, login: user.login, nom: user.nom, role: user.role }
  })
})

export default router
