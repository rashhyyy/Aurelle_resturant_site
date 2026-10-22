import { Request, Response, NextFunction } from 'express';
import {
  getReceptionOverview,
  getTodayReservations,
  getReservationDossier,
  checkInGuest,
  assignTable,
  seatGuest,
  markNoShow,
  registerWalkIn,
  getTableAvailability,
  getWaitingList,
  addToWaitingList,
  updateWaitingListEntry,
  seatWaitingListEntry,
  modifyReceptionReservation,
} from '../services/reception.service';
import { ReservationActor } from '../services/reservation.service';
import { RESERVATION_CONFIG } from '../types/reservation';
import { StaffRole } from '../types/staff';
import { logger } from '../utils/logger';

function extractActor(req: Request): ReservationActor {
  if (req.staff) {
    return {
      id: req.staff.id,
      email: req.staff.email,
      name: `${req.staff.firstName} ${req.staff.lastName}`,
      actorType: 'STAFF',
    };
  }
  return {
    actorType: 'STAFF',
    name: 'Reception Desk',
  };
}

function resolveLocationId(req: Request): string {
  if (req.query.locationId && typeof req.query.locationId === 'string') {
    return req.query.locationId;
  }
  if (req.body?.locationId) {
    return req.body.locationId;
  }
  if (req.staff?.locationIds && req.staff.locationIds.length > 0) {
    return req.staff.locationIds[0];
  }
  return RESERVATION_CONFIG.defaultLocationId;
}

export async function getOverviewHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const overview = await getReceptionOverview(locationId);

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] getOverview error:', error.message);
    res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: error.message,
    });
  }
}

export async function getReservationsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;

    const result = await getTodayReservations(locationId, {
      date,
      search,
      status,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] getReservations error:', error.message);
    res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: error.message,
    });
  }
}

export async function getReservationByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locationId = req.staff?.role === StaffRole.ADMIN ? undefined : resolveLocationId(req);
    const dossier = await getReservationDossier(req.params.id, locationId);

    res.status(200).json({
      success: true,
      data: dossier,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] getReservationById error:', error.message);
    const status = error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: status === 404 ? 'NotFound' : 'BadRequest',
      message: error.message,
    });
  }
}

export async function checkInHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = req.staff?.role === StaffRole.ADMIN ? undefined : resolveLocationId(req);
    const reservation = await checkInGuest(req.params.id, actor, locationId);

    res.status(200).json({
      success: true,
      data: reservation.toSafeJSON(),
      message: `Guest ${reservation.guestName} successfully checked in.`,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] checkIn error:', error.message);
    const status = error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: status === 404 ? 'NotFound' : 'BadRequest',
      message: error.message,
    });
  }
}

export async function assignTableHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = req.staff?.role === StaffRole.ADMIN ? undefined : resolveLocationId(req);
    const reservation = await assignTable(req.params.id, req.body, actor, locationId);

    res.status(200).json({
      success: true,
      data: reservation.toSafeJSON(),
      message: `Table ${reservation.tableNumbers.join(', ')} assigned successfully.`,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] assignTable error:', error.message);
    const status = error.message?.includes('not found')
      ? 404
      : error.message?.includes('capacity') || error.message?.includes('committed') || error.message?.includes('simultaneously')
      ? 409
      : 400;

    res.status(status).json({
      success: false,
      error: status === 409 ? 'CapacityConflict' : status === 404 ? 'NotFound' : 'BadRequest',
      message: error.message,
    });
  }
}

export async function seatHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = req.staff?.role === StaffRole.ADMIN ? undefined : resolveLocationId(req);
    const reservation = await seatGuest(req.params.id, req.body, actor, locationId);

    res.status(200).json({
      success: true,
      data: reservation.toSafeJSON(),
      message: `Guest ${reservation.guestName} successfully seated at Table ${reservation.tableNumbers.join(', ')}.`,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] seat error:', error.message);
    const status = error.message?.includes('not found')
      ? 404
      : error.message?.includes('capacity') || error.message?.includes('conflict')
      ? 409
      : 400;

    res.status(status).json({
      success: false,
      error: status === 409 ? 'CapacityConflict' : status === 404 ? 'NotFound' : 'BadRequest',
      message: error.message,
    });
  }
}

export async function markNoShowHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = req.staff?.role === StaffRole.ADMIN ? undefined : resolveLocationId(req);
    const force = Boolean(req.body?.force && (req.staff?.role === StaffRole.ADMIN || req.staff?.role === StaffRole.MANAGER));
    const reservation = await markNoShow(req.params.id, actor, req.body?.note, force, locationId);

    res.status(200).json({
      success: true,
      data: reservation.toSafeJSON(),
      message: `Reservation ${reservation.reservationReference} marked as NO_SHOW.`,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] markNoShow error:', error.message);
    const status = error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: status === 404 ? 'NotFound' : 'BadRequest',
      message: error.message,
    });
  }
}

export async function walkInHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = extractActor(req);
    const reservation = await registerWalkIn(req.body, actor);

    res.status(201).json({
      success: true,
      data: reservation.toSafeJSON(),
      message: `Walk-in party registered successfully. Reference: ${reservation.reservationReference}.`,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] walkIn error:', error.message);
    const status = error.message?.includes('No available table capacity') ? 409 : 400;
    res.status(status).json({
      success: false,
      error: status === 409 ? 'CapacityConflict' : 'BadRequest',
      message: error.message,
    });
  }
}

export async function getTablesAvailabilityHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const tables = await getTableAvailability(locationId);

    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] getTablesAvailability error:', error.message);
    res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: error.message,
    });
  }
}

export async function getWaitingListHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locationId = resolveLocationId(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const entries = await getWaitingList(locationId, status);

    res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] getWaitingList error:', error.message);
    res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: error.message,
    });
  }
}

export async function addToWaitingListHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = extractActor(req);
    const entry = await addToWaitingList(req.body, actor);

    res.status(201).json({
      success: true,
      data: entry.toSafeJSON(),
      message: `Party "${entry.guestName}" added to waiting list.`,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] addToWaitingList error:', error.message);
    res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: error.message,
    });
  }
}

export async function updateWaitingListHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = req.staff?.role === StaffRole.ADMIN ? undefined : resolveLocationId(req);
    const entry = await updateWaitingListEntry(req.params.id, req.body, actor, locationId);

    res.status(200).json({
      success: true,
      data: entry.toSafeJSON(),
      message: 'Waiting list entry updated successfully.',
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] updateWaitingList error:', error.message);
    const status = error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: status === 404 ? 'NotFound' : 'BadRequest',
      message: error.message,
    });
  }
}

export async function seatWaitingListHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = req.staff?.role === StaffRole.ADMIN ? undefined : resolveLocationId(req);
    const result = await seatWaitingListEntry(req.params.id, req.body, actor, locationId);

    res.status(200).json({
      success: true,
      data: result,
      message: `Waiting party "${result.waitingEntry.guestName}" seated at Table ${result.reservation.tableNumbers.join(', ')}.`,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] seatWaitingList error:', error.message);
    const status = error.message?.includes('not found')
      ? 404
      : error.message?.includes('No available table capacity') || error.message?.includes('conflict')
      ? 409
      : 400;

    res.status(status).json({
      success: false,
      error: status === 409 ? 'CapacityConflict' : status === 404 ? 'NotFound' : 'BadRequest',
      message: error.message,
    });
  }
}

export async function modifyReservationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = extractActor(req);
    const locationId = req.staff?.role === StaffRole.ADMIN ? undefined : resolveLocationId(req);
    const reservation = await modifyReceptionReservation(req.params.id, req.body, actor, locationId);

    res.status(200).json({
      success: true,
      data: reservation.toSafeJSON(),
      message: `Reservation ${reservation.reservationReference} updated successfully.`,
    });
  } catch (error: any) {
    logger.warn('[ReceptionController] modifyReservation error:', error.message);
    const status = error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: status === 404 ? 'NotFound' : 'BadRequest',
      message: error.message,
    });
  }
}
