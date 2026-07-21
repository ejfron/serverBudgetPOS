type SocketMessage =
  | { type: 'ORDER_CREATED'; order: any }
  | { type: 'ORDER_UPDATED'; order: any }
  | { type: 'CONNECTED'; branch_id: string }

type MessageHandler = (msg: SocketMessage) => void

export function useSocket() {
  const config = useRuntimeConfig()

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
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

    const url = getWsUrl(branchId)
    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
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
      reconnectTimer = setTimeout(() => connect(branchId), 3000)
    }

    ws.onerror = (err) => console.error('WebSocket error:', err)
  }

  function disconnect() {
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