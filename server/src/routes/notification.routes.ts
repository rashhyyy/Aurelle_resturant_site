import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  getAdminDeliveries,
  retryDeliveries,
} from '../controllers/notification.controller';

const router = Router();

// Recipient notifications & unread state
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

// Notification channel & category preferences
router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);
router.put('/preferences', updatePreferences);

// Administrator notification delivery monitoring & retry queue
router.get('/admin/deliveries', getAdminDeliveries);
router.post('/admin/retry', retryDeliveries);

export const notificationRoutes = router;
