import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'System Administrator',
      username: 'admin',
      password: 'admin123',
      passwordHash: adminPasswordHash,
      employeeId: 'EMP001',
      designation: 'System Administrator',
      department: 'IT',
      phone: '+91-9876543210',
      email: 'admin@acs.com',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', admin.username);

  // Create field user
  const fieldPasswordHash = await bcrypt.hash('field123', 12);
  const fieldUser = await prisma.user.upsert({
    where: { username: 'field001' },
    update: {},
    create: {
      name: 'John Doe',
      username: 'field001',
      password: 'field123',
      passwordHash: fieldPasswordHash,
      employeeId: 'EMP002',
      designation: 'Field Executive',
      department: 'Operations',
      phone: '+91-9876543211',
      email: 'john.doe@acs.com',
      role: 'FIELD',
    },
  });

  console.log('✅ Field user created:', fieldUser.username);

  // Create backend user
  const backendPasswordHash = await bcrypt.hash('backend123', 12);
  const backendUser = await prisma.user.upsert({
    where: { username: 'backend001' },
    update: {},
    create: {
      name: 'Jane Smith',
      username: 'backend001',
      password: 'backend123',
      passwordHash: backendPasswordHash,
      employeeId: 'EMP003',
      designation: 'Backend Executive',
      department: 'Operations',
      phone: '+91-9876543212',
      email: 'jane.smith@acs.com',
      role: 'BACKEND',
    },
  });

  console.log('✅ Backend user created:', backendUser.username);

  // Create sample client
  const client = await prisma.client.upsert({
    where: { code: 'CLI001' },
    update: {},
    create: {
      name: 'ABC Bank Ltd.',
      code: 'CLI001',
    },
  });

  console.log('✅ Sample client created:', client.name);

  // Create sample product
  const product = await prisma.product.upsert({
    where: { id: 'prod-1' },
    update: {},
    create: {
      id: 'prod-1',
      name: 'Personal Loan Verification',
      clientId: client.id,
    },
  });

  console.log('✅ Sample product created:', product.name);

  // Create verification types
  const residenceVerification = await prisma.verificationType.upsert({
    where: { id: 'vt-1' },
    update: {},
    create: {
      id: 'vt-1',
      name: 'Residence Verification',
      productId: product.id,
    },
  });

  const officeVerification = await prisma.verificationType.upsert({
    where: { id: 'vt-2' },
    update: {},
    create: {
      id: 'vt-2',
      name: 'Office Verification',
      productId: product.id,
    },
  });

  console.log('✅ Verification types created');

  // Create sample case
  const sampleCase = await prisma.case.upsert({
    where: { id: 'case-1' },
    update: {},
    create: {
      id: 'case-1',
      title: 'Personal Loan - Residence Verification',
      description: 'Residence verification for personal loan application',
      customerName: 'Rajesh Kumar',
      customerPhone: '+91-9876543213',
      customerEmail: 'rajesh.kumar@email.com',
      addressStreet: '123, MG Road, Sector 15',
      addressCity: 'Gurgaon',
      addressState: 'Haryana',
      addressPincode: '122001',
      latitude: 28.4595,
      longitude: 77.0266,
      status: 'ASSIGNED',
      verificationType: 'Residence Verification',
      assignedToId: fieldUser.id,
      clientId: client.id,
      verificationTypeId: residenceVerification.id,
      priority: 1,
      notes: 'High priority case - customer is VIP',
    },
  });

  console.log('✅ Sample case created:', sampleCase.title);

  // Create sample device registration
  const device = await prisma.device.upsert({
    where: { deviceId: 'DEV001' },
    update: {},
    create: {
      deviceId: 'DEV001',
      platform: 'ANDROID',
      model: 'Samsung Galaxy S21',
      osVersion: '13.0',
      appVersion: '1.0.0',
      userId: fieldUser.id,
    },
  });

  console.log('✅ Sample device created:', device.deviceId);

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_DATABASE',
      details: JSON.stringify({
        message: 'Database seeded with initial data',
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log('✅ Audit log entry created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Created accounts:');
  console.log('👤 Admin: username=admin, password=admin123');
  console.log('👤 Field: username=field001, password=field123');
  console.log('👤 Backend: username=backend001, password=backend123');
  console.log('\n🏢 Sample data:');
  console.log('🏦 Client: ABC Bank Ltd. (CLI001)');
  console.log('📦 Product: Personal Loan Verification');
  console.log('📋 Case: Residence verification for Rajesh Kumar');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
