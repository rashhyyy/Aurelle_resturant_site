import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { adminOrdersQuerySchema, adminUpdateOrderStatusSchema, cancelOrderSchema } from '../validations/order.validation';
import * as orderService from '../services/order.service';
import { Order } from '../models/order.model';
import { OrderStatus, OrderSummaryMetrics } from '../types/order';
import { StaffRole } from '../types/staff';
import { logger } from '../utils/logger';

/**
 * Helper to build staff actor from authenticated staff request
 */
function getStaffActor(req: Request): orderService.OrderActor {
  const staff = req.staff;
  return {
    id: staff?.id,
    email: staff?.email || 'admin@aurelle.com',
    name: staff ? `${staff.firstName} ${staff.lastName}` : 'Administrator',
    role: staff?.role || 'ADMIN',
    actorType: 'STAFF',
  };
}

/**
 * Enforce staff location isolation
 */
function checkLocationAccess(req: Request, targetLocationId?: string): boolean {
  const staff = req.staff;
  if (!staff) return false;
  if (staff.role === StaffRole.ADMIN) return true; // Admins have global multi-venue oversight

  if (!targetLocationId) return true;
  return Array.isArray(staff.locationIds) && staff.locationIds.includes(targetLocationId);
}

/**
 * GET /api/admin/orders
 * Administrator and manager order directory with server-side filtering
 */
export const getAdminOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = adminOrdersQuerySchema.safeParse(req.query);
    const queryParams = parseResult.success ? parseResult.data : { page: '1', limit: '20', sort: 'newest' };

    const pageNum = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    // 1. Location isolation
    const staff = req.staff;
    if (queryParams.locationId && queryParams.locationId !== 'all') {
      if (!checkLocationAccess(req, queryParams.locationId)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You are not authorized to view orders for this restaurant location.',
        });
        return;
      }
      filter.locationId = queryParams.locationId;
    } else if (staff && staff.role !== StaffRole.ADMIN && Array.isArray(staff.locationIds)) {
      filter.locationId = { $in: staff.locationIds };
    }

    // 2. Status filter (consistently maps ACCEPTED to CONFIRMED)
    if (queryParams.status && queryParams.status !== 'all') {
      const normalizedStatus = queryParams.status.toUpperCase();
      filter.orderStatus = normalizedStatus === 'ACCEPTED' ? OrderStatus.CONFIRMED : normalizedStatus;
    }

    // 3. Order type filter
    if (queryParams.orderType && queryParams.orderType !== 'all') {
      filter.orderType = queryParams.orderType.toUpperCase();
    }

    // 4. Date range filter
    if (queryParams.startDate || queryParams.endDate) {
      filter.createdAt = {};
      if (queryParams.startDate) {
        filter.createdAt.$gte = new Date(queryParams.startDate);
      }
      if (queryParams.endDate) {
        const end = new Date(queryParams.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // 5. Text search
    if (queryParams.search && queryParams.search.trim()) {
      const s = queryParams.search.trim();
      filter.$or = [
        { orderReference: { $regex: s, $options: 'i' } },
        { customerName: { $regex: s, $options: 'i' } },
        { customerEmail: { $regex: s, $options: 'i' } },
        { customerPhone: { $regex: s, $options: 'i' } },
      ];
    }

    // 6. Sorting
    let sortObj: any = { createdAt: -1 };
    if (queryParams.sort === 'oldest') sortObj = { createdAt: 1 };
    if (queryParams.sort === 'scheduled') sortObj = { scheduledFor: 1 };
    if (queryParams.sort === 'highest') sortObj = { totalMinor: -1 };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders: orders.map((o) => o.toSafeJSON()),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err: any) {
    logger.error('[AdminOrderController] getAdminOrders error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders.',
    });
  }
};

/**
 * GET /api/admin/orders/summary
 * Aggregate operational metrics for administrator order dashboard
 */
export const getAdminOrdersSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = (req.query.locationId as string) || undefined;
    const baseFilter: any = {};

    const staff = req.staff;
    if (locationId && locationId !== 'all') {
      if (!checkLocationAccess(req, locationId)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied for requested restaurant location.',
        });
        return;
      }
      baseFilter.locationId = locationId;
    } else if (staff && staff.role !== StaffRole.ADMIN && Array.isArray(staff.locationIds)) {
      baseFilter.locationId = { $in: staff.locationIds };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      todayOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      revenueAgg,
    ] = await Promise.all([
      Order.countDocuments({
        ...baseFilter,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Order.countDocuments({
        ...baseFilter,
        orderStatus: {
          $in: [
            OrderStatus.RECEIVED,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
          ],
        },
      }),
      Order.countDocuments({
        ...baseFilter,
        orderStatus: OrderStatus.COMPLETED,
      }),
      Order.countDocuments({
        ...baseFilter,
        orderStatus: OrderStatus.CANCELLED,
      }),
      Order.aggregate([
        {
          $match: {
            ...baseFilter,
            orderStatus: OrderStatus.COMPLETED,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalMinor' },
          },
        },
      ]),
    ]);

    const todayRevenueMinor = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;
    const majorRevenue = Math.round(todayRevenueMinor / 100);

    const summary: OrderSummaryMetrics = {
      todayOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      todayRevenueMinor,
      formattedTodayRevenue: `LKR ${majorRevenue.toLocaleString('en-US')}`,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    logger.error('[AdminOrderController] getAdminOrdersSummary error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order summary metrics.',
    });
  }
};

/**
 * GET /api/admin/orders/:id
 * Retrieve comprehensive order dossier
 */
export const getAdminOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const order = await Order.findOne({
      $or: [
        { orderReference: id.toUpperCase() },
        ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(id) }] : []),
      ],
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
      return;
    }

    if (!checkLocationAccess(req, order.locationId)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized to view orders from this venue.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order.toSafeJSON(),
    });
  } catch (err: any) {
    logger.error('[AdminOrderController] getAdminOrderById error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details.',
    });
  }
};

/**
 * POST /api/admin/orders/:id/confirm
 * Authorize restaurant order acceptance
 */
export const confirmAdminOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (!checkLocationAccess(req, order.locationId)) {
      res.status(403).json({ success: false, message: 'Access denied for this location.' });
      return;
    }

    const actor = getStaffActor(req);
    const updated = await orderService.transitionOrderStatus(
      id,
      OrderStatus.CONFIRMED,
      actor,
      'Order confirmed and accepted by staff'
    );

    res.status(200).json({
      success: true,
      message: `Order ${updated.orderReference} confirmed successfully.`,
      data: updated.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[AdminOrderController] confirmAdminOrder error:', err.message);
    res.status(400).json({
      success: false,
      message: err.message || 'Unable to confirm order.',
    });
  }
};

/**
 * POST /api/admin/orders/:id/cancel
 * Administrative order cancellation
 */
export const cancelAdminOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = cancelOrderSchema.safeParse(req.body);
    const reason = parseResult.success ? parseResult.data.reason : 'Cancelled by restaurant management';

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (!checkLocationAccess(req, order.locationId)) {
      res.status(403).json({ success: false, message: 'Access denied for this location.' });
      return;
    }

    const actor = getStaffActor(req);
    const updated = await orderService.cancelOrder(id, actor, reason);

    res.status(200).json({
      success: true,
      message: `Order ${updated.orderReference} has been cancelled.`,
      data: updated.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[AdminOrderController] cancelAdminOrder error:', err.message);
    res.status(400).json({
      success: false,
      message: err.message || 'Unable to cancel order.',
    });
  }
};

/**
 * PATCH /api/admin/orders/:id/status
 * Update status workflow (CONFIRMED -> PREPARING -> READY -> COMPLETED)
 */
export const updateAdminOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = adminUpdateOrderStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { status, note } = parseResult.data;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (!checkLocationAccess(req, order.locationId)) {
      res.status(403).json({ success: false, message: 'Access denied for this location.' });
      return;
    }

    const actor = getStaffActor(req);
    const updated = await orderService.transitionOrderStatus(id, status, actor, note);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: updated.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[AdminOrderController] updateAdminOrderStatus error:', err.message);
    res.status(400).json({
      success: false,
      message: err.message || 'Unable to update order status.',
    });
  }
};
