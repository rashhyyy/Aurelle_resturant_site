import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { requireStaffAuth, requireStaffRole, requireLocationAccess } from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';

const router = Router();

router.use(requireStaffAuth);
router.use(requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER));
router.use(requireLocationAccess('locationId'));

router.get('/overview', AnalyticsController.getOverview);
router.get('/sales', AnalyticsController.getSales);
router.get('/orders', AnalyticsController.getOrders);
router.get('/menu', AnalyticsController.getMenu);
router.get('/kitchen', AnalyticsController.getKitchen);
router.get('/reservations', AnalyticsController.getReservations);
router.get('/tables', AnalyticsController.getTables);
router.get('/vip-events', AnalyticsController.getVipEvents);
router.get('/staff', AnalyticsController.getStaff);
router.get('/customers', AnalyticsController.getCustomers);

export const analyticsRoutes = router;
