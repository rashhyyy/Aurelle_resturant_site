import mongoose, { Document, Schema } from 'mongoose';
import {
  DeliveryChannel,
  NotificationCategory,
  NotificationPriority,
  RecipientType,
} from '../types/notification';

export interface INotificationDocument extends Document {
  recipientType: RecipientType;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientRole?: string;
  locationId?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  channels: DeliveryChannel[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipientType: {
      type: String,
      enum: Object.values(RecipientType),
      required: true,
      index: true,
    },
    recipientId: {
      type: String,
      required: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    recipientPhone: {
      type: String,
      trim: true,
    },
    recipientRole: {
      type: String,
      index: true,
    },
    locationId: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(NotificationCategory),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.NORMAL,
      index: true,
    },
    link: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    channels: {
      type: [String],
      enum: Object.values(DeliveryChannel),
      default: [DeliveryChannel.IN_APP],
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal real-time querying and unread count lookups
NotificationSchema.index({ recipientType: 1, recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientType: 1, recipientRole: 1, locationId: 1, createdAt: -1 });
NotificationSchema.index({ recipientType: 1, recipientId: 1, category: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);
