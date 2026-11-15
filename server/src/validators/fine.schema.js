const { z } = require('zod');
const { isoDateSchema, moneySchema } = require('./common.schema');

exports.calculateFineSchema = z.object({
  asOf: isoDateSchema.optional(),
  rate: moneySchema.default(2)
});

exports.payFineSchema = z.object({
  paidDate: isoDateSchema.optional()
});

exports.fineQuerySchema = z.object({
  paidStatus: z.enum(['Unpaid', 'Paid', 'Waived']).optional(),
  memberId: z.coerce.number().int().min(1).max(2147483647).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

exports.waiveFineSchema = z.object({
  reason: z.string().min(3, 'A descriptive waiving reason is required').trim()
});
