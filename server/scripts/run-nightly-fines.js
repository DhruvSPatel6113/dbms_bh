const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function runNightlyFines(asOfDate = null, rate = 2) {
  const targetDate = asOfDate ? new Date(asOfDate) : new Date();
  const dateStr = targetDate.toISOString().split('T')[0];

  console.log(`[nightly-fines] Executing sp_calculate_fines for asOf: ${dateStr} at Rs ${rate}/day...`);

  try {
    await prisma.$executeRaw`CALL sp_calculate_fines(CAST(${dateStr} AS DATE), CAST(${rate} AS NUMERIC));`;
    console.log('[nightly-fines] Stored procedure sp_calculate_fines executed successfully.');

    // Also refresh the daily defaulter snapshot
    await prisma.$executeRaw`CALL sp_generate_defaulter_report(CAST(${dateStr} AS DATE));`;
    console.log('[nightly-fines] Defaulter report table updated successfully.');
  } catch (err) {
    console.error('[nightly-fines] Error executing nightly procedures:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const asOfArg = process.argv[2] || null;
  const rateArg = process.argv[3] ? Number(process.argv[3]) : 2;
  runNightlyFines(asOfArg, rateArg)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runNightlyFines };

