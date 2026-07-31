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
import businessTypeRoutes from './routes/business-type.js'
import setupRoutes from './routes/setup.js'
import { initWebSocket } from './websocket/orderSocket.js'

const app = express()
const PORT = parseInt(process.env.SERVER_PORT || '3001', 10)
const HOST = '0.0.0.0'

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/menu-items', menuRoutes)
app.use('/api/sales', salesRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/setup/business-type', businessTypeRoutes)
app.use('/api/setup', setupRoutes)  // ← handles /api/setup/complete

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

const server = http.createServer(app)
initWebSocket(server)
runMigrations()

server.listen(PORT, HOST, () => {
  console.log(`✅ BudgetPOS server running on http://${HOST}:${PORT}`)
  console.log(`📱 Phone: http://YOUR_IP:${PORT}/api/health`)
})

export default server