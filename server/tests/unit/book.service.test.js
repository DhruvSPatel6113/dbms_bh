const bookService = require('../../src/services/book.service');
const { cleanDb, closeDb, prisma } = require('../helpers/testDb');
const { generateISBN13 } = require('../helpers/factories');
const { AppError } = require('../../src/utils/AppError');

describe('services/book.service.js Unit Tests', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  test('1. Create valid book initializes avl_copies equal to total_copies', async () => {
    const book = await bookService.create({
      title: 'Introduction to Algorithms',
      author: 'Cormen et al.',
      isbn: '9780262033848',
      category: 'Computer Science',
      totalCopies: 4,
      publication: 'MIT Press',
      dateOfPublish: '2009-07-31',
      cost: 85.00
    });

    expect(book.bookId).toBeDefined();
    expect(book.totalCopies).toBe(4);
    expect(book.avlCopies).toBe(4);
  });

  test('2. Duplicate ISBN throws 409 DUPLICATE_ISBN', async () => {
    const isbn = generateISBN13();
    await bookService.create({
      title: 'First Book',
      author: 'Author A',
      isbn,
      category: 'CS',
      totalCopies: 2,
      publication: 'Press',
      dateOfPublish: '2020-01-01',
      cost: 50
    });

    await expect(bookService.create({
      title: 'Second Book',
      author: 'Author B',
      isbn,
      category: 'CS',
      totalCopies: 3,
      publication: 'Press',
      dateOfPublish: '2020-01-01',
      cost: 60
    })).rejects.toMatchObject({ statusCode: 409, errorCode: 'DUPLICATE_ISBN' });
  });

  test('3. Invalid ISBN throws 422 INVALID_ISBN', async () => {
    await expect(bookService.create({
      title: 'Invalid Book',
      author: 'Author',
      isbn: '9780000000000',
      category: 'CS',
      totalCopies: 2,
      publication: 'Press',
      dateOfPublish: '2020-01-01',
      cost: 50
    })).rejects.toMatchObject({ statusCode: 422, errorCode: 'INVALID_ISBN' });
  });

  test('4. date_of_publish in the future throws 422 FUTURE_PUBLICATION_DATE', async () => {
    const futureDate = '2099-01-01';
    await expect(bookService.create({
      title: 'Future Book',
      author: 'Time Traveler',
      isbn: generateISBN13(),
      category: 'SciFi',
      totalCopies: 2,
      publication: 'Future Press',
      dateOfPublish: futureDate,
      cost: 100
    })).rejects.toMatchObject({ statusCode: 422, errorCode: 'FUTURE_PUBLICATION_DATE' });
  });

  test('5. Search by partial title case-insensitive returns matching books', async () => {
    await bookService.create({
      title: 'Distributed Systems Principles',
      author: 'Tanenbaum',
      isbn: generateISBN13(),
      category: 'Networking',
      totalCopies: 2,
      publication: 'Pearson',
      dateOfPublish: '2016-01-01',
      cost: 70
    });

    const res = await bookService.search({ q: 'distributed' });
    expect(res.items.length).toBe(1);
    expect(res.items[0].title).toContain('Distributed Systems');
  });

  test('6. Search with SQL injection patterns is parameterized and safe', async () => {
    const res = await bookService.search({ q: "'; DROP TABLE book; --" });
    expect(res.items.length).toBe(0);
    expect(res.pagination.total).toBe(0);
  });

  test('7. Pagination page beyond last returns empty list with valid total', async () => {
    const res = await bookService.search({ page: 999, limit: 10 });
    expect(res.items).toEqual([]);
    expect(res.pagination.page).toBe(999);
  });

  test('8. Delete book with loan history throws 409 BOOK_HAS_TRANSACTIONS', async () => {
    const book = await bookService.create({
      title: 'Loaned Book',
      author: 'Author',
      isbn: generateISBN13(),
      category: 'CS',
      totalCopies: 2,
      publication: 'Press',
      dateOfPublish: '2020-01-01',
      cost: 50
    });

    const member = await prisma.member.create({
      data: {
        fullName: 'Borrower',
        email: 'borrower@test.internal',
        phone: '12345',
        joinDate: new Date('2024-01-01'),
        renewDate: new Date('2026-01-01'),
        membershipType: 'Student',
        status: 'Active'
      }
    });

    await prisma.txn.create({
      data: {
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: new Date('2024-05-01'),
        dueDate: new Date('2024-05-15'),
        status: 'Issued'
      }
    });

    await expect(bookService.delete(book.bookId)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'BOOK_HAS_TRANSACTIONS'
    });
  });

  test('9. Lower total below on-loan copies throws 409 TOTAL_BELOW_ON_LOAN', async () => {
    const book = await bookService.create({
      title: 'Constrained Book',
      author: 'Author',
      isbn: generateISBN13(),
      category: 'CS',
      totalCopies: 3,
      publication: 'Press',
      dateOfPublish: '2020-01-01',
      cost: 50
    });

    const member = await prisma.member.create({
      data: {
        fullName: 'Borrower',
        email: 'borrower2@test.internal',
        phone: '12345',
        joinDate: new Date('2024-01-01'),
        renewDate: new Date('2026-01-01'),
        membershipType: 'Student',
        status: 'Active'
      }
    });

    // Issue 2 copies
    await prisma.txn.create({
      data: { bookId: book.bookId, memberId: member.memberId, issueDate: new Date('2024-05-01'), dueDate: new Date('2024-05-15'), status: 'Issued' }
    });

    // Now total=3, avl=2, onLoan=1. If we try updating total to 0, it should fail
    await expect(bookService.update(book.bookId, { totalCopies: 0 })).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'TOTAL_BELOW_ON_LOAN'
    });
  });

  test('10. Unicode title (Devanagari script) is stored and retrieved properly', async () => {
    const unicodeTitle = 'भारतीय संविधान और ग्रंथालय';
    const book = await bookService.create({
      title: unicodeTitle,
      author: 'डॉ. अम्बेडकर',
      isbn: generateISBN13(),
      category: 'Law',
      totalCopies: 2,
      publication: 'National Press',
      dateOfPublish: '2020-01-01',
      cost: 65
    });

    const retrieved = await bookService.getById(book.bookId);
    expect(retrieved.title).toBe(unicodeTitle);
  });
});

