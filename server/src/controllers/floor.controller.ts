import { Request, Response } from 'express';
import {
  getFloorOverview,
  getFloorLayout,
  updateFloorLayout,
  getFloorTables,
  getFloorTableDetail,
  getMyAssignedTables,
  assignStaffToTable,
  getActiveDiningSessions,
  closeDiningSession,
  getServiceRequests,
  createServiceRequest,
  updateServiceRequestStatus,
  getKitchenAlerts,
  acknowledgeKitchenAlert,
  handoffOrder,
  getCleaningTasks,
  startCleaningTask,
  completeCleaningTask,
  getFloorHistory,
  FloorActor,
} from '../services/floor.service';
import { DiningSession } from '../models/diningSession.model';
import { logger } from '../utils/logger';

function extractActor(req: Request): FloorActor {
  const staff = (req as any).staff;
  return {
    id: staff?._id?.toString() || staff?.id,
    name: staff ? `${staff.firstName || ''} ${staff.lastName || ''}`.trim() : 'Floor Staff',
    email: staff?.email || 'floor@aurelle.com',
    role: staff?.role || 'FLOOR',
  };
}

function resolveLocationId(req: Request): string {
  const loc =
    (req.query.locationId as string) ||
    (req.body && req.body.locationId) ||
    (req.headers['x-location-id'] as string) ||
    'loc-colombo-main';
  return loc;
}

/**
 * GET /api/floor/overview
 */
export async function getFloorOverviewHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const metrics = await getFloorOverview(locationId);
    res.status(200).json({ success: true, data: metrics });
  } catch (err: any) {
    logger.error('[FloorController] getFloorOverview error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/layout
 */
export async function getFloorLayoutHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const result = await getFloorLayout(locationId);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    logger.error('[FloorController] getFloorLayout error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/floor/layout
 */
export async function updateFloorLayoutHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = resolveLocationId(req);
    const layout = req.body.layout;
    const updated = await updateFloorLayout(locationId, layout, actor);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    logger.warn('[FloorController] updateFloorLayout error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/tables
 */
export async function getFloorTablesHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const section = req.query.section as string;
    const tables = await getFloorTables(locationId, section);
    res.status(200).json({ success: true, data: tables });
  } catch (err: any) {
    logger.error('[FloorController] getFloorTables error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/tables/:id
 */
export async function getFloorTableDetailHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const tableId = req.params.id;
    const detail = await getFloorTableDetail(tableId, locationId);
    res.status(200).json({ success: true, data: detail });
  } catch (err: any) {
    logger.warn('[FloorController] getFloorTableDetail error:', err.message);
    res.status(404).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/floor/tables/:id/assign
 */
export async function assignStaffToTableHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = resolveLocationId(req);
    const tableId = req.params.id;
    const staffId = req.body.staffId || null;
    const updated = await assignStaffToTable(tableId, staffId, actor, locationId);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    logger.warn('[FloorController] assignStaffToTable error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/my-tables
 */
export async function getMyAssignedTablesHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = resolveLocationId(req);
    if (!actor.id) {
      res.status(401).json({ success: false, message: 'Staff identity could not be verified.' });
      return;
    }
    const tables = await getMyAssignedTables(actor.id, locationId);
    res.status(200).json({ success: true, data: tables });
  } catch (err: any) {
    logger.error('[FloorController] getMyAssignedTables error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/sessions
 */
export async function getActiveDiningSessionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const sessions = await getActiveDiningSessions(locationId);
    res.status(200).json({ success: true, data: sessions });
  } catch (err: any) {
    logger.error('[FloorController] getActiveDiningSessions error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/sessions/:id
 */
export async function getDiningSessionByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const sessionId = req.params.id;
    const session = await DiningSession.findOne({ _id: sessionId, locationId });
    if (!session) {
      res.status(404).json({ success: false, message: 'Dining session not found.' });
      return;
    }
    res.status(200).json({ success: true, data: session.toSafeJSON() });
  } catch (err: any) {
    logger.warn('[FloorController] getDiningSessionById error:', err.message);
    res.status(404).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/floor/sessions/:id/close
 */
export async function closeDiningSessionHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = resolveLocationId(req);
    const sessionId = req.params.id;
    const result = await closeDiningSession(sessionId, actor, locationId);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    logger.warn('[FloorController] closeDiningSession error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/service-requests
 */
export async function getServiceRequestsHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const status = req.query.status as string;
    const requests = await getServiceRequests(locationId, status);
    res.status(200).json({ success: true, data: requests });
  } catch (err: any) {
    logger.error('[FloorController] getServiceRequests error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/floor/service-requests
 */
export async function createServiceRequestHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const request = await createServiceRequest(req.body, actor);
    res.status(201).json({ success: true, data: request });
  } catch (err: any) {
    logger.warn('[FloorController] createServiceRequest error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * PATCH /api/floor/service-requests/:id
 */
export async function updateServiceRequestHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = resolveLocationId(req);
    const requestId = req.params.id;
    const { status, notes } = req.body;
    const updated = await updateServiceRequestStatus(requestId, status, actor, locationId, notes);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    logger.warn('[FloorController] updateServiceRequest error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/kitchen-alerts
 */
export async function getKitchenAlertsHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const status = req.query.status as string;
    const alerts = await getKitchenAlerts(locationId, status);
    res.status(200).json({ success: true, data: alerts });
  } catch (err: any) {
    logger.error('[FloorController] getKitchenAlerts error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/floor/kitchen-alerts/:id/acknowledge
 */
export async function acknowledgeKitchenAlertHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = resolveLocationId(req);
    const alertId = req.params.id;
    const acknowledged = await acknowledgeKitchenAlert(alertId, actor, locationId);
    res.status(200).json({ success: true, data: acknowledged });
  } catch (err: any) {
    logger.warn('[FloorController] acknowledgeKitchenAlert error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/floor/orders/:id/handoff
 */
export async function handoffOrderHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = resolveLocationId(req);
    const orderId = req.params.id;
    const result = await handoffOrder(orderId, actor, locationId);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    logger.warn('[FloorController] handoffOrder error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/cleaning-tasks
 */
export async function getCleaningTasksHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const status = req.query.status as string;
    const tasks = await getCleaningTasks(locationId, status);
    res.status(200).json({ success: true, data: tasks });
  } catch (err: any) {
    logger.error('[FloorController] getCleaningTasks error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/floor/cleaning-tasks/:id/start
 */
export async function startCleaningTaskHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = resolveLocationId(req);
    const taskId = req.params.id;
    const task = await startCleaningTask(taskId, actor, locationId);
    res.status(200).json({ success: true, data: task });
  } catch (err: any) {
    logger.warn('[FloorController] startCleaningTask error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/floor/cleaning-tasks/:id/complete
 */
export async function completeCleaningTaskHandler(req: Request, res: Response): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = resolveLocationId(req);
    const taskId = req.params.id;
    const task = await completeCleaningTask(taskId, actor, locationId);
    res.status(200).json({ success: true, data: task });
  } catch (err: any) {
    logger.warn('[FloorController] completeCleaningTask error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/floor/history
 */
export async function getFloorHistoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const history = await getFloorHistory(locationId, dateFrom, dateTo);
    res.status(200).json({ success: true, data: history });
  } catch (err: any) {
    logger.error('[FloorController] getFloorHistory error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}
