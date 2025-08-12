import express from 'express';
import { query } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import {
  getCountries,
  getStates,
  getRegions,
  getTimezones,
  getCurrencies,
  getPhoneCodes
} from '@/controllers/locationsController';

const router = express.Router();

// Apply authentication
router.use(authenticateToken);

// Validation schemas
const countriesValidation = [
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const statesValidation = [
  query('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const regionsValidation = [
  query('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
];

const timezonesValidation = [
  query('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
];

// Location data routes
router.get('/countries', 
  countriesValidation, 
  validate, 
  getCountries
);

router.get('/states', 
  statesValidation, 
  validate, 
  getStates
);

router.get('/regions', 
  regionsValidation, 
  validate, 
  getRegions
);

router.get('/timezones', 
  timezonesValidation, 
  validate, 
  getTimezones
);

router.get('/currencies', getCurrencies);

router.get('/phone-codes', getPhoneCodes);

export default router;
