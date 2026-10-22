import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITableSlotAllocationDocument extends Document {
  tableId: mongoose.Types.ObjectId;
  locationId: string;
  slotTime: Date;
  reservationId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TableSlotAllocationSchema = new Schema<ITableSlotAllocationDocument>(
  {
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
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
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'table_slot_allocations',
  }
);

// Compound Unique Index: Physically prevents two bookings from reserving the same table at the same slot
TableSlotAllocationSchema.index({ tableId: 1, slotTime: 1 }, { unique: true });
TableSlotAllocationSchema.index({ locationId: 1, slotTime: 1 });

export const TableSlotAllocation: Model<ITableSlotAllocationDocument> =
  mongoose.models.TableSlotAllocation ||
  mongoose.model<ITableSlotAllocationDocument>(
    'TableSlotAllocation',
    TableSlotAllocationSchema
  );
