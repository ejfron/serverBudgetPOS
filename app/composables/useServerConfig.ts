// Singleton state — shared across all components, same pattern as usePrinter.ts
const serverUrl = ref('')
const socketUrl = ref('')
const configured = ref(false)

const STORAGE_KEY = 'tapsilogan_server_config'
const HEALTH_TIMEOUT_MS = 4000

let initialized = false

export function useServerConfig() {
  const runtimeConfig = useRuntimeConfig()

  if (!initialized && import.meta.client) {
    initialized = true
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        serverUrl.value = parsed.serverUrl
        socketUrl.value = parsed.socketUrl
        configured.value = true
      } else {
        serverUrl.value = runtimeConfig.public.serverUrl
        socketUrl.value = runtimeConfig.public.socketUrl
        configured.value = false
      }
    } catch {
      serverUrl.value = runtimeConfig.public.serverUrl
      socketUrl.value = runtimeConfig.public.socketUrl
      configured.value = false
    }
  }

  function normalizeIp(ip: string): string {
    return ip.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  }

  function setServerIp(ip: string) {
    const trimmed = normalizeIp(ip)
    const newServerUrl = `http://${trimmed}:3001`
    const newSocketUrl = `ws://${trimmed}:3001`

    serverUrl.value = newServerUrl
    socketUrl.value = newSocketUrl
    configured.value = true

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      serverUrl: newServerUrl,
      socketUrl: newSocketUrl,
    }))
  }

  function clearConfig() {
    localStorage.removeItem(STORAGE_KEY)
    configured.value = false
    serverUrl.value = runtimeConfig.public.serverUrl
    socketUrl.value = runtimeConfig.public.socketUrl
  }

  async function testConnection(ip: string): Promise<{ ok: boolean; message?: string }> {
    const trimmed = normalizeIp(ip)
    const healthUrl = `http://${trimmed}:3001/api/health`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

    try {
      const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal })
      clearTimeout(timer)

      if (!res.ok) {
        return { ok: false, message: `Server responded with an error (${res.status}).` }
      }

      const data = await res.json().catch(() => null)
      if (data?.status === 'ok') {
        return { ok: true }
      }
      return { ok: false, message: 'That address responded, but it doesn\'t look like the Tapsilogan server.' }
    } catch (err: any) {
      clearTimeout(timer)
      if (err?.name === 'AbortError') {
        return { ok: false, message: 'Connection timed out.' }
      }
      return { ok: false, message: 'Could not reach that address.' }
    }
  }

  function debugInfo() {
    let rawStorage: string | null = null
    try { rawStorage = localStorage.getItem(STORAGE_KEY) } catch {}
    return {
      currentServerUrl: serverUrl.value,
      currentSocketUrl: socketUrl.value,
      configured: configured.value,
      buildTimeServerUrl: runtimeConfig.public.serverUrl,
      buildTimeSocketUrl: runtimeConfig.public.socketUrl,
      rawLocalStorage: rawStorage,
    }
  }

  return { serverUrl, socketUrl, configured, setServerIp, clearConfig, testConnection, debugInfo }
}