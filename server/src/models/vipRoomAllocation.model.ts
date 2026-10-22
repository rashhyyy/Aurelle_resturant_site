import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IVIPRoomAllocationDocument extends Document {
  roomId: mongoose.Types.ObjectId;
  locationId: string;
  slotTime: Date;
  bookingReference: string;
  bookingId: mongoose.Types.ObjectId;
  bookingType: 'VIP_BOOKING' | 'EVENT_BOOKING' | 'MAINTENANCE_HOLD';
  createdAt: Date;
}

const VIPRoomAllocationSchema = new Schema<IVIPRoomAllocationDocument>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'VIPRoom',
      required: true,
      index: true,
    },
    locationId: {
      type: String,
      required: true,
      index: true,
    },
    slotTime: {
      type: Date,
      required: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    bookingType: {
      type: String,
      enum: ['VIP_BOOKING', 'EVENT_BOOKING', 'MAINTENANCE_HOLD'],
      default: 'VIP_BOOKING',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'vip_room_allocations',
  }
);

// Compound Unique Index: Physically prevents two bookings from claiming the same VIP room during overlapping slots
VIPRoomAllocationSchema.index({ roomId: 1, slotTime: 1 }, { unique: true });
VIPRoomAllocationSchema.index({ locationId: 1, slotTime: 1 });

export const VIPRoomAllocation: Model<IVIPRoomAllocationDocument> =
  mongoose.models.VIPRoomAllocation ||
  mongoose.model<IVIPRoomAllocationDocument>(
    'VIPRoomAllocation',
    VIPRoomAllocationSchema
  );
