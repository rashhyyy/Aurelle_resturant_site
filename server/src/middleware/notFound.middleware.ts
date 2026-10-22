import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Resource not found: ${req.method} ${req.originalUrl || req.url}`,
    timestamp: new Date().toISOString(),
  });
};
