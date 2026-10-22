import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { Order } from '../models/order.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { OrderType, OrderStatus, PaymentStatus, KitchenPriority } from '../types/order';
import { hashPassword } from '../utils/password';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

interface TestContext {
  server: http.Server;
  baseUrl: string;
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
  const data: any = contentType.includes('application/json') ? await res.json() : await res.text();
  const setCookie = res.headers.get('set-cookie');

  return {
    status: res.status,
    data,
    cookie: setCookie ? setCookie.split(';')[0] : options.cookie,
  };
}

async function runKitchenTests() {
  console.log('\n=============================================================');
  console.log('  AURELLE STAGE 8: KITCHEN MANAGEMENT SYSTEM (KDS) TEST SUITE');
  console.log('=============================================================\n');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI);
  }

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const port = (server.address() as any).port;
      ctx = { server, baseUrl: `http://localhost:${port}` };
      resolve();
    });
  });

  const testSuffix = Date.now().toString();
  const kitchenEmail = `kitchen_${testSuffix}@aurelle.com`;
  const adminEmail = `admin_kds_${testSuffix}@aurelle.com`;
  const floorEmail = `floor_kds_${testSuffix}@aurelle.com`;
  const otherLocKitchenEmail = `kandy_kitchen_${testSuffix}@aurelle.com`;
  const plainPassword = 'Aurelle@Secure2026!';
  const passwordHash = await hashPassword(plainPassword);

  console.log('1. Setting up test staff accounts...');
  const kitchenStaff = await Staff.create({
    firstName: 'Chef',
    lastName: 'Auguste',
    email: kitchenEmail,
    passwordHash,
    role: StaffRole.KITCHEN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const adminStaff = await Staff.create({
    firstName: 'Executive',
    lastName: 'Admin',
    email: adminEmail,
    passwordHash,
    role: StaffRole.ADMIN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const floorStaff = await Staff.create({
    firstName: 'Floor',
    lastName: 'Server',
    email: floorEmail,
    passwordHash,
    role: StaffRole.FLOOR,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const otherLocStaff = await Staff.create({
    firstName: 'Kandy',
    lastName: 'Chef',
    email: otherLocKitchenEmail,
    passwordHash,
    role: StaffRole.KITCHEN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-kandy-branch'],
  });

  // Login as Kitchen Staff
  console.log('2. Authenticating staff members...');
  const kitchenLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: kitchenEmail, password: plainPassword },
  });
  assert(kitchenLogin.status === 200, 'Kitchen login should return 200 OK');
  const kitchenCookie = kitchenLogin.cookie!;

  // Login as Floor Staff
  const floorLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: floorEmail, password: plainPassword },
  });
  assert(floorLogin.status === 200, 'Floor login should return 200 OK');
  const floorCookie = floorLogin.cookie!;

  // Login as Other Location Kitchen Staff
  const otherLocLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: otherLocKitchenEmail, password: plainPassword },
  });
  assert(otherLocLogin.status === 200, 'Other location kitchen login should return 200 OK');
  const otherLocCookie = otherLocLogin.cookie!;

  console.log('3. Verifying RBAC protection on Kitchen Display System...');
  // Unauthenticated request should fail
  const unauthRes = await request('GET', '/api/kitchen/orders');
  assert(unauthRes.status === 401, 'Unauthenticated request to kitchen board should return 401');

  // Floor staff should be forbidden
  const floorRes = await request('GET', '/api/kitchen/orders', { cookie: floorCookie });
  assert(floorRes.status === 403, 'Floor role must be denied access to kitchen board (403 Forbidden)');

  // Kitchen staff should be authorized
  const kitchenBoardRes = await request('GET', '/api/kitchen/orders', { cookie: kitchenCookie });
  assert(kitchenBoardRes.status === 200, 'Kitchen role must be granted access to kitchen board (200 OK)');
  assert(kitchenBoardRes.data.success === true, 'Response should have success: true');
  assert(Array.isArray(kitchenBoardRes.data.data.newOrders), 'newOrders should be an array');
  assert(Array.isArray(kitchenBoardRes.data.data.preparing), 'preparing should be an array');
  assert(Array.isArray(kitchenBoardRes.data.data.ready), 'ready should be an array');

  console.log('4. Testing Scheduled Pre-Orders vs Active Lead Time Activation...');
  const now = new Date();
  // Order A: Scheduled 2 hours in the future (Scheduled queue)
  const scheduledTimeFar = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const orderA = await Order.create({
    orderReference: `AUR-SCHED-${testSuffix.slice(-4)}`,
    customerName: 'Sir Arthur Conan',
    customerEmail: 'arthur@example.com',
    customerPhone: '+94770001111',
    locationId: 'loc-colombo-main',
    orderType: OrderType.TAKEAWAY,
    items: [
      {
        menuItemId: new mongoose.Types.ObjectId().toString(),
        dishName: 'Smoked Duck Breast',
        quantity: 1,
        unitPriceMinor: 480000,
        lineTotalMinor: 480000,
        specialInstructions: 'Medium rare please',
      },
    ],
    subtotalMinor: 480000,
    discountMinor: 0,
    taxMinor: 12000,
    serviceChargeMinor: 48000,
    totalMinor: 540000,
    currency: 'LKR',
    orderStatus: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    scheduledFor: scheduledTimeFar,
    statusHistory: [{ status: OrderStatus.CONFIRMED, changedAt: now, actorType: 'CUSTOMER' }],
  });

  // Order B: Scheduled 15 minutes from now (Active in NEW queue)
  const scheduledTimeSoon = new Date(now.getTime() + 15 * 60 * 1000);
  const orderB = await Order.create({
    orderReference: `AUR-ACTV-${testSuffix.slice(-4)}`,
    customerName: 'Lady Eleanor Vance',
    customerEmail: 'eleanor@example.com',
    customerPhone: '+94770002222',
    locationId: 'loc-colombo-main',
    orderType: OrderType.TAKEAWAY,
    items: [
      {
        menuItemId: new mongoose.Types.ObjectId().toString(),
        dishName: 'Ceylon Black Pepper Crab',
        quantity: 2,
        unitPriceMinor: 650000,
        lineTotalMinor: 1300000,
        specialInstructions: 'Extra curry leaves',
      },
    ],
    subtotalMinor: 1300000,
    discountMinor: 0,
    taxMinor: 32500,
    serviceChargeMinor: 130000,
    totalMinor: 1462500,
    currency: 'LKR',
    orderStatus: OrderStatus.RECEIVED,
    paymentStatus: PaymentStatus.PAID,
    scheduledFor: scheduledTimeSoon,
    statusHistory: [{ status: OrderStatus.RECEIVED, changedAt: now, actorType: 'CUSTOMER' }],
  });

  // Check scheduled endpoint
  const scheduledRes = await request('GET', '/api/kitchen/orders/scheduled', { cookie: kitchenCookie });
  assert(scheduledRes.status === 200, 'Scheduled orders endpoint should return 200');
  const scheduledOrders: any[] = scheduledRes.data.data;
  const foundOrderA = scheduledOrders.find((o) => o.orderReference === orderA.orderReference);
  const foundOrderBInSched = scheduledOrders.find((o) => o.orderReference === orderB.orderReference);
  assert(!!foundOrderA, 'Order A (2h ahead) must be present in scheduled pre-orders');
  assert(!foundOrderBInSched, 'Order B (15m ahead) must NOT be in scheduled pre-orders; should activate to live board');

  // Check active board
  const activeBoardRes = await request('GET', '/api/kitchen/orders', { cookie: kitchenCookie });
  const activeNewOrders: any[] = activeBoardRes.data.data.newOrders;
  const foundOrderB = activeNewOrders.find((o) => o.orderReference === orderB.orderReference);
  const foundOrderAInNew = activeNewOrders.find((o) => o.orderReference === orderA.orderReference);
  assert(!!foundOrderB, 'Order B (15m ahead) must activate and appear in newOrders column');
  assert(!foundOrderAInNew, 'Order A must not appear in newOrders column while scheduled');

  console.log('5. Testing Kitchen Summary Metrics...');
  const summaryRes = await request('GET', '/api/kitchen/orders/summary', { cookie: kitchenCookie });
  assert(summaryRes.status === 200, 'Summary endpoint should return 200 OK');
  assert(typeof summaryRes.data.data.newOrders === 'number', 'Summary should include newOrders count');
  assert(typeof summaryRes.data.data.preparing === 'number', 'Summary should include preparing count');
  assert(typeof summaryRes.data.data.ready === 'number', 'Summary should include ready count');
  assert(typeof summaryRes.data.data.scheduled === 'number', 'Summary should include scheduled count');
  assert(summaryRes.data.data.scheduled >= 1, 'Scheduled count should be >= 1');
  assert(summaryRes.data.data.newOrders >= 1, 'New orders count should be >= 1');

  console.log('6. Testing Kitchen Order Acceptance Workflow...');
  const acceptRes = await request('POST', `/api/kitchen/orders/${orderB._id}/accept`, {
    cookie: kitchenCookie,
  });
  assert(acceptRes.status === 200, 'Accepting order should return 200 OK');
  assert(acceptRes.data.data.kitchenAcceptedAt !== null, 'kitchenAcceptedAt must be populated');
  assert(acceptRes.data.data.kitchenAcceptedByName === 'Chef Auguste', 'kitchenAcceptedByName must match actor name');

  // Verify duplicate acceptance is rejected
  const dupAcceptRes = await request('POST', `/api/kitchen/orders/${orderB._id}/accept`, {
    cookie: kitchenCookie,
  });
  assert(dupAcceptRes.status === 409, 'Duplicate acceptance must be rejected with 409 Conflict');

  // Verify audit log
  const acceptAudit = await StaffAuditLog.findOne({
    targetStaffId: orderB.orderReference,
    action: 'KITCHEN_ORDER_ACCEPTED',
  });
  assert(!!acceptAudit, 'StaffAuditLog must record KITCHEN_ORDER_ACCEPTED');

  console.log('7. Testing Preparation Workflow (START PREPARATION)...');
  const startPrepRes = await request('POST', `/api/kitchen/orders/${orderB._id}/start`, {
    cookie: kitchenCookie,
    body: { note: 'Pan seared on high flame' },
  });
  assert(startPrepRes.status === 200, 'Start preparation should return 200 OK');
  assert(startPrepRes.data.data.orderStatus === OrderStatus.PREPARING, 'Order status must be PREPARING');
  assert(startPrepRes.data.data.preparationStartedAt !== null, 'preparationStartedAt must be recorded');
  assert(startPrepRes.data.data.preparationStartedBy === 'Chef Auguste', 'preparationStartedBy must match staff name');

  // Verify preparing board column
  const prepBoardRes = await request('GET', '/api/kitchen/orders', { cookie: kitchenCookie });
  const prepOrders: any[] = prepBoardRes.data.data.preparing;
  const foundPrepOrder = prepOrders.find((o) => o.orderReference === orderB.orderReference);
  assert(!!foundPrepOrder, 'Order B must now appear in PREPARING column');

  // Verify audit log
  const prepAudit = await StaffAuditLog.findOne({
    targetStaffId: orderB.orderReference,
    action: 'ORDER_PREPARATION_STARTED',
  });
  assert(!!prepAudit, 'StaffAuditLog must record ORDER_PREPARATION_STARTED');

  console.log('8. Testing Ready Workflow (MARK READY)...');
  const readyRes = await request('POST', `/api/kitchen/orders/${orderB._id}/ready`, {
    cookie: kitchenCookie,
    body: { note: 'Plated on hot porcelain dish' },
  });
  assert(readyRes.status === 200, 'Mark ready should return 200 OK');
  assert(readyRes.data.data.orderStatus === OrderStatus.READY, 'Order status must transition to READY');
  assert(readyRes.data.data.readyAt !== null, 'readyAt timestamp must be recorded');
  assert(readyRes.data.data.readyBy === 'Chef Auguste', 'readyBy must record staff name');

  // Verify ready board column
  const readyBoardRes = await request('GET', '/api/kitchen/orders', { cookie: kitchenCookie });
  const readyOrders: any[] = readyBoardRes.data.data.ready;
  const foundReadyOrder = readyOrders.find((o) => o.orderReference === orderB.orderReference);
  assert(!!foundReadyOrder, 'Order B must now appear in READY column');

  // Verify audit log
  const readyAudit = await StaffAuditLog.findOne({
    targetStaffId: orderB.orderReference,
    action: 'ORDER_READY',
  });
  assert(!!readyAudit, 'StaffAuditLog must record ORDER_READY');

  console.log('9. Testing Location Isolation Enforced for Kitchen Staff...');
  // Staff from 'loc-kandy-branch' attempting to accept 'loc-colombo-main' order
  const crossLocRes = await request('POST', `/api/kitchen/orders/${orderA._id}/accept`, {
    cookie: otherLocCookie,
  });
  assert(
    crossLocRes.status === 403 || crossLocRes.status === 400,
    'Kitchen staff assigned to another branch must not alter orders at other locations'
  );

  console.log('10. Testing Order Details by ID/Reference...');
  const detailRes = await request('GET', `/api/kitchen/orders/${orderB.orderReference}`, {
    cookie: kitchenCookie,
  });
  assert(detailRes.status === 200, 'Fetching order details by reference should return 200 OK');
  assert(detailRes.data.data.orderReference === orderB.orderReference, 'Order reference must match');
  assert(detailRes.data.data.items[0].specialInstructions === 'Extra curry leaves', 'Special instructions must match');

  console.log('11. Testing Kitchen History (Completed & Cancelled)...');
  // Mark Order B completed (e.g. at customer pickup)
  orderB.orderStatus = OrderStatus.COMPLETED;
  orderB.completedAt = new Date();
  await orderB.save();

  const historyRes = await request('GET', '/api/kitchen/orders/history', { cookie: kitchenCookie });
  assert(historyRes.status === 200, 'Kitchen history should return 200 OK');
  const historyOrders: any[] = historyRes.data.data.orders;
  const foundInHistory = historyOrders.find((o) => o.orderReference === orderB.orderReference);
  assert(!!foundInHistory, 'Completed order must appear in Kitchen History');

  console.log('\nCleaning up test artifacts...');
  await Order.deleteMany({ _id: { $in: [orderA._id, orderB._id] } });
  await Staff.deleteMany({ _id: { $in: [kitchenStaff._id, adminStaff._id, floorStaff._id, otherLocStaff._id] } });
  await StaffAuditLog.deleteMany({ targetStaffId: { $in: [orderA.orderReference, orderB.orderReference] } });

  await new Promise<void>((resolve) => ctx.server.close(() => resolve()));
  console.log('\n=============================================================');
  console.log('  ALL KITCHEN MANAGEMENT SYSTEM (STAGE 8) BACKEND TESTS PASSED!');
  console.log('=============================================================\n');
}

runKitchenTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ KITCHEN TEST SUITE FAILURE:', err);
    process.exit(1);
  });
