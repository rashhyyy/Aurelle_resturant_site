import mongoose, { Document, Schema, Model } from 'mongoose';
import { EventProposalStatus, IEventProposalSafeJSON } from '../types/vip';

export interface IEventProposalDocument extends Document {
  inquiryId: mongoose.Types.ObjectId;
  proposalVersion: number;
  locationId: string;
  roomId: mongoose.Types.ObjectId;
  startAt: Date;
  endAt: Date;
  guestCount: number;
  packageSnapshot?: {
    name: string;
    priceMinor: number;
    currency: string;
  } | null;
  servicesSnapshot: string[];
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
  terms: string;
  expiresAt: Date;
  status: EventProposalStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IEventProposalSafeJSON;
}

const EventProposalSchema = new Schema<IEventProposalDocument>(
  {
    inquiryId: {
      type: Schema.Types.ObjectId,
      ref: 'EventInquiry',
      required: true,
      index: true,
    },
    proposalVersion: {
      type: Number,
      required: true,
      default: 1,
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
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    packageSnapshot: {
      name: { type: String },
      priceMinor: { type: Number },
      currency: { type: String },
    },
    servicesSnapshot: {
      type: [String],
      default: [],
    },
    subtotalMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    taxMinor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR',
    },
    terms: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(EventProposalStatus),
      default: EventProposalStatus.SENT,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'event_proposals',
  }
);

EventProposalSchema.methods.toSafeJSON = function (): IEventProposalSafeJSON {
  const room = (this.roomId as any)?.name ? (this.roomId as any) : null;
  return {
    id: this._id.toString(),
    inquiryId: this.inquiryId.toString(),
    proposalVersion: this.proposalVersion,
    locationId: this.locationId,
    roomId: room ? room._id.toString() : this.roomId.toString(),
    roomName: room ? room.name : undefined,
    startAt: this.startAt.toISOString(),
    endAt: this.endAt.toISOString(),
    guestCount: this.guestCount,
    packageSnapshot: this.packageSnapshot || null,
    servicesSnapshot: this.servicesSnapshot || [],
    subtotalMinor: this.subtotalMinor,
    taxMinor: this.taxMinor,
    totalMinor: this.totalMinor,
    currency: this.currency,
    terms: this.terms,
    expiresAt: this.expiresAt.toISOString(),
    status: this.status,
    createdBy: this.createdBy,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const EventProposal: Model<IEventProposalDocument> =
  mongoose.models.EventProposal ||
  mongoose.model<IEventProposalDocument>('EventProposal', EventProposalSchema);
