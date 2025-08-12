import { Request, Response } from 'express';
import {
  MobileSyncUploadRequest,
  MobileSyncDownloadResponse,
  MobileCaseResponse
} from '../types/mobile';
import { createAuditLog } from '../utils/auditLogger';
import { config } from '../config';
import { query } from '@/config/database';

export class MobileSyncController {
  // Upload offline changes from mobile app
  static async uploadSync(req: Request, res: Response) {
    try {
      const { localChanges, deviceInfo, lastSyncTimestamp }: MobileSyncUploadRequest = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (!localChanges) {
        return res.status(400).json({
          success: false,
          message: 'Local changes are required',
          error: {
            code: 'MISSING_LOCAL_CHANGES',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const syncResults = {
        processedCases: 0,
        processedAttachments: 0,
        processedLocations: 0,
        conflicts: [] as any[],
        errors: [] as any[],
      };

      // Process case changes
      if (localChanges.cases && localChanges.cases.length > 0) {
        for (const caseChange of localChanges.cases) {
          try {
            await this.processCaseChange(caseChange, userId, userRole, syncResults);
          } catch (error) {
            console.error(`Error processing case change ${caseChange.id}:`, error);
            syncResults.errors.push({
              type: 'CASE',
              id: caseChange.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      // Process attachment changes
      if (localChanges.attachments && localChanges.attachments.length > 0) {
        for (const attachmentChange of localChanges.attachments) {
          try {
            await this.processAttachmentChange(attachmentChange, userId, syncResults);
          } catch (error) {
            console.error(`Error processing attachment change ${attachmentChange.id}:`, error);
            syncResults.errors.push({
              type: 'ATTACHMENT',
              id: attachmentChange.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      // Process location changes
      if (localChanges.locations && localChanges.locations.length > 0) {
        for (const locationChange of localChanges.locations) {
          try {
            await this.processLocationChange(locationChange, userId, syncResults);
          } catch (error) {
            console.error(`Error processing location change ${locationChange.id}:`, error);
            syncResults.errors.push({
              type: 'LOCATION',
              id: locationChange.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      // Update device sync timestamp
      await query(`UPDATE devices SET "lastActiveAt" = CURRENT_TIMESTAMP WHERE "userId" = $1 AND "deviceId" = $2`, [userId, deviceInfo.deviceId]);

      await createAuditLog({
        action: 'MOBILE_SYNC_UPLOAD',
        entityType: 'SYNC',
        entityId: deviceInfo.deviceId,
        userId,
        details: {
          deviceId: deviceInfo.deviceId,
          lastSyncTimestamp,
          results: syncResults,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Sync upload completed',
        data: {
          syncTimestamp: new Date().toISOString(),
          results: syncResults,
        },
      });
    } catch (error) {
      console.error('Sync upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'SYNC_UPLOAD_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Download changes from server for mobile app
  static async downloadSync(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { lastSyncTimestamp, limit = config.mobile.syncBatchSize } = req.query;

      const syncTimestamp = lastSyncTimestamp 
        ? new Date(lastSyncTimestamp as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Get updated cases
      const where: any = {
        updatedAt: { gt: syncTimestamp },
      };

      // Role-based filtering
      if (userRole === 'FIELD') {
        where.assignedToId = userId;
      }

      const vals: any[] = [];
      const wh: string[] = [];
      if (where.assignedToId) { vals.push(where.assignedToId); wh.push(`c."assignedToId" = $${vals.length}`); }
      if (where.updatedAt?.gt) { vals.push(where.updatedAt.gt); wh.push(`c."updatedAt" > $${vals.length}`); }
      const whereSql = wh.length ? `WHERE ${wh.join(' AND ')}` : '';
      vals.push(Number(limit));

      const casesRes = await query(
        `SELECT c.*, cl.id as client_id, cl.name as client_name, cl.code as client_code
         FROM cases c LEFT JOIN clients cl ON cl.id = c."clientId"
         ${whereSql}
         ORDER BY c."updatedAt" ASC
         LIMIT $${vals.length}`,
        vals
      );
      const updatedCases = casesRes.rows;
      const deletedCases: any[] = [];

      // Transform cases for mobile response
      const mobileCases: MobileCaseResponse[] = updatedCases.map(caseItem => ({
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
        client: caseItem.client,
        attachments: caseItem.attachments.map(att => ({
          id: att.id,
          filename: att.filename,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          url: att.url,
          thumbnailUrl: att.thumbnailUrl,
          uploadedAt: att.uploadedAt.toISOString(),
          geoLocation: att.geoLocation as any,
        })),
        formData: caseItem.verificationData,
        syncStatus: 'SYNCED',
      }));

      const deletedCaseIds = deletedCases.map(dc => dc.caseId);
      const hasMore = updatedCases.length === Number(limit);
      const newSyncTimestamp = new Date().toISOString();

      const response: MobileSyncDownloadResponse = {
        cases: mobileCases,
        deletedCaseIds,
        conflicts: [], // Would be populated if conflicts are detected
        syncTimestamp: newSyncTimestamp,
        hasMore,
      };

      await createAuditLog({
        action: 'MOBILE_SYNC_DOWNLOAD',
        entityType: 'SYNC',
        entityId: userId,
        userId,
        details: {
          lastSyncTimestamp,
          casesCount: mobileCases.length,
          deletedCasesCount: deletedCaseIds.length,
          hasMore,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Sync download completed',
        data: response,
      });
    } catch (error) {
      console.error('Sync download error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'SYNC_DOWNLOAD_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Get sync status for device
  static async getSyncStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const deviceId = req.headers['x-device-id'] as string;

      const devRes = await query(`SELECT * FROM devices WHERE "userId" = $1 AND "deviceId" = $2 LIMIT 1`, [userId, deviceId]);
      const device = devRes.rows[0];

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found',
          error: {
            code: 'DEVICE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const syncStatus = {
        lastSyncAt: device.lastActiveAt?.toISOString(),
        lastSyncData: null, // Field doesn't exist in schema
        isOnline: true,
        pendingChanges: 0, // Would calculate based on local changes
      };

      res.json({
        success: true,
        message: 'Sync status retrieved successfully',
        data: syncStatus,
      });
    } catch (error) {
      console.error('Get sync status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'SYNC_STATUS_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Helper method to process case changes
  private static async processCaseChange(caseChange: any, userId: string, userRole: string, syncResults: any) {
    const { id, action, data, timestamp } = caseChange;

    switch (action) {
      case 'UPDATE':
        // Check if case exists and user has access
        const where: any = { id };
        if (userRole === 'FIELD') {
          where.assignedToId = userId;
        }

        const vals9: any[] = [id];
        let exSql7 = `SELECT id, "updatedAt" FROM cases WHERE id = $1`;
        if (userRole === 'FIELD') { exSql7 += ` AND "assignedToId" = $2`; vals9.push(userId); }
        const exRes7 = await query(exSql7, vals9);
        const existingCase = exRes7.rows[0];
        if (!existingCase) {
          throw new Error('Case not found or access denied');
        }

        // Check for conflicts (server version newer than local)
        if (existingCase.updatedAt > new Date(timestamp)) {
          syncResults.conflicts.push({
            caseId: id,
            localVersion: data,
            serverVersion: existingCase,
            conflictType: 'VERSION_CONFLICT',
          });
          return;
        }

        // Update case
        const sets: string[] = [];
        const vals10: any[] = [];
        let idx = 1;
        for (const [key, value] of Object.entries(data)) {
          sets.push(`"${key}" = $${idx++}`);
          vals10.push(value);
        }
        sets.push(`"updatedAt" = CURRENT_TIMESTAMP`);
        vals10.push(id);
        await query(`UPDATE cases SET ${sets.join(', ')} WHERE id = $${idx}`, vals10);

        syncResults.processedCases++;
        break;

      case 'CREATE':
        // Create new case (if allowed)
        if (userRole === 'FIELD') {
          throw new Error('Field users cannot create cases');
        }

        const cols: string[] = ['id', 'createdAt', 'updatedAt'];
        const vals11: any[] = [id, new Date(timestamp), new Date()];
        let idx2 = 4;
        for (const [key, value] of Object.entries(data)) {
          cols.push(`"${key}"`);
          vals11.push(value);
          idx2++;
        }
        const placeholders = vals11.map((_, i) => `$${i + 1}`).join(', ');
        await query(`INSERT INTO cases (${cols.join(', ')}) VALUES (${placeholders})`, vals11);

        syncResults.processedCases++;
        break;

      default:
        throw new Error(`Unsupported case action: ${action}`);
    }
  }

  // Helper method to process attachment changes
  private static async processAttachmentChange(attachmentChange: any, userId: string, syncResults: any) {
    const { id, action, data, timestamp } = attachmentChange;

    switch (action) {
      case 'CREATE':
        // Create attachment record (file should already be uploaded)
        const attCols: string[] = ['id', 'uploadedById', 'uploadedAt'];
        const attVals: any[] = [id, userId, new Date(timestamp)];
        let attIdx = 4;
        for (const [key, value] of Object.entries(data)) {
          attCols.push(`"${key}"`);
          attVals.push(value);
          attIdx++;
        }
        const attPlaceholders = attVals.map((_, i) => `$${i + 1}`).join(', ');
        await query(`INSERT INTO attachments (${attCols.join(', ')}) VALUES (${attPlaceholders})`, attVals);

        syncResults.processedAttachments++;
        break;

      case 'DELETE':
        // Delete attachment
        await query(`DELETE FROM attachments WHERE id = $1`, [id]);

        syncResults.processedAttachments++;
        break;

      default:
        throw new Error(`Unsupported attachment action: ${action}`);
    }
  }

  // Helper method to process location changes
  private static async processLocationChange(locationChange: any, userId: string, syncResults: any) {
    const { id, data, timestamp } = locationChange;

    await query(
      `INSERT INTO locations (id, "caseId", latitude, longitude, accuracy, timestamp, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, data.caseId, data.latitude, data.longitude, data.accuracy, new Date(timestamp), data.source || 'GPS']
    );

    syncResults.processedLocations++;
  }
}
