import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/config/database';
import { config } from '@/config';
import { logger } from '@/config/logger';
import { createError } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import {
  LoginRequest,
  LoginResponse,
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
  JwtPayload,
  RefreshTokenPayload,
  Role
} from '@/types/auth';
import { ApiResponse } from '@/types/api';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, deviceId }: LoginRequest = req.body;

    // Find user by username
    const userRes = await query(
      `SELECT id, name, username, email, "passwordHash", role, "employeeId", designation, department, "profilePhotoUrl"
       FROM users WHERE username = $1`,
      [username]
    );
    const user = userRes.rows[0];

    if (!user) {
      throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const accessTokenPayload: any = {
      userId: user.id,
      username: user.username,
      role: user.role,
      ...(deviceId && { deviceId }),
    };

    const refreshTokenPayload: any = {
      userId: user.id,
      ...(deviceId && { deviceId }),
    };

    const accessToken = jwt.sign(accessTokenPayload, config.jwtSecret as any, {
      expiresIn: '24h',
    } as any);

    const refreshToken = jwt.sign(refreshTokenPayload, config.jwtRefreshSecret as any, {
      expiresIn: '7d',
    } as any);

    // Log successful login
    await query(
      `INSERT INTO audit_logs (id, "userId", action, details, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'LOGIN', $2, CURRENT_TIMESTAMP)`,
      [user.id, JSON.stringify({ deviceId, ip: req.ip, userAgent: req.get('User-Agent') })]
    );

    const response: LoginResponse = {
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
          ...(user.profilePhotoUrl && { profilePhotoUrl: user.profilePhotoUrl }),
        } as any,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    };

    logger.info(`User ${user.username} logged in successfully`);
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Log logout
    await query(
      `INSERT INTO audit_logs (id, "userId", action, details, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'LOGOUT', $2, CURRENT_TIMESTAMP)`,
      [req.user.id, JSON.stringify({ deviceId: req.user.deviceId, ip: req.ip, userAgent: req.get('User-Agent') })]
    );

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    logger.info(`User ${req.user.username} logged out successfully`);
    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId, platform, model, osVersion, appVersion }: DeviceRegistrationRequest = req.body;

    // Upsert device
    await query(
      `INSERT INTO devices (id, "deviceId", platform, model, "osVersion", "appVersion", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT ("deviceId") DO UPDATE SET platform = EXCLUDED.platform, model = EXCLUDED.model, "osVersion" = EXCLUDED."osVersion", "appVersion" = EXCLUDED."appVersion", "updatedAt" = CURRENT_TIMESTAMP`,
      [deviceId, platform, model, osVersion, appVersion]
    );

    const response: DeviceRegistrationResponse = {
      success: true,
      message: 'Device registration successful',
      data: {
        deviceId,
        registeredAt: new Date().toISOString(),
      },
    };

    logger.info(`Device ${deviceId} registered/updated successfully`);
    res.json(response);
  } catch (error) {
    throw error;
  }
};
