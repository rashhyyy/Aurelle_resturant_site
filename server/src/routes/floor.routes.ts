import { Router } from 'express';
import {
  requireStaffAuth,
  requireStaffRole,
  requireLocationAccess,
} from '../middleware/staffAuth.middleware';
import { validate } from '../middleware/validate.middleware';
import { StaffRole } from '../types/staff';
import {
  updateLayoutValidation,
  assignTableStaffValidation,
  createServiceRequestValidation,
  updateServiceRequestValidation,
  floorIdParamValidation,
} from '../validations/floor.validation';
import {
  getFloorOverviewHandler,
  getFloorLayoutHandler,
  updateFloorLayoutHandler,
  getFloorTablesHandler,
  getFloorTableDetailHandler,
  assignStaffToTableHandler,
  getMyAssignedTablesHandler,
  getActiveDiningSessionsHandler,
  getDiningSessionByIdHandler,
  closeDiningSessionHandler,
  getServiceRequestsHandler,
  createServiceRequestHandler,
  updateServiceRequestHandler,
  getKitchenAlertsHandler,
  acknowledgeKitchenAlertHandler,
  handoffOrderHandler,
  getCleaningTasksHandler,
  startCleaningTaskHandler,
  completeCleaningTaskHandler,
  getFloorHistoryHandler,
} from '../controllers/floor.controller';

const router = Router();

// Protect all floor routes with staff auth and location access
router.use(requireStaffAuth);
router.use(requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR));
router.use(requireLocationAccess('locationId'));

// Overview telemetry
router.get('/overview', getFloorOverviewHandler);

// Floor Layout
router.get('/layout', getFloorLayoutHandler);
router.put(
  '/layout',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  validate(updateLayoutValidation),
  updateFloorLayoutHandler
);

// Tables
router.get('/tables', getFloorTablesHandler);
router.get('/tables/:id', getFloorTableDetailHandler);
router.post(
  '/tables/:id/assign',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  validate(assignTableStaffValidation),
  assignStaffToTableHandler
);

// My Tables (assigned to caller)
router.get('/my-tables', getMyAssignedTablesHandler);

// Dining Sessions
router.get('/sessions', getActiveDiningSessionsHandler);
router.get('/sessions/:id', getDiningSessionByIdHandler);
router.post('/sessions/:id/close', validate(floorIdParamValidation), closeDiningSessionHandler);

// Service Requests
router.get('/service-requests', getServiceRequestsHandler);
router.post(
  '/service-requests',
  validate(createServiceRequestValidation),
  createServiceRequestHandler
);
router.patch(
  '/service-requests/:id',
  validate(updateServiceRequestValidation),
  updateServiceRequestHandler
);

// Kitchen Ready Alerts
router.get('/kitchen-alerts', getKitchenAlertsHandler);
router.post(
  '/kitchen-alerts/:id/acknowledge',
  validate(floorIdParamValidation),
  acknowledgeKitchenAlertHandler
);

// Order Handoff
router.post('/orders/:id/handoff', validate(floorIdParamValidation), handoffOrderHandler);

// Cleaning Tasks
router.get('/cleaning-tasks', getCleaningTasksHandler);
router.post(
  '/cleaning-tasks/:id/start',
  validate(floorIdParamValidation),
  startCleaningTaskHandler
);
router.post(
  '/cleaning-tasks/:id/complete',
  validate(floorIdParamValidation),
  completeCleaningTaskHandler
);

// Activity History Archive
router.get('/history', getFloorHistoryHandler);

export const floorRoutes = router;
export default router;
