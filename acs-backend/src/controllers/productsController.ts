import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

// Mock data for demonstration (replace with actual database operations)
let products: any[] = [
  {
    id: 'product_1',
    name: 'Personal Loan Verification',
    code: 'PLV',
    description: 'Verification services for personal loan applications',
    category: 'LOAN_VERIFICATION',
    isActive: true,
    pricing: {
      basePrice: 500,
      currency: 'INR',
      pricingModel: 'PER_VERIFICATION',
    },
    verificationType: ['RESIDENCE', 'OFFICE'],
    clientId: 'client_1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'product_2',
    name: 'Business Loan Verification',
    code: 'BLV',
    description: 'Comprehensive verification for business loan applications',
    category: 'LOAN_VERIFICATION',
    isActive: true,
    pricing: {
      basePrice: 1000,
      currency: 'INR',
      pricingModel: 'PER_VERIFICATION',
    },
    verificationType: ['OFFICE', 'BUSINESS'],
    clientId: 'client_2',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'product_3',
    name: 'Employment Verification',
    code: 'EV',
    description: 'Employment and salary verification services',
    category: 'EMPLOYMENT_VERIFICATION',
    isActive: true,
    pricing: {
      basePrice: 300,
      currency: 'INR',
      pricingModel: 'PER_VERIFICATION',
    },
    verificationType: ['OFFICE'],
    clientId: 'client_1',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

// GET /api/products - List products with pagination and filters
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      clientId, 
      category, 
      isActive, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    let filteredProducts = [...products];

    // Apply filters
    if (clientId) {
      filteredProducts = filteredProducts.filter(p => p.clientId === clientId);
    }
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    if (isActive !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.isActive === (isActive === 'true'));
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.code.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
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
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    logger.info(`Retrieved ${paginatedProducts.length} products`, { 
      userId: req.user?.id,
      filters: { clientId, category, isActive, search },
      pagination: { page, limit }
    });

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / (limit as number)),
      },
    });
  } catch (error) {
    logger.error('Error retrieving products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/products/:id - Get product by ID
export const getProductById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved product ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Error retrieving product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/products - Create new product
export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      name, 
      code, 
      description, 
      category, 
      clientId, 
      pricing, 
      verificationType, 
      isActive = true 
    } = req.body;

    // Check if product code already exists
    const existingProduct = products.find(p => p.code === code);
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists',
        error: { code: 'DUPLICATE_CODE' },
      });
    }

    const newProduct = {
      id: `product_${Date.now()}`,
      name,
      code,
      description,
      category,
      clientId,
      pricing: {
        basePrice: pricing?.basePrice || 0,
        currency: pricing?.currency || 'INR',
        pricingModel: pricing?.pricingModel || 'PER_VERIFICATION',
      },
      verificationType: verificationType || [],
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);

    logger.info(`Created new product: ${newProduct.id}`, { 
      userId: req.user?.id,
      productName: name,
      productCode: code,
      clientId
    });

    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product created successfully',
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/products/:id - Update product
export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate code if being updated
    if (updateData.code) {
      const existingProduct = products.find(p => p.id !== id && p.code === updateData.code);
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product code already exists',
          error: { code: 'DUPLICATE_CODE' },
        });
      }
    }

    // Update product
    const updatedProduct = {
      ...products[productIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProduct;

    logger.info(`Updated product: ${id}`, { 
      userId: req.user?.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully',
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/products/:id - Delete product
export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const deletedProduct = products[productIndex];
    products.splice(productIndex, 1);

    logger.info(`Deleted product: ${id}`, { 
      userId: req.user?.id,
      productName: deletedProduct.name
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/clients/:id/products - Get products by client
export const getProductsByClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: clientId } = req.params;
    const { isActive } = req.query;

    let clientProducts = products.filter(p => p.clientId === clientId);

    // Apply active filter if specified
    if (isActive !== undefined) {
      clientProducts = clientProducts.filter(p => p.isActive === (isActive === 'true'));
    }

    logger.info(`Retrieved ${clientProducts.length} products for client ${clientId}`, { 
      userId: req.user?.id,
      clientId,
      isActive
    });

    res.json({
      success: true,
      data: clientProducts,
    });
  } catch (error) {
    logger.error('Error getting products by client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products by client',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/products/:id/verification-types - Map verification types to product
export const mapVerificationTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { verificationTypes } = req.body;

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Validate verification types
    const validTypes = ['RESIDENCE', 'OFFICE', 'BUSINESS', 'EMPLOYMENT', 'OTHER'];
    const invalidTypes = verificationTypes.filter((type: string) => !validTypes.includes(type));

    if (invalidTypes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification types: ${invalidTypes.join(', ')}`,
        error: { code: 'INVALID_VERIFICATION_TYPES' },
      });
    }

    // Update verification types
    products[productIndex].verificationType = verificationTypes;
    products[productIndex].updatedAt = new Date().toISOString();

    logger.info(`Mapped verification types to product: ${id}`, {
      userId: req.user?.id,
      verificationTypes
    });

    res.json({
      success: true,
      data: products[productIndex],
      message: 'Verification types mapped successfully',
    });
  } catch (error) {
    logger.error('Error mapping verification types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to map verification types',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/products/bulk-import - Bulk import products
export const bulkImportProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { products: importProducts } = req.body;

    if (!importProducts || !Array.isArray(importProducts) || importProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required',
        error: { code: 'MISSING_PRODUCTS' },
      });
    }

    const importedProducts = [];
    const errors = [];

    for (let i = 0; i < importProducts.length; i++) {
      try {
        const productData = importProducts[i];
        const { name, code, description, category, clientId, pricing, verificationType } = productData;

        // Validate required fields
        if (!name || !code || !clientId) {
          errors.push(`Row ${i + 1}: Name, code, and client ID are required`);
          continue;
        }

        // Check for duplicate code
        const existingProduct = products.find(p => p.code === code);
        if (existingProduct) {
          errors.push(`Row ${i + 1}: Product code '${code}' already exists`);
          continue;
        }

        const newProduct = {
          id: `product_${Date.now()}_${i}`,
          name,
          code,
          description: description || '',
          category: category || 'OTHER',
          clientId,
          pricing: {
            basePrice: pricing?.basePrice || 0,
            currency: pricing?.currency || 'INR',
            pricingModel: pricing?.pricingModel || 'PER_VERIFICATION',
          },
          verificationType: verificationType || [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        products.push(newProduct);
        importedProducts.push(newProduct);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error}`);
      }
    }

    logger.info(`Bulk imported ${importedProducts.length} products`, {
      userId: req.user?.id,
      successCount: importedProducts.length,
      errorCount: errors.length
    });

    res.status(201).json({
      success: true,
      data: {
        imported: importedProducts,
        errors,
        summary: {
          total: importProducts.length,
          successful: importedProducts.length,
          failed: errors.length,
        }
      },
      message: `Bulk import completed: ${importedProducts.length} successful, ${errors.length} failed`,
    });
  } catch (error) {
    logger.error('Error in bulk import:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import products',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/products/categories - Get product categories
export const getProductCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = [
      {
        code: 'LOAN_VERIFICATION',
        name: 'Loan Verification',
        description: 'Verification services for loan applications',
      },
      {
        code: 'EMPLOYMENT_VERIFICATION',
        name: 'Employment Verification',
        description: 'Employment and salary verification services',
      },
      {
        code: 'BUSINESS_VERIFICATION',
        name: 'Business Verification',
        description: 'Business and commercial verification services',
      },
      {
        code: 'IDENTITY_VERIFICATION',
        name: 'Identity Verification',
        description: 'Identity and document verification services',
      },
      {
        code: 'ADDRESS_VERIFICATION',
        name: 'Address Verification',
        description: 'Residential and office address verification',
      },
      {
        code: 'OTHER',
        name: 'Other',
        description: 'Other verification services',
      },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error getting product categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product categories',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/products/stats - Get product statistics
export const getProductStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const inactiveProducts = totalProducts - activeProducts;

    const categoryStats = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const clientStats = products.reduce((acc, product) => {
      acc[product.clientId] = (acc[product.clientId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalProducts,
      activeProducts,
      inactiveProducts,
      categoryDistribution: categoryStats,
      clientDistribution: clientStats,
      averagePrice: products.length > 0
        ? products.reduce((sum, p) => sum + (p.pricing?.basePrice || 0), 0) / products.length
        : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
