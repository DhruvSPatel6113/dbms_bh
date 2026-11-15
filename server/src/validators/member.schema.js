const { z } = require('zod');
const { isoDateSchema, moneySchema } = require('./common.schema');

exports.createMemberSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').trim(),
  email: z.string().email('Invalid email address format').trim(),
  phone: z.string().min(5, 'Phone number must be at least 5 digits').trim(),
  joinDate: isoDateSchema.optional(),
  renewDate: isoDateSchema.optional(),
  paymentAmount: moneySchema.default(0),
  membershipType: z.enum(['Student', 'Regular', 'Premium']),
  status: z.enum(['Active', 'Suspended', 'Expired']).default('Active')
}).superRefine((data, ctx) => {
  if (data.joinDate && data.renewDate && data.renewDate < data.joinDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['renewDate'], message: 'Renewal date cannot be before join date' });
  }
});

exports.updateMemberSchema = z.object({
  fullName: z.string().min(1).trim().optional(),
  email: z.string().email('Invalid email address format').trim().optional(),
  phone: z.string().min(5).trim().optional(),
  membershipType: z.enum(['Student', 'Regular', 'Premium']).optional(),
  status: z.enum(['Active', 'Suspended', 'Expired']).optional()
});

exports.renewMemberSchema = z.object({
  asOfDate: isoDateSchema.optional(),
  paymentAmount: moneySchema.default(0)
});

exports.queryMemberSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(['Active', 'Suspended', 'Expired']).optional(),
  type: z.enum(['Student', 'Regular', 'Premium']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
