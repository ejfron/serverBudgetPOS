import express from 'express'
import cors from 'cors'
import http from 'http'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runMigrations } from './db/migrations.js'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
import menuRoutes from './routes/menuItems.js'
import salesRoutes from './routes/sales.js'
import branchRoutes from './routes/branches.js'
import categoryRoutes from './routes/categories.js'
import settingsRoutes from './routes/settings.js'
import businessTypeRoutes from './routes/business-type.js'
import { initWebSocket } from './websocket/orderSocket.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3001', 10)
const HOST = '0.0.0.0'

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
app.use('/api/setup/business-type', businessTypeRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ✅ Debug: Check if .output/public exists
const nuxtDistPath = path.join(process.cwd(), '.output/public')
console.log('📁 Nuxt dist path:', nuxtDistPath)
console.log('📁 Exists:', fs.existsSync(nuxtDistPath))
if (fs.existsSync(nuxtDistPath)) {
  console.log('📁 Contents:', fs.readdirSync(nuxtDistPath))
}

app.use(express.static(nuxtDistPath))

// ✅ Serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  const indexPath = path.join(nuxtDistPath, 'index.html')
  console.log('📄 Serving:', indexPath, 'Exists:', fs.existsSync(indexPath))
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Cannot GET ' + req.path + ' - index.html not found at ' + indexPath)
  }
})

const server = http.createServer(app)

initWebSocket(server)
runMigrations()

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on port ${PORT}`)
})

export default server
