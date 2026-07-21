import { useServerConfig } from './useServerConfig'

const scanning = ref(false)
const scanProgress = ref(0)
const foundIp = ref<string | null>(null)

const COMMON_SUBNETS = ['192.168.1', '192.168.0', '192.168.43', '10.0.0', '192.168.4']
const PORT = 3001
const TIMEOUT_MS = 500
const CONCURRENCY = 40

export function useServerDiscovery() {
  const { setServerIp } = useServerConfig()

  function getPreferredSubnetFirst(): string[] {
    const lastIp = localStorage.getItem('tapsilogan_last_subnet')
    if (lastIp && !COMMON_SUBNETS.includes(lastIp)) return [lastIp, ...COMMON_SUBNETS]
    if (lastIp) return [lastIp, ...COMMON_SUBNETS.filter(s => s !== lastIp)]
    return COMMON_SUBNETS
  }

  async function pingHost(ip: string): Promise<boolean> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`http://${ip}:${PORT}/api/health`, { signal: controller.signal, method: 'GET' })
      clearTimeout(timer)
      if (!res.ok) return false
      const data = await res.json().catch(() => null)
      // FIXED: matches your real Express response { status: 'ok', time: ... }
      return data?.status === 'ok'
    } catch {
      clearTimeout(timer)
      return false
    }
  }

  async function scanSubnet(subnet: string): Promise<string | null> {
    const hosts = Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`)
    for (let i = 0; i < hosts.length; i += CONCURRENCY) {
      const batch = hosts.slice(i, i + CONCURRENCY)
      const results = await Promise.all(batch.map(async ip => ({ ip, ok: await pingHost(ip) })))
      const hit = results.find(r => r.ok)
      if (hit) return hit.ip
      scanProgress.value = Math.min(99, Math.round(((i + CONCURRENCY) / hosts.length) * 100))
    }
    return null
  }

  async function discover(): Promise<{ ok: boolean; ip?: string; message?: string }> {
    scanning.value = true
    scanProgress.value = 0
    foundIp.value = null
    try {
      const subnets = getPreferredSubnetFirst()
      for (const subnet of subnets) {
        const ip = await scanSubnet(subnet)
        if (ip) {
          foundIp.value = ip
          setServerIp(ip)
          localStorage.setItem('tapsilogan_last_subnet', subnet)
          return { ok: true, ip }
        }
        scanProgress.value = 0
      }
      return { ok: false, message: 'No Tapsilogan server found on this network.' }
    } finally {
      scanning.value = false
    }
  }

  return { scanning, scanProgress, foundIp, discover }
}