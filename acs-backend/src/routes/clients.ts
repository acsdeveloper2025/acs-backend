import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { logger } from '@/config/logger';
import { prisma } from '@/config/database';
// import { getProductsByClient } from '@/controllers/productsController';

const router = express.Router();

// Mock data for demonstration (replace with actual database operations)
let clients: any[] = [
  {
    id: 'client_1',
    name: 'Acme Corporation',
    code: 'ACME_CORP',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'client_2',
    name: 'Tech Solutions Inc',
    code: 'TECH_SOL',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

// Validation rules
const createClientValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Client name must be between 1 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Client code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Client code must contain only uppercase letters, numbers, and underscores'),
];

const updateClientValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Client name must be between 1 and 100 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Client code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Client code must contain only uppercase letters, numbers, and underscores'),
];

// GET /api/clients - Get all clients
router.get('/',
  authenticateToken,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long'),
  ]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      
      // Build where clause for search
      const whereClause = search ? {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' as const } },
          { code: { contains: search as string, mode: 'insensitive' as const } },
        ],
      } : {};

      // Get total count for pagination
      const totalCount = await prisma.client.count({
        where: whereClause,
      });

      // Get paginated clients from database
      const dbClients = await prisma.client.findMany({
        where: whereClause,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      });

      logger.info(`Retrieved ${dbClients.length} clients from database`, {
        userId: req.user?.id,
        page,
        limit,
        search,
        total: totalCount
      });

      // Add cache-busting headers to ensure fresh responses
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json({
        success: true,
        data: dbClients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error retrieving clients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve clients',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  }
);

// GET /api/clients/:id - Get client by ID
router.get('/:id',
  authenticateToken,
  validate([
    param('id').trim().notEmpty().withMessage('Client ID is required'),
  ]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const client = await prisma.client.findUnique({
        where: { id },
      });
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
          error: { code: 'NOT_FOUND' },
        });
      }
      
      logger.info(`Retrieved client ${id}`, { userId: req.user?.id });
      
      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      logger.error('Error retrieving client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve client',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  }
);

// POST /api/clients - Create new client
router.post('/',
  authenticateToken,
  validate(createClientValidation),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, code } = req.body;
      
      // Check if client code already exists in database
      const existingClient = await prisma.client.findUnique({
        where: { code },
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Client code already exists',
          error: { code: 'DUPLICATE_CODE' },
        });
      }

      // Create new client in database
      const newClient = await prisma.client.create({
        data: {
          name,
          code,
        },
      });
      
      logger.info(`Created new client: ${newClient.id}`, { 
        userId: req.user?.id,
        clientName: name,
        clientCode: code
      });
      
      res.status(201).json({
        success: true,
        data: newClient,
        message: 'Client created successfully',
      });
    } catch (error) {
      logger.error('Error creating client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create client',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  }
);

// PUT /api/clients/:id - Update client
router.put('/:id',
  authenticateToken,
  [
    param('id').trim().notEmpty().withMessage('Client ID is required'),
    ...updateClientValidation,
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code } = req.body;
      
      const clientIndex = clients.findIndex(c => c.id === id);
      if (clientIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
          error: { code: 'NOT_FOUND' },
        });
      }
      
      // Check if new code conflicts with existing client
      if (code && code !== clients[clientIndex].code) {
        const existingClient = clients.find(c => c.code === code && c.id !== id);
        if (existingClient) {
          return res.status(400).json({
            success: false,
            message: 'Client code already exists',
            error: { code: 'DUPLICATE_CODE' },
          });
        }
      }
      
      // Update client
      const updatedClient = {
        ...clients[clientIndex],
        ...(name && { name }),
        ...(code && { code }),
        updatedAt: new Date().toISOString(),
      };
      
      clients[clientIndex] = updatedClient;
      
      logger.info(`Updated client: ${id}`, { 
        userId: req.user?.id,
        changes: { name, code }
      });
      
      res.json({
        success: true,
        data: updatedClient,
        message: 'Client updated successfully',
      });
    } catch (error) {
      logger.error('Error updating client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update client',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  }
);

// DELETE /api/clients/:id - Delete client
router.delete('/:id',
  authenticateToken,
  [
    param('id').trim().notEmpty().withMessage('Client ID is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const clientIndex = clients.findIndex(c => c.id === id);
      if (clientIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
          error: { code: 'NOT_FOUND' },
        });
      }
      
      const deletedClient = clients[clientIndex];
      clients.splice(clientIndex, 1);
      
      logger.info(`Deleted client: ${id}`, { 
        userId: req.user?.id,
        clientName: deletedClient.name
      });
      
      res.json({
        success: true,
        message: 'Client deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting client:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete client',
        error: { code: 'INTERNAL_ERROR' },
      });
    }
  }
);

// GET /api/clients/:id/products - Get products by client
// Temporarily commented out due to import issues
// router.get('/:id/products',
//   [
//     param('id').trim().notEmpty().withMessage('Client ID is required'),
//     query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
//   ],
//   validate,
//   getProductsByClient
// );

export default router;
