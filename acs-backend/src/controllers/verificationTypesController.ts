import { Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/config/database';

// GET /api/verification-types - List verification types with pagination and filters
export const getVerificationTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    // Build where clause
    const whereClause: any = {};

    // Get total count
    const countRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM verification_types`);
    const totalCount = Number(countRes.rows[0]?.count || 0);

    // Get verification types with pagination
    const vtRes = await query(`SELECT * FROM verification_types ORDER BY ${sortBy} ${sortOrder} LIMIT $1 OFFSET $2`, [Number(limit), (Number(page) - 1) * Number(limit)]);
    const verificationTypes = vtRes.rows;

    logger.info(`Retrieved ${verificationTypes.length} verification types from database`, {
      userId: req.user?.id,
      page: Number(page),
      limit: Number(limit),
      search: search || '',
      total: totalCount
    });

    res.json({
      success: true,
      data: verificationTypes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error retrieving verification types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification types',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/verification-types/:id - Get verification type by ID
export const getVerificationTypeById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const vtRes2 = await query(`SELECT * FROM verification_types WHERE id = $1`, [id]);
    const verificationType = vtRes2.rows[0];
    if (!verificationType) {
      return res.status(404).json({
        success: false,
        message: 'Verification type not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved verification type ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: verificationType,
    });
  } catch (error) {
    logger.error('Error retrieving verification type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification type',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/verification-types - Create new verification type
export const createVerificationType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      code
    } = req.body;

    // Check if verification type code already exists
    const exRes = await query(`SELECT id FROM verification_types WHERE code = $1`, [code]);
    const existingVerificationType = exRes.rows[0];

    if (existingVerificationType) {
      return res.status(400).json({
        success: false,
        message: 'Verification type code already exists',
        error: { code: 'DUPLICATE_CODE' },
      });
    }

    // Create verification type in database
    const newRes = await query(
      `INSERT INTO verification_types (id, name, code, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [name, code]
    );
    const newVerificationType = newRes.rows[0];

    logger.info(`Created new verification type: ${newVerificationType.id}`, {
      userId: req.user?.id,
      verificationTypeName: name,
      verificationTypeCode: code
    });

    res.status(201).json({
      success: true,
      data: newVerificationType,
      message: 'Verification type created successfully',
    });
  } catch (error) {
    logger.error('Error creating verification type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create verification type',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/verification-types/:id - Update verification type
export const updateVerificationType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if verification type exists
    const exRes2 = await query(`SELECT * FROM verification_types WHERE id = $1`, [id]);
    const existingVerificationType = exRes2.rows[0];

    if (!existingVerificationType) {
      return res.status(404).json({
        success: false,
        message: 'Verification type not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate code if being updated
    if (updateData.code && updateData.code !== existingVerificationType.code) {
      const dupRes = await query(`SELECT id FROM verification_types WHERE code = $1`, [updateData.code]);
      const duplicateVerificationType = dupRes.rows[0];

      if (duplicateVerificationType) {
        return res.status(400).json({
          success: false,
          message: 'Verification type code already exists',
          error: { code: 'DUPLICATE_CODE' },
        });
      }
    }

    // Prepare update data
    const updatePayload: any = {};

    if (updateData.name) updatePayload.name = updateData.name;
    if (updateData.code) updatePayload.code = updateData.code;

    // Update verification type
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [key, value] of Object.entries(updatePayload)) {
      sets.push(`"${key}" = $${idx++}`);
      vals.push(value);
    }
    sets.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    vals.push(id);
    const updRes = await query(`UPDATE verification_types SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    const updatedVerificationType = updRes.rows[0];

    logger.info(`Updated verification type: ${id}`, {
      userId: req.user?.id,
      verificationTypeId: id,
      updates: Object.keys(updatePayload)
    });

    res.json({
      success: true,
      data: updatedVerificationType,
      message: 'Verification type updated successfully',
    });
  } catch (error) {
    logger.error('Error updating verification type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update verification type',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/verification-types/:id - Delete verification type
export const deleteVerificationType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if verification type exists
    const exRes3 = await query(`SELECT * FROM verification_types WHERE id = $1`, [id]);
    const existingVerificationType = exRes3.rows[0];

    if (!existingVerificationType) {
      return res.status(404).json({
        success: false,
        message: 'Verification type not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Delete verification type
    await query(`DELETE FROM verification_types WHERE id = $1`, [id]);

    logger.info(`Deleted verification type: ${id}`, {
      userId: req.user?.id,
      verificationTypeId: id,
      verificationTypeName: existingVerificationType.name
    });

    res.json({
      success: true,
      message: 'Verification type deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting verification type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete verification type',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
