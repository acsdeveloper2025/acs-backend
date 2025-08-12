import { query } from '@/config/database';

export interface AuditLogData {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await query(
      `INSERT INTO audit_logs (id, action, "entityType", "entityId", "userId", details, "ipAddress", "userAgent", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [
        data.action,
        data.entityType,
        data.entityId,
        data.userId || null,
        data.details ? JSON.stringify(data.details) : null,
        data.ipAddress || null,
        data.userAgent || null,
      ]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
};
