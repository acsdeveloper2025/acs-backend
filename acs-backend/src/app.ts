import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '@/config';
import { logger } from '@/config/logger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { generalRateLimit } from '@/middleware/rateLimiter';

// Import routes
import authRoutes from '@/routes/auth';
import caseRoutes from '@/routes/cases';
import clientRoutes from '@/routes/clients';
import attachmentRoutes from '@/routes/attachments';
import userRoutes from '@/routes/user';
import usersRoutes from '@/routes/users';
import dashboardRoutes from '@/routes/dashboard';
import productsRoutes from '@/routes/products';
import verificationTypesRoutes from '@/routes/verification-types';
import invoicesRoutes from '@/routes/invoices';
import commissionsRoutes from '@/routes/commissions';
import citiesRoutes from '@/routes/cities';
import pincodesRoutes from '@/routes/pincodes';
import locationsRoutes from '@/routes/locations';
import reportsRoutes from '@/routes/reports';
import auditLogsRoutes from '@/routes/audit-logs';
import geolocationRoutes from '@/routes/geolocation';
import formRoutes from '@/routes/forms';
import notificationRoutes from '@/routes/notifications';
import mobileRoutes from '@/routes/mobile';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-App-Version',
    'X-Platform',
    'X-Device-ID',
    'X-Device-Model',
    'X-OS-Version',
  ],
}));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalRateLimit);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/verification-types', verificationTypesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/pincodes', pincodesRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/geolocation', geolocationRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/notifications', notificationRoutes);

// Mobile API routes
app.use('/api/mobile', mobileRoutes);

// Serve uploaded files
app.use('/uploads', express.static(config.uploadPath));

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
