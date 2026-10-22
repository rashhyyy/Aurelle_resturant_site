import mongoose, { Document, Schema, Model } from 'mongoose';
import { IVIPRoomSafeJSON, IVIPRoomAmenity } from '../types/vip';

export interface IVIPRoomDocument extends Document {
  locationId: string;
  name: string;
  slug: string;
  tag?: string;
  subtitle?: string;
  description: string;
  shortDescription?: string;
  capacityMin: number;
  capacityMax: number;
  squareMeters?: string;
  images: string[];
  amenities: IVIPRoomAmenity[];
  features: string[];
  categories: string[];
  basePriceMinor: number;
  currency: string;
  minimumSpendMinor: number;
  bookingDurationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IVIPRoomSafeJSON;
}

const AmenitySchema = new Schema<IVIPRoomAmenity>(
  {
    label: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const VIPRoomSchema = new Schema<IVIPRoomDocument>(
  {
    locationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    tag: {
      type: String,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    capacityMin: {
      type: Number,
      required: true,
      min: 1,
    },
    capacityMax: {
      type: Number,
      required: true,
      min: 1,
    },
    squareMeters: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [AmenitySchema],
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    categories: {
      type: [String],
      default: ['All spaces'],
    },
    basePriceMinor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR',
      uppercase: true,
    },
    minimumSpendMinor: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    bookingDurationMinutes: {
      type: Number,
      required: true,
      min: 30,
      default: 180, // 3 hours
    },
    bufferMinutes: {
      type: Number,
      required: true,
      min: 0,
      default: 60, // 1 hour reset buffer
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'vip_rooms',
  }
);

VIPRoomSchema.index({ locationId: 1, slug: 1 }, { unique: true });
VIPRoomSchema.index({ locationId: 1, isPublished: 1, isActive: 1 });

VIPRoomSchema.methods.toSafeJSON = function (): IVIPRoomSafeJSON {
  return {
    id: this._id.toString(),
    locationId: this.locationId,
    name: this.name,
    slug: this.slug,
    tag: this.tag || undefined,
    subtitle: this.subtitle || undefined,
    description: this.description,
    shortDescription: this.shortDescription || undefined,
    capacityMin: this.capacityMin,
    capacityMax: this.capacityMax,
    squareMeters: this.squareMeters || undefined,
    images: this.images || [],
    amenities: this.amenities || [],
    features: this.features || [],
    categories: this.categories || [],
    basePriceMinor: this.basePriceMinor,
    currency: this.currency,
    minimumSpendMinor: this.minimumSpendMinor,
    bookingDurationMinutes: this.bookingDurationMinutes,
    bufferMinutes: this.bufferMinutes,
    isActive: this.isActive,
    isPublished: this.isPublished,
    displayOrder: this.displayOrder,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const VIPRoom: Model<IVIPRoomDocument> =
  mongoose.models.VIPRoom ||
  mongoose.model<IVIPRoomDocument>('VIPRoom', VIPRoomSchema);
