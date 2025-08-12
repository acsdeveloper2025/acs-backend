import { Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

// Mock data for countries (in production, this would come from database)
const countries = [
  // Major Countries
  { id: 'country_1', name: 'India', code: 'IN', continent: 'Asia', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'country_2', name: 'United States', code: 'US', continent: 'North America', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'country_3', name: 'United Kingdom', code: 'GB', continent: 'Europe', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'country_4', name: 'Canada', code: 'CA', continent: 'North America', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'country_5', name: 'Australia', code: 'AU', continent: 'Oceania', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'country_6', name: 'Germany', code: 'DE', continent: 'Europe', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'country_7', name: 'France', code: 'FR', continent: 'Europe', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'country_8', name: 'Japan', code: 'JP', continent: 'Asia', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'country_9', name: 'China', code: 'CN', continent: 'Asia', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'country_10', name: 'Brazil', code: 'BR', continent: 'South America', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// GET /api/countries - List countries with pagination and filters
export const getCountries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      continent, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    let filteredCountries = [...countries];

    // Apply filters
    if (continent) {
      filteredCountries = filteredCountries.filter(country => country.continent === continent);
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredCountries = filteredCountries.filter(country => 
        country.name.toLowerCase().includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filteredCountries.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Apply pagination
    const startIndex = ((page as number) - 1) * (limit as number);
    const endIndex = startIndex + (limit as number);
    const paginatedCountries = filteredCountries.slice(startIndex, endIndex);

    logger.info(`Retrieved ${paginatedCountries.length} countries`, { 
      userId: req.user?.id,
      filters: { continent, search },
      pagination: { page, limit }
    });

    res.json({
      success: true,
      data: paginatedCountries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredCountries.length,
        totalPages: Math.ceil(filteredCountries.length / (limit as number)),
      },
    });
  } catch (error) {
    logger.error('Error retrieving countries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve countries',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/countries/:id - Get country by ID
export const getCountryById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const country = countries.find(c => c.id === id);
    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved country: ${country.name}`, { 
      userId: req.user?.id,
      countryId: id
    });

    res.json({
      success: true,
      data: country,
    });
  } catch (error) {
    logger.error('Error retrieving country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve country',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/countries - Create new country
export const createCountry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, continent } = req.body;

    // Check if country code already exists
    const existingCountry = countries.find(c => c.code === code);
    if (existingCountry) {
      return res.status(400).json({
        success: false,
        message: 'Country code already exists',
        error: { code: 'DUPLICATE_CODE' },
      });
    }

    // Create new country
    const newCountry = {
      id: `country_${Date.now()}`,
      name,
      code: code.toUpperCase(),
      continent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    countries.push(newCountry);

    logger.info(`Created new country: ${newCountry.name}`, { 
      userId: req.user?.id,
      countryId: newCountry.id,
      countryData: newCountry
    });

    res.status(201).json({
      success: true,
      data: newCountry,
      message: 'Country created successfully',
    });
  } catch (error) {
    logger.error('Error creating country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create country',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/countries/:id - Update country
export const updateCountry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const countryIndex = countries.findIndex(c => c.id === id);
    if (countryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Country not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate code if being updated
    if (updateData.code) {
      const existingCountry = countries.find(c => 
        c.id !== id && c.code === updateData.code.toUpperCase()
      );
      if (existingCountry) {
        return res.status(400).json({
          success: false,
          message: 'Country code already exists',
          error: { code: 'DUPLICATE_CODE' },
        });
      }
    }

    // Update country
    const updatedCountry = {
      ...countries[countryIndex],
      ...updateData,
      code: updateData.code ? updateData.code.toUpperCase() : countries[countryIndex].code,
      updatedAt: new Date().toISOString(),
    };

    countries[countryIndex] = updatedCountry;

    logger.info(`Updated country: ${updatedCountry.name}`, { 
      userId: req.user?.id,
      countryId: id,
      updateData
    });

    res.json({
      success: true,
      data: updatedCountry,
      message: 'Country updated successfully',
    });
  } catch (error) {
    logger.error('Error updating country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update country',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/countries/:id - Delete country
export const deleteCountry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const countryIndex = countries.findIndex(c => c.id === id);
    if (countryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Country not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // TODO: In production, check for associated states before deletion
    // const statesCount = await getStatesCountByCountry(id);
    // if (statesCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete country. This country has ${statesCount} associated state(s).`,
    //     error: { code: 'HAS_DEPENDENCIES' }
    //   });
    // }

    const deletedCountry = countries[countryIndex];
    countries.splice(countryIndex, 1);

    logger.info(`Deleted country: ${deletedCountry.name}`, { 
      userId: req.user?.id,
      countryId: id
    });

    res.json({
      success: true,
      message: 'Country deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete country',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/countries/stats - Get countries statistics
export const getCountriesStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalCountries = countries.length;
    const countriesByContinent = countries.reduce((acc, country) => {
      acc[country.continent] = (acc[country.continent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalCountries,
      countriesByContinent,
      continents: Object.keys(countriesByContinent).length,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting countries stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get countries statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/countries/bulk-import - Bulk import countries
export const bulkImportCountries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would handle file upload and parsing in a real implementation
    res.status(501).json({
      success: false,
      message: 'Bulk import not implemented yet',
      error: { code: 'NOT_IMPLEMENTED' },
    });
  } catch (error) {
    logger.error('Error bulk importing countries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import countries',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
