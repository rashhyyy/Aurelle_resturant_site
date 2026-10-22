import mongoose from 'mongoose';
import { Reservation, IReservationDocument } from '../models/reservation.model';
import { Table, ITableDocument } from '../models/table.model';
import { TableSlotAllocation } from '../models/tableSlotAllocation.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { getSocketServer } from '../sockets/socket.server';
import { getActiveTables, ensureLocationTablesConfigured } from './table.service';
import {
  normalizeTime24,
  createUtcDateTime,
  mapPreferenceToSection,
} from './availability.service';
import {
  RESERVATION_CONFIG,
  ReservationStatus,
  ReservationSource,
  SeatingPreference,
  ALLOWED_RESERVATION_TRANSITIONS,
  IReservationSafeJSON,
  ReservationSummaryMetrics,
} from '../types/reservation';
import { getLocationName, VALID_LOCATION_IDS } from '../config/locations';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import {
  NotificationCategory,
  NotificationPriority,
  RecipientType,
} from '../types/notification';
import { StaffRole } from '../types/staff';

export interface CreateReservationInput {
  locationId?: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "7:30 PM" or "19:30"
  guestCount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  seatingPreference?: string;
  specialRequests?: string;
  occasion?: string;
  idempotencyKey?: string;
  source?: ReservationSource;
}

export interface ReservationActor {
  id?: string;
  email?: string;
  name?: string;
  actorType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
}

/**
 * Generate collision-safe reference like AUR-RES-4921
 */
export async function generateReservationReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const ref = `AUR-RES-${randomDigits}`;
    const exists = await Reservation.exists({ reservationReference: ref });
    if (!exists) return ref;
  }
  return `AUR-RES-${Date.now().toString().slice(-6)}`;
}

/**
 * Broadcast real-time reservation notifications to scoped Socket.IO rooms
 */
export function emitReservationSocketEvent(
  eventName: 'reservations.created' | 'reservations.updated' | 'reservations.cancelled' | 'reservations.confirmed',
  reservation: IReservationDocument
): void {
  try {
    const io = getSocketServer();
    if (!io) return;

    const payload = reservation.toSafeJSON();

    // Staff rooms
    io.to('role:admin').to('role:manager').to('role:reception').emit(eventName, payload as any);

    // Location room
    if (reservation.locationId) {
      io.to(`location:${reservation.locationId}`).emit(eventName, payload as any);
    }

    // Customer room
    if (reservation.customerId) {
      io.to(`customer:${reservation.customerId}`).emit(eventName, payload as any);
    }

    // Specific reservation rooms
    if (reservation.reservationReference) {
      io.to(`reservation:${reservation.reservationReference.toUpperCase()}`).emit(eventName, payload as any);
    }
    io.to(`reservation:${reservation._id.toString()}`).emit(eventName, payload as any);
  } catch (err) {
    logger.warn('[Socket.IO] Failed to emit reservation event:', err);
  }
}

/**
 * Log audit events for reservation actions
 */
async function logReservationAudit(params: {
  action: 'RESERVATION_CREATED' | 'RESERVATION_CONFIRMED' | 'RESERVATION_MODIFIED' | 'RESERVATION_CANCELLED' | 'RESERVATION_REJECTED';
  reservation: IReservationDocument;
  actor: ReservationActor;
  details: string;
}): Promise<void> {
  try {
    await StaffAuditLog.create({
      actorId: params.actor.id || 'public-session',
      actorName: params.actor.name || params.actor.email || 'Customer',
      actorEmail: params.actor.email || params.reservation.guestEmail,
      targetStaffId: params.reservation.reservationReference,
      targetStaffName: `Reservation ${params.reservation.reservationReference}`,
      targetStaffEmail: params.reservation.guestEmail,
      action: params.action as any,
      details: params.details,
      locationId: params.reservation.locationId,
      ipAddress: '127.0.0.1',
    });
  } catch (err) {
    logger.warn('[Reservation Audit] Failed to record audit log:', err);
  }
}

/**
 * Generate 15-minute discrete time slot dates across the sitting window + buffer
 */
export function generateSlotTimes(startAt: Date, endAt: Date, bufferMinutes: number): Date[] {
  const stepMs = 15 * 60 * 1000;
  const startMs = startAt.getTime() - bufferMinutes * 60 * 1000;
  const endMs = endAt.getTime() + bufferMinutes * 60 * 1000;

  const slots: Date[] = [];
  for (let t = startMs; t < endMs; t += stepMs) {
    slots.push(new Date(t));
  }
  return slots;
}

/**
 * Atomically allocates table capacity for a requested time slot
 */
export async function allocateTableForSlot(params: {
  locationId: string;
  startAt: Date;
  endAt: Date;
  guestCount: number;
  seatingPreference?: string;
  excludeReservationId?: string;
  session?: mongoose.ClientSession;
}): Promise<ITableDocument[]> {
  const { locationId, startAt, endAt, guestCount, seatingPreference, excludeReservationId, session } = params;

  // 1. Fetch active tables for venue
  const allTables = await Table.find({ locationId, isActive: true })
    .sort({ capacity: 1, tableNumber: 1 })
    .session(session || null);

  if (allTables.length === 0) {
    throw new Error('Restaurant tables have not been configured for this venue.');
  }

  // 2. Turnover buffer
  const turnoverBufferMs = RESERVATION_CONFIG.turnoverBufferMinutes * 60 * 1000;
  const bufferStart = new Date(startAt.getTime() - turnoverBufferMs);
  const bufferEnd = new Date(endAt.getTime() + turnoverBufferMs);

  const bookedTableIds = new Set<string>();

  // 3. Check TableSlotAllocation unique allocations
  const slotTimes = generateSlotTimes(startAt, endAt, RESERVATION_CONFIG.turnoverBufferMinutes);
  const slotQuery: any = {
    locationId,
    slotTime: { $in: slotTimes },
  };
  if (excludeReservationId) {
    slotQuery.reservationId = { $ne: new mongoose.Types.ObjectId(excludeReservationId) };
  }

  const existingAllocations = await TableSlotAllocation.find(slotQuery).session(session || null);
  for (const alloc of existingAllocations) {
    bookedTableIds.add(alloc.tableId.toString());
  }

  // 4. Find active overlapping reservations
  const overlapQuery: any = {
    locationId,
    status: {
      $in: [
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
        ReservationStatus.CHECKED_IN,
        ReservationStatus.SEATED,
      ],
    },
    startAt: { $lt: bufferEnd },
    endAt: { $gt: bufferStart },
  };

  if (excludeReservationId) {
    overlapQuery._id = { $ne: new mongoose.Types.ObjectId(excludeReservationId) };
  }

  const overlappingReservations = await Reservation.find(overlapQuery).session(session || null);
  for (const res of overlappingReservations) {
    for (const tid of res.tableIds || []) {
      bookedTableIds.add(tid.toString());
    }
  }

  // 5. Find free tables
  const freeTables = allTables.filter((t) => !bookedTableIds.has(t._id.toString()));

  // 6. Best-fit matching: find table with smallest capacity >= guestCount
  const targetSection = mapPreferenceToSection(seatingPreference);

  // First try: matches section & capacity
  let candidate = freeTables.find(
    (t) => t.capacity >= guestCount && t.minPartySize <= guestCount && (!targetSection || t.section === targetSection)
  );

  // Second try: matches capacity regardless of section
  if (!candidate) {
    candidate = freeTables.find((t) => t.capacity >= guestCount && t.minPartySize <= guestCount);
  }

  if (!candidate) {
    throw new Error(
      `No table capacity is available for party size of ${guestCount} at the selected time. Please choose another time slot.`
    );
  }

  return [candidate];
}

/**
 * POST /api/reservations
 * Creates a new customer or staff reservation with concurrency-safe table allocation
 */
export async function createReservation(
  input: CreateReservationInput,
  actor: ReservationActor
): Promise<IReservationDocument> {
  const locationId = input.locationId || RESERVATION_CONFIG.defaultLocationId;
  if (!VALID_LOCATION_IDS.includes(locationId)) {
    throw new Error(`Invalid restaurant location ID: "${locationId}".`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error('Invalid reservation date. Expected format YYYY-MM-DD.');
  }

  const guestCount = Number(input.guestCount);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > RESERVATION_CONFIG.maxPartySize) {
    throw new Error(`Guest count must be between 1 and ${RESERVATION_CONFIG.maxPartySize}.`);
  }

  if (!input.guestName || input.guestName.trim().length < 2) {
    throw new Error('Guest full name is required (minimum 2 characters).');
  }

  if (!input.guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.guestEmail)) {
    throw new Error('A valid email address is required for reservation confirmation.');
  }

  if (!input.guestPhone || input.guestPhone.trim().length < 7) {
    throw new Error('A valid contact telephone number is required.');
  }

  // Idempotency check
  if (input.idempotencyKey) {
    const existing = await Reservation.findOne({ idempotencyKey: input.idempotencyKey });
    if (existing) {
      return existing;
    }
  }

  const time24 = normalizeTime24(input.time);
  const startAt = createUtcDateTime(input.date, time24);

  const now = new Date();
  const minLeadMs = RESERVATION_CONFIG.minLeadHours * 60 * 60 * 1000;

  if (startAt.getTime() <= now.getTime() + minLeadMs && actor.actorType === 'CUSTOMER') {
    throw new Error(
      `Reservations must be booked at least ${RESERVATION_CONFIG.minLeadHours} hour in advance.`
    );
  }

  const maxAdvanceMs = RESERVATION_CONFIG.maxAdvanceDays * 24 * 60 * 60 * 1000;
  if (startAt.getTime() - now.getTime() > maxAdvanceMs) {
    throw new Error(
      `Reservations can only be made up to ${RESERVATION_CONFIG.maxAdvanceDays} days in advance.`
    );
  }

  const durationMinutes =
    guestCount >= RESERVATION_CONFIG.largePartyThreshold
      ? RESERVATION_CONFIG.largePartyDurationMinutes
      : RESERVATION_CONFIG.defaultDurationMinutes;

  const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

  // Ensure tables are configured
  await ensureLocationTablesConfigured(locationId);

  // Concurrency-Safe Transaction Allocation
  let reservation: IReservationDocument;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const allocatedTables = await allocateTableForSlot({
      locationId,
      startAt,
      endAt,
      guestCount,
      seatingPreference: input.seatingPreference,
      session,
    });

    const reservationReference = await generateReservationReference();

    // Default status:
    // Large parties (> 6) or specific requests can start as PENDING if online customer, otherwise CONFIRMED
    const initialStatus =
      guestCount >= 7 && actor.actorType === 'CUSTOMER'
        ? ReservationStatus.PENDING
        : ReservationStatus.CONFIRMED;

    const reservationDate = new Date(startAt);
    reservationDate.setUTCHours(0, 0, 0, 0);

    const reservationData: any = {
      reservationReference,
      customerId: actor.actorType === 'CUSTOMER' && actor.id ? actor.id : null,
      locationId,
      guestName: input.guestName.trim(),
      guestEmail: input.guestEmail.toLowerCase().trim(),
      guestPhone: input.guestPhone.trim(),
      guestCount,
      reservationDate,
      startAt,
      endAt,
      durationMinutes,
      timezone: RESERVATION_CONFIG.timezone,
      status: initialStatus,
      tableIds: allocatedTables.map((t) => t._id),
      tableNumbers: allocatedTables.map((t) => t.tableNumber),
      seatingPreference: input.seatingPreference || SeatingPreference.NO_PREFERENCE,
      specialRequests: input.specialRequests ? input.specialRequests.trim() : '',
      occasion: input.occasion || 'No occasion',
      source: input.source || (actor.actorType === 'STAFF' ? ReservationSource.STAFF_PORTAL : ReservationSource.ONLINE_CUSTOMER),
      confirmedAt: initialStatus === ReservationStatus.CONFIRMED ? new Date() : null,
      statusHistory: [
        {
          status: initialStatus,
          changedAt: new Date(),
          actorType: actor.actorType,
          actorId: actor.id || undefined,
          note:
            initialStatus === ReservationStatus.CONFIRMED
              ? 'Table reservation automatically confirmed.'
              : 'Large party booking request received. Awaiting manager confirmation.',
        },
      ],
    };

    if (input.idempotencyKey) {
      reservationData.idempotencyKey = input.idempotencyKey;
    }

    const newReservationId = new mongoose.Types.ObjectId();
    const slotTimes = generateSlotTimes(startAt, endAt, RESERVATION_CONFIG.turnoverBufferMinutes);
    const slotDocs = allocatedTables.flatMap((table) =>
      slotTimes.map((st) => ({
        tableId: table._id,
        locationId,
        slotTime: st,
        reservationId: newReservationId,
      }))
    );

    // Atomically allocate table slots with unique constraint (prevents double-booking)
    await TableSlotAllocation.insertMany(slotDocs, { session });

    reservationData._id = newReservationId;
    const createdList = await Reservation.create([reservationData], { session });

    reservation = createdList[0];
    await session.commitTransaction();
  } catch (err: any) {
    await session.abortTransaction();
    if (err.code === 11000 || err.message?.includes('E11000') || err.message?.includes('WriteConflict')) {
      throw new Error(
        `No table capacity is available for party size of ${guestCount} at the selected time. Please choose another time slot.`
      );
    }
    throw err;
  } finally {
    session.endSession();
  }

  // Audit logging & Socket notifications
  await logReservationAudit({
    action: 'RESERVATION_CREATED',
    reservation,
    actor,
    details: `Created reservation ${reservation.reservationReference} for ${guestCount} guests on ${input.date} at ${input.time}. Tables: ${reservation.tableNumbers.join(', ')}`,
  });

  emitReservationSocketEvent('reservations.created', reservation);

  // Automated notification for guest and reception staff
  if (reservation.customerId || reservation.guestEmail) {
    notificationService.createNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: reservation.customerId || reservation.guestEmail,
      recipientEmail: reservation.guestEmail,
      recipientPhone: reservation.guestPhone,
      title: `Reservation Booked: ${reservation.reservationReference}`,
      message: `Your table reservation for ${reservation.guestCount} guests on ${input.date} at ${input.time} is recorded.`,
      category: NotificationCategory.RESERVATION,
      priority: NotificationPriority.NORMAL,
      link: `/account/reservations`,
      metadata: { reservationId: reservation._id.toString(), reference: reservation.reservationReference },
    }).catch((err) => logger.warn('[ReservationService] Guest notification error:', err));
  }

  notificationService.notifyStaffRole({
    role: StaffRole.RECEPTION,
    locationId: reservation.locationId,
    title: `New Reservation: ${reservation.reservationReference}`,
    message: `${reservation.guestName} (${reservation.guestCount} guests) reserved for ${input.date} at ${input.time}.`,
    category: NotificationCategory.RESERVATION,
    priority: NotificationPriority.NORMAL,
    link: `/staff/reception`,
    metadata: { reservationId: reservation._id.toString(), reference: reservation.reservationReference },
  }).catch((err) => logger.warn('[ReservationService] Reception staff notification error:', err));

  return reservation;
}

/**
 * Customer: Retrieve authenticated customer's reservation history
 */
export async function getCustomerReservations(params: {
  userId?: string;
  email?: string;
  status?: string;
  timeFilter?: 'upcoming' | 'past' | 'all';
  page?: number;
  limit?: number;
}): Promise<{ reservations: IReservationSafeJSON[]; total: number }> {
  const { userId, email, status, timeFilter = 'all', page = 1, limit = 20 } = params;

  const query: any = {};
  if (userId && email) {
    query.$or = [{ customerId: userId }, { guestEmail: email.toLowerCase() }];
  } else if (userId) {
    query.customerId = userId;
  } else if (email) {
    query.guestEmail = email.toLowerCase();
  } else {
    throw new Error('Unauthorized customer session.');
  }

  if (status && status !== 'all') {
    query.status = status.toUpperCase();
  }

  const now = new Date();
  if (timeFilter === 'upcoming') {
    query.startAt = { $gte: now };
    if (!query.status) {
      query.status = { $nin: [ReservationStatus.CANCELLED, ReservationStatus.REJECTED] };
    }
  } else if (timeFilter === 'past') {
    query.startAt = { $lt: now };
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Reservation.find(query).sort({ startAt: -1 }).skip(skip).limit(limit),
    Reservation.countDocuments(query),
  ]);

  return {
    reservations: records.map((r) => r.toSafeJSON()),
    total,
  };
}

/**
 * Customer / Admin: Retrieve reservation by MongoDB ID or reference
 */
export async function getReservationByIdOrRef(idOrRef: string): Promise<IReservationDocument | null> {
  const query: any = {};
  if (mongoose.Types.ObjectId.isValid(idOrRef)) {
    query.$or = [{ _id: new mongoose.Types.ObjectId(idOrRef) }, { reservationReference: idOrRef.toUpperCase() }];
  } else {
    query.reservationReference = idOrRef.toUpperCase();
  }

  return await Reservation.findOne(query);
}

/**
 * Customer: Modify reservation (eligible date, time, guestCount, specialRequests)
 */
export async function modifyCustomerReservation(
  idOrRef: string,
  updates: {
    date?: string;
    time?: string;
    guestCount?: number;
    specialRequests?: string;
    occasion?: string;
    seatingPreference?: string;
  },
  actor: ReservationActor
): Promise<IReservationDocument> {
  const reservation = await getReservationByIdOrRef(idOrRef);
  if (!reservation) {
    throw new Error(`Reservation "${idOrRef}" was not found.`);
  }

  // Ownership verification for customers
  if (actor.actorType === 'CUSTOMER') {
    const isOwner =
      (actor.id && reservation.customerId === actor.id) ||
      (actor.email && reservation.guestEmail.toLowerCase() === actor.email.toLowerCase());
    if (!isOwner) {
      throw new Error('You are not authorized to modify this reservation.');
    }
  }

  const now = new Date();
  const startTime = new Date(reservation.startAt);
  const cutoffTime = new Date(startTime.getTime() - RESERVATION_CONFIG.cancellationCutoffHours * 60 * 60 * 1000);

  if (now >= cutoffTime && actor.actorType === 'CUSTOMER') {
    throw new Error(
      `Modifications are not permitted within ${RESERVATION_CONFIG.cancellationCutoffHours} hours of dining time. Please contact the restaurant directly.`
    );
  }

  if (
    reservation.status !== ReservationStatus.PENDING &&
    reservation.status !== ReservationStatus.CONFIRMED
  ) {
    throw new Error(`Reservations with status "${reservation.status}" cannot be modified.`);
  }

  const needsReallocation =
    (updates.date && updates.date !== reservation.startAt.toISOString().split('T')[0]) ||
    (updates.time && updates.time !== reservation.toSafeJSON().reservationTime) ||
    (updates.guestCount && updates.guestCount !== reservation.guestCount);

  if (needsReallocation) {
    const targetDate = updates.date || reservation.startAt.toISOString().split('T')[0];
    const targetTime12 = updates.time || reservation.toSafeJSON().reservationTime;
    const targetTime24 = normalizeTime24(targetTime12);
    const newStartAt = createUtcDateTime(targetDate, targetTime24);

    const newGuestCount = updates.guestCount || reservation.guestCount;
    const durationMinutes =
      newGuestCount >= RESERVATION_CONFIG.largePartyThreshold
        ? RESERVATION_CONFIG.largePartyDurationMinutes
        : RESERVATION_CONFIG.defaultDurationMinutes;

    const newEndAt = new Date(newStartAt.getTime() + durationMinutes * 60 * 1000);

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const allocatedTables = await allocateTableForSlot({
        locationId: reservation.locationId,
        startAt: newStartAt,
        endAt: newEndAt,
        guestCount: newGuestCount,
        seatingPreference: updates.seatingPreference || reservation.seatingPreference,
        excludeReservationId: reservation._id.toString(),
        session,
      });

      const newDate = new Date(newStartAt);
      newDate.setUTCHours(0, 0, 0, 0);

      reservation.reservationDate = newDate;
      reservation.startAt = newStartAt;
      reservation.endAt = newEndAt;
      reservation.durationMinutes = durationMinutes;
      reservation.guestCount = newGuestCount;
      reservation.tableIds = allocatedTables.map((t) => t._id);
      reservation.tableNumbers = allocatedTables.map((t) => t.tableNumber);

      if (updates.seatingPreference) reservation.seatingPreference = updates.seatingPreference;
      if (updates.specialRequests !== undefined) reservation.specialRequests = updates.specialRequests;
      if (updates.occasion) reservation.occasion = updates.occasion;

      reservation.statusHistory.push({
        status: reservation.status,
        changedAt: new Date(),
        actorType: actor.actorType,
        actorId: actor.id,
        note: `Reservation rescheduled to ${targetDate} at ${targetTime12} for ${newGuestCount} guests. Tables: ${reservation.tableNumbers.join(', ')}`,
      });

      // Release previous allocations and secure new slot allocations
      await TableSlotAllocation.deleteMany({ reservationId: reservation._id }, { session });
      const slotTimes = generateSlotTimes(newStartAt, newEndAt, RESERVATION_CONFIG.turnoverBufferMinutes);
      const slotDocs = allocatedTables.flatMap((table) =>
        slotTimes.map((st) => ({
          tableId: table._id,
          locationId: reservation.locationId,
          slotTime: st,
          reservationId: reservation._id,
        }))
      );
      await TableSlotAllocation.insertMany(slotDocs, { session });

      await reservation.save({ session });
      await session.commitTransaction();
    } catch (err: any) {
      await session.abortTransaction();
      if (err.code === 11000 || err.message?.includes('E11000')) {
        throw new Error(
          `No table capacity is available for party size of ${newGuestCount} at the selected time. Please choose another time slot.`
        );
      }
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    // Only metadata updates
    if (updates.specialRequests !== undefined) reservation.specialRequests = updates.specialRequests;
    if (updates.occasion) reservation.occasion = updates.occasion;
    if (updates.seatingPreference) reservation.seatingPreference = updates.seatingPreference;

    reservation.statusHistory.push({
      status: reservation.status,
      changedAt: new Date(),
      actorType: actor.actorType,
      actorId: actor.id,
      note: 'Guest preferences / special requests updated.',
    });

    await reservation.save();
  }

  await logReservationAudit({
    action: 'RESERVATION_MODIFIED',
    reservation,
    actor,
    details: `Updated reservation ${reservation.reservationReference}.`,
  });

  emitReservationSocketEvent('reservations.updated', reservation);

  return reservation;
}

/**
 * Customer / Admin: Cancel reservation
 */
export async function cancelReservation(
  idOrRef: string,
  reason: string,
  actor: ReservationActor
): Promise<IReservationDocument> {
  const reservation = await getReservationByIdOrRef(idOrRef);
  if (!reservation) {
    throw new Error(`Reservation "${idOrRef}" was not found.`);
  }

  // Ownership verification for customers
  if (actor.actorType === 'CUSTOMER') {
    const isOwner =
      (actor.id && reservation.customerId === actor.id) ||
      (actor.email && reservation.guestEmail.toLowerCase() === actor.email.toLowerCase());
    if (!isOwner) {
      throw new Error('You are not authorized to cancel this reservation.');
    }

    const now = new Date();
    const startTime = new Date(reservation.startAt);
    const cutoffTime = new Date(startTime.getTime() - RESERVATION_CONFIG.cancellationCutoffHours * 60 * 60 * 1000);

    if (now >= cutoffTime) {
      throw new Error(
        `Reservations cannot be cancelled online within ${RESERVATION_CONFIG.cancellationCutoffHours} hours of dining time. Please contact the front desk.`
      );
    }
  }

  if (reservation.status === ReservationStatus.CANCELLED) {
    throw new Error('This reservation is already cancelled.');
  }

  if (reservation.status === ReservationStatus.COMPLETED) {
    throw new Error('Completed dining experiences cannot be cancelled.');
  }

  const validTransitions = ALLOWED_RESERVATION_TRANSITIONS[reservation.status] || [];
  if (!validTransitions.includes(ReservationStatus.CANCELLED)) {
    throw new Error(`Cannot cancel reservation from status "${reservation.status}".`);
  }

  reservation.status = ReservationStatus.CANCELLED;
  reservation.cancelledAt = new Date();
  reservation.cancellationReason = reason || 'Guest cancelled reservation.';

  // Release table capacity
  reservation.tableIds = [];
  reservation.tableNumbers = [];
  await TableSlotAllocation.deleteMany({ reservationId: reservation._id });

  reservation.statusHistory.push({
    status: ReservationStatus.CANCELLED,
    changedAt: new Date(),
    actorType: actor.actorType,
    actorId: actor.id,
    note: `Cancelled: ${reason}`,
  });

  await reservation.save();

  await logReservationAudit({
    action: 'RESERVATION_CANCELLED',
    reservation,
    actor,
    details: `Reservation ${reservation.reservationReference} cancelled. Reason: ${reason}`,
  });

  emitReservationSocketEvent('reservations.cancelled', reservation);

  if (reservation.customerId || reservation.guestEmail) {
    notificationService.createNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: reservation.customerId || reservation.guestEmail,
      recipientEmail: reservation.guestEmail,
      recipientPhone: reservation.guestPhone,
      title: `Reservation Cancelled: ${reservation.reservationReference}`,
      message: `Your reservation (${reservation.reservationReference}) has been cancelled.`,
      category: NotificationCategory.RESERVATION,
      priority: NotificationPriority.HIGH,
      link: `/account/reservations`,
      metadata: { reservationId: reservation._id.toString(), reference: reservation.reservationReference },
    }).catch((err) => logger.warn('[ReservationService] Guest cancel notification error:', err));
  }

  return reservation;
}

/**
 * Admin: Query reservation directory with comprehensive filters
 */
export async function getAdminReservations(params: {
  locationId?: string;
  status?: string;
  search?: string;
  date?: string;
  guestCount?: number;
  sortBy?: 'startAt' | 'createdAt' | 'guestCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<{ reservations: IReservationSafeJSON[]; total: number }> {
  const {
    locationId,
    status,
    search,
    date,
    guestCount,
    sortBy = 'startAt',
    sortOrder = 'asc',
    page = 1,
    limit = 20,
  } = params;

  const query: any = {};

  if (locationId && locationId !== 'all') {
    query.locationId = locationId;
  }

  if (status && status !== 'all') {
    query.status = status.toUpperCase();
  }

  if (guestCount) {
    query.guestCount = guestCount;
  }

  if (date) {
    const startOfDay = createUtcDateTime(date, '00:00');
    const endOfDay = createUtcDateTime(date, '23:59');
    query.startAt = { $gte: startOfDay, $lte: endOfDay };
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { reservationReference: { $regex: s, $options: 'i' } },
      { guestName: { $regex: s, $options: 'i' } },
      { guestEmail: { $regex: s, $options: 'i' } },
      { guestPhone: { $regex: s, $options: 'i' } },
      { tableNumbers: { $regex: s, $options: 'i' } },
    ];
  }

  const sortDirection = sortOrder === 'desc' ? -1 : 1;
  const sortObj: any = { [sortBy]: sortDirection };

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Reservation.find(query).sort(sortObj).skip(skip).limit(limit),
    Reservation.countDocuments(query),
  ]);

  return {
    reservations: records.map((r) => r.toSafeJSON()),
    total,
  };
}

/**
 * Admin: Aggregated telemetry for reservation management overview
 */
export async function getAdminReservationSummary(
  locationId?: string
): Promise<ReservationSummaryMetrics> {
  const baseQuery: any = {};
  if (locationId && locationId !== 'all') {
    baseQuery.locationId = locationId;
  }

  const now = new Date();
  const startOfDay = new Date(now.getTime() - (now.getTimezoneOffset() + 330) * 60000);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const [
    todayTotal,
    upcomingTotal,
    pendingTotal,
    confirmedTotal,
    seatedTotal,
    cancelledTotal,
    completedTotal,
  ] = await Promise.all([
    Reservation.countDocuments({
      ...baseQuery,
      startAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: [ReservationStatus.CANCELLED, ReservationStatus.REJECTED] },
    }),
    Reservation.countDocuments({
      ...baseQuery,
      startAt: { $gte: now },
      status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING] },
    }),
    Reservation.countDocuments({
      ...baseQuery,
      status: ReservationStatus.PENDING,
    }),
    Reservation.countDocuments({
      ...baseQuery,
      status: ReservationStatus.CONFIRMED,
    }),
    Reservation.countDocuments({
      ...baseQuery,
      status: ReservationStatus.SEATED,
    }),
    Reservation.countDocuments({
      ...baseQuery,
      status: ReservationStatus.CANCELLED,
    }),
    Reservation.countDocuments({
      ...baseQuery,
      status: ReservationStatus.COMPLETED,
    }),
  ]);

  return {
    todayTotal,
    upcomingTotal,
    pendingTotal,
    confirmedTotal,
    seatedTotal,
    cancelledTotal,
    completedTotal,
  };
}

/**
 * Admin: Confirm a PENDING reservation
 */
export async function adminConfirmReservation(
  idOrRef: string,
  actor: ReservationActor
): Promise<IReservationDocument> {
  const reservation = await getReservationByIdOrRef(idOrRef);
  if (!reservation) {
    throw new Error(`Reservation "${idOrRef}" was not found.`);
  }

  if (reservation.status !== ReservationStatus.PENDING) {
    throw new Error(`Only PENDING reservations can be confirmed. Current status: "${reservation.status}".`);
  }

  // Ensure table capacity is still valid
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Verify or reallocate table
    const allocatedTables = await allocateTableForSlot({
      locationId: reservation.locationId,
      startAt: reservation.startAt,
      endAt: reservation.endAt,
      guestCount: reservation.guestCount,
      seatingPreference: reservation.seatingPreference,
      excludeReservationId: reservation._id.toString(),
      session,
    });

    reservation.status = ReservationStatus.CONFIRMED;
    reservation.confirmedAt = new Date();
    reservation.tableIds = allocatedTables.map((t) => t._id);
    reservation.tableNumbers = allocatedTables.map((t) => t.tableNumber);

    reservation.statusHistory.push({
      status: ReservationStatus.CONFIRMED,
      changedAt: new Date(),
      actorType: 'STAFF',
      actorId: actor.id,
      note: 'Reservation confirmed by administrator.',
    });

    await reservation.save({ session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  await logReservationAudit({
    action: 'RESERVATION_CONFIRMED',
    reservation,
    actor,
    details: `Admin confirmed reservation ${reservation.reservationReference}.`,
  });

  emitReservationSocketEvent('reservations.confirmed', reservation);

  if (reservation.customerId || reservation.guestEmail) {
    notificationService.createNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: reservation.customerId || reservation.guestEmail,
      recipientEmail: reservation.guestEmail,
      recipientPhone: reservation.guestPhone,
      title: `Reservation Confirmed: ${reservation.reservationReference}`,
      message: `Your reservation (${reservation.reservationReference}) has been officially confirmed! Table: ${reservation.tableNumbers.join(', ')}.`,
      category: NotificationCategory.RESERVATION,
      priority: NotificationPriority.HIGH,
      link: `/account/reservations`,
      metadata: { reservationId: reservation._id.toString(), reference: reservation.reservationReference },
    }).catch((err) => logger.warn('[ReservationService] Guest confirm notification error:', err));
  }

  return reservation;
}

/**
 * Admin: Reject a PENDING reservation request
 */
export async function adminRejectReservation(
  idOrRef: string,
  reason: string,
  actor: ReservationActor
): Promise<IReservationDocument> {
  const reservation = await getReservationByIdOrRef(idOrRef);
  if (!reservation) {
    throw new Error(`Reservation "${idOrRef}" was not found.`);
  }

  if (reservation.status !== ReservationStatus.PENDING) {
    throw new Error(`Only PENDING reservations can be rejected. Current status: "${reservation.status}".`);
  }

  reservation.status = ReservationStatus.REJECTED;
  reservation.cancellationReason = reason || 'Reservation request declined by management.';
  reservation.tableIds = [];
  reservation.tableNumbers = [];
  await TableSlotAllocation.deleteMany({ reservationId: reservation._id });

  reservation.statusHistory.push({
    status: ReservationStatus.REJECTED,
    changedAt: new Date(),
    actorType: 'STAFF',
    actorId: actor.id,
    note: `Rejected by admin: ${reason}`,
  });

  await reservation.save();

  await logReservationAudit({
    action: 'RESERVATION_REJECTED',
    reservation,
    actor,
    details: `Admin rejected reservation request ${reservation.reservationReference}. Reason: ${reason}`,
  });

  emitReservationSocketEvent('reservations.updated', reservation);

  return reservation;
}
