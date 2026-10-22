import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  ServiceRequestType,
  ServiceRequestPriority,
  ServiceRequestStatus,
  IServiceRequestSafeJSON,
} from '../types/floor';

export interface IServiceRequestDocument extends Document {
  locationId: string;
  tableId: string;
  tableNumber: string;
  diningSessionId?: string | null;
  requestType: ServiceRequestType;
  description: string;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdBy: string;
  acknowledgedAt?: Date | null;
  acknowledgedBy?: string | null;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IServiceRequestSafeJSON;
}

const ServiceRequestSchema = new Schema<IServiceRequestDocument>(
  {
    locationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    tableId: {
      type: String,
      required: true,
      index: true,
    },
    tableNumber: {
      type: String,
      required: true,
    },
    diningSessionId: {
      type: String,
      default: null,
      index: true,
    },
    requestType: {
      type: String,
      enum: Object.values(ServiceRequestType),
      default: ServiceRequestType.OTHER,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(ServiceRequestPriority),
      default: ServiceRequestPriority.NORMAL,
    },
    status: {
      type: String,
      enum: Object.values(ServiceRequestStatus),
      default: ServiceRequestStatus.OPEN,
      index: true,
    },
    assignedStaffId: {
      type: String,
      default: null,
    },
    assignedStaffName: {
      type: String,
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
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
    collection: 'service_requests',
  }
);

ServiceRequestSchema.index({ locationId: 1, status: 1, createdAt: -1 });

ServiceRequestSchema.methods.toSafeJSON = function (): IServiceRequestSafeJSON {
  return {
    id: this._id.toString(),
    locationId: this.locationId,
    tableId: this.tableId,
    tableNumber: this.tableNumber,
    diningSessionId: this.diningSessionId || null,
    requestType: this.requestType,
    description: this.description,
    priority: this.priority,
    status: this.status,
    assignedStaffId: this.assignedStaffId || null,
    assignedStaffName: this.assignedStaffName || null,
    createdBy: this.createdBy,
    acknowledgedAt: this.acknowledgedAt ? this.acknowledgedAt.toISOString() : null,
    acknowledgedBy: this.acknowledgedBy || null,
    resolvedAt: this.resolvedAt ? this.resolvedAt.toISOString() : null,
    resolvedBy: this.resolvedBy || null,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const ServiceRequest: Model<IServiceRequestDocument> =
  mongoose.models.ServiceRequest ||
  mongoose.model<IServiceRequestDocument>('ServiceRequest', ServiceRequestSchema);
