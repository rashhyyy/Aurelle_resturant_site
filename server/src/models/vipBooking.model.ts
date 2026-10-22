import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  VIPBookingStatus,
  PaymentStatus,
  IVIPBookingSafeJSON,
} from '../types/vip';

export interface IVIPBookingDocument extends Document {
  bookingReference: string;
  customerId?: string | null;
  locationId: string;
  roomId: mongoose.Types.ObjectId;
  guestCount: number;
  startAt: Date;
  endAt: Date;
  timezone: string;
  status: VIPBookingStatus;
  packageId?: mongoose.Types.ObjectId | null;
  packageSnapshot?: {
    name: string;
    priceMinor: number;
    currency: string;
    description?: string;
  } | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  occasion?: string;
  quotedPriceMinor: number;
  currency: string;
  paymentStatus: PaymentStatus;
  confirmedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IVIPBookingSafeJSON;
}

const VIPBookingSchema = new Schema<IVIPBookingDocument>(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
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
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'VIPRoom',
      required: true,
      index: true,
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
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
    timezone: {
      type: String,
      required: true,
      default: 'Asia/Colombo',
    },
    status: {
      type: String,
      enum: Object.values(VIPBookingStatus),
      default: VIPBookingStatus.CONFIRMED,
      index: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateDiningPackage',
      default: null,
    },
    packageSnapshot: {
      name: { type: String },
      priceMinor: { type: Number },
      currency: { type: String },
      description: { type: String },
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    guestEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    guestPhone: {
      type: String,
      required: true,
      trim: true,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    occasion: {
      type: String,
      trim: true,
    },
    quotedPriceMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR',
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
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
      trim: true,
    },
    assignedStaffId: {
      type: String,
      default: null,
    },
    assignedStaffName: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'vip_bookings',
  }
);

VIPBookingSchema.index({ locationId: 1, startAt: 1, status: 1 });
VIPBookingSchema.index({ roomId: 1, startAt: 1, endAt: 1 });

VIPBookingSchema.methods.toSafeJSON = function (): IVIPBookingSafeJSON {
  const roomPopulated = (this.roomId as any)?.name ? (this.roomId as any) : null;
  return {
    id: this._id.toString(),
    bookingReference: this.bookingReference,
    customerId: this.customerId || null,
    locationId: this.locationId,
    roomId: roomPopulated ? roomPopulated._id.toString() : this.roomId.toString(),
    roomName: roomPopulated ? roomPopulated.name : undefined,
    roomSlug: roomPopulated ? roomPopulated.slug : undefined,
    guestCount: this.guestCount,
    startAt: this.startAt.toISOString(),
    endAt: this.endAt.toISOString(),
    timezone: this.timezone,
    status: this.status,
    packageId: this.packageId ? this.packageId.toString() : null,
    packageName: this.packageSnapshot?.name || undefined,
    packageSnapshot: this.packageSnapshot || null,
    guestName: this.guestName,
    guestEmail: this.guestEmail,
    guestPhone: this.guestPhone,
    specialRequests: this.specialRequests || undefined,
    occasion: this.occasion || undefined,
    quotedPriceMinor: this.quotedPriceMinor,
    currency: this.currency,
    paymentStatus: this.paymentStatus,
    confirmedAt: this.confirmedAt ? this.confirmedAt.toISOString() : null,
    cancelledAt: this.cancelledAt ? this.cancelledAt.toISOString() : null,
    cancellationReason: this.cancellationReason || null,
    assignedStaffId: this.assignedStaffId || null,
    assignedStaffName: this.assignedStaffName || null,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const VIPBooking: Model<IVIPBookingDocument> =
  mongoose.models.VIPBooking ||
  mongoose.model<IVIPBookingDocument>('VIPBooking', VIPBookingSchema);
