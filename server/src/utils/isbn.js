/**
 * ISBN-10 and ISBN-13 checksum validation utility.
 */

function isValidISBN(raw) {
  if (!raw || typeof raw !== 'string') return false;

  const clean = raw.replace(/[-\s]/g, '').toUpperCase();

  if (clean.length === 10) {
    // ISBN-10 checksum: sum(d_i * (10 - i)) % 11 === 0
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const code = clean.charCodeAt(i);
      if (code < 48 || code > 57) return false; // Not a digit
      sum += (code - 48) * (10 - i);
    }

    const lastChar = clean[9];
    if (lastChar === 'X') {
      sum += 10;
    } else {
      const code = lastChar.charCodeAt(0);
      if (code < 48 || code > 57) return false;
      sum += (code - 48);
    }

    return sum % 11 === 0;
  }

  if (clean.length === 13) {
    // ISBN-13 checksum: sum(d_i * (1 or 3)) % 10 === 0
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const code = clean.charCodeAt(i);
      if (code < 48 || code > 57) return false; // Non-digit
      const digit = code - 48;
      sum += (i % 2 === 0) ? digit : digit * 3;
    }

    return sum % 10 === 0;
  }

  return false;
}

module.exports = {
  isValidISBN
};

