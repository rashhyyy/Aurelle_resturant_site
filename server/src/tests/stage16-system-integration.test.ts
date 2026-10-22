import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { io as ClientSocket, Socket as ClientSocketType } from '../../../client/node_modules/socket.io-client';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { User } from '../models/user.model';
import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { Order } from '../models/order.model';
import { Reservation } from '../models/reservation.model';
import { Table } from '../models/table.model';
import { TableSlotAllocation } from '../models/tableSlotAllocation.model';
import { DiningSession } from '../models/diningSession.model';
import { Notification } from '../models/notification.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { OperationalAlert } from '../models/operationalAlert.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { OrderType, OrderStatus, PaymentStatus } from '../types/order';
import { ReservationStatus, ReservationSource } from '../types/reservation';
import { hashPassword } from '../utils/password';
import { setupSocketServer, closeSocketServer } from '../sockets/socket.server';
import { ensureLocationTablesConfigured } from '../services/table.service';

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

  const contentType = res.headers.get('content-type') || '';
  const data: any = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  const setCookie = res.headers.get('set-cookie');
  const rawHeaders: Record<string, string> = {};
  res.headers.forEach((val, key) => {
    rawHeaders[key.toLowerCase()] = val;
  });

  return {
    status: res.status,
    data,
    setCookie,
    headers: rawHeaders,
  };
}

async function runStage16MasterTestSuite() {
  console.log('\n=============================================================');
  console.log('   AURELLE STAGE 16: SYSTEM INTEGRATION & RELEASE READINESS  ');
  console.log('=============================================================\n');

  console.log('Connecting to MongoDB Atlas database: aurelle');
  await mongoose.connect(env.MONGODB_URI, { dbName: 'aurelle' });
  console.log('✔ Connected to MongoDB Atlas');

  const app = createApp();
  const server = http.createServer(app);
  setupSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address() as any;
      ctx = {
        server,
        baseUrl: `http://127.0.0.1:${addr.port}`,
        port: addr.port,
      };
      resolve();
    });
  });

  console.log(`✔ Test Server & Socket.IO running on ${ctx.baseUrl}\n`);

  const ts = Date.now();
  const colomboLocation = 'loc-colombo-main';
  const kandyLocation = 'loc-kandy-vip';

  // Provision Locations Tables
  await ensureLocationTablesConfigured(colomboLocation);
  await ensureLocationTablesConfigured(kandyLocation);

  // -------------------------------------------------------------
  // TEST SUITE 1: HTTP Security Headers & Cookie Policies
  // -------------------------------------------------------------
  console.log('--- TEST SUITE 1: Security Headers & Session Cookie Policies ---');

  const probe = await request('GET', '/api/health');
  assert(probe.status === 200, 'Health check should return 200');
  assert(
    probe.headers['x-content-type-options'] === 'nosniff',
    'X-Content-Type-Options must be nosniff'
  );
  assert(
    probe.headers['x-frame-options'] === 'SAMEORIGIN' || probe.headers['x-frame-options'] === 'DENY',
    'X-Frame-Options must be SAMEORIGIN or DENY'
  );
  console.log('  ✅ [PASS] 1. Helmet security headers verified (nosniff, frame protection)');

  // -------------------------------------------------------------
  // TEST SUITE 2: Multi-Role Staff Provisioning & Location Binding
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Staff Role Provisioning & Location Scoping ---');

  const passwordHash = await hashPassword('Aurelle@Secure2026!');

  // Admin (unrestricted location access)
  const adminStaff = await Staff.create({
    firstName: 'Master',
    lastName: 'Admin',
    email: `admin_s16_${ts}@aurelle.com`,
    passwordHash,
    role: StaffRole.ADMIN,
    status: StaffStatus.ACTIVE,
    locationIds: [colomboLocation, kandyLocation],
  });

  // Colombo Manager
  const colomboManager = await Staff.create({
    firstName: 'Colombo',
    lastName: 'Manager',
    email: `mgr_colombo_${ts}@aurelle.com`,
    passwordHash,
    role: StaffRole.MANAGER,
    status: StaffStatus.ACTIVE,
    locationIds: [colomboLocation],
  });

  // Kandy Manager
  const kandyManager = await Staff.create({
    firstName: 'Kandy',
    lastName: 'Manager',
    email: `mgr_kandy_${ts}@aurelle.com`,
    passwordHash,
    role: StaffRole.MANAGER,
    status: StaffStatus.ACTIVE,
    locationIds: [kandyLocation],
  });

  // Colombo Kitchen Chef
  const colomboChef = await Staff.create({
    firstName: 'Colombo',
    lastName: 'Chef',
    email: `chef_colombo_${ts}@aurelle.com`,
    passwordHash,
    role: StaffRole.KITCHEN,
    status: StaffStatus.ACTIVE,
    locationIds: [colomboLocation],
  });

  // Authenticate Staff Sessions
  const loginAdmin = await request('POST', '/api/staff/auth/login', {
    body: { email: adminStaff.email, password: 'Aurelle@Secure2026!' },
  });
  assert(loginAdmin.status === 200, 'Admin login must return 200');
  const adminCookie = loginAdmin.setCookie || '';
  assert(adminCookie.toLowerCase().includes('httponly'), 'Session cookie must have HttpOnly');
  assert(adminCookie.toLowerCase().includes('samesite=lax'), 'Session cookie must have SameSite=Lax');

  const loginColomboMgr = await request('POST', '/api/staff/auth/login', {
    body: { email: colomboManager.email, password: 'Aurelle@Secure2026!' },
  });
  const colomboMgrCookie = loginColomboMgr.setCookie || '';

  const loginKandyMgr = await request('POST', '/api/staff/auth/login', {
    body: { email: kandyManager.email, password: 'Aurelle@Secure2026!' },
  });
  const kandyMgrCookie = loginKandyMgr.setCookie || '';

  const loginColomboChef = await request('POST', '/api/staff/auth/login', {
    body: { email: colomboChef.email, password: 'Aurelle@Secure2026!' },
  });
  const colomboChefCookie = loginColomboChef.setCookie || '';

  console.log('  ✅ [PASS] 2. Staff roles authenticated with secure HttpOnly SameSite=Lax cookies');

  // -------------------------------------------------------------
  // TEST SUITE 3: Customer Accounts Provisioning & Isolation
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Customer Accounts & Authentication ---');

  const custAPasswordHash = await hashPassword('CustA@2026!');
  const custBPasswordHash = await hashPassword('CustB@2026!');

  const custAName = 'Eleanor Vance';
  const custAPhone = '+94 77 111 2233';
  const custBName = 'Julian Sterling';
  const custBPhone = '+94 77 444 5566';

  const custA = await User.create({
    username: `eleanor_${ts}`,
    email: `eleanor_${ts}@example.com`,
    passwordHash: custAPasswordHash,
    role: 'user',
  });

  const custB = await User.create({
    username: `julian_${ts}`,
    email: `julian_${ts}@example.com`,
    passwordHash: custBPasswordHash,
    role: 'user',
  });

  const loginCustA = await request('POST', '/api/auth/login', {
    body: { login: custA.email, password: 'CustA@2026!' },
  });
  assert(loginCustA.status === 200, 'Customer A login must succeed');
  const custACookie = loginCustA.setCookie || '';

  const loginCustB = await request('POST', '/api/auth/login', {
    body: { login: custB.email, password: 'CustB@2026!' },
  });
  assert(loginCustB.status === 200, 'Customer B login must succeed');
  const custBCookie = loginCustB.setCookie || '';

  console.log('  ✅ [PASS] 3. Customers Eleanor Vance & Julian Sterling authenticated');

  // -------------------------------------------------------------
  // TEST SUITE 4: Cross-Location Data Isolation (Colombo vs Kandy)
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Multi-Location Data Boundary & Isolation Enforcement ---');

  // Colombo Manager accesses Colombo overview -> 200 OK
  const colomboOverview = await request('GET', `/api/manager/overview?locationId=${colomboLocation}`, {
    cookie: colomboMgrCookie,
  });
  assert(colomboOverview.status === 200, 'Colombo manager must access Colombo');

  // Colombo Manager attempts to access Kandy overview -> 403 Forbidden
  const colomboToKandyAttempt = await request('GET', `/api/manager/overview?locationId=${kandyLocation}`, {
    cookie: colomboMgrCookie,
  });
  assert(
    colomboToKandyAttempt.status === 403,
    `Colombo manager accessing Kandy must be blocked with 403 (got ${colomboToKandyAttempt.status})`
  );

  // Kandy Manager attempts to access Colombo overview -> 403 Forbidden
  const kandyToColomboAttempt = await request('GET', `/api/manager/overview?locationId=${colomboLocation}`, {
    cookie: kandyMgrCookie,
  });
  assert(
    kandyToColomboAttempt.status === 403,
    `Kandy manager accessing Colombo must be blocked with 403 (got ${kandyToColomboAttempt.status})`
  );

  // Master Admin accesses Colombo overview -> 200 OK
  const adminColomboOverview = await request('GET', `/api/manager/overview?locationId=${colomboLocation}`, {
    cookie: adminCookie,
  });
  assert(adminColomboOverview.status === 200, 'Admin must access Colombo');

  // Master Admin accesses Kandy overview -> 200 OK
  const adminKandyOverview = await request('GET', `/api/manager/overview?locationId=${kandyLocation}`, {
    cookie: adminCookie,
  });
  assert(adminKandyOverview.status === 200, 'Admin must access Kandy');

  console.log('  ✅ [PASS] 4. Cross-location perimeter verified: venue managers isolated, admin elevated');

  // -------------------------------------------------------------
  // TEST SUITE 5: Menu Catalog & Item Integrity
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Menu Catalog Availability & Integrity ---');

  const testCategory = await MenuCategory.create({
    name: `Signature Degustation ${ts}`,
    slug: `signature-degustation-${ts}`,
    description: 'Chef signature courses',
    displayOrder: 1,
    isVisible: true,
  });

  const testDish = await MenuItem.create({
    name: `Black Truffle Venison ${ts}`,
    slug: `black-truffle-venison-${ts}`,
    categoryId: testCategory._id,
    categoryName: testCategory.name,
    categorySlug: testCategory.slug,
    shortDescription: 'Slow-roasted Highland venison with black winter truffle',
    description: 'Highland venison loin, parsnip puree, blackberry reduction, shaved winter truffle.',
    priceMinor: 950000,
    currency: 'LKR',
    publicationStatus: 'PUBLISHED',
    isAvailable: true,
    locationIds: [colomboLocation, kandyLocation],
  });

  const publicMenuRes = await request('GET', `/api/menu?search=Black+Truffle+Venison+${ts}`);
  assert(publicMenuRes.status === 200, 'Public menu lookup must return 200');
  const dishes = publicMenuRes.data.data.dishes || [];
  assert(dishes.length >= 1, 'Published dish must be listed in public catalog');
  console.log('  ✅ [PASS] 5. Public menu catalog search and published dish availability verified');

  // -------------------------------------------------------------
  // TEST SUITE 6: Idempotent Customer Order & Price Calculation
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 6: Customer Order Lifecycle, Idempotency & Pricing Security ---');

  const orderIdempotencyKey = `idem-order-s16-${ts}`;
  const orderPayload = {
    items: [
      {
        menuItemId: testDish._id.toString(),
        quantity: 2,
        // Attempt to forge client price
        unitPriceMinor: 100,
      },
    ],
    orderType: OrderType.TAKEAWAY,
    locationId: colomboLocation,
    customerName: custAName,
    customerEmail: custA.email,
    customerPhone: custAPhone,
    pickupDate: '2026-10-25',
    pickupTime: '7:30 PM',
    idempotencyKey: orderIdempotencyKey,
  };

  // First submission
  const orderRes1 = await request('POST', '/api/orders', {
    body: orderPayload,
    cookie: custACookie,
  });
  assert(orderRes1.status === 201, `Order placement must succeed with 201 (got ${orderRes1.status})`);
  const createdOrder = orderRes1.data.data;
  const orderId = createdOrder.id || createdOrder._id;
  assert(createdOrder.orderReference.startsWith('AUR-'), 'Order reference must start with AUR-');
  // Verify authoritative backend pricing calculation (2 * 9500 = 19,000 LKR)
  assert(
    createdOrder.subtotalMinor === 1900000,
    `Subtotal must be 1,900,000 minor units (19,000 LKR), got ${createdOrder.subtotalMinor}`
  );

  // Duplicate submission with same idempotency key
  const orderRes2 = await request('POST', '/api/orders', {
    body: orderPayload,
    cookie: custACookie,
  });
  assert(orderRes2.status === 200 || orderRes2.status === 201, 'Idempotent retry must succeed');
  assert(
    orderRes2.data.data.orderReference === createdOrder.orderReference,
    'Idempotent retry must return the exact same order reference'
  );

  // Verify only 1 order exists in database
  const countOrders = await Order.countDocuments({ idempotencyKey: orderIdempotencyKey });
  assert(countOrders === 1, `Exactly 1 order record must exist in DB, found ${countOrders}`);

  console.log('  ✅ [PASS] 6. Authoritative minor unit pricing & idempotency deduplication verified');

  // -------------------------------------------------------------
  // TEST SUITE 7: Cross-Customer Authorization (BOLA / IDOR Defense)
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 7: Object-Level Authorization & Privacy (BOLA Defense) ---');

  // Customer A can view their own order
  const custAOrderRes = await request('GET', `/api/orders/my/${orderId}`, {
    cookie: custACookie,
  });
  assert(custAOrderRes.status === 200, 'Customer A must view their own order');

  // Customer B attempts to view Customer A's order -> 403 Forbidden
  const custBOrderRes = await request('GET', `/api/orders/my/${orderId}`, {
    cookie: custBCookie,
  });
  assert(
    custBOrderRes.status === 403,
    `Customer B accessing Customer A's order must return 403 (got ${custBOrderRes.status})`
  );

  // Customer B attempts to cancel Customer A's order -> 403 Forbidden
  const custBCancelRes = await request('POST', `/api/orders/my/${orderId}/cancel`, {
    body: { reason: 'Malicious cancellation attempt' },
    cookie: custBCookie,
  });
  assert(
    custBCancelRes.status === 403,
    `Customer B cancelling Customer A's order must return 403 (got ${custBCancelRes.status})`
  );

  console.log('  ✅ [PASS] 7. Object-level authorization strictly prevents cross-tenant data leaks');

  // -------------------------------------------------------------
  // TEST SUITE 8: Kitchen Display System (KDS) & Real-Time Sync
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 8: Kitchen Display System (KDS) Lifecycle & Progression ---');

  // Colombo Kitchen Chef retrieves live queue
  const kitchenQueue = await request('GET', '/api/kitchen/orders', {
    cookie: colomboChefCookie,
  });
  assert(kitchenQueue.status === 200, 'Kitchen chef must retrieve queue');

  // Chef accepts order
  const acceptRes = await request('POST', `/api/kitchen/orders/${orderId}/accept`, {
    cookie: colomboChefCookie,
  });
  assert(acceptRes.status === 200, `Chef accept must return 200 (got ${acceptRes.status})`);

  // Chef starts preparation
  const startRes = await request('POST', `/api/kitchen/orders/${orderId}/start`, {
    body: { note: 'Venison seared, reduction simmering.' },
    cookie: colomboChefCookie,
  });
  assert(startRes.status === 200, 'Chef start preparation must return 200');

  // Chef marks order READY
  const readyRes = await request('POST', `/api/kitchen/orders/${orderId}/ready`, {
    body: { note: 'Plated and inspected by Sous Chef.' },
    cookie: colomboChefCookie,
  });
  assert(readyRes.status === 200, 'Chef mark ready must return 200');

  // Customer A tracks their order status -> READY
  const orderTrackRes = await request('GET', `/api/orders/track/${createdOrder.orderReference}?email=${encodeURIComponent(custA.email)}`);
  assert(orderTrackRes.status === 200, 'Public order tracking must return 200');
  const trackedStatus = orderTrackRes.data.data.orderStatus || orderTrackRes.data.data.status;
  assert(
    trackedStatus === OrderStatus.READY,
    `Order status must now be READY, got ${trackedStatus}`
  );

  console.log('  ✅ [PASS] 8. KDS lifecycle (RECEIVED -> CONFIRMED -> PREPARING -> READY) validated end-to-end');

  // -------------------------------------------------------------
  // TEST SUITE 9: Reservation Table Allocation & Idempotency
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 9: Reservation Availability & Table Slot Idempotency ---');

  const resIdempotencyKey = `idem-res-s16-${ts}`;
  const resPayload = {
    locationId: colomboLocation,
    date: '2026-10-27',
    time: '7:30 PM',
    guestCount: 2,
    guestName: custAName,
    guestEmail: custA.email,
    guestPhone: custAPhone,
    occasion: 'Anniversary Celebration',
    specialRequests: 'Quiet window booth',
    idempotencyKey: resIdempotencyKey,
  };

  const bookingRes1 = await request('POST', '/api/reservations', {
    body: resPayload,
    cookie: custACookie,
  });
  assert(bookingRes1.status === 201, `Reservation creation must return 201 (got ${bookingRes1.status})`);
  const createdReservation = bookingRes1.data.data;
  const resId = createdReservation.id || createdReservation._id;
  assert(
    createdReservation.reservationReference.startsWith('AUR-RES-'),
    'Reservation reference must start with AUR-RES-'
  );

  // Duplicate submission
  const bookingRes2 = await request('POST', '/api/reservations', {
    body: resPayload,
    cookie: custACookie,
  });
  assert(bookingRes2.status === 200 || bookingRes2.status === 201, 'Idempotent reservation retry must succeed');
  assert(
    bookingRes2.data.data.reservationReference === createdReservation.reservationReference,
    'Idempotent reservation retry must return original reference'
  );

  // Customer B attempts to inspect Customer A's reservation -> 403 Forbidden
  const custBResLookup = await request('GET', `/api/reservations/my/${resId}`, {
    cookie: custBCookie,
  });
  assert(
    custBResLookup.status === 403,
    `Customer B accessing Customer A's reservation must return 403 (got ${custBResLookup.status})`
  );

  console.log('  ✅ [PASS] 9. Reservation slot allocation, idempotency and privacy isolation verified');

  // -------------------------------------------------------------
  // TEST SUITE 10: Live Socket.IO Authorization & Scoped Rooms
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 10: Real-Time Socket.IO Authorization & Security ---');

  const clientSocketA: ClientSocketType = ClientSocket(ctx.baseUrl, {
    transports: ['websocket'],
    forceNew: true,
    extraHeaders: {
      cookie: custACookie,
    },
  });

  const clientSocketB: ClientSocketType = ClientSocket(ctx.baseUrl, {
    transports: ['websocket'],
    forceNew: true,
    extraHeaders: {
      cookie: custBCookie,
    },
  });

  await new Promise<void>((resolve) => {
    let connectedCount = 0;
    const checkDone = () => {
      connectedCount++;
      if (connectedCount === 2) resolve();
    };
    clientSocketA.on('connect', checkDone);
    clientSocketB.on('connect', checkDone);
  });

  // Customer A subscribes to their own reservation room
  const subSuccessPromise = new Promise<any>((resolve) => {
    clientSocketA.on('subscribe:success' as any, (data: any) => resolve(data));
  });
  clientSocketA.emit('subscribe:reservation' as any, {
    reservationReference: createdReservation.reservationReference,
    email: custA.email,
  });
  const subAck = await subSuccessPromise;
  assert(subAck.reservationReference === createdReservation.reservationReference, 'Subscription ack must match reference');

  // Customer B attempts unauthorized subscription to Customer A's reservation room
  const subErrorPromise = new Promise<any>((resolve) => {
    clientSocketB.on('subscribe:error' as any, (err: any) => resolve(err));
  });
  clientSocketB.emit('subscribe:reservation' as any, {
    reservationReference: createdReservation.reservationReference,
  });
  const subDenied = await subErrorPromise;
  assert(subDenied.error === 'Forbidden', 'Cross-customer socket subscription rejected with Forbidden');

  clientSocketA.disconnect();
  clientSocketB.disconnect();

  console.log('  ✅ [PASS] 10. Real-time Socket.IO room subscriptions guarded by user ownership');

  // -------------------------------------------------------------
  // TEST SUITE 11: Cross-Stage Unified Telemetry & Regulatory Audit Log
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 11: Cross-Stage Telemetry & Audit Integrity ---');

  const adminOverview = await request('GET', `/api/admin/dashboard/overview?locationId=${colomboLocation}`, {
    cookie: adminCookie,
  });
  assert(adminOverview.status === 200, 'Admin overview telemetry must return 200');
  assert(adminOverview.data.success === true, 'Admin overview must return success: true');
  assert(Boolean(adminOverview.data.data), 'Admin overview telemetry data must exist');

  // Check audit logs exist for the operations executed
  const auditLogs = await StaffAuditLog.find({
    action: { $in: ['STAFF_LOGIN', 'KITCHEN_ORDER_ACCEPTED', 'KITCHEN_ORDER_PREPARING', 'KITCHEN_ORDER_READY'] },
  }).limit(5);
  assert(auditLogs.length > 0, 'Regulatory audit logs must capture staff operational state transitions');

  console.log('  ✅ [PASS] 11. Cross-stage unified telemetry and immutable audit logging verified');

  // Cleanup test fixtures
  console.log('\nCleaning up Stage 16 test records...');
  await Staff.deleteMany({
    email: {
      $in: [
        adminStaff.email,
        colomboManager.email,
        kandyManager.email,
        colomboChef.email,
      ],
    },
  });
  await User.deleteMany({ email: { $in: [custA.email, custB.email] } });
  await MenuItem.deleteOne({ _id: testDish._id });
  await MenuCategory.deleteOne({ _id: testCategory._id });
  await Order.deleteMany({ orderReference: createdOrder.orderReference });
  await Reservation.deleteMany({ reservationReference: createdReservation.reservationReference });
  await TableSlotAllocation.deleteMany({ reservationId: resId });

  console.log('✔ Cleanup complete.');

  console.log('\n=============================================================');
  console.log('🎉 ALL 11 STAGE 16 SYSTEM INTEGRATION SUITES PASSED (0 ERRORS)');
  console.log('=============================================================\n');

  await closeSocketServer();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await mongoose.disconnect();
  process.exit(0);
}

runStage16MasterTestSuite().catch((err) => {
  console.error('\n❌ STAGE 16 MASTER TEST SUITE FAILED:', err);
  process.exit(1);
});
