import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  ReservationStatus,
  ReservationSource,
  SeatingPreference,
  RESERVATION_CONFIG,
  IReservationStatusHistory,
  IReservationSafeJSON,
} from '../types/reservation';
import { getLocationName } from '../config/locations';

export interface IReservationDocument extends Document {
  reservationReference: string;
  customerId?: string | null;
  locationId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  reservationDate: Date;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  timezone: string;
  status: ReservationStatus;
  tableIds: mongoose.Types.ObjectId[];
  tableNumbers: string[];
  seatingPreference: string;
  specialRequests?: string;
  occasion?: string;
  source: ReservationSource;
  idempotencyKey?: string | null;
  confirmedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  checkedInAt?: Date | null;
  checkedInBy?: string | null;
  seatedAt?: Date | null;
  seatedBy?: string | null;
  completedAt?: Date | null;
  statusHistory: IReservationStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IReservationSafeJSON;
}

const ReservationStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(ReservationStatus),
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    actorType: {
      type: String,
      enum: ['CUSTOMER', 'STAFF', 'SYSTEM'],
      required: true,
    },
    actorId: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const ReservationSchema = new Schema<IReservationDocument>(
  {
    reservationReference: {
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
    locationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    guestEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    guestPhone: {
      type: String,
      required: true,
      trim: true,
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
      max: RESERVATION_CONFIG.maxPartySize,
    },
    reservationDate: {
      type: Date,
      required: true,
      index: true,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: RESERVATION_CONFIG.defaultDurationMinutes,
    },
    timezone: {
      type: String,
      default: RESERVATION_CONFIG.timezone,
    },
    status: {
      type: String,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.CONFIRMED,
      index: true,
    },
    tableIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Table',
      },
    ],
    tableNumbers: {
      type: [String],
      default: [],
    },
    seatingPreference: {
      type: String,
      default: SeatingPreference.NO_PREFERENCE,
    },
    specialRequests: {
      type: String,
      default: '',
      trim: true,
    },
    occasion: {
      type: String,
      default: 'No occasion',
      trim: true,
    },
    source: {
      type: String,
      enum: Object.values(ReservationSource),
      default: ReservationSource.ONLINE_CUSTOMER,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: String,
      default: null,
    },
    seatedAt: {
      type: Date,
      default: null,
    },
    seatedBy: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [ReservationStatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'reservations',
  }
);

// Compound Indexes for queries & availability checks
ReservationSchema.index({ locationId: 1, reservationDate: 1, status: 1 });
ReservationSchema.index({ locationId: 1, startAt: 1, endAt: 1, status: 1 });
ReservationSchema.index({ guestEmail: 1, startAt: -1 });

ReservationSchema.methods.toSafeJSON = function (): IReservationSafeJSON {
  const now = new Date();
  const startTime = new Date(this.startAt);
  const cutoffTime = new Date(startTime.getTime() - RESERVATION_CONFIG.cancellationCutoffHours * 60 * 60 * 1000);

  const isEligibleStatus =
    this.status === ReservationStatus.PENDING || this.status === ReservationStatus.CONFIRMED;

  const canModify = isEligibleStatus && now < cutoffTime;
  const canCancel = isEligibleStatus && now < cutoffTime;

  // Format 12-hour time in Colombo timezone
  const reservationTime = startTime.toLocaleTimeString('en-US', {
    timeZone: this.timezone || RESERVATION_CONFIG.timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const reservationDateFormatted = startTime.toISOString().split('T')[0];

  return {
    id: this._id.toString(),
    reservationId: this._id.toString(),
    reservationReference: this.reservationReference,
    customerId: this.customerId || null,
    locationId: this.locationId,
    locationName: getLocationName(this.locationId),
    guestName: this.guestName,
    guestEmail: this.guestEmail,
    guestPhone: this.guestPhone,
    guestCount: this.guestCount,
    reservationDate: reservationDateFormatted,
    reservationTime,
    startAt: this.startAt.toISOString(),
    endAt: this.endAt.toISOString(),
    durationMinutes: this.durationMinutes,
    timezone: this.timezone || RESERVATION_CONFIG.timezone,
    status: this.status,
    tableIds: this.tableIds.map((t: any) => t.toString()),
    tableNumbers: this.tableNumbers || [],
    seatingPreference: this.seatingPreference,
    specialRequests: this.specialRequests || '',
    occasion: this.occasion || 'No occasion',
    source: this.source,
    canModify,
    canCancel,
    confirmedAt: this.confirmedAt ? this.confirmedAt.toISOString() : null,
    checkedInAt: this.checkedInAt ? this.checkedInAt.toISOString() : null,
    checkedInBy: this.checkedInBy || null,
    seatedAt: this.seatedAt ? this.seatedAt.toISOString() : null,
    seatedBy: this.seatedBy || null,
    cancelledAt: this.cancelledAt ? this.cancelledAt.toISOString() : null,
    cancellationReason: this.cancellationReason || null,
    statusHistory: (this.statusHistory || []).map((h: any) => ({
      status: h.status,
      changedAt: h.changedAt ? new Date(h.changedAt).toISOString() : new Date().toISOString(),
      actorType: h.actorType,
      note: h.note,
    })),
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const Reservation: Model<IReservationDocument> =
  mongoose.models.Reservation ||
  mongoose.model<IReservationDocument>('Reservation', ReservationSchema);
