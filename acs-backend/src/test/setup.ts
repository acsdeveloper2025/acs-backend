import { disconnectDatabase } from '@/config/database';

// Global test setup
beforeAll(async () => {
  // Test database connection is handled by the pool
});

afterAll(async () => {
  // Clean up and disconnect
  await disconnectDatabase();
});

// Clean up database between tests
afterEach(async () => {
  // Delete all data in reverse order of dependencies
  // Note: This would need to be implemented with SQL queries
  // For now, we'll skip test cleanup until needed
});
