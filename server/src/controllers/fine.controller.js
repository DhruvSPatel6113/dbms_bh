const fineService = require('../services/fine.service');

exports.list = async (req, res, next) => {
  try {
    const fines = await fineService.list(req.query);
    res.status(200).json({ success: true, data: fines });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const fine = await fineService.getById(Number(req.params.id));
    res.status(200).json({ success: true, data: fine });
  } catch (error) {
    next(error);
  }
};

exports.calculate = async (req, res, next) => {
  try {
    const { asOf, rate } = req.body;
    await fineService.calculateAll(asOf, rate);
    res.status(200).json({ success: true, message: 'Fines calculated and synchronized successfully' });
  } catch (error) {
    next(error);
  }
};

exports.pay = async (req, res, next) => {
  try {
    const fineId = Number(req.params.id);
    const { paidDate } = req.body;
    const fine = await fineService.pay(fineId, paidDate);
    res.status(200).json({ success: true, data: fine });
  } catch (error) {
    next(error);
  }
};

exports.waive = async (req, res, next) => {
  try {
    const fineId = Number(req.params.id);
    const { reason } = req.body;
    const fine = await fineService.waive(fineId, reason);
    res.status(200).json({ success: true, data: fine });
  } catch (error) {
    next(error);
  }
};

exports.getOutstanding = async (req, res, next) => {
  try {
    const memberId = Number(req.params.memberId);
    const outstanding = await fineService.getOutstanding(memberId);
    res.status(200).json({ success: true, data: { memberId, outstanding } });
  } catch (error) {
    next(error);
  }
};

