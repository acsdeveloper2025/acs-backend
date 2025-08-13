import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, registerDevice } from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
// Removed authRateLimit import - no rate limiting for auth routes

const router = Router();

// Removed auth rate limiting for better user experience

// Login validation
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('deviceId')
    .optional()
    .isString()
    .withMessage('Device ID must be a string'),
];

// Device registration validation
const deviceRegistrationValidation = [
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required')
    .isString()
    .withMessage('Device ID must be a string'),
  body('platform')
    .isIn(['IOS', 'ANDROID'])
    .withMessage('Platform must be either IOS or ANDROID'),
  body('model')
    .notEmpty()
    .withMessage('Device model is required')
    .isString()
    .withMessage('Device model must be a string'),
  body('osVersion')
    .notEmpty()
    .withMessage('OS version is required')
    .isString()
    .withMessage('OS version must be a string'),
  body('appVersion')
    .notEmpty()
    .withMessage('App version is required')
    .isString()
    .withMessage('App version must be a string'),
];

// Routes
router.post('/login', validate(loginValidation), login);
router.post('/logout', authenticateToken, logout);
router.post('/device/register', validate(deviceRegistrationValidation), registerDevice);

export default router;
