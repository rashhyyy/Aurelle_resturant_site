import mongoose from 'mongoose';
import { VIPRoom, IVIPRoomDocument } from '../models/vipRoom.model';
import { VIPBooking, IVIPBookingDocument } from '../models/vipBooking.model';
import { VIPRoomAllocation, IVIPRoomAllocationDocument } from '../models/vipRoomAllocation.model';
import { PrivateDiningPackage, IPrivateDiningPackageDocument } from '../models/privateDiningPackage.model';
import { EventInquiry, IEventInquiryDocument } from '../models/eventInquiry.model';
import { EventProposal, IEventProposalDocument } from '../models/eventProposal.model';
import { EventBooking, IEventBookingDocument } from '../models/eventBooking.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { getSocketServer } from '../sockets/socket.server';
import { logger } from '../utils/logger';
import {
  VIPBookingStatus,
  EventInquiryStatus,
  EventProposalStatus,
  EventBookingStatus,
  PaymentStatus,
  IVIPRoomSafeJSON,
  IPrivateDiningPackageSafeJSON,
  IVIPBookingSafeJSON,
  IEventInquirySafeJSON,
  IEventProposalSafeJSON,
  IEventBookingSafeJSON,
  VIPOverviewMetrics,
} from '../types/vip';
import { StaffAuditAction, StaffRole } from '../types/staff';
import { notificationService } from './notification.service';
import {
  NotificationCategory,
  NotificationPriority,
  RecipientType,
} from '../types/notification';

export interface VIPActor {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  actorType?: 'STAFF' | 'CUSTOMER' | 'SYSTEM';
}

/**
 * Real-time WebSocket emitter for VIP events
 */
export function emitVIPEvent(
  eventName: string,
  locationId: string,
  payload: any
): void {
  try {
    const io = getSocketServer();
    if (!io) return;

    io.to(`vip:${locationId}`)
      .to(`staff:${locationId}`)
      .to(`location:${locationId}`)
      .to('role:admin')
      .to('role:manager')
      .to('role:reception')
      .to('role:floor')
      .emit(eventName as any, payload);
  } catch (err) {
    logger.warn('[Socket.IO] Failed to emit VIP event:', err);
  }
}

/**
 * Record regulatory staff audit log for VIP operations
 */
export async function logVIPAudit(params: {
  action: StaffAuditAction;
  targetId: string;
  targetName?: string;
  locationId: string;
  actor: VIPActor;
  details: string;
}): Promise<void> {
  try {
    await StaffAuditLog.create({
      actorId: params.actor.id || 'vip-system',
      actorName: params.actor.name || params.actor.email || 'VIP System',
      actorEmail: params.actor.email || 'vip@aurelle.com',
      targetStaffId: params.targetId,
      targetStaffName: params.targetName || `VIP Target ${params.targetId}`,
      targetStaffEmail: params.actor.email || 'vip@aurelle.com',
      action: params.action,
      details: params.details,
      locationId: params.locationId,
      ipAddress: '127.0.0.1',
    });
  } catch (err) {
    logger.warn('[VIP Audit] Failed to write audit entry:', err);
  }
}

/**
 * Generates discrete 30-minute slot timestamps from startAt to endAt + bufferMinutes
 */
export function generateSlotIntervals(
  startAt: Date,
  endAt: Date,
  bufferMinutes: number = 60
): Date[] {
  const slots: Date[] = [];
  const startMs = Math.floor(startAt.getTime() / (30 * 60 * 1000)) * (30 * 60 * 1000);
  const endMsWithBuffer = endAt.getTime() + bufferMinutes * 60 * 1000;

  for (let currentMs = startMs; currentMs < endMsWithBuffer; currentMs += 30 * 60 * 1000) {
    slots.push(new Date(currentMs));
  }
  return slots;
}

/**
 * Atomically claim room allocation slots.
 * Guarantees zero double-booking via compound unique index ({ roomId: 1, slotTime: 1 }).
 */
export async function claimRoomSlots(params: {
  roomId: mongoose.Types.ObjectId;
  locationId: string;
  startAt: Date;
  endAt: Date;
  bufferMinutes: number;
  bookingReference: string;
  bookingId: mongoose.Types.ObjectId;
  bookingType: 'VIP_BOOKING' | 'EVENT_BOOKING' | 'MAINTENANCE_HOLD';
}): Promise<void> {
  const slotTimes = generateSlotIntervals(params.startAt, params.endAt, params.bufferMinutes);

  const docs = slotTimes.map((slotTime) => ({
    roomId: params.roomId,
    locationId: params.locationId,
    slotTime,
    bookingReference: params.bookingReference,
    bookingId: params.bookingId,
    bookingType: params.bookingType,
  }));

  try {
    await VIPRoomAllocation.insertMany(docs, { ordered: true });
  } catch (error: any) {
    // If insertion failed halfway, clean up any inserted slots for this bookingId
    await VIPRoomAllocation.deleteMany({ bookingId: params.bookingId });

    if (error.code === 11000 || (error.writeErrors && error.writeErrors.some((e: any) => e.code === 11000))) {
      throw new Error(
        `Room booking conflict: The requested VIP room is already reserved during this time slot or its turnover buffer.`
      );
    }
    throw error;
  }
}

/**
 * Releases all slots allocated to a given booking
 */
export async function releaseRoomSlots(bookingId: mongoose.Types.ObjectId): Promise<void> {
  await VIPRoomAllocation.deleteMany({ bookingId });
}

// ============================================================================
// VIP ROOMS MANAGEMENT
// ============================================================================

export async function getVIPRooms(options: {
  locationId?: string;
  isPublishedOnly?: boolean;
  capacity?: number;
}): Promise<IVIPRoomSafeJSON[]> {
  const query: any = { isActive: true };

  if (options.locationId) {
    query.locationId = options.locationId;
  }
  if (options.isPublishedOnly) {
    query.isPublished = true;
  }
  if (options.capacity) {
    query.capacityMin = { $lte: options.capacity };
    query.capacityMax = { $gte: options.capacity };
  }

  const rooms = await VIPRoom.find(query).sort({ displayOrder: 1, name: 1 });
  return rooms.map((r) => r.toSafeJSON());
}

export async function getVIPRoomBySlugOrId(
  slugOrId: string,
  isPublishedOnly: boolean = false
): Promise<IVIPRoomDocument | null> {
  const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
  const query: any = isObjectId
    ? { $or: [{ _id: slugOrId }, { slug: slugOrId.toLowerCase() }] }
    : { slug: slugOrId.toLowerCase() };

  if (isPublishedOnly) {
    query.isPublished = true;
    query.isActive = true;
  }

  return await VIPRoom.findOne(query);
}

export async function createVIPRoom(
  roomData: any,
  actor: VIPActor
): Promise<IVIPRoomSafeJSON> {
  // Check for slug collision
  const existing = await VIPRoom.findOne({
    locationId: roomData.locationId,
    slug: roomData.slug.toLowerCase().trim(),
  });
  if (existing) {
    throw new Error(`A VIP room with the slug "${roomData.slug}" already exists at this location.`);
  }

  const room = await VIPRoom.create({
    ...roomData,
    slug: roomData.slug.toLowerCase().trim(),
  });

  await logVIPAudit({
    action: 'VIP_ROOM_CREATED',
    targetId: room._id.toString(),
    targetName: room.name,
    locationId: room.locationId,
    actor,
    details: `Created new VIP Room: ${room.name} (${room.slug}, capacity: ${room.capacityMin}-${room.capacityMax})`,
  });

  emitVIPEvent('vip.roomAvailabilityChanged', room.locationId, { roomId: room._id });

  return room.toSafeJSON();
}

export async function updateVIPRoom(
  roomId: string,
  updateData: any,
  actor: VIPActor
): Promise<IVIPRoomSafeJSON> {
  const room = await VIPRoom.findById(roomId);
  if (!room) {
    throw new Error('VIP room not found.');
  }

  // Conflict check: if capacityMax is reduced, verify no confirmed bookings exceed the new capacity
  if (updateData.capacityMax !== undefined && updateData.capacityMax < room.capacityMax) {
    const conflictingBookings = await VIPBooking.findOne({
      roomId: room._id,
      status: { $in: [VIPBookingStatus.CONFIRMED, VIPBookingStatus.PENDING] },
      startAt: { $gte: new Date() },
      guestCount: { $gt: updateData.capacityMax },
    });
    if (conflictingBookings) {
      throw new Error(
        `Cannot reduce maximum capacity to ${updateData.capacityMax}: Future booking ${conflictingBookings.bookingReference} requires ${conflictingBookings.guestCount} guests.`
      );
    }
  }

  Object.assign(room, updateData);
  await room.save();

  await logVIPAudit({
    action: 'VIP_ROOM_MODIFIED',
    targetId: room._id.toString(),
    targetName: room.name,
    locationId: room.locationId,
    actor,
    details: `Updated VIP Room configuration: ${room.name}`,
  });

  emitVIPEvent('vip.roomAvailabilityChanged', room.locationId, { roomId: room._id });

  return room.toSafeJSON();
}

export async function deleteOrArchiveVIPRoom(
  roomId: string,
  actor: VIPActor
): Promise<void> {
  const room = await VIPRoom.findById(roomId);
  if (!room) {
    throw new Error('VIP room not found.');
  }

  // Check if historical bookings exist
  const count = await VIPBooking.countDocuments({ roomId: room._id });
  if (count > 0) {
    // Soft-archive to preserve historical records
    room.isActive = false;
    room.isPublished = false;
    await room.save();

    await logVIPAudit({
      action: 'VIP_ROOM_ARCHIVED',
      targetId: room._id.toString(),
      targetName: room.name,
      locationId: room.locationId,
      actor,
      details: `Archived VIP Room: ${room.name} (${count} historical bookings preserved)`,
    });
  } else {
    await room.deleteOne();
    await logVIPAudit({
      action: 'VIP_ROOM_MODIFIED',
      targetId: roomId,
      targetName: room.name,
      locationId: room.locationId,
      actor,
      details: `Deleted VIP Room: ${room.name}`,
    });
  }

  emitVIPEvent('vip.roomAvailabilityChanged', room.locationId, { roomId });
}

// ============================================================================
// VIP ROOM AVAILABILITY
// ============================================================================

export async function checkRoomAvailability(params: {
  locationId: string;
  roomId: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  startAt?: string;
  endAt?: string;
  durationMinutes?: number;
  guestCount?: number;
}): Promise<{
  isAvailable: boolean;
  room: IVIPRoomSafeJSON;
  availableTimes: string[];
  message?: string;
}> {
  const roomDoc = await getVIPRoomBySlugOrId(params.roomId, true);
  if (!roomDoc) {
    throw new Error('VIP room not found or not published.');
  }

  const duration = params.durationMinutes || roomDoc.bookingDurationMinutes || 180;
  const buffer = roomDoc.bufferMinutes || 60;

  // Direct startAt/endAt window check
  if (params.startAt) {
    const slotStart = new Date(params.startAt);
    const slotEnd = params.endAt ? new Date(params.endAt) : new Date(slotStart.getTime() + duration * 60 * 1000);
    const slots = generateSlotIntervals(slotStart, slotEnd, buffer);
    const collision = await VIPRoomAllocation.findOne({
      roomId: roomDoc._id,
      slotTime: { $in: slots },
    });
    const isAvailable = !collision;
    return {
      isAvailable,
      room: roomDoc.toSafeJSON(),
      availableTimes: isAvailable ? [slotStart.toISOString().slice(11, 16)] : [],
      message: isAvailable ? 'Space is available for booking' : 'VIP room is already reserved for this timeslot or cleaning buffer',
    };
  }

  // Capacity validation
  if (params.guestCount !== undefined) {
    if (params.guestCount < roomDoc.capacityMin || params.guestCount > roomDoc.capacityMax) {
      return {
        isAvailable: false,
        room: roomDoc.toSafeJSON(),
        availableTimes: [],
        message: `Guest count (${params.guestCount}) must be between ${roomDoc.capacityMin} and ${roomDoc.capacityMax} for this space.`,
      };
    }
  }

  // Operating window for private dining: 12:00 to 22:30 (slots at 12:00, 13:00, 18:00, 19:00, 20:00)
  const candidateTimes = ['12:00', '13:00', '18:00', '18:30', '19:00', '19:30', '20:00'];
  const availableTimes: string[] = [];

  for (const t of candidateTimes) {
    const slotStart = new Date(`${params.date}T${t}:00.000Z`);
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
    const slots = generateSlotIntervals(slotStart, slotEnd, buffer);

    const collision = await VIPRoomAllocation.findOne({
      roomId: roomDoc._id,
      slotTime: { $in: slots },
    });

    if (!collision) {
      availableTimes.push(t);
    }
  }

  let isAvailable = false;
  if (params.time) {
    isAvailable = availableTimes.includes(params.time);
  } else {
    isAvailable = availableTimes.length > 0;
  }

  return {
    isAvailable,
    room: roomDoc.toSafeJSON(),
    availableTimes,
    message: isAvailable ? 'Space is available for booking' : 'No available slots for the selected time',
  };
}

// ============================================================================
// VIP BOOKING WORKFLOW
// ============================================================================

export async function createVIPBooking(
  bookingData: {
    locationId: string;
    roomId: string;
    guestCount: number;
    date?: string;
    time?: string;
    startAt?: string;
    endAt?: string;
    packageId?: string | null;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequests?: string;
    occasion?: string;
  },
  actor?: VIPActor
): Promise<IVIPBookingSafeJSON> {
  const roomDoc = await getVIPRoomBySlugOrId(bookingData.roomId, true);
  if (!roomDoc) {
    throw new Error('VIP room not found or currently unavailable.');
  }

  // Validate capacity
  if (bookingData.guestCount < roomDoc.capacityMin || bookingData.guestCount > roomDoc.capacityMax) {
    throw new Error(
      `Guest count (${bookingData.guestCount}) must be between ${roomDoc.capacityMin} and ${roomDoc.capacityMax} for ${roomDoc.name}.`
    );
  }

  // Calculate timestamps
  const duration = roomDoc.bookingDurationMinutes || 180;
  const buffer = roomDoc.bufferMinutes || 60;
  let startAt: Date;
  let endAt: Date;
  if (bookingData.startAt) {
    startAt = new Date(bookingData.startAt);
    endAt = bookingData.endAt
      ? new Date(bookingData.endAt)
      : new Date(startAt.getTime() + duration * 60 * 1000);
  } else {
    startAt = new Date(`${bookingData.date}T${bookingData.time}:00.000Z`);
    endAt = new Date(startAt.getTime() + duration * 60 * 1000);
  }

  // Validate date is not in past
  if (startAt.getTime() < Date.now() - 15 * 60 * 1000) {
    throw new Error('Cannot create VIP bookings in the past.');
  }

  // Check package if provided
  let packageSnapshot: any = null;
  let quotedPriceMinor = roomDoc.basePriceMinor || 0;

  if (bookingData.packageId) {
    const pkg = await PrivateDiningPackage.findById(bookingData.packageId);
    if (pkg && pkg.isPublished) {
      packageSnapshot = {
        name: pkg.name,
        priceMinor: pkg.priceMinor,
        currency: pkg.currency,
        description: pkg.description,
      };
      quotedPriceMinor = pkg.priceMinor * bookingData.guestCount;
    }
  }

  // Generate unique booking reference
  const dateStr = startAt.toISOString().slice(0, 10).replace(/-/g, '');
  const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const bookingReference = `VIP-${dateStr}-${randSuffix}`;

  const bookingId = new mongoose.Types.ObjectId();

  // Atomically claim room allocation slots
  await claimRoomSlots({
    roomId: roomDoc._id as mongoose.Types.ObjectId,
    locationId: bookingData.locationId,
    startAt,
    endAt,
    bufferMinutes: buffer,
    bookingReference,
    bookingId,
    bookingType: 'VIP_BOOKING',
  });

  // Create booking document
  const booking = await VIPBooking.create({
    _id: bookingId,
    bookingReference,
    customerId: actor?.id || null,
    locationId: bookingData.locationId,
    roomId: roomDoc._id,
    guestCount: bookingData.guestCount,
    startAt,
    endAt,
    timezone: 'Asia/Colombo',
    status: VIPBookingStatus.CONFIRMED,
    packageId: bookingData.packageId || null,
    packageSnapshot,
    guestName: bookingData.guestName.trim(),
    guestEmail: bookingData.guestEmail.trim().toLowerCase(),
    guestPhone: bookingData.guestPhone.trim(),
    specialRequests: bookingData.specialRequests?.trim() || undefined,
    occasion: bookingData.occasion?.trim() || undefined,
    quotedPriceMinor,
    currency: roomDoc.currency || 'LKR',
    paymentStatus: PaymentStatus.UNPAID,
    confirmedAt: new Date(),
  });

  await logVIPAudit({
    action: 'VIP_BOOKING_CREATED',
    targetId: booking._id.toString(),
    targetName: booking.bookingReference,
    locationId: booking.locationId,
    actor: actor || { name: booking.guestName, email: booking.guestEmail, actorType: 'CUSTOMER' },
    details: `Confirmed VIP Booking ${booking.bookingReference} for ${booking.guestName} in ${roomDoc.name} (${booking.guestCount} guests, ${bookingData.date} ${bookingData.time})`,
  });

  emitVIPEvent('vip.bookingCreated', booking.locationId, {
    bookingId: booking._id,
    bookingReference: booking.bookingReference,
    roomName: roomDoc.name,
  });

  if (booking.customerId || booking.guestEmail) {
    notificationService.createNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: booking.customerId || booking.guestEmail,
      recipientEmail: booking.guestEmail,
      recipientPhone: booking.guestPhone,
      title: `VIP Room Confirmed: ${roomDoc.name}`,
      message: `Your private suite reservation (${booking.bookingReference}) for ${booking.guestCount} guests has been confirmed.`,
      category: NotificationCategory.VIP,
      priority: NotificationPriority.HIGH,
      link: `/account/reservations`,
      metadata: { bookingId: booking._id.toString(), reference: booking.bookingReference },
    }).catch((err) => logger.warn('[VIPService] Customer notification error:', err));
  }

  notificationService.notifyStaffRole({
    role: StaffRole.MANAGER,
    locationId: booking.locationId,
    title: `New VIP Booking: ${roomDoc.name}`,
    message: `${booking.guestName} confirmed VIP booking (${booking.bookingReference}) for ${booking.guestCount} guests.`,
    category: NotificationCategory.VIP,
    priority: NotificationPriority.HIGH,
    link: `/staff/manager`,
    metadata: { bookingId: booking._id.toString(), reference: booking.bookingReference },
  }).catch((err) => logger.warn('[VIPService] Manager notification error:', err));

  return booking.toSafeJSON();
}

export async function getVIPBookings(options: {
  locationId?: string;
  status?: string;
  date?: string;
  customerId?: string;
  search?: string;
}): Promise<IVIPBookingSafeJSON[]> {
  const query: any = {};

  if (options.locationId) query.locationId = options.locationId;
  if (options.status && options.status !== 'ALL') query.status = options.status;
  if (options.customerId) query.customerId = options.customerId;

  if (options.date) {
    const startOfDay = new Date(`${options.date}T00:00:00.000Z`);
    const endOfDay = new Date(`${options.date}T23:59:59.999Z`);
    query.startAt = { $gte: startOfDay, $lte: endOfDay };
  }

  if (options.search) {
    const q = options.search.trim();
    query.$or = [
      { bookingReference: { $regex: q, $options: 'i' } },
      { guestName: { $regex: q, $options: 'i' } },
      { guestEmail: { $regex: q, $options: 'i' } },
      { guestPhone: { $regex: q, $options: 'i' } },
    ];
  }

  const bookings = await VIPBooking.find(query)
    .populate('roomId', 'name slug')
    .sort({ startAt: -1 });

  return bookings.map((b) => b.toSafeJSON());
}

export async function getVIPBookingByReference(
  ref: string,
  customerId?: string
): Promise<IVIPBookingSafeJSON | null> {
  const query: any = { bookingReference: ref.toUpperCase().trim() };
  if (customerId) {
    query.customerId = customerId;
  }

  const booking = await VIPBooking.findOne(query).populate('roomId', 'name slug');
  return booking ? booking.toSafeJSON() : null;
}

export async function modifyVIPBooking(
  ref: string,
  updates: {
    guestCount?: number;
    date?: string;
    time?: string;
    specialRequests?: string;
    packageId?: string | null;
  },
  actor: VIPActor
): Promise<IVIPBookingSafeJSON> {
  const booking = await VIPBooking.findOne({ bookingReference: ref.toUpperCase().trim() });
  if (!booking) {
    throw new Error('VIP booking not found.');
  }

  const room = await VIPRoom.findById(booking.roomId);
  if (!room) {
    throw new Error('Associated VIP room not found.');
  }

  // If date or time changed, atomically adjust slot allocations
  if (updates.date || updates.time) {
    const curDateStr = booking.startAt.toISOString().split('T')[0];
    const curTimeStr = booking.startAt.toISOString().split('T')[1].substring(0, 5);

    const newDate = updates.date || curDateStr;
    const newTime = updates.time || curTimeStr;
    const duration = room.bookingDurationMinutes || 180;
    const buffer = room.bufferMinutes || 60;

    const newStart = new Date(`${newDate}T${newTime}:00.000Z`);
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    // Release old slots and claim new slots
    await releaseRoomSlots(booking._id as mongoose.Types.ObjectId);

    try {
      await claimRoomSlots({
        roomId: room._id as mongoose.Types.ObjectId,
        locationId: booking.locationId,
        startAt: newEnd,
        endAt: newEnd,
        bufferMinutes: buffer,
        bookingReference: booking.bookingReference,
        bookingId: booking._id as mongoose.Types.ObjectId,
        bookingType: 'VIP_BOOKING',
      });
    } catch (err) {
      // Re-claim original slots if conflict occurs
      await claimRoomSlots({
        roomId: room._id as mongoose.Types.ObjectId,
        locationId: booking.locationId,
        startAt: booking.startAt,
        endAt: booking.endAt,
        bufferMinutes: buffer,
        bookingReference: booking.bookingReference,
        bookingId: booking._id as mongoose.Types.ObjectId,
        bookingType: 'VIP_BOOKING',
      });
      throw err;
    }

    booking.startAt = newStart;
    booking.endAt = newEnd;
  }

  if (updates.guestCount !== undefined) {
    if (updates.guestCount < room.capacityMin || updates.guestCount > room.capacityMax) {
      throw new Error(
        `Guest count (${updates.guestCount}) must be between ${room.capacityMin} and ${room.capacityMax}.`
      );
    }
    booking.guestCount = updates.guestCount;
  }

  if (updates.specialRequests !== undefined) {
    booking.specialRequests = updates.specialRequests;
  }

  await booking.save();

  await logVIPAudit({
    action: 'VIP_BOOKING_MODIFIED',
    targetId: booking._id.toString(),
    targetName: booking.bookingReference,
    locationId: booking.locationId,
    actor,
    details: `Modified VIP booking ${booking.bookingReference}`,
  });

  emitVIPEvent('vip.bookingUpdated', booking.locationId, {
    bookingReference: booking.bookingReference,
  });

  return booking.toSafeJSON();
}

export async function cancelVIPBooking(
  ref: string,
  reason: string,
  actor: VIPActor
): Promise<IVIPBookingSafeJSON> {
  const booking = await VIPBooking.findOne({ bookingReference: ref.toUpperCase().trim() });
  if (!booking) {
    throw new Error('VIP booking not found.');
  }

  if (booking.status === VIPBookingStatus.CANCELLED) {
    throw new Error('This booking is already cancelled.');
  }

  booking.status = VIPBookingStatus.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason;
  await booking.save();

  // Release capacity
  await releaseRoomSlots(booking._id as mongoose.Types.ObjectId);

  await logVIPAudit({
    action: 'VIP_BOOKING_CANCELLED',
    targetId: booking._id.toString(),
    targetName: booking.bookingReference,
    locationId: booking.locationId,
    actor,
    details: `Cancelled VIP Booking ${booking.bookingReference}. Reason: ${reason}`,
  });

  emitVIPEvent('vip.bookingCancelled', booking.locationId, {
    bookingReference: booking.bookingReference,
  });

  return booking.toSafeJSON();
}

export async function checkInVIPBooking(
  ref: string,
  actor: VIPActor
): Promise<IVIPBookingSafeJSON> {
  const booking = await VIPBooking.findOne({ bookingReference: ref.toUpperCase().trim() });
  if (!booking) {
    throw new Error('VIP booking not found.');
  }

  booking.status = VIPBookingStatus.CHECKED_IN;
  await booking.save();

  await logVIPAudit({
    action: 'VIP_GUEST_CHECKED_IN',
    targetId: booking._id.toString(),
    targetName: booking.bookingReference,
    locationId: booking.locationId,
    actor,
    details: `Checked in VIP guest for booking ${booking.bookingReference}`,
  });

  emitVIPEvent('vip.bookingUpdated', booking.locationId, {
    bookingReference: booking.bookingReference,
    status: VIPBookingStatus.CHECKED_IN,
  });

  return booking.toSafeJSON();
}

// ============================================================================
// PRIVATE DINING PACKAGES
// ============================================================================

export async function getPrivateDiningPackages(options: {
  locationId?: string;
  roomId?: string;
  isPublishedOnly?: boolean;
}): Promise<IPrivateDiningPackageSafeJSON[]> {
  const query: any = {};
  if (options.locationId) query.locationId = options.locationId;
  if (options.isPublishedOnly) query.isPublished = true;
  if (options.roomId) {
    query.$or = [{ roomId: null }, { roomId: options.roomId }];
  }

  const pkgs = await PrivateDiningPackage.find(query).sort({ priceMinor: 1 });
  return pkgs.map((p) => p.toSafeJSON());
}

export async function createPrivateDiningPackage(
  pkgData: any,
  actor: VIPActor
): Promise<IPrivateDiningPackageSafeJSON> {
  const pkg = await PrivateDiningPackage.create(pkgData);

  await logVIPAudit({
    action: 'VIP_ROOM_MODIFIED',
    targetId: pkg._id.toString(),
    targetName: pkg.name,
    locationId: pkg.locationId,
    actor,
    details: `Created Private Dining Package: ${pkg.name}`,
  });

  return pkg.toSafeJSON();
}

// ============================================================================
// EVENT INQUIRIES & PROPOSALS
// ============================================================================

export async function createEventInquiry(
  inquiryData: {
    locationId: string;
    eventType: string;
    preferredDate: string;
    preferredTime: string;
    guestCount: number;
    preferredRoomId?: string | null;
    requirements: string;
    budgetMinor?: number | null;
    currency?: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
  },
  actor?: VIPActor
): Promise<IEventInquirySafeJSON> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const inquiryReference = `INQ-${dateStr}-${rand}`;

  let preferredRoomObjectId: mongoose.Types.ObjectId | null = null;
  if (inquiryData.preferredRoomId) {
    const room = await getVIPRoomBySlugOrId(inquiryData.preferredRoomId);
    if (room) preferredRoomObjectId = room._id as mongoose.Types.ObjectId;
  }

  const inquiry = await EventInquiry.create({
    inquiryReference,
    customerId: actor?.id || null,
    locationId: inquiryData.locationId,
    eventType: inquiryData.eventType,
    preferredDate: inquiryData.preferredDate,
    preferredTime: inquiryData.preferredTime,
    guestCount: inquiryData.guestCount,
    preferredRoomId: preferredRoomObjectId,
    requirements: inquiryData.requirements.trim(),
    budgetMinor: inquiryData.budgetMinor || null,
    currency: inquiryData.currency || 'LKR',
    guestName: inquiryData.guestName.trim(),
    guestEmail: inquiryData.guestEmail.trim().toLowerCase(),
    guestPhone: inquiryData.guestPhone.trim(),
    status: EventInquiryStatus.NEW,
  });

  await logVIPAudit({
    action: 'EVENT_INQUIRY_CREATED',
    targetId: inquiry._id.toString(),
    targetName: inquiry.inquiryReference,
    locationId: inquiry.locationId,
    actor: actor || { name: inquiry.guestName, email: inquiry.guestEmail, actorType: 'CUSTOMER' },
    details: `New Event Inquiry submitted: ${inquiry.inquiryReference} (${inquiry.eventType}, ${inquiry.guestCount} guests)`,
  });

  emitVIPEvent('events.inquiryCreated', inquiry.locationId, {
    inquiryReference: inquiry.inquiryReference,
    guestName: inquiry.guestName,
  });

  return inquiry.toSafeJSON();
}

export async function getEventInquiries(options: {
  locationId?: string;
  status?: string;
  search?: string;
}): Promise<IEventInquirySafeJSON[]> {
  const query: any = {};
  if (options.locationId) query.locationId = options.locationId;
  if (options.status && options.status !== 'ALL') query.status = options.status;

  if (options.search) {
    const q = options.search.trim();
    query.$or = [
      { inquiryReference: { $regex: q, $options: 'i' } },
      { guestName: { $regex: q, $options: 'i' } },
      { guestEmail: { $regex: q, $options: 'i' } },
      { eventType: { $regex: q, $options: 'i' } },
    ];
  }

  const inquiries = await EventInquiry.find(query)
    .populate('preferredRoomId', 'name')
    .sort({ createdAt: -1 });

  return inquiries.map((i) => i.toSafeJSON());
}

export async function getEventInquiryById(id: string): Promise<IEventInquirySafeJSON | null> {
  const inq = await EventInquiry.findById(id).populate('preferredRoomId', 'name');
  return inq ? inq.toSafeJSON() : null;
}

export async function updateEventInquiryStatus(
  id: string,
  status: EventInquiryStatus,
  assignedStaffId?: string,
  assignedStaffName?: string,
  actor?: VIPActor
): Promise<IEventInquirySafeJSON> {
  const inq = await EventInquiry.findById(id);
  if (!inq) {
    throw new Error('Event inquiry not found.');
  }

  inq.status = status;
  if (assignedStaffId) inq.assignedStaffId = assignedStaffId;
  if (assignedStaffName) inq.assignedStaffName = assignedStaffName;

  await inq.save();

  if (actor) {
    await logVIPAudit({
      action: 'EVENT_INQUIRY_UPDATED',
      targetId: inq._id.toString(),
      targetName: inq.inquiryReference,
      locationId: inq.locationId,
      actor,
      details: `Updated Event Inquiry ${inq.inquiryReference} status to ${status}`,
    });
  }

  return inq.toSafeJSON();
}

export async function createEventProposal(
  data: {
    inquiryId: string;
    roomId: string;
    startAt: string;
    endAt: string;
    guestCount: number;
    packageId?: string | null;
    servicesSnapshot: string[];
    subtotalMinor: number;
    taxMinor: number;
    totalMinor: number;
    currency: string;
    terms: string;
    expiresAt: string;
  },
  actor: VIPActor
): Promise<IEventProposalSafeJSON> {
  const inq = await EventInquiry.findById(data.inquiryId);
  if (!inq) {
    throw new Error('Inquiry not found.');
  }

  const room = await getVIPRoomBySlugOrId(data.roomId);
  if (!room) {
    throw new Error('VIP room not found.');
  }

  let packageSnapshot: any = null;
  if (data.packageId) {
    const pkg = await PrivateDiningPackage.findById(data.packageId);
    if (pkg) {
      packageSnapshot = {
        name: pkg.name,
        priceMinor: pkg.priceMinor,
        currency: pkg.currency,
      };
    }
  }

  const proposal = await EventProposal.create({
    inquiryId: inq._id,
    proposalVersion: 1,
    locationId: inq.locationId,
    roomId: room._id,
    startAt: new Date(data.startAt),
    endAt: new Date(data.endAt),
    guestCount: data.guestCount,
    packageSnapshot,
    servicesSnapshot: data.servicesSnapshot,
    subtotalMinor: data.subtotalMinor,
    taxMinor: data.taxMinor,
    totalMinor: data.totalMinor,
    currency: data.currency || 'LKR',
    terms: data.terms,
    expiresAt: new Date(data.expiresAt),
    status: EventProposalStatus.SENT,
    createdBy: actor.name || actor.email || 'Admin',
  });

  inq.status = EventInquiryStatus.PROPOSAL_SENT;
  inq.activeProposalId = proposal._id as mongoose.Types.ObjectId;
  await inq.save();

  await logVIPAudit({
    action: 'EVENT_PROPOSAL_CREATED',
    targetId: proposal._id.toString(),
    targetName: inq.inquiryReference,
    locationId: inq.locationId,
    actor,
    details: `Created & sent Event Proposal for Inquiry ${inq.inquiryReference} (Total: ${data.currency} ${(data.totalMinor / 100).toLocaleString()})`,
  });

  emitVIPEvent('events.proposalSent', inq.locationId, {
    proposalId: proposal._id,
    inquiryReference: inq.inquiryReference,
  });

  return proposal.toSafeJSON();
}

export async function getEventProposalById(
  id: string,
  customerId?: string
): Promise<IEventProposalSafeJSON | null> {
  const proposal = await EventProposal.findById(id).populate('roomId', 'name');
  if (!proposal) return null;

  if (customerId) {
    const inq = await EventInquiry.findById(proposal.inquiryId);
    if (!inq || inq.customerId !== customerId) {
      return null;
    }
  }

  return proposal.toSafeJSON();
}

export async function acceptEventProposal(
  proposalId: string,
  actor: VIPActor
): Promise<IEventBookingSafeJSON> {
  const proposal = await EventProposal.findById(proposalId);
  if (!proposal) {
    throw new Error('Event proposal not found.');
  }

  if (proposal.status !== EventProposalStatus.SENT) {
    throw new Error(`Proposal cannot be accepted: Current status is ${proposal.status}.`);
  }

  if (proposal.expiresAt.getTime() < Date.now()) {
    proposal.status = EventProposalStatus.EXPIRED;
    await proposal.save();
    throw new Error('This event proposal has expired.');
  }

  const room = await VIPRoom.findById(proposal.roomId);
  if (!room) {
    throw new Error('Allocated VIP room no longer exists.');
  }

  const inq = await EventInquiry.findById(proposal.inquiryId);

  // Generate event reference
  const dateStr = proposal.startAt.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const eventReference = `EVT-${dateStr}-${rand}`;

  const eventBookingId = new mongoose.Types.ObjectId();

  // Atomically claim the room slots for this confirmed event
  await claimRoomSlots({
    roomId: room._id as mongoose.Types.ObjectId,
    locationId: proposal.locationId,
    startAt: proposal.startAt,
    endAt: proposal.endAt,
    bufferMinutes: room.bufferMinutes || 60,
    bookingReference: eventReference,
    bookingId: eventBookingId,
    bookingType: 'EVENT_BOOKING',
  });

  // Create event booking
  const booking = await EventBooking.create({
    _id: eventBookingId,
    eventReference,
    inquiryId: proposal.inquiryId,
    acceptedProposalId: proposal._id,
    customerId: inq?.customerId || null,
    locationId: proposal.locationId,
    roomId: room._id,
    startAt: proposal.startAt,
    endAt: proposal.endAt,
    guestCount: proposal.guestCount,
    eventType: inq?.eventType || 'Private Event',
    status: EventBookingStatus.CONFIRMED,
    paymentStatus: PaymentStatus.UNPAID,
    agreedTotalMinor: proposal.totalMinor,
    currency: proposal.currency,
    specialRequirements: inq?.requirements,
    guestName: inq?.guestName || 'Guest',
    guestEmail: inq?.guestEmail || 'guest@example.com',
    guestPhone: inq?.guestPhone || '',
  });

  // Update proposal and inquiry states
  proposal.status = EventProposalStatus.ACCEPTED;
  await proposal.save();

  if (inq) {
    inq.status = EventInquiryStatus.ACCEPTED;
    await inq.save();
  }

  await logVIPAudit({
    action: 'EVENT_BOOKING_CONFIRMED',
    targetId: booking._id.toString(),
    targetName: booking.eventReference,
    locationId: booking.locationId,
    actor,
    details: `Event Proposal Accepted: Confirmed Event ${booking.eventReference} (${booking.eventType})`,
  });

  emitVIPEvent('events.proposalAccepted', booking.locationId, {
    eventReference: booking.eventReference,
  });

  emitVIPEvent('events.bookingConfirmed', booking.locationId, {
    eventReference: booking.eventReference,
  });

  return booking.toSafeJSON();
}

export async function declineEventProposal(
  proposalId: string,
  actor: VIPActor
): Promise<IEventProposalSafeJSON> {
  const proposal = await EventProposal.findById(proposalId);
  if (!proposal) {
    throw new Error('Event proposal not found.');
  }

  proposal.status = EventProposalStatus.DECLINED;
  await proposal.save();

  const inq = await EventInquiry.findById(proposal.inquiryId);
  if (inq) {
    inq.status = EventInquiryStatus.DECLINED;
    await inq.save();
  }

  await logVIPAudit({
    action: 'EVENT_PROPOSAL_DECLINED',
    targetId: proposal._id.toString(),
    targetName: inq?.inquiryReference || proposal._id.toString(),
    locationId: proposal.locationId,
    actor,
    details: `Event Proposal Declined for inquiry ${inq?.inquiryReference}`,
  });

  return proposal.toSafeJSON();
}

export async function getEventBookings(options: {
  locationId?: string;
  status?: string;
}): Promise<IEventBookingSafeJSON[]> {
  const query: any = {};
  if (options.locationId) query.locationId = options.locationId;
  if (options.status && options.status !== 'ALL') query.status = options.status;

  const bookings = await EventBooking.find(query)
    .populate('roomId', 'name')
    .sort({ startAt: 1 });

  return bookings.map((b) => b.toSafeJSON());
}

// ============================================================================
// VIP & EVENTS OVERVIEW METRICS
// ============================================================================

export async function getVIPOverview(locationId: string): Promise<VIPOverviewMetrics> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [totalActiveRooms, upcomingVIPBookings, pendingEventInquiries, confirmedEvents, todayArrivals] =
    await Promise.all([
      VIPRoom.countDocuments({ locationId, isActive: true }),
      VIPBooking.countDocuments({
        locationId,
        status: VIPBookingStatus.CONFIRMED,
        startAt: { $gte: new Date() },
      }),
      EventInquiry.countDocuments({
        locationId,
        status: { $in: [EventInquiryStatus.NEW, EventInquiryStatus.UNDER_REVIEW] },
      }),
      EventBooking.countDocuments({
        locationId,
        status: EventBookingStatus.CONFIRMED,
        startAt: { $gte: new Date() },
      }),
      VIPBooking.countDocuments({
        locationId,
        startAt: { $gte: todayStart, $lte: todayEnd },
        status: { $in: [VIPBookingStatus.CONFIRMED, VIPBookingStatus.CHECKED_IN] },
      }),
    ]);

  return {
    locationId,
    totalActiveRooms,
    upcomingVIPBookings,
    pendingEventInquiries,
    confirmedEvents,
    todayArrivals,
  };
}
