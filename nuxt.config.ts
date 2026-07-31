import { resolve } from 'path'

const getServerUrl = (): string => {
  return process.env.SERVER_URL
    || process.env.CAPACITOR_SERVER_URL
    || 'https://tapsilogan-pos.onrender.com'
}

const getSocketUrl = (): string => {
  return process.env.SOCKET_URL
    || 'wss://tapsilogan-pos.onrender.com'
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ssr: false,

  alias: {
    '@shared': resolve(__dirname, 'shared'),
    '~shared': resolve(__dirname, 'shared'),
  },

  devServer: {
    port: 3000,
    host: '0.0.0.0',
  },

  nitro: {
    prerender: { ignore: ['/api/**'] },
  },

  runtimeConfig: {
    public: {
      serverUrl: getServerUrl(),
      socketUrl: getSocketUrl(),
    },
  },
})


// import { execSync } from 'node:child_process'
// import { resolve } from 'path'

// const getServerUrl = (): string => {
//   const envUrl = process.env.SERVER_URL || process.env.CAPACITOR_SERVER_URL
//   if (envUrl) return envUrl

//   try {
//     const ifaceIp = execSync('ipconfig getifaddr en0', { encoding: 'utf8' }).trim()
//     if (ifaceIp) return `http://${ifaceIp}:3001`
//   } catch {}
//   return 'http://192.168.1.4:3001'
// }

// const getSocketUrl = (): string => {
//   const envUrl = process.env.SOCKET_URL
//   if (envUrl) return envUrl

//   try {
//     const ifaceIp = execSync('ipconfig getifaddr en0', { encoding: 'utf8' }).trim()
//     if (ifaceIp) return `ws://${ifaceIp}:3001`
//   } catch {}
//   return 'ws://192.168.1.24:3001'
// }

// export default defineNuxtConfig({
//   compatibilityDate: '2025-07-15',
//   devtools: { enabled: true },
//   modules: ['@nuxt/ui'],
//   css: ['~/assets/css/main.css'],
//   ssr: false,

//   alias: {
//     '@shared': resolve(__dirname, 'shared'),
//     '~shared': resolve(__dirname, 'shared'),
//   },

//   devServer: {
//     port: 3000,
//     host: '0.0.0.0',
//   },

//   nitro: {
//     prerender: { ignore: ['/api/**'] },
//   },

//   runtimeConfig: {
//     public: {
//       serverUrl: getServerUrl(),
//       socketUrl: getSocketUrl(),
//     },
//   },
// })