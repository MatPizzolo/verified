import { beforeAll, afterAll, afterEach } from 'vitest';

beforeAll(async () => {
  console.log('🧪 Test environment initialized');
});

afterEach(async () => {
  // Clean up after each test if needed
});

afterAll(async () => {
  // Cleanup test database
  console.log('🧹 Test environment cleaned up');
});
