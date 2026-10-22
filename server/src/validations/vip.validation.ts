import { z } from 'zod';
import { VIPBookingStatus, EventInquiryStatus, EventProposalStatus } from '../types/vip';

export const vipRoomBaseSchema = z.object({
  locationId: z.string().min(1, 'Restaurant location is required'),
  name: z.string().min(2, 'Room name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  tag: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  capacityMin: z.number().int().min(1, 'Minimum capacity must be at least 1'),
  capacityMax: z.number().int().min(1, 'Maximum capacity must be at least 1'),
  squareMeters: z.string().optional(),
  images: z.array(z.string()).default([]),
  amenities: z
    .array(
      z.object({
        label: z.string().min(1),
        detail: z.string().min(1),
      })
    )
    .default([]),
  features: z.array(z.string()).default([]),
  categories: z.array(z.string()).default(['All spaces']),
  basePriceMinor: z.number().int().min(0, 'Base price cannot be negative'),
  currency: z.string().default('LKR'),
  minimumSpendMinor: z.number().int().min(0, 'Minimum spend cannot be negative'),
  bookingDurationMinutes: z.number().int().min(30, 'Duration must be at least 30 minutes').default(180),
  bufferMinutes: z.number().int().min(0).default(60),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const createVIPRoomSchema = vipRoomBaseSchema.refine((data) => data.capacityMax >= data.capacityMin, {
  message: 'Maximum capacity must be greater than or equal to minimum capacity',
  path: ['capacityMax'],
});

export const updateVIPRoomSchema = vipRoomBaseSchema.partial();

export const checkRoomAvailabilitySchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  roomId: z.string().min(1, 'Room ID or slug is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be formatted as HH:mm (24h)').optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(30).optional(),
  guestCount: z.coerce.number().int().min(1).optional(),
}).refine((data) => (data.date) || data.startAt, {
  message: 'Either date or startAt must be provided',
});

export const createVIPBookingSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  roomId: z.string().min(1, 'Room ID or slug is required'),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be formatted as HH:mm (24h)').optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  packageId: z.string().optional().nullable(),
  guestName: z.string().min(2, 'Guest name must be at least 2 characters'),
  guestEmail: z.string().email('Invalid email address'),
  guestPhone: z.string().min(6, 'Valid telephone contact required'),
  specialRequests: z.string().optional(),
  occasion: z.string().optional(),
}).refine((data) => (data.date && data.time) || data.startAt, {
  message: 'Either (date and time) or startAt must be provided',
});

export const modifyVIPBookingSchema = z.object({
  guestCount: z.number().int().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  specialRequests: z.string().optional(),
  packageId: z.string().optional().nullable(),
});

export const cancelVIPBookingSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters'),
});

export const createEventInquirySchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  eventType: z.string().min(2, 'Event type is required'),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  guestCount: z.coerce.number().int().min(1, 'Guest count must be at least 1'),
  preferredRoomId: z.string().optional().nullable(),
  requirements: z.string().min(5, 'Event requirements must be specified'),
  budgetMinor: z.coerce.number().int().min(0).optional().nullable(),
  currency: z.string().default('LKR'),
  guestName: z.string().min(2, 'Guest name is required'),
  guestEmail: z.string().email('Valid email is required'),
  guestPhone: z.string().min(6, 'Valid phone number is required'),
});

export const createEventProposalSchema = z.object({
  inquiryId: z.string().min(1, 'Inquiry ID is required'),
  roomId: z.string().min(1, 'VIP Room is required'),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  guestCount: z.number().int().min(1),
  packageId: z.string().optional().nullable(),
  servicesSnapshot: z.array(z.string()).default([]),
  subtotalMinor: z.number().int().min(0),
  taxMinor: z.number().int().min(0).default(0),
  totalMinor: z.number().int().min(0),
  currency: z.string().default('LKR'),
  terms: z.string().min(5, 'Terms and conditions required'),
  expiresAt: z.string().datetime(),
});

export const createPrivateDiningPackageSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  roomId: z.string().optional().nullable(),
  name: z.string().min(2, 'Package name is required'),
  description: z.string().min(10, 'Package description is required'),
  includedServices: z.array(z.string()).default([]),
  includedMenuItems: z.array(z.string()).default([]),
  priceMinor: z.number().int().min(0, 'Price cannot be negative'),
  currency: z.string().default('LKR'),
  minimumGuests: z.number().int().min(1).default(1),
  maximumGuests: z.number().int().min(1).default(50),
  isPublished: z.boolean().default(true),
});
