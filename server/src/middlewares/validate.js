const { AppError } = require('../utils/AppError');

exports.validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return next(new AppError('Request validation failed', 400, 'VALIDATION_ERROR', formattedErrors));
    }

    // Replace input with cleaned, stripped schema output
    req[source] = result.data;
    next();
  };
};

