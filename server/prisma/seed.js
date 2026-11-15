const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Cleaning existing test/seed data...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE fine, txn, software, dealer, staff, member, book RESTART IDENTITY CASCADE;`);

  console.log('[seed] Seeding Staff...');
  const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
  const staff = await prisma.staff.createMany({
    data: [
      {
        staffName: 'Alice Johnson',
        email: 'alice.admin@library.internal',
        phoneNo: '+1-555-0101',
        address: '101 Library Way, City Center',
        shift: 'Morning',
        dateOfJoining: new Date('2020-01-15'),
        qualification: 'Master of Library Science',
        designation: 'Admin',
        password: hashedPassword
      },
      {
        staffName: 'Bob Martinez',
        email: 'bob.librarian@library.internal',
        phoneNo: '+1-555-0102',
        address: '204 Oak Street, Midtown',
        shift: 'Evening',
        dateOfJoining: new Date('2021-06-01'),
        qualification: 'Bachelor of Arts in English',
        designation: 'Librarian',
        password: hashedPassword
      },
      {
        staffName: 'Charlie Clark',
        email: 'charlie.librarian@library.internal',
        phoneNo: '+1-555-0103',
        address: '305 Pine Road, Suburbs',
        shift: 'Night',
        dateOfJoining: new Date('2022-03-10'),
        qualification: 'Diploma in Information Systems',
        designation: 'Librarian',
        password: hashedPassword
      },
      {
        staffName: 'Diana Prince',
        email: 'diana.admin@library.internal',
        phoneNo: '+1-555-0104',
        address: '401 Maple Ave, West End',
        shift: 'Morning',
        dateOfJoining: new Date('2019-11-20'),
        qualification: 'M.Sc. Computer Science',
        designation: 'Admin',
        password: hashedPassword
      },
      {
        staffName: 'Evan Wright',
        email: 'evan.librarian@library.internal',
        phoneNo: '+1-555-0105',
        address: '502 Elm Blvd, Downtown',
        shift: 'Evening',
        dateOfJoining: new Date('2023-08-01'),
        qualification: 'B.Sc. Library Management',
        designation: 'Librarian',
        password: hashedPassword
      }
    ]
  });

  console.log('[seed] Seeding Dealers...');
  const dealers = await prisma.dealer.createMany({
    data: [
      {
        companyName: 'SysLib Solutions Inc',
        contactPerson: 'David Miller',
        contactNum: '+1-800-555-1111',
        email: 'sales@syslib.com',
        address: '500 Tech Blvd, Silicon Valley, CA'
      },
      {
        companyName: 'Academic Resource Network',
        contactPerson: 'Karen Davies',
        contactNum: '+1-800-555-2222',
        email: 'support@arn.org',
        address: '120 University Avenue, Boston, MA'
      },
      {
        companyName: 'CyberGuard Security Partners',
        contactPerson: 'Frank Vance',
        contactNum: '+1-800-555-3333',
        email: 'licensing@cyberguard.net',
        address: '88 Cyber Park, Austin, TX'
      }
    ]
  });

  console.log('[seed] Seeding Software...');
  await prisma.software.createMany({
    data: [
      {
        softwareName: 'Koha Integrated Library System',
        version: '23.11',
        licenseType: 'Enterprise Open Source',
        totalLicense: 50,
        dealerId: 1,
        expiryDate: new Date('2027-12-31')
      },
      {
        softwareName: 'EBSCOhost Discovery Service',
        version: '4.2',
        licenseType: 'Campus Subscription',
        totalLicense: 1000,
        dealerId: 2,
        expiryDate: new Date('2026-12-15')
      },
      {
        softwareName: 'CyberGuard Antivirus Corporate',
        version: '10.5.2',
        licenseType: 'Annual Multi-Seat',
        totalLicense: 30,
        dealerId: 3,
        expiryDate: new Date('2026-11-25') // Expiring soon
      },
      {
        softwareName: 'JSTOR Academic Archives',
        version: '2024.1',
        licenseType: 'Consortium License',
        totalLicense: 500,
        dealerId: 2,
        expiryDate: new Date('2027-06-30')
      },
      {
        softwareName: 'DeepFreeze Lab Guardian',
        version: '8.80',
        licenseType: 'Perpetual Maintenance',
        totalLicense: 25,
        dealerId: 1,
        expiryDate: new Date('2025-10-01') // Expired
      },
      {
        softwareName: 'Turnitin Originality Suite',
        version: '3.1',
        licenseType: 'Institutional Subscription',
        totalLicense: 200,
        dealerId: 2,
        expiryDate: new Date('2027-01-15')
      }
    ]
  });

  console.log('[seed] Seeding Members...');
  const memberData = [];
  const memberTypes = ['Student', 'Regular', 'Premium'];
  for (let i = 1; i <= 20; i++) {
    const type = memberTypes[i % 3];
    memberData.push({
      fullName: `Member ${i} ${type}`,
      email: `member${i}@university.edu`,
      phone: `+1-555-02${String(i).padStart(2, '0')}`,
      joinDate: new Date('2024-01-01'),
      renewDate: i === 19 ? new Date('2024-01-01') : new Date('2027-01-01'), // member 19 is expired
      membershipType: type,
      status: i === 20 ? 'Suspended' : (i === 19 ? 'Expired' : 'Active')
    });
  }
  await prisma.member.createMany({ data: memberData });

  console.log('[seed] Seeding Books...');
  const categories = ['Computer Science', 'Algorithms', 'Databases', 'Mathematics', 'Literature'];
  const booksData = [];
  for (let i = 1; i <= 50; i++) {
    const total = 3 + (i % 5);
    booksData.push({
      title: `Academic Textbook Volume ${i}`,
      author: `Author ${String.fromCharCode(65 + (i % 26))}. Scholar`,
      isbn: `978030640${String(i).padStart(4, '0')}`,
      category: categories[i % categories.length],
      totalCopies: total,
      avlCopies: total,
      publication: 'University Press International',
      dateOfPublish: new Date(`${2015 + (i % 10)}-05-12`),
      cost: 50.00 + (i * 2.5)
    });
  }
  await prisma.book.createMany({ data: booksData });

  console.log('[seed] Seeding Sample Transactions (via Triggers)...');
  // Issue book 1 to member 1
  await prisma.txn.create({
    data: {
      bookId: 1,
      memberId: 1,
      issueDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-15'),
      status: 'Issued'
    }
  });

  // Issue book 2 to member 2 and return it late
  const txn2 = await prisma.txn.create({
    data: {
      bookId: 2,
      memberId: 2,
      issueDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-15'),
      status: 'Issued'
    }
  });
  await prisma.txn.update({
    where: { txnId: txn2.txnId },
    data: { returnDate: new Date('2026-09-20') }
  });

  console.log('[seed] Seeding complete! Database ready.');
}

main()
  .catch((e) => {
    console.error('[seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
