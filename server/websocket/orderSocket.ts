import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'

const clients = new Map<string, Set<WebSocket>>()

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server })
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', 'http://localhost')
    const branchId = url.searchParams.get('branch_id')
    if (!branchId) { ws.close(1008, 'branch_id required'); return }
    if (!clients.has(branchId)) clients.set(branchId, new Set())
    clients.get(branchId)!.add(ws)
    console.log(`📡 Client connected — branch: ${branchId}`)
    ws.on('close', () => { clients.get(branchId)?.delete(ws); console.log(`📡 Client disconnected — branch: ${branchId}`) })
    ws.on('error', (err) => console.error('WebSocket error:', err))
    ws.send(JSON.stringify({ type: 'CONNECTED', branch_id: branchId }))
  })
  console.log('✅ WebSocket server ready')
}

export function broadcast(branchId: string, payload: object) {
  const branchClients = clients.get(branchId)
  if (!branchClients) return
  const message = JSON.stringify(payload)
  for (const client of branchClients) {
    if (client.readyState === WebSocket.OPEN) client.send(message)
  }
}
