import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { 
  MobileLoginRequest, 
  MobileLoginResponse, 
  MobileDeviceInfo,
  MobileVersionCheckRequest,
  MobileVersionCheckResponse,
  MobileAppConfigResponse,
  MobileNotificationRegistrationRequest
} from '../types/mobile';
import { createAuditLog } from '../utils/auditLogger';

const prisma = new PrismaClient();

export class MobileAuthController {
  // Mobile login with device registration
  static async mobileLogin(req: Request, res: Response) {
    try {
      const { username, password, deviceId, deviceInfo }: MobileLoginRequest = req.body;

      if (!username || !password || !deviceId) {
        return res.status(400).json({
          success: false,
          message: 'Username, password, and deviceId are required',
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          devices: true,
        },
      });

      if (!user) {
        await createAuditLog({
          action: 'MOBILE_LOGIN_FAILED',
          entityType: 'USER',
          entityId: username,
          details: { reason: 'User not found', deviceId },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: {
            code: 'INVALID_CREDENTIALS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        await createAuditLog({
          action: 'MOBILE_LOGIN_FAILED',
          entityType: 'USER',
          entityId: user.id,
          details: { reason: 'Invalid password', deviceId },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          error: {
            code: 'INVALID_CREDENTIALS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check if device exists or register new device
      let device = await prisma.device.findUnique({
        where: { deviceId },
      });

      let deviceRegistered = true;
      if (!device) {
        // Register new device
        device = await prisma.device.create({
          data: {
            deviceId,
            userId: user.id,
            platform: deviceInfo?.platform || 'UNKNOWN',
            model: deviceInfo?.model || 'Unknown',
            osVersion: deviceInfo?.osVersion || 'Unknown',
            appVersion: deviceInfo?.appVersion || 'Unknown',
            pushToken: deviceInfo?.pushToken,
            isActive: true,
            lastActiveAt: new Date(),
          },
        });
        deviceRegistered = false;
      } else {
        // Update existing device
        await prisma.device.update({
          where: { id: device.id },
          data: {
            platform: deviceInfo?.platform || device.platform,
            model: deviceInfo?.model || device.model,
            osVersion: deviceInfo?.osVersion || device.osVersion,
            appVersion: deviceInfo?.appVersion || device.appVersion,
            pushToken: deviceInfo?.pushToken || device.pushToken,
            isActive: true,
            lastActiveAt: new Date(),
          },
        });
      }

      // Check device limit per user
      const userDeviceCount = await prisma.device.count({
        where: {
          userId: user.id,
          isActive: true,
        },
      });

      if (userDeviceCount > config.mobile.maxDevicesPerUser) {
        // Deactivate oldest device
        const oldestDevice = await prisma.device.findFirst({
          where: {
            userId: user.id,
            isActive: true,
            id: { not: device.id },
          },
          orderBy: { lastActiveAt: 'asc' },
        });

        if (oldestDevice) {
          await prisma.device.update({
            where: { id: oldestDevice.id },
            data: { isActive: false },
          });
        }
      }

      // Generate tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
          deviceId: device.deviceId,
        } as any,
        config.jwtSecret as any,
        { expiresIn: '24h' } as any
      );

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          deviceId: device.deviceId,
          type: 'refresh',
        } as any,
        config.jwtSecret as any,
        { expiresIn: '7d' } as any
      );

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          deviceId: device.deviceId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Check for app version compatibility
      const currentAppVersion = deviceInfo?.appVersion || '1.0.0';
      const forceUpdate = MobileAuthController.shouldForceUpdate(currentAppVersion);

      await createAuditLog({
        action: 'MOBILE_LOGIN_SUCCESS',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        details: { 
          deviceId: device.deviceId, 
          platform: device.platform,
          appVersion: currentAppVersion,
          deviceRegistered,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      const response: MobileLoginResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            designation: user.designation,
            department: user.department,
            profilePhotoUrl: user.profilePhotoUrl,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
          deviceRegistered,
          forceUpdate,
          minSupportedVersion: config.mobile.minSupportedVersion,
        },
      };

      return res.json(response);
    } catch (error) {
      console.error('Mobile login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Refresh token endpoint
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwtSecret) as any;
      
      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          deviceId: decoded.deviceId,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: true,
        },
      });

      if (!storedToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          userId: storedToken.user.id,
          username: storedToken.user.username,
          role: storedToken.user.role,
          deviceId: decoded.deviceId,
        } as any,
        config.jwtSecret as any,
        { expiresIn: '24h' } as any
      );

      return res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Mobile logout
  static async mobileLogout(req: Request, res: Response) {
    try {
      const { deviceId } = req.body;
      const userId = (req as any).user?.userId;

      if (deviceId) {
        // Invalidate refresh tokens for this device
        await prisma.refreshToken.deleteMany({
          where: {
            userId,
            deviceId,
          },
        });

        // Update device status
        await prisma.device.updateMany({
          where: {
            userId,
            deviceId,
          },
          data: {
            isActive: false,
            lastActiveAt: new Date(),
          },
        });
      }

      await createAuditLog({
        action: 'MOBILE_LOGOUT',
        entityType: 'USER',
        entityId: userId,
        userId,
        details: { deviceId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Mobile logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'LOGOUT_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Check app version compatibility
  static async checkVersion(req: Request, res: Response) {
    try {
      const { currentVersion, platform }: MobileVersionCheckRequest = req.body;

      const forceUpdate = MobileAuthController.shouldForceUpdate(currentVersion);
      const updateRequired = MobileAuthController.shouldUpdate(currentVersion);

      const response: MobileVersionCheckResponse = {
        updateRequired,
        forceUpdate,
        latestVersion: config.mobile.apiVersion,
        downloadUrl: platform === 'IOS' 
          ? 'https://apps.apple.com/app/caseflow' 
          : 'https://play.google.com/store/apps/details?id=com.caseflow',
        releaseNotes: 'Bug fixes and performance improvements',
        features: ['Enhanced security', 'Improved offline sync', 'Better performance'],
      };

      res.json(response);
    } catch (error) {
      console.error('Version check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'VERSION_CHECK_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get mobile app configuration
  static async getAppConfig(req: Request, res: Response) {
    try {
      const response: MobileAppConfigResponse = {
        apiVersion: config.mobile.apiVersion,
        minSupportedVersion: config.mobile.minSupportedVersion,
        forceUpdateVersion: config.mobile.forceUpdateVersion,
        features: {
          offlineMode: config.mobile.enableOfflineMode,
          backgroundSync: config.mobile.enableBackgroundSync,
          biometricAuth: config.mobile.enableBiometricAuth,
          darkMode: config.mobile.enableDarkMode,
          analytics: config.mobile.enableAnalytics,
        },
        limits: {
          maxFileSize: config.mobile.maxFileSize,
          maxFilesPerCase: config.mobile.maxFilesPerCase,
          locationAccuracyThreshold: config.mobile.locationAccuracyThreshold,
          syncBatchSize: config.mobile.syncBatchSize,
        },
        endpoints: {
          apiBaseUrl: `${req.protocol}://${req.get('host')}/api`,
          wsUrl: `ws://${req.get('host')}:${config.wsPort}`,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('App config error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'CONFIG_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Register device for push notifications
  static async registerNotifications(req: Request, res: Response) {
    try {
      const { deviceId, pushToken, platform, enabled, preferences }: MobileNotificationRegistrationRequest = req.body;
      const userId = (req as any).user?.userId;

      await prisma.device.updateMany({
        where: {
          userId,
          deviceId,
        },
        data: {
          pushToken,
          notificationsEnabled: enabled,
          notificationPreferences: preferences ? JSON.stringify(preferences) : null,
        },
      });

      res.json({
        success: true,
        message: 'Notification registration successful',
      });
    } catch (error) {
      console.error('Notification registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'NOTIFICATION_REGISTRATION_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Helper methods
  private static shouldForceUpdate(currentVersion: string): boolean {
    return MobileAuthController.compareVersions(currentVersion, config.mobile.forceUpdateVersion) < 0;
  }

  private static shouldUpdate(currentVersion: string): boolean {
    return MobileAuthController.compareVersions(currentVersion, config.mobile.minSupportedVersion) < 0;
  }

  private static compareVersions(version1: string, version2: string): number {
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
}
