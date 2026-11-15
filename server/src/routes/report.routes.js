const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const { auth } = require('../middlewares/auth');
const { roleGuard } = require('../middlewares/roleGuard');
const { validate } = require('../middlewares/validate');
const {
  financialReportQuerySchema,
  asOfReportQuerySchema,
  expiryReportQuerySchema,
  circulationReportQuerySchema,
  popularReportQuerySchema
} = require('../validators/report.schema');

const router = Router();

router.use(auth);

router.get('/defaulters', validate(asOfReportQuerySchema, 'query'), reportController.getDefaulters);
router.get('/expiries', validate(expiryReportQuerySchema, 'query'), reportController.getExpiries);
router.get('/circulation', validate(circulationReportQuerySchema, 'query'), reportController.getCirculationSummary);
router.get('/popular', validate(popularReportQuerySchema, 'query'), reportController.getPopularBooks);
router.get('/financial', roleGuard(['Admin']), validate(financialReportQuerySchema, 'query'), reportController.getFinancialSummary);

module.exports = router;
