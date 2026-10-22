import mongoose, { Document, Schema } from 'mongoose';
import { RecipientType } from '../types/notification';

export interface ICategoryPref {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface INotificationPreferencesDocument extends Document {
  recipientType: RecipientType;
  recipientId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  categories: {
    orders: ICategoryPref;
    reservations: ICategoryPref;
    kitchen: ICategoryPref;
    reception: ICategoryPref;
    floor: ICategoryPref;
    vip: ICategoryPref;
    events: ICategoryPref;
    management: ICategoryPref;
    security: ICategoryPref;
    system: ICategoryPref;
  };
  doNotDisturb: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const defaultCategoryPref = () => ({
  inApp: true,
  email: true,
  sms: false,
});

const CategoryPrefSchema = new Schema(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  { _id: false }
);

const NotificationPreferencesSchema = new Schema<INotificationPreferencesDocument>(
  {
    recipientType: {
      type: String,
      enum: Object.values(RecipientType),
      required: true,
    },
    recipientId: {
      type: String,
      required: true,
    },
    inAppEnabled: {
      type: Boolean,
      default: true,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    smsEnabled: {
      type: Boolean,
      default: false,
    },
    categories: {
      orders: { type: CategoryPrefSchema, default: defaultCategoryPref },
      reservations: { type: CategoryPrefSchema, default: defaultCategoryPref },
      kitchen: { type: CategoryPrefSchema, default: defaultCategoryPref },
      reception: { type: CategoryPrefSchema, default: defaultCategoryPref },
      floor: { type: CategoryPrefSchema, default: defaultCategoryPref },
      vip: { type: CategoryPrefSchema, default: defaultCategoryPref },
      events: { type: CategoryPrefSchema, default: defaultCategoryPref },
      management: { type: CategoryPrefSchema, default: defaultCategoryPref },
      security: {
        type: CategoryPrefSchema,
        default: () => ({ inApp: true, email: true, sms: true }),
      },
      system: { type: CategoryPrefSchema, default: defaultCategoryPref },
    },
    doNotDisturb: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '08:00' },
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index so each recipient has one preferences record
NotificationPreferencesSchema.index({ recipientType: 1, recipientId: 1 }, { unique: true });

export const NotificationPreferences =
  mongoose.models.NotificationPreferences ||
  mongoose.model<INotificationPreferencesDocument>(
    'NotificationPreferences',
    NotificationPreferencesSchema
  );
