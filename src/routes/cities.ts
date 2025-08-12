import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import {
  getCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  bulkImportCities,
  getStates,
  getCitiesStats
} from '@/controllers/citiesController';
import { getPincodesByCity } from '@/controllers/pincodesController';

const router = express.Router();

// Apply authentication
router.use(authenticateToken);

// Validation schemas
const createCityValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City name must be between 1 and 100 characters'),
  body('state')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State is required and must be less than 100 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country must be less than 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('City code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('City code must contain only uppercase letters and numbers'),
  body('population')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Population must be a non-negative integer'),
  body('area')
    .optional()
    .isNumeric()
    .withMessage('Area must be a number'),
  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must be less than 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updateCityValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City name must be between 1 and 100 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be less than 100 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country must be less than 100 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('City code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('City code must contain only uppercase letters and numbers'),
  body('population')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Population must be a non-negative integer'),
  body('area')
    .optional()
    .isNumeric()
    .withMessage('Area must be a number'),
  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must be less than 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const listCitiesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  query('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
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
    .isIn(['name', 'state', 'country', 'code', 'population', 'area', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const bulkImportValidation = [
  body('cities')
    .isArray({ min: 1 })
    .withMessage('Cities array is required'),
  body('cities.*.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City name is required and must be less than 100 characters'),
  body('cities.*.state')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State is required and must be less than 100 characters'),
  body('cities.*.code')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('City code is required and must be between 2 and 10 characters'),
];

const statesValidation = [
  query('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
];

// Core CRUD routes
router.get('/', 
  listCitiesValidation, 
  validate, 
  getCities
);

router.get('/states', 
  statesValidation, 
  validate, 
  getStates
);

router.get('/stats', getCitiesStats);

router.post('/', 
  createCityValidation, 
  validate, 
  createCity
);

router.post('/bulk-import', 
  bulkImportValidation, 
  validate, 
  bulkImportCities
);

router.get('/:id', 
  [param('id').trim().notEmpty().withMessage('City ID is required')], 
  validate, 
  getCityById
);

router.put('/:id', 
  [param('id').trim().notEmpty().withMessage('City ID is required')], 
  updateCityValidation, 
  validate, 
  updateCity
);

router.delete('/:id', 
  [param('id').trim().notEmpty().withMessage('City ID is required')], 
  validate, 
  deleteCity
);

router.get('/:id/pincodes', 
  [
    param('id').trim().notEmpty().withMessage('City ID is required'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ], 
  validate, 
  getPincodesByCity
);

export default router;
