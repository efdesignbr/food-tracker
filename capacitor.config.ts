import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.foodtracker.app',
  appName: 'Food Tracker',
  webDir: 'out',
  ios: {
    contentInset: 'always'
  }
};

export default config;
