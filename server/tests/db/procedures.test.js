const { cleanDb, closeDb, prisma } = require('../helpers/testDb');
const { createBook, createMember } = require('../helpers/factories');

describe('Database Stored Procedures & Cursors (tests/db/procedures.test.js)', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  test('1. No overdue txns produces zero fine rows', async () => {
    const book = await createBook();
    const member = await createMember();
    await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15')
      }
    });

    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2024-05-10' AS DATE), 2);`;
    const fines = await prisma.fine.findMany();
    expect(fines.length).toBe(0);
  });

  test('2. Unreturned, due 10 days before as_of generates fine Rs 20 and marks Overdue', async () => {
    const book = await createBook({ cost: 100 });
    const member = await createMember();
    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15')
      }
    });

    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2024-05-25' AS DATE), 2);`;

    const fine = await prisma.fine.findUnique({ where: { txnId: txn.txnId } });
    const updatedTxn = await prisma.txn.findUnique({ where: { txnId: txn.txnId } });

    expect(Number(fine.fineAmount)).toBe(20);
    expect(fine.paidStatus).toBe('Unpaid');
    expect(updatedTxn.status).toBe('Overdue');
  });

  test('3. Returned late (3 days) calculates fine Rs 6 and status stays Returned', async () => {
    const book = await createBook({ cost: 100 });
    const member = await createMember();
    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15')
      }
    });

    await prisma.txn.update({
      where: { txnId: txn.txnId },
      data: { returnDate: new Date('2024-05-18') }
    });

    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2024-05-25' AS DATE), 2);`;

    const fine = await prisma.fine.findUnique({ where: { txnId: txn.txnId } });
    const updatedTxn = await prisma.txn.findUnique({ where: { txnId: txn.txnId } });

    expect(Number(fine.fineAmount)).toBe(6);
    expect(updatedTxn.status).toBe('Returned');
  });

  test('4. Leap year overdue: due 2024-02-28, as_of 2024-03-01 produces 2 days (Rs 4)', async () => {
    const book = await createBook({ cost: 100 });
    const member = await createMember();
    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-02-14'),
        dueDate: new Date('2024-02-28')
      }
    });

    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2024-03-01' AS DATE), 2);`;
    const fine = await prisma.fine.findUnique({ where: { txnId: txn.txnId } });
    expect(Number(fine.fineAmount)).toBe(4);
  });

  test('5. Non-leap year overdue: due 2023-02-28, as_of 2023-03-01 produces 1 day (Rs 2)', async () => {
    const book = await createBook({ cost: 100 });
    const member = await createMember();
    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2023-02-14'),
        dueDate: new Date('2023-02-28')
      }
    });

    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2023-03-01' AS DATE), 2);`;
    const fine = await prisma.fine.findUnique({ where: { txnId: txn.txnId } });
    expect(Number(fine.fineAmount)).toBe(2);
  });

  test('6. Fine capped at book replacement cost', async () => {
    const book = await createBook({ cost: 35.00 });
    const member = await createMember();
    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2020-01-01'),
        dueDate: new Date('2020-01-15')
      }
    });

    // 1000 days overdue at Rs 2 = 2000, but cost is 35
    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2022-10-11' AS DATE), 2);`;
    const fine = await prisma.fine.findUnique({ where: { txnId: txn.txnId } });
    expect(Number(fine.fineAmount)).toBe(35);
  });

  test('7. Procedure is idempotent when re-run on the same date', async () => {
    const book = await createBook({ cost: 100 });
    const member = await createMember();
    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15')
      }
    });

    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2024-05-20' AS DATE), 2);`;
    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2024-05-20' AS DATE), 2);`;

    const fines = await prisma.fine.findMany({ where: { txnId: txn.txnId } });
    expect(fines.length).toBe(1);
    expect(Number(fines[0].fineAmount)).toBe(10);
  });

  test('8. Paid and Waived fines are never overwritten by subsequent calculations', async () => {
    const book = await createBook({ cost: 100 });
    const member = await createMember();
    const txn = await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15')
      }
    });

    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2024-05-20' AS DATE), 2);`;
    const fine = await prisma.fine.findUnique({ where: { txnId: txn.txnId } });

    // Mark as Paid via procedure
    await prisma.$executeRaw`CALL sp_pay_fine(CAST(${fine.fineId} AS INT), CAST('2024-05-21' AS DATE));`;

    // Run fine calculation 10 days later
    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2024-05-30' AS DATE), 2);`;

    const finalFine = await prisma.fine.findUnique({ where: { txnId: txn.txnId } });
    expect(finalFine.paidStatus).toBe('Paid');
    expect(Number(finalFine.fineAmount)).toBe(10); // Unaltered
  });

  test('9. sp_pay_fine rejects double payment or missing ID with FINE_NOT_PAYABLE', async () => {
    await expect(prisma.$executeRaw`
      CALL sp_pay_fine(99999, CAST('2024-05-20' AS DATE));
    `).rejects.toThrow(/FINE_NOT_PAYABLE/);
  });

  test('10. Cursor defaulter report: member with 2 overdue books aggregates accurately', async () => {
    const member = await createMember({ fullName: 'Defaulter Bob' });
    const b1 = await createBook();
    const b2 = await createBook();

    await prisma.txn.create({ data: { bookId: b1.bookId, memberId: member.memberId, issueDate: new Date('2024-05-01'), dueDate: new Date('2024-05-15') } });
    await prisma.txn.create({ data: { bookId: b2.bookId, memberId: member.memberId, issueDate: new Date('2024-05-01'), dueDate: new Date('2024-05-15') } });

    await prisma.$executeRaw`CALL sp_calculate_fines(CAST('2024-05-20' AS DATE), 2);`;
    await prisma.$executeRaw`CALL sp_generate_defaulter_report(CAST('2024-05-20' AS DATE));`;

    const report = await prisma.$queryRaw`
      SELECT * FROM report_defaulters WHERE report_date = CAST('2024-05-20' AS DATE);
    `;

    expect(report.length).toBe(1);
    expect(Number(report[0].overdue_books)).toBe(2);
    expect(Number(report[0].total_fine)).toBe(20);
  });
});

