const { z } = require('zod');

exports.loginSchema = z.object({
  email: z.string().email('Valid email address is required').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long')
});

exports.signupSchema = z.object({
  staffName: z.string().min(2, 'Enter your full name').trim(),
  email: z.string().email('Enter a valid email address').trim().toLowerCase(),
  phoneNo: z.string().min(5, 'Enter a valid phone number').trim(),
  address: z.string().min(1, 'Enter your address').trim(),
  shift: z.enum(['Morning', 'Evening', 'Night']),
  qualification: z.string().min(1, 'Enter your qualification').trim(),
  password: z.string().min(10, 'Password must be at least 10 characters')
});

exports.updateProfileSchema = z.object({
  staffName: z.string().min(2).trim().optional(),
  phoneNo: z.string().min(5).trim().optional(),
  address: z.string().min(1).trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(10, 'New password must be at least 10 characters').optional()
}).strict().superRefine((data, ctx) => {
  const { currentPassword, newPassword, ...profileFields } = data;
  if (!Object.keys(profileFields).length && !newPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide at least one profile change' });
  }
  if (newPassword && !currentPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['currentPassword'], message: 'Current password is required' });
  }
  if (currentPassword && !newPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newPassword'], message: 'New password is required' });
  }
});
