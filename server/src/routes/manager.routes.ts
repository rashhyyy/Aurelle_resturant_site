import { Router } from 'express';
import {
  getOverview,
  getOrders,
  getOrderDetails,
  getKitchen,
  getReservations,
  getReception,
  getFloor,
  getVipEvents,
  getStaff,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  executeOverride,
  getReports,
  exportReportCSV,
  getActivity,
} from '../controllers/manager.controller';
import {
  requireStaffAuth,
  requireStaffPermission,
  requireLocationAccess,
} from '../middleware/staffAuth.middleware';

const router = Router();

// Enforce staff session on all manager endpoints
router.use(requireStaffAuth);

// 1. Overview Dashboard
router.get(
  '/overview',
  requireStaffPermission('manager.dashboard.view'),
  requireLocationAccess('locationId'),
  getOverview
);

// 2. Order Monitoring
router.get(
  '/orders',
  requireStaffPermission('manager.orders.view'),
  requireLocationAccess('locationId'),
  getOrders
);
router.get(
  '/orders/:id',
  requireStaffPermission('manager.orders.view'),
  requireLocationAccess('locationId'),
  getOrderDetails
);

// 3. Kitchen Monitoring
router.get(
  '/kitchen',
  requireStaffPermission('manager.kitchen.view'),
  requireLocationAccess('locationId'),
  getKitchen
);

// 4. Reservation Monitoring
router.get(
  '/reservations',
  requireStaffPermission('manager.reservations.view'),
  requireLocationAccess('locationId'),
  getReservations
);

// 5. Reception Monitoring
router.get(
  '/reception',
  requireStaffPermission('manager.reception.view'),
  requireLocationAccess('locationId'),
  getReception
);

// 6. Floor Operations Monitoring
router.get(
  '/floor',
  requireStaffPermission('manager.floor.view'),
  requireLocationAccess('locationId'),
  getFloor
);

// 7. VIP & Events Monitoring
router.get(
  '/vip-events',
  requireStaffPermission('manager.vip.view'),
  requireLocationAccess('locationId'),
  getVipEvents
);

// 8. Staff Operations Overview
router.get(
  '/staff',
  requireStaffPermission('manager.staff.view'),
  requireLocationAccess('locationId'),
  getStaff
);

// 9. Operational Alerts
router.get(
  '/alerts',
  requireStaffPermission('manager.alerts.view'),
  requireLocationAccess('locationId'),
  getAlerts
);
router.post(
  '/alerts/:id/acknowledge',
  requireStaffPermission('manager.alerts.manage'),
  requireLocationAccess('locationId'),
  acknowledgeAlert
);
router.post(
  '/alerts/:id/resolve',
  requireStaffPermission('manager.alerts.manage'),
  requireLocationAccess('locationId'),
  resolveAlert
);

// 10. Manager Overrides
router.post(
  '/overrides',
  requireStaffPermission('manager.operations.override'),
  requireLocationAccess('locationId'),
  executeOverride
);

// 11. Daily Operational Reports & Export
router.get(
  '/reports',
  requireStaffPermission('manager.reports.view'),
  requireLocationAccess('locationId'),
  getReports
);
router.get(
  '/reports/export',
  requireStaffPermission('manager.reports.view'),
  requireLocationAccess('locationId'),
  exportReportCSV
);

// 12. Activity History
router.get(
  '/activity',
  requireStaffPermission('manager.activity.view'),
  requireLocationAccess('locationId'),
  getActivity
);

export const managerRoutes = router;
