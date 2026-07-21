import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tapsilogan.pos',
  appName: 'Tapsilogan POS',
  webDir: '.output/public',
  server: {
    url: 'https://tapsilogan-pos.onrender.com',
    cleartext: false,
    androidScheme: 'https'
  },
  android: { 
    allowMixedContent: true 
  },
}

export default config
