/**
 * Aurelle Restaurant Management Platform
 * Client Order Subsystem Types (Stage 7)
 */

export enum OrderType {
  TAKEAWAY = 'TAKEAWAY',
  DINE_IN_PREORDER = 'DINE_IN_PREORDER',
}

export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export interface ClientOrderItem {
  menuItemId: string;
  dishName: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  selectedOptions?: string[];
  specialInstructions?: string;
  image?: string;
}

export interface ClientStatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  changedBy?: string;
  actorType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
  note?: string;
}

export enum KitchenPriority {
  NORMAL = 'NORMAL',
  ATTENTION_REQUIRED = 'ATTENTION_REQUIRED',
  URGENT = 'URGENT',
}

export interface KitchenSummaryMetrics {
  newOrders: number;
  preparing: number;
  ready: number;
  scheduled: number;
}

export interface ClientOrder {
  id: string;
  orderId?: string;
  orderReference: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locationId: string;
  orderType: OrderType;
  reservationId?: string | null;
  items: ClientOrderItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  serviceChargeMinor: number;
  totalMinor: number;
  currency: string;
  formattedSubtotal: string;
  formattedTax: string;
  formattedServiceCharge: string;
  formattedTotal: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  scheduledFor: string;
  customerNotes?: string;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  confirmedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  kitchenAcceptedAt?: string | null;
  kitchenAcceptedBy?: string | null;
  kitchenAcceptedByName?: string | null;
  preparationStartedAt?: string | null;
  preparationStartedBy?: string | null;
  readyBy?: string | null;
  priority?: KitchenPriority;
  statusHistory: ClientStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummaryMetrics {
  todayOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayRevenueMinor: number;
  formattedTodayRevenue: string;
}
