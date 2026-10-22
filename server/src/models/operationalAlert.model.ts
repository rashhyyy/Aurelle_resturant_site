import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  AlertType,
  AlertSourceType,
  AlertSeverity,
  AlertStatus,
  IOperationalAlertSafeJSON,
} from '../types/manager';

export interface IOperationalAlertDocument extends Document {
  locationId: string;
  alertType: AlertType;
  sourceType: AlertSourceType;
  sourceId: string;
  sourceReference?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  metadata?: Record<string, any>;
  acknowledgedAt?: Date | null;
  acknowledgedBy?: {
    id: string;
    name: string;
  } | null;
  resolvedAt?: Date | null;
  resolvedBy?: {
    id: string;
    name: string;
  } | null;
  resolutionNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IOperationalAlertSafeJSON;
}

const OperationalAlertSchema = new Schema<IOperationalAlertDocument>(
  {
    locationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    alertType: {
      type: String,
      enum: Object.values(AlertType),
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: Object.values(AlertSourceType),
      required: true,
      index: true,
    },
    sourceId: {
      type: String,
      required: true,
      index: true,
    },
    sourceReference: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      default: AlertSeverity.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AlertStatus),
      default: AlertStatus.OPEN,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      id: { type: String, default: null },
      name: { type: String, default: null },
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      id: { type: String, default: null },
      name: { type: String, default: null },
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'operational_alerts',
  }
);

// Indexes for querying operational alerts efficiently and deduplicating open alerts
OperationalAlertSchema.index({ locationId: 1, status: 1, createdAt: -1 });
OperationalAlertSchema.index({ locationId: 1, severity: 1, status: 1 });
OperationalAlertSchema.index({ locationId: 1, alertType: 1, sourceId: 1, status: 1 });

OperationalAlertSchema.methods.toSafeJSON = function (): IOperationalAlertSafeJSON {
  return {
    id: this._id.toString(),
    locationId: this.locationId,
    alertType: this.alertType,
    sourceType: this.sourceType,
    sourceId: this.sourceId,
    sourceReference: this.sourceReference,
    severity: this.severity,
    status: this.status,
    message: this.message,
    metadata: this.metadata || {},
    acknowledgedAt: this.acknowledgedAt ? this.acknowledgedAt.toISOString() : null,
    acknowledgedBy: this.acknowledgedBy?.id ? this.acknowledgedBy : null,
    resolvedAt: this.resolvedAt ? this.resolvedAt.toISOString() : null,
    resolvedBy: this.resolvedBy?.id ? this.resolvedBy : null,
    resolutionNotes: this.resolutionNotes || null,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const OperationalAlert: Model<IOperationalAlertDocument> =
  mongoose.models.OperationalAlert ||
  mongoose.model<IOperationalAlertDocument>('OperationalAlert', OperationalAlertSchema);
