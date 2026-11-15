const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');

exports.auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required: Missing or malformed Bearer token', 401, 'AUTH_REQUIRED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication signature', 401, 'INVALID_TOKEN'));
  }
};

