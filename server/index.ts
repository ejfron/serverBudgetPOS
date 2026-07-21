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

// ✅ Serve Nuxt static assets
const nuxtDistPath = path.join(process.cwd(), '.output/public')
app.use(express.static(nuxtDistPath))

// ✅ SPA fallback using middleware (not app.get('*'))
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  
  const indexPath = path.join(nuxtDistPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath)
  }
  
  // If no index.html, serve 200.html (Nuxt SPA fallback)
  const fallbackPath = path.join(nuxtDistPath, '200.html')
  if (fs.existsSync(fallbackPath)) {
    return res.sendFile(fallbackPath)
  }
  
  // Last resort - serve a simple message
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head><title>Tapsilogan POS</title></head>
    <body>
      <h1>Tapsilogan POS Server</h1>
      <p>API is running. Frontend not found.</p>
      <p>Use the mobile APK to access the full app.</p>
    </body>
    </html>
  `)
})

const server = http.createServer(app)

initWebSocket(server)
runMigrations()

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on port ${PORT}`)
})

export default server
