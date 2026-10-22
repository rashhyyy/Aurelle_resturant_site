import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  CleaningTaskStatus,
  ServiceRequestPriority,
  ICleaningTaskSafeJSON,
} from '../types/floor';

export interface ICleaningTaskDocument extends Document {
  locationId: string;
  tableId: string;
  tableNumber: string;
  priority: ServiceRequestPriority;
  status: CleaningTaskStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  notes?: string;
  startedAt?: Date | null;
  startedBy?: string | null;
  completedAt?: Date | null;
  completedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): ICleaningTaskSafeJSON;
}

const CleaningTaskSchema = new Schema<ICleaningTaskDocument>(
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
    priority: {
      type: String,
      enum: Object.values(ServiceRequestPriority),
      default: ServiceRequestPriority.NORMAL,
    },
    status: {
      type: String,
      enum: Object.values(CleaningTaskStatus),
      default: CleaningTaskStatus.PENDING,
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
    notes: {
      type: String,
      trim: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    startedBy: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'cleaning_tasks',
  }
);

CleaningTaskSchema.index({ locationId: 1, status: 1, createdAt: -1 });

CleaningTaskSchema.methods.toSafeJSON = function (): ICleaningTaskSafeJSON {
  return {
    id: this._id.toString(),
    locationId: this.locationId,
    tableId: this.tableId,
    tableNumber: this.tableNumber,
    priority: this.priority,
    status: this.status,
    assignedStaffId: this.assignedStaffId || null,
    assignedStaffName: this.assignedStaffName || null,
    notes: this.notes || undefined,
    startedAt: this.startedAt ? this.startedAt.toISOString() : null,
    startedBy: this.startedBy || null,
    completedAt: this.completedAt ? this.completedAt.toISOString() : null,
    completedBy: this.completedBy || null,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const CleaningTask: Model<ICleaningTaskDocument> =
  mongoose.models.CleaningTask ||
  mongoose.model<ICleaningTaskDocument>('CleaningTask', CleaningTaskSchema);
