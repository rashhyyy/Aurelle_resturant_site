import mongoose, { Document, Schema, Model } from 'mongoose';
import { StaffAuditAction } from '../types/staff';

export interface IStaffAuditLog extends Document {
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetStaffId: string;
  targetStaffName: string;
  targetStaffEmail: string;
  action: StaffAuditAction;
  details: string;
  metadata?: Record<string, any>;
  locationId?: string;
  ipAddress?: string;
  createdAt: Date;
}

const StaffAuditLogSchema = new Schema<IStaffAuditLog>(
  {
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    actorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    targetStaffId: {
      type: String,
      required: true,
      index: true,
    },
    targetStaffName: {
      type: String,
      required: true,
      trim: true,
    },
    targetStaffEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    locationId: {
      type: String,
      default: null,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only audit log
  }
);

StaffAuditLogSchema.index({ targetStaffId: 1, createdAt: -1 });
StaffAuditLogSchema.index({ action: 1, createdAt: -1 });

export const StaffAuditLog: Model<IStaffAuditLog> =
  mongoose.models.StaffAuditLog ||
  mongoose.model<IStaffAuditLog>('StaffAuditLog', StaffAuditLogSchema);
