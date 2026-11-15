const reportService = require('../services/report.service');

exports.getDefaulters = async (req, res, next) => {
  try {
    const asOf = req.query.asOf;
    const report = await reportService.generateDefaulterReport(asOf);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.getExpiries = async (req, res, next) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const asOf = req.query.asOf;
    const report = await reportService.generateExpiryReport(days, asOf);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.getCirculationSummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const summary = await reportService.getCirculationSummary(
      year ? Number(year) : undefined, 
      month ? Number(month) : undefined
    );
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

exports.getPopularBooks = async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const popular = await reportService.getPopularBooks(limit);
    res.status(200).json({ success: true, data: popular });
  } catch (error) {
    next(error);
  }
};

exports.getFinancialSummary = async (req, res, next) => {
  try {
    const report = await reportService.getFinancialSummary(req.query.year, req.query.month);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
