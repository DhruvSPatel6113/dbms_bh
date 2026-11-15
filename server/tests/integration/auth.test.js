const request = require('supertest');
const app = require('../../src/app');
const { cleanDb, closeDb, prisma } = require('../helpers/testDb');

const signupData = {
  staffName: 'Taylor Reader',
  email: 'taylor.reader@library.internal',
  phoneNo: '+1-555-555-0123',
  address: '12 Reading Lane',
  shift: 'Morning',
  qualification: 'Library Science',
  password: 'A-secure-library-password'
};

describe('Staff signup and profile APIs', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  test('public signup creates a librarian and returns an authenticated session', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ ...signupData, designation: 'Admin' });

    expect(response.status).toBe(201);
    expect(response.body.user.designation).toBe('Librarian');
    expect(response.body.user.email).toBe(signupData.email);
    expect(response.body.token).toBeTruthy();

    const staff = await prisma.staff.findUnique({ where: { email: signupData.email } });
    expect(staff.designation).toBe('Librarian');
    expect(staff.password).not.toBe(signupData.password);
  });

  test('signup rejects duplicate email addresses', async () => {
    await request(app).post('/api/auth/signup').send(signupData).expect(201);
    const response = await request(app).post('/api/auth/signup').send(signupData);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_STAFF_EMAIL');
  });

  test('staff can read and update only their own profile and password', async () => {
    const signup = await request(app).post('/api/auth/signup').send(signupData).expect(201);
    const authorization = `Bearer ${signup.body.token}`;

    const profile = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', authorization)
      .expect(200);
    expect(profile.body.data.email).toBe(signupData.email);

    const forbiddenUpdate = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', authorization)
      .send({ designation: 'Admin' });
    expect(forbiddenUpdate.status).toBe(400);

    const wrongPassword = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', authorization)
      .send({ currentPassword: 'wrong-password', newPassword: 'Another-secure-password' });
    expect(wrongPassword.status).toBe(401);

    const updated = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', authorization)
      .send({
        staffName: 'Taylor A. Reader',
        currentPassword: signupData.password,
        newPassword: 'Another-secure-password'
      })
      .expect(200);
    expect(updated.body.data.name).toBe('Taylor A. Reader');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: signupData.email, password: 'Another-secure-password' })
      .expect(200);
    expect(login.body.user.name).toBe('Taylor A. Reader');
  });
});
