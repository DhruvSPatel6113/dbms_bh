const { z } = require('zod');
const { isoDateSchema } = require('./common.schema');

exports.financialReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(9999).default(new Date().getUTCFullYear()),
  month: z.coerce.number().int().min(1).max(12).default(new Date().getUTCMonth() + 1)
});

exports.asOfReportQuerySchema = z.object({ asOf: isoDateSchema.optional() });
exports.expiryReportQuerySchema = z.object({
  days: z.coerce.number().int().min(0).max(3650).default(30),
  asOf: isoDateSchema.optional()
});
exports.circulationReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(9999).default(new Date().getUTCFullYear()),
  month: z.coerce.number().int().min(1).max(12).default(new Date().getUTCMonth() + 1)
});
exports.popularReportQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10)
});
