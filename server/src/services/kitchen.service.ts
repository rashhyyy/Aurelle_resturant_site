import mongoose from 'mongoose';
import {
  OrderType,
  OrderStatus,
  KitchenPriority,
  KitchenSummaryMetrics,
  IOrderSafeJSON,
  ORDER_CONFIG,
} from '../types/order';
import { Order, IOrderDocument } from '../models/order.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { getSocketServer } from '../sockets/socket.server';
import { logger } from '../utils/logger';
import { createKitchenReadyAlert } from './floor.service';

export interface KitchenStaffActor {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

/**
 * Emit kitchen-scoped real-time Socket.IO notifications
 */
export function emitKitchenSocketEvent(
  eventName: 'kitchen.orderAvailable' | 'kitchen.orderAccepted' | 'kitchen.orderPreparing' | 'kitchen.orderReady' | 'kitchen.orderCompleted',
  order: IOrderDocument
): void {
  try {
    const io = getSocketServer();
    if (!io) return;

    const payload = order.toSafeJSON();

    // Staff scoped rooms
    io.to('role:kitchen').to('role:admin').to('role:manager').emit(eventName, payload as any);

    // Venue room
    if (order.locationId) {
      io.to(`location:${order.locationId}`).emit(eventName, payload as any);
    }
  } catch (err) {
    logger.warn('[Socket.IO] Failed to emit kitchen event:', err);
  }
}

/**
 * Emit general order socket events so customer & admin stay in sync
 */
export function emitGeneralOrderEvents(
  eventName: 'orders.updated' | 'orders.statusChanged',
  order: IOrderDocument
): void {
  try {
    const io = getSocketServer();
    if (!io) return;

    const payload = order.toSafeJSON();

    io.to('role:admin').to('role:manager').to('role:kitchen').emit(eventName, payload as any);

    if (order.locationId) {
      io.to(`location:${order.locationId}`).emit(eventName, payload as any);
    }

    if (order.customerId) {
      io.to(`customer:${order.customerId}`).emit(eventName, payload as any);
    }

    if (order.orderReference) {
      io.to(`order:${order.orderReference.toUpperCase()}`).emit(eventName, payload as any);
    }

    io.to(`order:${order._id.toString()}`).emit(eventName, payload as any);
  } catch (err) {
    logger.warn('[Socket.IO] Failed to emit general order event:', err);
  }
}

/**
 * Log kitchen audit events
 */
async function logKitchenAudit(params: {
  action: 'KITCHEN_ORDER_ACCEPTED' | 'ORDER_PREPARATION_STARTED' | 'ORDER_READY' | 'ORDER_COMPLETED' | 'ORDER_HANDOFF_COMPLETED';
  order: IOrderDocument;
  actor: KitchenStaffActor;
  details: string;
}): Promise<void> {
  try {
    const actorId = params.actor.id || 'staff-session';
    const actorName = params.actor.name || 'Kitchen Staff';
    const actorEmail = params.actor.email || 'kitchen@aurelle.com';

    await StaffAuditLog.create({
      actorId,
      actorName,
      actorEmail,
      targetStaffId: params.order.orderReference,
      targetStaffName: `Order ${params.order.orderReference}`,
      targetStaffEmail: params.order.customerEmail,
      action: params.action,
      details: params.details,
      locationId: params.order.locationId,
      ipAddress: '127.0.0.1',
    });
  } catch (err) {
    logger.warn('[Kitchen Audit] Failed to record audit log:', err);
  }
}

/**
 * Find order by MongoDB ID or order reference string
 */
async function findOrderByIdOrRef(idOrRef: string, locationId?: string): Promise<IOrderDocument | null> {
  const query: any = {};
  if (mongoose.Types.ObjectId.isValid(idOrRef)) {
    query.$or = [{ _id: new mongoose.Types.ObjectId(idOrRef) }, { orderReference: idOrRef.toUpperCase() }];
  } else {
    query.orderReference = idOrRef.toUpperCase();
  }

  if (locationId) {
    query.locationId = locationId;
  }

  return await Order.findOne(query);
}

/**
 * Get active Kitchen Display Board orders grouped into columns or filtered
 */
export async function getKitchenBoardOrders(params: {
  locationId?: string;
  status?: 'all' | 'new' | 'preparing' | 'ready' | 'scheduled';
  orderType?: string;
  priority?: string;
  search?: string;
  sortBy?: 'scheduledFor' | 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  newOrders: IOrderSafeJSON[];
  preparing: IOrderSafeJSON[];
  ready: IOrderSafeJSON[];
  summary: KitchenSummaryMetrics;
}> {
  const locationId = params.locationId || ORDER_CONFIG.defaultLocationId;
  const now = new Date();
  const activationThreshold = new Date(now.getTime() + ORDER_CONFIG.minLeadMinutes * 60 * 1000);

  // Base filter for active board orders
  const baseFilter: any = {
    locationId,
    orderStatus: { $in: [OrderStatus.RECEIVED, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY] },
  };

  if (params.orderType && params.orderType !== 'ALL') {
    baseFilter.orderType = params.orderType;
  }

  if (params.search && params.search.trim()) {
    const s = params.search.trim();
    baseFilter.$or = [
      { orderReference: { $regex: s, $options: 'i' } },
      { customerName: { $regex: s, $options: 'i' } },
      { 'items.dishName': { $regex: s, $options: 'i' } },
    ];
  }

  const orders = await Order.find(baseFilter).sort({ scheduledFor: 1, createdAt: 1 });
  const safeOrders = orders.map((o) => o.toSafeJSON());

  // Filter by priority if specified
  let filteredOrders = safeOrders;
  if (params.priority && params.priority !== 'ALL') {
    filteredOrders = safeOrders.filter((o) => o.priority === params.priority);
  }

  // Classify orders
  const newOrdersList: IOrderSafeJSON[] = [];
  const preparingList: IOrderSafeJSON[] = [];
  const readyList: IOrderSafeJSON[] = [];
  let scheduledCount = 0;

  // Compute scheduled count across location
  const scheduledCountQuery = await Order.countDocuments({
    locationId,
    orderStatus: { $in: [OrderStatus.RECEIVED, OrderStatus.CONFIRMED] },
    scheduledFor: { $gt: activationThreshold },
  });
  scheduledCount = scheduledCountQuery;

  for (const order of filteredOrders) {
    const scheduledTime = new Date(order.scheduledFor);

    if (order.orderStatus === OrderStatus.PREPARING) {
      preparingList.push(order);
    } else if (order.orderStatus === OrderStatus.READY) {
      readyList.push(order);
    } else if (order.orderStatus === OrderStatus.RECEIVED || order.orderStatus === OrderStatus.CONFIRMED) {
      // If scheduled time is within the lead time (or past), it is active in the NEW column
      if (scheduledTime <= activationThreshold) {
        newOrdersList.push(order);
      }
    }
  }

  // Sorting
  const sortDir = params.sortOrder === 'desc' ? -1 : 1;
  const sortComparator = (a: IOrderSafeJSON, b: IOrderSafeJSON) => {
    if (params.sortBy === 'priority') {
      const pMap: Record<KitchenPriority, number> = {
        [KitchenPriority.URGENT]: 3,
        [KitchenPriority.ATTENTION_REQUIRED]: 2,
        [KitchenPriority.NORMAL]: 1,
      };
      const pa = pMap[a.priority || KitchenPriority.NORMAL] || 1;
      const pb = pMap[b.priority || KitchenPriority.NORMAL] || 1;
      return (pb - pa) * sortDir;
    }
    if (params.sortBy === 'createdAt') {
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortDir;
    }
    return (new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()) * sortDir;
  };

  newOrdersList.sort(sortComparator);
  preparingList.sort(sortComparator);
  readyList.sort(sortComparator);

  const summary: KitchenSummaryMetrics = {
    newOrders: newOrdersList.length,
    preparing: preparingList.length,
    ready: readyList.length,
    scheduled: scheduledCount,
  };

  return {
    newOrders: newOrdersList,
    preparing: preparingList,
    ready: readyList,
    summary,
  };
}

/**
 * Get Kitchen activity statistics summary
 */
export async function getKitchenSummary(locationId: string = ORDER_CONFIG.defaultLocationId): Promise<KitchenSummaryMetrics> {
  const now = new Date();
  const activationThreshold = new Date(now.getTime() + ORDER_CONFIG.minLeadMinutes * 60 * 1000);

  const [newOrders, preparing, ready, scheduled] = await Promise.all([
    Order.countDocuments({
      locationId,
      orderStatus: { $in: [OrderStatus.RECEIVED, OrderStatus.CONFIRMED] },
      scheduledFor: { $lte: activationThreshold },
    }),
    Order.countDocuments({
      locationId,
      orderStatus: OrderStatus.PREPARING,
    }),
    Order.countDocuments({
      locationId,
      orderStatus: OrderStatus.READY,
    }),
    Order.countDocuments({
      locationId,
      orderStatus: { $in: [OrderStatus.RECEIVED, OrderStatus.CONFIRMED] },
      scheduledFor: { $gt: activationThreshold },
    }),
  ]);

  return {
    newOrders,
    preparing,
    ready,
    scheduled,
  };
}

/**
 * Get scheduled pre-orders beyond the preparation lead time
 */
export async function getScheduledOrders(params: {
  locationId?: string;
  orderType?: string;
  search?: string;
}): Promise<IOrderSafeJSON[]> {
  const locationId = params.locationId || ORDER_CONFIG.defaultLocationId;
  const now = new Date();
  const activationThreshold = new Date(now.getTime() + ORDER_CONFIG.minLeadMinutes * 60 * 1000);

  const query: any = {
    locationId,
    orderStatus: { $in: [OrderStatus.RECEIVED, OrderStatus.CONFIRMED] },
    scheduledFor: { $gt: activationThreshold },
  };

  if (params.orderType && params.orderType !== 'ALL') {
    query.orderType = params.orderType;
  }

  if (params.search && params.search.trim()) {
    const s = params.search.trim();
    query.$or = [
      { orderReference: { $regex: s, $options: 'i' } },
      { customerName: { $regex: s, $options: 'i' } },
      { 'items.dishName': { $regex: s, $options: 'i' } },
    ];
  }

  const orders = await Order.find(query).sort({ scheduledFor: 1 });
  return orders.map((o) => o.toSafeJSON());
}

/**
 * Get kitchen historical orders (completed, cancelled)
 */
export async function getKitchenHistory(params: {
  locationId?: string;
  orderType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<{
  orders: IOrderSafeJSON[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const locationId = params.locationId || ORDER_CONFIG.defaultLocationId;
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = {
    locationId,
    orderStatus: { $in: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
  };

  if (params.orderType && params.orderType !== 'ALL') {
    query.orderType = params.orderType;
  }

  if (params.dateFrom || params.dateTo) {
    query.createdAt = {};
    if (params.dateFrom) query.createdAt.$gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const d = new Date(params.dateTo);
      d.setHours(23, 59, 59, 999);
      query.createdAt.$lte = d;
    }
  }

  if (params.search && params.search.trim()) {
    const s = params.search.trim();
    query.$or = [
      { orderReference: { $regex: s, $options: 'i' } },
      { customerName: { $regex: s, $options: 'i' } },
      { 'items.dishName': { $regex: s, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders: orders.map((o) => o.toSafeJSON()),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Get individual order details for the kitchen
 */
export async function getKitchenOrderById(idOrRef: string, locationId?: string): Promise<IOrderSafeJSON> {
  const order = await findOrderByIdOrRef(idOrRef, locationId);
  if (!order) {
    throw new Error(`Order "${idOrRef}" was not found.`);
  }
  return order.toSafeJSON();
}

/**
 * Action: Kitchen Accepts Order
 */
export async function acceptKitchenOrder(
  idOrRef: string,
  actor: KitchenStaffActor,
  locationId?: string
): Promise<IOrderSafeJSON> {
  const order = await findOrderByIdOrRef(idOrRef, locationId);
  if (!order) {
    throw new Error(`Order "${idOrRef}" was not found.`);
  }

  if (order.kitchenAcceptedAt) {
    throw new Error(`This order has already been accepted by ${order.kitchenAcceptedByName || 'the kitchen'}.`);
  }

  if (order.orderStatus === OrderStatus.CANCELLED) {
    throw new Error('Cancelled orders cannot be accepted by the kitchen.');
  }

  if (order.orderStatus === OrderStatus.COMPLETED) {
    throw new Error('Completed orders cannot be accepted.');
  }

  const now = new Date();
  order.kitchenAcceptedAt = now;
  order.kitchenAcceptedBy = actor.id || actor.email || 'kitchen';
  order.kitchenAcceptedByName = actor.name || 'Kitchen Staff';

  // If in RECEIVED status, promote to CONFIRMED
  let statusChanged = false;
  if (order.orderStatus === OrderStatus.RECEIVED) {
    order.orderStatus = OrderStatus.CONFIRMED;
    order.confirmedAt = now;
    order.statusHistory.push({
      status: OrderStatus.CONFIRMED,
      changedAt: now,
      changedBy: actor.email || 'kitchen',
      actorType: 'STAFF',
      note: 'Order accepted into kitchen queue',
    });
    statusChanged = true;
  }

  await order.save();

  await logKitchenAudit({
    action: 'KITCHEN_ORDER_ACCEPTED',
    order,
    actor,
    details: `Order ${order.orderReference} was accepted by ${actor.name || actor.email || 'Kitchen Staff'}.`,
  });

  emitKitchenSocketEvent('kitchen.orderAccepted', order);
  emitGeneralOrderEvents('orders.updated', order);
  if (statusChanged) {
    emitGeneralOrderEvents('orders.statusChanged', order);
  }

  return order.toSafeJSON();
}

/**
 * Action: Kitchen Starts Preparation
 */
export async function startKitchenPreparation(
  idOrRef: string,
  actor: KitchenStaffActor,
  note?: string,
  locationId?: string
): Promise<IOrderSafeJSON> {
  const order = await findOrderByIdOrRef(idOrRef, locationId);
  if (!order) {
    throw new Error(`Order "${idOrRef}" was not found.`);
  }

  if (order.orderStatus === OrderStatus.PREPARING) {
    throw new Error(`Order ${order.orderReference} is already in preparation.`);
  }

  if (order.orderStatus === OrderStatus.READY) {
    throw new Error(`Order ${order.orderReference} is already marked as ready.`);
  }

  if (order.orderStatus === OrderStatus.COMPLETED || order.orderStatus === OrderStatus.CANCELLED) {
    throw new Error(`Cannot start preparation for order in status ${order.orderStatus}.`);
  }

  const now = new Date();
  order.orderStatus = OrderStatus.PREPARING;
  order.preparingAt = now;
  order.preparationStartedAt = now;
  order.preparationStartedBy = actor.name || actor.email || 'Kitchen Staff';

  if (!order.kitchenAcceptedAt) {
    order.kitchenAcceptedAt = now;
    order.kitchenAcceptedBy = actor.id || actor.email || 'kitchen';
    order.kitchenAcceptedByName = actor.name || 'Kitchen Staff';
  }

  order.statusHistory.push({
    status: OrderStatus.PREPARING,
    changedAt: now,
    changedBy: actor.email || 'kitchen',
    actorType: 'STAFF',
    note: note || 'Preparation started in the kitchen',
  });

  await order.save();

  await logKitchenAudit({
    action: 'ORDER_PREPARATION_STARTED',
    order,
    actor,
    details: `Kitchen started preparation for Order ${order.orderReference}.`,
  });

  emitKitchenSocketEvent('kitchen.orderPreparing', order);
  emitGeneralOrderEvents('orders.statusChanged', order);
  emitGeneralOrderEvents('orders.updated', order);

  return order.toSafeJSON();
}

/**
 * Action: Kitchen Marks Order Ready
 */
export async function markKitchenOrderReady(
  idOrRef: string,
  actor: KitchenStaffActor,
  note?: string,
  locationId?: string
): Promise<IOrderSafeJSON> {
  const order = await findOrderByIdOrRef(idOrRef, locationId);
  if (!order) {
    throw new Error(`Order "${idOrRef}" was not found.`);
  }

  if (order.orderStatus === OrderStatus.READY) {
    throw new Error(`Order ${order.orderReference} is already marked as ready.`);
  }

  if (order.orderStatus === OrderStatus.COMPLETED || order.orderStatus === OrderStatus.CANCELLED) {
    throw new Error(`Cannot mark order ready when status is ${order.orderStatus}.`);
  }

  const now = new Date();
  order.orderStatus = OrderStatus.READY;
  order.readyAt = now;
  order.readyBy = actor.name || actor.email || 'Kitchen Staff';

  order.statusHistory.push({
    status: OrderStatus.READY,
    changedAt: now,
    changedBy: actor.email || 'kitchen',
    actorType: 'STAFF',
    note: note || 'Dishes completed and plated; ready for pickup/handoff',
  });

  await order.save();

  await logKitchenAudit({
    action: 'ORDER_READY',
    order,
    actor,
    details: `Kitchen marked Order ${order.orderReference} ready for customer handoff.`,
  });

  emitKitchenSocketEvent('kitchen.orderReady', order);
  emitGeneralOrderEvents('orders.statusChanged', order);
  emitGeneralOrderEvents('orders.updated', order);

  // Alert floor team if this is a dine-in order
  createKitchenReadyAlert(order).catch((err) =>
    logger.warn('[KitchenService] Failed to trigger floor alert for ready order:', err)
  );

  return order.toSafeJSON();
}

/**
 * Action: Kitchen / Expediter Completes Order Handoff
 */
export async function completeKitchenOrder(
  idOrRef: string,
  actor: KitchenStaffActor,
  note?: string,
  locationId?: string
): Promise<IOrderSafeJSON> {
  const order = await findOrderByIdOrRef(idOrRef, locationId);
  if (!order) {
    throw new Error(`Order "${idOrRef}" was not found.`);
  }

  if (order.orderStatus === OrderStatus.COMPLETED) {
    throw new Error(`Order ${order.orderReference} is already completed.`);
  }

  if (order.orderStatus === OrderStatus.CANCELLED) {
    throw new Error(`Cannot complete cancelled order ${order.orderReference}.`);
  }

  const now = new Date();
  order.orderStatus = OrderStatus.COMPLETED;
  order.completedAt = now;

  order.statusHistory.push({
    status: OrderStatus.COMPLETED,
    changedAt: now,
    changedBy: actor.email || 'kitchen',
    actorType: 'STAFF',
    note: note || 'Order handoff completed; handed to customer / server',
  });

  await order.save();

  await logKitchenAudit({
    action: 'ORDER_COMPLETED',
    order,
    actor,
    details: `Kitchen/Expediter confirmed handoff for Order ${order.orderReference}.`,
  });

  emitKitchenSocketEvent('kitchen.orderCompleted', order);
  emitGeneralOrderEvents('orders.statusChanged', order);
  emitGeneralOrderEvents('orders.updated', order);

  return order.toSafeJSON();
}
