import { Router } from 'express';
import {
  getAdminReservations,
  getAdminReservationSummary,
  getAdminReservationById,
  adminConfirmReservation,
  adminRejectReservation,
  adminModifyReservation,
  adminCancelReservation,
} from '../controllers/adminReservation.controller';
import { requireStaffAuth, requireStaffRole } from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';

const router = Router();

// All administrative reservation routes require staff authentication
router.use(requireStaffAuth);

// Summary telemetry
router.get(
  '/summary',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION),
  getAdminReservationSummary
);

// Query directory
router.get(
  '/',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION, StaffRole.FLOOR),
  getAdminReservations
);

// Reservation details
router.get(
  '/:id',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION, StaffRole.FLOOR),
  getAdminReservationById
);

// Actions: Confirm, Reject, Modify, Cancel
router.post(
  '/:id/confirm',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION),
  adminConfirmReservation
);

router.post(
  '/:id/reject',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION),
  adminRejectReservation
);

router.patch(
  '/:id',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION),
  adminModifyReservation
);

router.post(
  '/:id/cancel',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION),
  adminCancelReservation
);

export default router;
