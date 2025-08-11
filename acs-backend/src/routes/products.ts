import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByClient,
  mapVerificationTypes,
  bulkImportProducts,
  getProductCategories,
  getProductStats
} from '@/controllers/productsController';
import { getVerificationTypesByProduct } from '@/controllers/verificationTypesController';

const router = express.Router();

// Apply authentication
router.use(authenticateToken);

// Validation schemas
const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Product code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Product code must contain only uppercase letters, numbers, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .isIn(['LOAN_VERIFICATION', 'EMPLOYMENT_VERIFICATION', 'BUSINESS_VERIFICATION', 'IDENTITY_VERIFICATION', 'ADDRESS_VERIFICATION', 'OTHER'])
    .withMessage('Invalid category'),
  body('clientId')
    .trim()
    .notEmpty()
    .withMessage('Client ID is required'),
  body('pricing.basePrice')
    .optional()
    .isNumeric()
    .withMessage('Base price must be a number'),
  body('pricing.currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR'])
    .withMessage('Currency must be one of: INR, USD, EUR'),
  body('pricing.pricingModel')
    .optional()
    .isIn(['PER_VERIFICATION', 'MONTHLY', 'YEARLY', 'CUSTOM'])
    .withMessage('Pricing model must be one of: PER_VERIFICATION, MONTHLY, YEARLY, CUSTOM'),
  body('verificationType')
    .optional()
    .isArray()
    .withMessage('Verification type must be an array'),
  body('verificationType.*')
    .optional()
    .isIn(['RESIDENCE', 'OFFICE', 'BUSINESS', 'EMPLOYMENT', 'OTHER'])
    .withMessage('Invalid verification type'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Product code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Product code must contain only uppercase letters, numbers, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .optional()
    .isIn(['LOAN_VERIFICATION', 'EMPLOYMENT_VERIFICATION', 'BUSINESS_VERIFICATION', 'IDENTITY_VERIFICATION', 'ADDRESS_VERIFICATION', 'OTHER'])
    .withMessage('Invalid category'),
  body('pricing.basePrice')
    .optional()
    .isNumeric()
    .withMessage('Base price must be a number'),
  body('pricing.currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR'])
    .withMessage('Currency must be one of: INR, USD, EUR'),
  body('pricing.pricingModel')
    .optional()
    .isIn(['PER_VERIFICATION', 'MONTHLY', 'YEARLY', 'CUSTOM'])
    .withMessage('Pricing model must be one of: PER_VERIFICATION, MONTHLY, YEARLY, CUSTOM'),
  body('verificationType')
    .optional()
    .isArray()
    .withMessage('Verification type must be an array'),
  body('verificationType.*')
    .optional()
    .isIn(['RESIDENCE', 'OFFICE', 'BUSINESS', 'EMPLOYMENT', 'OTHER'])
    .withMessage('Invalid verification type'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const listProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('clientId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Client ID must not be empty'),
  query('category')
    .optional()
    .isIn(['LOAN_VERIFICATION', 'EMPLOYMENT_VERIFICATION', 'BUSINESS_VERIFICATION', 'IDENTITY_VERIFICATION', 'ADDRESS_VERIFICATION', 'OTHER'])
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
    .isIn(['name', 'code', 'category', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const verificationTypesValidation = [
  body('verificationTypes')
    .isArray({ min: 1 })
    .withMessage('Verification types array is required'),
  body('verificationTypes.*')
    .isIn(['RESIDENCE', 'OFFICE', 'BUSINESS', 'EMPLOYMENT', 'OTHER'])
    .withMessage('Invalid verification type'),
];

const bulkImportValidation = [
  body('products')
    .isArray({ min: 1 })
    .withMessage('Products array is required'),
  body('products.*.name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name is required and must be less than 200 characters'),
  body('products.*.code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Product code is required and must be between 2 and 20 characters'),
  body('products.*.clientId')
    .trim()
    .notEmpty()
    .withMessage('Client ID is required'),
];

const clientProductsValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Client ID is required'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// Core CRUD routes
router.get('/', 
  listProductsValidation, 
  validate, 
  getProducts
);

router.get('/categories', getProductCategories);

router.get('/stats', getProductStats);

router.post('/', 
  createProductValidation, 
  validate, 
  createProduct
);

router.post('/bulk-import', 
  bulkImportValidation, 
  validate, 
  bulkImportProducts
);

router.get('/:id', 
  [param('id').trim().notEmpty().withMessage('Product ID is required')], 
  validate, 
  getProductById
);

router.put('/:id', 
  [param('id').trim().notEmpty().withMessage('Product ID is required')], 
  updateProductValidation, 
  validate, 
  updateProduct
);

router.delete('/:id', 
  [param('id').trim().notEmpty().withMessage('Product ID is required')], 
  validate, 
  deleteProduct
);

router.post('/:id/verification-types',
  [param('id').trim().notEmpty().withMessage('Product ID is required')],
  verificationTypesValidation,
  validate,
  mapVerificationTypes
);

router.get('/:id/verification-types',
  [param('id').trim().notEmpty().withMessage('Product ID is required')],
  validate,
  getVerificationTypesByProduct
);

export default router;
