const { z } = require('zod');

exports.isoDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Date must be a valid calendar date');

exports.moneySchema = z.coerce.number()
  .finite('Amount must be a valid number')
  .min(0, 'Amount cannot be negative')
  .max(99999999.99, 'Amount exceeds the supported maximum')
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, 'Amount can have at most two decimal places');

exports.positiveIdSchema = z.coerce.number().int().min(1).max(2147483647, 'ID exceeds the supported range');
exports.idParamSchema = z.object({ id: exports.positiveIdSchema });
exports.memberIdParamSchema = z.object({ memberId: exports.positiveIdSchema });
