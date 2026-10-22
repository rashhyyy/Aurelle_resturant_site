import mongoose, { Document, Schema, Model } from 'mongoose';
import { EventInquiryStatus, IEventInquirySafeJSON } from '../types/vip';

export interface IEventInquiryDocument extends Document {
  inquiryReference: string;
  customerId?: string | null;
  locationId: string;
  eventType: string;
  preferredDate: string;
  preferredTime: string;
  guestCount: number;
  preferredRoomId?: mongoose.Types.ObjectId | null;
  requirements: string;
  budgetMinor?: number | null;
  currency: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: EventInquiryStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  activeProposalId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IEventInquirySafeJSON;
}

const EventInquirySchema = new Schema<IEventInquiryDocument>(
  {
    inquiryReference: {
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
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    preferredDate: {
      type: String,
      required: true,
      trim: true,
    },
    preferredTime: {
      type: String,
      required: true,
      trim: true,
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    preferredRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'VIPRoom',
      default: null,
    },
    requirements: {
      type: String,
      required: true,
      trim: true,
    },
    budgetMinor: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: 'LKR',
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
    status: {
      type: String,
      enum: Object.values(EventInquiryStatus),
      default: EventInquiryStatus.NEW,
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
    activeProposalId: {
      type: Schema.Types.ObjectId,
      ref: 'EventProposal',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'event_inquiries',
  }
);

EventInquirySchema.methods.toSafeJSON = function (): IEventInquirySafeJSON {
  const room = (this.preferredRoomId as any)?.name ? (this.preferredRoomId as any) : null;
  return {
    id: this._id.toString(),
    inquiryReference: this.inquiryReference,
    customerId: this.customerId || null,
    locationId: this.locationId,
    eventType: this.eventType,
    preferredDate: this.preferredDate,
    preferredTime: this.preferredTime,
    guestCount: this.guestCount,
    preferredRoomId: room ? room._id.toString() : this.preferredRoomId ? this.preferredRoomId.toString() : null,
    preferredRoomName: room ? room.name : undefined,
    requirements: this.requirements,
    budgetMinor: this.budgetMinor || null,
    currency: this.currency,
    guestName: this.guestName,
    guestEmail: this.guestEmail,
    guestPhone: this.guestPhone,
    status: this.status,
    assignedStaffId: this.assignedStaffId || null,
    assignedStaffName: this.assignedStaffName || null,
    activeProposalId: this.activeProposalId ? this.activeProposalId.toString() : null,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const EventInquiry: Model<IEventInquiryDocument> =
  mongoose.models.EventInquiry ||
  mongoose.model<IEventInquiryDocument>('EventInquiry', EventInquirySchema);
