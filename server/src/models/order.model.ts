import mongoose, { Document, Model, Schema } from 'mongoose';
import {
  OrderType,
  OrderStatus,
  PaymentStatus,
  IOrderItemSnapshot,
  IStatusHistoryEntry,
  IOrderSafeJSON,
  KitchenPriority,
} from '../types/order';

export interface IOrderDocument extends Document {
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
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  scheduledFor: Date;
  customerNotes?: string;
  cancellationReason?: string | null;
  cancelledAt?: Date | null;
  confirmedAt?: Date | null;
  preparingAt?: Date | null;
  readyAt?: Date | null;
  completedAt?: Date | null;
  kitchenAcceptedAt?: Date | null;
  kitchenAcceptedBy?: string | null;
  kitchenAcceptedByName?: string | null;
  preparationStartedAt?: Date | null;
  preparationStartedBy?: string | null;
  readyBy?: string | null;
  idempotencyKey?: string | null;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IOrderSafeJSON;
}

const OrderItemSnapshotSchema = new Schema<IOrderItemSnapshot>(
  {
    menuItemId: {
      type: String,
      required: true,
    },
    dishName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPriceMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotalMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    selectedOptions: {
      type: [String],
      default: [],
    },
    specialInstructions: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const StatusHistoryEntrySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: String,
      default: null,
    },
    actorType: {
      type: String,
      enum: ['CUSTOMER', 'STAFF', 'SYSTEM'],
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: String,
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer contact number is required'],
      trim: true,
    },
    locationId: {
      type: String,
      required: true,
      default: 'loc-colombo-main',
      index: true,
    },
    orderType: {
      type: String,
      enum: Object.values(OrderType),
      required: true,
      default: OrderType.TAKEAWAY,
      index: true,
    },
    reservationId: {
      type: String,
      default: null,
      index: true,
    },
    items: {
      type: [OrderItemSnapshotSchema],
      required: true,
      validate: [
        (v: IOrderItemSnapshot[]) => Array.isArray(v) && v.length > 0,
        'Order must contain at least one item',
      ],
    },
    subtotalMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    discountMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceChargeMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    totalMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'LKR',
      uppercase: true,
    },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.RECEIVED,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
      index: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    customerNotes: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    preparingAt: {
      type: Date,
      default: null,
    },
    readyAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    kitchenAcceptedAt: {
      type: Date,
      default: null,
    },
    kitchenAcceptedBy: {
      type: String,
      default: null,
    },
    kitchenAcceptedByName: {
      type: String,
      default: null,
    },
    preparationStartedAt: {
      type: Date,
      default: null,
    },
    preparationStartedBy: {
      type: String,
      default: null,
    },
    readyBy: {
      type: String,
      default: null,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    statusHistory: {
      type: [StatusHistoryEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for operations and filtering
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ locationId: 1, orderStatus: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1, orderStatus: 1 });
OrderSchema.index({ scheduledFor: 1, locationId: 1 });
OrderSchema.index({ customerName: 'text', customerEmail: 'text', orderReference: 'text' });

// Safe JSON formatting helper
OrderSchema.methods.toSafeJSON = function (): IOrderSafeJSON {
  const formatMinor = (minor: number) => {
    const major = Math.round(minor / 100);
    return `${this.currency} ${major.toLocaleString('en-US')}`;
  };

  const now = Date.now();
  let priority = KitchenPriority.NORMAL;
  if (this.orderStatus === OrderStatus.CONFIRMED || this.orderStatus === OrderStatus.RECEIVED) {
    const scheduledMs = new Date(this.scheduledFor).getTime();
    const minutesToHandoff = (scheduledMs - now) / 60000;
    if (minutesToHandoff < 10) {
      priority = KitchenPriority.URGENT;
    } else if (minutesToHandoff < 20) {
      priority = KitchenPriority.ATTENTION_REQUIRED;
    }
  } else if (this.orderStatus === OrderStatus.PREPARING) {
    const prepStart = this.preparationStartedAt || this.preparingAt || this.updatedAt;
    const minutesInPrep = (now - new Date(prepStart).getTime()) / 60000;
    const scheduledMs = new Date(this.scheduledFor).getTime();
    const minutesToHandoff = (scheduledMs - now) / 60000;

    if (minutesInPrep > 20 || minutesToHandoff < 10) {
      priority = KitchenPriority.URGENT;
    } else if (minutesInPrep > 12 || minutesToHandoff < 20) {
      priority = KitchenPriority.ATTENTION_REQUIRED;
    }
  }

  return {
    id: this._id.toString(),
    orderId: this._id.toString(),
    orderReference: this.orderReference,
    customerId: this.customerId ? this.customerId.toString() : null,
    customerName: this.customerName,
    customerEmail: this.customerEmail,
    customerPhone: this.customerPhone,
    locationId: this.locationId,
    orderType: this.orderType as OrderType,
    reservationId: this.reservationId ? this.reservationId.toString() : null,
    items: this.items,
    subtotalMinor: this.subtotalMinor,
    discountMinor: this.discountMinor,
    taxMinor: this.taxMinor,
    serviceChargeMinor: this.serviceChargeMinor,
    totalMinor: this.totalMinor,
    currency: this.currency,
    formattedSubtotal: formatMinor(this.subtotalMinor),
    formattedTax: formatMinor(this.taxMinor),
    formattedServiceCharge: formatMinor(this.serviceChargeMinor),
    formattedTotal: formatMinor(this.totalMinor),
    orderStatus: this.orderStatus as OrderStatus,
    paymentStatus: this.paymentStatus as PaymentStatus,
    scheduledFor: this.scheduledFor.toISOString(),
    customerNotes: this.customerNotes || '',
    cancellationReason: this.cancellationReason,
    cancelledAt: this.cancelledAt ? this.cancelledAt.toISOString() : null,
    confirmedAt: this.confirmedAt ? this.confirmedAt.toISOString() : null,
    preparingAt: this.preparingAt ? this.preparingAt.toISOString() : null,
    readyAt: this.readyAt ? this.readyAt.toISOString() : null,
    completedAt: this.completedAt ? this.completedAt.toISOString() : null,
    kitchenAcceptedAt: this.kitchenAcceptedAt ? this.kitchenAcceptedAt.toISOString() : null,
    kitchenAcceptedBy: this.kitchenAcceptedBy || null,
    kitchenAcceptedByName: this.kitchenAcceptedByName || null,
    preparationStartedAt: this.preparationStartedAt ? this.preparationStartedAt.toISOString() : null,
    preparationStartedBy: this.preparationStartedBy || null,
    readyBy: this.readyBy || null,
    priority,
    statusHistory: this.statusHistory,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);
