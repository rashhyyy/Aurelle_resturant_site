import { Request, Response } from 'express';
import {
  adminQueryReservationsSchema,
  modifyReservationSchema,
  cancelReservationSchema,
} from '../validations/reservation.validation';
import * as reservationService from '../services/reservation.service';
import { StaffRole } from '../types/staff';
import { logger } from '../utils/logger';

function getStaffActor(req: Request): reservationService.ReservationActor {
  const staff = req.staff;
  return {
    id: staff?.id || 'staff-session',
    email: staff?.email || 'admin@aurelle.com',
    name: staff ? `${staff.firstName} ${staff.lastName}` : 'Administrator',
    actorType: 'STAFF',
  };
}

/**
 * GET /api/admin/reservations
 */
export async function getAdminReservations(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = adminQueryReservationsSchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const staff = req.staff;
    const requestedLocationId = parseResult.data.locationId;

    // Check staff location authorization if not ADMIN
    if (staff && staff.role !== StaffRole.ADMIN && Array.isArray(staff.locationIds) && staff.locationIds.length > 0) {
      if (requestedLocationId && !staff.locationIds.includes(requestedLocationId)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You are not authorized to view reservations for this location.',
        });
        return;
      }
    }

    const result = await reservationService.getAdminReservations(parseResult.data);

    res.status(200).json({
      success: true,
      data: {
        reservations: result.reservations,
        pagination: {
          page: parseResult.data.page,
          limit: parseResult.data.limit,
          total: result.total,
          pages: Math.ceil(result.total / parseResult.data.limit),
        },
      },
    });
  } catch (err: any) {
    logger.error('[AdminReservationController] getAdminReservations error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to query reservations directory.',
    });
  }
}

/**
 * GET /api/admin/reservations/summary
 */
export async function getAdminReservationSummary(req: Request, res: Response): Promise<void> {
  try {
    const locationId = req.query.locationId as string | undefined;
    const summary = await reservationService.getAdminReservationSummary(locationId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    logger.error('[AdminReservationController] getAdminReservationSummary error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reservation telemetry.',
    });
  }
}

/**
 * GET /api/admin/reservations/:id
 */
export async function getAdminReservationById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const reservation = await reservationService.getReservationByIdOrRef(id);

    if (!reservation) {
      res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `Reservation "${id}" was not found.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: reservation.toSafeJSON(),
    });
  } catch (err: any) {
    logger.error('[AdminReservationController] getAdminReservationById error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reservation record.',
    });
  }
}

/**
 * POST /api/admin/reservations/:id/confirm
 */
export async function adminConfirmReservation(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const actor = getStaffActor(req);

    const reservation = await reservationService.adminConfirmReservation(id, actor);

    res.status(200).json({
      success: true,
      message: 'Reservation has been confirmed successfully.',
      data: reservation.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[AdminReservationController] adminConfirmReservation error:', err.message);
    const isConflict = err.message.includes('No table capacity');
    res.status(isConflict ? 409 : 400).json({
      success: false,
      error: isConflict ? 'CapacityConflict' : 'ConfirmationError',
      message: err.message || 'Unable to confirm reservation.',
    });
  }
}

/**
 * POST /api/admin/reservations/:id/reject
 */
export async function adminRejectReservation(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const reason = req.body.reason || 'Declined by administration';
    const actor = getStaffActor(req);

    const reservation = await reservationService.adminRejectReservation(id, reason, actor);

    res.status(200).json({
      success: true,
      message: 'Reservation request has been rejected.',
      data: reservation.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[AdminReservationController] adminRejectReservation error:', err.message);
    res.status(400).json({
      success: false,
      error: 'RejectionError',
      message: err.message || 'Unable to reject reservation.',
    });
  }
}

/**
 * PATCH /api/admin/reservations/:id
 */
export async function adminModifyReservation(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = modifyReservationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const id = req.params.id;
    const actor = getStaffActor(req);

    const reservation = await reservationService.modifyCustomerReservation(
      id,
      parseResult.data,
      actor
    );

    res.status(200).json({
      success: true,
      message: 'Reservation has been modified by administrator.',
      data: reservation.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[AdminReservationController] adminModifyReservation error:', err.message);
    const isConflict = err.message.includes('No table capacity');
    res.status(isConflict ? 409 : 400).json({
      success: false,
      error: isConflict ? 'CapacityConflict' : 'ModificationError',
      message: err.message || 'Unable to modify reservation.',
    });
  }
}

/**
 * POST /api/admin/reservations/:id/cancel
 */
export async function adminCancelReservation(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = cancelReservationSchema.safeParse(req.body);
    const reason = parseResult.success && parseResult.data.reason ? parseResult.data.reason : 'Cancelled by staff';

    const id = req.params.id;
    const actor = getStaffActor(req);

    const reservation = await reservationService.cancelReservation(id, reason, actor);

    res.status(200).json({
      success: true,
      message: 'Reservation has been cancelled.',
      data: reservation.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[AdminReservationController] adminCancelReservation error:', err.message);
    res.status(400).json({
      success: false,
      error: 'CancellationError',
      message: err.message || 'Unable to cancel reservation.',
    });
  }
}
