// Mobile App Specific Types

export interface MobileDeviceInfo {
  deviceId: string;
  platform: 'IOS' | 'ANDROID';
  model: string;
  osVersion: string;
  appVersion: string;
  pushToken?: string;
  lastActiveAt?: Date;
}

export interface MobileLoginRequest {
  username: string;
  password: string;
  deviceId: string;
  deviceInfo?: Partial<MobileDeviceInfo>;
}

export interface MobileLoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      username: string;
      email: string;
      role: string;
      employeeId: string;
      designation: string;
      department: string;
      profilePhotoUrl?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    deviceRegistered: boolean;
    forceUpdate?: boolean;
    minSupportedVersion?: string;
    deviceAuthentication?: {
      isApproved: boolean;
      needsApproval: boolean;
      authCode?: string | null;
      authCodeExpiresAt?: Date | null;
    };
  };
}

export interface MobileCaseListRequest {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  assignedTo?: string;
  priority?: number;
  dateFrom?: string;
  dateTo?: string;
  lastSyncTimestamp?: string;
}

export interface MobileCaseResponse {
  id: string;
  title: string;
  description: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  latitude?: number;
  longitude?: number;
  status: string;
  priority: number;
  assignedAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
  verificationType?: string;
  verificationOutcome?: string;
  client: {
    id: string;
    name: string;
    code: string;
  };
  attachments?: MobileAttachmentResponse[];
  formData?: any;
  syncStatus?: 'SYNCED' | 'PENDING' | 'CONFLICT';
}

export interface MobileAttachmentResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
}

export interface MobileFileUploadRequest {
  caseId: string;
  files: Express.Multer.File[];
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
}

export interface MobileFormSubmissionRequest {
  caseId: string;
  formType: 'RESIDENCE' | 'OFFICE';
  formData: any;
  attachmentIds: string[];
  geoLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
  photos: {
    attachmentId: string;
    geoLocation: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: string;
    };
  }[];
}

export interface MobileLocationCaptureRequest {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  source: 'GPS' | 'NETWORK' | 'PASSIVE';
  caseId?: string;
  activityType?: 'CASE_START' | 'CASE_PROGRESS' | 'CASE_COMPLETE' | 'TRAVEL';
}

export interface MobileLocationValidationRequest {
  latitude: number;
  longitude: number;
  expectedAddress?: string;
  radius?: number;
}

export interface MobileLocationValidationResponse {
  isValid: boolean;
  distance?: number;
  address?: string;
  confidence?: number;
  suggestions?: string[];
}

export interface MobileSyncUploadRequest {
  localChanges: {
    cases: {
      id: string;
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      data: any;
      timestamp: string;
    }[];
    attachments: {
      id: string;
      action: 'CREATE' | 'DELETE';
      data: any;
      timestamp: string;
    }[];
    locations: {
      id: string;
      data: MobileLocationCaptureRequest;
      timestamp: string;
    }[];
  };
  deviceInfo: MobileDeviceInfo;
  lastSyncTimestamp: string;
}

export interface MobileSyncDownloadResponse {
  cases: MobileCaseResponse[];
  deletedCaseIds: string[];
  conflicts: {
    caseId: string;
    localVersion: any;
    serverVersion: any;
    conflictType: 'DATA_CONFLICT' | 'VERSION_CONFLICT';
  }[];
  syncTimestamp: string;
  hasMore: boolean;
}

export interface MobileNotificationRegistrationRequest {
  deviceId: string;
  pushToken: string;
  platform: 'IOS' | 'ANDROID';
  enabled: boolean;
  preferences?: {
    caseUpdates: boolean;
    assignments: boolean;
    reminders: boolean;
    systemAlerts: boolean;
  };
}

export interface MobileAppConfigResponse {
  apiVersion: string;
  minSupportedVersion: string;
  forceUpdateVersion: string;
  features: {
    offlineMode: boolean;
    backgroundSync: boolean;
    biometricAuth: boolean;
    darkMode: boolean;
    analytics: boolean;
  };
  limits: {
    maxFileSize: number;
    maxFilesPerCase: number;
    locationAccuracyThreshold: number;
    syncBatchSize: number;
  };
  endpoints: {
    apiBaseUrl: string;
    wsUrl: string;
  };
}

export interface MobileErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
  retryable?: boolean;
  retryAfter?: number;
}

export interface MobileAutoSaveRequest {
  caseId: string;
  formType: 'RESIDENCE' | 'OFFICE';
  formData: any;
  timestamp: string;
}

export interface MobileAutoSaveResponse {
  success: boolean;
  message: string;
  data?: {
    savedAt: string;
    version: number;
  };
}

export interface MobileVersionCheckRequest {
  currentVersion: string;
  platform: 'IOS' | 'ANDROID';
}

export interface MobileVersionCheckResponse {
  updateRequired: boolean;
  forceUpdate: boolean;
  latestVersion: string;
  downloadUrl?: string;
  releaseNotes?: string;
  features?: string[];
}
