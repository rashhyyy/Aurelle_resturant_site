import { Router } from 'express';
import {
  getKitchenOrders,
  getKitchenSummary,
  getScheduledOrders,
  getKitchenHistory,
  getKitchenOrderById,
  acceptKitchenOrder,
  startKitchenPreparation,
  markKitchenOrderReady,
  completeKitchenOrder,
} from '../controllers/kitchen.controller';
import { requireStaffAuth, requireStaffRole } from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';

const router = Router();

// All kitchen routes require authenticated staff
router.use(requireStaffAuth);

// Kitchen operations are permitted for KITCHEN, ADMIN, and MANAGER roles.
// FLOOR and RECEPTION are strictly denied.
router.use(requireStaffRole(StaffRole.KITCHEN, StaffRole.ADMIN, StaffRole.MANAGER));

router.get('/orders/summary', getKitchenSummary);
router.get('/orders/scheduled', getScheduledOrders);
router.get('/orders/history', getKitchenHistory);
router.get('/orders', getKitchenOrders);
router.get('/orders/:id', getKitchenOrderById);

router.post('/orders/:id/accept', acceptKitchenOrder);
router.post('/orders/:id/start', startKitchenPreparation);
router.post('/orders/:id/ready', markKitchenOrderReady);
router.post('/orders/:id/complete', completeKitchenOrder);
router.post('/orders/:id/handoff', completeKitchenOrder);

export const kitchenRoutes = router;
