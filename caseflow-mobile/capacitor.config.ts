import type { CapacitorConfig } from '@capacitor/cli';

// Get environment variables
const isDevelopment = process.env.NODE_ENV === 'development';
const appName = process.env.VITE_APP_NAME || 'CaseFlow Mobile';
const appVersion = process.env.VITE_APP_VERSION || '2.1.0';

const config: CapacitorConfig = {
  appId: 'com.caseflow.mobile',
  appName: appName,
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Enable live reload in development
    ...(isDevelopment && {
      url: 'http://localhost:5173',
      cleartext: true
    })
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos'],
      iosImagePickerPermissions: ['camera', 'photos'],
      androidImagePickerPermissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location'],
      enableHighAccuracy: process.env.VITE_LOCATION_HIGH_ACCURACY !== 'false',
      timeout: parseInt(process.env.VITE_LOCATION_TIMEOUT || '30000'),
      maximumAge: parseInt(process.env.VITE_LOCATION_MAX_AGE || '300000')
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#111827",
      showSpinner: true,
      spinnerColor: "#3b82f6"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: "#111827",
      overlaysWebView: false,
      androidStatusBarColor: "#111827"
    },
    Filesystem: {
      iosDocumentPath: 'DOCUMENTS',
      androidDocumentPath: 'DOCUMENTS'
    }
  }
};

export default config;
