import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'net.krassowski.aufgaben',
  appName: 'Krassowski Aufgaben',
  webDir: 'dist',
  server: { iosScheme: 'https' }
};
export default config;
