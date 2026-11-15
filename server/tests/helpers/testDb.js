const prisma = require('../../src/config/db');

async function cleanDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE membership_payment, fine, txn, software, dealer, staff, member, book RESTART IDENTITY CASCADE'
  );
  await prisma.$executeRawUnsafe('DELETE FROM report_defaulters');
  await prisma.$executeRawUnsafe('DELETE FROM report_expiries');
}

async function closeDb() {
  await prisma.$disconnect();
}

module.exports = {
  cleanDb,
  closeDb,
  prisma
};
