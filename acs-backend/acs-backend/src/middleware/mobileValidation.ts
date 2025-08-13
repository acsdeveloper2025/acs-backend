import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Validate mobile app version
export const validateMobileVersion = (req: Request, res: Response, next: NextFunction) => {
  try {
    const appVersion = req.headers['x-app-version'] as string;
    const platform = req.headers['x-platform'] as string;

    if (!appVersion) {
      return res.status(400).json({
        success: false,
        message: 'App version header is required',
        error: {
          code: 'MISSING_APP_VERSION',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if force update is required
    if (compareVersions(appVersion, config.mobile.forceUpdateVersion) < 0) {
      return res.status(426).json({
        success: false,
        message: 'App update required',
        error: {
          code: 'FORCE_UPDATE_REQUIRED',
          timestamp: new Date().toISOString(),
        },
        data: {
          currentVersion: appVersion,
          requiredVersion: config.mobile.forceUpdateVersion,
          downloadUrl: platform === 'IOS' 
            ? 'https://apps.apple.com/app/caseflow' 
            : 'https://play.google.com/store/apps/details?id=com.caseflow',
        },
      });
    }

    // Check if version is supported
    if (compareVersions(appVersion, config.mobile.minSupportedVersion) < 0) {
      return res.status(400).json({
        success: false,
        message: 'App version not supported',
        error: {
          code: 'VERSION_NOT_SUPPORTED',
          timestamp: new Date().toISOString(),
        },
        data: {
          currentVersion: appVersion,
          minSupportedVersion: config.mobile.minSupportedVersion,
          downloadUrl: platform === 'IOS' 
            ? 'https://apps.apple.com/app/caseflow' 
            : 'https://play.google.com/store/apps/details?id=com.caseflow',
        },
      });
    }

    next();
  } catch (error) {
    console.error('Mobile version validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'VERSION_VALIDATION_FAILED',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// Validate device information
export const validateDeviceInfo = (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceId = req.headers['x-device-id'] as string;
    const platform = req.headers['x-platform'] as string;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID header is required',
        error: {
          code: 'MISSING_DEVICE_ID',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (platform && !['IOS', 'ANDROID'].includes(platform.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be IOS or ANDROID',
        error: {
          code: 'INVALID_PLATFORM',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Add device info to request
    (req as any).deviceInfo = {
      deviceId,
      platform: platform?.toUpperCase(),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
    };

    next();
  } catch (error) {
    console.error('Device validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'DEVICE_VALIDATION_FAILED',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// Rate limiting for mobile endpoints
export const mobileRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const deviceId = req.headers['x-device-id'] as string || req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [key, value] of requests.entries()) {
        if (value.resetTime < windowStart) {
          requests.delete(key);
        }
      }

      // Get or create request count for this device
      let requestInfo = requests.get(deviceId);
      if (!requestInfo || requestInfo.resetTime < windowStart) {
        requestInfo = { count: 0, resetTime: now + windowMs };
        requests.set(deviceId, requestInfo);
      }

      // Check rate limit
      if (requestInfo.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests',
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            timestamp: new Date().toISOString(),
          },
          retryAfter: Math.ceil((requestInfo.resetTime - now) / 1000),
        });
      }

      // Increment request count
      requestInfo.count++;

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - requestInfo.count);
      res.setHeader('X-RateLimit-Reset', Math.ceil(requestInfo.resetTime / 1000));

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Continue on error to avoid blocking requests
    }
  };
};

// Validate file upload for mobile
export const validateMobileFileUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided',
        error: {
          code: 'NO_FILES_PROVIDED',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check file count limit
    if (files.length > config.mobile.maxFilesPerCase) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${config.mobile.maxFilesPerCase} files allowed`,
        error: {
          code: 'FILE_COUNT_EXCEEDED',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate each file
    for (const file of files) {
      // Check file size
      if (file.size > config.mobile.maxFileSize) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds maximum size of ${config.mobile.maxFileSize} bytes`,
          error: {
            code: 'FILE_SIZE_EXCEEDED',
            details: {
              filename: file.originalname,
              size: file.size,
              maxSize: config.mobile.maxFileSize,
            },
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check file type
      const allowedTypes = [
        ...config.mobile.allowedImageTypes,
        ...config.mobile.allowedDocumentTypes,
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File type ${file.mimetype} not allowed`,
          error: {
            code: 'INVALID_FILE_TYPE',
            details: {
              filename: file.originalname,
              mimeType: file.mimetype,
              allowedTypes,
            },
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    next();
  } catch (error) {
    console.error('File upload validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'FILE_VALIDATION_FAILED',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// Helper function to compare version strings
function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }
  
  return 0;
}
