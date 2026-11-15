const { daysBetween } = require('./dates');
const { AppError } = require('./AppError');

/**
 * Calculates fine amount capped at the book's replacement cost.
 * @param {Date|string} dueDate 
 * @param {Date|string} endDate 
 * @param {number} ratePerDay 
 * @param {number} bookCost 
 * @returns {number}
 */
function calculateFineAmount(dueDate, endDate, ratePerDay = 2, bookCost = 0) {
  if (!dueDate || !endDate) {
    throw new AppError('Due date and end date are required for fine calculation', 400, 'INVALID_DATE');
  }

  const cost = Number(bookCost);
  const rate = Number(ratePerDay);

  if (isNaN(cost) || isNaN(rate) || cost < 0 || rate < 0) {
    throw new AppError('Cost and rate must be valid non-negative numbers', 400, 'INVALID_NUMERIC');
  }

  let days = 0;
  try {
    days = daysBetween(dueDate, endDate);
  } catch (err) {
    throw new AppError('Invalid date provided to fine calculator', 400, 'INVALID_DATE');
  }

  if (days <= 0) {
    return 0;
  }

  const rawFine = days * rate;
  const finalFine = Math.min(rawFine, cost);

  // Return formatted decimal number with up to 2 decimal places precision
  return Math.round(finalFine * 100) / 100;
}

module.exports = {
  calculateFineAmount
};

