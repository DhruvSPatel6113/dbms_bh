const prisma = require('../config/db');
const { AppError } = require('../utils/AppError');
const { mapDbError } = require('../utils/dbErrors');

exports.generateDefaulterReport = async (asOf = null) => {
  const targetDate = asOf ? new Date(asOf) : new Date();
  if (isNaN(targetDate.getTime())) {
    throw new AppError('Invalid asOf date parameter', 400, 'INVALID_DATE');
  }

  const dateStr = targetDate.toISOString().split('T')[0];

  try {
    await prisma.$executeRaw`CALL sp_generate_defaulter_report(CAST(${dateStr} AS DATE));`;
    return await prisma.$queryRaw`
      SELECT 
        report_date AS "reportDate",
        member_id AS "memberId",
        full_name AS "fullName",
        overdue_books AS "overdueBooks",
        total_fine AS "totalFine"
      FROM report_defaulters
      WHERE report_date = CAST(${dateStr} AS DATE)
      ORDER BY total_fine DESC, full_name ASC;
    `;
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.generateExpiryReport = async (days = 30, asOf = null) => {
  const targetDate = asOf ? new Date(asOf) : new Date();
  if (isNaN(targetDate.getTime())) {
    throw new AppError('Invalid asOf date parameter', 400, 'INVALID_DATE');
  }

  const dateStr = targetDate.toISOString().split('T')[0];

  try {
    await prisma.$executeRaw`CALL sp_expiry_report(CAST(${Number(days)} AS INT), CAST(${dateStr} AS DATE));`;
    return await prisma.$queryRaw`
      SELECT 
        report_date AS "reportDate",
        item_type AS "itemType",
        item_id AS "itemId",
        item_name AS "itemName",
        expiry_date AS "expiryDate",
        days_remaining AS "daysRemaining"
      FROM report_expiries
      WHERE report_date = CAST(${dateStr} AS DATE)
      ORDER BY days_remaining ASC;
    `;
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.getCirculationSummary = async (year = new Date().getUTCFullYear(), month = new Date().getUTCMonth() + 1) => {
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [issuedCount, returnedCount] = await Promise.all([
    prisma.txn.count({
      where: {
        issueDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    }),
    prisma.txn.count({
      where: {
        returnDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })
  ]);

  return {
    year,
    month,
    period: `${year}-${String(month).padStart(2, '0')}`,
    issuedCount,
    returnedCount
  };
};

exports.getPopularBooks = async (limit = 10) => {
  const results = await prisma.txn.groupBy({
    by: ['bookId'],
    _count: {
      txnId: true
    },
    orderBy: {
      _count: {
        txnId: 'desc'
      }
    },
    take: limit
  });

  const bookIds = results.map(r => r.bookId);
  const books = await prisma.book.findMany({
    where: { bookId: { in: bookIds } }
  });

  const bookMap = new Map(books.map(b => [b.bookId, b]));

  return results.map(r => ({
    book: bookMap.get(r.bookId),
    borrowCount: r._count.txnId
  })).sort((a, b) => {
    if (b.borrowCount !== a.borrowCount) {
      return b.borrowCount - a.borrowCount;
    }
    return (a.book?.title || '').localeCompare(b.book?.title || '');
  });
};

exports.getFinancialSummary = async (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const [membershipPayments, paidFines] = await Promise.all([
    prisma.membershipPayment.aggregate({
      where: { paidAt: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: { paymentId: true }
    }),
    prisma.fine.aggregate({
      where: { paidStatus: 'Paid', paidDate: { gte: start, lt: end } },
      _sum: { fineAmount: true },
      _count: { fineId: true }
    })
  ]);
  const membershipRevenue = Number(membershipPayments._sum.amount || 0);
  const fineRevenue = Number(paidFines._sum.fineAmount || 0);
  return {
    year,
    month,
    period: `${year}-${String(month).padStart(2, '0')}`,
    membershipRevenue,
    membershipPaymentCount: membershipPayments._count.paymentId,
    fineRevenue,
    paidFineCount: paidFines._count.fineId,
    totalRevenue: Number((membershipRevenue + fineRevenue).toFixed(2))
  };
};
