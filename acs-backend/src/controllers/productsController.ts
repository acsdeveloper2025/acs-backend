import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { prisma } from '@/config/database';

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

    // Build where clause
    const whereClause: any = {};
    
    if (clientId) {
      whereClause.clientId = clientId;
    }
    if (category) {
      whereClause.category = category;
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    // Temporarily disable search to test basic functionality
    // if (search) {
    //   const searchTerm = search as string;
    //   whereClause.OR = [
    //     { name: { contains: searchTerm } },
    //     { code: { contains: searchTerm } },
    //     { description: { contains: searchTerm } }
    //   ];
    // }

    // Get total count
    const totalCount = await prisma.product.count({ where: whereClause });

    // Get products with pagination
    const dbProducts = await prisma.product.findMany({
      where: whereClause,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        client: {
          select: { id: true, name: true }
        }
      }
    });

    // Transform data to match expected format
    const transformedProducts = dbProducts.map(product => ({
      ...product,
      pricing: product.pricing ? JSON.parse(product.pricing) : null,
      verificationType: product.verificationType ? JSON.parse(product.verificationType) : []
    }));

    logger.info(`Retrieved ${dbProducts.length} products from database`, {
      userId: req.user?.id,
      page: Number(page),
      limit: Number(limit),
      search: search || '',
      total: totalCount
    });

    res.json({
      success: true,
      data: transformedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
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
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Transform response data
    const responseData = {
      ...product,
      pricing: product.pricing ? JSON.parse(product.pricing) : null,
      verificationType: product.verificationType ? JSON.parse(product.verificationType) : []
    };

    logger.info(`Retrieved product ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: responseData,
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
    const existingProduct = await prisma.product.findUnique({
      where: { code }
    });
    
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists',
        error: { code: 'DUPLICATE_CODE' },
      });
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'Client not found',
        error: { code: 'CLIENT_NOT_FOUND' },
      });
    }

    // Create product in database
    const newProduct = await prisma.product.create({
      data: {
        name,
        code,
        description,
        category,
        clientId,
        pricing: pricing ? JSON.stringify(pricing) : null,
        verificationType: verificationType ? JSON.stringify(verificationType) : null,
        isActive,
      },
      include: {
        client: {
          select: { id: true, name: true }
        }
      }
    });

    // Transform response data
    const responseData = {
      ...newProduct,
      pricing: newProduct.pricing ? JSON.parse(newProduct.pricing) : null,
      verificationType: newProduct.verificationType ? JSON.parse(newProduct.verificationType) : []
    };

    logger.info(`Created new product: ${newProduct.id}`, { 
      userId: req.user?.id,
      productName: name,
      productCode: code,
      clientId
    });

    res.status(201).json({
      success: true,
      data: responseData,
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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate code if being updated
    if (updateData.code && updateData.code !== existingProduct.code) {
      const duplicateProduct = await prisma.product.findUnique({
        where: { code: updateData.code }
      });

      if (duplicateProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product code already exists',
          error: { code: 'DUPLICATE_CODE' },
        });
      }
    }

    // Prepare update data
    const updatePayload: any = {};

    if (updateData.name) updatePayload.name = updateData.name;
    if (updateData.code) updatePayload.code = updateData.code;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.category) updatePayload.category = updateData.category;
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
    if (updateData.pricing) updatePayload.pricing = JSON.stringify(updateData.pricing);
    if (updateData.verificationType) updatePayload.verificationType = JSON.stringify(updateData.verificationType);

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updatePayload,
      include: {
        client: {
          select: { id: true, name: true }
        }
      }
    });

    // Transform response data
    const responseData = {
      ...updatedProduct,
      pricing: updatedProduct.pricing ? JSON.parse(updatedProduct.pricing) : null,
      verificationType: updatedProduct.verificationType ? JSON.parse(updatedProduct.verificationType) : []
    };

    logger.info(`Updated product: ${id}`, {
      userId: req.user?.id,
      productId: id,
      updates: Object.keys(updatePayload)
    });

    res.json({
      success: true,
      data: responseData,
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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Delete product
    await prisma.product.delete({
      where: { id }
    });

    logger.info(`Deleted product: ${id}`, {
      userId: req.user?.id,
      productId: id,
      productName: existingProduct.name
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

    // Build where clause
    const whereClause: any = { clientId };

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Get products for the client
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        client: {
          select: { id: true, name: true }
        }
      }
    });

    // Transform data to match expected format
    const transformedProducts = products.map(product => ({
      ...product,
      pricing: product.pricing ? JSON.parse(product.pricing) : null,
      verificationType: product.verificationType ? JSON.parse(product.verificationType) : []
    }));

    logger.info(`Retrieved ${products.length} products for client ${clientId}`, {
      userId: req.user?.id,
      clientId,
      total: products.length
    });

    res.json({
      success: true,
      data: transformedProducts,
    });
  } catch (error) {
    logger.error('Error retrieving products by client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/products/:id/verification-types - Map verification types to product
export const mapVerificationTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { verificationTypes } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Update verification types
    await prisma.product.update({
      where: { id },
      data: {
        verificationType: JSON.stringify(verificationTypes)
      }
    });

    logger.info(`Mapped verification types to product: ${id}`, {
      userId: req.user?.id,
      productId: id,
      verificationTypes
    });

    res.json({
      success: true,
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
    const { products } = req.body;

    // Validate and create products
    const createdProducts = [];
    const errors = [];

    for (const productData of products) {
      try {
        // Check if code already exists
        const existingProduct = await prisma.product.findUnique({
          where: { code: productData.code }
        });

        if (existingProduct) {
          errors.push(`Product code ${productData.code} already exists`);
          continue;
        }

        // Create product
        const newProduct = await prisma.product.create({
          data: {
            name: productData.name,
            code: productData.code,
            description: productData.description || null,
            category: productData.category || 'OTHER',
            clientId: productData.clientId,
            isActive: productData.isActive !== undefined ? productData.isActive : true,
            pricing: productData.pricing ? JSON.stringify(productData.pricing) : null,
            verificationType: productData.verificationType ? JSON.stringify(productData.verificationType) : null,
          }
        });

        createdProducts.push(newProduct);
      } catch (error) {
        errors.push(`Failed to create product ${productData.code}: ${error.message}`);
      }
    }

    logger.info(`Bulk imported ${createdProducts.length} products`, {
      userId: req.user?.id,
      created: createdProducts.length,
      errors: errors.length
    });

    res.json({
      success: true,
      data: {
        created: createdProducts.length,
        errors: errors
      },
      message: `Successfully imported ${createdProducts.length} products`,
    });
  } catch (error) {
    logger.error('Error bulk importing products:', error);
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
      'LOAN_VERIFICATION',
      'EMPLOYMENT_VERIFICATION',
      'BUSINESS_VERIFICATION',
      'IDENTITY_VERIFICATION',
      'ADDRESS_VERIFICATION',
      'OTHER'
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error retrieving product categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product categories',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/products/stats - Get product statistics
export const getProductStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({
      where: { isActive: true }
    });
    const inactiveProducts = totalProducts - activeProducts;

    // Get products by category
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    });

    const stats = {
      total: totalProducts,
      active: activeProducts,
      inactive: inactiveProducts,
      byCategory: productsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {} as Record<string, number>)
    };

    logger.info('Retrieved product statistics', {
      userId: req.user?.id,
      stats
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error retrieving product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
