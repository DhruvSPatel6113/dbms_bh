const { resetTestDatabase } = require('../../scripts/reset-test-db');

module.exports = async () => {
  console.log('\n[jest-global-setup] Initializing clean test database...');
  await resetTestDatabase();
  console.log('[jest-global-setup] Database ready for test execution.\n');
};

