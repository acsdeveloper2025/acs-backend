import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import {
  getVerificationTypes,
  getVerificationTypeById,
  createVerificationType,
  updateVerificationType,
  deleteVerificationType,
  getVerificationTypesByProduct,
  getVerificationTypeCategories,
  getVerificationTypeStats,
  bulkImportVerificationTypes
} from '@/controllers/verificationTypesController';

const router = express.Router();

// Apply authentication
router.use(authenticateToken);

// Validation schemas
const createVerificationTypeValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Code must contain only uppercase letters, numbers, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .isIn(['ADDRESS_VERIFICATION', 'EMPLOYMENT_VERIFICATION', 'BUSINESS_VERIFICATION', 'IDENTITY_VERIFICATION', 'FINANCIAL_VERIFICATION', 'OTHER'])
    .withMessage('Invalid category'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('requirements.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each requirement must be between 1 and 200 characters'),
  body('documents')
    .optional()
    .isArray()
    .withMessage('Documents must be an array'),
  body('documents.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each document must be between 1 and 100 characters'),
  body('estimatedTime')
    .optional()
    .isInt({ min: 1, max: 720 })
    .withMessage('Estimated time must be between 1 and 720 hours'),
  body('basePrice')
    .optional()
    .isNumeric()
    .withMessage('Base price must be a number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updateVerificationTypeValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Code must contain only uppercase letters, numbers, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .optional()
    .isIn(['ADDRESS_VERIFICATION', 'EMPLOYMENT_VERIFICATION', 'BUSINESS_VERIFICATION', 'IDENTITY_VERIFICATION', 'FINANCIAL_VERIFICATION', 'OTHER'])
    .withMessage('Invalid category'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('requirements.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each requirement must be between 1 and 200 characters'),
  body('documents')
    .optional()
    .isArray()
    .withMessage('Documents must be an array'),
  body('documents.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each document must be between 1 and 100 characters'),
  body('estimatedTime')
    .optional()
    .isInt({ min: 1, max: 720 })
    .withMessage('Estimated time must be between 1 and 720 hours'),
  body('basePrice')
    .optional()
    .isNumeric()
    .withMessage('Base price must be a number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const listVerificationTypesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isIn(['ADDRESS_VERIFICATION', 'EMPLOYMENT_VERIFICATION', 'BUSINESS_VERIFICATION', 'IDENTITY_VERIFICATION', 'FINANCIAL_VERIFICATION', 'OTHER'])
    .withMessage('Invalid category'),
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
    .isIn(['name', 'code', 'category', 'basePrice', 'estimatedTime', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const bulkImportValidation = [
  body('verificationTypes')
    .isArray({ min: 1 })
    .withMessage('Verification types array is required'),
  body('verificationTypes.*.name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name is required and must be less than 200 characters'),
  body('verificationTypes.*.code')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Code is required and must be between 2 and 50 characters'),
];

// Core CRUD routes
router.get('/', 
  listVerificationTypesValidation, 
  validate, 
  getVerificationTypes
);

router.get('/categories', getVerificationTypeCategories);

router.get('/stats', getVerificationTypeStats);

router.post('/', 
  createVerificationTypeValidation, 
  validate, 
  createVerificationType
);

router.post('/bulk-import', 
  bulkImportValidation, 
  validate, 
  bulkImportVerificationTypes
);

router.get('/:id', 
  [param('id').trim().notEmpty().withMessage('Verification type ID is required')], 
  validate, 
  getVerificationTypeById
);

router.put('/:id', 
  [param('id').trim().notEmpty().withMessage('Verification type ID is required')], 
  updateVerificationTypeValidation, 
  validate, 
  updateVerificationType
);

router.delete('/:id', 
  [param('id').trim().notEmpty().withMessage('Verification type ID is required')], 
  validate, 
  deleteVerificationType
);

export default router;
