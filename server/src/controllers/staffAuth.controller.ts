import { Request, Response, NextFunction } from 'express';
import { Staff } from '../models/staff.model';
import { StaffStatus } from '../types/staff';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateRandomToken, hashToken } from '../utils/token';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * POST /api/staff/auth/login
 * Authenticates a staff member, regenerates the session to prevent session fixation,
 * and sets session credentials.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    const staffDoc = await Staff.findOne({ email }).select('+passwordHash');
    if (!staffDoc || !staffDoc.passwordHash) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
      return;
    }

    const isValidPassword = await verifyPassword(staffDoc.passwordHash, password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
      return;
    }

    if (staffDoc.status !== StaffStatus.ACTIVE) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Staff account is suspended or pending activation.',
      });
      return;
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate(async (err) => {
      if (err) {
        logger.error('Failed to regenerate session during staff login:', err);
        return next(err);
      }

      const safeStaff = staffDoc.toSafeJSON();

      req.session.staff = {
        id: safeStaff.id,
        email: safeStaff.email,
        firstName: safeStaff.firstName,
        lastName: safeStaff.lastName,
        role: safeStaff.role,
        status: safeStaff.status,
        locationIds: safeStaff.locationIds,
      };

      req.session.csrfToken = generateRandomToken(24);

      // Record last login time
      staffDoc.lastLoginAt = new Date();
      await staffDoc.save();

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        staff: safeStaff,
        csrfToken: req.session.csrfToken,
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/staff/auth/logout
 * Destroys session and cleans up authentication cookies.
 */
export const logout = (req: Request, res: Response): void => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying staff session during logout:', err);
      }
      res.clearCookie(env.SESSION_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });
      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }
};

/**
 * GET /api/staff/auth/me
 * Returns current authenticated staff profile.
 */
export const getMe = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    staff: req.staff,
  });
};

/**
 * POST /api/staff/auth/change-password
 * Updates the password for the authenticated staff member.
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const staffId = req.staff?.id;
    const { currentPassword, newPassword } = req.body;

    const staffDoc = await Staff.findById(staffId).select('+passwordHash');
    if (!staffDoc || !staffDoc.passwordHash) {
      res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Staff account not found.',
      });
      return;
    }

    const isValid = await verifyPassword(staffDoc.passwordHash, currentPassword);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Current password is incorrect.',
      });
      return;
    }

    staffDoc.passwordHash = await hashPassword(newPassword);
    staffDoc.passwordChangedAt = new Date();
    await staffDoc.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/staff/auth/forgot-password
 * Initiates single-use, time-limited password reset flow with generic response to avoid enumeration.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const staffDoc = await Staff.findOne({ email, status: StaffStatus.ACTIVE });

    let resetToken: string | undefined;

    if (staffDoc) {
      resetToken = generateRandomToken(32);
      staffDoc.passwordResetTokenHash = hashToken(resetToken);
      staffDoc.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL
      await staffDoc.save();
    }

    const responsePayload: Record<string, any> = {
      success: true,
      message: 'If a staff account exists for this email, password reset instructions have been generated.',
    };

    // Return token in non-production environments to facilitate automated testing
    if (env.NODE_ENV !== 'production' && resetToken) {
      responsePayload.resetToken = resetToken;
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/staff/auth/reset-password
 * Completes password reset given a valid hashed single-use token.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = hashToken(token);

    const staffDoc = await Staff.findOne({
      passwordResetTokenHash: hashedToken,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpiresAt');

    if (!staffDoc) {
      res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'Password reset token is invalid or has expired.',
      });
      return;
    }

    staffDoc.passwordHash = await hashPassword(newPassword);
    staffDoc.passwordResetTokenHash = undefined;
    staffDoc.passwordResetExpiresAt = undefined;
    staffDoc.passwordChangedAt = new Date();
    await staffDoc.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new credentials.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/staff/auth/csrf
 * Returns the current CSRF token for the session.
 */
export const getCsrfToken = (req: Request, res: Response): void => {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = generateRandomToken(24);
  }
  res.status(200).json({
    success: true,
    csrfToken: req.session?.csrfToken || '',
  });
};
