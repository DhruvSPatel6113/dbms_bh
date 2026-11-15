const { z } = require('zod');
const { isoDateSchema } = require('./common.schema');

exports.issueBookSchema = z.object({
  bookId: z.coerce.number().int().min(1).max(2147483647, 'Valid bookId is required'),
  memberId: z.coerce.number().int().min(1).max(2147483647, 'Valid memberId is required'),
  issueDate: isoDateSchema.optional(),
  dueDate: isoDateSchema.optional()
}).superRefine((data, ctx) => {
  if (data.issueDate && data.dueDate && data.dueDate < data.issueDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dueDate'], message: 'Due date cannot be before issue date' });
  }
});

exports.returnBookSchema = z.object({
  returnDate: isoDateSchema.optional()
});

exports.renewTxnSchema = z.object({
  asOfDate: isoDateSchema.optional()
});

exports.activeLoanQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

exports.overdueQuerySchema = z.object({
  asOf: isoDateSchema.optional()
});
