const dealerService = require('../services/dealer.service');

exports.list = async (req, res, next) => {
  try {
    const dealers = await dealerService.list();
    res.status(200).json({ success: true, data: dealers });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const dealer = await dealerService.getById(Number(req.params.id));
    res.status(200).json({ success: true, data: dealer });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const dealer = await dealerService.create(req.body);
    res.status(201).json({ success: true, data: dealer });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const dealer = await dealerService.update(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: dealer });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await dealerService.delete(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Dealer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

