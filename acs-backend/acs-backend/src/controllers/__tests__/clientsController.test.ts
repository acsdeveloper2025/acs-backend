import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { prisma } from '@/config/database';
import clientsRouter from '@/routes/clients';

jest.mock('@/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user' };
    next();
  }
}));

// Minimal app setup for testing
const app = express();
app.use(bodyParser.json());
app.use('/api/clients', clientsRouter);

// Simple helper to mock prisma client
jest.mock('@/config/database', () => {
  const actual = jest.requireActual('@/config/database');
  return {
    ...actual,
    prisma: {
      client: {
        findUnique: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: { findMany: jest.fn() },
      verificationType: { findMany: jest.fn() },
      clientProduct: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
      clientVerificationType: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn((cb: any) => cb({
        client: {
          update: jest.fn().mockResolvedValue(undefined),
          create: jest.fn(),
          findUnique: jest.fn(),
        },
        product: { findMany: jest.fn() },
        verificationType: { findMany: jest.fn() },
        clientProduct: { deleteMany: jest.fn(), createMany: jest.fn() },
        clientVerificationType: { deleteMany: jest.fn(), createMany: jest.fn() },
      })),
    },
  };
});

// Silence logger in tests
jest.mock('@/config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

describe('clientsController.updateClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates client and syncs productIds and verificationTypeIds', async () => {
    // Arrange mocks
    (prisma.client.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'c1', code: 'C1' }) // existing client
      .mockResolvedValueOnce({
        id: 'c1',
        name: 'Client 1',
        code: 'C1',
        clientProducts: [{ product: { id: 'p1', name: 'P1', code: 'P1' } }],
        clientVerificationTypes: [{ verificationType: { id: 'v1', name: 'V1', code: 'V1' } }],
      });

    // Simulate transaction return of included client
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      const tx = {
        client: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn().mockResolvedValue({
            id: 'c1',
            name: 'Client 1',
            code: 'C1',
            clientProducts: [{ product: { id: 'p1', name: 'P1', code: 'P1' } }],
            clientVerificationTypes: [{ verificationType: { id: 'v1', name: 'V1', code: 'V1' } }],
          }),
        },
        product: { findMany: jest.fn().mockResolvedValue([{ id: 'p1' }]) },
        verificationType: { findMany: jest.fn().mockResolvedValue([{ id: 'v1' }]) },
        clientProduct: { deleteMany: jest.fn(), createMany: jest.fn() },
        clientVerificationType: { deleteMany: jest.fn(), createMany: jest.fn() },
      } as any;
      return cb(tx);
    });

    const server = app.listen();

    const res = await request(server)
      .put('/api/clients/c1')
      .send({ name: 'Client 1', code: 'C1', productIds: ['p1'], verificationTypeIds: ['v1'] })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toEqual([{ id: 'p1', name: 'P1', code: 'P1' }]);
    expect(res.body.data.verificationTypes).toEqual([{ id: 'v1', name: 'V1', code: 'V1' }]);

    server.close();
  });

  it('returns 400 when productIds include nonexistent products', async () => {
    (prisma.client.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', code: 'C1' });
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      const tx = {
        client: { update: jest.fn().mockResolvedValue({}), findUnique: jest.fn() },
        product: { findMany: jest.fn().mockResolvedValue([]) },
        clientProduct: { deleteMany: jest.fn(), createMany: jest.fn() },
        verificationType: { findMany: jest.fn().mockResolvedValue([]) },
        clientVerificationType: { deleteMany: jest.fn(), createMany: jest.fn() },
      } as any;
      try { await cb(tx); } catch (e: any) { throw e; }
    });

    const server = app.listen();

    const res = await request(server)
      .put('/api/clients/c1')
      .send({ productIds: ['does-not-exist'] })
      .expect(400);

    expect(res.body.error.code).toBe('PRODUCTS_NOT_FOUND');

    server.close();
  });
});

