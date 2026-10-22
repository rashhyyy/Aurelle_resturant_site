import { Router } from 'express';
import {
  getAdminOrders,
  getAdminOrdersSummary,
  getAdminOrderById,
  confirmAdminOrder,
  cancelAdminOrder,
  updateAdminOrderStatus,
} from '../controllers/adminOrder.controller';
import { requireStaffAuth, requireStaffRole } from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';

const router = Router();

// All administrative order routes require staff authentication
router.use(requireStaffAuth);

// Order viewing: accessible to Admin, Manager, Kitchen, Floor
router.get(
  '/summary',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  getAdminOrdersSummary
);

router.get(
  '/',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN, StaffRole.FLOOR),
  getAdminOrders
);

router.get(
  '/:id',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN, StaffRole.FLOOR),
  getAdminOrderById
);

// Order lifecycle actions
router.post(
  '/:id/confirm',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  confirmAdminOrder
);

router.post(
  '/:id/cancel',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  cancelAdminOrder
);

// Kitchen / Staff status updates (PREPARING, READY, COMPLETED)
router.patch(
  '/:id/status',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN),
  updateAdminOrderStatus
);

export const adminOrderRoutes = router;
