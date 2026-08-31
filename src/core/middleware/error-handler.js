import { AppError } from '../errors/app-error.js';

export const notFoundHandler = (request, _response, next) => {
  next(
    new AppError(`Route not found: ${request.method} ${request.originalUrl}`, {
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
    }),
  );
};

export const errorHandler = (error, _request, response, _next) => {
  const statusCode = error.statusCode ?? 500;
  const isOperational = error instanceof AppError;

  if (!isOperational) {
    console.error(error);
  }

  const body = {
    success: false,
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message: isOperational ? error.message : 'An unexpected error occurred',
    },
  };

  if (error.details !== undefined) {
    body.error.details = error.details;
  }

  response.status(statusCode).json(body);
};

