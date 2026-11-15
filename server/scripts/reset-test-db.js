const { Client } = require('pg');
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function resetTestDatabase() {
  const testDbUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/library_test?schema=public';
  const urlObj = new URL(testDbUrl);
  const targetDbName = urlObj.pathname.replace('/', '') || 'library_test';

  console.log(`[reset-test-db] Preparing to reset target database: "${targetDbName}"`);

  // Connect to postgres default maintenance DB to drop/recreate
  const adminClient = new Client({
    user: urlObj.username || 'postgres',
    password: urlObj.password || 'postgres',
    host: urlObj.hostname || 'localhost',
    port: Number(urlObj.port) || 5432,
    database: 'postgres'
  });

  try {
    await adminClient.connect();

    // Terminate existing active connections to the test DB
    await adminClient.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid();
    `, [targetDbName]);

    // Drop and Recreate
    await adminClient.query(`DROP DATABASE IF EXISTS "${targetDbName}";`);
    await adminClient.query(`CREATE DATABASE "${targetDbName}";`);
    console.log(`[reset-test-db] Recreated fresh database: "${targetDbName}".`);
  } catch (err) {
    console.error('[reset-test-db] Error recreating database via pg client:', err.message);
    throw err;
  } finally {
    await adminClient.end();
  }

  // Run Prisma migrations against the clean library_test database
  console.log('[reset-test-db] Deploying migrations to test database...');
  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit'
  });

  console.log('[reset-test-db] Test database successfully reset and migrated.');
}

if (require.main === module) {
  resetTestDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { resetTestDatabase };

