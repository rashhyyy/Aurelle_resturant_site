import mongoose, { Document, Schema, Model } from 'mongoose';
import { IMenuItem, PublicationStatus } from '../types/menu';

export interface IMenuItemDocument extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  categorySlug: string;
  priceMinor: number;
  currency: string;
  images: string[];
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  spiceLevel?: string;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  publicationStatus: PublicationStatus;
  displayOrder: number;
  locationIds: string[];
  createdBy?: string;
  updatedBy?: string;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IMenuItem;
}

const MenuItemSchema = new Schema<IMenuItemDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      default: '',
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: true,
      index: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    categorySlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    priceMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for priceMinor',
      },
    },
    currency: {
      type: String,
      default: 'LKR',
      trim: true,
      uppercase: true,
    },
    images: {
      type: [String],
      default: [],
    },
    ingredients: {
      type: [String],
      default: [],
    },
    allergens: {
      type: [String],
      default: [],
    },
    dietaryTags: {
      type: [String],
      default: [],
    },
    spiceLevel: {
      type: String,
      default: 'None',
      trim: true,
    },
    preparationTimeMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    publicationStatus: {
      type: String,
      enum: Object.values(PublicationStatus),
      default: PublicationStatus.DRAFT,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    locationIds: {
      type: [String],
      default: ['loc-colombo-main'],
    },
    createdBy: {
      type: String,
      default: null,
    },
    updatedBy: {
      type: String,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MenuItemSchema.index({ publicationStatus: 1, isAvailable: 1, categorySlug: 1 });
MenuItemSchema.index({ isFeatured: 1, publicationStatus: 1 });
MenuItemSchema.index({ displayOrder: 1, createdAt: -1 });
MenuItemSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });

// Format helper
MenuItemSchema.methods.toSafeJSON = function (): IMenuItem {
  const majorUnits = Math.round(this.priceMinor / 100);
  const formattedPrice = `${this.currency} ${majorUnits.toLocaleString('en-US')}`;

  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    description: this.description,
    shortDescription: this.shortDescription || '',
    categoryId: this.categoryId ? this.categoryId.toString() : '',
    categoryName: this.categoryName,
    categorySlug: this.categorySlug,
    priceMinor: this.priceMinor,
    currency: this.currency,
    formattedPrice,
    images: this.images && this.images.length > 0 ? this.images : [
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop',
    ],
    ingredients: this.ingredients || [],
    allergens: this.allergens || [],
    dietaryTags: this.dietaryTags || [],
    spiceLevel: this.spiceLevel || 'None',
    preparationTimeMinutes: this.preparationTimeMinutes || 15,
    isAvailable: this.isAvailable,
    isFeatured: this.isFeatured,
    publicationStatus: this.publicationStatus as PublicationStatus,
    displayOrder: this.displayOrder || 0,
    locationIds: this.locationIds || ['loc-colombo-main'],
    createdBy: this.createdBy,
    updatedBy: this.updatedBy,
    publishedAt: this.publishedAt,
    archivedAt: this.archivedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const MenuItem: Model<IMenuItemDocument> =
  mongoose.models.MenuItem ||
  mongoose.model<IMenuItemDocument>('MenuItem', MenuItemSchema);
