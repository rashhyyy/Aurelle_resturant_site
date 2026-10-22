import { Request, Response, NextFunction } from 'express';
import { generateRandomToken } from '../utils/token';
import { env } from '../config/env';

/**
 * Ensures a valid CSRF token exists on the session.
 */
export const ensureCsrfToken = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = generateRandomToken(24);
  }
  next();
};

/**
 * Validates CSRF protection for cookie-authenticated state-changing requests.
 */
export const verifyCsrf = (req: Request, res: Response, next: NextFunction): void => {
  // Safe HTTP methods do not change state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF verification in unit tests or if explicitly disabled
  if (env.NODE_ENV === 'test') {
    return next();
  }

  // Verify Origin / Referer against permitted origins
  const origin = req.headers['origin'] || req.headers['referer'];
  if (origin && typeof origin === 'string') {
    const isAllowedOrigin =
      origin.startsWith(env.CLIENT_ORIGIN) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1');

    if (!isAllowedOrigin && env.NODE_ENV === 'production') {
      res.status(403).json({
        success: false,
        error: 'CSRFError',
        message: 'Cross-site request blocked: Origin not permitted.',
      });
      return;
    }
  }

  // If a session exists and has a csrfToken, and request is authenticated, check token header
  if (req.session && req.session.staff && req.session.csrfToken) {
    const clientToken =
      (req.headers['x-csrf-token'] as string) ||
      (req.headers['x-xsrf-token'] as string) ||
      req.body?._csrf;

    // If clientToken matches or request has custom header protection
    const hasCustomHeader = req.headers['x-requested-with'] === 'XMLHttpRequest';

    if (clientToken && clientToken === req.session.csrfToken) {
      return next();
    }

    if (hasCustomHeader) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: 'CSRFError',
      message: 'Invalid or missing CSRF token for state-changing request.',
    });
    return;
  }

  next();
};
