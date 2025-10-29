import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mozart.musiclearning',
  appName: 'Mozart Music Learning',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow clear text traffic for development
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
