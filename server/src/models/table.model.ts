import mongoose, { Document, Schema, Model } from 'mongoose';
import { TableSection, TableStatus, ITableSafeJSON, ITableLayout } from '../types/table';

export interface ITableDocument extends Document {
  tableNumber: string;
  name: string;
  locationId: string;
  capacity: number;
  minPartySize: number;
  section: TableSection;
  status: TableStatus;
  isActive: boolean;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  layout?: ITableLayout | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): ITableSafeJSON;
}

const TableLayoutSchema = new Schema<ITableLayout>(
  {
    floorId: { type: String, default: 'floor-main' },
    sectionId: { type: String },
    positionX: { type: Number, required: true },
    positionY: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    rotation: { type: Number, default: 0 },
    shape: {
      type: String,
      enum: ['RECTANGLE', 'ROUND', 'SQUARE', 'BOOTH'],
      default: 'RECTANGLE',
    },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const TableSchema = new Schema<ITableDocument>(
  {
    tableNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    locationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    minPartySize: {
      type: Number,
      default: 1,
      min: 1,
    },
    section: {
      type: String,
      enum: Object.values(TableSection),
      default: TableSection.MAIN_DINING,
    },
    status: {
      type: String,
      enum: Object.values(TableStatus),
      default: TableStatus.AVAILABLE,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    assignedStaffId: {
      type: String,
      default: null,
      index: true,
    },
    assignedStaffName: {
      type: String,
      default: null,
    },
    layout: {
      type: TableLayoutSchema,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'tables',
  }
);

TableSchema.index({ locationId: 1, tableNumber: 1 }, { unique: true });
TableSchema.index({ locationId: 1, isActive: 1, capacity: 1 });

TableSchema.methods.toSafeJSON = function (): ITableSafeJSON {
  return {
    id: this._id.toString(),
    tableNumber: this.tableNumber,
    name: this.name,
    locationId: this.locationId,
    capacity: this.capacity,
    minPartySize: this.minPartySize,
    section: this.section,
    status: this.status,
    isActive: this.isActive,
    assignedStaffId: this.assignedStaffId || null,
    assignedStaffName: this.assignedStaffName || null,
    layout: this.layout
      ? {
          floorId: this.layout.floorId || 'floor-main',
          sectionId: this.layout.sectionId,
          positionX: this.layout.positionX,
          positionY: this.layout.positionY,
          width: this.layout.width,
          height: this.layout.height,
          rotation: this.layout.rotation || 0,
          shape: this.layout.shape || 'RECTANGLE',
          displayOrder: this.layout.displayOrder || 0,
        }
      : null,
  };
};

export const Table: Model<ITableDocument> =
  mongoose.models.Table || mongoose.model<ITableDocument>('Table', TableSchema);

