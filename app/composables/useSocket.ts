// app/composables/useSocket.ts
type SocketMessage =
  | { type: 'ORDER_CREATED'; order: any }
  | { type: 'ORDER_UPDATED'; order: any }
  | { type: 'CONNECTED'; branch_id: string }

type MessageHandler = (msg: SocketMessage) => void

export function useSocket() {
  const config = useRuntimeConfig()

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const MAX_RECONNECT = 3
  const handlers: MessageHandler[] = []
  const connected = ref(false)

  function getWsUrl(branchId: string): string {
    const configured = config.public.serverUrl

    const wsBase = configured
      ? configured.replace(/^http/, 'ws')
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

    return `${wsBase}/_ws?branch_id=${branchId}`
  }

  function connect(branchId: string) {
    if (!import.meta.client) return
    if (ws?.readyState === WebSocket.OPEN) return
    if (reconnectAttempts >= MAX_RECONNECT) {
      console.log('WebSocket max reconnect attempts reached, stopping')
      return
    }

    const url = getWsUrl(branchId)
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
        handlers.forEach((h) => h(msg))
      } catch (err) {
        console.error('WebSocket parse error:', err)
      }
    }

    ws.onclose = () => {
      connected.value = false
      reconnectAttempts++
      if (reconnectAttempts < MAX_RECONNECT) {
        console.log(`WebSocket reconnect ${reconnectAttempts}/${MAX_RECONNECT}`)
        reconnectTimer = setTimeout(() => connect(branchId), 5000)
      } else {
        console.log('WebSocket disconnected — max retries reached')
      }
    }

    ws.onerror = () => {
      // Error handled by onclose
    }
  }

  function disconnect() {
    reconnectAttempts = MAX_RECONNECT
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