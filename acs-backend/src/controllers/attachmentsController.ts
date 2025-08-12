import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Mock data for demonstration (replace with actual database operations)
let attachments: any[] = [
  {
    id: 'attachment_1',
    filename: 'residence_photo_1.jpg',
    originalName: 'front_view.jpg',
    mimeType: 'image/jpeg',
    size: 1024000,
    caseId: 'case_3',
    uploadedBy: 'user_1',
    uploadedAt: '2024-01-05T00:00:00.000Z',
    filePath: '/uploads/attachments/attachment_1.jpg',
    description: 'Front view of residence',
    category: 'PHOTO',
    isPublic: false,
  },
  {
    id: 'attachment_2',
    filename: 'verification_report.pdf',
    originalName: 'verification_report.pdf',
    mimeType: 'application/pdf',
    size: 512000,
    caseId: 'case_3',
    uploadedBy: 'user_1',
    uploadedAt: '2024-01-05T00:30:00.000Z',
    filePath: '/uploads/attachments/attachment_2.pdf',
    description: 'Verification report document',
    category: 'DOCUMENT',
    isPublic: false,
  },
];

// Supported file types
const SUPPORTED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  spreadsheets: ['.xls', '.xlsx', '.csv'],
  archives: ['.zip', '.rar', '.7z'],
};

const ALL_SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_FILE_TYPES.images,
  ...SUPPORTED_FILE_TYPES.documents,
  ...SUPPORTED_FILE_TYPES.spreadsheets,
  ...SUPPORTED_FILE_TYPES.archives,
];

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'attachments');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `attachment_${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (ALL_SUPPORTED_EXTENSIONS.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${extension} is not supported`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files per upload
  }
});

// POST /api/attachments/upload - Upload attachment
export const uploadAttachment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Use multer middleware
    upload.array('files', 10)(req, res, async (err) => {
      if (err) {
        logger.error('File upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
          error: { code: 'UPLOAD_ERROR' },
        });
      }

      const files = req.files as Express.Multer.File[];
      const { caseId, description, category = 'DOCUMENT', isPublic = false } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
          error: { code: 'NO_FILES' },
        });
      }

      if (!caseId) {
        return res.status(400).json({
          success: false,
          message: 'Case ID is required',
          error: { code: 'MISSING_CASE_ID' },
        });
      }

      const uploadedAttachments = [];

      for (const file of files) {
        const newAttachment = {
          id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          caseId,
          uploadedBy: req.user?.id,
          uploadedAt: new Date().toISOString(),
          filePath: `/uploads/attachments/${file.filename}`,
          description: description || `Uploaded file: ${file.originalname}`,
          category,
          isPublic: isPublic === 'true' || isPublic === true,
        };

        attachments.push(newAttachment);
        uploadedAttachments.push(newAttachment);
      }

      logger.info(`Uploaded ${uploadedAttachments.length} attachments`, {
        userId: req.user?.id,
        caseId,
        fileCount: uploadedAttachments.length,
        totalSize: uploadedAttachments.reduce((sum, att) => sum + att.size, 0)
      });

      res.status(201).json({
        success: true,
        data: uploadedAttachments,
        message: `${uploadedAttachments.length} file(s) uploaded successfully`,
      });
    });
  } catch (error) {
    logger.error('Error uploading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload attachment',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/attachments/case/:caseId - Get attachments by case
export const getAttachmentsByCase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { caseId } = req.params;
    const { category, limit = 50 } = req.query;

    let caseAttachments = attachments.filter(att => att.caseId === caseId);

    // Apply category filter
    if (category) {
      caseAttachments = caseAttachments.filter(att => att.category === category);
    }

    // Apply limit
    caseAttachments = caseAttachments.slice(0, Number(limit));

    // Sort by upload date (newest first)
    caseAttachments.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    logger.info(`Retrieved ${caseAttachments.length} attachments for case ${caseId}`, {
      userId: req.user?.id,
      caseId,
      category
    });

    res.json({
      success: true,
      data: caseAttachments,
    });
  } catch (error) {
    logger.error('Error getting attachments by case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attachments',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/attachments/:id - Get attachment by ID
export const getAttachmentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const attachment = attachments.find(att => att.id === id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved attachment ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    logger.error('Error getting attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attachment',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/attachments/:id - Delete attachment
export const deleteAttachment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const attachmentIndex = attachments.findIndex(att => att.id === id);
    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const attachment = attachments[attachmentIndex];

    // Check if user has permission to delete (owner or admin)
    if (attachment.uploadedBy !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this attachment',
        error: { code: 'FORBIDDEN' },
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', 'attachments', attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from array
    attachments.splice(attachmentIndex, 1);

    logger.info(`Deleted attachment: ${id}`, {
      userId: req.user?.id,
      filename: attachment.filename,
      caseId: attachment.caseId
    });

    res.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/attachments/:id - Update attachment metadata
export const updateAttachment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { description, category, isPublic } = req.body;

    const attachmentIndex = attachments.findIndex(att => att.id === id);
    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const attachment = attachments[attachmentIndex];

    // Check if user has permission to update (owner or admin)
    if (attachment.uploadedBy !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this attachment',
        error: { code: 'FORBIDDEN' },
      });
    }

    // Update metadata
    if (description !== undefined) attachment.description = description;
    if (category !== undefined) attachment.category = category;
    if (isPublic !== undefined) attachment.isPublic = isPublic;

    logger.info(`Updated attachment metadata: ${id}`, {
      userId: req.user?.id,
      changes: { description, category, isPublic }
    });

    res.json({
      success: true,
      data: attachment,
      message: 'Attachment updated successfully',
    });
  } catch (error) {
    logger.error('Error updating attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attachment',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/attachments/:id/download - Download attachment
export const downloadAttachment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const attachment = attachments.find(att => att.id === id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), 'uploads', 'attachments', attachment.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server',
        error: { code: 'FILE_NOT_FOUND' },
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', attachment.size.toString());

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    logger.info(`Downloaded attachment: ${id}`, {
      userId: req.user?.id,
      filename: attachment.originalName,
      size: attachment.size
    });
  } catch (error) {
    logger.error('Error downloading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download attachment',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/attachments/types - Get supported file types
export const getSupportedFileTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const fileTypes = {
      images: {
        extensions: SUPPORTED_FILE_TYPES.images,
        description: 'Image files (JPEG, PNG, GIF, BMP, WebP)',
        maxSize: '10MB',
      },
      documents: {
        extensions: SUPPORTED_FILE_TYPES.documents,
        description: 'Document files (PDF, DOC, DOCX, TXT, RTF)',
        maxSize: '10MB',
      },
      spreadsheets: {
        extensions: SUPPORTED_FILE_TYPES.spreadsheets,
        description: 'Spreadsheet files (XLS, XLSX, CSV)',
        maxSize: '10MB',
      },
      archives: {
        extensions: SUPPORTED_FILE_TYPES.archives,
        description: 'Archive files (ZIP, RAR, 7Z)',
        maxSize: '10MB',
      },
    };

    res.json({
      success: true,
      data: {
        supportedTypes: fileTypes,
        maxFileSize: '10MB',
        maxFilesPerUpload: 10,
        allSupportedExtensions: ALL_SUPPORTED_EXTENSIONS,
      },
    });
  } catch (error) {
    logger.error('Error getting supported file types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported file types',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/attachments/bulk-upload - Bulk upload attachments
export const bulkUploadAttachments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Use multer middleware for multiple files
    upload.array('files', 50)(req, res, async (err) => {
      if (err) {
        logger.error('Bulk upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Bulk upload failed',
          error: { code: 'UPLOAD_ERROR' },
        });
      }

      const files = req.files as Express.Multer.File[];
      const { caseIds, descriptions, categories, isPublic = false } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
          error: { code: 'NO_FILES' },
        });
      }

      // Parse arrays if they're strings
      const caseIdArray = Array.isArray(caseIds) ? caseIds : [caseIds];
      const descriptionArray = Array.isArray(descriptions) ? descriptions : [descriptions];
      const categoryArray = Array.isArray(categories) ? categories : [categories];

      const uploadedAttachments = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          const caseId = caseIdArray[i] || caseIdArray[0];
          const description = descriptionArray[i] || descriptionArray[0] || `Uploaded file: ${file.originalname}`;
          const category = categoryArray[i] || categoryArray[0] || 'DOCUMENT';

          if (!caseId) {
            errors.push(`File ${file.originalname}: Case ID is required`);
            continue;
          }

          const newAttachment = {
            id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            caseId,
            uploadedBy: req.user?.id,
            uploadedAt: new Date().toISOString(),
            filePath: `/uploads/attachments/${file.filename}`,
            description,
            category,
            isPublic: isPublic === 'true' || isPublic === true,
          };

          attachments.push(newAttachment);
          uploadedAttachments.push(newAttachment);
        } catch (error) {
          errors.push(`File ${files[i].originalname}: ${error}`);
        }
      }

      logger.info(`Bulk uploaded ${uploadedAttachments.length} attachments`, {
        userId: req.user?.id,
        successCount: uploadedAttachments.length,
        errorCount: errors.length,
        totalSize: uploadedAttachments.reduce((sum, att) => sum + att.size, 0)
      });

      res.status(201).json({
        success: true,
        data: {
          uploaded: uploadedAttachments,
          errors,
          summary: {
            total: files.length,
            successful: uploadedAttachments.length,
            failed: errors.length,
          }
        },
        message: `Bulk upload completed: ${uploadedAttachments.length} successful, ${errors.length} failed`,
      });
    });
  } catch (error) {
    logger.error('Error in bulk upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk upload attachments',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/attachments/bulk-delete - Bulk delete attachments
export const bulkDeleteAttachments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attachmentIds } = req.body;

    if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attachment IDs array is required',
        error: { code: 'MISSING_ATTACHMENT_IDS' },
      });
    }

    const deletedAttachments = [];
    const errors = [];

    for (const id of attachmentIds) {
      try {
        const attachmentIndex = attachments.findIndex(att => att.id === id);
        if (attachmentIndex === -1) {
          errors.push(`Attachment ${id}: Not found`);
          continue;
        }

        const attachment = attachments[attachmentIndex];

        // Check permissions
        if (attachment.uploadedBy !== req.user?.id && req.user?.role !== 'ADMIN') {
          errors.push(`Attachment ${id}: Permission denied`);
          continue;
        }

        // Delete file from filesystem
        const filePath = path.join(process.cwd(), 'uploads', 'attachments', attachment.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        // Remove from array
        attachments.splice(attachmentIndex, 1);
        deletedAttachments.push(id);
      } catch (error) {
        errors.push(`Attachment ${id}: ${error}`);
      }
    }

    logger.info(`Bulk deleted ${deletedAttachments.length} attachments`, {
      userId: req.user?.id,
      successCount: deletedAttachments.length,
      errorCount: errors.length
    });

    res.json({
      success: true,
      data: {
        deleted: deletedAttachments,
        errors,
        summary: {
          total: attachmentIds.length,
          successful: deletedAttachments.length,
          failed: errors.length,
        }
      },
      message: `Bulk delete completed: ${deletedAttachments.length} successful, ${errors.length} failed`,
    });
  } catch (error) {
    logger.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete attachments',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
