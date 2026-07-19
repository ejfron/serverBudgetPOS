import express from 'express'
import cors from 'cors'
import http from 'http'
import path from 'node:path'
import { runMigrations } from './db/migrations.js'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
import menuRoutes from './routes/menuItems.js'
import salesRoutes from './routes/sales.js'
import branchRoutes from './routes/branches.js'
import categoryRoutes from './routes/categories.js'
import settingsRoutes from './routes/settings.js'
import { initWebSocket } from './websocket/orderSocket.js'

const app = express()
const PORT = process.env.SERVER_PORT || 3001

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/menu-items', menuRoutes)
app.use('/api/sales', salesRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/settings', settingsRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

const server = http.createServer(app)

initWebSocket(server)
runMigrations()

server.listen(PORT, () => {
  console.log(`✅ Tapsilogan POS server running on port ${PORT}`)
})

export default server