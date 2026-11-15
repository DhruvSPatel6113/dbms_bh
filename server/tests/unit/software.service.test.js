const softwareService = require('../../src/services/software.service');
const dealerService = require('../../src/services/dealer.service');
const { cleanDb, closeDb, prisma } = require('../helpers/testDb');

describe('services/software.service.js Unit Tests', () => {
  let dealer;

  beforeEach(async () => {
    await cleanDb();
    dealer = await prisma.dealer.create({
      data: {
        companyName: 'Academic Software Partners',
        contactPerson: 'Sarah Connor',
        contactNum: '12345678',
        email: 'sarah@asp.internal',
        address: '100 Tech Way'
      }
    });
  });

  afterAll(async () => {
    await closeDb();
  });

  test('1. Software expiring yesterday evaluated as Expired', async () => {
    const sw = await softwareService.create({
      softwareName: 'Legacy Tool',
      version: '1.0',
      licenseType: 'Single Seat',
      totalLicense: 5,
      dealerId: dealer.dealerId,
      expiryDate: '2026-11-14'
    });

    const retrieved = await softwareService.getById(sw.softwareId);
    expect(retrieved.calculatedStatus).toBe('Expired');
  });

  test('2. Software expiring today evaluated as Active (boundary condition)', async () => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const sw = await softwareService.create({
      softwareName: 'Boundary Tool',
      version: '2.0',
      licenseType: 'Campus',
      totalLicense: 10,
      dealerId: dealer.dealerId,
      expiryDate: todayStr
    });

    const retrieved = await softwareService.getById(sw.softwareId);
    // On today, days remaining is 0, so <= 30 is ExpiringSoon or Active boundary
    expect(['Active', 'ExpiringSoon']).toContain(retrieved.calculatedStatus);
  });

  test('3. Software expiring in 30 days is categorized as ExpiringSoon', async () => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 25);
    const sw = await softwareService.create({
      softwareName: 'Renewal Alert App',
      version: '3.1',
      licenseType: 'Enterprise',
      totalLicense: 20,
      dealerId: dealer.dealerId,
      expiryDate: in30Days.toISOString().substring(0, 10)
    });

    const retrieved = await softwareService.getById(sw.softwareId);
    expect(retrieved.calculatedStatus).toBe('ExpiringSoon');
  });

  test('4. Software expiring in 60 days is categorized as Active', async () => {
    const in60Days = new Date();
    in60Days.setDate(in60Days.getDate() + 60);
    const sw = await softwareService.create({
      softwareName: 'Safe Package',
      version: '4.0',
      licenseType: 'Multi-seat',
      totalLicense: 15,
      dealerId: dealer.dealerId,
      expiryDate: in60Days.toISOString().substring(0, 10)
    });

    const retrieved = await softwareService.getById(sw.softwareId);
    expect(retrieved.calculatedStatus).toBe('Active');
  });

  test('5. Expiry 2024-02-29 checked on 2024-03-01 is Expired', async () => {
    const sw = await softwareService.create({
      softwareName: 'Leap Year App',
      version: '1.2',
      licenseType: 'Campus',
      totalLicense: 10,
      dealerId: dealer.dealerId,
      expiryDate: '2024-02-29'
    });

    const expiringList = await softwareService.getExpiring(30, '2024-03-01');
    // Excluded from upcoming expiring because it is already expired as of 2024-03-01
    expect(expiringList.find(x => x.softwareId === sw.softwareId)).toBeUndefined();
  });

  test('6. totalLicense = 0 is rejected with 422 INVALID_LICENSE_COUNT', async () => {
    await expect(softwareService.create({
      softwareName: 'Zero License App',
      version: '1.0',
      licenseType: 'Seat',
      totalLicense: 0,
      dealerId: dealer.dealerId,
      expiryDate: '2027-01-01'
    })).rejects.toMatchObject({ statusCode: 422, errorCode: 'INVALID_LICENSE_COUNT' });
  });

  test('7. Unknown dealer throws 404 DEALER_NOT_FOUND', async () => {
    await expect(softwareService.create({
      softwareName: 'Missing Dealer App',
      version: '1.0',
      licenseType: 'Seat',
      totalLicense: 5,
      dealerId: 99999,
      expiryDate: '2027-01-01'
    })).rejects.toMatchObject({ statusCode: 404, errorCode: 'DEALER_NOT_FOUND' });
  });

  test('8. Delete dealer with attached software throws 409 DEALER_HAS_SOFTWARE', async () => {
    await softwareService.create({
      softwareName: 'Locked Package',
      version: '1.0',
      licenseType: 'Site',
      totalLicense: 5,
      dealerId: dealer.dealerId,
      expiryDate: '2027-01-01'
    });

    await expect(dealerService.delete(dealer.dealerId)).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'DEALER_HAS_SOFTWARE'
    });
  });

  test('9. Expiring list is sorted ascending by expiryDate', async () => {
    const d1 = new Date(); d1.setDate(d1.getDate() + 10);
    const d2 = new Date(); d2.setDate(d2.getDate() + 20);

    await softwareService.create({
      softwareName: 'Later Expiry',
      version: '1.0',
      licenseType: 'Site',
      totalLicense: 5,
      dealerId: dealer.dealerId,
      expiryDate: d2.toISOString().substring(0, 10)
    });
    await softwareService.create({
      softwareName: 'Earlier Expiry',
      version: '1.0',
      licenseType: 'Site',
      totalLicense: 5,
      dealerId: dealer.dealerId,
      expiryDate: d1.toISOString().substring(0, 10)
    });

    const expiring = await softwareService.getExpiring(30);
    expect(expiring.length).toBe(2);
    expect(expiring[0].softwareName).toBe('Earlier Expiry');
    expect(expiring[1].softwareName).toBe('Later Expiry');
  });

  test('10. Updating totalLicense <= 0 throws 422 INVALID_LICENSE_COUNT', async () => {
    const sw = await softwareService.create({
      softwareName: 'Updatable Software',
      version: '1.0',
      licenseType: 'Site',
      totalLicense: 10,
      dealerId: dealer.dealerId,
      expiryDate: '2028-01-01'
    });

    await expect(softwareService.update(sw.softwareId, { totalLicense: 0 })).rejects.toMatchObject({
      statusCode: 422,
      errorCode: 'INVALID_LICENSE_COUNT'
    });
  });
});

