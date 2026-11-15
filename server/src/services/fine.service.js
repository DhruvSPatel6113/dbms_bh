const prisma = require('../config/db');
const { AppError } = require('../utils/AppError');
const { mapDbError } = require('../utils/dbErrors');

exports.list = async ({ paidStatus, memberId, page = 1, limit = 20 }) => {
  const take = Math.max(1, Number(limit));
  const skip = Math.max(0, (Number(page) - 1) * take);

  const where = {};
  if (paidStatus) where.paidStatus = paidStatus;
  if (memberId) where.memberId = Number(memberId);

  const [items, total] = await Promise.all([
    prisma.fine.findMany({
      where,
      skip,
      take,
      include: { member: true, txn: { include: { book: true } } },
      orderBy: { fineId: 'desc' }
    }),
    prisma.fine.count({ where })
  ]);

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take)
    }
  };
};

exports.getById = async (fineId) => {
  const fine = await prisma.fine.findUnique({
    where: { fineId },
    include: { member: true, txn: { include: { book: true } } }
  });
  if (!fine) {
    throw new AppError('Fine record not found', 404, 'FINE_NOT_FOUND');
  }
  return fine;
};

exports.calculateAll = async (asOf = null, rate = 2) => {
  const targetDate = asOf ? new Date(asOf) : new Date();
  if (isNaN(targetDate.getTime())) {
    throw new AppError('Invalid asOf date parameter', 400, 'INVALID_DATE');
  }

  const dateStr = targetDate.toISOString().split('T')[0];

  try {
    await prisma.$executeRaw`CALL sp_calculate_fines(CAST(${dateStr} AS DATE), CAST(${rate} AS NUMERIC));`;
    return { success: true, asOf: dateStr, rate };
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.pay = async (fineId, paidDate = null) => {
  const fine = await prisma.fine.findUnique({ where: { fineId } });
  if (!fine) {
    throw new AppError('Fine record not found', 404, 'FINE_NOT_FOUND');
  }
  if (fine.paidStatus !== 'Unpaid') {
    throw new AppError(`Fine is already ${fine.paidStatus.toLowerCase()} and cannot be paid`, 409, 'FINE_NOT_PAYABLE');
  }

  const dateObj = paidDate ? new Date(paidDate) : new Date();
  const dateStr = dateObj.toISOString().split('T')[0];

  try {
    await prisma.$executeRaw`CALL sp_pay_fine(CAST(${fineId} AS INT), CAST(${dateStr} AS DATE));`;
    return await prisma.fine.findUnique({ where: { fineId } });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.waive = async (fineId, reason) => {
  if (!reason || reason.trim().length === 0) {
    throw new AppError('A valid administrative reason is required to waive a fine', 400, 'REASON_REQUIRED');
  }

  const fine = await prisma.fine.findUnique({ where: { fineId } });
  if (!fine) {
    throw new AppError('Fine record not found', 404, 'FINE_NOT_FOUND');
  }
  if (fine.paidStatus === 'Paid') {
    throw new AppError('Cannot waive a fine that has already been paid', 409, 'ALREADY_PAID');
  }

  try {
    return await prisma.fine.update({
      where: { fineId },
      data: {
        paidStatus: 'Waived',
        reason: `[WAIVED] ${reason}`
      }
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.getOutstanding = async (memberId) => {
  const result = await prisma.fine.aggregate({
    where: {
      memberId: Number(memberId),
      paidStatus: 'Unpaid'
    },
    _sum: {
      fineAmount: true
    }
  });

  return Number(result._sum.fineAmount || 0);
};

