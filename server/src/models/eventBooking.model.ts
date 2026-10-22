import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  EventBookingStatus,
  PaymentStatus,
  IEventBookingSafeJSON,
} from '../types/vip';

export interface IEventBookingDocument extends Document {
  eventReference: string;
  inquiryId?: mongoose.Types.ObjectId | null;
  acceptedProposalId?: mongoose.Types.ObjectId | null;
  customerId?: string | null;
  locationId: string;
  roomId: mongoose.Types.ObjectId;
  startAt: Date;
  endAt: Date;
  guestCount: number;
  eventType: string;
  status: EventBookingStatus;
  paymentStatus: PaymentStatus;
  agreedTotalMinor: number;
  currency: string;
  specialRequirements?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IEventBookingSafeJSON;
}

const EventBookingSchema = new Schema<IEventBookingDocument>(
  {
    eventReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    inquiryId: {
      type: Schema.Types.ObjectId,
      ref: 'EventInquiry',
      default: null,
    },
    acceptedProposalId: {
      type: Schema.Types.ObjectId,
      ref: 'EventProposal',
      default: null,
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
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'VIPRoom',
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
    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(EventBookingStatus),
      default: EventBookingStatus.CONFIRMED,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
    },
    agreedTotalMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR',
    },
    specialRequirements: {
      type: String,
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
      trim: true,
      lowercase: true,
    },
    guestPhone: {
      type: String,
      required: true,
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
    collection: 'event_bookings',
  }
);

EventBookingSchema.index({ locationId: 1, startAt: 1, status: 1 });

EventBookingSchema.methods.toSafeJSON = function (): IEventBookingSafeJSON {
  const room = (this.roomId as any)?.name ? (this.roomId as any) : null;
  return {
    id: this._id.toString(),
    eventReference: this.eventReference,
    inquiryId: this.inquiryId ? this.inquiryId.toString() : null,
    acceptedProposalId: this.acceptedProposalId ? this.acceptedProposalId.toString() : null,
    customerId: this.customerId || null,
    locationId: this.locationId,
    roomId: room ? room._id.toString() : this.roomId.toString(),
    roomName: room ? room.name : undefined,
    startAt: this.startAt.toISOString(),
    endAt: this.endAt.toISOString(),
    guestCount: this.guestCount,
    eventType: this.eventType,
    status: this.status,
    paymentStatus: this.paymentStatus,
    agreedTotalMinor: this.agreedTotalMinor,
    currency: this.currency,
    specialRequirements: this.specialRequirements || undefined,
    guestName: this.guestName,
    guestEmail: this.guestEmail,
    guestPhone: this.guestPhone,
    assignedStaffId: this.assignedStaffId || null,
    assignedStaffName: this.assignedStaffName || null,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const EventBooking: Model<IEventBookingDocument> =
  mongoose.models.EventBooking ||
  mongoose.model<IEventBookingDocument>('EventBooking', EventBookingSchema);
