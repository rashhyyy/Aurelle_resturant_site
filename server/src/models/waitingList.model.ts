import mongoose, { Document, Schema, Model } from 'mongoose';
import { IWaitingList, WaitingListStatus, IWaitingListSafeJSON } from '../types/waitingList';

const LOCATION_NAMES: Record<string, string> = {
  'loc-colombo-main': 'Aurelle Colombo (Flagship)',
  'loc-kandy-vip': 'Aurelle Kandy (Sanctuary)',
};

function getLocationName(locationId: string): string {
  return LOCATION_NAMES[locationId] || locationId;
}

export interface IWaitingListDocument extends Document, Omit<IWaitingList, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IWaitingListSafeJSON;
}

const WaitingListSchema = new Schema<IWaitingListDocument>(
  {
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
    guestCount: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    guestPhone: {
      type: String,
      required: true,
      trim: true,
    },
    guestEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    seatingPreference: {
      type: String,
      default: 'No preference',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(WaitingListStatus),
      default: WaitingListStatus.WAITING,
      index: true,
    },
    arrivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    seatedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    reservationId: {
      type: String,
      default: null,
    },
    tableId: {
      type: String,
      default: null,
    },
    tableNumber: {
      type: String,
      default: null,
    },
    estimatedWaitMinutes: {
      type: Number,
      default: 15,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'waiting_list',
  }
);

WaitingListSchema.index({ locationId: 1, status: 1, arrivedAt: 1 });

WaitingListSchema.methods.toSafeJSON = function (): IWaitingListSafeJSON {
  const arrived = new Date(this.arrivedAt).getTime();
  const finish = this.seatedAt ? new Date(this.seatedAt).getTime() : Date.now();
  const waitDurationMinutes = Math.max(0, Math.floor((finish - arrived) / (60 * 1000)));

  return {
    id: this._id.toString(),
    locationId: this.locationId,
    locationName: getLocationName(this.locationId),
    guestName: this.guestName,
    guestCount: this.guestCount,
    guestPhone: this.guestPhone,
    guestEmail: this.guestEmail || null,
    seatingPreference: this.seatingPreference,
    notes: this.notes || '',
    status: this.status,
    arrivedAt: this.arrivedAt ? new Date(this.arrivedAt).toISOString() : new Date().toISOString(),
    notifiedAt: this.notifiedAt ? new Date(this.notifiedAt).toISOString() : null,
    seatedAt: this.seatedAt ? new Date(this.seatedAt).toISOString() : null,
    cancelledAt: this.cancelledAt ? new Date(this.cancelledAt).toISOString() : null,
    reservationId: this.reservationId || null,
    tableId: this.tableId || null,
    tableNumber: this.tableNumber || null,
    waitDurationMinutes,
    estimatedWaitMinutes: this.estimatedWaitMinutes,
    createdBy: this.createdBy,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const WaitingList: Model<IWaitingListDocument> =
  mongoose.models.WaitingList || mongoose.model<IWaitingListDocument>('WaitingList', WaitingListSchema);
