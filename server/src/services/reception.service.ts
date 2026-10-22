import mongoose from 'mongoose';
import { Reservation, IReservationDocument } from '../models/reservation.model';
import { Table, ITableDocument } from '../models/table.model';
import { TableSlotAllocation } from '../models/tableSlotAllocation.model';
import { WaitingList, IWaitingListDocument } from '../models/waitingList.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { Order } from '../models/order.model';
import { getSocketServer } from '../sockets/socket.server';
import { ensureLocationTablesConfigured } from './table.service';
import {
  RESERVATION_CONFIG,
  ReservationStatus,
  ReservationSource,
  SeatingPreference,
  IReservationSafeJSON,
} from '../types/reservation';
import { TableStatus } from '../types/table';
import { WaitingListStatus, IWaitingListSafeJSON } from '../types/waitingList';
import {
  generateReservationReference,
  generateSlotTimes,
  allocateTableForSlot,
  ReservationActor,
} from './reservation.service';
import { normalizeTime24, createUtcDateTime, mapPreferenceToSection } from './availability.service';
import { getLocationName, VALID_LOCATION_IDS } from '../config/locations';
import { logger } from '../utils/logger';
import { createOrActivateDiningSession } from './floor.service';

export interface ReceptionOverviewMetrics {
  locationId: string;
  locationName: string;
  localDate: string;
  localTime: string;
  todayReservations: number;
  expectedArrivals: number;
  checkedInGuests: number;
  seatedGuests: number;
  waitingParties: number;
  noShowCount: number;
  tableSummary: {
    available: number;
    reserved: number;
    occupied: number;
    cleaning: number;
    unavailable: number;
    total: number;
  };
}

export interface ReceptionReservationItem extends IReservationSafeJSON {
  arrivalStatus: 'UPCOMING' | 'DUE_NOW' | 'LATE' | 'CHECKED_IN' | 'SEATED' | 'NO_SHOW' | 'CANCELLED';
  assignedTableName?: string;
  minutesUntilArrival: number;
}

export interface WalkInInput {
  locationId: string;
  guestName: string;
  guestCount: number;
  guestPhone: string;
  guestEmail?: string;
  seatingPreference?: string;
  specialRequests?: string;
  seatImmediately?: boolean;
  tableId?: string;
  tableNumber?: string;
}

/**
 * Emit real-time reception events scoped by restaurant location
 */
export function emitReceptionEvent(
  eventName:
    | 'reception.guestCheckedIn'
    | 'reception.tableAssigned'
    | 'reception.guestSeated'
    | 'reception.walkInCreated'
    | 'reception.waitingListUpdated'
    | 'reception.noShowRecorded'
    | 'reception.reservationModified',
  locationId: string,
  payload: any
): void {
  try {
    const io = getSocketServer();
    if (!io) return;

    // Scoped location staff rooms
    io.to(`staff:${locationId}`).emit(eventName, payload);
    io.to('staff:all').emit(eventName, payload);

    // Floor staff coordination
    io.to(`floor:${locationId}`).emit(eventName, payload);

    // Customer or specific reservation room if applicable
    if (payload?.reservationReference) {
      io.to(`reservation:${payload.reservationReference.toUpperCase()}`).emit(eventName, payload);
    }
    if (payload?.customerId) {
      io.to(`customer:${payload.customerId}`).emit(eventName, payload);
    }
  } catch (err) {
    logger.warn('[Socket.IO] Failed to emit reception event:', err);
  }
}

/**
 * Record immutable audit log entry for reception actions
 */
async function logReceptionAudit(params: {
  action:
    | 'GUEST_CHECKED_IN'
    | 'TABLE_ASSIGNED'
    | 'GUEST_SEATED'
    | 'WALK_IN_REGISTERED'
    | 'WAITING_ENTRY_CREATED'
    | 'WAITING_ENTRY_SEATED'
    | 'WAITING_ENTRY_CANCELLED'
    | 'RESERVATION_MARKED_NOSHOW'
    | 'RESERVATION_MODIFIED';
  targetId: string;
  targetName: string;
  locationId: string;
  actor: ReservationActor;
  details: string;
}): Promise<void> {
  try {
    await StaffAuditLog.create({
      actorId: params.actor.id || 'reception-station',
      actorName: params.actor.name || params.actor.email || 'Reception Staff',
      actorEmail: params.actor.email || 'reception@aurelle.com',
      targetStaffId: params.targetId,
      targetStaffName: params.targetName,
      targetStaffEmail: params.targetId,
      action: params.action as any,
      details: params.details,
      locationId: params.locationId,
      ipAddress: '127.0.0.1',
    });
  } catch (err) {
    logger.warn('[Reception Audit] Failed to record audit log:', err);
  }
}

/**
 * Calculate arrival status indicator based on local time and reservation start
 */
function calculateArrivalStatus(
  status: ReservationStatus,
  startAt: Date
): 'UPCOMING' | 'DUE_NOW' | 'LATE' | 'CHECKED_IN' | 'SEATED' | 'NO_SHOW' | 'CANCELLED' {
  if (status === ReservationStatus.CHECKED_IN) return 'CHECKED_IN';
  if (status === ReservationStatus.SEATED) return 'SEATED';
  if (status === ReservationStatus.NO_SHOW) return 'NO_SHOW';
  if (status === ReservationStatus.CANCELLED || status === ReservationStatus.REJECTED) return 'CANCELLED';

  const nowMs = Date.now();
  const startMs = startAt.getTime();
  const diffMinutes = Math.floor((startMs - nowMs) / (60 * 1000));

  if (diffMinutes < -RESERVATION_CONFIG.noShowGracePeriodMinutes) {
    return 'LATE';
  }
  if (diffMinutes <= 30 && diffMinutes >= -RESERVATION_CONFIG.noShowGracePeriodMinutes) {
    return 'DUE_NOW';
  }
  return 'UPCOMING';
}

/**
 * GET /api/reception/overview
 * Real-time reception dashboard metrics and table summary
 */
export async function getReceptionOverview(locationId: string): Promise<ReceptionOverviewMetrics> {
  if (!VALID_LOCATION_IDS.includes(locationId)) {
    throw new Error(`Invalid restaurant location ID: "${locationId}".`);
  }

  await ensureLocationTablesConfigured(locationId);

  const now = new Date();
  const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: RESERVATION_CONFIG.timezone }).format(now);
  const localTime = now.toLocaleTimeString('en-US', {
    timeZone: RESERVATION_CONFIG.timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const startOfDay = new Date(`${localDate}T00:00:00+05:30`);
  const endOfDay = new Date(`${localDate}T23:59:59.999+05:30`);

  const [todayReservations, expectedArrivals, checkedInGuests, seatedGuests, noShowCount, waitingParties, tables] =
    await Promise.all([
      Reservation.countDocuments({
        locationId,
        startAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: [ReservationStatus.CANCELLED, ReservationStatus.REJECTED] },
      }),
      Reservation.countDocuments({
        locationId,
        startAt: { $gte: startOfDay, $lte: endOfDay },
        status: ReservationStatus.CONFIRMED,
      }),
      Reservation.countDocuments({
        locationId,
        startAt: { $gte: startOfDay, $lte: endOfDay },
        status: ReservationStatus.CHECKED_IN,
      }),
      Reservation.countDocuments({
        locationId,
        startAt: { $gte: startOfDay, $lte: endOfDay },
        status: ReservationStatus.SEATED,
      }),
      Reservation.countDocuments({
        locationId,
        startAt: { $gte: startOfDay, $lte: endOfDay },
        status: ReservationStatus.NO_SHOW,
      }),
      WaitingList.countDocuments({
        locationId,
        status: { $in: [WaitingListStatus.WAITING, WaitingListStatus.NOTIFIED] },
      }),
      Table.find({ locationId, isActive: true }),
    ]);

  const tableSummary = {
    available: tables.filter((t) => t.status === TableStatus.AVAILABLE).length,
    reserved: tables.filter((t) => t.status === TableStatus.RESERVED).length,
    occupied: tables.filter((t) => t.status === TableStatus.OCCUPIED).length,
    cleaning: tables.filter((t) => t.status === TableStatus.CLEANING).length,
    unavailable: tables.filter((t) => t.status === TableStatus.UNAVAILABLE).length,
    total: tables.length,
  };

  return {
    locationId,
    locationName: getLocationName(locationId),
    localDate,
    localTime,
    todayReservations,
    expectedArrivals,
    checkedInGuests,
    seatedGuests,
    waitingParties,
    noShowCount,
    tableSummary,
  };
}

/**
 * GET /api/reception/reservations
 * Fetch today's reservations with arrival telemetry and filtering
 */
export async function getTodayReservations(
  locationId: string,
  params: {
    date?: string;
    search?: string;
    status?: string;
    timeFilter?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  reservations: ReceptionReservationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  if (!VALID_LOCATION_IDS.includes(locationId)) {
    throw new Error(`Invalid restaurant location ID: "${locationId}".`);
  }

  const dateStr =
    params.date || new Intl.DateTimeFormat('en-CA', { timeZone: RESERVATION_CONFIG.timezone }).format(new Date());

  const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);

  const query: any = {
    locationId,
    startAt: { $gte: startOfDay, $lte: endOfDay },
  };

  if (params.status && params.status !== 'ALL') {
    query.status = params.status;
  }

  if (params.search && params.search.trim()) {
    const s = params.search.trim();
    query.$or = [
      { reservationReference: { $regex: s, $options: 'i' } },
      { guestName: { $regex: s, $options: 'i' } },
      { guestPhone: { $regex: s, $options: 'i' } },
      { guestEmail: { $regex: s, $options: 'i' } },
    ];
  }

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
  const skip = (page - 1) * limit;

  const [total, docs] = await Promise.all([
    Reservation.countDocuments(query),
    Reservation.find(query)
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('tableIds'),
  ]);

  const nowMs = Date.now();
  const reservations: ReceptionReservationItem[] = docs.map((doc) => {
    const safe = doc.toSafeJSON();
    const startMs = new Date(doc.startAt).getTime();
    const minutesUntilArrival = Math.floor((startMs - nowMs) / (60 * 1000));
    const arrivalStatus = calculateArrivalStatus(doc.status, doc.startAt);

    return {
      ...safe,
      arrivalStatus,
      assignedTableName: doc.tableNumbers && doc.tableNumbers.length > 0 ? doc.tableNumbers.join(', ') : 'Unassigned',
      minutesUntilArrival,
    };
  });

  return {
    reservations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * GET /api/reception/reservations/:id
 * Retrieve full reservation dossier including linked dine-in orders and table info
 */
export async function getReservationDossier(
  idOrRef: string,
  locationId?: string
): Promise<{
  reservation: ReceptionReservationItem;
  tableDetails: any[];
  linkedOrders: any[];
}> {
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrRef);
  const query: any = isObjectId
    ? { $or: [{ _id: idOrRef }, { reservationReference: idOrRef.toUpperCase() }] }
    : { reservationReference: idOrRef.toUpperCase() };

  if (locationId) {
    query.locationId = locationId;
  }

  const doc = await Reservation.findOne(query).populate('tableIds');
  if (!doc) {
    throw new Error(`Reservation "${idOrRef}" was not found.`);
  }

  const safe = doc.toSafeJSON();
  const startMs = new Date(doc.startAt).getTime();
  const minutesUntilArrival = Math.floor((startMs - Date.now()) / (60 * 1000));
  const arrivalStatus = calculateArrivalStatus(doc.status, doc.startAt);

  const reservationItem: ReceptionReservationItem = {
    ...safe,
    arrivalStatus,
    assignedTableName: doc.tableNumbers && doc.tableNumbers.length > 0 ? doc.tableNumbers.join(', ') : 'Unassigned',
    minutesUntilArrival,
  };

  // Fetch linked dine-in pre-orders from Stage 7
  const linkedOrders = await Order.find({
    reservationId: doc.reservationReference,
  }).sort({ createdAt: -1 });

  return {
    reservation: reservationItem,
    tableDetails: (doc.tableIds as any[]) || [],
    linkedOrders: linkedOrders.map((o) => ({
      id: o._id.toString(),
      orderReference: o.orderReference,
      orderType: o.orderType,
      status: o.orderStatus,
      totalMinor: o.totalMinor,
      items: o.items,
      createdAt: o.createdAt,
    })),
  };
}

/**
 * POST /api/reception/reservations/:id/check-in
 * Secure check-in action: CONFIRMED -> CHECKED_IN
 */
export async function checkInGuest(
  idOrRef: string,
  actor: ReservationActor,
  locationId?: string
): Promise<IReservationDocument> {
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrRef);
  const query: any = isObjectId
    ? { $or: [{ _id: idOrRef }, { reservationReference: idOrRef.toUpperCase() }] }
    : { reservationReference: idOrRef.toUpperCase() };

  if (locationId) {
    query.locationId = locationId;
  }

  const reservation = await Reservation.findOne(query);
  if (!reservation) {
    throw new Error(`Reservation "${idOrRef}" was not found.`);
  }

  if (reservation.status === ReservationStatus.CHECKED_IN) {
    throw new Error(`Guest "${reservation.guestName}" is already checked in.`);
  }

  if (reservation.status === ReservationStatus.SEATED) {
    throw new Error(`Guest "${reservation.guestName}" is already seated.`);
  }

  if (reservation.status === ReservationStatus.CANCELLED || reservation.status === ReservationStatus.REJECTED) {
    throw new Error(`Cannot check in a cancelled or rejected reservation.`);
  }

  if (reservation.status === ReservationStatus.NO_SHOW) {
    throw new Error(`Cannot check in a reservation marked as NO_SHOW.`);
  }

  if (reservation.status !== ReservationStatus.CONFIRMED && reservation.status !== ReservationStatus.PENDING) {
    throw new Error(`Reservation status "${reservation.status}" is not eligible for check-in.`);
  }

  // Atomically update state
  reservation.status = ReservationStatus.CHECKED_IN;
  reservation.checkedInAt = new Date();
  reservation.checkedInBy = actor.id || actor.name || 'Reception Staff';
  reservation.statusHistory.push({
    status: ReservationStatus.CHECKED_IN,
    changedAt: new Date(),
    actorType: 'STAFF',
    actorId: actor.id,
    note: `Guest arrived and checked in by ${actor.name || 'Reception Staff'}.`,
  });

  await reservation.save();

  // Audit log & Socket broadcast
  await logReceptionAudit({
    action: 'GUEST_CHECKED_IN',
    targetId: reservation.reservationReference,
    targetName: reservation.guestName,
    locationId: reservation.locationId,
    actor,
    details: `Checked in guest ${reservation.guestName} (${reservation.guestCount} guests). Ref: ${reservation.reservationReference}.`,
  });

  emitReceptionEvent('reception.guestCheckedIn', reservation.locationId, reservation.toSafeJSON());

  return reservation;
}

/**
 * POST /api/reception/reservations/:id/assign-table
 * Assigns an eligible table to a reservation with capacity & conflict checks
 */
export async function assignTable(
  idOrRef: string,
  tableIdentifier: { tableId?: string; tableNumber?: string },
  actor: ReservationActor,
  locationId?: string
): Promise<IReservationDocument> {
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrRef);
  const query: any = isObjectId
    ? { $or: [{ _id: idOrRef }, { reservationReference: idOrRef.toUpperCase() }] }
    : { reservationReference: idOrRef.toUpperCase() };

  if (locationId) {
    query.locationId = locationId;
  }

  const reservation = await Reservation.findOne(query);
  if (!reservation) {
    throw new Error(`Reservation "${idOrRef}" was not found.`);
  }

  if (
    reservation.status === ReservationStatus.CANCELLED ||
    reservation.status === ReservationStatus.COMPLETED ||
    reservation.status === ReservationStatus.NO_SHOW
  ) {
    throw new Error(`Cannot assign table to a reservation with status "${reservation.status}".`);
  }

  // Find target table
  const tableQuery: any = {
    locationId: reservation.locationId,
    isActive: true,
  };
  if (tableIdentifier.tableId) {
    tableQuery._id = tableIdentifier.tableId;
  } else if (tableIdentifier.tableNumber) {
    tableQuery.tableNumber = tableIdentifier.tableNumber.toUpperCase();
  }

  const table = await Table.findOne(tableQuery);
  if (!table) {
    throw new Error(`Dining table not found in venue "${reservation.locationId}".`);
  }

  if (table.capacity < reservation.guestCount) {
    throw new Error(
      `Table ${table.tableNumber} (capacity: ${table.capacity}) cannot accommodate party size of ${reservation.guestCount}.`
    );
  }

  // Check overlapping conflicts on this table (turnover buffer)
  const turnoverMs = RESERVATION_CONFIG.turnoverBufferMinutes * 60 * 1000;
  const startWithBuffer = new Date(reservation.startAt.getTime() - turnoverMs);
  const endWithBuffer = new Date(reservation.endAt.getTime() + turnoverMs);

  const slotTimes = generateSlotTimes(reservation.startAt, reservation.endAt, RESERVATION_CONFIG.turnoverBufferMinutes);

  const existingConflict = await TableSlotAllocation.findOne({
    tableId: table._id,
    slotTime: { $in: slotTimes },
    reservationId: { $ne: reservation._id },
  });

  if (existingConflict) {
    throw new Error(`Table ${table.tableNumber} is already committed to another sitting during this time window.`);
  }

  // Perform atomic reassignment inside transaction or atomic batch
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Release old allocations
    await TableSlotAllocation.deleteMany({ reservationId: reservation._id }, { session });

    // Insert new allocations
    const newAllocations = slotTimes.map((st) => ({
      tableId: table._id,
      locationId: reservation.locationId,
      slotTime: st,
      reservationId: reservation._id,
    }));
    await TableSlotAllocation.insertMany(newAllocations, { session });

    // Update reservation
    reservation.tableIds = [table._id as any];
    reservation.tableNumbers = [table.tableNumber];
    reservation.statusHistory.push({
      status: reservation.status,
      changedAt: new Date(),
      actorType: 'STAFF',
      actorId: actor.id,
      note: `Table assigned to ${table.tableNumber} (${table.name}) by ${actor.name || 'Reception Staff'}.`,
    });

    await reservation.save({ session });
    await session.commitTransaction();
  } catch (err: any) {
    await session.abortTransaction();
    if (err.code === 11000 || err.message?.includes('E11000')) {
      throw new Error(`Table ${table.tableNumber} was simultaneously assigned to another booking.`);
    }
    throw err;
  } finally {
    session.endSession();
  }

  // Audit log & Socket broadcast
  await logReceptionAudit({
    action: 'TABLE_ASSIGNED',
    targetId: reservation.reservationReference,
    targetName: table.tableNumber,
    locationId: reservation.locationId,
    actor,
    details: `Assigned Table ${table.tableNumber} to ${reservation.guestName} (${reservation.reservationReference}).`,
  });

  emitReceptionEvent('reception.tableAssigned', reservation.locationId, {
    reservation: reservation.toSafeJSON(),
    table: table.toSafeJSON(),
  });

  return reservation;
}

/**
 * POST /api/reception/reservations/:id/seat
 * Transitions CHECKED_IN -> SEATED and marks table OCCUPIED
 */
export async function seatGuest(
  idOrRef: string,
  tableIdentifier: { tableId?: string; tableNumber?: string } | undefined,
  actor: ReservationActor,
  locationId?: string
): Promise<IReservationDocument> {
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrRef);
  const query: any = isObjectId
    ? { $or: [{ _id: idOrRef }, { reservationReference: idOrRef.toUpperCase() }] }
    : { reservationReference: idOrRef.toUpperCase() };

  if (locationId) {
    query.locationId = locationId;
  }

  const foundReservation = await Reservation.findOne(query);
  if (!foundReservation) {
    throw new Error(`Reservation "${idOrRef}" was not found.`);
  }

  let reservation: IReservationDocument = foundReservation;

  if (reservation.status === ReservationStatus.SEATED) {
    throw new Error(`Guest "${reservation.guestName}" is already seated.`);
  }

  if (reservation.status !== ReservationStatus.CHECKED_IN && reservation.status !== ReservationStatus.CONFIRMED) {
    throw new Error(
      `Only CHECKED_IN (or confirmed) reservations can be seated. Current status: "${reservation.status}".`
    );
  }

  // If table identifier provided, assign it first
  if (tableIdentifier?.tableId || tableIdentifier?.tableNumber) {
    reservation = await assignTable(idOrRef, tableIdentifier, actor, locationId);
  }

  if (!reservation.tableIds || reservation.tableIds.length === 0) {
    throw new Error('Please assign a table before seating the guest.');
  }

  // Atomically update reservation and mark table OCCUPIED
  reservation.status = ReservationStatus.SEATED;
  reservation.seatedAt = new Date();
  reservation.seatedBy = actor.id || actor.name || 'Reception Staff';
  reservation.statusHistory.push({
    status: ReservationStatus.SEATED,
    changedAt: new Date(),
    actorType: 'STAFF',
    actorId: actor.id,
    note: `Guest escorted and seated at Table ${reservation.tableNumbers.join(', ')} by ${actor.name || 'Reception Staff'}.`,
  });

  await reservation.save();

  // Update physical table status to OCCUPIED
  await Table.updateMany({ _id: { $in: reservation.tableIds } }, { status: TableStatus.OCCUPIED });

  // Create or activate dining session for floor management
  await createOrActivateDiningSession({
    locationId: reservation.locationId,
    tableIds: reservation.tableIds.map((t) => t.toString()),
    tableNumbers: reservation.tableNumbers,
    reservationId: reservation._id.toString(),
    reservationReference: reservation.reservationReference,
    guestName: reservation.guestName,
    guestCount: reservation.guestCount,
    actor,
    notes: reservation.specialRequests,
  }).catch((err) => logger.warn('[FloorService] Failed to create dining session on seating:', err));

  // Audit log & Socket broadcast (provides table info for floor staff coordination)
  await logReceptionAudit({
    action: 'GUEST_SEATED',
    targetId: reservation.reservationReference,
    targetName: reservation.tableNumbers.join(', '),
    locationId: reservation.locationId,
    actor,
    details: `Seated guest ${reservation.guestName} at Table ${reservation.tableNumbers.join(', ')} (${reservation.guestCount} guests).`,
  });

  emitReceptionEvent('reception.guestSeated', reservation.locationId, {
    reservationId: reservation._id.toString(),
    reservationReference: reservation.reservationReference,
    guestName: reservation.guestName,
    guestCount: reservation.guestCount,
    tableIds: reservation.tableIds,
    tableNumbers: reservation.tableNumbers,
    specialRequests: reservation.specialRequests,
    seatedAt: reservation.seatedAt.toISOString(),
    seatedBy: reservation.seatedBy,
  });

  return reservation;
}

/**
 * POST /api/reception/reservations/:id/no-show
 * Marks an eligible overdue booking as NO_SHOW and releases table capacity
 */
export async function markNoShow(
  idOrRef: string,
  actor: ReservationActor,
  note?: string,
  force = false,
  locationId?: string
): Promise<IReservationDocument> {
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrRef);
  const query: any = isObjectId
    ? { $or: [{ _id: idOrRef }, { reservationReference: idOrRef.toUpperCase() }] }
    : { reservationReference: idOrRef.toUpperCase() };

  if (locationId) {
    query.locationId = locationId;
  }

  const reservation = await Reservation.findOne(query);
  if (!reservation) {
    throw new Error(`Reservation "${idOrRef}" was not found.`);
  }

  if (reservation.status === ReservationStatus.NO_SHOW) {
    throw new Error(`Reservation "${reservation.reservationReference}" is already marked as NO_SHOW.`);
  }

  if (reservation.status === ReservationStatus.SEATED || reservation.status === ReservationStatus.COMPLETED) {
    throw new Error(`Cannot mark seated or completed reservation as NO_SHOW.`);
  }

  if (reservation.status === ReservationStatus.CANCELLED) {
    throw new Error(`Cannot mark cancelled reservation as NO_SHOW.`);
  }

  // Grace period enforcement: current time >= startAt + grace period
  const gracePeriodMs = RESERVATION_CONFIG.noShowGracePeriodMinutes * 60 * 1000;
  const nowMs = Date.now();
  const eligibleTimeMs = reservation.startAt.getTime() + gracePeriodMs;

  if (nowMs < eligibleTimeMs && !force) {
    const remainingMinutes = Math.ceil((eligibleTimeMs - nowMs) / (60 * 1000));
    throw new Error(
      `Guest arrival grace period (${RESERVATION_CONFIG.noShowGracePeriodMinutes} minutes) has not elapsed yet. Please wait ${remainingMinutes} more minute(s) before recording a no-show.`
    );
  }

  reservation.status = ReservationStatus.NO_SHOW;
  reservation.statusHistory.push({
    status: ReservationStatus.NO_SHOW,
    changedAt: new Date(),
    actorType: 'STAFF',
    actorId: actor.id,
    note: note || `Guest did not arrive within the ${RESERVATION_CONFIG.noShowGracePeriodMinutes}-minute grace window. Recorded by ${actor.name || 'Reception Staff'}.`,
  });

  await reservation.save();

  // Release table capacity allocations
  await TableSlotAllocation.deleteMany({ reservationId: reservation._id });

  // Revert tables to AVAILABLE if they were RESERVED
  if (reservation.tableIds && reservation.tableIds.length > 0) {
    await Table.updateMany(
      { _id: { $in: reservation.tableIds }, status: TableStatus.RESERVED },
      { status: TableStatus.AVAILABLE }
    );
  }

  // Audit log & Socket broadcast
  await logReceptionAudit({
    action: 'RESERVATION_MARKED_NOSHOW',
    targetId: reservation.reservationReference,
    targetName: reservation.guestName,
    locationId: reservation.locationId,
    actor,
    details: `Marked reservation ${reservation.reservationReference} (${reservation.guestName}) as NO_SHOW. Released table capacity.`,
  });

  emitReceptionEvent('reception.noShowRecorded', reservation.locationId, reservation.toSafeJSON());

  return reservation;
}

/**
 * POST /api/reception/walk-ins
 * Registers a walk-in guest with immediate table seating or waiting list assignment
 */
export async function registerWalkIn(
  input: WalkInInput,
  actor: ReservationActor
): Promise<IReservationDocument> {
  const { locationId, guestName, guestCount, guestPhone, guestEmail, seatingPreference, specialRequests, seatImmediately } =
    input;

  await ensureLocationTablesConfigured(locationId);

  const now = new Date();
  const durationMinutes =
    guestCount >= RESERVATION_CONFIG.largePartyThreshold
      ? RESERVATION_CONFIG.largePartyDurationMinutes
      : RESERVATION_CONFIG.defaultDurationMinutes;

  const endAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const reservationReference = await generateReservationReference();
  const reservationDate = new Date(now);
  reservationDate.setUTCHours(0, 0, 0, 0);

  let allocatedTables: ITableDocument[] = [];

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (input.tableId || input.tableNumber) {
      const tQuery: any = { locationId, isActive: true };
      if (input.tableId) tQuery._id = input.tableId;
      else if (input.tableNumber) tQuery.tableNumber = input.tableNumber.toUpperCase();

      const specificTable = await Table.findOne(tQuery).session(session);
      if (!specificTable) throw new Error('Selected table was not found.');
      if (specificTable.capacity < guestCount) {
        throw new Error(`Table ${specificTable.tableNumber} cannot accommodate party size of ${guestCount}.`);
      }
      allocatedTables = [specificTable];
    } else {
      allocatedTables = await allocateTableForSlot({
        locationId,
        startAt: now,
        endAt,
        guestCount,
        seatingPreference,
        session,
      });
    }

    const slotTimes = generateSlotTimes(now, endAt, RESERVATION_CONFIG.turnoverBufferMinutes);
    const newReservationId = new mongoose.Types.ObjectId();

    const slotDocs = allocatedTables.flatMap((table) =>
      slotTimes.map((st) => ({
        tableId: table._id,
        locationId,
        slotTime: st,
        reservationId: newReservationId,
      }))
    );

    await TableSlotAllocation.insertMany(slotDocs, { session });

    const initialStatus = seatImmediately ? ReservationStatus.SEATED : ReservationStatus.CHECKED_IN;

    const reservationData: any = {
      _id: newReservationId,
      reservationReference,
      customerId: null,
      locationId,
      guestName: guestName.trim(),
      guestEmail: guestEmail ? guestEmail.toLowerCase().trim() : `${reservationReference.toLowerCase()}@walkin.aurelle.com`,
      guestPhone: guestPhone.trim(),
      guestCount,
      reservationDate,
      startAt: now,
      endAt,
      durationMinutes,
      timezone: RESERVATION_CONFIG.timezone,
      status: initialStatus,
      tableIds: allocatedTables.map((t) => t._id),
      tableNumbers: allocatedTables.map((t) => t.tableNumber),
      seatingPreference: seatingPreference || SeatingPreference.NO_PREFERENCE,
      specialRequests: specialRequests || '',
      occasion: 'Walk-in Dining',
      source: ReservationSource.WALK_IN,
      confirmedAt: now,
      checkedInAt: now,
      checkedInBy: actor.id || actor.name || 'Reception Staff',
      seatedAt: seatImmediately ? now : null,
      seatedBy: seatImmediately ? (actor.id || actor.name || 'Reception Staff') : null,
      statusHistory: [
        {
          status: initialStatus,
          changedAt: now,
          actorType: 'STAFF',
          actorId: actor.id,
          note: seatImmediately
            ? `Walk-in party registered and immediately seated at Table ${allocatedTables.map((t) => t.tableNumber).join(', ')}.`
            : `Walk-in party registered and checked in at reception desk.`,
        },
      ],
    };

    const createdDocs = await Reservation.create([reservationData], { session });

    if (seatImmediately) {
      await Table.updateMany(
        { _id: { $in: allocatedTables.map((t) => t._id) } },
        { status: TableStatus.OCCUPIED },
        { session }
      );
    }

    await session.commitTransaction();

    const createdReservation = createdDocs[0];

    // Audit log & Socket broadcast
    await logReceptionAudit({
      action: 'WALK_IN_REGISTERED',
      targetId: createdReservation.reservationReference,
      targetName: createdReservation.guestName,
      locationId,
      actor,
      details: `Registered walk-in party of ${guestCount} for ${guestName}. Assigned Table: ${createdReservation.tableNumbers.join(', ')}.`,
    });

    emitReceptionEvent('reception.walkInCreated', locationId, createdReservation.toSafeJSON());
    if (seatImmediately) {
      await createOrActivateDiningSession({
        locationId: createdReservation.locationId,
        tableIds: createdReservation.tableIds.map((t: any) => t.toString()),
        tableNumbers: createdReservation.tableNumbers,
        reservationId: createdReservation._id.toString(),
        reservationReference: createdReservation.reservationReference,
        guestName: createdReservation.guestName,
        guestCount: createdReservation.guestCount,
        actor,
        notes: createdReservation.specialRequests,
      }).catch((err) => logger.warn('[FloorService] Failed to create dining session for walk-in:', err));

      emitReceptionEvent('reception.guestSeated', locationId, {
        reservationReference: createdReservation.reservationReference,
        tableNumbers: createdReservation.tableNumbers,
        guestCount,
        guestName,
      });
    }

    return createdReservation;
  } catch (err: any) {
    await session.abortTransaction();
    if (err.code === 11000 || err.message?.includes('E11000') || err.message?.includes('WriteConflict')) {
      throw new Error(`No available table capacity for party of ${guestCount} right now. Please add guest to waiting list.`);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * GET /api/reception/tables/availability
 * Full table inventory state with current occupants and upcoming commitments
 */
export async function getTableAvailability(locationId: string): Promise<any[]> {
  if (!VALID_LOCATION_IDS.includes(locationId)) {
    throw new Error(`Invalid restaurant location ID: "${locationId}".`);
  }

  await ensureLocationTablesConfigured(locationId);
  const tables = await Table.find({ locationId, isActive: true }).sort({ section: 1, capacity: 1, tableNumber: 1 });

  const now = new Date();
  const nextThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  // Active or upcoming reservations for today
  const activeReservations = await Reservation.find({
    locationId,
    status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.SEATED] },
    startAt: { $lt: nextThreeHours },
    endAt: { $gt: now },
  });

  return tables.map((t) => {
    // Find current occupant
    const currentRes = activeReservations.find(
      (r) =>
        r.tableIds.some((tid) => tid.toString() === t._id.toString()) &&
        (r.status === ReservationStatus.SEATED ||
          (r.status === ReservationStatus.CHECKED_IN && new Date(r.startAt) <= now))
    );

    // Find next upcoming
    const upcomingRes = activeReservations.find(
      (r) =>
        r.tableIds.some((tid) => tid.toString() === t._id.toString()) &&
        r.status === ReservationStatus.CONFIRMED &&
        new Date(r.startAt) > now
    );

    return {
      id: t._id.toString(),
      tableNumber: t.tableNumber,
      name: t.name,
      capacity: t.capacity,
      minPartySize: t.minPartySize,
      section: t.section,
      status: t.status,
      currentOccupant: currentRes
        ? {
            reservationReference: currentRes.reservationReference,
            guestName: currentRes.guestName,
            guestCount: currentRes.guestCount,
            status: currentRes.status,
            seatedAt: currentRes.seatedAt,
          }
        : null,
      nextReservation: upcomingRes
        ? {
            reservationReference: upcomingRes.reservationReference,
            guestName: upcomingRes.guestName,
            guestCount: upcomingRes.guestCount,
            startAt: upcomingRes.startAt,
          }
        : null,
    };
  });
}

/**
 * Waiting List operations
 */
export async function getWaitingList(locationId: string, status?: string): Promise<IWaitingListSafeJSON[]> {
  if (!VALID_LOCATION_IDS.includes(locationId)) {
    throw new Error(`Invalid restaurant location ID: "${locationId}".`);
  }

  const query: any = { locationId };
  if (status && status !== 'ALL') {
    query.status = status;
  } else if (!status) {
    query.status = { $in: [WaitingListStatus.WAITING, WaitingListStatus.NOTIFIED] };
  }

  const entries = await WaitingList.find(query).sort({ arrivedAt: 1 });
  return entries.map((e) => e.toSafeJSON());
}

export async function addToWaitingList(
  input: {
    locationId: string;
    guestName: string;
    guestCount: number;
    guestPhone: string;
    guestEmail?: string;
    seatingPreference?: string;
    notes?: string;
    estimatedWaitMinutes?: number;
  },
  actor: ReservationActor
): Promise<IWaitingListDocument> {
  const { locationId, guestName, guestCount, guestPhone, guestEmail, seatingPreference, notes, estimatedWaitMinutes } =
    input;

  const entry = await WaitingList.create({
    locationId,
    guestName: guestName.trim(),
    guestCount,
    guestPhone: guestPhone.trim(),
    guestEmail: guestEmail ? guestEmail.trim() : null,
    seatingPreference: seatingPreference || 'No preference',
    notes: notes || '',
    estimatedWaitMinutes: estimatedWaitMinutes || 15,
    status: WaitingListStatus.WAITING,
    arrivedAt: new Date(),
    createdBy: actor.name || actor.email || 'Reception Staff',
  });

  await logReceptionAudit({
    action: 'WAITING_ENTRY_CREATED',
    targetId: entry._id.toString(),
    targetName: entry.guestName,
    locationId,
    actor,
    details: `Added ${entry.guestName} (${entry.guestCount} guests) to waiting list. Est: ${entry.estimatedWaitMinutes}m.`,
  });

  emitReceptionEvent('reception.waitingListUpdated', locationId, entry.toSafeJSON());

  return entry;
}

export async function updateWaitingListEntry(
  id: string,
  input: { status?: WaitingListStatus; notes?: string; notifiedAt?: string },
  actor: ReservationActor,
  locationId?: string
): Promise<IWaitingListDocument> {
  const query: any = { _id: id };
  if (locationId) query.locationId = locationId;

  const entry = await WaitingList.findOne(query);
  if (!entry) throw new Error('Waiting list entry not found.');

  if (input.status) {
    entry.status = input.status;
    if (input.status === WaitingListStatus.NOTIFIED) {
      entry.notifiedAt = new Date();
    } else if (input.status === WaitingListStatus.CANCELLED) {
      entry.cancelledAt = new Date();
    }
  }

  if (input.notes !== undefined) {
    entry.notes = input.notes;
  }

  await entry.save();

  emitReceptionEvent('reception.waitingListUpdated', entry.locationId, entry.toSafeJSON());

  return entry;
}

export async function seatWaitingListEntry(
  id: string,
  tableIdentifier: { tableId?: string; tableNumber?: string },
  actor: ReservationActor,
  locationId?: string
): Promise<{
  waitingEntry: IWaitingListSafeJSON;
  reservation: IReservationSafeJSON;
}> {
  const query: any = { _id: id };
  if (locationId) query.locationId = locationId;

  const entry = await WaitingList.findOne(query);
  if (!entry) throw new Error('Waiting list entry not found.');

  if (entry.status === WaitingListStatus.SEATED) {
    throw new Error(`Party "${entry.guestName}" is already seated.`);
  }

  // Create walk-in reservation immediately seated
  const walkInRes = await registerWalkIn(
    {
      locationId: entry.locationId,
      guestName: entry.guestName,
      guestCount: entry.guestCount,
      guestPhone: entry.guestPhone,
      guestEmail: entry.guestEmail || undefined,
      seatingPreference: entry.seatingPreference,
      specialRequests: entry.notes,
      seatImmediately: true,
      tableId: tableIdentifier.tableId,
      tableNumber: tableIdentifier.tableNumber,
    },
    actor
  );

  entry.status = WaitingListStatus.SEATED;
  entry.seatedAt = new Date();
  entry.reservationId = walkInRes._id.toString();
  entry.tableNumber = walkInRes.tableNumbers.join(', ');
  await entry.save();

  await logReceptionAudit({
    action: 'WAITING_ENTRY_SEATED',
    targetId: entry._id.toString(),
    targetName: entry.guestName,
    locationId: entry.locationId,
    actor,
    details: `Seated waiting party ${entry.guestName} at Table ${entry.tableNumber}.`,
  });

  emitReceptionEvent('reception.waitingListUpdated', entry.locationId, entry.toSafeJSON());

  return {
    waitingEntry: entry.toSafeJSON(),
    reservation: walkInRes.toSafeJSON(),
  };
}

/**
 * PATCH /api/reception/reservations/:id
 * Allows reception staff to modify an active reservation (time, guests, contact, notes)
 */
export async function modifyReceptionReservation(
  idOrRef: string,
  input: {
    date?: string;
    time?: string;
    guestCount?: number;
    seatingPreference?: string;
    specialRequests?: string;
    guestName?: string;
    guestPhone?: string;
  },
  actor: ReservationActor,
  locationId?: string
): Promise<IReservationDocument> {
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrRef);
  const query: any = isObjectId
    ? { $or: [{ _id: idOrRef }, { reservationReference: idOrRef.toUpperCase() }] }
    : { reservationReference: idOrRef.toUpperCase() };

  if (locationId) query.locationId = locationId;

  const reservation = await Reservation.findOne(query);
  if (!reservation) throw new Error(`Reservation "${idOrRef}" was not found.`);

  if (
    reservation.status === ReservationStatus.CANCELLED ||
    reservation.status === ReservationStatus.COMPLETED ||
    reservation.status === ReservationStatus.NO_SHOW
  ) {
    throw new Error(`Cannot modify reservation in status "${reservation.status}".`);
  }

  let timeOrPartyChanged = false;
  const oldDate = reservation.reservationDate;
  const oldStart = reservation.startAt;

  if (input.guestName) reservation.guestName = input.guestName.trim();
  if (input.guestPhone) reservation.guestPhone = input.guestPhone.trim();
  if (input.specialRequests !== undefined) reservation.specialRequests = input.specialRequests.trim();
  if (input.seatingPreference) reservation.seatingPreference = input.seatingPreference;

  const newGuestCount = input.guestCount || reservation.guestCount;
  const newDateStr = input.date || reservation.startAt.toISOString().split('T')[0];
  const newTimeStr = input.time || reservation.toSafeJSON().reservationTime;

  if (input.date || input.time || (input.guestCount && input.guestCount !== reservation.guestCount)) {
    timeOrPartyChanged = true;
    const time24 = normalizeTime24(newTimeStr);
    const newStartAt = createUtcDateTime(newDateStr, time24);
    const durationMinutes =
      newGuestCount >= RESERVATION_CONFIG.largePartyThreshold
        ? RESERVATION_CONFIG.largePartyDurationMinutes
        : RESERVATION_CONFIG.defaultDurationMinutes;
    const newEndAt = new Date(newStartAt.getTime() + durationMinutes * 60 * 1000);

    // Reallocate table capacity
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Release old allocations
      await TableSlotAllocation.deleteMany({ reservationId: reservation._id }, { session });

      const newAllocatedTables = await allocateTableForSlot({
        locationId: reservation.locationId,
        startAt: newStartAt,
        endAt: newEndAt,
        guestCount: newGuestCount,
        seatingPreference: reservation.seatingPreference,
        excludeReservationId: reservation._id.toString(),
        session,
      });

      const slotTimes = generateSlotTimes(newStartAt, newEndAt, RESERVATION_CONFIG.turnoverBufferMinutes);
      const slotDocs = newAllocatedTables.flatMap((table) =>
        slotTimes.map((st) => ({
          tableId: table._id,
          locationId: reservation.locationId,
          slotTime: st,
          reservationId: reservation._id,
        }))
      );

      await TableSlotAllocation.insertMany(slotDocs, { session });

      reservation.startAt = newStartAt;
      reservation.endAt = newEndAt;
      reservation.durationMinutes = durationMinutes;
      reservation.guestCount = newGuestCount;
      const resDate = new Date(newStartAt);
      resDate.setUTCHours(0, 0, 0, 0);
      reservation.reservationDate = resDate;
      reservation.tableIds = newAllocatedTables.map((t) => t._id);
      reservation.tableNumbers = newAllocatedTables.map((t) => t.tableNumber);

      await session.commitTransaction();
    } catch (err: any) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  reservation.statusHistory.push({
    status: reservation.status,
    changedAt: new Date(),
    actorType: 'STAFF',
    actorId: actor.id,
    note: timeOrPartyChanged
      ? `Reservation schedule/party updated by ${actor.name || 'Reception Staff'}.`
      : `Reservation details updated by ${actor.name || 'Reception Staff'}.`,
  });

  await reservation.save();

  await logReceptionAudit({
    action: 'RESERVATION_MODIFIED',
    targetId: reservation.reservationReference,
    targetName: reservation.guestName,
    locationId: reservation.locationId,
    actor,
    details: `Reception updated reservation ${reservation.reservationReference} for ${reservation.guestName}.`,
  });

  emitReceptionEvent('reception.reservationModified', reservation.locationId, reservation.toSafeJSON());

  return reservation;
}
