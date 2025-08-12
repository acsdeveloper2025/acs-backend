import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query, withTransaction } from '@/config/database';

// GET /api/clients - List clients with pagination and filters
export const getClients = async (req: AuthenticatedRequest, res: Response) => {
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
    
    // Temporarily disable search to avoid SQL Server issues
    // if (search) {
    //   const searchTerm = search as string;
    //   whereClause.OR = [
    //     { name: { contains: searchTerm } },
    //     { code: { contains: searchTerm } }
    //   ];
    // }

    // Get total count
    const countRes = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM clients`, []);
    const totalCount = Number(countRes.rows[0]?.count || 0);

    // Get clients with pagination
    const offset = (Number(page) - 1) * Number(limit);
    const sortCol = ['name', 'code', 'createdAt', 'updatedAt'].includes(String(sortBy)) ? String(sortBy) : 'name';
    const sortDir = String(sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const clientsRes = await query(
      `SELECT id, name, code, "createdAt", "updatedAt"
       FROM clients
       ORDER BY ${sortCol} ${sortDir}
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    const dbClients = clientsRes.rows as any[];

    // Load mappings and cases
    const clientIds = dbClients.map(c => c.id);
    let productsByClient = new Map<string, any[]>();
    let vtsByClient = new Map<string, any[]>();
    let casesByClient = new Map<string, any[]>();
    if (clientIds.length > 0) {
      const prodMapRes = await query(
        `SELECT cp."clientId", p.id, p.name, p.code
         FROM client_products cp JOIN products p ON p.id = cp."productId"
         WHERE cp."clientId" = ANY($1::text[])`,
        [clientIds]
      );
      prodMapRes.rows.forEach(r => {
        const arr = productsByClient.get(r.clientId) || [];
        arr.push({ id: r.id, name: r.name, code: r.code });
        productsByClient.set(r.clientId, arr);
      });

      const vtMapRes = await query(
        `SELECT cvt."clientId", vt.id, vt.name, vt.code
         FROM client_verification_types cvt JOIN verification_types vt ON vt.id = cvt."verificationTypeId"
         WHERE cvt."clientId" = ANY($1::text[])`,
        [clientIds]
      );
      vtMapRes.rows.forEach(r => {
        const arr = vtsByClient.get(r.clientId) || [];
        arr.push({ id: r.id, name: r.name, code: r.code });
        vtsByClient.set(r.clientId, arr);
      });

      const casesRes = await query(
        `SELECT id, title, status, "clientId" FROM cases WHERE "clientId" = ANY($1::text[])`,
        [clientIds]
      );
      casesRes.rows.forEach(r => {
        const arr = casesByClient.get(r.clientId) || [];
        arr.push({ id: r.id, title: r.title, status: r.status });
        casesByClient.set(r.clientId, arr);
      });
    }

    // Transform data to match expected format
    const transformedClients = dbClients.map(client => ({
      ...client,
      products: productsByClient.get(client.id) || [],
      verificationTypes: vtsByClient.get(client.id) || [],
      cases: casesByClient.get(client.id) || [],
    }));

    logger.info(`Retrieved ${dbClients.length} clients from database`, {
      userId: req.user?.id,
      page: Number(page),
      limit: Number(limit),
      search: search || '',
      total: totalCount
    });

    res.json({
      success: true,
      data: transformedClients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error retrieving clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve clients',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/clients/:id - Get client by ID
export const getClientById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const baseRes = await query(`SELECT id, name, code, "createdAt", "updatedAt" FROM clients WHERE id = $1`, [id]);
    const client = baseRes.rows[0];
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    const prodRes = await query(
      `SELECT p.id, p.name, p.code FROM client_products cp JOIN products p ON p.id = cp."productId" WHERE cp."clientId" = $1`,
      [id]
    );
    const vtRes = await query(
      `SELECT vt.id, vt.name, vt.code FROM client_verification_types cvt JOIN verification_types vt ON vt.id = cvt."verificationTypeId" WHERE cvt."clientId" = $1`,
      [id]
    );
    const casesRes2 = await query(`SELECT id, title, status FROM cases WHERE "clientId" = $1`, [id]);

    // Transform response data
    const responseData = {
      ...client,
      products: prodRes.rows,
      verificationTypes: vtRes.rows,
      cases: casesRes2.rows,
    };

    logger.info(`Retrieved client ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    logger.error('Error retrieving client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve client',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/clients - Create new client
export const createClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      name, 
      code, 
      productIds = [],
      verificationTypeIds = []
    } = req.body;

    // Check if client code already exists
    const dupRes = await query(`SELECT 1 FROM clients WHERE code = $1`, [code]);
    if (dupRes.rowCount && dupRes.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Client code already exists',
        error: { code: 'DUPLICATE_CODE' },
      });
    }

    // Verify products exist if provided
    if (productIds.length > 0) {
      const prodCheck = await query(`SELECT id FROM products WHERE id = ANY($1::text[])`, [productIds]);
      if (prodCheck.rowCount !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more products not found',
          error: { code: 'PRODUCTS_NOT_FOUND' },
        });
      }
    }

    // Create client and relationships in a transaction
    const newClient = await withTransaction(async (cx) => {
      // Create client
      const clientIns = await cx.query(
        `INSERT INTO clients (id, name, code, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, name, code, "createdAt", "updatedAt"`,
        [name, code]
      );
      const created = clientIns.rows[0];

      if (productIds.length > 0) {
        const uniqueProductIds = Array.from(new Set(productIds));
        // Verify products
        const prodCheck = await cx.query(`SELECT id FROM products WHERE id = ANY($1::text[])`, [uniqueProductIds]);
        if (prodCheck.rowCount !== uniqueProductIds.length) {
          throw Object.assign(new Error('One or more products not found'), { code: 'PRODUCTS_NOT_FOUND' });
        }
        for (const pid of uniqueProductIds) {
          await cx.query(
            `INSERT INTO client_products (id, "clientId", "productId", "isActive", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [created.id, pid]
          );
        }
      }

      if (verificationTypeIds.length > 0) {
        const uniqueVerificationTypeIds = Array.from(new Set(verificationTypeIds));
        // Verify verification types exist
        const vtCheck = await cx.query(`SELECT id FROM verification_types WHERE id = ANY($1::text[])`, [uniqueVerificationTypeIds]);
        if (vtCheck.rowCount !== uniqueVerificationTypeIds.length) {
          throw Object.assign(new Error('One or more verification types not found'), { code: 'VERIFICATION_TYPES_NOT_FOUND' });
        }
        for (const vt of uniqueVerificationTypeIds) {
          await cx.query(
            `INSERT INTO client_verification_types (id, "clientId", "verificationTypeId", "isActive", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [created.id, vt]
          );
        }
      }

      // Load includes
      const prodRes2 = await cx.query(
        `SELECT p.id, p.name, p.code FROM client_products cp JOIN products p ON p.id = cp."productId" WHERE cp."clientId" = $1`,
        [created.id]
      );
      const vtRes2 = await cx.query(
        `SELECT vt.id, vt.name, vt.code FROM client_verification_types cvt JOIN verification_types vt ON vt.id = cvt."verificationTypeId" WHERE cvt."clientId" = $1`,
        [created.id]
      );

      return { ...created, clientProducts: prodRes2.rows, clientVerificationTypes: vtRes2.rows } as any;
    });

    // Transform response data
    const responseData = {
      ...(newClient as any),
      products: (newClient as any).clientProducts,
      verificationTypes: (newClient as any).clientVerificationTypes,
    } as any;

    logger.info(`Created new client: ${newClient.id}`, {
      userId: req.user?.id,
      clientName: name,
      clientCode: code,
      productCount: productIds.length,
      verificationTypeCount: verificationTypeIds.length,
    });

    res.status(201).json({
      success: true,
      data: responseData,
      message: 'Client created successfully',
    });
  } catch (error: any) {
    if (error?.code === 'PRODUCTS_NOT_FOUND') {
      return res.status(400).json({ success: false, message: 'One or more products not found', error: { code: 'PRODUCTS_NOT_FOUND' } });
    }
    if (error?.code === 'VERIFICATION_TYPES_NOT_FOUND') {
      return res.status(400).json({
        success: false,
        message: 'One or more verification types not found',
        error: { code: 'VERIFICATION_TYPES_NOT_FOUND' },
      });
    }
    logger.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/clients/:id - Update client
export const updateClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body as { name?: string; code?: string; productIds?: string[]; verificationTypeIds?: string[] };

    // Check if client exists
    const existRes = await query(`SELECT id, code FROM clients WHERE id = $1`, [id]);
    const existingClient = existRes.rows[0];
    if (!existingClient) {
      return res.status(404).json({ success: false, message: 'Client not found', error: { code: 'NOT_FOUND' } });
    }

    // Check for duplicate code if being updated
    if (updateData.code && updateData.code !== existingClient.code) {
      const dupRes2 = await query(`SELECT 1 FROM clients WHERE code = $1`, [updateData.code]);
      if (dupRes2.rowCount && dupRes2.rowCount > 0) {
        return res.status(400).json({ success: false, message: 'Client code already exists', error: { code: 'DUPLICATE_CODE' } });
      }
    }

    const result = await withTransaction(async (cx) => {
      // Update base fields
      const updates: string[] = [];
      const vals: any[] = [];
      let i = 1;
      if (updateData.name) { updates.push(`name = $${i++}`); vals.push(updateData.name); }
      if (updateData.code) { updates.push(`code = $${i++}`); vals.push(updateData.code); }
      updates.push(`"updatedAt" = CURRENT_TIMESTAMP`);
      vals.push(id);
      await cx.query(`UPDATE clients SET ${updates.join(', ')} WHERE id = $${i}`, vals);

      // Sync product mappings if provided
      if (Array.isArray(updateData.productIds)) {
        const ids = updateData.productIds;
        if (ids.length > 0) {
          const prodCheck = await cx.query(`SELECT id FROM products WHERE id = ANY($1::text[])`, [ids]);
          if (prodCheck.rowCount !== ids.length) {
            throw Object.assign(new Error('One or more products not found'), { code: 'PRODUCTS_NOT_FOUND' });
          }
        }
        await cx.query(`DELETE FROM client_products WHERE "clientId" = $1 AND "productId" <> ALL($2::text[])`, [id, ids]);
        for (const pid of Array.from(new Set(ids))) {
          await cx.query(
            `INSERT INTO client_products (id, "clientId", "productId", "isActive", "createdAt")
             VALUES (gen_random_uuid()::text, $1, $2, true, CURRENT_TIMESTAMP)
             ON CONFLICT DO NOTHING`,
            [id, pid]
          );
        }
      }

      // Sync verification type mappings if provided
      if (Array.isArray(updateData.verificationTypeIds)) {
        const ids = updateData.verificationTypeIds;
        if (ids.length > 0) {
          const vtCheck = await cx.query(`SELECT id FROM verification_types WHERE id = ANY($1::text[])`, [ids]);
          if (vtCheck.rowCount !== ids.length) {
            throw Object.assign(new Error('One or more verification types not found'), { code: 'VERIFICATION_TYPES_NOT_FOUND' });
          }
        }
        await cx.query(`DELETE FROM client_verification_types WHERE "clientId" = $1 AND "verificationTypeId" <> ALL($2::text[])`, [id, ids]);
        for (const vt of Array.from(new Set(ids))) {
          await cx.query(
            `INSERT INTO client_verification_types (id, "clientId", "verificationTypeId", "isActive", "createdAt")
             VALUES (gen_random_uuid()::text, $1, $2, true, CURRENT_TIMESTAMP)
             ON CONFLICT DO NOTHING`,
            [id, vt]
          );
        }
      }

      // Load includes
      const prodRes3 = await cx.query(
        `SELECT p.id, p.name, p.code FROM client_products cp JOIN products p ON p.id = cp."productId" WHERE cp."clientId" = $1`,
        [id]
      );
      const vtRes3 = await cx.query(
        `SELECT vt.id, vt.name, vt.code FROM client_verification_types cvt JOIN verification_types vt ON vt.id = cvt."verificationTypeId" WHERE cvt."clientId" = $1`,
        [id]
      );

      return { id, clientProducts: prodRes3.rows, clientVerificationTypes: vtRes3.rows } as any;
    });

    const responseData = {
      ...(result as any),
      products: (result as any).clientProducts,
      verificationTypes: (result as any).clientVerificationTypes,
    } as any;

    logger.info(`Updated client: ${id}`, { userId: req.user?.id, clientId: id, updates: Object.keys(updateData) });

    res.json({ success: true, data: responseData, message: 'Client updated successfully' });
  } catch (error: any) {
    if (error?.code === 'PRODUCTS_NOT_FOUND') {
      return res.status(400).json({ success: false, message: 'One or more products not found', error: { code: 'PRODUCTS_NOT_FOUND' } });
    }
    if (error?.code === 'VERIFICATION_TYPES_NOT_FOUND') {
      return res.status(400).json({ success: false, message: 'One or more verification types not found', error: { code: 'VERIFICATION_TYPES_NOT_FOUND' } });
    }
    logger.error('Error updating client:', error);
    res.status(500).json({ success: false, message: 'Failed to update client', error: { code: 'INTERNAL_ERROR' } });
  }
};

// DELETE /api/clients/:id - Delete client
export const deleteClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if client exists
    const existRes2 = await query(`SELECT id, name FROM clients WHERE id = $1`, [id]);
    const existingClient = existRes2.rows[0];

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check if client has associated cases
    const casesRes = await query(`SELECT COUNT(*)::int as count FROM cases WHERE "clientId" = $1`, [id]);
    const caseCount = casesRes.rows[0]?.count || 0;

    if (caseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete client. This client has ${caseCount} associated case(s). Please delete or reassign the cases first.`,
        error: {
          code: 'HAS_DEPENDENCIES',
          details: {
            dependencyType: 'cases',
            count: caseCount
          }
        },
      });
    }

    // Delete client (cascade will handle related records via FK if set)
    await query(`DELETE FROM clients WHERE id = $1`, [id]);

    logger.info(`Deleted client: ${id}`, { 
      userId: req.user?.id,
      clientId: id,
      clientName: existingClient.name
    });

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
