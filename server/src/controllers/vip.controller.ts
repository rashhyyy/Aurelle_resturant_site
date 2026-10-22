import { Request, Response } from 'express';
import * as vipService from '../services/vip.service';
import { storeMenuImage } from '../utils/imageStorage';
import {
  createVIPRoomSchema,
  updateVIPRoomSchema,
  checkRoomAvailabilitySchema,
  createVIPBookingSchema,
  modifyVIPBookingSchema,
  cancelVIPBookingSchema,
  createEventInquirySchema,
  createEventProposalSchema,
  createPrivateDiningPackageSchema,
} from '../validations/vip.validation';
import { logger } from '../utils/logger';

function extractStaffActor(req: Request): vipService.VIPActor {
  const staff = (req as any).staff;
  return {
    id: staff?._id?.toString() || staff?.id,
    name: staff ? `${staff.firstName || ''} ${staff.lastName || ''}`.trim() : 'Staff Member',
    email: staff?.email || 'staff@aurelle.com',
    role: staff?.role || 'ADMIN',
    actorType: 'STAFF',
  };
}

function extractCustomerActor(req: Request, guestEmail?: string, guestName?: string): vipService.VIPActor {
  const user = (req as any).session?.user;
  if (user) {
    return {
      id: user.id || user._id,
      name: user.username || user.firstName || 'Customer',
      email: user.email,
      actorType: 'CUSTOMER',
    };
  }
  return {
    name: guestName || 'Guest',
    email: guestEmail || 'guest@example.com',
    actorType: 'CUSTOMER',
  };
}

function resolveLocationId(req: Request): string {
  return (
    (req.query.locationId as string) ||
    (req.body && req.body.locationId) ||
    (req.headers['x-location-id'] as string) ||
    'loc-colombo-main'
  );
}

// ============================================================================
// PUBLIC CUSTOMER HANDLERS
// ============================================================================

export async function getPublicRoomsHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const capacity = req.query.capacity ? parseInt(req.query.capacity as string, 10) : undefined;
    const rooms = await vipService.getVIPRooms({ locationId, isPublishedOnly: true, capacity });
    res.status(200).json({ success: true, data: rooms });
  } catch (err: any) {
    logger.warn('[VIP Controller] getPublicRooms error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPublicRoomBySlugHandler(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const room = await vipService.getVIPRoomBySlugOrId(slug, true);
    if (!room) {
      res.status(404).json({ success: false, message: 'VIP room not found or unpublished.' });
      return;
    }
    res.status(200).json({ success: true, data: room.toSafeJSON() });
  } catch (err: any) {
    logger.warn('[VIP Controller] getPublicRoomBySlug error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function checkRoomAvailabilityHandler(req: Request, res: Response): Promise<void> {
  try {
    const parsed = checkRoomAvailabilitySchema.parse({
      locationId: resolveLocationId(req),
      roomId: req.params.slug || (req.query.roomId as string),
      date: req.query.date,
      time: req.query.time,
      startAt: req.query.startAt,
      endAt: req.query.endAt,
      durationMinutes: req.query.durationMinutes,
      guestCount: req.query.guestCount,
    });

    const result = await vipService.checkRoomAvailability(parsed);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getPublicPackagesHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const roomId = req.query.roomId as string;
    const pkgs = await vipService.getPrivateDiningPackages({ locationId, roomId, isPublishedOnly: true });
    res.status(200).json({ success: true, data: pkgs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createCustomerBookingHandler(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createVIPBookingSchema.parse(req.body);
    const actor = extractCustomerActor(req, parsed.guestEmail, parsed.guestName);
    const booking = await vipService.createVIPBooking(parsed, actor);
    res.status(201).json({ success: true, data: booking });
  } catch (err: any) {
    const status = err.message.includes('conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
}

export async function getBookingByRefHandler(req: Request, res: Response): Promise<void> {
  try {
    const { ref } = req.params;
    const customerId = (req as any).session?.user?.id;
    const booking = await vipService.getVIPBookingByReference(ref, customerId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'VIP booking reference not found.' });
      return;
    }
    res.status(200).json({ success: true, data: booking });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function modifyBookingHandler(req: Request, res: Response): Promise<void> {
  try {
    const { ref } = req.params;
    const parsed = modifyVIPBookingSchema.parse(req.body);
    const actor = extractStaffActor(req) || extractCustomerActor(req);
    const updated = await vipService.modifyVIPBooking(ref, parsed, actor);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    const status = err.message.includes('conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
}

export async function cancelBookingHandler(req: Request, res: Response): Promise<void> {
  try {
    const { ref } = req.params;
    const parsed = cancelVIPBookingSchema.parse(req.body);
    const actor = extractCustomerActor(req);
    const cancelled = await vipService.cancelVIPBooking(ref, parsed.reason, actor);
    res.status(200).json({ success: true, data: cancelled });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function createCustomerInquiryHandler(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createEventInquirySchema.parse(req.body);
    const actor = extractCustomerActor(req, parsed.guestEmail, parsed.guestName);
    const inquiry = await vipService.createEventInquiry(parsed, actor);
    res.status(201).json({ success: true, data: inquiry });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getProposalByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const customerId = (req as any).session?.user?.id;
    const proposal = await vipService.getEventProposalById(id, customerId);
    if (!proposal) {
      res.status(404).json({ success: false, message: 'Event proposal not found.' });
      return;
    }
    res.status(200).json({ success: true, data: proposal });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function acceptProposalHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const actor = extractCustomerActor(req);
    const eventBooking = await vipService.acceptEventProposal(id, actor);
    res.status(200).json({ success: true, data: eventBooking });
  } catch (err: any) {
    const status = err.message.includes('conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
}

export async function declineProposalHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const actor = extractCustomerActor(req);
    const declined = await vipService.declineEventProposal(id, actor);
    res.status(200).json({ success: true, data: declined });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getCustomerHistoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const customerId = (req as any).session?.user?.id;
    const email = req.query.email as string;

    if (!customerId && !email) {
      res.status(401).json({ success: false, message: 'Authentication or guest email required.' });
      return;
    }

    const bookings = await vipService.getVIPBookings({ customerId, search: email });
    const inquiries = await vipService.getEventInquiries({ search: email });

    res.status(200).json({
      success: true,
      data: {
        bookings,
        inquiries,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ============================================================================
// STAFF / ADMINISTRATOR HANDLERS
// ============================================================================

export async function getVIPOverviewHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const metrics = await vipService.getVIPOverview(locationId);
    res.status(200).json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAdminRoomsHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const rooms = await vipService.getVIPRooms({ locationId, isPublishedOnly: false });
    res.status(200).json({ success: true, data: rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createAdminRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createVIPRoomSchema.parse(req.body);
    const actor = extractStaffActor(req);
    const room = await vipService.createVIPRoom(parsed, actor);
    res.status(201).json({ success: true, data: room });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateAdminRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = updateVIPRoomSchema.parse(req.body);
    const actor = extractStaffActor(req);
    const room = await vipService.updateVIPRoom(id, parsed, actor);
    res.status(200).json({ success: true, data: room });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function deleteAdminRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const actor = extractStaffActor(req);
    await vipService.deleteOrArchiveVIPRoom(id, actor);
    res.status(200).json({ success: true, message: 'VIP room deleted or archived successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function uploadRoomImageHandler(req: Request, res: Response): Promise<void> {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      res.status(400).json({ success: false, message: 'imageBase64 payload required.' });
      return;
    }
    const result = await storeMenuImage(imageBase64);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getAdminBookingsHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const status = req.query.status as string;
    const date = req.query.date as string;
    const search = req.query.search as string;

    const bookings = await vipService.getVIPBookings({ locationId, status, date, search });
    res.status(200).json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function checkInBookingHandler(req: Request, res: Response): Promise<void> {
  try {
    const { ref } = req.params;
    const actor = extractStaffActor(req);
    const updated = await vipService.checkInVIPBooking(ref, actor);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function cancelBookingAdminHandler(req: Request, res: Response): Promise<void> {
  try {
    const { ref } = req.params;
    const { reason } = req.body;
    const actor = extractStaffActor(req);
    const cancelled = await vipService.cancelVIPBooking(ref, reason || 'Cancelled by staff', actor);
    res.status(200).json({ success: true, data: cancelled });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getAdminInquiriesHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const status = req.query.status as string;
    const search = req.query.search as string;

    const inquiries = await vipService.getEventInquiries({ locationId, status, search });
    res.status(200).json({ success: true, data: inquiries });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAdminInquiryDetailHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const inq = await vipService.getEventInquiryById(id);
    if (!inq) {
      res.status(404).json({ success: false, message: 'Event inquiry not found.' });
      return;
    }
    res.status(200).json({ success: true, data: inq });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateInquiryStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, assignedStaffId, assignedStaffName } = req.body;
    const actor = extractStaffActor(req);
    const updated = await vipService.updateEventInquiryStatus(id, status, assignedStaffId, assignedStaffName, actor);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function createAdminProposalHandler(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createEventProposalSchema.parse(req.body);
    const actor = extractStaffActor(req);
    const proposal = await vipService.createEventProposal(parsed, actor);
    res.status(201).json({ success: true, data: proposal });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getAdminEventsHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const status = req.query.status as string;
    const events = await vipService.getEventBookings({ locationId, status });
    res.status(200).json({ success: true, data: events });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAdminPackagesHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const pkgs = await vipService.getPrivateDiningPackages({ locationId, isPublishedOnly: false });
    res.status(200).json({ success: true, data: pkgs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createAdminPackageHandler(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createPrivateDiningPackageSchema.parse(req.body);
    const actor = extractStaffActor(req);
    const pkg = await vipService.createPrivateDiningPackage(parsed, actor);
    res.status(201).json({ success: true, data: pkg });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}
