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
  getProductsByClient
} from '@/controllers/productsController';

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

// TODO: Implement these validation rules when needed
// const verificationTypesValidation = [
//   body('verificationTypes')
//     .isArray({ min: 1 })
//     .withMessage('Verification types array is required'),
//   body('verificationTypes.*')
//     .isIn(['RESIDENCE', 'OFFICE', 'BUSINESS', 'EMPLOYMENT', 'OTHER'])
//     .withMessage('Invalid verification type'),
// ];

// const bulkImportValidation = [
//   body('products')
//     .isArray({ min: 1 })
//     .withMessage('Products array is required'),
//   body('products.*.name')
//     .trim()
//     .isLength({ min: 1, max: 200 })
//     .withMessage('Product name is required and must be less than 200 characters'),
//   body('products.*.code')
//     .trim()
//     .isLength({ min: 2, max: 20 })
//     .withMessage('Product code is required and must be between 2 and 20 characters'),
//   body('products.*.clientId')
//     .trim()
//     .notEmpty()
//     .withMessage('Client ID is required'),
// ];

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

// TODO: Implement these endpoints
// router.get('/categories', getProductCategories);
// router.get('/stats', getProductStats);

router.post('/', 
  createProductValidation, 
  validate, 
  createProduct
);

// TODO: Implement bulk import endpoint
// router.post('/bulk-import',
//   bulkImportValidation,
//   validate,
//   bulkImportProducts
// );

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

// TODO: Implement verification type mapping endpoints
// router.post('/:id/verification-types',
//   [param('id').trim().notEmpty().withMessage('Product ID is required')],
//   verificationTypesValidation,
//   validate,
//   mapVerificationTypes
// );

// router.get('/:id/verification-types',
//   [param('id').trim().notEmpty().withMessage('Product ID is required')],
//   validate,
//   getVerificationTypesByProduct
// );

export default router;
