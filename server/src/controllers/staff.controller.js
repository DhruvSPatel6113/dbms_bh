const staffService = require('../services/staff.service');

exports.list = async (req, res, next) => {
  try {
    const staff = await staffService.list(req.query);
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const staff = await staffService.getById(Number(req.params.id));
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const staff = await staffService.create(req.body);
    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const staff = await staffService.update(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await staffService.delete(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

