import { Router } from 'express';
import { getAdminDashboardOverview } from '../controllers/adminDashboard.controller';
import {
  requireStaffAuth,
  requireStaffRole,
  requireStaffPermission,
  requireLocationAccess,
} from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';

const router = Router();

// Protect all admin dashboard endpoints with authentication and ADMIN clearance
router.use(requireStaffAuth);
router.use(requireStaffRole(StaffRole.ADMIN));
router.use(requireStaffPermission('staff.manage'));
router.use(requireLocationAccess('locationId'));

// GET /api/admin/dashboard/overview
router.get('/overview', getAdminDashboardOverview);

export const adminDashboardRouter = router;
