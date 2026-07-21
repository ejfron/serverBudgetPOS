import type { CapacitorConfig } from '@capacitor/cli'

// Use Render URL in production, localhost for development
const isDev = process.env.NODE_ENV === 'development'
const serverUrl = isDev 
  ? 'http://192.168.1.24:3001' 
  : 'https://tapsilogan-pos.onrender.com' // Replace with your actual Render URL

const config: CapacitorConfig = {
  appId: 'com.tapsilogan.pos',
  appName: 'Tapsilogan POS',
  webDir: '.output/public',
  server: {
    url: serverUrl,
    cleartext: !serverUrl.startsWith('https')
  },
  android: { 
    allowMixedContent: true 
  },
}

export default config