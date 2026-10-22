import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { RecipientType } from '../types/notification';
import { StaffRole } from '../types/staff';
import { logger } from '../utils/logger';

/**
 * Helper to resolve authenticated recipient (Staff or Customer) from session
 */
const resolveRecipient = (
  req: Request
): { recipientType: RecipientType; recipientId: string; email?: string } | null => {
  const session = req.session as any;

  if (session?.staff && session.staff.id) {
    return {
      recipientType: RecipientType.STAFF,
      recipientId: session.staff.id.toString(),
      email: session.staff.email,
    };
  }

  if (session?.user && (session.user.id || session.user._id)) {
    const id = (session.user.id || session.user._id).toString();
    return {
      recipientType: RecipientType.CUSTOMER,
      recipientId: id,
      email: session.user.email,
    };
  }

  // Fallback for customer token or custom header in client if session is being restored
  const customerIdHeader = req.headers['x-customer-id'] as string;
  if (customerIdHeader) {
    return {
      recipientType: RecipientType.CUSTOMER,
      recipientId: customerIdHeader,
      email: req.headers['x-customer-email'] as string,
    };
  }

  return null;
};

/**
 * Controller: Get paginated notifications for current authenticated user
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      res.status(401).json({
        success: false,
        message: 'Authentication required to view notifications.',
      });
      return;
    }

    const { category, isRead, priority, search, page, limit } = req.query;

    const parsedIsRead =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;

    const result = await notificationService.getNotifications({
      recipientType: recipient.recipientType,
      recipientId: recipient.recipientId,
      category: category ? String(category) : undefined,
      isRead: parsedIsRead,
      priority: priority ? String(priority) : undefined,
      search: search ? String(search) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    logger.error('[NotificationController:getNotifications] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
      error: err?.message,
    });
  }
};

/**
 * Controller: Fast unread notification count
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      res.status(200).json({
        success: true,
        data: { unreadCount: 0 },
      });
      return;
    }

    const unreadCount = await notificationService.getUnreadCount(
      recipient.recipientType,
      recipient.recipientId
    );

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (err: any) {
    logger.error('[NotificationController:getUnreadCount] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count.',
      error: err?.message,
    });
  }
};

/**
 * Controller: Mark single notification as read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const { id } = req.params;
    const notification = await notificationService.markAsRead(
      id,
      recipient.recipientType,
      recipient.recipientId
    );

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found or access denied.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read.',
    });
  } catch (err: any) {
    logger.error('[NotificationController:markAsRead] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read.',
      error: err?.message,
    });
  }
};

/**
 * Controller: Mark all unread notifications as read
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const { category } = req.body;
    const result = await notificationService.markAllAsRead(
      recipient.recipientType,
      recipient.recipientId,
      category
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `Marked ${result.modifiedCount} notifications as read.`,
    });
  } catch (err: any) {
    logger.error('[NotificationController:markAllAsRead] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read.',
      error: err?.message,
    });
  }
};

/**
 * Controller: Delete/dismiss notification
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const { id } = req.params;
    const success = await notificationService.deleteNotification(
      id,
      recipient.recipientType,
      recipient.recipientId
    );

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Notification not found or access denied.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted.',
    });
  } catch (err: any) {
    logger.error('[NotificationController:deleteNotification] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification.',
      error: err?.message,
    });
  }
};

/**
 * Controller: Get notification preferences
 */
export const getPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const preferences = await notificationService.getPreferences(
      recipient.recipientType,
      recipient.recipientId
    );

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (err: any) {
    logger.error('[NotificationController:getPreferences] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification preferences.',
      error: err?.message,
    });
  }
};

/**
 * Controller: Update notification preferences
 */
export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const preferences = await notificationService.updatePreferences(
      recipient.recipientType,
      recipient.recipientId,
      req.body
    );

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully.',
    });
  } catch (err: any) {
    logger.error('[NotificationController:updatePreferences] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences.',
      error: err?.message,
    });
  }
};

/**
 * Controller: Administrator delivery metrics and monitoring logs
 */
export const getAdminDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.session as any;
    const staff = session?.staff;

    // RBAC: Requires staff authentication with ADMIN or MANAGER role
    if (!staff || (staff.role !== StaffRole.ADMIN && staff.role !== StaffRole.MANAGER)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Administrator or Manager role required.',
      });
      return;
    }

    const { channel, status, page, limit } = req.query;

    const data = await notificationService.getDeliveryMetrics({
      channel: channel ? String(channel) : undefined,
      status: status ? String(status) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 25,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    logger.error('[NotificationController:getAdminDeliveries] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve delivery logs.',
      error: err?.message,
    });
  }
};

/**
 * Controller: Admin trigger to retry failed deliveries
 */
export const retryDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.session as any;
    const staff = session?.staff;

    if (!staff || (staff.role !== StaffRole.ADMIN && staff.role !== StaffRole.MANAGER)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Administrator or Manager role required.',
      });
      return;
    }

    const result = await notificationService.retryFailedDeliveries(25);

    res.status(200).json({
      success: true,
      data: result,
      message: `Retried ${result.retried} deliveries (${result.succeeded} succeeded, ${result.failed} failed).`,
    });
  } catch (err: any) {
    logger.error('[NotificationController:retryDeliveries] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Retry operation failed.',
      error: err?.message,
    });
  }
};
