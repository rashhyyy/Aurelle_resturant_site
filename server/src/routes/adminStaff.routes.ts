import { Router } from 'express';
import {
  requireStaffAuth,
  requireStaffRole,
  requireStaffPermission,
} from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';
import {
  getStaffSummary,
  getStaffList,
  getRolePermissions,
  getStaffById,
  createStaffInvitation,
  resendStaffInvitation,
  revokeStaffInvitation,
  updateStaffProfile,
  updateStaffRole,
  updateStaffLocations,
  updateStaffStatus,
  initiateStaffPasswordReset,
  getStaffActivityLogs,
} from '../controllers/adminStaff.controller';

const router = Router();

// Enforce strict administrative clearance and staff.manage permission across all routes
router.use(requireStaffAuth);
router.use(requireStaffRole(StaffRole.ADMIN));
router.use(requireStaffPermission('staff.manage'));

// 1. High-level summary metrics
router.get('/summary', getStaffSummary);

// 2. Role permissions matrix and configured locations
router.get('/permissions', getRolePermissions);

// 3. Paginated staff directory
router.get('/', getStaffList);

// 4. Invite employee
router.post('/invitations', createStaffInvitation);

// 5. Single employee details
router.get('/:id', getStaffById);

// 6. Update employee profile
router.patch('/:id', updateStaffProfile);

// 7. Change employee role
router.patch('/:id/role', updateStaffRole);

// 8. Assign restaurant locations
router.patch('/:id/locations', updateStaffLocations);

// 9. Enable / disable employee status
router.patch('/:id/status', updateStaffStatus);

// 10. Resend invitation
router.post('/:id/resend-invitation', resendStaffInvitation);

// 11. Revoke invitation
router.post('/:id/revoke-invitation', revokeStaffInvitation);

// 12. Initiate password reset
router.post('/:id/password-reset', initiateStaffPasswordReset);

// 13. Activity & audit log trail
router.get('/:id/activity', getStaffActivityLogs);

export const adminStaffRoutes = router;
