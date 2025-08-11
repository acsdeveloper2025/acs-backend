const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('🔍 Checking user in database...');
    
    // Find the admin user
    const user = await prisma.user.findUnique({
      where: { username: 'admin' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        password: true,
        passwordHash: true,
        role: true,
        employeeId: true,
      },
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      hasPassword: !!user.password,
      hasPasswordHash: !!user.passwordHash,
    });
    
    // Test password verification
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log(`🔐 Password verification for "${testPassword}":`, isValid ? '✅ VALID' : '❌ INVALID');
    
    // Also test if the plain password field matches
    if (user.password) {
      console.log(`📝 Plain password field: "${user.password}"`);
      console.log(`🔍 Plain password matches: ${user.password === testPassword ? '✅ YES' : '❌ NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
