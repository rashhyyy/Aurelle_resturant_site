import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  // Handle known application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Zod Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.flatten().fieldErrors;
  }
  // Handle Mongoose / MongoDB errors without importing mongoose directly
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  } else if ('code' in err && (err as { code: number }).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry detected';
  } else if (err.message) {
    message = err.message;
    if (res.statusCode && res.statusCode !== 200) {
      statusCode = res.statusCode;
    }
  }

  // Log error safely
  logger.error(`[Global Error Handler] [${statusCode}] ${message}`, {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Respond safely to client
  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    timestamp: new Date().toISOString(),
  });
};
