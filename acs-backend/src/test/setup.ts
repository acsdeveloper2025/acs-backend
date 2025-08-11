import { prisma } from '@/config/database';

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});

// Clean up database between tests
afterEach(async () => {
  // Delete all data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.backgroundSyncQueue.deleteMany();
  await prisma.notificationToken.deleteMany();
  await prisma.autoSave.deleteMany();
  await prisma.residenceVerificationReport.deleteMany();
  await prisma.officeVerificationReport.deleteMany();
  await prisma.location.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.case.deleteMany();
  await prisma.verificationType.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();
});
