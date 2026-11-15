const { cleanDb, closeDb, prisma } = require('../helpers/testDb');
const { createBook, createMember } = require('../helpers/factories');

describe('Database Triggers & Stock Management (tests/db/triggers.test.js)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  test('1. Issue book with avl=5 decrements avl to 4 and sets status to Issued', async () => {
    const book = await createBook({ totalCopies: 5, avlCopies: 5 });
    const member = await createMember();

    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01')
      }
    });

    const updatedBook = await prisma.book.findUnique({ where: { bookId: book.bookId } });
    expect(updatedBook.avlCopies).toBe(4);
    expect(txn.status).toBe('Issued');
  });

  test('2. Issue book with avl=0 raises NO_COPIES_AVAILABLE, avl stays 0', async () => {
    const book = await createBook({ totalCopies: 2, avlCopies: 0 });
    const member = await createMember();

    await expect(prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01')
      }
    })).rejects.toThrow(/NO_COPIES_AVAILABLE/);

    const checkBook = await prisma.book.findUnique({ where: { bookId: book.bookId } });
    expect(checkBook.avlCopies).toBe(0);
  });

  test('3. Issue last copy (avl=1) succeeds and leaves avl=0', async () => {
    const book = await createBook({ totalCopies: 3, avlCopies: 1 });
    const member = await createMember();

    await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01')
      }
    });

    const updated = await prisma.book.findUnique({ where: { bookId: book.bookId } });
    expect(updated.avlCopies).toBe(0);
  });

  test('4. Return book increments avl by 1 and sets status to Returned', async () => {
    const book = await createBook({ totalCopies: 5, avlCopies: 5 });
    const member = await createMember();

    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01')
      }
    });

    await prisma.txn.update({
      where: { txnId: txn.txnId },
      data: { returnDate: new Date('2024-05-10') }
    });

    const updatedBook = await prisma.book.findUnique({ where: { bookId: book.bookId } });
    const updatedTxn = await prisma.txn.findUnique({ where: { txnId: txn.txnId } });
    expect(updatedBook.avlCopies).toBe(5);
    expect(updatedTxn.status).toBe('Returned');
  });

  test('5. Return when avl=total keeps avl capped at total (corruption guard)', async () => {
    const book = await createBook({ totalCopies: 3, avlCopies: 3 });
    const member = await createMember();

    // Force create transaction with raw SQL bypassing trigger to simulate out-of-sync stock
    const res = await prisma.$queryRaw`
      INSERT INTO txn (book_id, member_id, issue_date, due_date, status)
      VALUES (${book.bookId}, ${member.memberId}, '2024-05-01', '2024-05-15', 'Issued')
      RETURNING txn_id;
    `;
    const txnId = res[0].txn_id;

    // Return the book
    await prisma.txn.update({
      where: { txnId },
      data: { returnDate: new Date('2024-05-10') }
    });

    const finalBook = await prisma.book.findUnique({ where: { bookId: book.bookId } });
    expect(finalBook.avlCopies).toBe(3);
  });

  test('6. Return twice raises ALREADY_RETURNED', async () => {
    const book = await createBook();
    const member = await createMember();

    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01')
      }
    });

    await prisma.txn.update({
      where: { txnId: txn.txnId },
      data: { returnDate: new Date('2024-05-10') }
    });

    await expect(prisma.txn.update({
      where: { txnId: txn.txnId },
      data: { returnDate: new Date('2024-05-11') }
    })).rejects.toThrow(/ALREADY_RETURNED/);
  });

  test('7. Return date before issue date raises RETURN_BEFORE_ISSUE', async () => {
    const book = await createBook();
    const member = await createMember();

    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-10')
      }
    });

    await expect(prisma.txn.update({
      where: { txnId: txn.txnId },
      data: { returnDate: new Date('2024-05-05') }
    })).rejects.toThrow(/RETURN_BEFORE_ISSUE/);
  });

  test('8. Suspended member issue raises MEMBER_NOT_ACTIVE', async () => {
    const book = await createBook();
    const member = await createMember({ status: 'Suspended' });

    await expect(prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01')
      }
    })).rejects.toThrow(/MEMBER_NOT_ACTIVE/);
  });

  test('9. Member with renew_date yesterday raises MEMBERSHIP_EXPIRED', async () => {
    const book = await createBook();
    const member = await createMember({
      joinDate: '2023-01-01',
      renewDate: '2024-04-30',
      status: 'Active'
    });

    await expect(prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01')
      }
    })).rejects.toThrow(/MEMBERSHIP_EXPIRED/);
  });

  test('10. Member with renew_date equal to issue date is allowed (boundary)', async () => {
    const book = await createBook();
    const member = await createMember({
      joinDate: '2023-05-01',
      renewDate: '2024-05-01',
      status: 'Active'
    });

    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01')
      }
    });

    expect(txn.txnId).toBeDefined();
  });

  test('11. Student issuing 4th book raises LOAN_LIMIT_REACHED (limit 3)', async () => {
    const member = await createMember({ membershipType: 'Student' });
    const b1 = await createBook();
    const b2 = await createBook();
    const b3 = await createBook();
    const b4 = await createBook();

    await prisma.txn.create({ data: { bookId: b1.bookId, memberId: member.memberId, issueDate: new Date('2024-05-01') } });
    await prisma.txn.create({ data: { bookId: b2.bookId, memberId: member.memberId, issueDate: new Date('2024-05-01') } });
    await prisma.txn.create({ data: { bookId: b3.bookId, memberId: member.memberId, issueDate: new Date('2024-05-01') } });

    await expect(prisma.txn.create({
      data: { bookId: b4.bookId, memberId: member.memberId, issueDate: new Date('2024-05-01') }
    })).rejects.toThrow(/LOAN_LIMIT_REACHED/);
  });

  test('12. Premium member issues 10th book, then 11th is rejected', async () => {
    const member = await createMember({ membershipType: 'Premium' });
    const books = [];
    for (let i = 0; i < 11; i++) {
      books.push(await createBook());
    }

    for (let i = 0; i < 10; i++) {
      await prisma.txn.create({
        data: { bookId: books[i].bookId, memberId: member.memberId, issueDate: new Date('2024-05-01') }
      });
    }

    await expect(prisma.txn.create({
      data: { bookId: books[10].bookId, memberId: member.memberId, issueDate: new Date('2024-05-01') }
    })).rejects.toThrow(/LOAN_LIMIT_REACHED/);
  });

  test('13. Unpaid fines = 100 allowed, unpaid fines = 101 rejected', async () => {
    const member = await createMember();
    const book = await createBook();
    const dummyBook = await createBook();

    // Create txn and unpaid fine of Rs 100
    const dummyTxn = await prisma.txn.create({
      data: { bookId: dummyBook.bookId, memberId: member.memberId, issueDate: new Date('2024-01-01') }
    });
    await prisma.fine.create({
      data: { txnId: dummyTxn.txnId, memberId: member.memberId, fineAmount: 100, paidStatus: 'Unpaid', reason: 'Late' }
    });

    // Borrowing at 100 is allowed
    const txnAllowed = await prisma.txn.create({
      data: { bookId: book.bookId, memberId: member.memberId, issueDate: new Date('2024-05-01') }
    });
    expect(txnAllowed.txnId).toBeDefined();

    // Update fine to 100.01
    await prisma.fine.update({
      where: { txnId: dummyTxn.txnId },
      data: { fineAmount: 100.01 }
    });

    const book3 = await createBook();
    await expect(prisma.txn.create({
      data: { bookId: book3.bookId, memberId: member.memberId, issueDate: new Date('2024-05-02') }
    })).rejects.toThrow(/UNPAID_FINES_EXCEED_LIMIT/);
  });

  test('14. Due date auto-set: Student 14 days, Premium 21 days', async () => {
    const student = await createMember({ membershipType: 'Student' });
    const premium = await createMember({ membershipType: 'Premium' });
    const b1 = await createBook();
    const b2 = await createBook();

    const txnStudent = await prisma.txn.create({
      data: { bookId: b1.bookId, memberId: student.memberId, issueDate: new Date('2024-05-01') }
    });
    const txnPremium = await prisma.txn.create({
      data: { bookId: b2.bookId, memberId: premium.memberId, issueDate: new Date('2024-05-01') }
    });

    const studentDue = new Date(txnStudent.dueDate).toISOString().substring(0, 10);
    const premiumDue = new Date(txnPremium.dueDate).toISOString().substring(0, 10);

    expect(studentDue).toBe('2024-05-15'); // +14 days
    expect(premiumDue).toBe('2024-05-22'); // +21 days
  });

  test('15. Reduce total_copies below copies on loan raises TOTAL_BELOW_ON_LOAN', async () => {
    const book = await createBook({ totalCopies: 5, avlCopies: 5 });
    const member = await createMember();

    await prisma.txn.create({
      data: { bookId: book.bookId, memberId: member.memberId, issueDate: new Date('2024-05-01') }
    });

    // Currently 1 on loan (total 5, avl 4). Updating total to 0 must fail
    await expect(prisma.$executeRaw`
      UPDATE book SET total_copies = 0 WHERE book_id = ${book.bookId};
    `).rejects.toThrow(/TOTAL_BELOW_ON_LOAN/);
  });
});

