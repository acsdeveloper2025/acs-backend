import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

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

    let filteredPincodes = [...pincodes];

    // Apply filters
    if (cityId) {
      filteredPincodes = filteredPincodes.filter(pin => pin.cityId === cityId);
    }
    if (state) {
      filteredPincodes = filteredPincodes.filter(pin => pin.state === state);
    }
    if (district) {
      filteredPincodes = filteredPincodes.filter(pin => pin.district === district);
    }
    if (region) {
      filteredPincodes = filteredPincodes.filter(pin => pin.region === region);
    }
    if (deliveryStatus) {
      filteredPincodes = filteredPincodes.filter(pin => pin.deliveryStatus === deliveryStatus);
    }
    if (isActive !== undefined) {
      filteredPincodes = filteredPincodes.filter(pin => pin.isActive === (isActive === 'true'));
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredPincodes = filteredPincodes.filter(pin => 
        pin.code.includes(searchTerm) ||
        pin.area.toLowerCase().includes(searchTerm) ||
        pin.cityName.toLowerCase().includes(searchTerm) ||
        pin.district.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filteredPincodes.sort((a, b) => {
      const aValue = a[sortBy as string];
      const bValue = b[sortBy as string];
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Apply pagination
    const startIndex = ((page as number) - 1) * (limit as number);
    const endIndex = startIndex + (limit as number);
    const paginatedPincodes = filteredPincodes.slice(startIndex, endIndex);

    logger.info(`Retrieved ${paginatedPincodes.length} pincodes`, { 
      userId: req.user?.id,
      filters: { cityId, state, district, region, search },
      pagination: { page, limit }
    });

    res.json({
      success: true,
      data: paginatedPincodes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredPincodes.length,
        totalPages: Math.ceil(filteredPincodes.length / (limit as number)),
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
    const pincode = pincodes.find(pin => pin.id === id);

    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved pincode ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: pincode,
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
      area, 
      cityId, 
      cityName, 
      state, 
      country = 'India', 
      district, 
      region, 
      coordinates, 
      deliveryStatus = 'DELIVERY', 
      officeType = 'Sub Office', 
      isActive = true 
    } = req.body;

    // Check if pincode already exists
    const existingPincode = pincodes.find(pin => pin.code === code);
    if (existingPincode) {
      return res.status(400).json({
        success: false,
        message: 'Pincode already exists',
        error: { code: 'DUPLICATE_PINCODE' },
      });
    }

    const newPincode = {
      id: `pincode_${Date.now()}`,
      code,
      area,
      cityId,
      cityName,
      state,
      country,
      district,
      region,
      coordinates: coordinates || { latitude: 0, longitude: 0 },
      deliveryStatus,
      officeType,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    pincodes.push(newPincode);

    logger.info(`Created new pincode: ${newPincode.id}`, { 
      userId: req.user?.id,
      pincodeCode: code,
      area,
      cityName
    });

    res.status(201).json({
      success: true,
      data: newPincode,
      message: 'Pincode created successfully',
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
