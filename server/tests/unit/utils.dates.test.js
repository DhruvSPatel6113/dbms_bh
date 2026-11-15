const { daysBetween, addDays, isLeapYear, toUtcMidnight } = require('../../src/utils/dates');

describe('utils/dates.js Unit Tests', () => {
  test('1. daysBetween same day returns 0', () => {
    expect(daysBetween('2024-05-10', '2024-05-10')).toBe(0);
  });

  test('2. 2024-02-28 to 2024-03-01 returns 2 (leap year)', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });

  test('3. 2023-02-28 to 2023-03-01 returns 1 (non-leap year)', () => {
    expect(daysBetween('2023-02-28', '2023-03-01')).toBe(1);
  });

  test('4. 2100-02-28 to 2100-03-01 returns 1 (century non-leap)', () => {
    expect(daysBetween('2100-02-28', '2100-03-01')).toBe(1);
  });

  test('5. 2000-02-28 to 2000-03-01 returns 2 (quad-century leap)', () => {
    expect(daysBetween('2000-02-28', '2000-03-01')).toBe(2);
  });

  test('6. Year-end boundary 2026-12-31 to 2027-01-01 returns 1', () => {
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });

  test('7. End before start returns negative number', () => {
    expect(daysBetween('2026-06-10', '2026-06-05')).toBe(-5);
  });

  test('8. addDays crossing month and year end produces correct dates', () => {
    const endOfMonth = addDays('2024-01-30', 2);
    expect(endOfMonth.toISOString().substring(0, 10)).toBe('2024-02-01');

    const endOfYear = addDays('2024-12-30', 5);
    expect(endOfYear.toISOString().substring(0, 10)).toBe('2025-01-04');
  });

  test('9. Timezone input normalization: local vs UTC strings produce identical daysBetween', () => {
    const d1 = new Date('2024-06-01T18:30:00+05:30'); // Asia/Kolkata
    const d2 = new Date('2024-06-05T00:00:00Z');
    const days = daysBetween(d1, d2);
    expect(days).toBe(4);
  });

  test('10. isLeapYear correctly handles 1900, 2000, 2024, 2026', () => {
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
  });
});

