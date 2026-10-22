import mongoose, { Document, Schema, Model } from 'mongoose';
import { KitchenAlertStatus, IKitchenAlertSafeJSON } from '../types/floor';

export interface IKitchenAlertDocument extends Document {
  locationId: string;
  orderId: string;
  orderReference: string;
  tableId?: string | null;
  tableNumber?: string | null;
  diningSessionId?: string | null;
  itemsSummary: string;
  status: KitchenAlertStatus;
  acknowledgedAt?: Date | null;
  acknowledgedBy?: string | null;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IKitchenAlertSafeJSON;
}

const KitchenAlertSchema = new Schema<IKitchenAlertDocument>(
  {
    locationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    orderReference: {
      type: String,
      required: true,
      index: true,
    },
    tableId: {
      type: String,
      default: null,
      index: true,
    },
    tableNumber: {
      type: String,
      default: null,
    },
    diningSessionId: {
      type: String,
      default: null,
      index: true,
    },
    itemsSummary: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(KitchenAlertStatus),
      default: KitchenAlertStatus.NEW,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'kitchen_alerts',
  }
);

KitchenAlertSchema.index({ locationId: 1, status: 1, createdAt: -1 });

KitchenAlertSchema.methods.toSafeJSON = function (): IKitchenAlertSafeJSON {
  return {
    id: this._id.toString(),
    locationId: this.locationId,
    orderId: this.orderId,
    orderReference: this.orderReference,
    tableId: this.tableId || null,
    tableNumber: this.tableNumber || null,
    diningSessionId: this.diningSessionId || null,
    itemsSummary: this.itemsSummary,
    status: this.status,
    acknowledgedAt: this.acknowledgedAt ? this.acknowledgedAt.toISOString() : null,
    acknowledgedBy: this.acknowledgedBy || null,
    resolvedAt: this.resolvedAt ? this.resolvedAt.toISOString() : null,
    resolvedBy: this.resolvedBy || null,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const KitchenAlert: Model<IKitchenAlertDocument> =
  mongoose.models.KitchenAlert ||
  mongoose.model<IKitchenAlertDocument>('KitchenAlert', KitchenAlertSchema);
