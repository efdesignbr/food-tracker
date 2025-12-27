import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.foodtracker.app',
  appName: 'Food Tracker',
  webDir: 'out',
  ios: {
    contentInset: 'never'
  }
};

export default config;
