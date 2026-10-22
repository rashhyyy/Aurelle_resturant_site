import { Request, Response, NextFunction } from 'express';
import { logger, redactSensitiveData } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Log request summary
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      logger.error(message);
    } else if (statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }

    // In debug mode, log redacted payload
    if (process.env.NODE_ENV === 'development' && ['POST', 'PUT', 'PATCH'].includes(method)) {
      if (req.body && Object.keys(req.body).length > 0) {
        logger.debug(`Payload [${method} ${url}]:`, redactSensitiveData(req.body));
      }
    }
  });

  next();
};
