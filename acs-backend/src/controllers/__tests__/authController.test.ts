import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '@/app';
import { prisma } from '@/config/database';
// Role is string in SQL Server schema; no enum import

describe('Auth Controller', () => {
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const passwordHash = await bcrypt.hash('testpassword', 12);
      await prisma.user.create({
        data: {
          name: 'Test User',
          username: 'testuser',
          password: 'testpassword',
          passwordHash,
          employeeId: 'TEST001',
          designation: 'Test Executive',
          department: 'Testing',
          phone: '+91-9876543210',
          email: 'test@example.com',
          role: 'FIELD',
        },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'testpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/device/register', () => {
    it('should register device successfully', async () => {
      const response = await request(app)
        .post('/api/auth/device/register')
        .send({
          deviceId: 'TEST_DEVICE_001',
          platform: 'ANDROID',
          model: 'Test Device',
          osVersion: '13.0',
          appVersion: '1.0.0',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deviceId).toBe('TEST_DEVICE_001');
    });

    it('should fail with invalid platform', async () => {
      const response = await request(app)
        .post('/api/auth/device/register')
        .send({
          deviceId: 'TEST_DEVICE_001',
          platform: 'INVALID',
          model: 'Test Device',
          osVersion: '13.0',
          appVersion: '1.0.0',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
