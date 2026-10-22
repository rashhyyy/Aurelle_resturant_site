import mongoose, { Document, Schema, Model } from 'mongoose';
import { IMenuCategory } from '../types/menu';

export interface IMenuCategoryDocument extends Document {
  name: string;
  slug: string;
  description: string;
  image?: string;
  displayOrder: number;
  isVisible: boolean;
  isArchived: boolean;
  locationIds: string[];
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IMenuCategory;
}

const MenuCategorySchema = new Schema<IMenuCategoryDocument>(
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
      trim: true,
      default: '',
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    locationIds: {
      type: [String],
      default: ['loc-colombo-main'],
    },
  },
  {
    timestamps: true,
  }
);

MenuCategorySchema.index({ isVisible: 1, isArchived: 1, displayOrder: 1 });

MenuCategorySchema.methods.toSafeJSON = function (): IMenuCategory {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    description: this.description || '',
    image: this.image || '',
    displayOrder: this.displayOrder,
    isVisible: this.isVisible,
    isArchived: this.isArchived,
    locationIds: this.locationIds || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const MenuCategory: Model<IMenuCategoryDocument> =
  mongoose.models.MenuCategory ||
  mongoose.model<IMenuCategoryDocument>('MenuCategory', MenuCategorySchema);
