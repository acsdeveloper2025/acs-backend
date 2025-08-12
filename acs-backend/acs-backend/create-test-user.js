const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating field test user...');

    // Hash the password
    const passwordHash = await bcrypt.hash('field123', 12);

    // Create field user
    const user = await prisma.user.upsert({
      where: { username: 'field001' },
      update: {},
      create: {
        name: 'John Doe',
        username: 'field001',
        password: 'field123', // Plain text password for the schema
        passwordHash: passwordHash, // Hashed password
        employeeId: 'FIELD001',
        designation: 'Field Officer',
        department: 'Operations',
        phone: '+91-9876543211',
        email: 'field001@acs.com',
        role: 'FIELD',
      },
    });

    console.log('✅ Field user created successfully:', user.username);
    console.log('📋 Login credentials:');
    console.log('   Username: field001');
    console.log('   Password: field123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
