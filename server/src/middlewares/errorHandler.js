const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');

exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal error occurred';
  let details = err.details || null;

  // Handle express JSON body parsing errors (malformed or oversized)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    errorCode = 'MALFORMED_JSON';
    message = 'Malformed JSON payload in request body';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = 'Request entity exceeds maximum payload size of 1MB';
  }

  // Hide internal server error details in production
  if (statusCode === 500 && env.NODE_ENV === 'production') {
    message = 'An unexpected internal error occurred';
  }

  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details })
    }
  };

  if (env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

