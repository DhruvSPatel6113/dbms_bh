const { z } = require('zod');
const { isoDateSchema, moneySchema } = require('./common.schema');

exports.createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  author: z.string().min(1, 'Author is required').trim(),
  isbn: z.string().min(10, 'ISBN must be 10 or 13 characters').max(17).trim(),
  category: z.string().min(1, 'Category is required').trim(),
  totalCopies: z.coerce.number().int().min(1, 'Total copies must be at least 1').max(2147483647),
  publication: z.string().min(1, 'Publication name is required').trim(),
  dateOfPublish: isoDateSchema,
  cost: moneySchema
});

exports.updateBookSchema = z.object({
  title: z.string().min(1).trim().optional(),
  author: z.string().min(1).trim().optional(),
  category: z.string().min(1).trim().optional(),
  totalCopies: z.coerce.number().int().min(0).max(2147483647).optional(),
  publication: z.string().min(1).trim().optional(),
  dateOfPublish: isoDateSchema.optional(),
  cost: moneySchema.optional()
});

exports.queryBookSchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  isbn: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
