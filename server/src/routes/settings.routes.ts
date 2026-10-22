import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { requireStaffAuth, requireStaffRole } from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';

const router = Router();

// Public configuration endpoint (for customer web application checkout & hours)
router.get('/public', SettingsController.getPublicSettings);

// Staff-protected settings endpoints
router.use(requireStaffAuth);

// Read settings allowed for ADMIN and MANAGER
router.get('/', requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER), SettingsController.getSettings);

// Modifications restricted exclusively to ADMIN
router.put('/', requireStaffRole(StaffRole.ADMIN), SettingsController.updateSettings);
router.post('/reset', requireStaffRole(StaffRole.ADMIN), SettingsController.resetSection);
router.get('/security', requireStaffRole(StaffRole.ADMIN), SettingsController.getSecurity);
router.get('/locations', requireStaffRole(StaffRole.ADMIN), SettingsController.getLocations);
router.get('/activity', requireStaffRole(StaffRole.ADMIN), SettingsController.getActivity);

export const settingsRoutes = router;
