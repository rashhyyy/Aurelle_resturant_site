import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  firstName?: string;
  lastName?: string;
  phone?: string;
  countryCode?: string;
  dateOfBirth?: string;
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): {
    id: string;
    username: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phone: string;
    countryCode: string;
    dateOfBirth: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    firstName: {
      type: String,
      default: '',
      trim: true,
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    countryCode: {
      type: String,
      default: 'Sri Lanka (+94)',
      trim: true,
    },
    dateOfBirth: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    role: this.role,
    firstName: this.firstName || '',
    lastName: this.lastName || '',
    phone: this.phone || '',
    countryCode: this.countryCode || 'Sri Lanka (+94)',
    dateOfBirth: this.dateOfBirth || '',
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.model<IUser>('User', UserSchema);
