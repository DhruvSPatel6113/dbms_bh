const { z } = require('zod');

exports.createDealerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').trim(),
  contactPerson: z.string().min(1, 'Contact person is required').trim(),
  contactNum: z.string().min(5, 'Contact number must be at least 5 digits').trim(),
  email: z.string().email('Invalid email address').trim(),
  address: z.string().min(1, 'Address is required').trim()
});

exports.updateDealerSchema = z.object({
  companyName: z.string().min(1).trim().optional(),
  contactPerson: z.string().min(1).trim().optional(),
  contactNum: z.string().min(5).trim().optional(),
  email: z.string().email().trim().optional(),
  address: z.string().min(1).trim().optional()
});

