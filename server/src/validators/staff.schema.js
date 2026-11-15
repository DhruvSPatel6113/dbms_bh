const { z } = require('zod');
const { isoDateSchema } = require('./common.schema');

exports.createStaffSchema = z.object({
  staffName: z.string().min(1, 'Staff name is required').trim(),
  email: z.string().email('Invalid email address').trim(),
  phoneNo: z.string().min(5, 'Phone number must be at least 5 digits').trim(),
  address: z.string().min(1, 'Address is required').trim(),
  shift: z.enum(['Morning', 'Evening', 'Night']),
  dateOfJoining: isoDateSchema,
  qualification: z.string().min(1, 'Qualification is required').trim(),
  designation: z.enum(['Admin', 'Librarian'])
});

exports.updateStaffSchema = z.object({
  staffName: z.string().min(1).trim().optional(),
  phoneNo: z.string().min(5).trim().optional(),
  address: z.string().min(1).trim().optional(),
  shift: z.enum(['Morning', 'Evening', 'Night']).optional(),
  qualification: z.string().min(1).trim().optional(),
  designation: z.enum(['Admin', 'Librarian']).optional()
});
