import { Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/config/database';

// Mock data for states (in production, this would come from database)
const states = [
  // Indian States
  { id: 'state_1', name: 'Maharashtra', country: 'India', code: 'MH', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_2', name: 'Delhi', country: 'India', code: 'DL', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_3', name: 'Karnataka', country: 'India', code: 'KA', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_4', name: 'Tamil Nadu', country: 'India', code: 'TN', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_5', name: 'Gujarat', country: 'India', code: 'GJ', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_6', name: 'Rajasthan', country: 'India', code: 'RJ', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_7', name: 'West Bengal', country: 'India', code: 'WB', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_8', name: 'Uttar Pradesh', country: 'India', code: 'UP', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_9', name: 'Punjab', country: 'India', code: 'PB', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_10', name: 'Haryana', country: 'India', code: 'HR', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  
  // US States (sample)
  { id: 'state_us_1', name: 'California', country: 'United States', code: 'CA', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_us_2', name: 'New York', country: 'United States', code: 'NY', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_us_3', name: 'Texas', country: 'United States', code: 'TX', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'state_us_4', name: 'Florida', country: 'United States', code: 'FL', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// GET /api/states - List states with pagination and filters
export const getStates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      country,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build SQL query with joins to get country names and city counts
    let sql = `
      SELECT
        s.id,
        s.name,
        s.code,
        co.name as country,
        s.created_at as "createdAt",
        s.updated_at as "updatedAt",
        COALESCE(c.city_count, 0) as city_count
      FROM states s
      JOIN countries co ON s.country_id = co.id
      LEFT JOIN (
        SELECT state_id, COUNT(*) as city_count
        FROM cities
        GROUP BY state_id
      ) c ON s.id = c.state_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Apply filters
    if (country) {
      paramCount++;
      sql += ` AND co.name = $${paramCount}`;
      params.push(country);
    }

    if (search) {
      paramCount++;
      sql += ` AND (s.name ILIKE $${paramCount} OR s.code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Apply sorting
    const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const sortField = sortBy as string;

    if (sortField === 'country') {
      sql += ` ORDER BY co.name ${sortDirection}`;
    } else {
      sql += ` ORDER BY s.${sortField} ${sortDirection}`;
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
      SELECT COUNT(*)
      FROM states s
      JOIN countries co ON s.country_id = co.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 0;

    if (country) {
      countParamCount++;
      countSql += ` AND co.name = $${countParamCount}`;
      countParams.push(country);
    }

    if (search) {
      countParamCount++;
      countSql += ` AND (s.name ILIKE $${countParamCount} OR s.code ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query<{ count: string }>(countSql, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limitNum);

    logger.info(`Retrieved ${result.rows.length} states`, {
      userId: req.user?.id,
      filters: { country, search },
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
    logger.error('Error retrieving states:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve states',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/states/:id - Get state by ID
export const getStateById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const state = states.find(s => s.id === id);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved state: ${state.name}`, { 
      userId: req.user?.id,
      stateId: id
    });

    res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    logger.error('Error retrieving state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve state',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/states - Create new state
export const createState = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, country } = req.body;

    // Check if state code already exists
    const existingState = states.find(s => s.code === code && s.country === country);
    if (existingState) {
      return res.status(400).json({
        success: false,
        message: 'State code already exists in this country',
        error: { code: 'DUPLICATE_CODE' },
      });
    }

    // Create new state
    const newState = {
      id: `state_${Date.now()}`,
      name,
      code: code.toUpperCase(),
      country,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    states.push(newState);

    logger.info(`Created new state: ${newState.name}`, { 
      userId: req.user?.id,
      stateId: newState.id,
      stateData: newState
    });

    res.status(201).json({
      success: true,
      data: newState,
      message: 'State created successfully',
    });
  } catch (error) {
    logger.error('Error creating state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create state',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/states/:id - Update state
export const updateState = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const stateIndex = states.findIndex(s => s.id === id);
    if (stateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'State not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate code if being updated
    if (updateData.code) {
      const existingState = states.find(s => 
        s.id !== id && 
        s.code === updateData.code.toUpperCase() && 
        s.country === (updateData.country || states[stateIndex].country)
      );
      if (existingState) {
        return res.status(400).json({
          success: false,
          message: 'State code already exists in this country',
          error: { code: 'DUPLICATE_CODE' },
        });
      }
    }

    // Update state
    const updatedState = {
      ...states[stateIndex],
      ...updateData,
      code: updateData.code ? updateData.code.toUpperCase() : states[stateIndex].code,
      updatedAt: new Date().toISOString(),
    };

    states[stateIndex] = updatedState;

    logger.info(`Updated state: ${updatedState.name}`, { 
      userId: req.user?.id,
      stateId: id,
      updateData
    });

    res.json({
      success: true,
      data: updatedState,
      message: 'State updated successfully',
    });
  } catch (error) {
    logger.error('Error updating state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update state',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/states/:id - Delete state
export const deleteState = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const stateIndex = states.findIndex(s => s.id === id);
    if (stateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'State not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const deletedState = states[stateIndex];
    states.splice(stateIndex, 1);

    logger.info(`Deleted state: ${deletedState.name}`, { 
      userId: req.user?.id,
      stateId: id
    });

    res.json({
      success: true,
      message: 'State deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete state',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/states/stats - Get states statistics
export const getStatesStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalStates = states.length;
    const statesByCountry = states.reduce((acc, state) => {
      acc[state.country] = (acc[state.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalStates,
      statesByCountry,
      countries: Object.keys(statesByCountry).length,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting states stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get states statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/states/bulk-import - Bulk import states
export const bulkImportStates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would handle file upload and parsing in a real implementation
    res.status(501).json({
      success: false,
      message: 'Bulk import not implemented yet',
      error: { code: 'NOT_IMPLEMENTED' },
    });
  } catch (error) {
    logger.error('Error bulk importing states:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import states',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
