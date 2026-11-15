const prisma = require('../config/db');
const { AppError } = require('../utils/AppError');
const { mapDbError } = require('../utils/dbErrors');

exports.list = async () => {
  return prisma.dealer.findMany({
    include: { software: true },
    orderBy: { dealerId: 'asc' }
  });
};

exports.getById = async (dealerId) => {
  const dealer = await prisma.dealer.findUnique({
    where: { dealerId },
    include: { software: true }
  });
  if (!dealer) {
    throw new AppError('Dealer not found', 404, 'DEALER_NOT_FOUND');
  }
  return dealer;
};

exports.create = async (data) => {
  try {
    return await prisma.dealer.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        contactNum: data.contactNum,
        email: data.email,
        address: data.address
      }
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.update = async (dealerId, data) => {
  const existing = await prisma.dealer.findUnique({ where: { dealerId } });
  if (!existing) {
    throw new AppError('Dealer not found', 404, 'DEALER_NOT_FOUND');
  }

  try {
    return await prisma.dealer.update({
      where: { dealerId },
      data
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.delete = async (dealerId) => {
  const attachedSoftware = await prisma.software.findFirst({
    where: { dealerId }
  });
  if (attachedSoftware) {
    throw new AppError('Cannot delete dealer that has active software packages supplied', 409, 'DEALER_HAS_SOFTWARE');
  }

  try {
    return await prisma.dealer.delete({ where: { dealerId } });
  } catch (error) {
    throw mapDbError(error);
  }
};

