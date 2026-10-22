import mongoose, { Document, Schema, Model } from 'mongoose';
import { DiningSessionStatus, IDiningSessionSafeJSON } from '../types/floor';

export interface IDiningSessionDocument extends Document {
  locationId: string;
  tableIds: string[];
  tableNumbers: string[];
  reservationId?: string | null;
  reservationReference?: string | null;
  guestName: string;
  guestCount: number;
  status: DiningSessionStatus;
  seatedAt: Date;
  completedAt?: Date | null;
  completedBy?: string | null;
  assignedStaffIds: string[];
  assignedStaffNames: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IDiningSessionSafeJSON;
}

const DiningSessionSchema = new Schema<IDiningSessionDocument>(
  {
    locationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    tableIds: [{ type: String, required: true, index: true }],
    tableNumbers: [{ type: String, required: true }],
    reservationId: { type: String, default: null, index: true },
    reservationReference: { type: String, default: null, index: true },
    guestName: { type: String, required: true, trim: true },
    guestCount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(DiningSessionStatus),
      default: DiningSessionStatus.ACTIVE,
      index: true,
    },
    seatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    completedBy: { type: String, default: null },
    assignedStaffIds: [{ type: String }],
    assignedStaffNames: [{ type: String }],
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    collection: 'dining_sessions',
  }
);

DiningSessionSchema.index({ locationId: 1, status: 1, seatedAt: -1 });

DiningSessionSchema.methods.toSafeJSON = function (): IDiningSessionSafeJSON {
  return {
    id: this._id.toString(),
    locationId: this.locationId,
    tableIds: this.tableIds,
    tableNumbers: this.tableNumbers,
    reservationId: this.reservationId || null,
    reservationReference: this.reservationReference || null,
    guestName: this.guestName,
    guestCount: this.guestCount,
    status: this.status,
    seatedAt: this.seatedAt.toISOString(),
    completedAt: this.completedAt ? this.completedAt.toISOString() : null,
    completedBy: this.completedBy || null,
    assignedStaffIds: this.assignedStaffIds || [],
    assignedStaffNames: this.assignedStaffNames || [],
    notes: this.notes || undefined,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const DiningSession: Model<IDiningSessionDocument> =
  mongoose.models.DiningSession ||
  mongoose.model<IDiningSessionDocument>('DiningSession', DiningSessionSchema);
