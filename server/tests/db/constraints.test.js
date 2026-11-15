const { cleanDb, closeDb, prisma } = require('../helpers/testDb');
const { createBook, createMember, createDealer, generateISBN13 } = require('../helpers/factories');

describe('Database Constraints & Relational Integrity (tests/db/constraints.test.js)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  test('1. Insert book with avl_copies > total_copies is rejected by chk_copies', async () => {
    await expect(prisma.$executeRaw`
      INSERT INTO book (title, author, isbn, category, total_copies, avl_copies, publication, date_of_publish, cost)
      VALUES ('Invalid Stock', 'Author', ${generateISBN13()}, 'CS', 3, 5, 'Press', '2020-01-01', 50.00);
    `).rejects.toThrow();
  });

  test('2. Negative total_copies or negative cost is rejected', async () => {
    await expect(prisma.$executeRaw`
      INSERT INTO book (title, author, isbn, category, total_copies, avl_copies, publication, date_of_publish, cost)
      VALUES ('Negative Stock', 'Author', ${generateISBN13()}, 'CS', -2, -2, 'Press', '2020-01-01', 50.00);
    `).rejects.toThrow();

    await expect(prisma.$executeRaw`
      INSERT INTO book (title, author, isbn, category, total_copies, avl_copies, publication, date_of_publish, cost)
      VALUES ('Negative Cost', 'Author', ${generateISBN13()}, 'CS', 5, 5, 'Press', '2020-01-01', -10.00);
    `).rejects.toThrow();
  });

  test('3. Duplicate ISBN is rejected by unique constraint', async () => {
    const isbn = generateISBN13();
    await createBook({ isbn });
    await expect(createBook({ isbn })).rejects.toThrow();
  });

  test('4. Duplicate member email is rejected by unique constraint', async () => {
    const email = 'duplicate@test.internal';
    await createMember({ email });
    await expect(createMember({ email })).rejects.toThrow();
  });

  test('5. Invalid membership type or status is rejected', async () => {
    await expect(prisma.$executeRaw`
      INSERT INTO member (full_name, email, phone, join_date, renew_date, type_of_membership, status)
      VALUES ('Invalid Type', 'badtype@test.internal', '12345', '2024-01-01', '2025-01-01', 'VIP_GOLD', 'Active');
    `).rejects.toThrow();

    await expect(prisma.$executeRaw`
      INSERT INTO member (full_name, email, phone, join_date, renew_date, type_of_membership, status)
      VALUES ('Invalid Status', 'badstatus@test.internal', '12345', '2024-01-01', '2025-01-01', 'Regular', 'Banned');
    `).rejects.toThrow();
  });

  test('6. renew_date < join_date is rejected by chk_renew', async () => {
    await expect(prisma.$executeRaw`
      INSERT INTO member (full_name, email, phone, join_date, renew_date, type_of_membership, status)
      VALUES ('Backwards Dates', 'backwards@test.internal', '12345', '2024-06-01', '2024-01-01', 'Regular', 'Active');
    `).rejects.toThrow();
  });

  test('7. Txn with due_date < issue_date is rejected by chk_due', async () => {
    const book = await createBook();
    const member = await createMember();
    await expect(prisma.$executeRaw`
      INSERT INTO txn (book_id, member_id, issue_date, due_date, status)
      VALUES (${book.bookId}, ${member.memberId}, '2024-05-10', '2024-05-01', 'Issued');
    `).rejects.toThrow();
  });

  test('8. Txn referencing missing book or member triggers foreign key violation', async () => {
    const member = await createMember();
    await expect(prisma.txn.create({
      data: {
        bookId: 99999,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15'),
        status: 'Issued'
      }
    })).rejects.toThrow();
  });

  test('9. Delete book that has active transactions triggers foreign key restriction', async () => {
    const book = await createBook();
    const member = await createMember();
    await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15'),
        status: 'Issued'
      }
    });

    await expect(prisma.book.delete({ where: { bookId: book.bookId } })).rejects.toThrow();
  });

  test('10. Inserting fine for the same txn twice violates unique txn_id constraint', async () => {
    const book = await createBook();
    const member = await createMember();
    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15'),
        status: 'Issued'
      }
    });

    await prisma.fine.create({
      data: {
        txnId: txn.txnId,
        memberId: member.memberId,
        fineAmount: 10,
        paidStatus: 'Unpaid',
        reason: 'Late'
      }
    });

    await expect(prisma.fine.create({
      data: {
        txnId: txn.txnId,
        memberId: member.memberId,
        fineAmount: 15,
        paidStatus: 'Unpaid',
        reason: 'Late again'
      }
    })).rejects.toThrow();
  });

  test('11. Software total_license <= 0 or missing dealer is rejected', async () => {
    const dealer = await createDealer();
    await expect(prisma.$executeRaw`
      INSERT INTO software (software_name, version, license_type, total_license, dealer_id, expiry_date)
      VALUES ('Zero License', '1.0', 'Site', 0, ${dealer.dealerId}, '2028-01-01');
    `).rejects.toThrow();

    await expect(prisma.$executeRaw`
      INSERT INTO software (software_name, version, license_type, total_license, dealer_id, expiry_date)
      VALUES ('Missing Dealer', '1.0', 'Site', 5, 99999, '2028-01-01');
    `).rejects.toThrow();
  });

  test('12. Two active loans of same book by same member is rejected by partial unique index', async () => {
    const book = await createBook({ totalCopies: 5, avlCopies: 5 });
    const member = await createMember();

    // First loan
    await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15'),
        status: 'Issued'
      }
    });

    // Attempt duplicate second active loan of the same book
    await expect(prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-02'),
        dueDate: new Date('2024-05-16'),
        status: 'Issued'
      }
    })).rejects.toThrow();
  });
});

