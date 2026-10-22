import mongoose, { Document, Schema } from 'mongoose';
import { DeliveryChannel, DeliveryStatus, RecipientType } from '../types/notification';

export interface INotificationDeliveryDocument extends Document {
  notificationId: mongoose.Types.ObjectId;
  channel: DeliveryChannel;
  recipientType: RecipientType;
  recipientId: string;
  recipientDestination: string;
  status: DeliveryStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: Date;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  providerMessageId?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationDeliverySchema = new Schema<INotificationDeliveryDocument>(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: Object.values(DeliveryChannel),
      required: true,
      index: true,
    },
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
    recipientDestination: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.PENDING,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    nextAttemptAt: {
      type: Date,
      index: true,
    },
    lastAttemptAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    providerMessageId: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for retry queues and monitoring
NotificationDeliverySchema.index({ status: 1, nextAttemptAt: 1 });
NotificationDeliverySchema.index({ notificationId: 1, channel: 1 });
NotificationDeliverySchema.index({ recipientType: 1, createdAt: -1 });

export const NotificationDelivery =
  mongoose.models.NotificationDelivery ||
  mongoose.model<INotificationDeliveryDocument>(
    'NotificationDelivery',
    NotificationDeliverySchema
  );
