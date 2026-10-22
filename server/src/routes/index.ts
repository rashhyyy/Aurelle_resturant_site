import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { staffAuthRouter } from './staffAuth.routes';
import { staffProtectedRouter } from './staffProtected.routes';
import { adminDashboardRouter } from './adminDashboard.routes';
import { adminStaffRoutes } from './adminStaff.routes';
import { invitationRoutes } from './invitation.routes';
import { adminMenuRoutes } from './adminMenu.routes';
import { publicMenuRoutes } from './publicMenu.routes';
import { orderRoutes } from './order.routes';
import { adminOrderRoutes } from './adminOrder.routes';
import { kitchenRoutes } from './kitchen.routes';
import customerReservationRoutes from './customerReservation.routes';
import adminReservationRoutes from './adminReservation.routes';
import receptionRoutes from './reception.routes';
import floorRoutes from './floor.routes';
import vipRoutes from './vip.routes';
import adminVipRoutes from './adminVip.routes';
import { managerRoutes } from './manager.routes';
import { notificationRoutes } from './notification.routes';
import { settingsRoutes } from './settings.routes';
import { analyticsRoutes } from './analytics.routes';
import { reportRoutes } from './report.routes';
import { PLATFORM_MODULES } from '../modules';

const router = Router();

// Foundational subsystems
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Stage 2: Staff Authentication & RBAC Protected Endpoints
router.use('/staff/auth', staffAuthRouter);
router.use('/staff/invitations', invitationRoutes);
router.use('/staff', staffProtectedRouter);

// Stage 4: Administrator Dashboard API
router.use('/admin/dashboard', adminDashboardRouter);

// Stage 5: Administrator Staff Management API
router.use('/admin/staff', adminStaffRoutes);

// Stage 6: Menu Management System API
router.use('/admin/menu', adminMenuRoutes);
router.use('/menu', publicMenuRoutes);

// Stage 7: Order Management System API
router.use('/orders', orderRoutes);
router.use('/admin/orders', adminOrderRoutes);

// Stage 8: Complete Kitchen Management System (KDS) API
router.use('/kitchen', kitchenRoutes);

// Stage 9: Complete Reservation Management System API
router.use('/reservations', customerReservationRoutes);
router.use('/admin/reservations', adminReservationRoutes);

// Stage 10: Complete Reception Management System API
router.use('/reception', receptionRoutes);

// Stage 11: Complete Floor Management & Interactive Floor Plan System API
router.use('/floor', floorRoutes);

// Stage 12: Complete VIP Rooms & Events Management System API
router.use('/vip', vipRoutes);
router.use('/admin/vip', adminVipRoutes);

// Stage 13: Complete Manager Dashboard & Restaurant Operations Management API
router.use('/manager', managerRoutes);

// Stage 14: Complete Notifications & Communication System API
router.use('/notifications', notificationRoutes);

// Stage 15: Complete Analytics, BI, Reporting & System Settings API
router.use('/settings', settingsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);

// Meta route exposing available platform modules
router.get('/modules', (_req, res) => {
  res.status(200).json({
    success: true,
    platform: 'Aurelle Restaurant Management Platform',
    stage: 'Stage 15: Complete Analytics, BI, Reporting & System Settings',
    modules: PLATFORM_MODULES,
  });
});

export const apiRoutes = router;
