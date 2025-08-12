import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { logger } from '@/config/logger';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  searchUsers,
  getUserStats,
  getDepartments,
  getDesignations,
  bulkUserOperation
} from '@/controllers/usersController';

const router = express.Router();

// Validation schemas
const createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('role')
    .isIn(['ADMIN', 'MANAGER', 'FIELD', 'VIEWER'])
    .withMessage('Role must be one of: ADMIN, MANAGER, FIELD, VIEWER'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Designation must be less than 100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone number must be valid'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'FIELD', 'VIEWER'])
    .withMessage('Role must be one of: ADMIN, MANAGER, FIELD, VIEWER'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Designation must be less than 100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone number must be valid'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const listUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'FIELD', 'VIEWER'])
    .withMessage('Role must be one of: ADMIN, MANAGER, FIELD, VIEWER'),
  query('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['name', 'username', 'email', 'role', 'department', 'createdAt', 'lastLoginAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const bulkOperationValidation = [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs array is required'),
  body('userIds.*')
    .isString()
    .withMessage('Each user ID must be a string'),
  body('operation')
    .isIn(['activate', 'deactivate', 'delete', 'change_role'])
    .withMessage('Operation must be one of: activate, deactivate, delete, change_role'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
];

const searchValidation = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

// Core CRUD routes
router.get('/', 
  authenticateToken, 
  listUsersValidation, 
  validate, 
  getUsers
);

router.get('/search', 
  authenticateToken, 
  searchValidation, 
  validate, 
  searchUsers
);

router.get('/stats', 
  authenticateToken, 
  getUserStats
);

router.get('/departments', 
  authenticateToken, 
  getDepartments
);

router.get('/designations', 
  authenticateToken, 
  getDesignations
);

router.post('/', 
  authenticateToken, 
  createUserValidation, 
  validate, 
  createUser
);

router.post('/bulk-operation', 
  authenticateToken, 
  bulkOperationValidation, 
  validate, 
  bulkUserOperation
);

router.get('/:id', 
  authenticateToken, 
  [param('id').trim().notEmpty().withMessage('User ID is required')], 
  validate, 
  getUserById
);

router.put('/:id', 
  authenticateToken, 
  [param('id').trim().notEmpty().withMessage('User ID is required')], 
  updateUserValidation, 
  validate, 
  updateUser
);

router.delete('/:id', 
  authenticateToken, 
  [param('id').trim().notEmpty().withMessage('User ID is required')], 
  validate, 
  deleteUser
);

router.post('/:id/activate', 
  authenticateToken, 
  [param('id').trim().notEmpty().withMessage('User ID is required')], 
  validate, 
  activateUser
);

router.post('/:id/deactivate', 
  authenticateToken, 
  [
    param('id').trim().notEmpty().withMessage('User ID is required'),
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
  ], 
  validate, 
  deactivateUser
);

export default router;
