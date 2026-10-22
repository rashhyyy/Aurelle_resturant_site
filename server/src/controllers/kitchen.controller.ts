import { Request, Response } from 'express';
import {
  KitchenQuerySchema,
  KitchenHistoryQuerySchema,
  KitchenActionParamsSchema,
  KitchenActionBodySchema,
} from '../validations/kitchen.validation';
import * as kitchenService from '../services/kitchen.service';
import { StaffRole } from '../types/staff';
import { ORDER_CONFIG } from '../types/order';
import { logger } from '../utils/logger';

function getKitchenStaffActor(req: Request): kitchenService.KitchenStaffActor {
  const staff = req.staff;
  return {
    id: staff?.id,
    email: staff?.email || 'kitchen@aurelle.com',
    name: staff ? `${staff.firstName} ${staff.lastName}` : 'Kitchen Staff',
    role: staff?.role || 'KITCHEN',
  };
}

function resolveLocationId(req: Request, requestedLocationId?: string): { locationId: string; allowed: boolean } {
  const staff = req.staff;
  const target = requestedLocationId || staff?.locationIds?.[0] || ORDER_CONFIG.defaultLocationId;

  if (!staff || staff.role === StaffRole.ADMIN) {
    return { locationId: target, allowed: true };
  }

  const allowed = Array.isArray(staff.locationIds) && (staff.locationIds.includes(target) || staff.locationIds.length === 0);
  return { locationId: target, allowed };
}

/**
 * GET /api/kitchen/orders
 * Returns active orders for kitchen display Kanban board
 */
export async function getKitchenOrders(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = KitchenQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: parseResult.error.errors,
      });
      return;
    }

    const { locationId, allowed } = resolveLocationId(req, parseResult.data.locationId);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized to view kitchen orders for this location.',
      });
      return;
    }

    const result = await kitchenService.getKitchenBoardOrders({
      ...parseResult.data,
      locationId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    logger.error('[Kitchen Controller] Error fetching kitchen orders:', err);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: err.message || 'Failed to fetch kitchen orders.',
    });
  }
}

/**
 * GET /api/kitchen/orders/summary
 * Returns 4 summary metrics for the kitchen
 */
export async function getKitchenSummary(req: Request, res: Response): Promise<void> {
  try {
    const requestedLoc = req.query.locationId as string | undefined;
    const { locationId, allowed } = resolveLocationId(req, requestedLoc);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized for this location.',
      });
      return;
    }

    const summary = await kitchenService.getKitchenSummary(locationId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    logger.error('[Kitchen Controller] Error fetching kitchen summary:', err);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: err.message || 'Failed to fetch kitchen summary.',
    });
  }
}

/**
 * GET /api/kitchen/orders/scheduled
 * Returns scheduled pre-orders beyond lead time
 */
export async function getScheduledOrders(req: Request, res: Response): Promise<void> {
  try {
    const requestedLoc = req.query.locationId as string | undefined;
    const { locationId, allowed } = resolveLocationId(req, requestedLoc);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized for this location.',
      });
      return;
    }

    const orders = await kitchenService.getScheduledOrders({
      locationId,
      orderType: req.query.orderType as string,
      search: req.query.search as string,
    });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (err: any) {
    logger.error('[Kitchen Controller] Error fetching scheduled orders:', err);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: err.message || 'Failed to fetch scheduled orders.',
    });
  }
}

/**
 * GET /api/kitchen/orders/history
 * Returns historical kitchen orders (completed, cancelled)
 */
export async function getKitchenHistory(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = KitchenHistoryQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: parseResult.error.errors,
      });
      return;
    }

    const { locationId, allowed } = resolveLocationId(req, parseResult.data.locationId);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized for this location.',
      });
      return;
    }

    const result = await kitchenService.getKitchenHistory({
      ...parseResult.data,
      locationId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    logger.error('[Kitchen Controller] Error fetching kitchen history:', err);
    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: err.message || 'Failed to fetch kitchen history.',
    });
  }
}

/**
 * GET /api/kitchen/orders/:id
 * Returns single order details for kitchen modal/drawer
 */
export async function getKitchenOrderById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const requestedLoc = req.query.locationId as string | undefined;
    const { locationId, allowed } = resolveLocationId(req, requestedLoc);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized for this location.',
      });
      return;
    }

    const order = await kitchenService.getKitchenOrderById(id, locationId);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err: any) {
    logger.error('[Kitchen Controller] Error fetching kitchen order details:', err);
    res.status(404).json({
      success: false,
      error: 'NotFound',
      message: err.message || 'Kitchen order not found.',
    });
  }
}

/**
 * POST /api/kitchen/orders/:id/accept
 * Kitchen staff explicitly accepts incoming order
 */
export async function acceptKitchenOrder(req: Request, res: Response): Promise<void> {
  try {
    const paramsCheck = KitchenActionParamsSchema.safeParse(req.params);
    if (!paramsCheck.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: paramsCheck.error.errors,
      });
      return;
    }

    const actor = getKitchenStaffActor(req);
    const { locationId, allowed } = resolveLocationId(req);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized to accept orders at this location.',
      });
      return;
    }

    const order = await kitchenService.acceptKitchenOrder(paramsCheck.data.id, actor, locationId);

    res.status(200).json({
      success: true,
      message: `Order ${order.orderReference} accepted into the kitchen.`,
      data: order,
    });
  } catch (err: any) {
    logger.error('[Kitchen Controller] Error accepting order:', err);
    const status = err.message.includes('already been accepted') ? 409 : 400;
    res.status(status).json({
      success: false,
      error: 'ActionFailed',
      message: err.message || 'Failed to accept order.',
    });
  }
}

/**
 * POST /api/kitchen/orders/:id/start
 * Kitchen starts preparation
 */
export async function startKitchenPreparation(req: Request, res: Response): Promise<void> {
  try {
    const paramsCheck = KitchenActionParamsSchema.safeParse(req.params);
    if (!paramsCheck.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: paramsCheck.error.errors,
      });
      return;
    }

    const bodyCheck = KitchenActionBodySchema.safeParse(req.body);
    const note = bodyCheck.success ? bodyCheck.data.note : undefined;

    const actor = getKitchenStaffActor(req);
    const { locationId, allowed } = resolveLocationId(req);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized for this location.',
      });
      return;
    }

    const order = await kitchenService.startKitchenPreparation(
      paramsCheck.data.id,
      actor,
      note,
      locationId
    );

    res.status(200).json({
      success: true,
      message: `Preparation started for Order ${order.orderReference}.`,
      data: order,
    });
  } catch (err: any) {
    logger.error('[Kitchen Controller] Error starting preparation:', err);
    res.status(400).json({
      success: false,
      error: 'ActionFailed',
      message: err.message || 'Failed to start preparation.',
    });
  }
}

/**
 * POST /api/kitchen/orders/:id/ready
 * Kitchen marks order ready for customer handoff / pickup
 */
export async function markKitchenOrderReady(req: Request, res: Response): Promise<void> {
  try {
    const paramsCheck = KitchenActionParamsSchema.safeParse(req.params);
    if (!paramsCheck.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: paramsCheck.error.errors,
      });
      return;
    }

    const bodyCheck = KitchenActionBodySchema.safeParse(req.body);
    const note = bodyCheck.success ? bodyCheck.data.note : undefined;

    const actor = getKitchenStaffActor(req);
    const { locationId, allowed } = resolveLocationId(req);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized for this location.',
      });
      return;
    }

    const order = await kitchenService.markKitchenOrderReady(
      paramsCheck.data.id,
      actor,
      note,
      locationId
    );

    res.status(200).json({
      success: true,
      message: `Order ${order.orderReference} is ready for handoff.`,
      data: order,
    });
  } catch (err: any) {
    logger.error('[Kitchen Controller] Error marking order ready:', err);
    res.status(400).json({
      success: false,
      error: 'ActionFailed',
      message: err.message || 'Failed to mark order ready.',
    });
  }
}

/**
 * POST /api/kitchen/orders/:id/complete
 * POST /api/kitchen/orders/:id/handoff
 * Kitchen marks order as completed and handed off to customer / server
 */
export async function completeKitchenOrder(req: Request, res: Response): Promise<void> {
  try {
    const paramsCheck = KitchenActionParamsSchema.safeParse(req.params);
    if (!paramsCheck.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: paramsCheck.error.errors,
      });
      return;
    }

    const bodyCheck = KitchenActionBodySchema.safeParse(req.body);
    const note = bodyCheck.success ? bodyCheck.data.note : undefined;

    const actor = getKitchenStaffActor(req);
    const { locationId, allowed } = resolveLocationId(req);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized for this location.',
      });
      return;
    }

    const order = await kitchenService.completeKitchenOrder(
      paramsCheck.data.id,
      actor,
      note,
      locationId
    );

    res.status(200).json({
      success: true,
      message: `Order ${order.orderReference} handoff completed.`,
      data: order,
    });
  } catch (err: any) {
    logger.error('[Kitchen Controller] Error completing order handoff:', err);
    res.status(400).json({
      success: false,
      error: 'ActionFailed',
      message: err.message || 'Failed to complete order handoff.',
    });
  }
}
