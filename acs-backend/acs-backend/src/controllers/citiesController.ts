import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

// Mock data for demonstration (replace with actual database operations)
let cities: any[] = [
  {
    id: 'city_1',
    name: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    code: 'MUM',
    isActive: true,
    population: 12442373,
    area: 603.4, // sq km
    coordinates: {
      latitude: 19.0760,
      longitude: 72.8777,
    },
    timezone: 'Asia/Kolkata',
    pincodesCount: 156,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'city_2',
    name: 'Delhi',
    state: 'Delhi',
    country: 'India',
    code: 'DEL',
    isActive: true,
    population: 11034555,
    area: 1484, // sq km
    coordinates: {
      latitude: 28.7041,
      longitude: 77.1025,
    },
    timezone: 'Asia/Kolkata',
    pincodesCount: 89,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'city_3',
    name: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    code: 'BLR',
    isActive: true,
    population: 8443675,
    area: 741, // sq km
    coordinates: {
      latitude: 12.9716,
      longitude: 77.5946,
    },
    timezone: 'Asia/Kolkata',
    pincodesCount: 67,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

// GET /api/cities - List cities with pagination and filters
export const getCities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      state, 
      country = 'India', 
      isActive, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    let filteredCities = [...cities];

    // Apply filters
    if (state) {
      filteredCities = filteredCities.filter(city => city.state === state);
    }
    if (country) {
      filteredCities = filteredCities.filter(city => city.country === country);
    }
    if (isActive !== undefined) {
      filteredCities = filteredCities.filter(city => city.isActive === (isActive === 'true'));
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredCities = filteredCities.filter(city => 
        city.name.toLowerCase().includes(searchTerm) ||
        city.state.toLowerCase().includes(searchTerm) ||
        city.code.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filteredCities.sort((a, b) => {
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
    const paginatedCities = filteredCities.slice(startIndex, endIndex);

    logger.info(`Retrieved ${paginatedCities.length} cities`, { 
      userId: req.user?.id,
      filters: { state, country, isActive, search },
      pagination: { page, limit }
    });

    res.json({
      success: true,
      data: paginatedCities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredCities.length,
        totalPages: Math.ceil(filteredCities.length / (limit as number)),
      },
    });
  } catch (error) {
    logger.error('Error retrieving cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cities',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/cities/:id - Get city by ID
export const getCityById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const city = cities.find(c => c.id === id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved city ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: city,
    });
  } catch (error) {
    logger.error('Error retrieving city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve city',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cities - Create new city
export const createCity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      name, 
      state, 
      country = 'India', 
      code, 
      population, 
      area, 
      coordinates, 
      timezone = 'Asia/Kolkata', 
      isActive = true 
    } = req.body;

    // Check if city code already exists
    const existingCity = cities.find(c => c.code === code);
    if (existingCity) {
      return res.status(400).json({
        success: false,
        message: 'City code already exists',
        error: { code: 'DUPLICATE_CODE' },
      });
    }

    const newCity = {
      id: `city_${Date.now()}`,
      name,
      state,
      country,
      code,
      population: population || 0,
      area: area || 0,
      coordinates: coordinates || { latitude: 0, longitude: 0 },
      timezone,
      pincodesCount: 0,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cities.push(newCity);

    logger.info(`Created new city: ${newCity.id}`, { 
      userId: req.user?.id,
      cityName: name,
      state,
      code
    });

    res.status(201).json({
      success: true,
      data: newCity,
      message: 'City created successfully',
    });
  } catch (error) {
    logger.error('Error creating city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/cities/:id - Update city
export const updateCity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const cityIndex = cities.findIndex(c => c.id === id);
    if (cityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate code if being updated
    if (updateData.code) {
      const existingCity = cities.find(c => c.id !== id && c.code === updateData.code);
      if (existingCity) {
        return res.status(400).json({
          success: false,
          message: 'City code already exists',
          error: { code: 'DUPLICATE_CODE' },
        });
      }
    }

    // Update city
    const updatedCity = {
      ...cities[cityIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    cities[cityIndex] = updatedCity;

    logger.info(`Updated city: ${id}`, { 
      userId: req.user?.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedCity,
      message: 'City updated successfully',
    });
  } catch (error) {
    logger.error('Error updating city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update city',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/cities/:id - Delete city
export const deleteCity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const cityIndex = cities.findIndex(c => c.id === id);
    if (cityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const deletedCity = cities[cityIndex];
    cities.splice(cityIndex, 1);

    logger.info(`Deleted city: ${id}`, { 
      userId: req.user?.id,
      cityName: deletedCity.name
    });

    res.json({
      success: true,
      message: 'City deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete city',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/cities/bulk-import - Bulk import cities
export const bulkImportCities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cities: importCities } = req.body;

    if (!importCities || !Array.isArray(importCities) || importCities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cities array is required',
        error: { code: 'MISSING_CITIES' },
      });
    }

    const importedCities = [];
    const errors = [];

    for (let i = 0; i < importCities.length; i++) {
      try {
        const cityData = importCities[i];
        const { name, state, country, code } = cityData;

        // Validate required fields
        if (!name || !state || !code) {
          errors.push(`Row ${i + 1}: Name, state, and code are required`);
          continue;
        }

        // Check for duplicate code
        const existingCity = cities.find(c => c.code === code);
        if (existingCity) {
          errors.push(`Row ${i + 1}: City code '${code}' already exists`);
          continue;
        }

        const newCity = {
          id: `city_${Date.now()}_${i}`,
          name,
          state,
          country: country || 'India',
          code,
          population: cityData.population || 0,
          area: cityData.area || 0,
          coordinates: cityData.coordinates || { latitude: 0, longitude: 0 },
          timezone: cityData.timezone || 'Asia/Kolkata',
          pincodesCount: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        cities.push(newCity);
        importedCities.push(newCity);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error}`);
      }
    }

    logger.info(`Bulk imported ${importedCities.length} cities`, {
      userId: req.user?.id,
      successCount: importedCities.length,
      errorCount: errors.length
    });

    res.status(201).json({
      success: true,
      data: {
        imported: importedCities,
        errors,
        summary: {
          total: importCities.length,
          successful: importedCities.length,
          failed: errors.length,
        }
      },
      message: `Bulk import completed: ${importedCities.length} successful, ${errors.length} failed`,
    });
  } catch (error) {
    logger.error('Error in bulk import:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import cities',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/cities/states - Get states list
export const getStates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { country = 'India' } = req.query;

    // Get unique states from cities
    const states = [...new Set(cities
      .filter(city => city.country === country)
      .map(city => city.state)
    )].sort();

    res.json({
      success: true,
      data: states,
    });
  } catch (error) {
    logger.error('Error getting states:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get states',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/cities/stats - Get cities statistics
export const getCitiesStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalCities = cities.length;
    const activeCities = cities.filter(c => c.isActive).length;
    const inactiveCities = totalCities - activeCities;

    const stateDistribution = cities.reduce((acc, city) => {
      acc[city.state] = (acc[city.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const countryDistribution = cities.reduce((acc, city) => {
      acc[city.country] = (acc[city.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalPopulation = cities.reduce((sum, city) => sum + (city.population || 0), 0);
    const totalArea = cities.reduce((sum, city) => sum + (city.area || 0), 0);
    const totalPincodes = cities.reduce((sum, city) => sum + (city.pincodesCount || 0), 0);

    const stats = {
      totalCities,
      activeCities,
      inactiveCities,
      stateDistribution,
      countryDistribution,
      totalPopulation,
      totalArea,
      totalPincodes,
      averagePopulation: totalCities > 0 ? Math.round(totalPopulation / totalCities) : 0,
      averageArea: totalCities > 0 ? Math.round((totalArea / totalCities) * 100) / 100 : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting cities stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cities statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
