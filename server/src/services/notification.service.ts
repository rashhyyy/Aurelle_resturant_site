import mongoose from 'mongoose';
import {
  CreateNotificationInput,
  DeliveryChannel,
  DeliveryStatus,
  INotification,
  NotificationCategory,
  NotificationPriority,
  RecipientType,
} from '../types/notification';
import { Notification, INotificationDocument } from '../models/notification.model';
import {
  NotificationPreferences,
  INotificationPreferencesDocument,
} from '../models/notificationPreferences.model';
import {
  NotificationDelivery,
  INotificationDeliveryDocument,
} from '../models/notificationDelivery.model';
import { Staff } from '../models/staff.model';
import { StaffRole } from '../types/staff';
import { emailService } from './email.service';
import { smsService } from './sms.service';
import { getSocketServer } from '../sockets/socket.server';
import { logger } from '../utils/logger';

class NotificationService {
  /**
   * Get or create default recipient preferences
   */
  async getPreferences(
    recipientType: RecipientType,
    recipientId: string
  ): Promise<INotificationPreferencesDocument> {
    let prefs = await NotificationPreferences.findOne({ recipientType, recipientId });
    if (!prefs) {
      prefs = await NotificationPreferences.create({
        recipientType,
        recipientId,
        inAppEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
      });
    }
    return prefs;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    recipientType: RecipientType,
    recipientId: string,
    updates: Partial<any>
  ): Promise<INotificationPreferencesDocument> {
    const prefs = await NotificationPreferences.findOneAndUpdate(
      { recipientType, recipientId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
    return prefs;
  }

  /**
   * Map category enum to preferences field name
   */
  private mapCategoryToPrefKey(category: NotificationCategory): string {
    switch (category) {
      case NotificationCategory.ORDER:
        return 'orders';
      case NotificationCategory.RESERVATION:
        return 'reservations';
      case NotificationCategory.KITCHEN:
        return 'kitchen';
      case NotificationCategory.RECEPTION:
        return 'reception';
      case NotificationCategory.FLOOR:
        return 'floor';
      case NotificationCategory.VIP:
        return 'vip';
      case NotificationCategory.EVENT:
        return 'events';
      case NotificationCategory.MANAGEMENT:
        return 'management';
      case NotificationCategory.SECURITY:
        return 'security';
      default:
        return 'system';
    }
  }

  /**
   * Create and dispatch a targeted notification to a customer or staff member
   */
  async createNotification(input: CreateNotificationInput): Promise<INotificationDocument> {
    const {
      recipientType,
      recipientId,
      recipientEmail,
      recipientPhone,
      recipientRole,
      locationId,
      title,
      message,
      category,
      priority = NotificationPriority.NORMAL,
      link,
      metadata = {},
      channels: requestedChannels,
      expiresAt,
    } = input;

    // 1. Fetch recipient preferences to determine delivery routing
    const prefs = await this.getPreferences(recipientType, recipientId);
    const prefKey = this.mapCategoryToPrefKey(category);
    const categoryPref = (prefs.categories as any)?.[prefKey] || {
      inApp: true,
      email: true,
      sms: false,
    };

    // Determine final delivery channels
    const channels: DeliveryChannel[] = [];
    if (prefs.inAppEnabled && categoryPref.inApp) {
      channels.push(DeliveryChannel.IN_APP);
    }
    if (prefs.emailEnabled && categoryPref.email && (recipientEmail || requestedChannels?.includes(DeliveryChannel.EMAIL))) {
      channels.push(DeliveryChannel.EMAIL);
    }
    if (prefs.smsEnabled && categoryPref.sms && (recipientPhone || requestedChannels?.includes(DeliveryChannel.SMS))) {
      channels.push(DeliveryChannel.SMS);
    }

    // Default to IN_APP if no channels selected
    if (channels.length === 0) {
      channels.push(DeliveryChannel.IN_APP);
    }

    // 2. Persist Notification Document
    const notification = await Notification.create({
      recipientType,
      recipientId,
      recipientEmail,
      recipientPhone,
      recipientRole,
      locationId,
      title,
      message,
      category,
      priority,
      link,
      metadata,
      channels,
      expiresAt,
      isRead: false,
    });

    const notifObj = notification.toObject();

    // 3. Dispatch Delivery Channels
    // A. IN-APP REAL-TIME EMISSION (Socket.IO)
    if (channels.includes(DeliveryChannel.IN_APP)) {
      try {
        const io = getSocketServer();
        if (io) {
          const room =
            recipientType === RecipientType.CUSTOMER
              ? `customer:${recipientId}`
              : `staff:${recipientId}`;

          io.to(room).emit('notifications.created' as any, notifObj);

          // If staff has a role room and this is a role-targeted notification, also emit to role room
          if (recipientType === RecipientType.STAFF && recipientRole) {
            io.to(`role:${recipientRole.toLowerCase()}`).emit('notifications.created' as any, notifObj);
          }

          // Emit unread count update
          const unreadCount = await this.getUnreadCount(recipientType, recipientId);
          io.to(room).emit('notifications.unreadCountChanged' as any, {
            unreadCount,
            recipientId,
          });
        }

        // Record IN_APP delivery log
        await NotificationDelivery.create({
          notificationId: notification._id,
          channel: DeliveryChannel.IN_APP,
          recipientType,
          recipientId,
          recipientDestination: recipientId,
          status: DeliveryStatus.DELIVERED,
          attempts: 1,
          deliveredAt: new Date(),
          idempotencyKey: `in_app_${notification._id}`,
        });
      } catch (err: any) {
        logger.warn(`[NotificationService] In-app dispatch warning:`, err?.message || err);
      }
    }

    // B. TRANSACTIONAL EMAIL DISPATCH
    if (channels.includes(DeliveryChannel.EMAIL) && recipientEmail) {
      const emailDelivery = await NotificationDelivery.create({
        notificationId: notification._id,
        channel: DeliveryChannel.EMAIL,
        recipientType,
        recipientId,
        recipientDestination: recipientEmail,
        status: DeliveryStatus.PENDING,
        attempts: 1,
        lastAttemptAt: new Date(),
        idempotencyKey: `email_${notification._id}`,
      });

      emailService
        .sendNotificationEmail({
          toEmail: recipientEmail,
          title,
          message,
          link,
          category,
        })
        .then(async (res) => {
          if (res.delivered) {
            emailDelivery.status = DeliveryStatus.DELIVERED;
            emailDelivery.deliveredAt = new Date();
            emailDelivery.providerMessageId = res.messageId;
          } else {
            emailDelivery.status = DeliveryStatus.FAILED;
            emailDelivery.failureReason = res.error || 'Provider rejected email';
            emailDelivery.nextAttemptAt = new Date(Date.now() + 60000); // 1 minute retry
          }
          await emailDelivery.save();
        })
        .catch(async (err) => {
          emailDelivery.status = DeliveryStatus.FAILED;
          emailDelivery.failureReason = err?.message || 'Email delivery exception';
          emailDelivery.nextAttemptAt = new Date(Date.now() + 60000);
          await emailDelivery.save();
        });
    }

    // C. SMS DISPATCH
    if (channels.includes(DeliveryChannel.SMS) && recipientPhone) {
      const smsDelivery = await NotificationDelivery.create({
        notificationId: notification._id,
        channel: DeliveryChannel.SMS,
        recipientType,
        recipientId,
        recipientDestination: recipientPhone,
        status: DeliveryStatus.PENDING,
        attempts: 1,
        lastAttemptAt: new Date(),
        idempotencyKey: `sms_${notification._id}`,
      });

      smsService
        .sendSms({
          toPhone: recipientPhone,
          message: `${title}: ${message}`,
        })
        .then(async (res) => {
          if (res.delivered) {
            smsDelivery.status = DeliveryStatus.DELIVERED;
            smsDelivery.deliveredAt = new Date();
            smsDelivery.providerMessageId = res.messageId;
          } else {
            smsDelivery.status = DeliveryStatus.FAILED;
            smsDelivery.failureReason = res.error || 'SMS failed';
            smsDelivery.nextAttemptAt = new Date(Date.now() + 60000);
          }
          await smsDelivery.save();
        })
        .catch(async (err) => {
          smsDelivery.status = DeliveryStatus.FAILED;
          smsDelivery.failureReason = err?.message || 'SMS delivery exception';
          smsDelivery.nextAttemptAt = new Date(Date.now() + 60000);
          await smsDelivery.save();
        });
    }

    return notification;
  }

  /**
   * Broadcast / route notification to all active staff members with a given role
   */
  async notifyStaffRole(params: {
    role: StaffRole;
    locationId?: string;
    title: string;
    message: string;
    category: NotificationCategory;
    priority?: NotificationPriority;
    link?: string;
    metadata?: Record<string, any>;
  }): Promise<INotificationDocument[]> {
    const query: Record<string, any> = {
      role: params.role,
      status: 'ACTIVE',
    };

    if (params.locationId) {
      query.locationIds = params.locationId;
    }

    const matchingStaff = await Staff.find(query).select('_id email phone role firstName lastName');

    const createdNotifications: INotificationDocument[] = [];

    for (const member of matchingStaff) {
      const notif = await this.createNotification({
        recipientType: RecipientType.STAFF,
        recipientId: member._id.toString(),
        recipientEmail: member.email,
        recipientPhone: member.phone || undefined,
        recipientRole: member.role,
        locationId: params.locationId,
        title: params.title,
        message: params.message,
        category: params.category,
        priority: params.priority || NotificationPriority.NORMAL,
        link: params.link,
        metadata: params.metadata,
      });
      createdNotifications.push(notif);
    }

    return createdNotifications;
  }

  /**
   * Query paginated notification history
   */
  async getNotifications(params: {
    recipientType: RecipientType;
    recipientId: string;
    category?: string;
    isRead?: boolean;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    notifications: INotificationDocument[];
    total: number;
    page: number;
    totalPages: number;
    unreadCount: number;
  }> {
    const {
      recipientType,
      recipientId,
      category,
      isRead,
      priority,
      search,
      page = 1,
      limit = 20,
    } = params;

    const query: Record<string, any> = {
      recipientType,
      recipientId,
    };

    if (category && category !== 'all') {
      query.category = category.toUpperCase();
    }

    if (typeof isRead === 'boolean') {
      query.isRead = isRead;
    }

    if (priority && priority !== 'all') {
      query.priority = priority.toUpperCase();
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { message: regex }];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientType, recipientId, isRead: false }),
    ]);

    return {
      notifications: notifications as any,
      total,
      page: Math.max(1, page),
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    };
  }

  /**
   * Fast indexed unread notification count
   */
  async getUnreadCount(recipientType: RecipientType, recipientId: string): Promise<number> {
    return Notification.countDocuments({
      recipientType,
      recipientId,
      isRead: false,
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(
    notificationId: string,
    recipientType: RecipientType,
    recipientId: string
  ): Promise<INotificationDocument | null> {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipientType,
        recipientId,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true }
    );

    if (notification) {
      try {
        const io = getSocketServer();
        if (io) {
          const room =
            recipientType === RecipientType.CUSTOMER
              ? `customer:${recipientId}`
              : `staff:${recipientId}`;

          io.to(room).emit('notifications.read' as any, {
            notificationId: notification._id.toString(),
          });

          const unreadCount = await this.getUnreadCount(recipientType, recipientId);
          io.to(room).emit('notifications.unreadCountChanged' as any, {
            unreadCount,
            recipientId,
          });
        }
      } catch (err: any) {
        logger.warn(`[NotificationService] Read socket event warning:`, err?.message || err);
      }
    }

    return notification;
  }

  /**
   * Mark all unread notifications as read (optionally filtered by category)
   */
  async markAllAsRead(
    recipientType: RecipientType,
    recipientId: string,
    category?: string
  ): Promise<{ modifiedCount: number }> {
    const filter: Record<string, any> = {
      recipientType,
      recipientId,
      isRead: false,
    };

    if (category && category !== 'all') {
      filter.category = category.toUpperCase();
    }

    const res = await Notification.updateMany(filter, {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    });

    try {
      const io = getSocketServer();
      if (io) {
        const room =
          recipientType === RecipientType.CUSTOMER
            ? `customer:${recipientId}`
            : `staff:${recipientId}`;

        io.to(room).emit('notifications.readAll' as any, {
          category: category || null,
        });

        const unreadCount = await this.getUnreadCount(recipientType, recipientId);
        io.to(room).emit('notifications.unreadCountChanged' as any, {
          unreadCount,
          recipientId,
        });
      }
    } catch (err: any) {
      logger.warn(`[NotificationService] Read all socket event warning:`, err?.message || err);
    }

    return { modifiedCount: res.modifiedCount };
  }

  /**
   * Delete / dismiss a notification
   */
  async deleteNotification(
    notificationId: string,
    recipientType: RecipientType,
    recipientId: string
  ): Promise<boolean> {
    const res = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientType,
      recipientId,
    });

    if (res) {
      try {
        const io = getSocketServer();
        if (io) {
          const room =
            recipientType === RecipientType.CUSTOMER
              ? `customer:${recipientId}`
              : `staff:${recipientId}`;

          const unreadCount = await this.getUnreadCount(recipientType, recipientId);
          io.to(room).emit('notifications.unreadCountChanged' as any, {
            unreadCount,
            recipientId,
          });
        }
      } catch (e) {}
      return true;
    }
    return false;
  }

  /**
   * Exponential backoff retry handler for failed email and SMS deliveries
   */
  async retryFailedDeliveries(maxBatch = 20): Promise<{ retried: number; succeeded: number; failed: number }> {
    const pendingDeliveries = await NotificationDelivery.find({
      status: { $in: [DeliveryStatus.PENDING, DeliveryStatus.FAILED] },
      attempts: { $lt: 3 },
      $or: [{ nextAttemptAt: { $exists: false } }, { nextAttemptAt: { $lte: new Date() } }],
    })
      .limit(maxBatch)
      .populate('notificationId');

    let succeeded = 0;
    let failed = 0;

    for (const delivery of pendingDeliveries) {
      delivery.attempts += 1;
      delivery.lastAttemptAt = new Date();
      const notif = delivery.notificationId as any;

      if (!notif) {
        delivery.status = DeliveryStatus.FAILED;
        delivery.failureReason = 'Parent notification document not found';
        await delivery.save();
        failed++;
        continue;
      }

      if (delivery.channel === DeliveryChannel.EMAIL) {
        try {
          const res = await emailService.sendNotificationEmail({
            toEmail: delivery.recipientDestination,
            title: notif.title,
            message: notif.message,
            link: notif.link,
            category: notif.category,
          });
          if (res.delivered) {
            delivery.status = DeliveryStatus.DELIVERED;
            delivery.deliveredAt = new Date();
            delivery.providerMessageId = res.messageId;
            succeeded++;
          } else {
            delivery.status = DeliveryStatus.FAILED;
            delivery.failureReason = res.error || 'Retry delivery failed';
            delivery.nextAttemptAt = new Date(Date.now() + 60000 * Math.pow(2, delivery.attempts));
            failed++;
          }
        } catch (err: any) {
          delivery.status = DeliveryStatus.FAILED;
          delivery.failureReason = err?.message || 'Retry exception';
          delivery.nextAttemptAt = new Date(Date.now() + 60000 * Math.pow(2, delivery.attempts));
          failed++;
        }
      } else if (delivery.channel === DeliveryChannel.SMS) {
        try {
          const res = await smsService.sendSms({
            toPhone: delivery.recipientDestination,
            message: `${notif.title}: ${notif.message}`,
          });
          if (res.delivered) {
            delivery.status = DeliveryStatus.DELIVERED;
            delivery.deliveredAt = new Date();
            delivery.providerMessageId = res.messageId;
            succeeded++;
          } else {
            delivery.status = DeliveryStatus.FAILED;
            delivery.failureReason = res.error || 'Retry SMS failed';
            delivery.nextAttemptAt = new Date(Date.now() + 60000 * Math.pow(2, delivery.attempts));
            failed++;
          }
        } catch (err: any) {
          delivery.status = DeliveryStatus.FAILED;
          delivery.failureReason = err?.message || 'Retry SMS exception';
          delivery.nextAttemptAt = new Date(Date.now() + 60000 * Math.pow(2, delivery.attempts));
          failed++;
        }
      }

      await delivery.save();
    }

    return {
      retried: pendingDeliveries.length,
      succeeded,
      failed,
    };
  }

  /**
   * Administrator Delivery Tracking and Metrics Overview
   */
  async getDeliveryMetrics(params?: {
    channel?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    stats: {
      totalDeliveries: number;
      deliveredCount: number;
      pendingCount: number;
      failedCount: number;
      inAppCount: number;
      emailCount: number;
      smsCount: number;
      successRate: number;
    };
    deliveries: INotificationDeliveryDocument[];
    page: number;
    totalPages: number;
    total: number;
  }> {
    const page = Math.max(1, params?.page || 1);
    const limit = params?.limit || 25;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (params?.channel && params.channel !== 'all') {
      query.channel = params.channel.toUpperCase();
    }
    if (params?.status && params.status !== 'all') {
      query.status = params.status.toUpperCase();
    }

    const [
      totalDeliveries,
      deliveredCount,
      pendingCount,
      failedCount,
      inAppCount,
      emailCount,
      smsCount,
      deliveries,
      total,
    ] = await Promise.all([
      NotificationDelivery.countDocuments(),
      NotificationDelivery.countDocuments({ status: DeliveryStatus.DELIVERED }),
      NotificationDelivery.countDocuments({ status: { $in: [DeliveryStatus.PENDING, DeliveryStatus.QUEUED] } }),
      NotificationDelivery.countDocuments({ status: DeliveryStatus.FAILED }),
      NotificationDelivery.countDocuments({ channel: DeliveryChannel.IN_APP }),
      NotificationDelivery.countDocuments({ channel: DeliveryChannel.EMAIL }),
      NotificationDelivery.countDocuments({ channel: DeliveryChannel.SMS }),
      NotificationDelivery.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('notificationId')
        .lean(),
      NotificationDelivery.countDocuments(query),
    ]);

    const successRate = totalDeliveries > 0 ? Math.round((deliveredCount / totalDeliveries) * 100) : 100;

    return {
      stats: {
        totalDeliveries,
        deliveredCount,
        pendingCount,
        failedCount,
        inAppCount,
        emailCount,
        smsCount,
        successRate,
      },
      deliveries: deliveries as any,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      total,
    };
  }
}

export const notificationService = new NotificationService();
