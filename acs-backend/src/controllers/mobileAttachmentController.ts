import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { MobileFileUploadRequest, MobileAttachmentResponse } from '../types/mobile';
import { createAuditLog } from '../utils/auditLogger';
import { config } from '../config';

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'mobile');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    ...config.mobile.allowedImageTypes,
    ...config.mobile.allowedDocumentTypes,
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

export const mobileUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.mobile.maxFileSize,
    files: config.mobile.maxFilesPerCase,
  },
});

export class MobileAttachmentController {
  // Upload files for mobile app
  static async uploadFiles(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const files = req.files as Express.Multer.File[];
      const geoLocation = req.body.geoLocation ? JSON.parse(req.body.geoLocation) : null;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided',
          error: {
            code: 'NO_FILES_PROVIDED',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify case access
      const where: any = { id: caseId };
      if (userRole === 'FIELD') {
        where.assignedToId = userId;
      }

      const existingCase = await prisma.case.findFirst({ where });

      if (!existingCase) {
        // Clean up uploaded files
        await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
        
        return res.status(404).json({
          success: false,
          message: 'Case not found or access denied',
          error: {
            code: 'CASE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check file count limit
      const existingAttachmentCount = await prisma.attachment.count({
        where: { caseId },
      });

      if (existingAttachmentCount + files.length > config.mobile.maxFilesPerCase) {
        // Clean up uploaded files
        await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
        
        return res.status(400).json({
          success: false,
          message: `Maximum ${config.mobile.maxFilesPerCase} files allowed per case`,
          error: {
            code: 'FILE_LIMIT_EXCEEDED',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const uploadedAttachments: MobileAttachmentResponse[] = [];

      // Process each file
      for (const file of files) {
        try {
          let thumbnailUrl: string | null = null;

          // Generate thumbnail for images
          if (file.mimetype.startsWith('image/')) {
            const thumbnailPath = path.join(
              path.dirname(file.path),
              'thumbnails',
              `thumb_${path.basename(file.path)}`
            );
            
            await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });
            
            await sharp(file.path)
              .resize(config.mobile.thumbnailSize, config.mobile.thumbnailSize, {
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality: 80 })
              .toFile(thumbnailPath);
            
            thumbnailUrl = `/uploads/mobile/thumbnails/thumb_${path.basename(file.path)}`;
          }

          // Save attachment to database
          const attachment = await prisma.attachment.create({
            data: {
              name: file.originalname, // Required field
              filename: file.filename,
              originalName: file.originalname,
              type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'PDF',
              mimeType: file.mimetype,
              size: file.size,
              url: `/uploads/mobile/${file.filename}`,
              thumbnailUrl,
              caseId: caseId,
              uploadedById: userId,
              geoLocation: geoLocation ? JSON.stringify(geoLocation) : null,
            },
          });

          uploadedAttachments.push({
            id: attachment.id,
            filename: attachment.filename,
            originalName: attachment.originalName,
            mimeType: attachment.mimeType,
            size: attachment.size,
            url: attachment.url,
            thumbnailUrl: attachment.thumbnailUrl,
            uploadedAt: attachment.uploadedAt.toISOString(),
            geoLocation,
          });

          await createAuditLog({
            action: 'MOBILE_FILE_UPLOADED',
            entityType: 'ATTACHMENT',
            entityId: attachment.id,
            userId,
            details: {
              caseId,
              filename: file.originalname,
              size: file.size,
              mimeType: file.mimetype,
              hasGeoLocation: !!geoLocation,
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          });
        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          // Clean up the file
          await fs.unlink(file.path).catch(() => {});
        }
      }

      res.json({
        success: true,
        message: `${uploadedAttachments.length} file(s) uploaded successfully`,
        data: uploadedAttachments,
      });
    } catch (error) {
      console.error('Mobile file upload error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
      }

      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: {
          code: 'FILE_UPLOAD_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get attachments for a case
  static async getCaseAttachments(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      // Verify case access
      const where: any = { id: caseId };
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

      const attachments = await prisma.attachment.findMany({
        where: { caseId },
        orderBy: { uploadedAt: 'desc' },
      });

      const mobileAttachments: MobileAttachmentResponse[] = attachments.map(att => ({
        id: att.id,
        filename: att.filename,
        originalName: att.originalName,
        mimeType: att.mimeType,
        size: att.size,
        url: att.url,
        thumbnailUrl: att.thumbnailUrl,
        uploadedAt: att.uploadedAt.toISOString(),
        geoLocation: att.geoLocation ? JSON.parse(att.geoLocation as string) : undefined,
      }));

      res.json({
        success: true,
        message: 'Attachments retrieved successfully',
        data: mobileAttachments,
      });
    } catch (error) {
      console.error('Get case attachments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'ATTACHMENTS_FETCH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get attachment content
  static async getAttachmentContent(req: Request, res: Response) {
    try {
      const { attachmentId } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          case: {
            select: {
              id: true,
              assignedToId: true,
            },
          },
        },
      });

      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found',
          error: {
            code: 'ATTACHMENT_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check access permissions
      if (userRole === 'FIELD' && attachment.case.assignedToId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: {
            code: 'ACCESS_DENIED',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const filePath = path.join(process.cwd(), 'uploads', 'mobile', attachment.filename);

      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({
          success: false,
          message: 'File not found on disk',
          error: {
            code: 'FILE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
      res.setHeader('Content-Length', attachment.size.toString());

      // Stream the file
      const fileStream = require('fs').createReadStream(filePath);
      fileStream.pipe(res);

      await createAuditLog({
        action: 'MOBILE_ATTACHMENT_ACCESSED',
        entityType: 'ATTACHMENT',
        entityId: attachmentId,
        userId,
        details: {
          caseId: attachment.caseId,
          filename: attachment.originalName,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    } catch (error) {
      console.error('Get attachment content error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'ATTACHMENT_ACCESS_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Delete attachment
  static async deleteAttachment(req: Request, res: Response) {
    try {
      const { attachmentId } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: {
          case: {
            select: {
              id: true,
              assignedToId: true,
              status: true,
            },
          },
        },
      });

      if (!attachment) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found',
          error: {
            code: 'ATTACHMENT_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check access permissions
      if (userRole === 'FIELD' && attachment.case.assignedToId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: {
            code: 'ACCESS_DENIED',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Prevent deletion if case is completed
      if (attachment.case.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete attachments from completed cases',
          error: {
            code: 'CASE_COMPLETED',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Delete from database
      await prisma.attachment.delete({
        where: { id: attachmentId },
      });

      // Delete files from disk
      const filePath = path.join(process.cwd(), 'uploads', 'mobile', attachment.filename);
      await fs.unlink(filePath).catch(() => {});

      if (attachment.thumbnailUrl) {
        const thumbnailPath = path.join(
          process.cwd(),
          'uploads',
          'mobile',
          'thumbnails',
          `thumb_${attachment.filename}`
        );
        await fs.unlink(thumbnailPath).catch(() => {});
      }

      await createAuditLog({
        action: 'MOBILE_ATTACHMENT_DELETED',
        entityType: 'ATTACHMENT',
        entityId: attachmentId,
        userId,
        details: {
          caseId: attachment.caseId,
          filename: attachment.originalName,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Attachment deleted successfully',
      });
    } catch (error) {
      console.error('Delete attachment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'ATTACHMENT_DELETE_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
