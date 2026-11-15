const request = require('supertest');
const app = require('../../src/app');
const { cleanDb, closeDb, prisma } = require('../helpers/testDb');
const { getAuthToken } = require('../helpers/tokens');
const { createBook, createMember } = require('../helpers/factories');

describe('Improved library workflows', () => {
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

  test('member search, editing, payment capture, and newest-first pagination work', async () => {
    const first = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Avery Old', email: 'avery.old@test.internal', phone: '1234567', membershipType: 'Student' })
      .expect(201);
    const second = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Morgan New', email: 'morgan.new@test.internal', phone: '7654321', membershipType: 'Premium', paymentAmount: 25.5 })
      .expect(201);

    await request(app)
      .put(`/api/members/${first.body.data.memberId}`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ fullName: 'Avery Updated', email: 'avery.updated@test.internal', membershipType: 'Regular' })
      .expect(200);

    const search = await request(app)
      .get('/api/members?q=avery.updated')
      .set('Authorization', `Bearer ${librarianToken}`)
      .expect(200);
    expect(search.body.data.items).toHaveLength(1);
    expect(search.body.data.items[0].fullName).toBe('Avery Updated');

    const latest = await request(app)
      .get('/api/members?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(latest.body.data.items[0].memberId).toBe(second.body.data.memberId);
    expect(Number(await prisma.membershipPayment.aggregate({ _sum: { amount: true } }).then((result) => result._sum.amount))).toBe(25.5);
  });

  test('book edits preserve active loans, searchable active loans return, and zero stock is permitted', async () => {
    const book = await createBook({ title: 'Searchable Circulation Book', totalCopies: 4 });
    const member = await createMember({ fullName: 'Searchable Borrower' });
    const issue = await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ bookId: book.bookId, memberId: member.memberId })
      .expect(201);

    const active = await request(app)
      .get('/api/txns/active?q=Searchable%20Borrower')
      .set('Authorization', `Bearer ${librarianToken}`)
      .expect(200);
    expect(active.body.data[0].txnId).toBe(issue.body.data.txnId);

    const reduced = await request(app)
      .put(`/api/books/${book.bookId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ totalCopies: 3 })
      .expect(200);
    expect(reduced.body.data.totalCopies).toBe(3);
    expect(reduced.body.data.avlCopies).toBe(2);

    await request(app)
      .put(`/api/books/${book.bookId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ totalCopies: 0 })
      .expect(409);

    await request(app)
      .post(`/api/txns/${issue.body.data.txnId}/return`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({})
      .expect(200);
    const zeroStock = await request(app)
      .put(`/api/books/${book.bookId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ totalCopies: 0 })
      .expect(200);
    expect(zeroStock.body.data).toMatchObject({ totalCopies: 0, avlCopies: 0 });
  });

  test('financial report counts recorded membership receipts and paid fines, and is Admin-only', async () => {
    const created = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Paid Member', email: 'paid@test.internal', phone: '1234567', membershipType: 'Regular', paymentAmount: 40.25 })
      .expect(201);
    const memberId = created.body.data.memberId;
    await request(app)
      .post(`/api/members/${memberId}/renew`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ paymentAmount: 10 })
      .expect(200);

    const book = await createBook();
    const issue = await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ bookId: book.bookId, memberId })
      .expect(201);
    await prisma.fine.create({
      data: { txnId: issue.body.data.txnId, memberId, fineAmount: 5.5, paidStatus: 'Paid', reason: 'Recorded payment', paidDate: new Date() }
    });

    const now = new Date();
    const query = `year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}`;
    const report = await request(app)
      .get(`/api/reports/financial?${query}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(report.body.data).toMatchObject({
      membershipPaymentCount: 2,
      paidFineCount: 1,
      totalRevenue: 55.75
    });
    expect(report.body.data.membershipRevenue).toBe(50.25);
    expect(report.body.data.fineRevenue).toBe(5.5);
    await request(app)
      .post(`/api/txns/${issue.body.data.txnId}/return`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({})
      .expect(200);
    const deleteResponse = await request(app)
      .delete(`/api/members/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);
    expect(deleteResponse.body.error.code).toBe('MEMBER_HAS_PAYMENT_HISTORY');

    await request(app)
      .get(`/api/reports/financial?${query}`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .expect(403);
    await request(app)
      .get('/api/reports/financial?month=13')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  test('loan renewal is recorded once and remains compatible with the database status constraint', async () => {
    const book = await createBook();
    const member = await createMember();
    const issue = await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({ bookId: book.bookId, memberId: member.memberId })
      .expect(201);
    const renewal = await request(app)
      .post(`/api/txns/${issue.body.data.txnId}/renew`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({})
      .expect(200);
    expect(renewal.body.data.status).toBe('Renewed');

    await request(app)
      .post(`/api/txns/${issue.body.data.txnId}/renew`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({})
      .expect(422);
  });

  test('Librarian cannot read staff directory and invalid numeric/date inputs are rejected', async () => {
    await request(app)
      .get('/api/staff')
      .set('Authorization', `Bearer ${librarianToken}`)
      .expect(403);
    await request(app)
      .get('/api/members/-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    await request(app)
      .get('/api/members?q=bad&page=0')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    await request(app)
      .post('/api/txns/issue')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bookId: 1.5, memberId: -1 })
      .expect(400);
    await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Bad Date', email: 'bad-date@test.internal', phone: '1234567', membershipType: 'Student', joinDate: '2024-02-31' })
      .expect(400);
  });
});
