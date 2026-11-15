const { isValidISBN } = require('../../src/utils/isbn');

describe('utils/isbn.js Unit Tests', () => {
  test('1. Valid ISBN-13 (9780306406157) passes', () => {
    expect(isValidISBN('9780306406157')).toBe(true);
  });

  test('2. Valid ISBN-10 (0306406152) passes', () => {
    expect(isValidISBN('0306406152')).toBe(true);
  });

  test('3. Valid ISBN-10 ending with check character X (080442957X) passes', () => {
    expect(isValidISBN('080442957X')).toBe(true);
  });

  test('4. ISBN with hyphens or spaces is sanitized and passes', () => {
    expect(isValidISBN('978-0-306-40615-7')).toBe(true);
    expect(isValidISBN('0-306-40615-2')).toBe(true);
  });

  test('5. Wrong checksum is rejected', () => {
    expect(isValidISBN('9780306406158')).toBe(false);
    expect(isValidISBN('0306406159')).toBe(false);
  });

  test('6. Non-standard length (12 or 14 chars) is rejected', () => {
    expect(isValidISBN('978030640615')).toBe(false);
    expect(isValidISBN('97803064061579')).toBe(false);
  });

  test('7. Letters inside digits are rejected', () => {
    expect(isValidISBN('97803A6406157')).toBe(false);
    expect(isValidISBN('03X6406152')).toBe(false);
  });

  test('8. Empty, null, or undefined returns false without crashing', () => {
    expect(isValidISBN('')).toBe(false);
    expect(isValidISBN(null)).toBe(false);
    expect(isValidISBN(undefined)).toBe(false);
    expect(isValidISBN(1234567890)).toBe(false);
  });
});

