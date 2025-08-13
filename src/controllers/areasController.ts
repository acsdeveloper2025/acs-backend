import { Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/config/database';

// GET /api/areas - List areas with pagination and filters
export const getAreas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      cityId, 
      state, 
      country, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    // Build SQL query with joins to get area data and usage count
    let sql = `
      SELECT 
        pa.id,
        pa.area_name as name,
        pa.display_order as "displayOrder",
        pa.created_at as "createdAt",
        pa.updated_at as "updatedAt",
        p.id as "pincodeId",
        p.code as "pincodeCode",
        c.id as "cityId",
        c.name as "cityName",
        s.name as state,
        co.name as country,
        COUNT(pa2.id) OVER (PARTITION BY pa.area_name) as usage_count
      FROM pincode_areas pa
      JOIN pincodes p ON pa.pincode_id = p.id
      JOIN cities c ON p.city_id = c.id
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON c.country_id = co.id
      LEFT JOIN pincode_areas pa2 ON pa.area_name = pa2.area_name
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Apply filters
    if (cityId) {
      paramCount++;
      sql += ` AND c.id = $${paramCount}`;
      params.push(cityId);
    }

    if (state) {
      paramCount++;
      sql += ` AND s.name ILIKE $${paramCount}`;
      params.push(`%${state}%`);
    }

    if (country) {
      paramCount++;
      sql += ` AND co.name = $${paramCount}`;
      params.push(country);
    }

    if (search) {
      paramCount++;
      sql += ` AND pa.area_name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
    }

    // Apply sorting
    const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const sortField = sortBy as string;
    
    if (sortField === 'cityName') {
      sql += ` ORDER BY c.name ${sortDirection}`;
    } else if (sortField === 'state') {
      sql += ` ORDER BY s.name ${sortDirection}`;
    } else if (sortField === 'country') {
      sql += ` ORDER BY co.name ${sortDirection}`;
    } else if (sortField === 'pincodeCode') {
      sql += ` ORDER BY p.code ${sortDirection}`;
    } else if (sortField === 'usageCount') {
      sql += ` ORDER BY usage_count ${sortDirection}`;
    } else if (sortField === 'name') {
      sql += ` ORDER BY pa.area_name ${sortDirection}`;
    } else {
      sql += ` ORDER BY pa.area_name ${sortDirection}`;
    }

    // Apply pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limitNum);

    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);

    // Execute query
    const result = await query(sql, params);

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(DISTINCT pa.id)
      FROM pincode_areas pa
      JOIN pincodes p ON pa.pincode_id = p.id
      JOIN cities c ON p.city_id = c.id
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON c.country_id = co.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 0;

    if (cityId) {
      countParamCount++;
      countSql += ` AND c.id = $${countParamCount}`;
      countParams.push(cityId);
    }

    if (state) {
      countParamCount++;
      countSql += ` AND s.name ILIKE $${countParamCount}`;
      countParams.push(`%${state}%`);
    }

    if (country) {
      countParamCount++;
      countSql += ` AND co.name = $${countParamCount}`;
      countParams.push(country);
    }

    if (search) {
      countParamCount++;
      countSql += ` AND pa.area_name ILIKE $${countParamCount}`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query<{ count: string }>(countSql, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limitNum);

    logger.info(`Retrieved ${result.rows.length} areas`, { 
      userId: req.user?.id,
      filters: { cityId, state, country, search },
      pagination: { page: pageNum, limit: limitNum }
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error('Error retrieving areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve areas',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/standalone-areas - Get standalone areas for multi-select
export const getStandaloneAreas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name FROM areas ORDER BY name ASC'
    );

    logger.info(`Retrieved ${result.rows.length} standalone areas`, {
      userId: req.user?.id,
      count: result.rows.length
    });

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error retrieving standalone areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve standalone areas',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/areas/:id - Get area by ID
export const getAreaById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Query area with associated pincode information
    const sql = `
      SELECT 
        pa.id,
        pa.area_name as name,
        pa.display_order as "displayOrder",
        pa.created_at as "createdAt",
        pa.updated_at as "updatedAt",
        p.id as "pincodeId",
        p.code as "pincodeCode",
        c.id as "cityId",
        c.name as "cityName",
        s.name as state,
        co.name as country
      FROM pincode_areas pa
      JOIN pincodes p ON pa.pincode_id = p.id
      JOIN cities c ON p.city_id = c.id
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON c.country_id = co.id
      WHERE pa.id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Area not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved area ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error retrieving area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve area',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/areas - Create standalone area
export const createArea = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid area name is required (minimum 2 characters)',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Check if area name already exists (case-insensitive)
    const existingAreaCheck = await query(
      'SELECT id FROM areas WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [name.trim()]
    );

    if (existingAreaCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Area with this name already exists',
        error: { code: 'DUPLICATE_AREA' },
      });
    }

    // Create a standalone area entry
    const result = await query(
      `INSERT INTO areas (name, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       RETURNING id, name, created_at as "createdAt", updated_at as "updatedAt"`,
      [name.trim()]
    );

    const newArea = result.rows[0];

    logger.info(`Created standalone area: ${name}`, {
      userId: req.user?.id,
      areaId: newArea.id,
      areaName: name.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Area created successfully',
      data: newArea,
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Area with this name already exists',
        error: { code: 'DUPLICATE_AREA' },
      });
    }

    logger.error('Error creating area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create area',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/areas/:id - Update area
export const updateArea = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, displayOrder } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid area name is required (minimum 2 characters)',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Check if area exists
    const areaCheck = await query('SELECT id, pincode_id FROM pincode_areas WHERE id = $1', [id]);
    
    if (areaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Area not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate area name within the same pincode
    const duplicateCheck = await query(
      'SELECT id FROM pincode_areas WHERE area_name = $1 AND pincode_id = $2 AND id != $3',
      [name.trim(), areaCheck.rows[0].pincode_id, id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Area name already exists for this pincode',
        error: { code: 'DUPLICATE_AREA' },
      });
    }

    // Update the area
    const updateFields = ['area_name = $3'];
    const params = [id, areaCheck.rows[0].pincode_id, name.trim()];
    let paramCount = 3;

    if (displayOrder !== undefined) {
      paramCount++;
      updateFields.push(`display_order = $${paramCount}`);
      params.push(displayOrder);
    }

    const result = await query(
      `UPDATE pincode_areas 
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND pincode_id = $2
       RETURNING id, area_name as name, display_order as "displayOrder", updated_at as "updatedAt"`,
      params
    );

    logger.info(`Updated area ${id}`, { 
      userId: req.user?.id,
      areaId: id,
      newName: name
    });

    res.json({
      success: true,
      message: 'Area updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update area',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/areas/:id - Delete area
export const deleteArea = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if area exists and get pincode info
    const areaCheck = await query(
      'SELECT id, area_name, pincode_id FROM pincode_areas WHERE id = $1',
      [id]
    );
    
    if (areaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Area not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check if this is the last area for the pincode
    const areaCountResult = await query(
      'SELECT COUNT(*) as count FROM pincode_areas WHERE pincode_id = $1',
      [areaCheck.rows[0].pincode_id]
    );
    const areaCount = parseInt(areaCountResult.rows[0].count, 10);
    
    if (areaCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last area. Pincode must have at least one area.',
        error: { code: 'LAST_AREA_DELETION' },
      });
    }

    const areaName = areaCheck.rows[0].area_name;

    // Delete the area
    await query('DELETE FROM pincode_areas WHERE id = $1', [id]);

    logger.info(`Deleted area ${id} (${areaName})`, { 
      userId: req.user?.id,
      areaId: id,
      areaName
    });

    res.json({
      success: true,
      message: 'Area deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete area',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
