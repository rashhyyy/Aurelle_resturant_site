import mongoose, { Document, Schema, Model } from 'mongoose';
import { StaffRole, StaffStatus, SafeStaff } from '../types/staff';

export interface IStaff extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  passwordHash?: string;
  role: StaffRole;
  status: StaffStatus;
  locationIds: string[];
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  invitationTokenHash?: string;
  invitationExpiresAt?: Date;
  invitationSentAt?: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): SafeStaff;
}

const StaffSchema = new Schema<IStaff>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [1, 'First name cannot be empty'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [1, 'Last name cannot be empty'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(StaffRole),
        message: 'Invalid staff role: {VALUE}',
      },
      required: [true, 'Staff role is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(StaffStatus),
        message: 'Invalid staff status: {VALUE}',
      },
      default: StaffStatus.INVITED,
      required: [true, 'Staff status is required'],
      index: true,
    },
    locationIds: {
      type: [String],
      default: ['loc-colombo-main'],
      index: true,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
    invitationTokenHash: {
      type: String,
      select: false,
    },
    invitationExpiresAt: {
      type: Date,
      select: false,
    },
    invitationSentAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Method returning safe presentation object (never exposes credentials or hashes)
StaffSchema.methods.toSafeJSON = function (): SafeStaff {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone || null,
    role: this.role,
    status: this.status,
    locationIds: this.locationIds || [],
    lastLoginAt: this.lastLoginAt || null,
    invitationExpiresAt: this.invitationExpiresAt || null,
    invitationSentAt: this.invitationSentAt || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Staff: Model<IStaff> =
  mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);
