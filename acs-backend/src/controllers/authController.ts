import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
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
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        passwordHash: true,
        role: true,
        employeeId: true,
        designation: true,
        department: true,
        profilePhotoUrl: true,
      },
    });

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
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: JSON.stringify({
          deviceId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        }),
      } as any,
    });

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
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LOGOUT',
        details: JSON.stringify({
          deviceId: req.user.deviceId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        }),
      } as any,
    });

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

    // Check if device already exists
    const existingDevice = await prisma.device.findUnique({
      where: { deviceId },
    });

    if (existingDevice) {
      // Update existing device
      await prisma.device.update({
        where: { deviceId },
        data: {
          platform,
          model,
          osVersion,
          appVersion,
        },
      });
    }

    const response: DeviceRegistrationResponse = {
      success: true,
      message: existingDevice ? 'Device updated successfully' : 'Device registration successful',
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
