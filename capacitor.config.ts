import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tapsilogan.pos',
  appName: 'Tapsilogan POS',
  webDir: '.output/public',

  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
}

export default config

// update server and store local data of the user in the device sales, transaction, all data
// update printer format with update dine in or take out
