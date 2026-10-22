import { z } from 'zod';
import { OrderType, OrderStatus } from '../types/order';

export const createOrderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(50, 'Quantity cannot exceed 50 items per line'),
  selectedOptions: z.array(z.string()).optional().default([]),
  specialInstructions: z.string().max(250, 'Instructions too long').optional().default(''),
  expectedUnitPriceMinor: z.number().optional(),
  unitPriceMinor: z.number().optional(),
});

export const createOrderSchema = z.object({
  items: z
    .array(createOrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  orderType: z
    .string()
    .transform((val) => {
      const normalized = val.trim().toUpperCase().replace(/[\s-]/g, '_');
      if (normalized === 'PICKUP' || normalized === 'TAKEAWAY') return OrderType.TAKEAWAY;
      if (normalized === 'DINE_IN_PREORDER' || normalized === 'DINE_IN') return OrderType.DINE_IN_PREORDER;
      return val as OrderType;
    })
    .pipe(z.nativeEnum(OrderType)),
  locationId: z.string().default('loc-colombo-main'),
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customerEmail: z.string().email('Please enter a valid email address'),
  customerPhone: z.string().min(5, 'Phone number must be at least 5 digits').max(30),
  customerNotes: z.string().max(500, 'Notes too long').optional().default(''),
  reservationId: z.string().optional().nullable(),
  scheduledFor: z.string().optional(),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  idempotencyKey: z.string().optional().nullable(),
  expectedSubtotalMinor: z.number().optional(),
  confirmPriceChange: z.boolean().optional().default(false),
});

export const adminUpdateOrderStatusSchema = z.object({
  status: z
    .string()
    .transform((val) => {
      const normalized = val.trim().toUpperCase();
      if (normalized === 'ACCEPTED') return OrderStatus.CONFIRMED;
      return normalized as OrderStatus;
    })
    .pipe(
      z.nativeEnum(OrderStatus, {
        errorMap: () => ({ message: 'Invalid order status specified' }),
      })
    ),
  note: z.string().max(300, 'Note cannot exceed 300 characters').optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500, 'Cancellation reason too long').optional().default('Customer requested cancellation'),
});

export const adminOrdersQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  status: z.string().optional(),
  orderType: z.string().optional(),
  locationId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sort: z.string().optional().default('newest'),
});
