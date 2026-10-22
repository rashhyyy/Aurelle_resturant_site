import { Request, Response, NextFunction } from 'express';
import { Staff } from '../models/staff.model';
import { StaffRole, StaffStatus, StaffPermission, STAFF_PERMISSIONS } from '../types/staff';

/**
 * Ensures the incoming request is authenticated as an ACTIVE staff member via server session.
 * Hydrates req.staff with the latest safe staff representation from the database.
 */
export const requireStaffAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session || !req.session.staff || !req.session.staff.id) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. Please log in.',
      });
      return;
    }

    const staffDoc = await Staff.findById(req.session.staff.id);
    if (!staffDoc) {
      // Session exists for a deleted staff member; destroy session
      req.session.destroy(() => {});
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Staff account no longer exists.',
      });
      return;
    }

    if (staffDoc.status !== StaffStatus.ACTIVE) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Staff account is suspended or inactive.',
      });
      return;
    }

    // Attach latest safe staff object to request
    req.staff = staffDoc.toSafeJSON();
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restricts access to staff accounts matching one of the authorized roles.
 */
export const requireStaffRole = (...allowedRoles: StaffRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.staff) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.staff.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied: Insufficient role permissions.',
      });
      return;
    }

    next();
  };
};

/**
 * Restricts access to staff accounts possessing all of the required permissions.
 */
export const requireStaffPermission = (...requiredPermissions: StaffPermission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.staff) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    const staffPermissions = STAFF_PERMISSIONS[req.staff.role] || [];
    const hasAll = requiredPermissions.every((perm) => staffPermissions.includes(perm));

    if (!hasAll) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied: You lack one or more required permissions for this action.',
      });
      return;
    }

    next();
  };
};

/**
 * Restricts access based on restaurant location.
 * Admins have multi-location access everywhere; other roles must be assigned to the requested location.
 */
export const requireLocationAccess = (locationParam = 'locationId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.staff) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    if (req.staff.role === StaffRole.ADMIN) {
      return next();
    }

    const requestedLocationId =
      (req.params && req.params[locationParam]) ||
      (req.query && (req.query[locationParam] as string)) ||
      (req.body && req.body[locationParam]);

    if (!requestedLocationId) {
      return next();
    }

    const userLocations = req.staff.locationIds || [];
    if (!userLocations.includes(requestedLocationId)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied: You are not authorized for this restaurant location.',
      });
      return;
    }

    next();
  };
};
