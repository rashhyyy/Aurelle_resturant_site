import { Router, Request, Response } from 'express';
import {
  requireStaffAuth,
  requireStaffRole,
  requireStaffPermission,
  requireLocationAccess,
} from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';

const router = Router();

// Protect all routes with staff authentication
router.use(requireStaffAuth);

// ADMIN: Full administrative access
router.get(
  '/admin/overview',
  requireStaffRole(StaffRole.ADMIN),
  requireStaffPermission('staff.manage'),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Access granted: Administrator control center.',
      staff: req.staff,
    });
  }
);

// MANAGER: Operations management
router.get(
  '/manager/overview',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  requireStaffPermission('reports.view'),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Access granted: Manager operational overview.',
      staff: req.staff,
    });
  }
);

// KITCHEN: Order preparation workflow
router.get(
  '/kitchen/queue',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN),
  requireStaffPermission('kitchen.orders.manage'),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Access granted: Kitchen live order stream.',
      staff: req.staff,
    });
  }
);

// RECEPTION: Guest arrivals & reservations
router.get(
  '/reception/reservations',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION),
  requireStaffPermission('reservations.manage'),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Access granted: Reception desk & reservations.',
      staff: req.staff,
    });
  }
);

// FLOOR: Tables & dining floor service
router.get(
  '/floor/tables',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR),
  requireStaffPermission('floor.tables.manage'),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Access granted: Floor tables and service tasks.',
      staff: req.staff,
    });
  }
);

// Multi-location verification
router.get(
  '/location/:locationId/status',
  requireLocationAccess('locationId'),
  (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: `Access granted for location ${req.params.locationId}`,
      locationId: req.params.locationId,
      staff: req.staff,
    });
  }
);

export const staffProtectedRouter = router;
