/**
 * Date utility functions with deterministic UTC normalization and leap-year calculations.
 */

function toUtcMidnight(d) {
  const dateObj = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid Date input');
  }
  return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
}

function isLeapYear(year) {
  const y = Number(year);
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

function daysBetween(startDate, endDate) {
  const utcStart = toUtcMidnight(startDate);
  const utcEnd = toUtcMidnight(endDate);
  const diffMs = utcEnd.getTime() - utcStart.getTime();
  return Math.round(diffMs / 86400000);
}

function addDays(baseDate, days) {
  const utcBase = toUtcMidnight(baseDate);
  const result = new Date(utcBase.getTime());
  result.setUTCDate(result.getUTCDate() + Number(days));
  return result;
}

module.exports = {
  toUtcMidnight,
  isLeapYear,
  daysBetween,
  addDays
};

