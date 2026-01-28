import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f815476ffb8a47e284c3f13e942dc4b6',
  appName: 'tzolakgamehaven',
  webDir: 'dist',
  server: {
    // For development: connects to live preview for hot-reload
    // Comment this out for production builds
    url: 'https://f815476f-fb8a-47e2-84c3-f13e942dc4b6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  // Android-specific configuration
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
    },
  },
};

export default config;
