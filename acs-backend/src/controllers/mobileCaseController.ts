import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  MobileCaseListRequest, 
  MobileCaseResponse, 
  MobileAutoSaveRequest,
  MobileAutoSaveResponse
} from '../types/mobile';
import { createAuditLog } from '../utils/auditLogger';
import { config } from '../config';

const prisma = new PrismaClient();

export class MobileCaseController {
  // Get cases for mobile app with optimized response
  static async getMobileCases(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      
      const {
        page = 1,
        limit = 20,
        status,
        search,
        assignedTo,
        priority,
        dateFrom,
        dateTo,
        lastSyncTimestamp,
      }: MobileCaseListRequest = req.query as any;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Math.min(Number(limit), config.mobile.syncBatchSize);

      // Build where clause
      const where: any = {};

      // Role-based filtering
      if (userRole === 'FIELD') {
        where.assignedToId = userId;
      } else if (assignedTo) {
        where.assignedToId = assignedTo;
      }

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = Number(priority);
      }

      if (search) {
        where.OR = [
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (dateFrom || dateTo) {
        where.assignedAt = {};
        if (dateFrom) {
          where.assignedAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.assignedAt.lte = new Date(dateTo);
        }
      }

      // Sync-specific filtering
      if (lastSyncTimestamp) {
        where.updatedAt = {
          gt: new Date(lastSyncTimestamp),
        };
      }

      const [cases, totalCount] = await Promise.all([
        prisma.case.findMany({
          where,
          skip,
          take,
          orderBy: [
            { priority: 'desc' },
            { assignedAt: 'desc' },
          ],
          include: {
            client: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            attachments: {
              select: {
                id: true,
                name: true,
                originalName: true,
                mimeType: true,
                size: true,
                url: true,
                thumbnailUrl: true,
                uploadedAt: true,
                geoLocation: true,
              },
            },
          },
        }),
        prisma.case.count({ where }),
      ]);

      // Transform cases for mobile response
      const mobileCases: MobileCaseResponse[] = cases.map(caseItem => ({
        id: caseItem.id,
        title: caseItem.title,
        description: caseItem.description,
        customerName: caseItem.customerName,
        customerPhone: caseItem.customerPhone,
        customerEmail: caseItem.customerEmail,
        addressStreet: caseItem.addressStreet,
        addressCity: caseItem.addressCity,
        addressState: caseItem.addressState,
        addressPincode: caseItem.addressPincode,
        latitude: caseItem.latitude,
        longitude: caseItem.longitude,
        status: caseItem.status,
        priority: caseItem.priority,
        assignedAt: caseItem.assignedAt.toISOString(),
        updatedAt: caseItem.updatedAt.toISOString(),
        completedAt: caseItem.completedAt?.toISOString(),
        notes: caseItem.notes,
        verificationType: caseItem.verificationType,
        verificationOutcome: caseItem.verificationOutcome,
        client: {
          id: (caseItem as any).client?.id || '',
          name: (caseItem as any).client?.name || '',
          code: (caseItem as any).client?.code || '',
        },
        attachments: (caseItem as any).attachments?.map((att: any) => ({
          id: att.id,
          filename: att.name,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          url: att.url,
          thumbnailUrl: att.thumbnailUrl,
          uploadedAt: att.uploadedAt.toISOString(),
          geoLocation: att.geoLocation as any,
        })),
        formData: (caseItem as any).verificationData || null,
        syncStatus: 'SYNCED',
      }));

      const totalPages = Math.ceil(totalCount / take);
      const hasMore = Number(page) < totalPages;

      res.json({
        success: true,
        message: 'Cases retrieved successfully',
        data: mobileCases,
        pagination: {
          page: Number(page),
          limit: take,
          total: totalCount,
          totalPages,
          hasMore,
        },
        syncTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get mobile cases error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'CASES_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get single case for mobile
  static async getMobileCase(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const where: any = { id: caseId };
      
      // Role-based access control
      if (userRole === 'FIELD') {
        where.assignedToId = userId;
      }

      const caseItem = await prisma.case.findFirst({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          attachments: {
            select: {
              id: true,
              name: true,
              originalName: true,
              mimeType: true,
              size: true,
              url: true,
              thumbnailUrl: true,
              uploadedAt: true,
              geoLocation: true,
            },
          },
          locations: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      });

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'Case not found',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const mobileCase: MobileCaseResponse = {
        id: caseItem.id,
        title: caseItem.title,
        description: caseItem.description,
        customerName: caseItem.customerName,
        customerPhone: caseItem.customerPhone,
        customerEmail: caseItem.customerEmail,
        addressStreet: caseItem.addressStreet,
        addressCity: caseItem.addressCity,
        addressState: caseItem.addressState,
        addressPincode: caseItem.addressPincode,
        latitude: caseItem.latitude,
        longitude: caseItem.longitude,
        status: caseItem.status,
        priority: caseItem.priority,
        assignedAt: caseItem.assignedAt.toISOString(),
        updatedAt: caseItem.updatedAt.toISOString(),
        completedAt: caseItem.completedAt?.toISOString(),
        notes: caseItem.notes,
        verificationType: caseItem.verificationType,
        verificationOutcome: caseItem.verificationOutcome,
        client: {
          id: (caseItem as any).client?.id || '',
          name: (caseItem as any).client?.name || '',
          code: (caseItem as any).client?.code || '',
        },
        attachments: (caseItem as any).attachments?.map((att: any) => ({
          id: att.id,
          filename: att.name,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          url: att.url,
          thumbnailUrl: att.thumbnailUrl,
          uploadedAt: att.uploadedAt.toISOString(),
          geoLocation: att.geoLocation as any,
        })),
        formData: (caseItem as any).verificationData || null,
        syncStatus: 'SYNCED',
      };

      res.json({
        success: true,
        message: 'Case retrieved successfully',
        data: mobileCase,
      });
    } catch (error) {
      console.error('Get mobile case error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'CASE_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Update case status from mobile
  static async updateCaseStatus(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const { status, notes } = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const where: any = { id: caseId };
      
      // Role-based access control
      if (userRole === 'FIELD') {
        where.assignedToId = userId;
      }

      const existingCase = await prisma.case.findFirst({ where });

      if (!existingCase) {
        return res.status(404).json({
          success: false,
          message: 'Case not found or access denied',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          status,
          notes: notes || existingCase.notes,
          completedAt: status === 'COMPLETED' ? new Date() : existingCase.completedAt,
          updatedAt: new Date(),
        },
        include: {
          client: true,
          assignedTo: true,
        },
      });

      await createAuditLog({
        action: 'CASE_STATUS_UPDATED',
        entityType: 'CASE',
        entityId: caseId,
        userId,
        details: {
          oldStatus: existingCase.status,
          newStatus: status,
          notes,
          source: 'MOBILE_APP',
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Case status updated successfully',
        data: {
          id: updatedCase.id,
          status: updatedCase.status,
          updatedAt: updatedCase.updatedAt.toISOString(),
          completedAt: updatedCase.completedAt?.toISOString(),
        },
      });
    } catch (error) {
      console.error('Update case status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'STATUS_UPDATE_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Update case priority from mobile
  static async updateCasePriority(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const { priority } = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (userRole === 'FIELD') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update priority',
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const existingCase = await prisma.case.findUnique({
        where: { id: caseId },
      });

      if (!existingCase) {
        return res.status(404).json({
          success: false,
          message: 'Case not found',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          priority: Number(priority),
          updatedAt: new Date(),
        },
      });

      await createAuditLog({
        action: 'CASE_PRIORITY_UPDATED',
        entityType: 'CASE',
        entityId: caseId,
        userId,
        details: {
          oldPriority: existingCase.priority,
          newPriority: priority,
          source: 'MOBILE_APP',
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Case priority updated successfully',
        data: {
          id: updatedCase.id,
          priority: updatedCase.priority,
          updatedAt: updatedCase.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Update case priority error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'PRIORITY_UPDATE_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Auto-save form data
  static async autoSaveForm(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const { formType, formData, timestamp }: MobileAutoSaveRequest = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const where: any = { id: caseId };
      
      // Role-based access control
      if (userRole === 'FIELD') {
        where.assignedToId = userId;
      }

      const existingCase = await prisma.case.findFirst({ where });

      if (!existingCase) {
        return res.status(404).json({
          success: false,
          message: 'Case not found or access denied',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Save or update auto-save data
      const existingAutoSave = await prisma.autoSave.findFirst({
        where: {
          caseId: caseId,
          formType: formType,
        },
      });

      let autoSaveData;
      if (existingAutoSave) {
        autoSaveData = await prisma.autoSave.update({
          where: { id: existingAutoSave.id },
          data: {
            formData: JSON.stringify(formData),
            timestamp: new Date(timestamp),
          },
        });
      } else {
        autoSaveData = await prisma.autoSave.create({
          data: {
            caseId,
            formType,
            formData: JSON.stringify(formData),
            timestamp: new Date(timestamp),
          },
        });
      }

      const response: MobileAutoSaveResponse = {
        success: true,
        message: 'Form auto-saved successfully',
        data: {
          savedAt: autoSaveData.timestamp.toISOString(),
          version: 1, // Default version since we removed the field
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Auto-save form error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'AUTO_SAVE_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get auto-saved form data
  static async getAutoSavedForm(req: Request, res: Response) {
    try {
      const { caseId, formType } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const where: any = { id: caseId };
      
      // Role-based access control
      if (userRole === 'FIELD') {
        where.assignedToId = userId;
      }

      const existingCase = await prisma.case.findFirst({ where });

      if (!existingCase) {
        return res.status(404).json({
          success: false,
          message: 'Case not found or access denied',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const autoSaveData = await prisma.autoSave.findFirst({
        where: {
          caseId: caseId,
          formType: formType.toUpperCase(),
        },
      });

      if (!autoSaveData) {
        return res.status(404).json({
          success: false,
          message: 'No auto-saved data found',
          error: {
            code: 'AUTO_SAVE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.json({
        success: true,
        message: 'Auto-saved form data retrieved successfully',
        data: {
          formData: JSON.parse(autoSaveData.formData),
          savedAt: autoSaveData.timestamp.toISOString(),
          version: 1, // Default version since we removed the field
        },
      });
    } catch (error) {
      console.error('Get auto-saved form error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'AUTO_SAVE_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
