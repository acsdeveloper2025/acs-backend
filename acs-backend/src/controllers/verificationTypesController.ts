import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

// Mock data for demonstration (replace with actual database operations)
let verificationTypes: any[] = [
  {
    id: 'vtype_1',
    name: 'Residence Verification',
    code: 'RESIDENCE',
    description: 'Verification of residential address and occupancy status',
    category: 'ADDRESS_VERIFICATION',
    isActive: true,
    requirements: [
      'Valid address proof',
      'Occupancy verification',
      'Neighbor confirmation'
    ],
    documents: [
      'Aadhaar Card',
      'Utility Bills',
      'Rent Agreement'
    ],
    estimatedTime: 24, // hours
    basePrice: 300,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'vtype_2',
    name: 'Office Verification',
    code: 'OFFICE',
    description: 'Verification of office premises and business operations',
    category: 'BUSINESS_VERIFICATION',
    isActive: true,
    requirements: [
      'Office address verification',
      'Business operation confirmation',
      'Employee verification'
    ],
    documents: [
      'Business Registration',
      'Office Lease Agreement',
      'GST Certificate'
    ],
    estimatedTime: 48, // hours
    basePrice: 500,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'vtype_3',
    name: 'Employment Verification',
    code: 'EMPLOYMENT',
    description: 'Verification of employment status and salary details',
    category: 'EMPLOYMENT_VERIFICATION',
    isActive: true,
    requirements: [
      'Employment confirmation',
      'Salary verification',
      'Designation confirmation'
    ],
    documents: [
      'Salary Slips',
      'Employment Letter',
      'Bank Statements'
    ],
    estimatedTime: 24, // hours
    basePrice: 400,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
  {
    id: 'vtype_4',
    name: 'Business Verification',
    code: 'BUSINESS',
    description: 'Comprehensive business and financial verification',
    category: 'BUSINESS_VERIFICATION',
    isActive: true,
    requirements: [
      'Business registration verification',
      'Financial status check',
      'Operational verification'
    ],
    documents: [
      'Business License',
      'Financial Statements',
      'Tax Returns'
    ],
    estimatedTime: 72, // hours
    basePrice: 800,
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
  },
];

// GET /api/verification-types - List verification types with pagination and filters
export const getVerificationTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      isActive, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    let filteredTypes = [...verificationTypes];

    // Apply filters
    if (category) {
      filteredTypes = filteredTypes.filter(vt => vt.category === category);
    }
    if (isActive !== undefined) {
      filteredTypes = filteredTypes.filter(vt => vt.isActive === (isActive === 'true'));
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredTypes = filteredTypes.filter(vt => 
        vt.name.toLowerCase().includes(searchTerm) ||
        vt.code.toLowerCase().includes(searchTerm) ||
        vt.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filteredTypes.sort((a, b) => {
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
    const paginatedTypes = filteredTypes.slice(startIndex, endIndex);

    logger.info(`Retrieved ${paginatedTypes.length} verification types`, { 
      userId: req.user?.id,
      filters: { category, isActive, search },
      pagination: { page, limit }
    });

    res.json({
      success: true,
      data: paginatedTypes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredTypes.length,
        totalPages: Math.ceil(filteredTypes.length / (limit as number)),
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
    const verificationType = verificationTypes.find(vt => vt.id === id);

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
      code, 
      description, 
      category, 
      requirements, 
      documents, 
      estimatedTime, 
      basePrice, 
      isActive = true 
    } = req.body;

    // Check if verification type code already exists
    const existingType = verificationTypes.find(vt => vt.code === code);
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'Verification type code already exists',
        error: { code: 'DUPLICATE_CODE' },
      });
    }

    const newVerificationType = {
      id: `vtype_${Date.now()}`,
      name,
      code,
      description,
      category,
      requirements: requirements || [],
      documents: documents || [],
      estimatedTime: estimatedTime || 24,
      basePrice: basePrice || 0,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    verificationTypes.push(newVerificationType);

    logger.info(`Created new verification type: ${newVerificationType.id}`, { 
      userId: req.user?.id,
      typeName: name,
      typeCode: code
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

    const typeIndex = verificationTypes.findIndex(vt => vt.id === id);
    if (typeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Verification type not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate code if being updated
    if (updateData.code) {
      const existingType = verificationTypes.find(vt => vt.id !== id && vt.code === updateData.code);
      if (existingType) {
        return res.status(400).json({
          success: false,
          message: 'Verification type code already exists',
          error: { code: 'DUPLICATE_CODE' },
        });
      }
    }

    // Update verification type
    const updatedType = {
      ...verificationTypes[typeIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    verificationTypes[typeIndex] = updatedType;

    logger.info(`Updated verification type: ${id}`, { 
      userId: req.user?.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedType,
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

    const typeIndex = verificationTypes.findIndex(vt => vt.id === id);
    if (typeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Verification type not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const deletedType = verificationTypes[typeIndex];
    verificationTypes.splice(typeIndex, 1);

    logger.info(`Deleted verification type: ${id}`, { 
      userId: req.user?.id,
      typeName: deletedType.name
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

// GET /api/products/:id/verification-types - Get verification types by product
export const getVerificationTypesByProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: productId } = req.params;

    // In a real implementation, this would query the database for product-verification type mappings
    // For now, we'll return all verification types as a mock
    const productVerificationTypes = verificationTypes.filter(vt => vt.isActive);

    logger.info(`Retrieved ${productVerificationTypes.length} verification types for product ${productId}`, {
      userId: req.user?.id,
      productId
    });

    res.json({
      success: true,
      data: productVerificationTypes,
    });
  } catch (error) {
    logger.error('Error getting verification types by product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification types by product',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/verification-types/categories - Get verification type categories
export const getVerificationTypeCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = [
      {
        code: 'ADDRESS_VERIFICATION',
        name: 'Address Verification',
        description: 'Verification of residential and office addresses',
      },
      {
        code: 'EMPLOYMENT_VERIFICATION',
        name: 'Employment Verification',
        description: 'Verification of employment status and details',
      },
      {
        code: 'BUSINESS_VERIFICATION',
        name: 'Business Verification',
        description: 'Verification of business operations and financial status',
      },
      {
        code: 'IDENTITY_VERIFICATION',
        name: 'Identity Verification',
        description: 'Verification of personal identity and documents',
      },
      {
        code: 'FINANCIAL_VERIFICATION',
        name: 'Financial Verification',
        description: 'Verification of financial status and income',
      },
      {
        code: 'OTHER',
        name: 'Other',
        description: 'Other types of verification services',
      },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error getting verification type categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification type categories',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/verification-types/stats - Get verification type statistics
export const getVerificationTypeStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalTypes = verificationTypes.length;
    const activeTypes = verificationTypes.filter(vt => vt.isActive).length;
    const inactiveTypes = totalTypes - activeTypes;

    const categoryStats = verificationTypes.reduce((acc, vt) => {
      acc[vt.category] = (acc[vt.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averagePrice = verificationTypes.length > 0
      ? verificationTypes.reduce((sum, vt) => sum + (vt.basePrice || 0), 0) / verificationTypes.length
      : 0;

    const averageTime = verificationTypes.length > 0
      ? verificationTypes.reduce((sum, vt) => sum + (vt.estimatedTime || 0), 0) / verificationTypes.length
      : 0;

    const stats = {
      totalTypes,
      activeTypes,
      inactiveTypes,
      categoryDistribution: categoryStats,
      averagePrice: Math.round(averagePrice * 100) / 100,
      averageEstimatedTime: Math.round(averageTime * 100) / 100,
      priceRange: {
        min: verificationTypes.length > 0 ? Math.min(...verificationTypes.map(vt => vt.basePrice || 0)) : 0,
        max: verificationTypes.length > 0 ? Math.max(...verificationTypes.map(vt => vt.basePrice || 0)) : 0,
      },
      timeRange: {
        min: verificationTypes.length > 0 ? Math.min(...verificationTypes.map(vt => vt.estimatedTime || 0)) : 0,
        max: verificationTypes.length > 0 ? Math.max(...verificationTypes.map(vt => vt.estimatedTime || 0)) : 0,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting verification type stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification type statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/verification-types/bulk-import - Bulk import verification types
export const bulkImportVerificationTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { verificationTypes: importTypes } = req.body;

    if (!importTypes || !Array.isArray(importTypes) || importTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Verification types array is required',
        error: { code: 'MISSING_TYPES' },
      });
    }

    const importedTypes = [];
    const errors = [];

    for (let i = 0; i < importTypes.length; i++) {
      try {
        const typeData = importTypes[i];
        const { name, code, description, category } = typeData;

        // Validate required fields
        if (!name || !code) {
          errors.push(`Row ${i + 1}: Name and code are required`);
          continue;
        }

        // Check for duplicate code
        const existingType = verificationTypes.find(vt => vt.code === code);
        if (existingType) {
          errors.push(`Row ${i + 1}: Verification type code '${code}' already exists`);
          continue;
        }

        const newType = {
          id: `vtype_${Date.now()}_${i}`,
          name,
          code,
          description: description || '',
          category: category || 'OTHER',
          requirements: typeData.requirements || [],
          documents: typeData.documents || [],
          estimatedTime: typeData.estimatedTime || 24,
          basePrice: typeData.basePrice || 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        verificationTypes.push(newType);
        importedTypes.push(newType);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error}`);
      }
    }

    logger.info(`Bulk imported ${importedTypes.length} verification types`, {
      userId: req.user?.id,
      successCount: importedTypes.length,
      errorCount: errors.length
    });

    res.status(201).json({
      success: true,
      data: {
        imported: importedTypes,
        errors,
        summary: {
          total: importTypes.length,
          successful: importedTypes.length,
          failed: errors.length,
        }
      },
      message: `Bulk import completed: ${importedTypes.length} successful, ${errors.length} failed`,
    });
  } catch (error) {
    logger.error('Error in bulk import:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import verification types',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
