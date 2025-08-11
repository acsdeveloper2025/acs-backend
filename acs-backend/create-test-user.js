const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...');
    
    // Hash the password
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        name: 'System Administrator',
        username: 'admin',
        password: 'admin123', // Plain text password for the schema
        passwordHash: passwordHash, // Hashed password
        employeeId: 'EMP001',
        designation: 'System Administrator',
        department: 'IT',
        phone: '+91-9876543210',
        email: 'admin@acs.com',
        role: 'ADMIN',
      },
    });
    
    console.log('✅ Test user created successfully:', user.username);
    console.log('📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
