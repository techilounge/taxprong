import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taxpro.ng',
  appName: 'TaxProNG',
  webDir: 'dist',
  server: {
    url: 'https://904ea04c-cdeb-4da0-9856-be580c3bfc2e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
