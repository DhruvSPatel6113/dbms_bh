const { AppError } = require('../utils/AppError');

exports.roleGuard = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const userRole = req.user.designation;
    if (!allowedRoles.includes(userRole)) {
      return next(new AppError(`Access forbidden: Role '${userRole}' is not authorized for this resource`, 403, 'FORBIDDEN_ROLE'));
    }

    next();
  };
};

