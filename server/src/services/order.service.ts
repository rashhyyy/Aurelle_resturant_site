import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  OrderType,
  OrderStatus,
  PaymentStatus,
  ORDER_CONFIG,
  ALLOWED_STATUS_TRANSITIONS,
  IOrderItemSnapshot,
  IStatusHistoryEntry,
} from '../types/order';
import { Order, IOrderDocument } from '../models/order.model';
import { MenuItem } from '../models/menuItem.model';
import { PublicationStatus } from '../types/menu';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { getSocketServer } from '../sockets/socket.server';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import {
  NotificationCategory,
  NotificationPriority,
  RecipientType,
} from '../types/notification';
import { StaffRole } from '../types/staff';

export interface OrderActor {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  actorType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
}

/**
 * Generate collision-safe order reference, e.g. "AUR-49281"
 */
export async function generateOrderReference(): Promise<string> {
  let reference = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    attempts++;
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    reference = `AUR-${randomSuffix}`;
    exists = !!(await Order.exists({ orderReference: reference }));
  }

  if (exists) {
    const timestampSuffix = Date.now().toString().slice(-5);
    reference = `AUR-${timestampSuffix}`;
  }

  return reference;
}

/**
 * Validate pickup time against operating hours, minimum lead time, and advance window
 */
export function validateAndParseScheduledTime(params: {
  scheduledFor?: string;
  pickupDate?: string;
  pickupTime?: string;
}): Date {
  let targetDate: Date;

  if (params.scheduledFor) {
    targetDate = new Date(params.scheduledFor);
  } else if (params.pickupDate && params.pickupTime) {
    // Parse pickupDate (YYYY-MM-DD) and pickupTime (e.g. "6:30 PM")
    const [year, month, day] = params.pickupDate.split('-').map(Number);
    const timeMatch = params.pickupTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!timeMatch) {
      throw new Error(`Invalid pickup time format "${params.pickupTime}". Expected format e.g. "6:30 PM".`);
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  } else {
    // Default to minimum lead time from now (e.g. 45 mins)
    targetDate = new Date(Date.now() + 45 * 60 * 1000);
  }

  if (isNaN(targetDate.getTime())) {
    throw new Error('Invalid scheduled pickup date/time specified.');
  }

  const now = new Date();
  const minLeadMs = ORDER_CONFIG.minLeadMinutes * 60 * 1000;

  // 1. Cannot be in the past or before minimum lead time
  if (targetDate.getTime() < now.getTime() + minLeadMs - 60000) {
    throw new Error(
      `Pickup time must be at least ${ORDER_CONFIG.minLeadMinutes} minutes in advance.`
    );
  }

  // 2. Cannot exceed maximum advance booking window (7 days)
  const maxAdvanceMs = ORDER_CONFIG.maxAdvanceDays * 24 * 60 * 60 * 1000;
  if (targetDate.getTime() > now.getTime() + maxAdvanceMs) {
    throw new Error(
      `Pickup date cannot be scheduled more than ${ORDER_CONFIG.maxAdvanceDays} days in advance.`
    );
  }

  // 3. Operating hours validation (11:00 to 23:00)
  const targetHour = targetDate.getHours();
  if (
    targetHour < ORDER_CONFIG.operatingHours.startHour ||
    targetHour >= ORDER_CONFIG.operatingHours.endHour
  ) {
    throw new Error(
      `Requested pickup is outside operating hours (Daily ${ORDER_CONFIG.operatingHours.startHour}:00 - ${ORDER_CONFIG.operatingHours.endHour}:00).`
    );
  }

  return targetDate;
}

/**
 * Validates menu items, stock availability, and computes authoritative prices server-side
 */
export async function calculateAuthoritativePricing(
  itemsInput: Array<{
    menuItemId: string;
    quantity: number;
    selectedOptions?: string[];
    specialInstructions?: string;
    expectedUnitPriceMinor?: number;
    unitPriceMinor?: number;
  }>,
  locationId: string,
  options?: { confirmPriceChange?: boolean }
): Promise<{
  snapshots: IOrderItemSnapshot[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  serviceChargeMinor: number;
  totalMinor: number;
}> {
  const itemIds = itemsInput.map((i) => i.menuItemId);
  
  // Find menu items by either _id or slug
  const validObjectIds = itemIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const menuItems = await MenuItem.find({
    $or: [{ _id: { $in: validObjectIds } }, { slug: { $in: itemIds } }],
  });

  const menuMap = new Map<string, any>();
  menuItems.forEach((m) => {
    menuMap.set(m._id.toString(), m);
    menuMap.set(m.slug, m);
  });

  const snapshots: IOrderItemSnapshot[] = [];
  let subtotalMinor = 0;

  for (const item of itemsInput) {
    const menuItem = menuMap.get(item.menuItemId);

    if (!menuItem) {
      throw new Error(`Menu dish "${item.menuItemId}" was not found in the restaurant catalog.`);
    }

    if (menuItem.publicationStatus !== PublicationStatus.PUBLISHED) {
      throw new Error(`Dish "${menuItem.name}" is currently a draft or archived and cannot be ordered.`);
    }

    if (!menuItem.isAvailable) {
      throw new Error(`Dish "${menuItem.name}" is currently out of stock.`);
    }

    if (
      Array.isArray(menuItem.locationIds) &&
      menuItem.locationIds.length > 0 &&
      !menuItem.locationIds.includes(locationId) &&
      !menuItem.locationIds.includes('all')
    ) {
      throw new Error(`Dish "${menuItem.name}" is not offered at the selected dining venue (${locationId}).`);
    }

    if (
      !options?.confirmPriceChange &&
      item.expectedUnitPriceMinor !== undefined &&
      item.expectedUnitPriceMinor !== menuItem.priceMinor
    ) {
      const err: any = new Error(
        `Price update required: The price of "${menuItem.name}" has changed from LKR ${(item.expectedUnitPriceMinor / 100).toLocaleString()} to LKR ${(menuItem.priceMinor / 100).toLocaleString()}. Please review the updated price before confirming.`
      );
      err.code = 'PRICE_CHANGED';
      err.priceChanges = [
        {
          menuItemId: menuItem._id.toString(),
          dishName: menuItem.name,
          oldPriceMinor: item.expectedUnitPriceMinor,
          newPriceMinor: menuItem.priceMinor,
          formattedOldPrice: `LKR ${(item.expectedUnitPriceMinor / 100).toLocaleString()}`,
          formattedNewPrice: `LKR ${(menuItem.priceMinor / 100).toLocaleString()}`,
        },
      ];
      throw err;
    }

    const lineTotalMinor = menuItem.priceMinor * item.quantity;
    subtotalMinor += lineTotalMinor;

    snapshots.push({
      menuItemId: menuItem._id.toString(),
      dishName: menuItem.name,
      quantity: item.quantity,
      unitPriceMinor: menuItem.priceMinor,
      lineTotalMinor,
      selectedOptions: item.selectedOptions || [],
      specialInstructions: item.specialInstructions || '',
      image: menuItem.images?.[0] || '',
    });
  }

  const discountMinor = 0;
  let taxRate = ORDER_CONFIG.taxRate;
  let serviceChargeRate = ORDER_CONFIG.serviceChargeRate;

  try {
    const { RestaurantSettings } = require('../models/restaurantSettings.model');
    const settings = await RestaurantSettings.findOne({ locationId }).lean();
    if (settings && settings.financialPolicy) {
      if (typeof settings.financialPolicy.taxRate === 'number') {
        taxRate = settings.financialPolicy.taxRate;
      }
      if (typeof settings.financialPolicy.serviceChargeRate === 'number') {
        serviceChargeRate = settings.financialPolicy.serviceChargeRate;
      }
    }
  } catch {
    // fallback to ORDER_CONFIG
  }

  const taxMinor = Math.round(subtotalMinor * taxRate);
  const serviceChargeMinor = Math.round(subtotalMinor * serviceChargeRate);
  const totalMinor = subtotalMinor - discountMinor + taxMinor + serviceChargeMinor;

  return {
    snapshots,
    subtotalMinor,
    discountMinor,
    taxMinor,
    serviceChargeMinor,
    totalMinor,
  };
}

/**
 * Validates reservation existence for DINE_IN_PREORDER
 */
export async function validateReservationLink(
  reservationId: string | null | undefined,
  locationId: string,
  customerEmail: string
): Promise<void> {
  if (!reservationId) {
    throw new Error('Dine-in pre-orders must be linked to an eligible table reservation ID.');
  }

  const db = mongoose.connection.readyState === 1 ? mongoose.connection.db : undefined;
  if (!db) {
    throw new Error('Database connection unavailable for reservation validation.');
  }

  const collections = await db.listCollections({ name: 'reservations' }).toArray();
  if (collections.length === 0) {
    throw new Error(
      'Reservation management system is not active in this stage. Dine-in pre-order cannot be validated.'
    );
  }

  const resCol = db.collection('reservations');
  const validObjectId = mongoose.Types.ObjectId.isValid(reservationId)
    ? new mongoose.Types.ObjectId(reservationId)
    : null;

  const query: any = {
    $or: [
      { reservationReference: reservationId.toUpperCase() },
      { reference: reservationId },
      ...(validObjectId ? [{ _id: validObjectId }] : []),
    ],
  };

  const reservation = await resCol.findOne(query);

  if (!reservation) {
    throw new Error(`Reservation "${reservationId}" was not found.`);
  }

  if (reservation.status && ['Cancelled', 'cancelled', 'CANCELLED'].includes(reservation.status)) {
    throw new Error('Pre-orders cannot be linked to a cancelled table reservation.');
  }

  if (reservation.locationId && reservation.locationId !== locationId) {
    throw new Error('Reservation venue does not match the order location.');
  }
}

/**
 * Broadcast real-time order notifications to scoped Socket.IO rooms
 */
export function emitOrderSocketEvent(
  eventName: 'orders.created' | 'orders.updated' | 'orders.statusChanged',
  order: IOrderDocument
): void {
  try {
    const io = getSocketServer();
    if (!io) return;

    const payload = order.toSafeJSON();

    // 1. Staff scoped rooms
    io.to('role:admin').to('role:manager').to('role:kitchen').emit(eventName, payload as any);

    // 2. Venue room
    if (order.locationId) {
      io.to(`location:${order.locationId}`).emit(eventName, payload as any);
    }

    // 3. Customer private room
    if (order.customerId) {
      io.to(`customer:${order.customerId}`).emit(eventName, payload as any);
    }

    // 4. Order tracking room (for live customer status page)
    if (order.orderReference) {
      io.to(`order:${order.orderReference.toUpperCase()}`).emit(eventName, payload as any);
    }

    io.to(`order:${order._id.toString()}`).emit(eventName, payload as any);
  } catch (err) {
    logger.warn('[Socket.IO] Failed to emit order event:', err);
  }
}

/**
 * Record an audit entry in StaffAuditLog
 */
export async function logOrderAudit(params: {
  action: any;
  order: IOrderDocument;
  actor: OrderActor;
  details: string;
}): Promise<void> {
  try {
    const actorId = params.actor.id || params.order.customerId || 'cust-session';
    const actorName = params.actor.name || params.order.customerName;
    const actorEmail = params.actor.email || params.order.customerEmail;

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
    logger.warn('[AuditLog] Failed to record order audit:', err);
  }
}

/**
 * Create Order with Idempotency and Authoritative Price Calculation
 */
export async function createOrder(
  data: {
    items: Array<{
      menuItemId: string;
      quantity: number;
      selectedOptions?: string[];
      specialInstructions?: string;
      expectedUnitPriceMinor?: number;
      unitPriceMinor?: number;
    }>;
    orderType: OrderType;
    locationId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerNotes?: string;
    reservationId?: string | null;
    scheduledFor?: string;
    pickupDate?: string;
    pickupTime?: string;
    idempotencyKey?: string | null;
    expectedSubtotalMinor?: number;
    confirmPriceChange?: boolean;
  },
  actor: OrderActor
): Promise<IOrderDocument> {
  // 1. Check idempotency key for duplicate submissions
  if (data.idempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey: data.idempotencyKey });
    if (existingOrder) {
      // Verify this is genuinely an idempotent retry of the SAME order
      const incomingExpectedSubtotal = data.expectedSubtotalMinor;
      const sameSubtotal =
        incomingExpectedSubtotal === undefined ||
        existingOrder.subtotalMinor === incomingExpectedSubtotal;
      const sameItemCount =
        !data.items || existingOrder.items.length === data.items.length;

      if (sameSubtotal && sameItemCount) {
        logger.info(
          `[OrderService] Idempotency match hit for key "${data.idempotencyKey}". Returning existing order ${existingOrder.orderReference}.`
        );
        return existingOrder;
      }

      logger.warn(
        `[OrderService] Reused idempotency key "${data.idempotencyKey}" detected with differing payload (existing: ${existingOrder.items.length} items / LKR ${existingOrder.subtotalMinor / 100}, incoming: ${data.items?.length} items / LKR ${(incomingExpectedSubtotal || 0) / 100}). Creating fresh order.`
      );
    }
  }

  // 2. Validate scheduling
  const scheduledFor = validateAndParseScheduledTime({
    scheduledFor: data.scheduledFor,
    pickupDate: data.pickupDate,
    pickupTime: data.pickupTime,
  });

  // 3. Validate reservation if dine-in
  if (data.orderType === OrderType.DINE_IN_PREORDER) {
    await validateReservationLink(data.reservationId, data.locationId, data.customerEmail);
  }

  // 4. Calculate authoritative prices and snapshots (with price drift check)
  const pricing = await calculateAuthoritativePricing(data.items, data.locationId, {
    confirmPriceChange: data.confirmPriceChange,
  });

  // 5. Generate collision-safe reference
  const orderReference = await generateOrderReference();

  // 6. Initial status history
  const initialHistory: IStatusHistoryEntry = {
    status: OrderStatus.RECEIVED,
    changedAt: new Date(),
    changedBy: actor.email || data.customerEmail,
    actorType: actor.actorType,
    note: 'Order submitted by customer',
  };

  // 7. Persist to MongoDB
  const newOrder = await Order.create({
    orderReference,
    customerId: actor.id || null,
    customerName: data.customerName,
    customerEmail: data.customerEmail.toLowerCase(),
    customerPhone: data.customerPhone,
    locationId: data.locationId || 'loc-colombo-main',
    orderType: data.orderType,
    reservationId: data.reservationId || null,
    items: pricing.snapshots,
    subtotalMinor: pricing.subtotalMinor,
    discountMinor: pricing.discountMinor,
    taxMinor: pricing.taxMinor,
    serviceChargeMinor: pricing.serviceChargeMinor,
    totalMinor: pricing.totalMinor,
    currency: ORDER_CONFIG.currency,
    orderStatus: OrderStatus.RECEIVED,
    paymentStatus: PaymentStatus.UNPAID,
    scheduledFor,
    customerNotes: data.customerNotes || '',
    ...(data.idempotencyKey ? { idempotencyKey: data.idempotencyKey } : {}),
    statusHistory: [initialHistory],
  });

  // 8. Log audit
  await logOrderAudit({
    action: 'ORDER_CREATED',
    order: newOrder,
    actor,
    details: `Customer placed order ${orderReference} (${data.orderType}) for ${newOrder.toSafeJSON().formattedTotal}`,
  });

  // 9. Real-time broadcast
  emitOrderSocketEvent('orders.created', newOrder);

  // 10. Automated business event notifications
  if (newOrder.customerId || newOrder.customerEmail) {
    notificationService.createNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: newOrder.customerId || newOrder.customerEmail,
      recipientEmail: newOrder.customerEmail,
      recipientPhone: newOrder.customerPhone,
      title: `Order Received: ${orderReference}`,
      message: `Your ${data.orderType.toLowerCase()} order of ${pricing.snapshots.length} item(s) has been logged with the kitchen.`,
      category: NotificationCategory.ORDER,
      priority: NotificationPriority.NORMAL,
      link: `/account/orders`,
      metadata: { orderId: newOrder._id.toString(), orderReference },
    }).catch((err) => logger.warn('[OrderService] Customer notification warning:', err));
  }

  notificationService.notifyStaffRole({
    role: StaffRole.KITCHEN,
    locationId: data.locationId,
    title: `New Order: ${orderReference}`,
    message: `${data.orderType} order containing ${pricing.snapshots.length} item(s) ready for preparation.`,
    category: NotificationCategory.ORDER,
    priority: NotificationPriority.HIGH,
    link: `/staff/kitchen`,
    metadata: { orderId: newOrder._id.toString(), orderReference },
  }).catch((err) => logger.warn('[OrderService] Kitchen staff notification warning:', err));

  return newOrder;
}

/**
 * Authorized Order Status Transition
 */
export async function transitionOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actor: OrderActor,
  note?: string
): Promise<IOrderDocument> {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error(`Order with ID "${orderId}" was not found.`);
  }

  const currentStatus = order.orderStatus;

  // Validate state transition
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition order from status "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowed.join(', ') || 'None (Terminal)'}.`
    );
  }

  // Update timestamps
  const now = new Date();
  if (newStatus === OrderStatus.CONFIRMED) order.confirmedAt = now;
  if (newStatus === OrderStatus.PREPARING) order.preparingAt = now;
  if (newStatus === OrderStatus.READY) order.readyAt = now;
  if (newStatus === OrderStatus.COMPLETED) order.completedAt = now;
  if (newStatus === OrderStatus.CANCELLED) order.cancelledAt = now;

  order.orderStatus = newStatus;
  order.statusHistory.push({
    status: newStatus,
    changedAt: now,
    changedBy: actor.email || 'staff',
    actorType: actor.actorType,
    note: note || `Status changed from ${currentStatus} to ${newStatus}`,
  });

  await order.save();

  // Audit log
  let auditAction: any = 'ORDER_STATUS_CHANGED';
  if (newStatus === OrderStatus.CONFIRMED) auditAction = 'ORDER_CONFIRMED';
  if (newStatus === OrderStatus.PREPARING) auditAction = 'ORDER_PREPARATION_STARTED';
  if (newStatus === OrderStatus.READY) auditAction = 'ORDER_READY';
  if (newStatus === OrderStatus.COMPLETED) auditAction = 'ORDER_COMPLETED';
  if (newStatus === OrderStatus.CANCELLED) auditAction = 'ORDER_CANCELLED';

  await logOrderAudit({
    action: auditAction,
    order,
    actor,
    details: `Order ${order.orderReference} transitioned to ${newStatus}. Note: ${note || 'None'}`,
  });

  // Socket broadcast
  emitOrderSocketEvent('orders.statusChanged', order);
  emitOrderSocketEvent('orders.updated', order);

  // Automated notification on critical order state change
  if (newStatus === OrderStatus.READY) {
    if (order.customerId || order.customerEmail) {
      notificationService.createNotification({
        recipientType: RecipientType.CUSTOMER,
        recipientId: order.customerId || order.customerEmail,
        recipientEmail: order.customerEmail,
        recipientPhone: order.customerPhone,
        title: `Order Ready: ${order.orderReference}`,
        message:
          order.orderType === OrderType.TAKEAWAY
            ? 'Your takeaway order is prepared and ready for pickup at the front counter.'
            : 'Your order is ready and being presented to your table.',
        category: NotificationCategory.ORDER,
        priority: NotificationPriority.HIGH,
        link: `/account/orders`,
        metadata: { orderId: order._id.toString(), orderReference: order.orderReference },
      }).catch((err) => logger.warn('[OrderService] Order ready notification warning:', err));
    }
  } else if (newStatus === OrderStatus.CANCELLED) {
    if (order.customerId || order.customerEmail) {
      notificationService.createNotification({
        recipientType: RecipientType.CUSTOMER,
        recipientId: order.customerId || order.customerEmail,
        recipientEmail: order.customerEmail,
        recipientPhone: order.customerPhone,
        title: `Order Cancelled: ${order.orderReference}`,
        message: `Your order ${order.orderReference} has been cancelled.`,
        category: NotificationCategory.ORDER,
        priority: NotificationPriority.URGENT,
        link: `/account/orders`,
        metadata: { orderId: order._id.toString(), orderReference: order.orderReference },
      }).catch((err) => logger.warn('[OrderService] Order cancelled notification warning:', err));
    }
  }

  return order;
}

/**
 * Customer or Admin Cancellation
 */
export async function cancelOrder(
  orderId: string,
  actor: OrderActor,
  reason: string
): Promise<IOrderDocument> {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error(`Order with ID "${orderId}" was not found.`);
  }

  if (order.orderStatus === OrderStatus.CANCELLED) {
    throw new Error('This order is already cancelled.');
  }

  if (order.orderStatus === OrderStatus.COMPLETED) {
    throw new Error('Completed orders cannot be cancelled.');
  }

  // For customers, can only cancel while RECEIVED or CONFIRMED
  if (actor.actorType === 'CUSTOMER') {
    if (order.orderStatus !== OrderStatus.RECEIVED && order.orderStatus !== OrderStatus.CONFIRMED) {
      throw new Error(
        `Order is currently ${order.orderStatus}. Orders that are already in preparation or ready cannot be cancelled online. Please contact the restaurant.`
      );
    }
  }

  const now = new Date();
  order.orderStatus = OrderStatus.CANCELLED;
  order.cancelledAt = now;
  order.cancellationReason = reason;
  order.statusHistory.push({
    status: OrderStatus.CANCELLED,
    changedAt: now,
    changedBy: actor.email || 'customer',
    actorType: actor.actorType,
    note: `Cancelled: ${reason}`,
  });

  await order.save();

  await logOrderAudit({
    action: 'ORDER_CANCELLED',
    order,
    actor,
    details: `Order ${order.orderReference} was cancelled by ${actor.actorType}. Reason: ${reason}`,
  });

  emitOrderSocketEvent('orders.statusChanged', order);
  emitOrderSocketEvent('orders.updated', order);

  return order;
}
