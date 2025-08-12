import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/config/database';
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
      const userRes = await query(
        `SELECT id, name, username, email, "passwordHash", role, "employeeId", designation, department, "profilePhotoUrl" FROM users WHERE username = $1`,
        [username]
      );
      const user = userRes.rows[0];

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
      const devRes = await query(`SELECT * FROM devices WHERE "deviceId" = $1`, [deviceId]);
      let device: any = devRes.rows[0];

      let deviceRegistered = true;
      let deviceNeedsApproval = false;

      if (!device) {
        // Generate authentication code for new device
        const authCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const authCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Register new device (requires approval for FIELD users)
        const insertDev = await query(
          `INSERT INTO devices (id, "deviceId", "userId", platform, model, "osVersion", "appVersion", "pushToken", "isActive", "lastActiveAt", "isApproved", "authCode", "authCodeExpiresAt", "registeredAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP, $8, $9, $10, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            deviceId,
            user.id,
            deviceInfo?.platform || 'UNKNOWN',
            deviceInfo?.model || 'Unknown',
            deviceInfo?.osVersion || 'Unknown',
            deviceInfo?.appVersion || 'Unknown',
            deviceInfo?.pushToken || null,
            user.role !== 'FIELD',
            user.role === 'FIELD' ? authCode : null,
            user.role === 'FIELD' ? authCodeExpiresAt : null,
          ]
        );
        device = insertDev.rows[0];
        deviceRegistered = false;
        deviceNeedsApproval = user.role === 'FIELD';
      } else {
        // Update existing device
        await query(
          `UPDATE devices SET platform = $1, model = $2, "osVersion" = $3, "appVersion" = $4, "pushToken" = $5, "isActive" = true, "lastActiveAt" = CURRENT_TIMESTAMP WHERE id = $6`,
          [
            deviceInfo?.platform || device.platform,
            deviceInfo?.model || device.model,
            deviceInfo?.osVersion || device.osVersion,
            deviceInfo?.appVersion || device.appVersion,
            deviceInfo?.pushToken || device.pushToken,
            device.id,
          ]
        );

        // Check if device is approved for field users
        if (user.role === 'FIELD' && !device.isApproved) {
          deviceNeedsApproval = true;
        }
      }

      // Check device limit per user
      const cntRes = await query(`SELECT COUNT(*)::int as count FROM devices WHERE "userId" = $1 AND "isActive" = true`, [user.id]);
      const userDeviceCount = Number(cntRes.rows[0]?.count || 0);

      if (userDeviceCount > config.mobile.maxDevicesPerUser) {
        // Deactivate oldest device
        const oldestRes = await query(
          `SELECT id FROM devices WHERE "userId" = $1 AND "isActive" = true AND id <> $2 ORDER BY "lastActiveAt" ASC LIMIT 1`,
          [user.id, device.id]
        );
        const oldestDevice = oldestRes.rows[0];
        if (oldestDevice) {
          await query(`UPDATE devices SET "isActive" = false WHERE id = $1`, [oldestDevice.id]);
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
      await query(
        `INSERT INTO refresh_tokens (id, token, "userId", "deviceId", "expiresAt", "createdAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [refreshToken, user.id, device.deviceId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
      );

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
          deviceAuthentication: {
            isApproved: device.isApproved,
            needsApproval: deviceNeedsApproval,
            authCode: deviceNeedsApproval ? device.authCode : null,
            authCodeExpiresAt: deviceNeedsApproval ? device.authCodeExpiresAt : null,
          },
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
      const storedRes = await query(
        `SELECT rt.token, u.id as user_id, u.username, u.role
         FROM refresh_tokens rt JOIN users u ON u.id = rt."userId"
         WHERE rt.token = $1 AND rt."userId" = $2 AND rt."deviceId" = $3 AND rt."expiresAt" > CURRENT_TIMESTAMP
         LIMIT 1`,
        [refreshToken, decoded.userId, decoded.deviceId]
      );
      const storedToken = storedRes.rows[0];

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
          userId: storedToken.user_id,
          username: storedToken.username,
          role: storedToken.role,
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
        await query(`DELETE FROM refresh_tokens WHERE "userId" = $1 AND "deviceId" = $2`, [userId, deviceId]);
        await query(`UPDATE devices SET "isActive" = false, "lastActiveAt" = CURRENT_TIMESTAMP WHERE "userId" = $1 AND "deviceId" = $2`, [userId, deviceId]);
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

      await query(
        `UPDATE devices SET "pushToken" = $1, "notificationsEnabled" = $2, "notificationPreferences" = $3 WHERE "userId" = $4 AND "deviceId" = $5`,
        [pushToken, enabled, preferences ? JSON.stringify(preferences) : null, userId, deviceId]
      );

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

  // Device Management Methods for Admins

  /**
   * Get pending device approvals
   */
  static async getPendingDevices(req: Request, res: Response) {
    try {
      const pendingRes = await query(
        `SELECT d.*, u.id as u_id, u.name as u_name, u.username as u_username, u."employeeId" as u_employeeId, u.role as u_role
         FROM devices d JOIN users u ON u.id = d."userId"
         WHERE d."isApproved" = false AND d."authCode" IS NOT NULL
         ORDER BY d."registeredAt" DESC`
      );
      const pendingDevices = pendingRes.rows.map((r: any) => ({
        ...r,
        user: { id: r.u_id, name: r.u_name, username: r.u_username, employeeId: r.u_employeeId, role: r.u_role },
      }));

      res.json({
        success: true,
        data: pendingDevices,
      });
    } catch (error) {
      console.error('Get pending devices error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Approve a device
   */
  static async approveDevice(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const adminUserId = (req as any).user?.userId;

      await query(
        `UPDATE devices SET "isApproved" = true, "approvedAt" = CURRENT_TIMESTAMP, "approvedBy" = $1, "authCode" = NULL, "authCodeExpiresAt" = NULL WHERE id = $2`,
        [adminUserId, deviceId]
      );
      const devRes = await query(
        `SELECT d.*, u.name as u_name, u.username as u_username, u."employeeId" as u_employeeId
         FROM devices d JOIN users u ON u.id = d."userId" WHERE d.id = $1`,
        [deviceId]
      );
      const device = devRes.rows[0];

      // Log the approval (temporarily disabled for testing)
      // await prisma.auditLog.create({
      //   data: {
      //     userId: adminUserId,
      //     action: 'DEVICE_APPROVED',
      //     entityType: 'DEVICE',
      //     entityId: device.id,
      //     details: JSON.stringify({
      //       deviceId: device.deviceId,
      //       userId: device.userId,
      //       platform: device.platform,
      //       model: device.model,
      //     }),
      //     ipAddress: (req as any).ip || 'unknown',
      //     userAgent: req.get('User-Agent') || 'unknown',
      //   },
      // });

      res.json({
        success: true,
        message: 'Device approved successfully',
        data: device,
      });
    } catch (error) {
      console.error('Approve device error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Reject a device
   */
  static async rejectDevice(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const { reason } = req.body;
      const adminUserId = (req as any).user?.userId;

      await query(
        `UPDATE devices SET "rejectedAt" = CURRENT_TIMESTAMP, "rejectedBy" = $1, "rejectionReason" = $2, "authCode" = NULL, "authCodeExpiresAt" = NULL, "isActive" = false WHERE id = $3`,
        [adminUserId, reason, deviceId]
      );
      const devRes2 = await query(
        `SELECT d.*, u.name as u_name, u.username as u_username, u."employeeId" as u_employeeId
         FROM devices d JOIN users u ON u.id = d."userId" WHERE d.id = $1`,
        [deviceId]
      );
      const device = devRes2.rows[0];

      // Log the rejection
      await query(
        `INSERT INTO audit_logs (id, "userId", action, "entityType", "entityId", details, "ipAddress", "userAgent", "createdAt")
         VALUES (gen_random_uuid()::text, $1, 'DEVICE_REJECTED', 'DEVICE', $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          adminUserId,
          device.id,
          JSON.stringify({ deviceId: device.deviceId, userId: device.userId, platform: device.platform, model: device.model, reason }),
          (req as any).ip || 'unknown',
          req.get('User-Agent') || 'unknown',
        ]
      );

      res.json({
        success: true,
        message: 'Device rejected successfully',
        data: device,
      });
    } catch (error) {
      console.error('Reject device error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Get all devices for a user
   */
  static async getUserDevices(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const devs = await query(`SELECT * FROM devices WHERE "userId" = $1 ORDER BY "lastActiveAt" DESC`, [userId]);
      const devices = devs.rows;

      res.json({
        success: true,
        data: devices,
      });
    } catch (error) {
      console.error('Get user devices error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
