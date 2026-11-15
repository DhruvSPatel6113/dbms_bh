const { z } = require('zod');
const { isoDateSchema } = require('./common.schema');

exports.createSoftwareSchema = z.object({
  softwareName: z.string().min(1, 'Software name is required').trim(),
  version: z.string().min(1, 'Version is required').trim(),
  licenseType: z.string().min(1, 'License type is required').trim(),
  totalLicense: z.coerce.number().int().min(1, 'Total licenses must be at least 1').max(2147483647),
  dealerId: z.coerce.number().int().min(1).max(2147483647, 'Valid dealerId is required'),
  expiryDate: isoDateSchema
});

exports.updateSoftwareSchema = z.object({
  softwareName: z.string().min(1).trim().optional(),
  version: z.string().min(1).trim().optional(),
  licenseType: z.string().min(1).trim().optional(),
  totalLicense: z.coerce.number().int().min(1).max(2147483647).optional(),
  expiryDate: isoDateSchema.optional()
});

exports.softwareQuerySchema = z.object({
  dealerId: z.coerce.number().int().min(1).max(2147483647).optional()
});

exports.expiringSoftwareQuerySchema = z.object({
  days: z.coerce.number().int().min(0).max(3650).default(30),
  asOf: isoDateSchema.optional()
});
