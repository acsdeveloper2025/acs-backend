import express from 'express';
import { body, query } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import {
  getCasesReport,
  getUsersReport,
  getClientsReport,
  getFinancialReport,
  getProductivityReport,
  getCustomReport,
  getReportTemplates,
  scheduleReport
} from '@/controllers/reportsController';

const router = express.Router();

// Apply authentication
router.use(authenticateToken);

// Validation schemas
const dateRangeValidation = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  query('format')
    .optional()
    .isIn(['JSON', 'CSV', 'PDF', 'EXCEL'])
    .withMessage('Format must be one of: JSON, CSV, PDF, EXCEL'),
];

const casesReportValidation = [
  ...dateRangeValidation,
  query('clientId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Client ID must not be empty'),
  query('assignedToId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assigned user ID must not be empty'),
  query('status')
    .optional()
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'REWORK_REQUIRED'])
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
];

const usersReportValidation = [
  ...dateRangeValidation,
  query('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  query('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'FIELD', 'CLIENT'])
    .withMessage('Invalid role'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const clientsReportValidation = [
  ...dateRangeValidation,
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const financialReportValidation = [
  ...dateRangeValidation,
  query('clientId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Client ID must not be empty'),
];

const productivityReportValidation = [
  ...dateRangeValidation,
  query('userId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('User ID must not be empty'),
  query('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
];

const customReportValidation = [
  body('reportType')
    .isIn(['cases', 'users', 'clients', 'invoices', 'commissions'])
    .withMessage('Invalid report type'),
  body('metrics')
    .isArray({ min: 1 })
    .withMessage('Metrics array is required'),
  body('metrics.*')
    .isIn(['count', 'sum', 'average', 'min', 'max'])
    .withMessage('Invalid metric'),
  body('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  body('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  body('groupBy')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Group by field must be less than 50 characters'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  body('format')
    .optional()
    .isIn(['JSON', 'CSV', 'PDF', 'EXCEL'])
    .withMessage('Format must be one of: JSON, CSV, PDF, EXCEL'),
];

const scheduleReportValidation = [
  body('reportType')
    .isIn(['cases', 'users', 'clients', 'financial', 'productivity', 'custom'])
    .withMessage('Invalid report type'),
  body('parameters')
    .isObject()
    .withMessage('Parameters object is required'),
  body('schedule.frequency')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be one of: daily, weekly, monthly'),
  body('schedule.time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('Recipients array is required'),
  body('recipients.*')
    .isEmail()
    .withMessage('Each recipient must be a valid email'),
  body('format')
    .optional()
    .isIn(['PDF', 'EXCEL', 'CSV'])
    .withMessage('Format must be one of: PDF, EXCEL, CSV'),
];

// Report routes
router.get('/cases', 
  casesReportValidation, 
  validate, 
  getCasesReport
);

router.get('/users', 
  usersReportValidation, 
  validate, 
  getUsersReport
);

router.get('/clients', 
  clientsReportValidation, 
  validate, 
  getClientsReport
);

router.get('/financial', 
  financialReportValidation, 
  validate, 
  getFinancialReport
);

router.get('/productivity', 
  productivityReportValidation, 
  validate, 
  getProductivityReport
);

router.post('/custom', 
  customReportValidation, 
  validate, 
  getCustomReport
);

router.get('/templates', getReportTemplates);

router.post('/schedule', 
  scheduleReportValidation, 
  validate, 
  scheduleReport
);

export default router;
