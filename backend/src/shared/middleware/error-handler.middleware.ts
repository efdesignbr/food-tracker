import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn('Operational error', {
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  logger.error('Unexpected error', {
    error: err,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}
