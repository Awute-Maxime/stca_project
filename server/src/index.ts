import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import vehiculeRoutes from './routes/vehicules'
import referentielRoutes from './routes/referentiel'

const app = express()
const PORT = process.env.PORT ?? 4000

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/vehicules', vehiculeRoutes)
app.use('/api/referentiel', referentielRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'TCIT Server', version: '0.1.0' })
})

app.listen(PORT, () => {
  console.log(`TCIT Server démarré sur le port ${PORT}`)
})
