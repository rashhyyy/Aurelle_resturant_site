/**
 * Aurelle Restaurant Management Platform
 * Order Subsystem Types and Financial Configurations (Stage 7)
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

/**
 * State Transition Matrix for Order Lifecycle
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.RECEIVED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Authoritative Restaurant Financial & Scheduling Configuration
 */
export const ORDER_CONFIG = {
  currency: 'LKR',
  serviceChargeRate: 0.10, // 10% standard luxury service charge
  taxRate: 0.025,          // 2.5% statutory dining tax
  minLeadMinutes: 30,      // Minimum preparation time
  maxAdvanceDays: 7,       // Maximum days in advance
  operatingHours: {
    startHour: 11, // 11:00 AM
    endHour: 23,   // 11:00 PM
  },
  defaultLocationId: 'loc-colombo-main',
};

export interface IOrderItemSnapshot {
  menuItemId: string;
  dishName: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  selectedOptions?: string[];
  specialInstructions?: string;
  image?: string;
}

export interface IStatusHistoryEntry {
  status: OrderStatus;
  changedAt: Date;
  changedBy?: string;
  actorType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
  note?: string;
}

export enum KitchenPriority {
  NORMAL = 'NORMAL',
  ATTENTION_REQUIRED = 'ATTENTION_REQUIRED',
  URGENT = 'URGENT',
}

export interface IOrderSafeJSON {
  id: string;
  orderId: string;
  orderReference: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locationId: string;
  orderType: OrderType;
  reservationId?: string | null;
  items: IOrderItemSnapshot[];
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
  statusHistory: IStatusHistoryEntry[];
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

export interface KitchenSummaryMetrics {
  newOrders: number;
  preparing: number;
  ready: number;
  scheduled: number;
}
