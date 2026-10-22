import { Request, Response, NextFunction } from 'express';
import { UserRole, STAFF_ROLES } from '../types/roles';

/**
 * Ensures user is authenticated via session.
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session || !req.session.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required. Please log in to access this resource.',
    });
    return;
  }
  next();
};

/**
 * Restricts access to users having one of the specified roles.
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session || !req.session.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. Please log in.',
      });
      return;
    }

    const userRole = req.session.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied: You do not have sufficient privileges for this action.',
      });
      return;
    }

    next();
  };
};

/**
 * Restricts access to internal restaurant staff members (Admin, Manager, Chef, Receptionist, Waitstaff).
 */
export const requireStaff = authorizeRoles(...STAFF_ROLES);

/**
 * Restricts access strictly to administrators.
 */
export const requireAdmin = authorizeRoles(UserRole.ADMIN);
