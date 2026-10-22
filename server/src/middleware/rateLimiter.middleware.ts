import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for staff authentication attempts to mitigate brute-force attacks.
 * Limit: 5 failed requests per 15 minutes per IP address.
 */
export const staffAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 100 : 10, // Generous in tests, strict in dev/prod
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count failed attempts against rate limit
});

/**
 * Rate limiter for password reset requests to prevent abuse.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many password reset requests from this IP. Please try again in 15 minutes.',
  },
});

/**
 * Rate limiter for staff invitation acceptance to prevent token brute force.
 */
export const invitationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many invitation requests from this IP. Please try again in 15 minutes.',
  },
});
