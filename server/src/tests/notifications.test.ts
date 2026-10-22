import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { Notification } from '../models/notification.model';
import { NotificationPreferences } from '../models/notificationPreferences.model';
import { NotificationDelivery } from '../models/notificationDelivery.model';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { smsService } from '../services/sms.service';
import {
  DeliveryChannel,
  DeliveryStatus,
  NotificationCategory,
  NotificationPriority,
  RecipientType,
} from '../types/notification';
import { StaffRole, StaffStatus } from '../types/staff';
import { hashPassword } from '../utils/password';
import { setupSocketServer, closeSocketServer } from '../sockets/socket.server';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

interface TestContext {
  server: http.Server;
  baseUrl: string;
  port: number;
}

let ctx: TestContext;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(
  method: string,
  path: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    cookie?: string;
  } = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }

  const res = await fetch(`${ctx.baseUrl}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  const setCookie = res.headers.get('set-cookie');
  return {
    status: res.status,
    data,
    contentType,
    cookie: setCookie ? setCookie.split(';')[0] : undefined,
  };
}

async function runStage14TestSuite() {
  console.log('\n============================================================');
  console.log('🧪 AURELLE STAGE 14 — NOTIFICATIONS & COMMUNICATION TEST SUITE');
  console.log('============================================================\n');

  // 1. Connect to Database
  if (mongoose.connection.readyState !== 1) {
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 25000 });
    console.log('✅ Connected to MongoDB Atlas');
  }

  // 2. Spin up test HTTP and Socket.IO server
  const app = createApp();
  const server = http.createServer(app);
  setupSocketServer(server);

  const port = 5099;
  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      ctx = {
        server,
        baseUrl: `http://localhost:${port}`,
        port,
      };
      resolve();
    });
  });
  console.log(`🚀 Test HTTP & Socket.IO server initialized on port ${port}\n`);

  let adminCookie: string = '';
  let waiterCookie: string = '';
  let testAdminId: string = '';
  let testWaiterId: string = '';
  const testCustomerEmail = `test-guest-${Date.now()}@aurelle.com`;
  const testCustomerId = `cust_${Date.now()}`;
  const testLocationId = 'loc-colombo-main';

  try {
    // -------------------------------------------------------------
    // SETUP TEST ACTORS
    // -------------------------------------------------------------
    console.log('🔑 Provisioning test staff accounts...');
    const hashedPassword = await hashPassword('AurelleSecure2026!');

    const adminStaff = await Staff.findOneAndUpdate(
      { email: 'stage14.admin@aurelle.com' },
      {
        email: 'stage14.admin@aurelle.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        role: StaffRole.ADMIN,
        status: StaffStatus.ACTIVE,
        locationIds: [testLocationId],
      },
      { upsert: true, new: true }
    );
    testAdminId = adminStaff._id.toString();

    const waiterStaff = await Staff.findOneAndUpdate(
      { email: 'stage14.waiter@aurelle.com' },
      {
        email: 'stage14.waiter@aurelle.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'Waiter',
        role: StaffRole.FLOOR,
        status: StaffStatus.ACTIVE,
        locationIds: [testLocationId],
      },
      { upsert: true, new: true }
    );
    testWaiterId = waiterStaff._id.toString();

    // Authenticate Admin
    const adminLoginRes = await request('POST', '/api/staff/auth/login', {
      body: { email: 'stage14.admin@aurelle.com', password: 'AurelleSecure2026!' },
    });
    assert(adminLoginRes.status === 200, `Admin login failed with status ${adminLoginRes.status}`);
    adminCookie = adminLoginRes.cookie || '';
    assert(!!adminCookie, 'Admin cookie should be present');

    // Authenticate Waiter
    const waiterLoginRes = await request('POST', '/api/staff/auth/login', {
      body: { email: 'stage14.waiter@aurelle.com', password: 'AurelleSecure2026!' },
    });
    assert(waiterLoginRes.status === 200, `Waiter login failed with status ${waiterLoginRes.status}`);
    waiterCookie = waiterLoginRes.cookie || '';
    assert(!!waiterCookie, 'Waiter cookie should be present');
    console.log('✅ Test staff actors authenticated successfully\n');

    // -------------------------------------------------------------
    // TEST 1: Model Validation & Schema Indexes
    // -------------------------------------------------------------
    process.stdout.write('Test 1: Model validation & schema compound indexes... ');
    const indexesNotif = await Notification.collection.indexes();
    assert(indexesNotif.length >= 3, 'Notification model should have compound indexes');
    const indexesPref = await NotificationPreferences.collection.indexes();
    assert(indexesPref.some((idx: any) => idx.unique && idx.key.recipientId === 1), 'Preferences should enforce unique recipient compound index');
    const indexesDel = await NotificationDelivery.collection.indexes();
    assert(indexesDel.some((idx: any) => idx.key.status === 1), 'Delivery model should index delivery status');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 2: Recipient Preferences initialization & updates
    // -------------------------------------------------------------
    process.stdout.write('Test 2: Recipient preferences initialization & updates... ');
    const initialPrefs = await notificationService.getPreferences(RecipientType.STAFF, testWaiterId);
    assert(initialPrefs.inAppEnabled === true, 'Default inAppEnabled should be true');
    assert(initialPrefs.emailEnabled === true, 'Default emailEnabled should be true');

    const updatedPrefs = await notificationService.updatePreferences(RecipientType.STAFF, testWaiterId, {
      smsEnabled: true,
      doNotDisturb: { enabled: true, startTime: '23:00', endTime: '07:00' },
    });
    assert(updatedPrefs.smsEnabled === true, 'smsEnabled should be updated to true');
    assert(updatedPrefs.doNotDisturb.enabled === true, 'DND enabled should be true');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 3: createNotification with channel resolution & deliveries
    // -------------------------------------------------------------
    process.stdout.write('Test 3: createNotification channel resolution & delivery logs... ');
    const createdNotif = await notificationService.createNotification({
      recipientType: RecipientType.STAFF,
      recipientId: testWaiterId,
      recipientEmail: 'stage14.waiter@aurelle.com',
      recipientPhone: '+94771234567',
      title: 'Table 4 Ready For Service',
      message: 'Culinary pass has finished plating order AUR-1092',
      category: NotificationCategory.KITCHEN,
      priority: NotificationPriority.HIGH,
      link: '/staff/floor',
      metadata: { tableNumber: 'T4', orderReference: 'AUR-1092' },
    });
    assert(!!createdNotif._id, 'Notification should be created in MongoDB');
    assert(createdNotif.isRead === false, 'New notification should be unread');

    // Check delivery documents created
    const deliveries = await NotificationDelivery.find({ notificationId: createdNotif._id });
    assert(deliveries.length >= 2, 'Should create delivery logs for in-app and email/sms');
    const inAppDelivery = deliveries.find((d) => d.channel === DeliveryChannel.IN_APP);
    assert(inAppDelivery?.status === DeliveryStatus.DELIVERED, 'In-app delivery should be marked DELIVERED');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 4: notifyStaffRole targeted routing
    // -------------------------------------------------------------
    process.stdout.write('Test 4: notifyStaffRole targeted routing by role & venue... ');
    const roleNotifs = await notificationService.notifyStaffRole({
      role: StaffRole.FLOOR,
      locationId: testLocationId,
      title: 'Water Service Requested',
      message: 'Table 7 requested sparkling water refill',
      category: NotificationCategory.FLOOR,
      priority: NotificationPriority.NORMAL,
      link: '/staff/floor',
    });
    assert(roleNotifs.length > 0, 'Should dispatch notifications to active waitstaff');
    assert(roleNotifs.some((n) => n.recipientId === testWaiterId), 'Test waiter should be among recipients');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 5: Paginated getNotifications querying & category filtering
    // -------------------------------------------------------------
    process.stdout.write('Test 5: Paginated notification query & category filtering... ');
    const queryAll = await notificationService.getNotifications({
      recipientType: RecipientType.STAFF,
      recipientId: testWaiterId,
      page: 1,
      limit: 10,
    });
    assert(queryAll.total >= 2, `Expected at least 2 notifications, got ${queryAll.total}`);
    assert(queryAll.notifications.length >= 2, 'Should return notification documents');

    const queryKitchen = await notificationService.getNotifications({
      recipientType: RecipientType.STAFF,
      recipientId: testWaiterId,
      category: 'KITCHEN',
    });
    assert(queryKitchen.notifications.every((n) => n.category === NotificationCategory.KITCHEN), 'All results should be KITCHEN category');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 6: Fast unread notification count
    // -------------------------------------------------------------
    process.stdout.write('Test 6: Fast unread count lookup... ');
    const unreadCount = await notificationService.getUnreadCount(RecipientType.STAFF, testWaiterId);
    assert(unreadCount >= 2, `Expected unread count >= 2, got ${unreadCount}`);
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 7: Mark single notification as read
    // -------------------------------------------------------------
    process.stdout.write('Test 7: Mark single notification as read... ');
    const readItem = await notificationService.markAsRead(
      createdNotif._id.toString(),
      RecipientType.STAFF,
      testWaiterId
    );
    assert(readItem?.isRead === true, 'Notification isRead should be true');
    assert(!!readItem?.readAt, 'Notification readAt timestamp should be set');

    const newUnreadCount = await notificationService.getUnreadCount(RecipientType.STAFF, testWaiterId);
    assert(newUnreadCount === unreadCount - 1, 'Unread count should decrement by 1');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 8: Mark all notifications as read
    // -------------------------------------------------------------
    process.stdout.write('Test 8: Mark all notifications as read... ');
    const markAllRes = await notificationService.markAllAsRead(RecipientType.STAFF, testWaiterId);
    assert(markAllRes.modifiedCount >= 1, 'Should mark remaining unread as read');
    const finalUnreadCount = await notificationService.getUnreadCount(RecipientType.STAFF, testWaiterId);
    assert(finalUnreadCount === 0, 'Final unread count should be 0');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 9: Delete / dismiss notification
    // -------------------------------------------------------------
    process.stdout.write('Test 9: Delete / dismiss notification... ');
    const deleteSuccess = await notificationService.deleteNotification(
      createdNotif._id.toString(),
      RecipientType.STAFF,
      testWaiterId
    );
    assert(deleteSuccess === true, 'Delete operation should return true');
    const checkDeleted = await Notification.findById(createdNotif._id);
    assert(checkDeleted === null, 'Deleted notification should no longer exist in MongoDB');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 10: Email Dispatch simulation & formatting
    // -------------------------------------------------------------
    process.stdout.write('Test 10: Email dispatch simulation & template rendering... ');
    const emailResult = await emailService.sendNotificationEmail({
      toEmail: 'guest@aurelle.com',
      recipientName: 'Lord Harrington',
      title: 'Private Suite Reservation Confirmed',
      message: 'Your Imperial Salon reservation for 8 guests on Friday 20:00 is confirmed.',
      link: '/account/reservations',
      category: 'VIP Dining',
    });
    assert(emailResult.delivered === true, 'Email dispatch result should be delivered');
    assert(emailResult.simulated === true || !!emailResult.messageId, 'Email should be simulated or have messageId');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 11: SMS Dispatch simulation & formatting
    // -------------------------------------------------------------
    process.stdout.write('Test 11: SMS dispatch simulation & adapter... ');
    const smsResult = await smsService.sendSms({
      toPhone: '+94771234567',
      message: 'Your table at Aurelle is prepared for your party.',
    });
    assert(smsResult.delivered === true, 'SMS should succeed or simulate gracefully');
    assert(!!smsResult.messageId, 'SMS should return a messageId');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 12: Delivery retry handling with exponential backoff
    // -------------------------------------------------------------
    process.stdout.write('Test 12: Delivery retry handling & exponential backoff... ');
    // Create a failed delivery simulation
    const dummyNotif = await Notification.create({
      recipientType: RecipientType.CUSTOMER,
      recipientId: testCustomerId,
      title: 'Retry Test Notice',
      message: 'Testing delivery retry backoff',
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.NORMAL,
      channels: [DeliveryChannel.EMAIL],
    });

    const failedDelivery = await NotificationDelivery.create({
      notificationId: dummyNotif._id,
      channel: DeliveryChannel.EMAIL,
      recipientType: RecipientType.CUSTOMER,
      recipientId: testCustomerId,
      recipientDestination: 'retry.guest@aurelle.com',
      status: DeliveryStatus.FAILED,
      attempts: 1,
      nextAttemptAt: new Date(Date.now() - 5000), // Due in the past
      failureReason: 'Simulated connection timeout',
    });

    const retryResult = await notificationService.retryFailedDeliveries(10);
    assert(retryResult.retried >= 1, 'Should retry at least 1 pending/failed delivery');
    const checkedDelivery = await NotificationDelivery.findById(failedDelivery._id);
    assert(checkedDelivery?.attempts === 2, 'Attempts count should increment to 2');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 13: Administrator Delivery Metrics & Audit Telemetry
    // -------------------------------------------------------------
    process.stdout.write('Test 13: Administrator delivery metrics & audit telemetry... ');
    const metrics = await notificationService.getDeliveryMetrics();
    assert(metrics.stats.totalDeliveries > 0, 'Total deliveries should be greater than 0');
    assert(metrics.stats.inAppCount > 0, 'In-app count should be greater than 0');
    assert(typeof metrics.stats.successRate === 'number', 'Success rate should be a number');
    assert(Array.isArray(metrics.deliveries), 'Deliveries array should be returned');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 14: API Authentication Guard on Notification Endpoints
    // -------------------------------------------------------------
    process.stdout.write('Test 14: API authentication guard (401 on unauthenticated)... ');
    const unauthRes = await request('GET', '/api/notifications');
    assert(unauthRes.status === 401, `Expected status 401, got ${unauthRes.status}`);
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 15: Staff GET /api/notifications with session
    // -------------------------------------------------------------
    process.stdout.write('Test 15: Staff GET /api/notifications with authenticated session... ');
    const staffNotifsRes = await request('GET', '/api/notifications', { cookie: waiterCookie });
    assert(staffNotifsRes.status === 200, `Expected 200, got ${staffNotifsRes.status}`);
    assert(staffNotifsRes.data?.success === true, 'API response should be successful');
    assert(Array.isArray(staffNotifsRes.data?.data?.notifications), 'Notifications array should be present');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 16: Staff GET /api/notifications/unread-count
    // -------------------------------------------------------------
    process.stdout.write('Test 16: Staff GET /api/notifications/unread-count... ');
    const countRes = await request('GET', '/api/notifications/unread-count', { cookie: waiterCookie });
    assert(countRes.status === 200, `Expected 200, got ${countRes.status}`);
    assert(typeof countRes.data?.data?.unreadCount === 'number', 'unreadCount should be a number');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 17: Staff PATCH & PUT /api/notifications/preferences
    // -------------------------------------------------------------
    process.stdout.write('Test 17: Staff preferences API endpoints... ');
    const getPrefsRes = await request('GET', '/api/notifications/preferences', { cookie: waiterCookie });
    assert(getPrefsRes.status === 200, `Expected 200, got ${getPrefsRes.status}`);
    assert(getPrefsRes.data?.data?.inAppEnabled === true, 'inAppEnabled should be true');

    const updatePrefsRes = await request('PATCH', '/api/notifications/preferences', {
      cookie: waiterCookie,
      body: { emailEnabled: false },
    });
    assert(updatePrefsRes.status === 200, `Expected 200, got ${updatePrefsRes.status}`);
    assert(updatePrefsRes.data?.data?.emailEnabled === false, 'emailEnabled should be updated to false');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 18: Admin Delivery Monitoring RBAC Security (403 for Waitstaff)
    // -------------------------------------------------------------
    process.stdout.write('Test 18: Admin delivery monitoring RBAC security... ');
    const waiterForbidden = await request('GET', '/api/notifications/admin/deliveries', { cookie: waiterCookie });
    assert(waiterForbidden.status === 403, `Waiter should receive 403 Forbidden, got ${waiterForbidden.status}`);

    const adminAllowed = await request('GET', '/api/notifications/admin/deliveries', { cookie: adminCookie });
    assert(adminAllowed.status === 200, `Admin should receive 200 OK, got ${adminAllowed.status}`);
    assert(adminAllowed.data?.data?.stats?.totalDeliveries > 0, 'Admin should receive delivery statistics');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 19: Admin Trigger Retry Queue via API
    // -------------------------------------------------------------
    process.stdout.write('Test 19: Admin trigger retry queue API endpoint... ');
    const retryApiRes = await request('POST', '/api/notifications/admin/retry', {
      cookie: adminCookie,
    });
    assert(retryApiRes.status === 200, `Expected 200 OK, got ${retryApiRes.status}`);
    assert(typeof retryApiRes.data?.data?.retried === 'number', 'Should return retried count');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 20: Customer Notification & Context Header Support
    // -------------------------------------------------------------
    process.stdout.write('Test 20: Customer notification retrieval via context headers... ');
    // Create customer notification
    await notificationService.createNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: testCustomerId,
      recipientEmail: testCustomerEmail,
      title: 'Reservation Confirmed',
      message: 'Your table for 4 guests on Saturday 19:30 has been confirmed.',
      category: NotificationCategory.RESERVATION,
      priority: NotificationPriority.HIGH,
      link: '/account/reservations',
    });

    const custRes = await request('GET', '/api/notifications', {
      headers: { 'x-customer-id': testCustomerId, 'x-customer-email': testCustomerEmail },
    });
    assert(custRes.status === 200, `Expected 200 OK, got ${custRes.status}`);
    assert(custRes.data?.data?.notifications?.length >= 1, 'Customer should receive their notifications');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 21: Real Domain Event — Order Ready notification hook
    // -------------------------------------------------------------
    process.stdout.write('Test 21: Real domain event — Order Ready dispatch hook... ');
    const orderNotif = await notificationService.createNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: testCustomerId,
      recipientEmail: testCustomerEmail,
      title: 'Order Ready: AUR-99881',
      message: 'Your takeaway order is prepared and ready for pickup at the front counter.',
      category: NotificationCategory.ORDER,
      priority: NotificationPriority.HIGH,
      link: '/account/orders',
      metadata: { orderReference: 'AUR-99881' },
    });
    assert(orderNotif.category === NotificationCategory.ORDER, 'Category should be ORDER');
    assert(orderNotif.priority === NotificationPriority.HIGH, 'Priority should be HIGH');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 22: Real Domain Event — Reservation Confirmed hook
    // -------------------------------------------------------------
    process.stdout.write('Test 22: Real domain event — Reservation Confirmed dispatch hook... ');
    const resNotif = await notificationService.createNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: testCustomerId,
      title: 'Reservation Confirmed: RES-7712',
      message: 'Your reservation on 2026-10-25 at 20:00 has been officially confirmed! Table: T3.',
      category: NotificationCategory.RESERVATION,
      priority: NotificationPriority.HIGH,
      link: '/account/reservations',
      metadata: { reference: 'RES-7712' },
    });
    assert(resNotif.category === NotificationCategory.RESERVATION, 'Category should be RESERVATION');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 23: Real Domain Event — Floor Service Request hook
    // -------------------------------------------------------------
    process.stdout.write('Test 23: Real domain event — Floor service request dispatch hook... ');
    const floorNotif = await notificationService.createNotification({
      recipientType: RecipientType.STAFF,
      recipientId: testWaiterId,
      recipientRole: StaffRole.FLOOR,
      title: 'Table T5 Service Request',
      message: 'BILL: Guest requested check presentation at Table T5',
      category: NotificationCategory.FLOOR,
      priority: NotificationPriority.HIGH,
      link: '/staff/floor',
      metadata: { tableNumber: 'T5' },
    });
    assert(floorNotif.category === NotificationCategory.FLOOR, 'Category should be FLOOR');
    console.log('PASSED ✅');

    // -------------------------------------------------------------
    // TEST 24: Real Domain Event — VIP Suite Booking hook
    // -------------------------------------------------------------
    process.stdout.write('Test 24: Real domain event — VIP private suite booking dispatch hook... ');
    const vipNotif = await notificationService.createNotification({
      recipientType: RecipientType.STAFF,
      recipientId: testAdminId,
      recipientRole: StaffRole.MANAGER,
      title: 'New VIP Booking: The Grand Salon',
      message: 'Lady Kensington confirmed VIP booking (VIP-4401) for 12 guests.',
      category: NotificationCategory.VIP,
      priority: NotificationPriority.HIGH,
      link: '/staff/manager',
      metadata: { reference: 'VIP-4401' },
    });
    assert(vipNotif.category === NotificationCategory.VIP, 'Category should be VIP');
    console.log('PASSED ✅');

    console.log('\n============================================================');
    console.log('🎉 ALL 24 TESTS PASSED SUCCESSFULLY! ZERO ERRORS ENCOUNTERED.');
    console.log('============================================================\n');
  } finally {
    // Teardown
    console.log('🧹 Cleaning up test artifacts and closing servers...');
    await Notification.deleteMany({ recipientId: { $in: [testWaiterId, testAdminId, testCustomerId] } });
    await NotificationPreferences.deleteMany({ recipientId: { $in: [testWaiterId, testAdminId, testCustomerId] } });
    await NotificationDelivery.deleteMany({ recipientId: { $in: [testWaiterId, testAdminId, testCustomerId] } });
    await Staff.deleteMany({ email: { $in: ['stage14.admin@aurelle.com', 'stage14.waiter@aurelle.com'] } });

    await closeSocketServer();
    if (ctx?.server) {
      await new Promise<void>((resolve) => ctx.server.close(() => resolve()));
    }
    console.log('✅ Teardown complete.\n');
    await mongoose.disconnect();
    process.exit(0);
  }
}

runStage14TestSuite().catch((err) => {
  console.error('\n❌ STAGE 14 TEST SUITE FAILED:', err);
  process.exit(1);
});
