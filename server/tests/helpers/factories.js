const prisma = require('../../src/config/db');

let isbnCounter = 0;
let emailCounter = 1000;

function generateISBN13() {
  isbnCounter++;
  const base = `978030640${String(isbnCounter).padStart(3, '0')}`;
  // compute 13th check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(base[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${base}${check}`;
}

async function createBook(overrides = {}) {
  const isbn = overrides.isbn || generateISBN13();
  const total = overrides.totalCopies !== undefined ? overrides.totalCopies : 5;
  const avl = overrides.avlCopies !== undefined ? overrides.avlCopies : total;

  return prisma.book.create({
    data: {
      title: overrides.title || `Test Book ${isbnCounter}`,
      author: overrides.author || 'Test Author',
      isbn,
      category: overrides.category || 'Computer Science',
      totalCopies: total,
      avlCopies: avl,
      publication: overrides.publication || 'Academic Press',
      dateOfPublish: overrides.dateOfPublish ? new Date(overrides.dateOfPublish) : new Date('2020-01-01'),
      cost: overrides.cost !== undefined ? overrides.cost : 100.00
    }
  });
}

async function createMember(overrides = {}) {
  emailCounter++;
  return prisma.member.create({
    data: {
      fullName: overrides.fullName || `Member ${emailCounter}`,
      email: overrides.email || `member${emailCounter}@test.internal`,
      phone: overrides.phone || '+1-555-0999',
      joinDate: overrides.joinDate ? new Date(overrides.joinDate) : new Date('2024-01-01'),
      renewDate: overrides.renewDate ? new Date(overrides.renewDate) : new Date('2027-01-01'),
      membershipType: overrides.membershipType || 'Regular',
      status: overrides.status || 'Active'
    }
  });
}

async function createDealer(overrides = {}) {
  return prisma.dealer.create({
    data: {
      companyName: overrides.companyName || 'Test Dealer Corp',
      contactPerson: overrides.contactPerson || 'John Dealer',
      contactNum: overrides.contactNum || '+1-800-999-0000',
      email: overrides.email || `dealer${Date.now()}@vendor.internal`,
      address: overrides.address || '100 Vendor Way'
    }
  });
}

async function createStaff(overrides = {}) {
  emailCounter++;
  return prisma.staff.create({
    data: {
      staffName: overrides.staffName || 'Staff Member',
      email: overrides.email || `staff${emailCounter}@library.internal`,
      phoneNo: overrides.phoneNo || '+1-555-1234',
      address: overrides.address || 'Staff Housing',
      shift: overrides.shift || 'Morning',
      dateOfJoining: overrides.dateOfJoining ? new Date(overrides.dateOfJoining) : new Date('2020-01-01'),
      qualification: overrides.qualification || 'B.A.',
      designation: overrides.designation || 'Librarian'
    }
  });
}

module.exports = {
  createBook,
  createMember,
  createDealer,
  createStaff,
  generateISBN13
};
