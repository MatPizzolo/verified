import { beforeAll, afterAll, afterEach } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  // Setup test database connection
  console.log('🧪 Test environment initialized');
});

afterEach(async () => {
  // Clean up after each test if needed
});

afterAll(async () => {
  // Cleanup test database
  console.log('🧹 Test environment cleaned up');
});
