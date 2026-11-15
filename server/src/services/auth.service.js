const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');

function toUser(staff) {
  return {
    staffId: staff.staffId,
    name: staff.staffName,
    email: staff.email,
    phoneNo: staff.phoneNo,
    address: staff.address,
    qualification: staff.qualification,
    designation: staff.designation,
    shift: staff.shift
  };
}

function createSession(staff) {
  const token = jwt.sign(
    {
      staffId: staff.staffId,
      email: staff.email,
      name: staff.staffName,
      designation: staff.designation
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
  return { token, user: toUser(staff) };
}

exports.login = async (email, password) => {
  const staff = await prisma.staff.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  if (!staff) {
    throw new AppError('Invalid email or credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = staff.password && await bcrypt.compare(password, staff.password);
  if (!isMatch) {
    throw new AppError('Invalid email or credentials', 401, 'INVALID_CREDENTIALS');
  }

  return createSession(staff);
};

exports.signup = async (data) => {
  const existing = await prisma.staff.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('An account with this email already exists', 409, 'DUPLICATE_STAFF_EMAIL');
  }

  const password = await bcrypt.hash(data.password, 12);
  let staff;
  try {
    staff = await prisma.staff.create({
      data: {
        staffName: data.staffName,
        email: data.email,
        phoneNo: data.phoneNo,
        address: data.address,
        shift: data.shift,
        dateOfJoining: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`),
        qualification: data.qualification,
        designation: 'Librarian',
        password
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('An account with this email already exists', 409, 'DUPLICATE_STAFF_EMAIL');
    }
    throw error;
  }

  return createSession(staff);
};

exports.getProfile = async (staffId) => {
  const staff = await prisma.staff.findUnique({ where: { staffId } });
  if (!staff) {
    throw new AppError('Staff profile not found', 404, 'STAFF_NOT_FOUND');
  }
  return toUser(staff);
};

exports.updateProfile = async (staffId, data) => {
  const staff = await prisma.staff.findUnique({ where: { staffId } });
  if (!staff) {
    throw new AppError('Staff profile not found', 404, 'STAFF_NOT_FOUND');
  }

  const { currentPassword, newPassword, ...profileFields } = data;
  if (newPassword) {
    const matches = staff.password && await bcrypt.compare(currentPassword, staff.password);
    if (!matches) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_CURRENT_PASSWORD');
    }
    profileFields.password = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.staff.update({
    where: { staffId },
    data: profileFields
  });
  return toUser(updated);
};
