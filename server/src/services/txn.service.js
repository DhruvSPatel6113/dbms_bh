const prisma = require('../config/db');
const { daysBetween, addDays } = require('../utils/dates');
const { calculateFineAmount } = require('../utils/fineCalculator');
const { AppError } = require('../utils/AppError');
const { mapDbError } = require('../utils/dbErrors');

exports.issueBook = async (bookId, memberId, issueDate = null, dueDate = null) => {
  const parsedIssueDate = issueDate ? new Date(issueDate) : new Date();
  
  if (isNaN(parsedIssueDate.getTime())) {
    throw new AppError('Invalid issue date provided', 400, 'INVALID_DATE');
  }

  // Reject future issue date beyond allowed 7-day advance booking window
  const maxAdvance = addDays(new Date(), 7);
  if (parsedIssueDate > maxAdvance) {
    throw new AppError('Issue date cannot exceed 7-day advance window', 422, 'ADVANCE_DATE_EXCEEDED');
  }

  const parsedDueDate = dueDate ? new Date(dueDate) : null;

  try {
    return await prisma.txn.create({
      data: {
        bookId: Number(bookId),
        memberId: Number(memberId),
        issueDate: parsedIssueDate,
        ...(parsedDueDate && { dueDate: parsedDueDate }),
        status: 'Issued'
      },
      include: {
        book: true,
        member: true
      }
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.returnBook = async (txnId, returnDate = null) => {
  const txn = await prisma.txn.findUnique({
    where: { txnId },
    include: { book: true, fine: true }
  });

  if (!txn) {
    throw new AppError('Transaction not found', 404, 'TXN_NOT_FOUND');
  }

  if (txn.returnDate !== null) {
    throw new AppError('Book has already been returned', 409, 'ALREADY_RETURNED');
  }

  const parsedReturnDate = returnDate ? new Date(returnDate) : new Date();

  if (parsedReturnDate < new Date(txn.issueDate)) {
    throw new AppError('Return date cannot be earlier than issue date', 422, 'RETURN_BEFORE_ISSUE');
  }

  let fineRecord = null;

  try {
    const updatedTxn = await prisma.$transaction(async (tx) => {
      // 1. Update return date (triggers fn_txn_before_return & fn_txn_after_return)
      const resTxn = await tx.txn.update({
        where: { txnId },
        data: {
          returnDate: parsedReturnDate
        }
      });

      // 2. Fine calculation if returned after due date
      const daysOverdue = daysBetween(txn.dueDate, parsedReturnDate);
      if (daysOverdue > 0) {
        const fineAmount = calculateFineAmount(txn.dueDate, parsedReturnDate, 2, Number(txn.book.cost));
        fineRecord = await tx.fine.upsert({
          where: { txnId },
          create: {
            txnId,
            memberId: txn.memberId,
            fineAmount,
            paidStatus: 'Unpaid',
            reason: `Returned late by ${daysOverdue} day(s)`
          },
          update: {
            fineAmount,
            reason: `Returned late by ${daysOverdue} day(s)`
          }
        });
      }

      return resTxn;
    });

    return { txn: updatedTxn, fine: fineRecord };
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.renewLoan = async (txnId, asOfDate = null) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const [txn] = await tx.$queryRaw`SELECT * FROM txn WHERE txn_id = ${txnId} FOR UPDATE`;
      if (!txn) {
        throw new AppError('Transaction not found', 404, 'TXN_NOT_FOUND');
      }
      if (txn.return_date !== null) {
        throw new AppError('Cannot renew an already returned loan', 409, 'LOAN_ALREADY_CLOSED');
      }
      const today = asOfDate ? new Date(asOfDate) : new Date();
      if (today > new Date(txn.due_date)) {
        throw new AppError('Cannot renew an overdue loan', 422, 'CANNOT_RENEW_OVERDUE');
      }
      if (txn.status === 'Renewed') {
        throw new AppError('Loan has already reached its maximum renewal limit (1 extension)', 422, 'RENEWAL_LIMIT_EXCEEDED');
      }
      const member = await tx.member.findUnique({ where: { memberId: txn.member_id } });
      if (!member) {
        throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
      }
      const extensionDays = member.membershipType === 'Premium' ? 21 : 14;
      const newDueDate = addDays(txn.due_date, extensionDays);
      return tx.txn.update({
        where: { txnId },
        data: { dueDate: newDueDate, status: 'Renewed' }
      });
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.listOverdue = async (asOf = null) => {
  const checkDate = asOf ? new Date(asOf) : new Date();
  return prisma.txn.findMany({
    where: {
      returnDate: null,
      dueDate: { lt: checkDate }
    },
    include: {
      book: true,
      member: true,
      fine: true
    },
    orderBy: { dueDate: 'asc' }
  });
};

exports.listActive = async ({ q, limit = 50 }) => {
  const where = { returnDate: null };
  if (q) {
    where.OR = [
      { book: { title: { contains: q, mode: 'insensitive' } } },
      { book: { author: { contains: q, mode: 'insensitive' } } },
      { book: { isbn: { contains: q } } },
      { member: { fullName: { contains: q, mode: 'insensitive' } } },
      { member: { email: { contains: q, mode: 'insensitive' } } }
    ];
  }
  return prisma.txn.findMany({
    where,
    take: Number(limit),
    include: { book: true, member: true },
    orderBy: { txnId: 'desc' }
  });
};

exports.listByMember = async (memberId) => {
  return prisma.txn.findMany({
    where: { memberId },
    include: {
      book: true,
      fine: true
    },
    orderBy: { issueDate: 'desc' }
  });
};

exports.getById = async (txnId) => {
  const txn = await prisma.txn.findUnique({
    where: { txnId },
    include: {
      book: true,
      member: true,
      fine: true
    }
  });
  if (!txn) {
    throw new AppError('Transaction not found', 404, 'TXN_NOT_FOUND');
  }
  return txn;
};
