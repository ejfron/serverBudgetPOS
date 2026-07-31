import { useServerConfig } from './useServerConfig'

type SocketMessage =
  | { type: 'ORDER_CREATED'; order: any }
  | { type: 'ORDER_UPDATED'; order: any }
  | { type: 'CONNECTED'; branch_id: string }

type MessageHandler = (msg: SocketMessage) => void

export function useSocket() {
 
  const { socketUrl } = useServerConfig()

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const MAX_RECONNECT = 10
  const handlers: MessageHandler[] = []
  const connected = ref(false)

  function getWsUrl(branchId: string): string {
  
    const base = socketUrl.value
      || (import.meta.client
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
        : 'ws://localhost:3001')

    const wsBase = base
      .replace(/^https:/, 'wss:')
      .replace(/^http:/, 'ws:')

    return `${wsBase}/_ws?branch_id=${branchId}`
  }

  function connect(branchId: string) {
    if (!import.meta.client) return
    if (ws?.readyState === WebSocket.OPEN) return
    if (reconnectAttempts >= MAX_RECONNECT) {
      console.warn('WebSocket max reconnect attempts reached')
      return
    }

    const url = getWsUrl(branchId)
    console.log('🔌 WebSocket connecting:', url)
    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
      reconnectAttempts = 0
      console.log('🔌 WebSocket connected')
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }

    ws.onmessage = (event) => {
      try {
        const msg: SocketMessage = JSON.parse(event.data)
        handlers.forEach(h => h(msg))
      } catch (err) {
        console.error('WebSocket parse error:', err)
      }
    }

    ws.onclose = () => {
      connected.value = false
      reconnectAttempts++
      const delay = Math.min(1000 * reconnectAttempts, 10000) 
      console.log(`🔌 WebSocket closed — retry in ${delay}ms (attempt ${reconnectAttempts})`)
      reconnectTimer = setTimeout(() => connect(branchId), delay)
    }

    ws.onerror = () => {
     
    }
  }

  function disconnect() {
    reconnectAttempts = MAX_RECONNECT // prevent auto-reconnect
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws?.close()
    ws = null
    connected.value = false
  }

  function onMessage(handler: MessageHandler) {
    handlers.push(handler)
  }

  return { connect, disconnect, onMessage, connected }
}