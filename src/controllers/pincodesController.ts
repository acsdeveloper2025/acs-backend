import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/config/database';

// Mock data for demonstration (replace with actual database operations)
let pincodes: any[] = [
  {
    id: 'pincode_1',
    code: '400001',
    area: 'Fort',
    cityId: 'city_1',
    cityName: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    district: 'Mumbai',
    region: 'Western',
    isActive: true,
    coordinates: {
      latitude: 18.9387,
      longitude: 72.8353,
    },
    deliveryStatus: 'DELIVERY',
    officeType: 'Head Office',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'pincode_2',
    code: '400002',
    area: 'Kalbadevi',
    cityId: 'city_1',
    cityName: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    district: 'Mumbai',
    region: 'Western',
    isActive: true,
    coordinates: {
      latitude: 18.9467,
      longitude: 72.8342,
    },
    deliveryStatus: 'DELIVERY',
    officeType: 'Sub Office',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'pincode_3',
    code: '110001',
    area: 'Connaught Place',
    cityId: 'city_2',
    cityName: 'Delhi',
    state: 'Delhi',
    country: 'India',
    district: 'Central Delhi',
    region: 'Northern',
    isActive: true,
    coordinates: {
      latitude: 28.6304,
      longitude: 77.2177,
    },
    deliveryStatus: 'DELIVERY',
    officeType: 'Head Office',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'pincode_4',
    code: '560001',
    area: 'Bangalore GPO',
    cityId: 'city_3',
    cityName: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    district: 'Bangalore Urban',
    region: 'Southern',
    isActive: true,
    coordinates: {
      latitude: 12.9716,
      longitude: 77.5946,
    },
    deliveryStatus: 'DELIVERY',
    officeType: 'Head Office',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

// GET /api/pincodes - List pincodes with pagination and filters
export const getPincodes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      cityId,
      state,
      district,
      region,
      deliveryStatus,
      isActive,
      search,
      sortBy = 'code',
      sortOrder = 'asc'
    } = req.query;

    // Build SQL query with joins to get pincode data and associated areas
    let sql = `
      SELECT
        p.id,
        p.code,
        p.city_id as "cityId",
        c.name as "cityName",
        s.name as state,
        co.name as country,
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', pa.id,
              'name', pa.area_name,
              'displayOrder', pa.display_order
            ) ORDER BY pa.display_order
          ) FILTER (WHERE pa.id IS NOT NULL),
          '[]'::json
        ) as areas
      FROM pincodes p
      JOIN cities c ON p.city_id = c.id
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON c.country_id = co.id
      LEFT JOIN pincode_areas pa ON p.id = pa.pincode_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Apply filters
    if (cityId) {
      paramCount++;
      sql += ` AND p.city_id = $${paramCount}`;
      params.push(cityId);
    }

    if (state) {
      paramCount++;
      sql += ` AND s.name ILIKE $${paramCount}`;
      params.push(`%${state}%`);
    }

    if (search) {
      paramCount++;
      sql += ` AND (
        p.code ILIKE $${paramCount} OR
        c.name ILIKE $${paramCount} OR
        s.name ILIKE $${paramCount} OR
        pa.area_name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    // Group by pincode to aggregate areas
    sql += ` GROUP BY p.id, p.code, p.city_id, c.name, s.name, co.name, p.created_at, p.updated_at`;

    // Apply sorting
    const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const sortField = sortBy as string;

    if (sortField === 'cityName') {
      sql += ` ORDER BY c.name ${sortDirection}`;
    } else if (sortField === 'state') {
      sql += ` ORDER BY s.name ${sortDirection}`;
    } else if (sortField === 'country') {
      sql += ` ORDER BY co.name ${sortDirection}`;
    } else {
      sql += ` ORDER BY p.${sortField} ${sortDirection}`;
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
      SELECT COUNT(DISTINCT p.id)
      FROM pincodes p
      JOIN cities c ON p.city_id = c.id
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON c.country_id = co.id
      LEFT JOIN pincode_areas pa ON p.id = pa.pincode_id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 0;

    if (cityId) {
      countParamCount++;
      countSql += ` AND p.city_id = $${countParamCount}`;
      countParams.push(cityId);
    }

    if (state) {
      countParamCount++;
      countSql += ` AND s.name ILIKE $${countParamCount}`;
      countParams.push(`%${state}%`);
    }

    if (search) {
      countParamCount++;
      countSql += ` AND (
        p.code ILIKE $${countParamCount} OR
        c.name ILIKE $${countParamCount} OR
        s.name ILIKE $${countParamCount} OR
        pa.area_name ILIKE $${countParamCount}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query<{ count: string }>(countSql, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limitNum);

    logger.info(`Retrieved ${result.rows.length} pincodes`, {
      userId: req.user?.id,
      filters: { cityId, state, district, region, search },
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
    logger.error('Error retrieving pincodes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pincodes',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/pincodes/:id - Get pincode by ID
export const getPincodeById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Query pincode with associated areas
    const sql = `
      SELECT
        p.id,
        p.code,
        p.city_id as "cityId",
        c.name as "cityName",
        s.name as state,
        co.name as country,
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', pa.id,
              'name', pa.area_name,
              'displayOrder', pa.display_order
            ) ORDER BY pa.display_order
          ) FILTER (WHERE pa.id IS NOT NULL),
          '[]'::json
        ) as areas
      FROM pincodes p
      JOIN cities c ON p.city_id = c.id
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON c.country_id = co.id
      LEFT JOIN pincode_areas pa ON p.id = pa.pincode_id
      WHERE p.id = $1
      GROUP BY p.id, p.code, p.city_id, c.name, s.name, co.name, p.created_at, p.updated_at
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved pincode ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error retrieving pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pincode',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/pincodes - Create new pincode
export const createPincode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      code,
      area, // For backward compatibility
      areas, // New multi-area support
      cityId
    } = req.body;

    if (!code || !cityId) {
      return res.status(400).json({
        success: false,
        message: 'Pincode code and city are required',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Handle areas - support both single area (backward compatibility) and multiple areas
    let areaList: string[] = [];
    if (areas && Array.isArray(areas) && areas.length > 0) {
      areaList = areas;
    } else if (area && typeof area === 'string') {
      areaList = [area];
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one area is required',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Validate areas
    if (areaList.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 15 areas allowed per pincode',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    for (const areaName of areaList) {
      if (!areaName || typeof areaName !== 'string' || areaName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Each area name must be at least 2 characters',
          error: { code: 'VALIDATION_ERROR' },
        });
      }
    }

    // Check if pincode already exists
    const existingPincode = await query('SELECT id FROM pincodes WHERE code = $1', [code]);
    if (existingPincode.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Pincode already exists',
        error: { code: 'DUPLICATE_PINCODE' },
      });
    }

    // Verify city exists
    const cityCheck = await query('SELECT id FROM cities WHERE id = $1', [cityId]);
    if (cityCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid city selected',
        error: { code: 'INVALID_CITY' },
      });
    }

    // Create pincode in database
    const pincodeResult = await query(
      'INSERT INTO pincodes (code, city_id) VALUES ($1, $2) RETURNING id, code, city_id as "cityId", created_at as "createdAt", updated_at as "updatedAt"',
      [code, cityId]
    );

    const newPincode = pincodeResult.rows[0];

    // Add areas to the pincode
    for (let i = 0; i < areaList.length; i++) {
      const areaName = areaList[i].trim();
      const displayOrder = i + 1;

      await query(
        'INSERT INTO pincode_areas (pincode_id, area_name, display_order) VALUES ($1, $2, $3)',
        [newPincode.id, areaName, displayOrder]
      );
    }

    // Get complete pincode data with city information
    const completeResult = await query(`
      SELECT
        p.id,
        p.code,
        p.city_id as "cityId",
        c.name as "cityName",
        s.name as state,
        co.name as country,
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pa.id,
            'name', pa.area_name,
            'displayOrder', pa.display_order
          ) ORDER BY pa.display_order
        ) as areas
      FROM pincodes p
      JOIN cities c ON p.city_id = c.id
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON c.country_id = co.id
      JOIN pincode_areas pa ON p.id = pa.pincode_id
      WHERE p.id = $1
      GROUP BY p.id, p.code, p.city_id, c.name, s.name, co.name, p.created_at, p.updated_at
    `, [newPincode.id]);

    const responseData = completeResult.rows[0];

    logger.info(`Created new pincode: ${newPincode.id}`, {
      userId: req.user?.id,
      pincodeCode: code,
      area: areaList.join(', '),
      cityName: responseData.cityName
    });

    res.status(201).json({
      success: true,
      message: 'Pincode created successfully',
      data: responseData,
    });
  } catch (error) {
    logger.error('Error creating pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pincode',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/pincodes/:id - Update pincode
export const updatePincode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const pincodeIndex = pincodes.findIndex(pin => pin.id === id);
    if (pincodeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate code if being updated
    if (updateData.code) {
      const existingPincode = pincodes.find(pin => pin.id !== id && pin.code === updateData.code);
      if (existingPincode) {
        return res.status(400).json({
          success: false,
          message: 'Pincode already exists',
          error: { code: 'DUPLICATE_PINCODE' },
        });
      }
    }

    // Update pincode
    const updatedPincode = {
      ...pincodes[pincodeIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    pincodes[pincodeIndex] = updatedPincode;

    logger.info(`Updated pincode: ${id}`, { 
      userId: req.user?.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedPincode,
      message: 'Pincode updated successfully',
    });
  } catch (error) {
    logger.error('Error updating pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pincode',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/pincodes/:id - Delete pincode
export const deletePincode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const pincodeIndex = pincodes.findIndex(pin => pin.id === id);
    if (pincodeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const deletedPincode = pincodes[pincodeIndex];
    pincodes.splice(pincodeIndex, 1);

    logger.info(`Deleted pincode: ${id}`, { 
      userId: req.user?.id,
      pincodeCode: deletedPincode.code
    });

    res.json({
      success: true,
      message: 'Pincode deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting pincode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pincode',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/pincodes/search - Search pincodes
export const searchPincodes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        error: { code: 'MISSING_QUERY' },
      });
    }

    const searchTerm = (q as string).toLowerCase();
    const searchResults = pincodes
      .filter(pin =>
        pin.code.includes(searchTerm) ||
        pin.area.toLowerCase().includes(searchTerm) ||
        pin.cityName.toLowerCase().includes(searchTerm) ||
        pin.district.toLowerCase().includes(searchTerm)
      )
      .slice(0, Number(limit));

    res.json({
      success: true,
      data: searchResults,
    });
  } catch (error) {
    logger.error('Error searching pincodes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search pincodes',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/pincodes/bulk-import - Bulk import pincodes
export const bulkImportPincodes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pincodes: importPincodes } = req.body;

    if (!importPincodes || !Array.isArray(importPincodes) || importPincodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pincodes array is required',
        error: { code: 'MISSING_PINCODES' },
      });
    }

    const importedPincodes = [];
    const errors = [];

    for (let i = 0; i < importPincodes.length; i++) {
      try {
        const pincodeData = importPincodes[i];
        const { code, area, cityId, cityName, state, district } = pincodeData;

        // Validate required fields
        if (!code || !area || !cityName || !state) {
          errors.push(`Row ${i + 1}: Code, area, city name, and state are required`);
          continue;
        }

        // Check for duplicate code
        const existingPincode = pincodes.find(pin => pin.code === code);
        if (existingPincode) {
          errors.push(`Row ${i + 1}: Pincode '${code}' already exists`);
          continue;
        }

        const newPincode = {
          id: `pincode_${Date.now()}_${i}`,
          code,
          area,
          cityId: cityId || `city_${code.substring(0, 3)}`,
          cityName,
          state,
          country: pincodeData.country || 'India',
          district: district || cityName,
          region: pincodeData.region || 'Unknown',
          coordinates: pincodeData.coordinates || { latitude: 0, longitude: 0 },
          deliveryStatus: pincodeData.deliveryStatus || 'DELIVERY',
          officeType: pincodeData.officeType || 'Sub Office',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        pincodes.push(newPincode);
        importedPincodes.push(newPincode);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error}`);
      }
    }

    logger.info(`Bulk imported ${importedPincodes.length} pincodes`, {
      userId: req.user?.id,
      successCount: importedPincodes.length,
      errorCount: errors.length
    });

    res.status(201).json({
      success: true,
      data: {
        imported: importedPincodes,
        errors,
        summary: {
          total: importPincodes.length,
          successful: importedPincodes.length,
          failed: errors.length,
        }
      },
      message: `Bulk import completed: ${importedPincodes.length} successful, ${errors.length} failed`,
    });
  } catch (error) {
    logger.error('Error in bulk import:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import pincodes',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/cities/:id/pincodes - Get pincodes by city
export const getPincodesByCity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: cityId } = req.params;
    const { isActive, limit = 50 } = req.query;

    let cityPincodes = pincodes.filter(pin => pin.cityId === cityId);

    // Apply active filter if specified
    if (isActive !== undefined) {
      cityPincodes = cityPincodes.filter(pin => pin.isActive === (isActive === 'true'));
    }

    // Apply limit
    cityPincodes = cityPincodes.slice(0, Number(limit));

    // Sort by pincode
    cityPincodes.sort((a, b) => a.code.localeCompare(b.code));

    logger.info(`Retrieved ${cityPincodes.length} pincodes for city ${cityId}`, {
      userId: req.user?.id,
      cityId,
      isActive
    });

    res.json({
      success: true,
      data: cityPincodes,
    });
  } catch (error) {
    logger.error('Error getting pincodes by city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pincodes by city',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/pincodes/:id/areas - Add areas to a pincode
export const addPincodeAreas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: pincodeId } = req.params;
    const { areas } = req.body;

    if (!areas || !Array.isArray(areas) || areas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Areas array is required and must not be empty',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Validate area names
    for (const area of areas) {
      if (!area.name || typeof area.name !== 'string' || area.name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Each area must have a valid name (minimum 2 characters)',
          error: { code: 'VALIDATION_ERROR' },
        });
      }
    }

    // Check if pincode exists
    const pincodeCheck = await query('SELECT id FROM pincodes WHERE id = $1', [pincodeId]);
    if (pincodeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check current area count to enforce limit
    const currentAreasResult = await query(
      'SELECT COUNT(*) as count FROM pincode_areas WHERE pincode_id = $1',
      [pincodeId]
    );
    const currentCount = parseInt(currentAreasResult.rows[0].count, 10);

    if (currentCount + areas.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 15 areas allowed per pincode',
        error: { code: 'LIMIT_EXCEEDED' },
      });
    }

    // Insert new areas
    const insertedAreas = [];
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      const displayOrder = area.displayOrder || (currentCount + i + 1);

      try {
        const result = await query(
          `INSERT INTO pincode_areas (pincode_id, area_name, display_order)
           VALUES ($1, $2, $3)
           RETURNING id, area_name as name, display_order as "displayOrder", created_at as "createdAt"`,
          [pincodeId, area.name.trim(), displayOrder]
        );
        insertedAreas.push(result.rows[0]);
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          return res.status(400).json({
            success: false,
            message: `Area "${area.name}" already exists for this pincode`,
            error: { code: 'DUPLICATE_AREA' },
          });
        }
        throw error;
      }
    }

    logger.info(`Added ${insertedAreas.length} areas to pincode ${pincodeId}`, {
      userId: req.user?.id,
      pincodeId,
      areas: insertedAreas.map(a => a.name)
    });

    res.status(201).json({
      success: true,
      message: `Successfully added ${insertedAreas.length} areas`,
      data: insertedAreas,
    });
  } catch (error) {
    logger.error('Error adding pincode areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add areas',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/pincodes/:id/areas/:areaId - Update a specific area
export const updatePincodeArea = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: pincodeId, areaId } = req.params;
    const { name, displayOrder } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid area name is required (minimum 2 characters)',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Check if area exists for this pincode
    const areaCheck = await query(
      'SELECT id FROM pincode_areas WHERE id = $1 AND pincode_id = $2',
      [areaId, pincodeId]
    );

    if (areaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Area not found for this pincode',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update the area
    const updateFields = ['area_name = $3'];
    const params = [areaId, pincodeId, name.trim()];
    let paramCount = 3;

    if (displayOrder !== undefined) {
      paramCount++;
      updateFields.push(`display_order = $${paramCount}`);
      params.push(displayOrder);
    }

    try {
      const result = await query(
        `UPDATE pincode_areas
         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND pincode_id = $2
         RETURNING id, area_name as name, display_order as "displayOrder", updated_at as "updatedAt"`,
        params
      );

      logger.info(`Updated area ${areaId} for pincode ${pincodeId}`, {
        userId: req.user?.id,
        pincodeId,
        areaId,
        newName: name
      });

      res.json({
        success: true,
        message: 'Area updated successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: `Area "${name}" already exists for this pincode`,
          error: { code: 'DUPLICATE_AREA' },
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error updating pincode area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update area',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/pincodes/:id/areas/:areaId - Delete a specific area
export const deletePincodeArea = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: pincodeId, areaId } = req.params;

    // Check if area exists for this pincode
    const areaCheck = await query(
      'SELECT id, area_name FROM pincode_areas WHERE id = $1 AND pincode_id = $2',
      [areaId, pincodeId]
    );

    if (areaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Area not found for this pincode',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check if this is the last area (prevent deletion if it would leave pincode with no areas)
    const areaCountResult = await query(
      'SELECT COUNT(*) as count FROM pincode_areas WHERE pincode_id = $1',
      [pincodeId]
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
    await query('DELETE FROM pincode_areas WHERE id = $1 AND pincode_id = $2', [areaId, pincodeId]);

    logger.info(`Deleted area ${areaId} (${areaName}) from pincode ${pincodeId}`, {
      userId: req.user?.id,
      pincodeId,
      areaId,
      areaName
    });

    res.json({
      success: true,
      message: 'Area deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting pincode area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete area',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/pincodes/:id/areas/reorder - Reorder areas for a pincode
export const reorderPincodeAreas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: pincodeId } = req.params;
    const { areaOrders } = req.body;

    if (!areaOrders || !Array.isArray(areaOrders) || areaOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Area orders array is required',
        error: { code: 'VALIDATION_ERROR' },
      });
    }

    // Validate area orders format
    for (const item of areaOrders) {
      if (!item.id || typeof item.displayOrder !== 'number' || item.displayOrder < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each area order must have valid id and displayOrder (positive number)',
          error: { code: 'VALIDATION_ERROR' },
        });
      }
    }

    // Update display orders in a transaction
    await query('BEGIN');

    try {
      for (const item of areaOrders) {
        await query(
          'UPDATE pincode_areas SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND pincode_id = $3',
          [item.displayOrder, item.id, pincodeId]
        );
      }

      await query('COMMIT');

      logger.info(`Reordered ${areaOrders.length} areas for pincode ${pincodeId}`, {
        userId: req.user?.id,
        pincodeId,
        areaOrders
      });

      res.json({
        success: true,
        message: 'Areas reordered successfully',
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Error reordering pincode areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder areas',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
