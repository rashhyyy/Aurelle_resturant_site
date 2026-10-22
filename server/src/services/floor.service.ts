/**
 * Aurelle Restaurant Management Platform
 * Floor Operations & Management Service (Stage 11)
 */

import mongoose from 'mongoose';
import { Table, ITableDocument } from '../models/table.model';
import { DiningSession, IDiningSessionDocument } from '../models/diningSession.model';
import { ServiceRequest, IServiceRequestDocument } from '../models/serviceRequest.model';
import { CleaningTask, ICleaningTaskDocument } from '../models/cleaningTask.model';
import { KitchenAlert, IKitchenAlertDocument } from '../models/kitchenAlert.model';
import { Reservation, IReservationDocument } from '../models/reservation.model';
import { Order, IOrderDocument } from '../models/order.model';
import { Staff } from '../models/staff.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { getSocketServer } from '../sockets/socket.server';
import { logger } from '../utils/logger';
import {
  TableSection,
  TableStatus,
  ITableSafeJSON,
  ITableLayout,
  TableShape,
} from '../types/table';
import {
  DiningSessionStatus,
  ServiceRequestType,
  ServiceRequestPriority,
  ServiceRequestStatus,
  CleaningTaskStatus,
  KitchenAlertStatus,
  IDiningSessionSafeJSON,
  IServiceRequestSafeJSON,
  ICleaningTaskSafeJSON,
  IKitchenAlertSafeJSON,
  FloorOverviewMetrics,
  FloorTableDetailItem,
} from '../types/floor';
import { StaffRole, StaffStatus, StaffAuditAction } from '../types/staff';
import { ReservationStatus } from '../types/reservation';
import { notificationService } from './notification.service';
import {
  NotificationCategory,
  NotificationPriority,
  RecipientType,
} from '../types/notification';
import { OrderStatus, OrderType } from '../types/order';

export interface FloorActor {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

/**
 * Emit real-time Socket.IO events to floor and staff rooms
 */
export function emitFloorEvent(
  eventName: string,
  locationId: string,
  payload: any
): void {
  try {
    const io = getSocketServer();
    if (!io) return;

    io.to(`floor:${locationId}`)
      .to(`staff:${locationId}`)
      .to(`location:${locationId}`)
      .to('role:floor')
      .to('role:reception')
      .to('role:admin')
      .to('role:manager')
      .emit(eventName as any, payload);
  } catch (err) {
    logger.warn('[Socket.IO] Failed to emit floor event:', err);
  }
}

/**
 * Log regulatory staff audit record for floor actions
 */
export async function logFloorAudit(params: {
  action: StaffAuditAction;
  targetId: string;
  targetName?: string;
  locationId: string;
  actor: FloorActor;
  details: string;
}): Promise<void> {
  try {
    await StaffAuditLog.create({
      actorId: params.actor.id || 'floor-system',
      actorName: params.actor.name || params.actor.email || 'Floor Staff',
      actorEmail: params.actor.email || 'floor@aurelle.com',
      targetStaffId: params.targetId,
      targetStaffName: params.targetName || `Floor Target ${params.targetId}`,
      targetStaffEmail: params.actor.email || 'floor@aurelle.com',
      action: params.action,
      details: params.details,
      locationId: params.locationId,
      ipAddress: '127.0.0.1',
    });
  } catch (err) {
    logger.warn('[Floor Audit] Failed to record audit log:', err);
  }
}

/**
 * GET /api/floor/overview
 * Real-time aggregated floor telemetry from live MongoDB records
 */
export async function getFloorOverview(locationId: string): Promise<FloorOverviewMetrics> {
  const [
    tables,
    activeSessionsCount,
    activeRequestsCount,
    kitchenAlertsCount,
  ] = await Promise.all([
    Table.find({ locationId, isActive: true }),
    DiningSession.countDocuments({ locationId, status: DiningSessionStatus.ACTIVE }),
    ServiceRequest.countDocuments({
      locationId,
      status: { $in: [ServiceRequestStatus.OPEN, ServiceRequestStatus.ACKNOWLEDGED, ServiceRequestStatus.IN_PROGRESS] },
    }),
    KitchenAlert.countDocuments({
      locationId,
      status: { $in: [KitchenAlertStatus.NEW, KitchenAlertStatus.ACKNOWLEDGED] },
    }),
  ]);

  let availableCount = 0;
  let occupiedCount = 0;
  let reservedCount = 0;
  let awaitingCleaningCount = 0;
  let cleaningCount = 0;
  let unavailableCount = 0;

  for (const t of tables) {
    switch (t.status) {
      case TableStatus.AVAILABLE:
        availableCount++;
        break;
      case TableStatus.OCCUPIED:
        occupiedCount++;
        break;
      case TableStatus.RESERVED:
        reservedCount++;
        break;
      case TableStatus.AWAITING_CLEANING:
        awaitingCleaningCount++;
        break;
      case TableStatus.CLEANING:
        cleaningCount++;
        break;
      case TableStatus.UNAVAILABLE:
        unavailableCount++;
        break;
    }
  }

  // Format local time in Asia/Colombo (UTC+05:30)
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const locationName =
    locationId === 'loc-kandy-vip' ? 'Aurelle Sanctuary & Pavilion (Kandy)' : 'Aurelle Grand Reserve (Colombo)';

  return {
    locationId,
    locationName,
    localDate: dateFormatter.format(now),
    localTime: timeFormatter.format(now),
    availableTables: availableCount,
    occupiedTables: occupiedCount,
    reservedTables: reservedCount,
    awaitingCleaningTables: awaitingCleaningCount,
    activeServiceRequests: activeRequestsCount,
    activeDiningSessions: activeSessionsCount,
    kitchenReadyAlerts: kitchenAlertsCount,
    totalTables: tables.length,
    tableSummary: {
      available: availableCount,
      occupied: occupiedCount,
      reserved: reservedCount,
      awaitingCleaning: awaitingCleaningCount,
      cleaning: cleaningCount,
      unavailable: unavailableCount,
      total: tables.length,
    },
  };
}

/**
 * GET /api/floor/layout
 * Retrieves floor layout configuration with setup-required state check
 */
export async function getFloorLayout(locationId: string): Promise<{
  locationId: string;
  setupRequired: boolean;
  tables: ITableSafeJSON[];
}> {
  const tables = await Table.find({ locationId, isActive: true }).sort({ tableNumber: 1 });
  const setupRequired = tables.length === 0 || tables.some((t) => !t.layout || t.layout.positionX === undefined);

  return {
    locationId,
    setupRequired,
    tables: tables.map((t) => t.toSafeJSON()),
  };
}

/**
 * PUT /api/floor/layout
 * Admin/Manager bulk updates table layout geometry
 */
export async function updateFloorLayout(
  locationId: string,
  layoutUpdates: Array<{
    tableId: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    rotation?: number;
    shape?: TableShape;
    sectionId?: string;
    displayOrder?: number;
  }>,
  actor: FloorActor
): Promise<ITableSafeJSON[]> {
  const updatedTables: ITableSafeJSON[] = [];

  for (const item of layoutUpdates) {
    if (!item.tableId) continue;
    const table = await Table.findOne({ _id: item.tableId, locationId });
    if (!table) continue;

    table.layout = {
      floorId: 'floor-main',
      sectionId: item.sectionId || table.section,
      positionX: Math.max(0, Math.min(100, item.positionX)),
      positionY: Math.max(0, Math.min(100, item.positionY)),
      width: Math.max(2, item.width || 10),
      height: Math.max(2, item.height || 10),
      rotation: item.rotation || 0,
      shape: item.shape || 'RECTANGLE',
      displayOrder: item.displayOrder || 0,
    };

    await table.save();
    updatedTables.push(table.toSafeJSON());
  }

  await logFloorAudit({
    action: 'FLOOR_LAYOUT_MODIFIED',
    targetId: locationId,
    targetName: `Floor Layout for ${locationId}`,
    locationId,
    actor,
    details: `Updated floor layout geometry for ${updatedTables.length} tables.`,
  });

  emitFloorEvent('floor.tableUpdated', locationId, {
    action: 'LAYOUT_UPDATED',
    tableCount: updatedTables.length,
  });

  return updatedTables;
}

/**
 * GET /api/floor/tables
 * Detailed table inventory with active session, assigned staff, and next bookings
 */
export async function getFloorTables(
  locationId: string,
  section?: string
): Promise<FloorTableDetailItem[]> {
  const query: any = { locationId, isActive: true };
  if (section && section !== 'ALL') {
    query.section = section;
  }

  const [tables, activeSessions, openRequests, activeAlerts, cleaningTasks] = await Promise.all([
    Table.find(query).sort({ tableNumber: 1 }),
    DiningSession.find({ locationId, status: DiningSessionStatus.ACTIVE }),
    ServiceRequest.find({
      locationId,
      status: { $in: [ServiceRequestStatus.OPEN, ServiceRequestStatus.ACKNOWLEDGED, ServiceRequestStatus.IN_PROGRESS] },
    }),
    KitchenAlert.find({
      locationId,
      status: { $in: [KitchenAlertStatus.NEW, KitchenAlertStatus.ACKNOWLEDGED] },
    }),
    CleaningTask.find({
      locationId,
      status: { $in: [CleaningTaskStatus.PENDING, CleaningTaskStatus.IN_PROGRESS] },
    }),
  ]);

  // Today window for upcoming reservations
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const upcomingReservations = await Reservation.find({
    locationId,
    status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] },
    startAt: { $gte: dayStart, $lte: dayEnd },
  }).sort({ startAt: 1 });

  return tables.map((table) => {
    const tableIdStr = table._id.toString();
    const safeTable = table.toSafeJSON();

    // Match active session
    const session = activeSessions.find(
      (s) => s.tableIds.includes(tableIdStr) || s.tableNumbers.includes(table.tableNumber)
    );

    // Match service requests
    const tableRequests = openRequests.filter(
      (r) => r.tableId === tableIdStr || r.tableNumber === table.tableNumber
    );

    // Match kitchen alerts
    const tableAlerts = activeAlerts.filter(
      (a) => a.tableId === tableIdStr || a.tableNumber === table.tableNumber
    );

    // Match cleaning task
    const task = cleaningTasks.find(
      (c) => c.tableId === tableIdStr || c.tableNumber === table.tableNumber
    );

    // Match upcoming reservations
    const matchedBookings = upcomingReservations.filter(
      (r) => r.tableIds && r.tableIds.map((tid) => tid.toString()).includes(tableIdStr)
    );

    return {
      ...safeTable,
      activeSession: session ? session.toSafeJSON() : null,
      serviceRequests: tableRequests.map((r) => r.toSafeJSON()),
      kitchenAlerts: tableAlerts.map((a) => a.toSafeJSON()),
      cleaningTask: task ? task.toSafeJSON() : null,
      upcomingReservations: matchedBookings.map((r) => ({
        reference: r.reservationReference,
        guestName: r.guestName,
        guestCount: r.guestCount,
        time: r.toSafeJSON().reservationTime,
        status: r.status,
      })),
    };
  });
}

/**
 * GET /api/floor/tables/:id
 * Single table detail with linked session and order breakdown
 */
export async function getFloorTableDetail(
  tableIdOrNumber: string,
  locationId: string
): Promise<FloorTableDetailItem> {
  const isObjectId = mongoose.Types.ObjectId.isValid(tableIdOrNumber);
  const query: any = isObjectId
    ? { $or: [{ _id: tableIdOrNumber }, { tableNumber: tableIdOrNumber.toUpperCase() }] }
    : { tableNumber: tableIdOrNumber.toUpperCase() };
  if (locationId) query.locationId = locationId;

  const table = await Table.findOne(query);
  if (!table) {
    throw new Error(`Table "${tableIdOrNumber}" was not found.`);
  }

  const tableIdStr = table._id.toString();

  const [activeSession, serviceRequests, cleaningTask, kitchenAlerts, reservations] = await Promise.all([
    DiningSession.findOne({
      locationId: table.locationId,
      status: DiningSessionStatus.ACTIVE,
      $or: [{ tableIds: tableIdStr }, { tableNumbers: table.tableNumber }],
    }),
    ServiceRequest.find({
      locationId: table.locationId,
      $or: [{ tableId: tableIdStr }, { tableNumber: table.tableNumber }],
    }).sort({ createdAt: -1 }).limit(10),
    CleaningTask.findOne({
      locationId: table.locationId,
      status: { $in: [CleaningTaskStatus.PENDING, CleaningTaskStatus.IN_PROGRESS] },
      $or: [{ tableId: tableIdStr }, { tableNumber: table.tableNumber }],
    }),
    KitchenAlert.find({
      locationId: table.locationId,
      status: { $in: [KitchenAlertStatus.NEW, KitchenAlertStatus.ACKNOWLEDGED] },
      $or: [{ tableId: tableIdStr }, { tableNumber: table.tableNumber }],
    }),
    Reservation.find({
      locationId: table.locationId,
      tableIds: tableIdStr,
      status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.SEATED] },
    }).sort({ startAt: -1 }).limit(5),
  ]);

  // Find any linked orders for this session or reservation
  let relatedOrders: any[] = [];
  if (activeSession?.reservationReference) {
    const orders = await Order.find({
      locationId: table.locationId,
      reservationId: activeSession.reservationReference,
    }).sort({ createdAt: -1 });

    relatedOrders = orders.map((o) => ({
      orderId: o._id.toString(),
      orderReference: o.orderReference,
      orderStatus: o.orderStatus,
      orderType: o.orderType,
      totalMinor: o.totalMinor,
      itemsSummary: o.items.map((i) => `${i.quantity}x ${i.dishName}`).join(', '),
    }));
  }

  return {
    ...table.toSafeJSON(),
    activeSession: activeSession ? activeSession.toSafeJSON() : null,
    serviceRequests: serviceRequests.map((r) => r.toSafeJSON()),
    cleaningTask: cleaningTask ? cleaningTask.toSafeJSON() : null,
    kitchenAlerts: kitchenAlerts.map((a) => a.toSafeJSON()),
    relatedOrders,
    upcomingReservations: reservations.map((r) => ({
      reference: r.reservationReference,
      guestName: r.guestName,
      guestCount: r.guestCount,
      time: r.toSafeJSON().reservationTime,
      status: r.status,
    })),
  };
}

/**
 * GET /api/floor/my-tables
 * Returns tables assigned to the logged-in staff member
 */
export async function getMyAssignedTables(
  staffId: string,
  locationId: string
): Promise<FloorTableDetailItem[]> {
  const allTables = await getFloorTables(locationId);
  return allTables.filter(
    (t) =>
      t.assignedStaffId === staffId ||
      (t.activeSession && t.activeSession.assignedStaffIds.includes(staffId))
  );
}

/**
 * POST /api/floor/tables/:id/assign
 * Assigns floor staff to an individual table
 */
export async function assignStaffToTable(
  tableId: string,
  staffId: string | null,
  actor: FloorActor,
  locationId: string
): Promise<ITableSafeJSON> {
  const table = await Table.findOne({ _id: tableId, locationId });
  if (!table) {
    throw new Error(`Table with ID "${tableId}" was not found.`);
  }

  let assignedStaffName: string | null = null;
  if (staffId) {
    const staffMember = await Staff.findOne({
      _id: staffId,
      status: StaffStatus.ACTIVE,
      locationIds: locationId,
    });
    if (!staffMember) {
      throw new Error('Assigned staff member is inactive, invalid, or unauthorized for this venue.');
    }
    assignedStaffName = `${staffMember.firstName} ${staffMember.lastName}`;
  }

  table.assignedStaffId = staffId || null;
  table.assignedStaffName = assignedStaffName;
  await table.save();

  // Also update any active dining session on this table
  if (staffId) {
    const session = await DiningSession.findOne({
      locationId,
      status: DiningSessionStatus.ACTIVE,
      tableIds: table._id.toString(),
    });
    if (session && !session.assignedStaffIds.includes(staffId)) {
      session.assignedStaffIds.push(staffId);
      if (assignedStaffName && !session.assignedStaffNames.includes(assignedStaffName)) {
        session.assignedStaffNames.push(assignedStaffName);
      }
      await session.save();
    }
  }

  await logFloorAudit({
    action: 'FLOOR_ASSIGNMENT_CHANGED',
    targetId: table.tableNumber,
    targetName: `Table ${table.tableNumber}`,
    locationId,
    actor,
    details: staffId
      ? `Assigned ${assignedStaffName} to Table ${table.tableNumber}.`
      : `Removed staff assignment from Table ${table.tableNumber}.`,
  });

  emitFloorEvent('floor.tableUpdated', locationId, {
    tableId: table._id.toString(),
    tableNumber: table.tableNumber,
    assignedStaffId: table.assignedStaffId,
    assignedStaffName: table.assignedStaffName,
  });

  return table.toSafeJSON();
}

/**
 * Creates or activates a dining session when guests are seated
 * (Called from reception seating & walk-ins)
 */
export async function createOrActivateDiningSession(params: {
  locationId: string;
  tableIds: string[];
  tableNumbers: string[];
  reservationId?: string | null;
  reservationReference?: string | null;
  guestName: string;
  guestCount: number;
  actor: FloorActor;
  notes?: string;
}): Promise<IDiningSessionDocument> {
  const {
    locationId,
    tableIds,
    tableNumbers,
    reservationId,
    reservationReference,
    guestName,
    guestCount,
    actor,
    notes,
  } = params;

  // Check if an active session already exists for this reservation or table
  let existingSession = await DiningSession.findOne({
    locationId,
    status: DiningSessionStatus.ACTIVE,
    $or: [
      ...(reservationReference ? [{ reservationReference }] : []),
      { tableIds: { $in: tableIds } },
    ],
  });

  if (existingSession) {
    return existingSession;
  }

  // Find default staff assignments from tables
  const tables = await Table.find({ _id: { $in: tableIds } });
  const assignedStaffIds = tables
    .map((t) => t.assignedStaffId)
    .filter((id): id is string => Boolean(id));
  const assignedStaffNames = tables
    .map((t) => t.assignedStaffName)
    .filter((n): n is string => Boolean(n));

  const session = await DiningSession.create({
    locationId,
    tableIds,
    tableNumbers,
    reservationId: reservationId || null,
    reservationReference: reservationReference || null,
    guestName,
    guestCount,
    status: DiningSessionStatus.ACTIVE,
    seatedAt: new Date(),
    assignedStaffIds: Array.from(new Set(assignedStaffIds)),
    assignedStaffNames: Array.from(new Set(assignedStaffNames)),
    notes: notes || undefined,
  });

  await logFloorAudit({
    action: 'DINING_SESSION_CREATED',
    targetId: session._id.toString(),
    targetName: `Session for Table ${tableNumbers.join(', ')}`,
    locationId,
    actor,
    details: `Started dining session for ${guestName} (${guestCount} guests) at Table ${tableNumbers.join(', ')}.`,
  });

  emitFloorEvent('floor.guestSeated', locationId, session.toSafeJSON());
  return session;
}

/**
 * GET /api/floor/sessions
 * List active dining sessions with duration
 */
export async function getActiveDiningSessions(locationId: string): Promise<IDiningSessionSafeJSON[]> {
  const sessions = await DiningSession.find({
    locationId,
    status: DiningSessionStatus.ACTIVE,
  }).sort({ seatedAt: -1 });

  return sessions.map((s) => s.toSafeJSON());
}

/**
 * POST /api/floor/sessions/:id/close
 * Closes dining session, sets table to AWAITING_CLEANING, and creates cleaning task
 */
export async function closeDiningSession(
  sessionId: string,
  actor: FloorActor,
  locationId: string
): Promise<{
  session: IDiningSessionSafeJSON;
  cleaningTasks: ICleaningTaskSafeJSON[];
}> {
  const session = await DiningSession.findOne({ _id: sessionId, locationId });
  if (!session) {
    throw new Error('Dining session not found.');
  }

  if (session.status === DiningSessionStatus.CLOSED) {
    throw new Error('Dining session is already closed.');
  }

  const now = new Date();
  session.status = DiningSessionStatus.CLOSED;
  session.completedAt = now;
  session.completedBy = actor.name || actor.email || 'Floor Staff';
  await session.save();

  // Update physical table statuses to AWAITING_CLEANING
  await Table.updateMany(
    { _id: { $in: session.tableIds } },
    { status: TableStatus.AWAITING_CLEANING }
  );

  // Automatically create a CleaningTask for each table in the session
  const createdTasks: ICleaningTaskSafeJSON[] = [];
  for (let i = 0; i < session.tableIds.length; i++) {
    const tableId = session.tableIds[i];
    const tableNumber = session.tableNumbers[i] || 'T??';

    // Verify no existing active cleaning task
    let task = await CleaningTask.findOne({
      locationId,
      tableId,
      status: { $in: [CleaningTaskStatus.PENDING, CleaningTaskStatus.IN_PROGRESS] },
    });

    if (!task) {
      task = await CleaningTask.create({
        locationId,
        tableId,
        tableNumber,
        priority: ServiceRequestPriority.NORMAL,
        status: CleaningTaskStatus.PENDING,
        notes: `Turnover following dining session ${session.reservationReference || 'Walk-in'}`,
      });
    }

    createdTasks.push(task.toSafeJSON());
  }

  await logFloorAudit({
    action: 'DINING_SESSION_CLOSED',
    targetId: session._id.toString(),
    targetName: `Session for Table ${session.tableNumbers.join(', ')}`,
    locationId,
    actor,
    details: `Closed dining session for Table ${session.tableNumbers.join(', ')}. Tables placed in AWAITING_CLEANING.`,
  });

  emitFloorEvent('floor.sessionClosed', locationId, {
    sessionId: session._id.toString(),
    tableNumbers: session.tableNumbers,
    tableIds: session.tableIds,
  });

  emitFloorEvent('floor.tableUpdated', locationId, {
    tableNumbers: session.tableNumbers,
    status: TableStatus.AWAITING_CLEANING,
  });

  return {
    session: session.toSafeJSON(),
    cleaningTasks: createdTasks,
  };
}

/**
 * GET /api/floor/service-requests
 * Query service requests for location
 */
export async function getServiceRequests(
  locationId: string,
  statusFilter?: string
): Promise<IServiceRequestSafeJSON[]> {
  const query: any = { locationId };
  if (statusFilter && statusFilter !== 'ALL') {
    query.status = statusFilter;
  }

  const requests = await ServiceRequest.find(query).sort({ createdAt: -1 });
  return requests.map((r) => r.toSafeJSON());
}

/**
 * POST /api/floor/service-requests
 * Creates a new guest or staff service request
 */
export async function createServiceRequest(
  input: {
    locationId: string;
    tableId?: string;
    tableNumber?: string;
    diningSessionId?: string;
    requestType: ServiceRequestType;
    description: string;
    priority?: ServiceRequestPriority;
  },
  actor: FloorActor
): Promise<IServiceRequestSafeJSON> {
  const { locationId, requestType, description } = input;
  let tableId = input.tableId;
  let tableNumber = input.tableNumber;

  if (!tableId && !tableNumber) {
    throw new Error('Table ID or Table Number is required.');
  }

  // Lookup table
  const table = await Table.findOne(
    tableId ? { _id: tableId, locationId } : { tableNumber: tableNumber!.toUpperCase(), locationId }
  );

  if (!table) {
    throw new Error(`Table "${tableId || tableNumber}" was not found.`);
  }

  tableId = table._id.toString();
  tableNumber = table.tableNumber;

  // Lookup active session if not provided
  let diningSessionId = input.diningSessionId;
  if (!diningSessionId) {
    const session = await DiningSession.findOne({
      locationId,
      status: DiningSessionStatus.ACTIVE,
      tableIds: tableId,
    });
    if (session) diningSessionId = session._id.toString();
  }

  const newRequest = await ServiceRequest.create({
    locationId,
    tableId,
    tableNumber,
    diningSessionId: diningSessionId || null,
    requestType: requestType || ServiceRequestType.OTHER,
    description: description.trim(),
    priority: input.priority || ServiceRequestPriority.NORMAL,
    status: ServiceRequestStatus.OPEN,
    assignedStaffId: table.assignedStaffId || null,
    assignedStaffName: table.assignedStaffName || null,
    createdBy: actor.name || actor.email || 'Floor Staff',
  });

  await logFloorAudit({
    action: 'SERVICE_REQUEST_CREATED',
    targetId: newRequest._id.toString(),
    targetName: `Request for Table ${tableNumber}`,
    locationId,
    actor,
    details: `Created ${newRequest.requestType} request for Table ${tableNumber}: "${description}".`,
  });

  emitFloorEvent('floor.serviceRequestCreated', locationId, newRequest.toSafeJSON());

  // Notify assigned floor staff or all floor staff for this location
  if (table.assignedStaffId) {
    notificationService.createNotification({
      recipientType: RecipientType.STAFF,
      recipientId: table.assignedStaffId.toString(),
      recipientRole: StaffRole.FLOOR,
      locationId,
      title: `Table ${tableNumber} Service Request`,
      message: `${newRequest.requestType}: ${description.slice(0, 100)}`,
      category: NotificationCategory.FLOOR,
      priority: NotificationPriority.HIGH,
      link: `/staff/floor`,
      metadata: { requestId: newRequest._id.toString(), tableNumber },
    }).catch((err) => logger.warn('[FloorService] Service request staff notification error:', err));
  } else {
    notificationService.notifyStaffRole({
      role: StaffRole.FLOOR,
      locationId,
      title: `Table ${tableNumber} Service Request`,
      message: `${newRequest.requestType}: ${description.slice(0, 100)}`,
      category: NotificationCategory.FLOOR,
      priority: NotificationPriority.HIGH,
      link: `/staff/floor`,
      metadata: { requestId: newRequest._id.toString(), tableNumber },
    }).catch((err) => logger.warn('[FloorService] Service request role broadcast error:', err));
  }

  return newRequest.toSafeJSON();
}

/**
 * PATCH /api/floor/service-requests/:id
 * Updates service request state: ACKNOWLEDGED, IN_PROGRESS, RESOLVED, CANCELLED
 */
export async function updateServiceRequestStatus(
  requestId: string,
  newStatus: ServiceRequestStatus,
  actor: FloorActor,
  locationId: string,
  notes?: string
): Promise<IServiceRequestSafeJSON> {
  const request = await ServiceRequest.findOne({ _id: requestId, locationId });
  if (!request) {
    throw new Error('Service request not found.');
  }

  if (
    request.status === ServiceRequestStatus.RESOLVED ||
    request.status === ServiceRequestStatus.CANCELLED
  ) {
    throw new Error(`Cannot update request that is already ${request.status}.`);
  }

  const now = new Date();
  const actorName = actor.name || actor.email || 'Floor Staff';

  if (newStatus === ServiceRequestStatus.ACKNOWLEDGED) {
    request.status = ServiceRequestStatus.ACKNOWLEDGED;
    request.acknowledgedAt = now;
    request.acknowledgedBy = actorName;
  } else if (newStatus === ServiceRequestStatus.IN_PROGRESS) {
    request.status = ServiceRequestStatus.IN_PROGRESS;
    if (!request.acknowledgedAt) {
      request.acknowledgedAt = now;
      request.acknowledgedBy = actorName;
    }
  } else if (newStatus === ServiceRequestStatus.RESOLVED) {
    request.status = ServiceRequestStatus.RESOLVED;
    request.resolvedAt = now;
    request.resolvedBy = actorName;
  } else if (newStatus === ServiceRequestStatus.CANCELLED) {
    request.status = ServiceRequestStatus.CANCELLED;
  }

  if (notes) {
    request.description = `${request.description} [Note: ${notes}]`;
  }

  await request.save();

  await logFloorAudit({
    action: newStatus === ServiceRequestStatus.RESOLVED ? 'SERVICE_REQUEST_RESOLVED' : 'SERVICE_REQUEST_UPDATED',
    targetId: request._id.toString(),
    targetName: `Request for Table ${request.tableNumber}`,
    locationId,
    actor,
    details: `Service request ${request.requestType} for Table ${request.tableNumber} transitioned to ${newStatus}.`,
  });

  emitFloorEvent('floor.serviceRequestUpdated', locationId, request.toSafeJSON());
  return request.toSafeJSON();
}

/**
 * Hook called by kitchen service when a dine-in order is marked READY
 */
export async function createKitchenReadyAlert(order: IOrderDocument): Promise<IKitchenAlertDocument | null> {
  try {
    // Only alert for dine-in orders with a linked reservation or session
    if (order.orderType !== OrderType.DINE_IN_PREORDER && !order.reservationId) {
      return null;
    }

    // Lookup reservation to find table
    let tableId: string | null = null;
    let tableNumber: string | null = null;
    let diningSessionId: string | null = null;

    if (order.reservationId) {
      const res = await Reservation.findOne({ reservationReference: order.reservationId });
      if (res && res.tableIds && res.tableIds.length > 0) {
        tableId = res.tableIds[0].toString();
        tableNumber = res.tableNumbers[0];
      }
    }

    // Check active session
    if (tableId) {
      const session = await DiningSession.findOne({
        locationId: order.locationId,
        status: DiningSessionStatus.ACTIVE,
        tableIds: tableId,
      });
      if (session) diningSessionId = session._id.toString();
    }

    // Prevent duplicate alert
    let alert = await KitchenAlert.findOne({
      locationId: order.locationId,
      orderId: order._id.toString(),
      status: { $in: [KitchenAlertStatus.NEW, KitchenAlertStatus.ACKNOWLEDGED] },
    });

    if (!alert) {
      alert = await KitchenAlert.create({
        locationId: order.locationId,
        orderId: order._id.toString(),
        orderReference: order.orderReference,
        tableId,
        tableNumber,
        diningSessionId,
        itemsSummary: order.items.map((i) => `${i.quantity}x ${i.dishName}`).join(', '),
        status: KitchenAlertStatus.NEW,
      });
    }

    emitFloorEvent('floor.kitchenOrderReady', order.locationId, alert.toSafeJSON());

    notificationService.notifyStaffRole({
      role: StaffRole.FLOOR,
      locationId: order.locationId,
      title: `Food Ready: Table ${tableNumber || 'Dine-In'}`,
      message: `Kitchen has plated order ${order.orderReference}: ${alert.itemsSummary.slice(0, 80)}. Ready for service.`,
      category: NotificationCategory.KITCHEN,
      priority: NotificationPriority.HIGH,
      link: `/staff/floor`,
      metadata: { orderId: order._id.toString(), orderReference: order.orderReference, tableNumber },
    }).catch(() => {});

    return alert;
  } catch (err) {
    logger.warn('[FloorService] Failed to create kitchen ready alert:', err);
    return null;
  }
}

/**
 * GET /api/floor/kitchen-alerts
 * Lists active kitchen alerts
 */
export async function getKitchenAlerts(
  locationId: string,
  statusFilter?: string
): Promise<IKitchenAlertSafeJSON[]> {
  const query: any = { locationId };
  if (statusFilter && statusFilter !== 'ALL') {
    query.status = statusFilter;
  }

  const alerts = await KitchenAlert.find(query).sort({ createdAt: -1 });
  return alerts.map((a) => a.toSafeJSON());
}

/**
 * POST /api/floor/kitchen-alerts/:id/acknowledge
 * Acknowledges a food-ready alert
 */
export async function acknowledgeKitchenAlert(
  alertId: string,
  actor: FloorActor,
  locationId: string
): Promise<IKitchenAlertSafeJSON> {
  const alert = await KitchenAlert.findOne({ _id: alertId, locationId });
  if (!alert) {
    throw new Error('Kitchen alert not found.');
  }

  alert.status = KitchenAlertStatus.ACKNOWLEDGED;
  alert.acknowledgedAt = new Date();
  alert.acknowledgedBy = actor.name || actor.email || 'Floor Staff';
  await alert.save();

  await logFloorAudit({
    action: 'KITCHEN_ALERT_ACKNOWLEDGED',
    targetId: alert._id.toString(),
    targetName: `Alert for Order ${alert.orderReference}`,
    locationId,
    actor,
    details: `Acknowledged kitchen food-ready alert for Order ${alert.orderReference} (Table ${alert.tableNumber || 'N/A'}).`,
  });

  emitFloorEvent('floor.kitchenOrderReady', locationId, alert.toSafeJSON());
  return alert.toSafeJSON();
}

/**
 * POST /api/floor/orders/:id/handoff
 * Confirms food delivery to table, resolves alert, and completes order
 */
export async function handoffOrder(
  orderIdOrRef: string,
  actor: FloorActor,
  locationId: string
): Promise<{ order: any; alertResolved: boolean }> {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderIdOrRef);
  const query: any = isObjectId
    ? { $or: [{ _id: orderIdOrRef }, { orderReference: orderIdOrRef.toUpperCase() }] }
    : { orderReference: orderIdOrRef.toUpperCase() };
  if (locationId) query.locationId = locationId;

  const order = await Order.findOne(query);
  if (!order) {
    throw new Error(`Order "${orderIdOrRef}" was not found.`);
  }

  if (order.orderStatus !== OrderStatus.READY) {
    throw new Error(
      `Only READY orders can be handed off to tables. Current order status: "${order.orderStatus}".`
    );
  }

  // Update order to COMPLETED
  const now = new Date();
  order.orderStatus = OrderStatus.COMPLETED;
  order.completedAt = now;
  order.statusHistory.push({
    status: OrderStatus.COMPLETED,
    changedAt: now,
    changedBy: actor.email || 'floor',
    actorType: 'STAFF',
    note: `Dishes served and handed off to table by ${actor.name || 'Floor Staff'}.`,
  });
  await order.save();

  // Resolve associated kitchen alert
  let alertResolved = false;
  const alert = await KitchenAlert.findOne({
    locationId: order.locationId,
    orderId: order._id.toString(),
    status: { $in: [KitchenAlertStatus.NEW, KitchenAlertStatus.ACKNOWLEDGED] },
  });

  if (alert) {
    alert.status = KitchenAlertStatus.RESOLVED;
    alert.resolvedAt = now;
    alert.resolvedBy = actor.name || actor.email || 'Floor Staff';
    await alert.save();
    alertResolved = true;
    emitFloorEvent('floor.kitchenOrderReady', order.locationId, alert.toSafeJSON());
  }

  await logFloorAudit({
    action: 'FOOD_HANDOFF_COMPLETED',
    targetId: order.orderReference,
    targetName: `Order ${order.orderReference}`,
    locationId: order.locationId,
    actor,
    details: `Confirmed food handoff to table for Order ${order.orderReference}.`,
  });

  const io = getSocketServer();
  if (io) {
    io.to(`order:${order.orderReference}`)
      .to(`customer:${order.customerId}`)
      .to(`location:${order.locationId}`)
      .emit('orders.statusChanged', order.toSafeJSON() as any);
  }

  return { order: order.toSafeJSON(), alertResolved };
}

/**
 * GET /api/floor/cleaning-tasks
 * Lists active and completed cleaning tasks
 */
export async function getCleaningTasks(
  locationId: string,
  statusFilter?: string
): Promise<ICleaningTaskSafeJSON[]> {
  const query: any = { locationId };
  if (statusFilter && statusFilter !== 'ALL') {
    query.status = statusFilter;
  }

  const tasks = await CleaningTask.find(query).sort({ createdAt: -1 });
  return tasks.map((t) => t.toSafeJSON());
}

/**
 * POST /api/floor/cleaning-tasks/:id/start
 * Starts cleaning task and sets table status to CLEANING
 */
export async function startCleaningTask(
  taskId: string,
  actor: FloorActor,
  locationId: string
): Promise<ICleaningTaskSafeJSON> {
  const task = await CleaningTask.findOne({ _id: taskId, locationId });
  if (!task) {
    throw new Error('Cleaning task not found.');
  }

  if (task.status !== CleaningTaskStatus.PENDING) {
    throw new Error(`Cannot start cleaning task with status "${task.status}".`);
  }

  const now = new Date();
  const actorName = actor.name || actor.email || 'Floor Staff';
  task.status = CleaningTaskStatus.IN_PROGRESS;
  task.startedAt = now;
  task.startedBy = actorName;
  task.assignedStaffId = actor.id || task.assignedStaffId;
  task.assignedStaffName = actorName;
  await task.save();

  // Update physical table to CLEANING
  await Table.updateOne({ _id: task.tableId }, { status: TableStatus.CLEANING });

  await logFloorAudit({
    action: 'CLEANING_STARTED',
    targetId: task._id.toString(),
    targetName: `Cleaning Table ${task.tableNumber}`,
    locationId,
    actor,
    details: `Started cleaning Table ${task.tableNumber}. Table status set to CLEANING.`,
  });

  emitFloorEvent('floor.cleaningStarted', locationId, task.toSafeJSON());
  emitFloorEvent('floor.tableUpdated', locationId, {
    tableId: task.tableId,
    tableNumber: task.tableNumber,
    status: TableStatus.CLEANING,
  });

  return task.toSafeJSON();
}

/**
 * POST /api/floor/cleaning-tasks/:id/complete
 * Completes cleaning task and returns table to AVAILABLE
 */
export async function completeCleaningTask(
  taskId: string,
  actor: FloorActor,
  locationId: string
): Promise<ICleaningTaskSafeJSON> {
  const task = await CleaningTask.findOne({ _id: taskId, locationId });
  if (!task) {
    throw new Error('Cleaning task not found.');
  }

  if (task.status === CleaningTaskStatus.COMPLETED) {
    throw new Error('Cleaning task is already completed.');
  }

  const now = new Date();
  const actorName = actor.name || actor.email || 'Floor Staff';
  task.status = CleaningTaskStatus.COMPLETED;
  task.completedAt = now;
  task.completedBy = actorName;
  await task.save();

  // Verify table is not occupied by an active session before marking AVAILABLE
  const table = await Table.findOne({ _id: task.tableId });
  if (table) {
    const activeSession = await DiningSession.findOne({
      locationId,
      status: DiningSessionStatus.ACTIVE,
      tableIds: table._id.toString(),
    });

    if (!activeSession) {
      table.status = TableStatus.AVAILABLE;
      await table.save();
    }
  }

  await logFloorAudit({
    action: 'CLEANING_COMPLETED',
    targetId: task._id.toString(),
    targetName: `Cleaning Table ${task.tableNumber}`,
    locationId,
    actor,
    details: `Completed cleaning Table ${task.tableNumber}. Table sanitized and marked AVAILABLE.`,
  });

  emitFloorEvent('floor.cleaningCompleted', locationId, task.toSafeJSON());
  emitFloorEvent('floor.tableUpdated', locationId, {
    tableId: task.tableId,
    tableNumber: task.tableNumber,
    status: TableStatus.AVAILABLE,
  });

  return task.toSafeJSON();
}

/**
 * GET /api/floor/history
 * Comprehensive searchable floor archive of closed sessions, cleaning tasks, and resolved requests
 */
export async function getFloorHistory(
  locationId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  sessions: IDiningSessionSafeJSON[];
  cleaningTasks: ICleaningTaskSafeJSON[];
  serviceRequests: IServiceRequestSafeJSON[];
}> {
  const sessionQuery: any = { locationId, status: DiningSessionStatus.CLOSED };
  const taskQuery: any = { locationId, status: CleaningTaskStatus.COMPLETED };
  const reqQuery: any = { locationId, status: ServiceRequestStatus.RESOLVED };

  if (dateFrom && dateTo) {
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    sessionQuery.completedAt = { $gte: start, $lte: end };
    taskQuery.completedAt = { $gte: start, $lte: end };
    reqQuery.resolvedAt = { $gte: start, $lte: end };
  }

  const [sessions, tasks, requests] = await Promise.all([
    DiningSession.find(sessionQuery).sort({ completedAt: -1 }).limit(50),
    CleaningTask.find(taskQuery).sort({ completedAt: -1 }).limit(50),
    ServiceRequest.find(reqQuery).sort({ resolvedAt: -1 }).limit(50),
  ]);

  return {
    sessions: sessions.map((s) => s.toSafeJSON()),
    cleaningTasks: tasks.map((t) => t.toSafeJSON()),
    serviceRequests: requests.map((r) => r.toSafeJSON()),
  };
}
