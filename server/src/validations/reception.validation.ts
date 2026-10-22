import { z } from 'zod';
import { RESERVATION_CONFIG, SeatingPreference } from '../types/reservation';
import { WaitingListStatus } from '../types/waitingList';

const VALID_LOCATION_IDS = ['loc-colombo-main', 'loc-kandy-vip'];

export const receptionReservationIdParamSchema = z.object({
  id: z.string().min(1, 'Reservation ID or reference is required'),
});

export const assignTableBodySchema = z.object({
  tableId: z.string().optional(),
  tableNumber: z.string().optional(),
});

export const seatReservationBodySchema = z.object({
  tableId: z.string().optional(),
  tableNumber: z.string().optional(),
});

export const noShowReservationBodySchema = z.object({
  note: z.string().max(300).optional(),
  force: z.boolean().optional(),
});

export const walkInBodySchema = z.object({
  locationId: z.string().refine((val) => VALID_LOCATION_IDS.includes(val), {
    message: 'Invalid restaurant location ID.',
  }),
  guestName: z.string().min(2, 'Guest name must be at least 2 characters').max(80),
  guestCount: z.coerce
    .number({ invalid_type_error: 'Guest count must be a number' })
    .int()
    .min(1, 'At least 1 guest required')
    .max(RESERVATION_CONFIG.maxPartySize, `Maximum party size is ${RESERVATION_CONFIG.maxPartySize}`),
  guestPhone: z.string().min(7, 'Contact telephone number is required'),
  guestEmail: z.string().email().optional().or(z.literal('')),
  seatingPreference: z.string().optional().default(SeatingPreference.NO_PREFERENCE),
  specialRequests: z.string().max(500).optional(),
  seatImmediately: z.boolean().optional().default(true),
  tableId: z.string().optional(),
  tableNumber: z.string().optional(),
});

export const waitingListCreateBodySchema = z.object({
  locationId: z.string().refine((val) => VALID_LOCATION_IDS.includes(val), {
    message: 'Invalid restaurant location ID.',
  }),
  guestName: z.string().min(2, 'Guest name must be at least 2 characters').max(80),
  guestCount: z.coerce
    .number({ invalid_type_error: 'Guest count must be a number' })
    .int()
    .min(1, 'At least 1 guest required')
    .max(20, 'Maximum party size is 20'),
  guestPhone: z.string().min(7, 'Contact phone is required'),
  guestEmail: z.string().email().optional().or(z.literal('')),
  seatingPreference: z.string().optional().default('No preference'),
  notes: z.string().max(300).optional(),
  estimatedWaitMinutes: z.coerce.number().int().min(1).max(180).optional().default(15),
});

export const waitingListIdParamSchema = z.object({
  id: z.string().min(1, 'Waiting list ID is required'),
});

export const waitingListUpdateBodySchema = z.object({
  status: z.nativeEnum(WaitingListStatus).optional(),
  notes: z.string().max(300).optional(),
  notifiedAt: z.string().datetime().optional(),
});

export const waitingListSeatBodySchema = z.object({
  tableId: z.string().optional(),
  tableNumber: z.string().optional(),
});

export const modifyReceptionReservationBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD').optional(),
  time: z.string().min(1).optional(),
  guestCount: z.coerce.number().int().min(1).max(RESERVATION_CONFIG.maxPartySize).optional(),
  seatingPreference: z.string().optional(),
  specialRequests: z.string().max(500).optional(),
  guestName: z.string().min(2).max(80).optional(),
  guestPhone: z.string().min(7).optional(),
});

export const checkInReservationSchema = {
  params: receptionReservationIdParamSchema,
};

export const assignTableSchema = {
  params: receptionReservationIdParamSchema,
  body: assignTableBodySchema,
};

export const seatReservationSchema = {
  params: receptionReservationIdParamSchema,
  body: seatReservationBodySchema,
};

export const noShowReservationSchema = {
  params: receptionReservationIdParamSchema,
  body: noShowReservationBodySchema,
};

export const modifyReceptionReservationSchema = {
  params: receptionReservationIdParamSchema,
  body: modifyReceptionReservationBodySchema,
};

export const walkInSchema = {
  body: walkInBodySchema,
};

export const waitingListCreateSchema = {
  body: waitingListCreateBodySchema,
};

export const waitingListUpdateSchema = {
  params: waitingListIdParamSchema,
  body: waitingListUpdateBodySchema,
};

export const waitingListSeatSchema = {
  params: waitingListIdParamSchema,
  body: waitingListSeatBodySchema,
};

