/**
 * Environment Configuration for CaseFlow Mobile
 * Manages API keys and environment-specific settings
 */

export interface EnvironmentConfig {
  api: {
    baseUrl: string;
    wsUrl: string;
    timeout: number;
  };
  auth: {
    jwtSecretKey: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    sessionTimeout: number;
  };
  googleMaps: {
    apiKey: string;
    libraries: string[];
    region: string;
    language: string;
  };
  nominatim: {
    baseUrl: string;
    userAgent: string;
  };
  fileUpload: {
    maxFileSize: number;
    allowedFileTypes: string[];
    maxAttachmentsPerCase: number;
  };
  location: {
    timeout: number;
    maxAge: number;
    highAccuracy: boolean;
  };
  offline: {
    storageLimit: number;
    syncRetryAttempts: number;
    syncRetryDelay: number;
    autoSyncInterval: number;
  };
  security: {
    enableBiometricAuth: boolean;
    enableDeviceBinding: boolean;
  };
  features: {
    enableGoogleMaps: boolean;
    enableLocationValidation: boolean;
    enableEnhancedGeocoding: boolean;
    enableOfflineMode: boolean;
    enableRealTimeUpdates: boolean;
    enablePushNotifications: boolean;
    enableAutoSave: boolean;
    enableBackgroundSync: boolean;
  };
  app: {
    name: string;
    environment: 'development' | 'staging' | 'production';
    version: string;
    debugMode: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMockData: boolean;
  };
}

// Default configuration
const defaultConfig: EnvironmentConfig = {
  api: {
    baseUrl: 'http://localhost:3000/api',
    wsUrl: 'ws://localhost:3000',
    timeout: 30000,
  },
  auth: {
    jwtSecretKey: 'default-secret-key',
    jwtExpiresIn: '24h',
    refreshTokenExpiresIn: '7d',
    sessionTimeout: 3600000, // 1 hour
  },
  googleMaps: {
    apiKey: '', // Will be set from environment or fallback
    libraries: ['places', 'geometry'],
    region: 'IN', // India
    language: 'en'
  },
  nominatim: {
    baseUrl: 'https://nominatim.openstreetmap.org',
    userAgent: 'CaseFlow-Mobile/2.1.0'
  },
  fileUpload: {
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    maxAttachmentsPerCase: 10,
  },
  location: {
    timeout: 30000,
    maxAge: 300000, // 5 minutes
    highAccuracy: true,
  },
  offline: {
    storageLimit: 100,
    syncRetryAttempts: 3,
    syncRetryDelay: 5000,
    autoSyncInterval: 300000, // 5 minutes
  },
  security: {
    enableBiometricAuth: true,
    enableDeviceBinding: true,
  },
  features: {
    enableGoogleMaps: true,
    enableLocationValidation: true,
    enableEnhancedGeocoding: true,
    enableOfflineMode: true,
    enableRealTimeUpdates: true,
    enablePushNotifications: true,
    enableAutoSave: true,
    enableBackgroundSync: true,
  },
  app: {
    name: 'CaseFlow Mobile',
    environment: 'development',
    version: '2.1.0',
    debugMode: true,
    logLevel: 'debug',
    enableMockData: false,
  }
};

/**
 * Get environment configuration
 * Supports multiple sources: environment variables, localStorage, fallback
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const config = { ...defaultConfig };

  // API Configuration
  config.api.baseUrl = import.meta.env?.VITE_API_BASE_URL || config.api.baseUrl;
  config.api.wsUrl = import.meta.env?.VITE_WS_URL || config.api.wsUrl;

  // Authentication Configuration
  config.auth.jwtSecretKey = import.meta.env?.VITE_JWT_SECRET_KEY || config.auth.jwtSecretKey;
  config.auth.jwtExpiresIn = import.meta.env?.VITE_JWT_EXPIRES_IN || config.auth.jwtExpiresIn;
  config.auth.refreshTokenExpiresIn = import.meta.env?.VITE_REFRESH_TOKEN_EXPIRES_IN || config.auth.refreshTokenExpiresIn;
  config.auth.sessionTimeout = parseInt(import.meta.env?.VITE_SESSION_TIMEOUT || '') || config.auth.sessionTimeout;

  // Google Maps API key from various sources
  const googleMapsApiKey =
    // 1. Environment variable (for web builds)
    (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
    // 2. Local storage (for runtime configuration)
    (typeof window !== 'undefined' ? localStorage.getItem('GOOGLE_MAPS_API_KEY') : null) ||
    // 3. Your API key as fallback
    'AIzaSyDCl8zO1ysulgTpIHg3mw4hcuxLIM4kcJc';

  config.googleMaps.apiKey = googleMapsApiKey;

  // External API Configuration
  config.nominatim.baseUrl = import.meta.env?.VITE_NOMINATIM_BASE_URL || config.nominatim.baseUrl;
  config.nominatim.userAgent = import.meta.env?.VITE_NOMINATIM_USER_AGENT || config.nominatim.userAgent;

  // File Upload Configuration
  config.fileUpload.maxFileSize = parseInt(import.meta.env?.VITE_MAX_FILE_SIZE || '') || config.fileUpload.maxFileSize;
  config.fileUpload.allowedFileTypes = import.meta.env?.VITE_ALLOWED_FILE_TYPES?.split(',') || config.fileUpload.allowedFileTypes;
  config.fileUpload.maxAttachmentsPerCase = parseInt(import.meta.env?.VITE_MAX_ATTACHMENTS_PER_CASE || '') || config.fileUpload.maxAttachmentsPerCase;

  // Location Configuration
  config.location.timeout = parseInt(import.meta.env?.VITE_LOCATION_TIMEOUT || '') || config.location.timeout;
  config.location.maxAge = parseInt(import.meta.env?.VITE_LOCATION_MAX_AGE || '') || config.location.maxAge;
  config.location.highAccuracy = import.meta.env?.VITE_LOCATION_HIGH_ACCURACY === 'true';

  // Offline & Sync Configuration
  config.offline.storageLimit = parseInt(import.meta.env?.VITE_OFFLINE_STORAGE_LIMIT || '') || config.offline.storageLimit;
  config.offline.syncRetryAttempts = parseInt(import.meta.env?.VITE_SYNC_RETRY_ATTEMPTS || '') || config.offline.syncRetryAttempts;
  config.offline.syncRetryDelay = parseInt(import.meta.env?.VITE_SYNC_RETRY_DELAY || '') || config.offline.syncRetryDelay;
  config.offline.autoSyncInterval = parseInt(import.meta.env?.VITE_AUTO_SYNC_INTERVAL || '') || config.offline.autoSyncInterval;

  // Security Configuration
  config.security.enableBiometricAuth = import.meta.env?.VITE_ENABLE_BIOMETRIC_AUTH !== 'false';
  config.security.enableDeviceBinding = import.meta.env?.VITE_ENABLE_DEVICE_BINDING !== 'false';

  // Feature Flags
  config.features.enableGoogleMaps = import.meta.env?.VITE_ENABLE_GOOGLE_MAPS !== 'false';
  config.features.enableLocationValidation = import.meta.env?.VITE_ENABLE_LOCATION_VALIDATION !== 'false';
  config.features.enableEnhancedGeocoding = import.meta.env?.VITE_ENABLE_ENHANCED_GEOCODING !== 'false';
  config.features.enableOfflineMode = import.meta.env?.VITE_ENABLE_OFFLINE_MODE !== 'false';
  config.features.enableRealTimeUpdates = import.meta.env?.VITE_ENABLE_REAL_TIME_UPDATES !== 'false';
  config.features.enablePushNotifications = import.meta.env?.VITE_ENABLE_PUSH_NOTIFICATIONS !== 'false';
  config.features.enableAutoSave = import.meta.env?.VITE_ENABLE_AUTO_SAVE !== 'false';
  config.features.enableBackgroundSync = import.meta.env?.VITE_ENABLE_BACKGROUND_SYNC !== 'false';

  // App Configuration
  config.app.name = import.meta.env?.VITE_APP_NAME || config.app.name;
  config.app.version = import.meta.env?.VITE_APP_VERSION || config.app.version;
  config.app.debugMode = import.meta.env?.VITE_DEBUG_MODE !== 'false';
  config.app.logLevel = (import.meta.env?.VITE_LOG_LEVEL as any) || config.app.logLevel;
  config.app.enableMockData = import.meta.env?.VITE_ENABLE_MOCK_DATA === 'true';

  // Set environment based on VITE_ENVIRONMENT or build mode
  const envFromVar = import.meta.env?.VITE_ENVIRONMENT;
  const envFromMode = import.meta.env?.MODE;

  if (envFromVar === 'production' || envFromVar === 'staging' || envFromVar === 'development') {
    config.app.environment = envFromVar;
  } else if (envFromMode === 'production') {
    config.app.environment = 'production';
  } else {
    config.app.environment = 'development';
  }

  return config;
};

/**
 * Update Google Maps API key at runtime
 * Useful for dynamic configuration in mobile apps
 */
export const setGoogleMapsApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('GOOGLE_MAPS_API_KEY', apiKey);
  }
};

/**
 * Update API base URL at runtime
 * Useful for switching between environments
 */
export const setApiBaseUrl = (baseUrl: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('API_BASE_URL', baseUrl);
  }
};

/**
 * Validate environment configuration
 */
export const validateEnvironmentConfig = (config: EnvironmentConfig): boolean => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate API configuration
  if (!config.api.baseUrl) {
    errors.push('API base URL is not configured');
  }

  if (!config.api.wsUrl) {
    warnings.push('WebSocket URL is not configured - real-time features will be disabled');
  }

  // Validate authentication configuration
  if (!config.auth.jwtSecretKey || config.auth.jwtSecretKey === 'default-secret-key') {
    warnings.push('JWT secret key is using default value - this should be changed in production');
  }

  // Validate Google Maps configuration
  if (!config.googleMaps.apiKey) {
    warnings.push('Google Maps API key is not configured - map features will be limited');
  } else if (config.googleMaps.apiKey === 'AIzaSyDCl8zO1ysulgTpIHg3mw4hcuxLIM4kcJc') {
    console.log('Using configured Google Maps API key');
  }

  // Validate file upload configuration
  if (config.fileUpload.maxFileSize <= 0) {
    errors.push('Invalid max file size configuration');
  }

  if (config.fileUpload.allowedFileTypes.length === 0) {
    errors.push('No allowed file types configured');
  }

  // Log warnings and errors
  if (warnings.length > 0) {
    console.warn('Environment configuration warnings:', warnings);
  }

  if (errors.length > 0) {
    console.error('Environment configuration errors:', errors);
    return false;
  }

  return true;
};

/**
 * Get environment-specific configuration
 */
export const getEnvironmentSpecificConfig = (environment: string) => {
  const baseConfig = getEnvironmentConfig();

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        app: {
          ...baseConfig.app,
          debugMode: false,
          logLevel: 'error' as const,
          enableMockData: false,
        },
      };

    case 'staging':
      return {
        ...baseConfig,
        app: {
          ...baseConfig.app,
          debugMode: true,
          logLevel: 'info' as const,
          enableMockData: false,
        },
      };

    case 'development':
    default:
      return {
        ...baseConfig,
        app: {
          ...baseConfig.app,
          debugMode: true,
          logLevel: 'debug' as const,
          enableMockData: true,
        },
      };
  }
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
  const config = getEnvironmentConfig();
  return config.features[feature];
};

/**
 * Get API configuration
 */
export const getApiConfig = () => {
  const config = getEnvironmentConfig();
  return {
    baseUrl: config.api.baseUrl,
    wsUrl: config.api.wsUrl,
    timeout: config.api.timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Version': config.app.version,
      'X-App-Environment': config.app.environment,
    },
  };
};

export default getEnvironmentConfig;
