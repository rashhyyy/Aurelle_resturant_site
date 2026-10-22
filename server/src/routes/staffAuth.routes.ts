import { Router } from 'express';
import {
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  getCsrfToken,
} from '../controllers/staffAuth.controller';
import { requireStaffAuth } from '../middleware/staffAuth.middleware';
import { staffAuthLimiter, passwordResetLimiter } from '../middleware/rateLimiter.middleware';
import { verifyCsrf } from '../middleware/csrf.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/staffAuth.validation';

const router = Router();

// CSRF token retrieval for frontends
router.get('/csrf', getCsrfToken);

// Authentication lifecycle
router.post('/login', staffAuthLimiter, validate(loginSchema), login);
router.post('/logout', logout);

// Profile & session inspection
router.get('/me', requireStaffAuth, getMe);

// Credential management
router.post(
  '/change-password',
  requireStaffAuth,
  verifyCsrf,
  validate(changePasswordSchema),
  changePassword
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

export const staffAuthRouter = router;
