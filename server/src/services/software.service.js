const prisma = require('../config/db');
const { addDays, daysBetween } = require('../utils/dates');
const { AppError } = require('../utils/AppError');
const { mapDbError } = require('../utils/dbErrors');

function computeLicenseStatus(expiryDate, today = new Date(), windowDays = 30) {
  if (!expiryDate) return 'Active'; // Perpetual
  const dToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dExpiry = new Date(Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate()));

  if (dExpiry < dToday) {
    return 'Expired';
  }
  const daysRemaining = Math.round((dExpiry - dToday) / 86400000);
  if (daysRemaining <= windowDays) {
    return 'ExpiringSoon';
  }
  return 'Active';
}

exports.list = async ({ dealerId }) => {
  const where = {};
  if (dealerId) where.dealerId = Number(dealerId);

  const softwareList = await prisma.software.findMany({
    where,
    include: { dealer: true },
    orderBy: { expiryDate: 'asc' }
  });

  const today = new Date();
  return softwareList.map(item => ({
    ...item,
    calculatedStatus: computeLicenseStatus(item.expiryDate, today)
  }));
};

exports.getById = async (softwareId) => {
  const item = await prisma.software.findUnique({
    where: { softwareId },
    include: { dealer: true }
  });
  if (!item) {
    throw new AppError('Software package not found', 404, 'SOFTWARE_NOT_FOUND');
  }
  return {
    ...item,
    calculatedStatus: computeLicenseStatus(item.expiryDate)
  };
};

exports.getExpiring = async (windowDays = 30, asOf = null) => {
  const today = asOf ? new Date(asOf) : new Date();
  const cutoff = addDays(today, windowDays);

  const softwareList = await prisma.software.findMany({
    where: {
      expiryDate: {
        gte: today, // excludes already expired
        lte: cutoff
      }
    },
    include: { dealer: true },
    orderBy: { expiryDate: 'asc' }
  });

  return softwareList.map(item => ({
    ...item,
    calculatedStatus: computeLicenseStatus(item.expiryDate, today, windowDays),
    daysUntilExpiry: daysBetween(today, item.expiryDate)
  }));
};

exports.create = async (data) => {
  if (Number(data.totalLicense) <= 0) {
    throw new AppError('Total license seats must be strictly greater than 0', 422, 'INVALID_LICENSE_COUNT');
  }

  const dealer = await prisma.dealer.findUnique({
    where: { dealerId: Number(data.dealerId) }
  });
  if (!dealer) {
    throw new AppError('Associated dealer not found', 404, 'DEALER_NOT_FOUND');
  }

  try {
    return await prisma.software.create({
      data: {
        softwareName: data.softwareName,
        version: data.version,
        licenseType: data.licenseType,
        totalLicense: Number(data.totalLicense),
        dealerId: Number(data.dealerId),
        expiryDate: new Date(data.expiryDate)
      }
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.update = async (softwareId, data) => {
  const existing = await prisma.software.findUnique({ where: { softwareId } });
  if (!existing) {
    throw new AppError('Software not found', 404, 'SOFTWARE_NOT_FOUND');
  }

  if (data.totalLicense !== undefined && Number(data.totalLicense) <= 0) {
    throw new AppError('Total license seats must be strictly greater than 0', 422, 'INVALID_LICENSE_COUNT');
  }

  try {
    return await prisma.software.update({
      where: { softwareId },
      data: {
        ...data,
        ...(data.totalLicense !== undefined && { totalLicense: Number(data.totalLicense) }),
        ...(data.expiryDate && { expiryDate: new Date(data.expiryDate) })
      }
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.delete = async (softwareId) => {
  const existing = await prisma.software.findUnique({ where: { softwareId } });
  if (!existing) {
    throw new AppError('Software not found', 404, 'SOFTWARE_NOT_FOUND');
  }

  try {
    return await prisma.software.delete({ where: { softwareId } });
  } catch (error) {
    throw mapDbError(error);
  }
};

