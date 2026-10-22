import { z } from 'zod';
import { RESERVATION_CONFIG, SeatingPreference } from '../types/reservation';

export const checkAvailabilitySchema = z.object({
  locationId: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Reservation date must be in YYYY-MM-DD format'),
  guestCount: z.coerce
    .number()
    .int()
    .min(1, 'Minimum guest count is 1')
    .max(RESERVATION_CONFIG.maxPartySize, `Maximum guest count is ${RESERVATION_CONFIG.maxPartySize}`),
  seatingPreference: z.string().optional(),
});

export const createReservationSchema = z.object({
  locationId: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Reservation date must be in YYYY-MM-DD format'),
  time: z.string().min(1, 'Reservation time slot is required'),
  guestCount: z.coerce
    .number()
    .int()
    .min(1, 'Minimum guest count is 1')
    .max(RESERVATION_CONFIG.maxPartySize, `Maximum guest count is ${RESERVATION_CONFIG.maxPartySize}`),
  guestName: z.string().trim().min(2, 'Guest full name must be at least 2 characters'),
  guestEmail: z.string().trim().email('A valid email address is required'),
  guestPhone: z.string().trim().min(7, 'A valid contact telephone number is required'),
  seatingPreference: z.string().optional(),
  specialRequests: z.string().max(500).optional(),
  occasion: z.string().max(100).optional(),
  idempotencyKey: z.string().optional(),
});

export const modifyReservationSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Reservation date must be in YYYY-MM-DD format')
    .optional(),
  time: z.string().optional(),
  guestCount: z.coerce
    .number()
    .int()
    .min(1)
    .max(RESERVATION_CONFIG.maxPartySize)
    .optional(),
  seatingPreference: z.string().optional(),
  specialRequests: z.string().max(500).optional(),
  occasion: z.string().max(100).optional(),
});

export const cancelReservationSchema = z.object({
  reason: z.string().max(300).optional(),
});

export const adminQueryReservationsSchema = z.object({
  locationId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  date: z.string().optional(),
  guestCount: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['startAt', 'createdAt', 'guestCount']).default('startAt'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
