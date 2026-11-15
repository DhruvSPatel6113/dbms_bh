const prisma = require('../config/db');
const { AppError } = require('../utils/AppError');
const { mapDbError } = require('../utils/dbErrors');

exports.list = async ({ shift, designation }) => {
  const where = {};
  if (shift) where.shift = shift;
  if (designation) where.designation = designation;

  return prisma.staff.findMany({
    where,
    orderBy: { staffId: 'asc' }
  });
};

exports.getById = async (staffId) => {
  const staff = await prisma.staff.findUnique({ where: { staffId } });
  if (!staff) {
    throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
  }
  return staff;
};

exports.create = async (data) => {
  const validShifts = ['Morning', 'Evening', 'Night'];
  if (!validShifts.includes(data.shift)) {
    throw new AppError('Invalid shift value', 422, 'INVALID_SHIFT');
  }

  const joinDate = new Date(data.dateOfJoining);
  if (joinDate > new Date()) {
    throw new AppError('Date of joining cannot be in the future', 422, 'FUTURE_JOINING_DATE');
  }

  const existing = await prisma.staff.findUnique({
    where: { email: data.email }
  });
  if (existing) {
    throw new AppError('A staff member with this email already exists', 409, 'DUPLICATE_STAFF_EMAIL');
  }

  try {
    return await prisma.staff.create({
      data: {
        staffName: data.staffName,
        email: data.email,
        phoneNo: data.phoneNo,
        address: data.address,
        shift: data.shift,
        dateOfJoining: joinDate,
        qualification: data.qualification,
        designation: data.designation
      }
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.update = async (staffId, data) => {
  const existing = await prisma.staff.findUnique({ where: { staffId } });
  if (!existing) {
    throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
  }

  try {
    return await prisma.staff.update({
      where: { staffId },
      data
    });
  } catch (error) {
    throw mapDbError(error);
  }
};

exports.delete = async (staffId) => {
  const existing = await prisma.staff.findUnique({ where: { staffId } });
  if (!existing) {
    throw new AppError('Staff member not found', 404, 'STAFF_NOT_FOUND');
  }

  try {
    return await prisma.staff.delete({ where: { staffId } });
  } catch (error) {
    throw mapDbError(error);
  }
};

