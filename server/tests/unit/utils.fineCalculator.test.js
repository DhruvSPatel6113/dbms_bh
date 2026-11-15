const { calculateFineAmount } = require('../../src/utils/fineCalculator');
const { AppError } = require('../../src/utils/AppError');

describe('utils/fineCalculator.js Unit Tests', () => {
  test('1. Returned on due date incurs 0 fine', () => {
    expect(calculateFineAmount('2024-05-10', '2024-05-10', 2, 100)).toBe(0);
  });

  test('2. Returned 1 day early incurs 0 fine', () => {
    expect(calculateFineAmount('2024-05-10', '2024-05-09', 2, 100)).toBe(0);
  });

  test('3. Returned 1 day late incurs Rs. 2 fine', () => {
    expect(calculateFineAmount('2024-05-10', '2024-05-11', 2, 100)).toBe(2);
  });

  test('4. Late across Feb 29 2024 (due 2024-02-28, return 2024-03-01) incurs Rs. 4 fine (2 days)', () => {
    expect(calculateFineAmount('2024-02-28', '2024-03-01', 2, 100)).toBe(4);
  });

  test('5. Same dates in 2023 (due 2023-02-28, return 2023-03-01) incurs Rs. 2 fine (1 day)', () => {
    expect(calculateFineAmount('2023-02-28', '2023-03-01', 2, 100)).toBe(2);
  });

  test('6. Late 1000 days with cost 150 is capped at 150', () => {
    expect(calculateFineAmount('2020-01-01', '2022-09-27', 2, 150)).toBe(150);
  });

  test('7. Cost 0 caps fine at 0', () => {
    expect(calculateFineAmount('2024-01-01', '2024-01-10', 2, 0)).toBe(0);
  });

  test('8. Custom rate 0 produces 0 fine regardless of overdue days', () => {
    expect(calculateFineAmount('2024-01-01', '2024-01-15', 0, 200)).toBe(0);
  });

  test('9. Invalid dates or non-numeric arguments throw AppError', () => {
    expect(() => calculateFineAmount('invalid-date', '2024-01-10', 2, 100)).toThrow(AppError);
    expect(() => calculateFineAmount('2024-01-01', '2024-01-10', -1, 100)).toThrow(AppError);
    expect(() => calculateFineAmount('2024-01-01', '2024-01-10', 2, -50)).toThrow(AppError);
  });

  test('10. Fractional cost 99.99 caps fine precisely at 99.99', () => {
    expect(calculateFineAmount('2024-01-01', '2024-03-01', 2, 99.99)).toBe(99.99);
  });
});

