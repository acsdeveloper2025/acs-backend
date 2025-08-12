import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken, requireFieldOrHigher } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { caseRateLimit } from '@/middleware/rateLimiter';
import {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  updateCaseStatus,
  updateCasePriority,
  assignCase,
  addCaseNote,
  getCaseHistory,
  completeCase,
  approveCase,
  rejectCase,
  requestRework
} from '@/controllers/casesController';

const router = express.Router();

// Apply authentication and rate limiting
router.use(authenticateToken);
router.use(requireFieldOrHigher);
router.use(caseRateLimit);

// Validation schemas
const createCaseValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('clientId')
    .trim()
    .notEmpty()
    .withMessage('Client ID is required'),
  body('assignedToId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assigned user ID must not be empty'),
  body('address')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Address must be between 1 and 500 characters'),
  body('contactPerson')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact person must be between 1 and 100 characters'),
  body('contactPhone')
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Contact phone must be valid'),
  body('verificationType')
    .isIn(['RESIDENCE', 'OFFICE', 'BUSINESS', 'OTHER'])
    .withMessage('Verification type must be one of: RESIDENCE, OFFICE, BUSINESS, OTHER'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
];

const updateCaseValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Address must be between 1 and 500 characters'),
  body('contactPerson')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact person must be between 1 and 100 characters'),
  body('contactPhone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Contact phone must be valid'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
];

const listCasesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'REWORK_REQUIRED'])
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
];

const statusUpdateValidation = [
  body('status')
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'REWORK_REQUIRED'])
    .withMessage('Invalid status'),
];

const priorityUpdateValidation = [
  body('priority')
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
];

const assignValidation = [
  body('assignedToId')
    .trim()
    .notEmpty()
    .withMessage('Assigned user ID is required'),
];

const noteValidation = [
  body('note')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be between 1 and 1000 characters'),
];

const completeValidation = [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
];

const approveValidation = [
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be less than 1000 characters'),
];

const rejectValidation = [
  body('reason')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Rejection reason is required and must be less than 1000 characters'),
];

const reworkValidation = [
  body('feedback')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Rework feedback is required and must be less than 1000 characters'),
];

// Core CRUD routes
router.get('/',
  listCasesValidation,
  validate,
  getCases
);

router.post('/',
  createCaseValidation,
  validate,
  createCase
);

router.get('/:id',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  validate,
  getCaseById
);

router.put('/:id',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  updateCaseValidation,
  validate,
  updateCase
);

router.delete('/:id',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  validate,
  deleteCase
);

// Case workflow routes
router.put('/:id/status',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  statusUpdateValidation,
  validate,
  updateCaseStatus
);

router.put('/:id/priority',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  priorityUpdateValidation,
  validate,
  updateCasePriority
);

router.put('/:id/assign',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  assignValidation,
  validate,
  assignCase
);

router.post('/:id/notes',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  noteValidation,
  validate,
  addCaseNote
);

router.get('/:id/history',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  validate,
  getCaseHistory
);

router.post('/:id/complete',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  completeValidation,
  validate,
  completeCase
);

router.post('/:id/approve',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  approveValidation,
  validate,
  approveCase
);

router.post('/:id/reject',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  rejectValidation,
  validate,
  rejectCase
);

router.post('/:id/rework',
  [param('id').trim().notEmpty().withMessage('Case ID is required')],
  reworkValidation,
  validate,
  requestRework
);

export default router;
