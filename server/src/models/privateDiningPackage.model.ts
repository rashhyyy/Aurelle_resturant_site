import mongoose, { Document, Schema, Model } from 'mongoose';
import { IPrivateDiningPackageSafeJSON } from '../types/vip';

export interface IPrivateDiningPackageDocument extends Document {
  locationId: string;
  roomId?: mongoose.Types.ObjectId | null;
  name: string;
  description: string;
  includedServices: string[];
  includedMenuItems: string[];
  priceMinor: number;
  currency: string;
  minimumGuests: number;
  maximumGuests: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IPrivateDiningPackageSafeJSON;
}

const PrivateDiningPackageSchema = new Schema<IPrivateDiningPackageDocument>(
  {
    locationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'VIPRoom',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    includedServices: {
      type: [String],
      default: [],
    },
    includedMenuItems: {
      type: [String],
      default: [],
    },
    priceMinor: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR',
      uppercase: true,
    },
    minimumGuests: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    maximumGuests: {
      type: Number,
      required: true,
      min: 1,
      default: 50,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'private_dining_packages',
  }
);

PrivateDiningPackageSchema.methods.toSafeJSON = function (): IPrivateDiningPackageSafeJSON {
  return {
    id: this._id.toString(),
    locationId: this.locationId,
    roomId: this.roomId ? this.roomId.toString() : null,
    name: this.name,
    description: this.description,
    includedServices: this.includedServices || [],
    includedMenuItems: this.includedMenuItems || [],
    priceMinor: this.priceMinor,
    currency: this.currency,
    minimumGuests: this.minimumGuests,
    maximumGuests: this.maximumGuests,
    isPublished: this.isPublished,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const PrivateDiningPackage: Model<IPrivateDiningPackageDocument> =
  mongoose.models.PrivateDiningPackage ||
  mongoose.model<IPrivateDiningPackageDocument>(
    'PrivateDiningPackage',
    PrivateDiningPackageSchema
  );
