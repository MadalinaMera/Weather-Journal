import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.weatherjournal.app',
  appName: 'Weather Journal',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      permissions: ['location', 'coarseLocation']
    }
  }
};

export default config;
