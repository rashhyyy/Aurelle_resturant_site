import { z } from 'zod';
import { OrderType, KitchenPriority } from '../types/order';

export const KitchenQuerySchema = z.object({
  status: z.enum(['all', 'new', 'preparing', 'ready', 'scheduled']).optional().default('all'),
  orderType: z.enum(['ALL', ...Object.values(OrderType)] as [string, ...string[]]).optional().default('ALL'),
  priority: z.enum(['ALL', ...Object.values(KitchenPriority)] as [string, ...string[]]).optional().default('ALL'),
  search: z.string().optional(),
  sortBy: z.enum(['scheduledFor', 'createdAt', 'priority']).optional().default('scheduledFor'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  locationId: z.string().optional(),
});

export const KitchenHistoryQuerySchema = z.object({
  search: z.string().optional(),
  orderType: z.enum(['ALL', ...Object.values(OrderType)] as [string, ...string[]]).optional().default('ALL'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  locationId: z.string().optional(),
});

export const KitchenActionParamsSchema = z.object({
  id: z.string().min(1, 'Order ID or Reference is required'),
});

export const KitchenActionBodySchema = z.object({
  note: z.string().max(300).optional(),
});
