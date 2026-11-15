const request = require('supertest');
const app = require('../../src/app');
const { cleanDb, closeDb, prisma } = require('../helpers/testDb');
const { getAuthToken } = require('../helpers/tokens');
const { generateISBN13 } = require('../helpers/factories');

describe('Full-Stack API Integration Tests (tests/integration/api.test.js)', () => {
  let adminToken;
  let librarianToken;

  beforeEach(async () => {
    await cleanDb();
    adminToken = getAuthToken('Admin', 1);
    librarianToken = getAuthToken('Librarian', 2);
  });

  afterAll(async () => {
    await closeDb();
  });

  test('1. Full Lifecycle: Create book -> register member -> issue -> return (avl restored)', async () => {
    // 1. Create Book
    const bookRes = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Software Engineering',
        author: 'Sommerville',
        isbn: generateISBN13(),
        category: 'CS',
        totalCopies: 2,
        publication: 'Pearson',
        dateOfPublish: '2015-01-01',
        cost: 60.00
      });
    expect(bookRes.status).toBe(201);
    const bookId = bookRes.body.data.bookId;

    // 2. Register Member
    const memberRes = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        fullName: 'Jane Doe',
        email: 'jane.doe@university.edu',
        phone: '12345678',
        membershipType: 'Student'
      });
    expect(memberRes.status).toBe(201);
    const memberId = memberRes.body.data.memberId;

    // 3. Issue Book
    const issueRes = await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        bookId,
        memberId,
        issueDate: '2024-05-01'
      });
    expect(issueRes.status).toBe(201);
    const txnId = issueRes.body.data.txnId;

    // Check avl_copies decremented
    const bookAfterIssue = await prisma.book.findUnique({ where: { bookId } });
    expect(bookAfterIssue.avlCopies).toBe(1);

    // 4. Return Book
    const returnRes = await request(app)
      .post(`/api/txns/${txnId}/return`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        returnDate: '2024-05-10'
      });
    expect(returnRes.status).toBe(200);

    // Check avl_copies restored
    const bookAfterReturn = await prisma.book.findUnique({ where: { bookId } });
    expect(bookAfterReturn.avlCopies).toBe(2);
  });

  test('2. Issue book with avl=0 returns 409 NO_COPIES_AVAILABLE', async () => {
    const book = await prisma.book.create({
      data: {
        title: 'Exhausted Book',
        author: 'Author',
        isbn: generateISBN13(),
        category: 'CS',
        totalCopies: 1,
        avlCopies: 0,
        publication: 'Press',
        dateOfPublish: new Date('2020-01-01'),
        cost: 50
      }
    });

    const member = await prisma.member.create({
      data: {
        fullName: 'Member',
        email: 'member@test.internal',
        phone: '12345',
        joinDate: new Date('2024-01-01'),
        renewDate: new Date('2026-01-01'),
        membershipType: 'Student',
        status: 'Active'
      }
    });

    const res = await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: '2024-05-01'
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NO_COPIES_AVAILABLE');
  });

  test('3. Issue to expired member returns 422 MEMBERSHIP_EXPIRED', async () => {
    const book = await prisma.book.create({
      data: {
        title: 'Available Book',
        author: 'Author',
        isbn: generateISBN13(),
        category: 'CS',
        totalCopies: 3,
        avlCopies: 3,
        publication: 'Press',
        dateOfPublish: new Date('2020-01-01'),
        cost: 50
      }
    });

    const member = await prisma.member.create({
      data: {
        fullName: 'Expired Member',
        email: 'expired@test.internal',
        phone: '12345',
        joinDate: new Date('2023-01-01'),
        renewDate: new Date('2024-01-01'), // Expired
        membershipType: 'Student',
        status: 'Active'
      }
    });

    const res = await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: '2024-05-01'
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('MEMBERSHIP_EXPIRED');
  });

  test('4. Late return automatically generates fine record with correct amount', async () => {
    const book = await prisma.book.create({
      data: {
        title: 'Late Return Book',
        author: 'Author',
        isbn: generateISBN13(),
        category: 'CS',
        totalCopies: 3,
        avlCopies: 3,
        publication: 'Press',
        dateOfPublish: new Date('2020-01-01'),
        cost: 100
      }
    });

    const member = await prisma.member.create({
      data: {
        fullName: 'Late Member',
        email: 'late@test.internal',
        phone: '12345',
        joinDate: new Date('2024-01-01'),
        renewDate: new Date('2026-01-01'),
        membershipType: 'Student',
        status: 'Active'
      }
    });

    // Issue with due date 2024-05-15
    const issueRes = await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        bookId: book.bookId,
        memberId: member.memberId,
        issueDate: '2024-05-01',
        dueDate: '2024-05-15'
      });

    const txnId = issueRes.body.data.txnId;

    // Return 5 days late: 2024-05-20 (5 days * Rs 2 = Rs 10)
    const returnRes = await request(app)
      .post(`/api/txns/${txnId}/return`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ returnDate: '2024-05-20' });

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.fine).toBeDefined();
    expect(Number(returnRes.body.fine.fineAmount)).toBe(10);
  });

  test('5. Paying fine allows member to borrow again', async () => {
    const member = await prisma.member.create({
      data: {
        fullName: 'Fined Member',
        email: 'fined@test.internal',
        phone: '12345',
        joinDate: new Date('2024-01-01'),
        renewDate: new Date('2026-01-01'),
        membershipType: 'Student',
        status: 'Active'
      }
    });

    const b1 = await prisma.book.create({
      data: { title: 'B1', author: 'A', isbn: generateISBN13(), category: 'CS', totalCopies: 2, avlCopies: 2, publication: 'P', dateOfPublish: new Date('2020-01-01'), cost: 200 }
    });

    const txn1 = await prisma.txn.create({
      data: { bookId: b1.bookId, memberId: member.memberId, issueDate: new Date('2024-01-01') }
    });

    const fine = await prisma.fine.create({
      data: { txnId: txn1.txnId, memberId: member.memberId, fineAmount: 150, paidStatus: 'Unpaid', reason: 'High fine' }
    });

    // Attempting to borrow is blocked because fine > 100
    const b2 = await prisma.book.create({
      data: { title: 'B2', author: 'A', isbn: generateISBN13(), category: 'CS', totalCopies: 2, avlCopies: 2, publication: 'P', dateOfPublish: new Date('2020-01-01'), cost: 50 }
    });

    const blockedRes = await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ bookId: b2.bookId, memberId: member.memberId, issueDate: '2024-05-01' });

    expect(blockedRes.status).toBe(422);
    expect(blockedRes.body.error.code).toBe('UNPAID_FINES_EXCEED_LIMIT');

    // Pay the fine
    const payRes = await request(app)
      .post(`/api/fines/${fine.fineId}/pay`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ paidDate: '2024-05-02' });
    expect(payRes.status).toBe(200);

    // Issue again: succeeds
    const allowedRes = await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ bookId: b2.bookId, memberId: member.memberId, issueDate: '2024-05-02' });

    expect(allowedRes.status).toBe(201);
  });

  test('6. Unauthenticated requests to protected endpoints return 401 AUTH_REQUIRED', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  test('7. /books/lookup/:isbn returns 422 for invalid ISBN format', async () => {
    const res = await request(app)
      .get('/api/books/lookup/invalid-isbn-123')
      .set('Authorization', `Bearer ${librarianToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_ISBN');
  });

  test('8. Concurrent issue requests: 20 parallel issues for 3 copies yields exactly 3 successes', async () => {
    const book = await prisma.book.create({
      data: {
        title: 'Concurrent Target',
        author: 'Author',
        isbn: generateISBN13(),
        category: 'CS',
        totalCopies: 3,
        avlCopies: 3,
        publication: 'Press',
        dateOfPublish: new Date('2020-01-01'),
        cost: 50
      }
    });

    // Create 20 unique members
    const members = [];
    for (let i = 0; i < 20; i++) {
      members.push(await prisma.member.create({
        data: {
          fullName: `Member ${i}`,
          email: `concurrent${i}@test.internal`,
          phone: '123456',
          joinDate: new Date('2024-01-01'),
          renewDate: new Date('2026-01-01'),
          membershipType: 'Regular',
          status: 'Active'
        }
      }));
    }

    // Dispatch 20 simultaneous issues
    const promises = members.map(m =>
      request(app)
        .post('/api/txns/issue')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          bookId: book.bookId,
          memberId: m.memberId,
          issueDate: '2024-05-01'
        })
    );

    const responses = await Promise.all(promises);
    const successes = responses.filter(r => r.status === 201);
    const rejected = responses.filter(r => r.status === 409);

    expect(successes.length).toBe(3);
    expect(rejected.length).toBe(17);

    const finalBook = await prisma.book.findUnique({ where: { bookId: book.bookId } });
    expect(finalBook.avlCopies).toBe(0);
  });

  test('9. SQL injection strings in query params do not crash or leak data', async () => {
    const res = await request(app)
      .get('/api/books?q=%27%20OR%201=1;%20--')
      .set('Authorization', `Bearer ${librarianToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  test('10. Oversized body (>1MB) returns 413 PAYLOAD_TOO_LARGE', async () => {
    const hugeString = 'a'.repeat(1024 * 1024 + 100);
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(`{"title":"${hugeString}"}`);

    expect(res.status).toBe(413);
  });
});

