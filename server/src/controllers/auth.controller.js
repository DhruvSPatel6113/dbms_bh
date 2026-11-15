const authService = require('../services/auth.service');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.profile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.staffId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const profile = await authService.updateProfile(req.user.staffId, req.body);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};
