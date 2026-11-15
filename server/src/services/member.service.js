const prisma = require('../config/db');
const { addDays } = require('../utils/dates');
const { AppError } = require('../utils/AppError');
const { mapDbError } = require('../utils/dbErrors');

function computeOneYearRenewal(baseDate) {
  const d = new Date(baseDate);
  const year = d.getUTCFullYear() + 1;
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  // If joining on leap day Feb 29, next year Feb 28 is valid
  if (month === 1 && day === 29) {
    return new Date(Date.UTC(year, 1, 28));
  }
  return new Date(Date.UTC(year, month, day));
}

exports.list = async ({ q, status, type, page = 1, limit = 20 }) => {
  const take = Math.max(1, Number(limit));
  const skip = Math.max(0, (Number(page) - 1) * take);

  const where = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (status) where.status = status;
  if (type) where.membershipType = type;

  const [items, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take,
      orderBy: { memberId: 'desc' }
    }),
    prisma.member.count({ where })
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

exports.getById = async (memberId) => {
  const member = await prisma.member.findUnique({
    where: { memberId },
    include: {
      fines: true,
      txns: {
        where: { returnDate: null }
      }
    }
  });
  if (!member) {
    throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
  }
  return member;
};

exports.create = async (data) => {
  const existing = await prisma.member.findUnique({
    where: { email: data.email }
  });
  if (existing) {
    throw new AppError('Email address is already registered', 409, 'DUPLICATE_EMAIL');
  }

  const joinDate = data.joinDate ? new Date(data.joinDate) : new Date();
  const renewDate = data.renewDate ? new Date(data.renewDate) : computeOneYearRenewal(joinDate);
  if (renewDate < joinDate) {
    throw new AppError('Renewal date cannot be before join date', 422, 'INVALID_MEMBERSHIP_DATES');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          joinDate,
          renewDate,
          membershipType: data.membershipType || 'Student',
          status: data.status || 'Active'
        }
      });
      if (data.paymentAmount > 0) {
        await tx.membershipPayment.create({
          data: { memberId: member.memberId, amount: data.paymentAmount, paymentType: 'Registration' }
        });
      }
      return member;
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.update = async (memberId, data) => {
  const existing = await prisma.member.findUnique({ where: { memberId } });
  if (!existing) {
    throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
  }

  try {
    return await prisma.member.update({
      where: { memberId },
      data
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.renew = async (memberId, { asOfDate = null, paymentAmount = 0 } = {}) => {
  const member = await prisma.member.findUnique({ where: { memberId } });
  if (!member) {
    throw new AppError('Member not found', 404, 'MEMBER_NOT_FOUND');
  }

  const today = asOfDate ? new Date(asOfDate) : new Date();
  const currentExpiry = new Date(member.renewDate);

  // If expired, renew from today; if still active, extend from current renewDate
  const baseForRenewal = currentExpiry < today ? today : currentExpiry;
  const nextRenewal = computeOneYearRenewal(baseForRenewal);

  try {
    return await prisma.$transaction(async (tx) => {
      const updatedMember = await tx.member.update({
        where: { memberId },
        data: { renewDate: nextRenewal, status: 'Active' }
      });
      if (paymentAmount > 0) {
        await tx.membershipPayment.create({
          data: { memberId, amount: paymentAmount, paymentType: 'Renewal' }
        });
      }
      return updatedMember;
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.delete = async (memberId) => {
  const [activeLoans, unpaidFines, payments] = await Promise.all([
    prisma.txn.findFirst({ where: { memberId, returnDate: null } }),
    prisma.fine.findFirst({ where: { memberId, paidStatus: 'Unpaid' } }),
    prisma.membershipPayment.findFirst({ where: { memberId } })
  ]);

  if (activeLoans) {
    throw new AppError('Cannot delete member with active book loans', 409, 'MEMBER_HAS_ACTIVE_LOANS');
  }
  if (unpaidFines) {
    throw new AppError('Cannot delete member with outstanding unpaid fines', 409, 'MEMBER_HAS_UNPAID_FINES');
  }
  if (payments) {
    throw new AppError('Cannot delete a member with recorded membership payments; suspend the member to preserve financial history', 409, 'MEMBER_HAS_PAYMENT_HISTORY');
  }

  try {
    return await prisma.member.delete({
      where: { memberId }
    });
  } catch (error) {
    throw mapDbError(error);
  }
};
