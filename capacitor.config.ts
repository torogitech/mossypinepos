import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mossypine.pos',
  appName: 'MossypinePOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F2F5F1',
      overlaysWebView: false,
    },
  }
};

export default config;