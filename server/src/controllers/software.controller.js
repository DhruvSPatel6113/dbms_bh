const softwareService = require('../services/software.service');

exports.list = async (req, res, next) => {
  try {
    const software = await softwareService.list(req.query);
    res.status(200).json({ success: true, data: software });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const item = await softwareService.getById(Number(req.params.id));
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.getExpiring = async (req, res, next) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const items = await softwareService.getExpiring(days, req.query.asOf);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const software = await softwareService.create(req.body);
    res.status(201).json({ success: true, data: software });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const software = await softwareService.update(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: software });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await softwareService.delete(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Software deleted successfully' });
  } catch (error) {
    next(error);
  }
};

