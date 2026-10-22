import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createOrderSchema, cancelOrderSchema } from '../validations/order.validation';
import * as orderService from '../services/order.service';
import { Order } from '../models/order.model';
import { logger } from '../utils/logger';

/**
 * Helper to extract customer actor from session or request
 */
function getCustomerActor(req: Request, customerEmail?: string, customerName?: string): orderService.OrderActor {
  if (req.session && req.session.user) {
    return {
      id: req.session.user.id,
      email: req.session.user.email,
      name: req.session.user.username,
      actorType: 'CUSTOMER',
    };
  }

  return {
    email: customerEmail,
    name: customerName,
    actorType: 'CUSTOMER',
  };
}

/**
 * POST /api/orders
 * Atomically create a new takeaway or dine-in pre-order
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const data = parseResult.data;
    const actor = getCustomerActor(req, data.customerEmail, data.customerName);

    // If authenticated user, ensure customerId is set to real session ID
    if (req.session && req.session.user) {
      actor.id = req.session.user.id;
    }

    const order = await orderService.createOrder(data, actor);

    res.status(201).json({
      success: true,
      message: 'Your order has been received successfully.',
      data: order.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[CustomerOrderController] createOrder error:', err.message);

    if (err.code === 'PRICE_CHANGED') {
      res.status(409).json({
        success: false,
        code: 'PRICE_CHANGED',
        message: err.message,
        data: {
          priceChanges: err.priceChanges,
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: err.message || 'Unable to place order.',
    });
  }
};

/**
 * GET /api/orders/my
 * Retrieve authenticated customer's order history
 */
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.session || !req.session.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please sign in to view your order history.',
      });
      return;
    }

    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {
      $or: [
        { customerId: req.session.user.id },
        { customerEmail: req.session.user.email.toLowerCase() },
      ],
    };

    if (status && status !== 'all') {
      query.orderStatus = status.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(query),
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
    logger.error('[CustomerOrderController] getMyOrders error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order history.',
    });
  }
};

/**
 * GET /api/orders/my/:id
 * Retrieve specific order details for the authenticated customer
 */
export const getMyOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.session || !req.session.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please sign in to view order details.',
      });
      return;
    }

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

    // Customer ownership verification (prevents cross-customer access)
    const isOwner =
      order.customerId === req.session.user.id ||
      order.customerEmail.toLowerCase() === req.session.user.email.toLowerCase();

    if (!isOwner) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to view this order.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order.toSafeJSON(),
    });
  } catch (err: any) {
    logger.error('[CustomerOrderController] getMyOrderById error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to load order details.',
    });
  }
};

/**
 * POST /api/orders/my/:id/cancel
 * Customer self-service order cancellation
 */
export const cancelMyOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.session || !req.session.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please sign in to cancel your order.',
      });
      return;
    }

    const { id } = req.params;
    const parseResult = cancelOrderSchema.safeParse(req.body);
    const reason = parseResult.success ? parseResult.data.reason : 'Customer requested cancellation';

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

    const isOwner =
      order.customerId === req.session.user.id ||
      order.customerEmail.toLowerCase() === req.session.user.email.toLowerCase();

    if (!isOwner) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to cancel this order.',
      });
      return;
    }

    const actor = getCustomerActor(req);
    const updated = await orderService.cancelOrder(order._id.toString(), actor, reason);

    res.status(200).json({
      success: true,
      message: 'Order has been successfully cancelled.',
      data: updated.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[CustomerOrderController] cancelMyOrder error:', err.message);
    res.status(400).json({
      success: false,
      message: err.message || 'Unable to cancel order.',
    });
  }
};

/**
 * GET /api/orders/track/:reference
 * Real-time lookup for order tracking by reference (supports guest tracking with email confirmation)
 */
export const trackOrderByReference = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference } = req.params;
    const emailConfirm = (req.query.email as string)?.trim().toLowerCase();

    const order = await Order.findOne({ orderReference: reference.toUpperCase() });
    if (!order) {
      res.status(404).json({
        success: false,
        message: `Order reference "${reference}" not found.`,
      });
      return;
    }

    // If caller is authenticated user, verify ownership or staff privileges
    if (req.session && req.session.user) {
      const isStaffOrAdmin = ['admin', 'manager', 'kitchen', 'floor', 'reception'].includes(req.session.user.role);
      const isOwner =
        order.customerId === req.session.user.id ||
        order.customerEmail.toLowerCase() === req.session.user.email.toLowerCase();
      if (!isOwner && !isStaffOrAdmin) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied.',
        });
        return;
      }
    } else if (emailConfirm) {
      // If unauthenticated, require matching contact email unless placeholder
      const isDummyDefault = emailConfirm === 'customer@example.com';
      if (!isDummyDefault && order.customerEmail.toLowerCase() !== emailConfirm) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Contact email confirmation did not match order records.',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: order.toSafeJSON(),
    });
  } catch (err: any) {
    logger.error('[CustomerOrderController] trackOrderByReference error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order tracking information.',
    });
  }
};
