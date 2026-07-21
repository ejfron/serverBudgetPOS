import { execSync } from 'node:child_process'
import { resolve } from 'path'

const getLanServerUrl = (): string => {
  // Use environment variable if set (for Render/production)
  const envUrl = process.env.SERVER_URL || process.env.CAPACITOR_SERVER_URL
  if (envUrl) return envUrl
  
  // In production (Render), use the deployed URL
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    return 'https://tapsilogan-pos.onrender.com'
  }
  
  // Local development - get LAN IP
  try {
    const ifaceIp = execSync('ipconfig getifaddr en0', { encoding: 'utf8' }).trim()
    if (ifaceIp) return `http://${ifaceIp}:3001`
  } catch {}
  return 'http://192.168.1.24:3001'
}

const getLanSocketUrl = (): string => {
  // Use environment variable if set
  const envUrl = process.env.SOCKET_URL
  if (envUrl) return envUrl
  
  // In production (Render), use WSS
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    return 'wss://tapsilogan-pos.onrender.com'
  }
  
  // Local development
  try {
    const ifaceIp = execSync('ipconfig getifaddr en0', { encoding: 'utf8' }).trim()
    if (ifaceIp) return `ws://${ifaceIp}:3001`
  } catch {}
  return 'ws://192.168.1.24:3001'
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  
  alias: {
    '@shared': resolve(__dirname, 'shared'),
    '~shared': resolve(__dirname, 'shared')
  },
  
  devServer: {
    port: 3001,
    host: '0.0.0.0'
  },
  
  nitro: { 
    prerender: { ignore: ['/api/**'] } 
  },
  
  runtimeConfig: {
    public: {
      serverUrl: getLanServerUrl(),
      socketUrl: getLanSocketUrl(),
    },
  },
})