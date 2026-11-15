const memberService = require('../services/member.service');

exports.list = async (req, res, next) => {
  try {
    const members = await memberService.list(req.query);
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const member = await memberService.getById(Number(req.params.id));
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const member = await memberService.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const member = await memberService.update(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

exports.renew = async (req, res, next) => {
  try {
    const member = await memberService.renew(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await memberService.delete(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    next(error);
  }
};
