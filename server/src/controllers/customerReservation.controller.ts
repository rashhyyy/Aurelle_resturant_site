import { Request, Response } from 'express';
import {
  checkAvailabilitySchema,
  createReservationSchema,
  modifyReservationSchema,
  cancelReservationSchema,
} from '../validations/reservation.validation';
import * as availabilityService from '../services/availability.service';
import * as reservationService from '../services/reservation.service';
import { logger } from '../utils/logger';

function getCustomerActor(
  req: Request,
  guestEmail?: string,
  guestName?: string
): reservationService.ReservationActor {
  if (req.session && req.session.user) {
    return {
      id: req.session.user.id,
      email: req.session.user.email,
      name: req.session.user.username,
      actorType: 'CUSTOMER',
    };
  }

  return {
    email: guestEmail,
    name: guestName,
    actorType: 'CUSTOMER',
  };
}

/**
 * GET /api/reservations/availability
 */
export async function getAvailability(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = checkAvailabilitySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await availabilityService.getLiveAvailability(parseResult.data);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    logger.warn('[CustomerReservationController] getAvailability error:', err.message);
    res.status(400).json({
      success: false,
      error: 'AvailabilityError',
      message: err.message || 'Unable to retrieve table availability.',
    });
  }
}

/**
 * POST /api/reservations
 */
export async function createReservation(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createReservationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'ValidationError',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const data = parseResult.data;
    const actor = getCustomerActor(req, data.guestEmail, data.guestName);

    const reservation = await reservationService.createReservation(data, actor);

    res.status(201).json({
      success: true,
      message:
        reservation.status === 'CONFIRMED'
          ? 'Your table reservation has been confirmed.'
          : 'Your reservation request has been received and is pending confirmation.',
      data: reservation.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[CustomerReservationController] createReservation error:', err.message);
    const statusCode = err.message.includes('No table capacity is available') ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 409 ? 'CapacityConflict' : 'ReservationError',
      message: err.message || 'Unable to complete reservation.',
    });
  }
}

/**
 * GET /api/reservations/my
 */
export async function getMyReservations(req: Request, res: Response): Promise<void> {
  try {
    if (!req.session || !req.session.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Please sign in to view your reservation history.',
      });
      return;
    }

    const { status, timeFilter, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const result = await reservationService.getCustomerReservations({
      userId: req.session.user.id,
      email: req.session.user.email,
      status,
      timeFilter: timeFilter as any,
      page: pageNum,
      limit: limitNum,
    });

    res.status(200).json({
      success: true,
      data: {
        reservations: result.reservations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum),
        },
      },
    });
  } catch (err: any) {
    logger.error('[CustomerReservationController] getMyReservations error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reservation history.',
    });
  }
}

/**
 * GET /api/reservations/my/:id
 */
export async function getMyReservationById(req: Request, res: Response): Promise<void> {
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

    // Verify ownership
    if (req.session && req.session.user) {
      const isOwner =
        reservation.customerId === req.session.user.id ||
        reservation.guestEmail.toLowerCase() === req.session.user.email.toLowerCase();

      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You are not authorized to view this reservation.',
        });
        return;
      }
    } else {
      // Guest verification by query parameter email if guest
      const verifyEmail = (req.query.email as string)?.toLowerCase();
      if (!verifyEmail || verifyEmail !== reservation.guestEmail.toLowerCase()) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied. Valid reservation email required.',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: reservation.toSafeJSON(),
    });
  } catch (err: any) {
    logger.error('[CustomerReservationController] getMyReservationById error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reservation details.',
    });
  }
}

/**
 * PATCH /api/reservations/my/:id
 */
export async function modifyMyReservation(req: Request, res: Response): Promise<void> {
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
    const actor = getCustomerActor(req, (req.body.email as string) || req.session?.user?.email);

    if (req.session && req.session.user) {
      actor.id = req.session.user.id;
    }

    const reservation = await reservationService.modifyCustomerReservation(
      id,
      parseResult.data,
      actor
    );

    res.status(200).json({
      success: true,
      message: 'Your reservation has been successfully updated.',
      data: reservation.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[CustomerReservationController] modifyMyReservation error:', err.message);
    const isConflict = err.message.includes('No table capacity');
    const isForbidden = err.message.includes('not authorized');
    const status = isConflict ? 409 : isForbidden ? 403 : 400;

    res.status(status).json({
      success: false,
      error: isConflict ? 'CapacityConflict' : isForbidden ? 'Forbidden' : 'ModificationError',
      message: err.message || 'Unable to modify reservation.',
    });
  }
}

/**
 * POST /api/reservations/my/:id/cancel
 */
export async function cancelMyReservation(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = cancelReservationSchema.safeParse(req.body);
    const reason = parseResult.success && parseResult.data.reason ? parseResult.data.reason : 'Guest cancelled online';

    const id = req.params.id;
    const actor = getCustomerActor(req, (req.body.email as string) || req.session?.user?.email);

    if (req.session && req.session.user) {
      actor.id = req.session.user.id;
    }

    const reservation = await reservationService.cancelReservation(id, reason, actor);

    res.status(200).json({
      success: true,
      message: 'Your reservation has been cancelled.',
      data: reservation.toSafeJSON(),
    });
  } catch (err: any) {
    logger.warn('[CustomerReservationController] cancelMyReservation error:', err.message);
    const isForbidden = err.message.includes('not authorized');
    const status = isForbidden ? 403 : 400;

    res.status(status).json({
      success: false,
      error: isForbidden ? 'Forbidden' : 'CancellationError',
      message: err.message || 'Unable to cancel reservation.',
    });
  }
}
