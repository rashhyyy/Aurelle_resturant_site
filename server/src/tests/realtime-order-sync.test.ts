import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { io as ClientSocket, Socket as ClientSocketType } from '../../../client/node_modules/socket.io-client';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { OrderType, OrderStatus, PaymentStatus } from '../types/order';
import { hashPassword } from '../utils/password';
import { setupSocketServer } from '../sockets/socket.server';

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
  const data: any = contentType.includes('application/json') ? await res.json() : await res.text();
  const setCookie = res.headers.get('set-cookie');

  return {
    status: res.status,
    data,
    cookie: setCookie ? setCookie.split(';')[0] : options.cookie,
  };
}

async function runSyncTests() {
  console.log('\n=============================================================');
  console.log('  AURELLE: REAL-TIME ORDER STATUS SYNCHRONIZATION TEST SUITE');
  console.log('=============================================================\n');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI);
  }

  const app = createApp();
  const server = http.createServer(app);
  setupSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const port = (server.address() as any).port;
      ctx = { server, baseUrl: `http://localhost:${port}`, port };
      resolve();
    });
  });

  const testSuffix = Date.now().toString();
  const plainPassword = 'Aurelle@Secure2026!';
  const passwordHash = await hashPassword(plainPassword);

  console.log('1. Setting up accounts: Customer A, Customer B, Kitchen Staff, Floor Staff...');
  const customerA = await User.create({
    username: `cust_a_${testSuffix}`,
    email: `cust_a_${testSuffix}@example.com`,
    passwordHash,
    role: 'user',
  });

  const customerB = await User.create({
    username: `cust_b_${testSuffix}`,
    email: `cust_b_${testSuffix}@example.com`,
    passwordHash,
    role: 'user',
  });

  const kitchenStaff = await Staff.create({
    firstName: 'Chef',
    lastName: 'Laurent',
    email: `chef_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.KITCHEN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const floorStaff = await Staff.create({
    firstName: 'Floor',
    lastName: 'Attendant',
    email: `floor_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.FLOOR,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  // Login sessions
  const custALogin = await request('POST', '/api/auth/login', {
    body: { login: customerA.email, password: plainPassword },
  });
  assert(custALogin.status === 200, 'Customer A login failed');
  const custACookie = custALogin.cookie!;

  const custBLogin = await request('POST', '/api/auth/login', {
    body: { login: customerB.email, password: plainPassword },
  });
  assert(custBLogin.status === 200, 'Customer B login failed');
  const custBCookie = custBLogin.cookie!;

  const kitchenLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: kitchenStaff.email, password: plainPassword },
  });
  assert(kitchenLogin.status === 200, 'Kitchen login failed');
  const kitchenCookie = kitchenLogin.cookie!;

  const floorLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: floorStaff.email, password: plainPassword },
  });
  assert(floorLogin.status === 200, 'Floor login failed');
  const floorCookie = floorLogin.cookie!;

  console.log('2. [TEST 1] Creating a real test takeaway order for Customer A in MongoDB...');
  const orderRef = `AUR-SYNC-${testSuffix.slice(-4)}`;
  const scheduledTime = new Date(Date.now() + 20 * 60 * 1000); // 20m ahead (within 30m lead time, active in new queue)

  const testOrder = await Order.create({
    orderReference: orderRef,
    customerId: customerA._id.toString(),
    customerName: 'Customer Alpha',
    customerEmail: customerA.email,
    customerPhone: '+94771112222',
    locationId: 'loc-colombo-main',
    orderType: OrderType.TAKEAWAY,
    items: [
      {
        menuItemId: new mongoose.Types.ObjectId().toString(),
        dishName: 'Wagyu Tenderloin',
        quantity: 1,
        unitPriceMinor: 850000,
        lineTotalMinor: 850000,
        specialInstructions: 'Medium rare',
      },
    ],
    subtotalMinor: 850000,
    discountMinor: 0,
    taxMinor: 21250,
    serviceChargeMinor: 85000,
    totalMinor: 956250,
    currency: 'LKR',
    orderStatus: OrderStatus.RECEIVED,
    paymentStatus: PaymentStatus.PAID,
    scheduledFor: scheduledTime,
    statusHistory: [{ status: OrderStatus.RECEIVED, changedAt: new Date(), actorType: 'CUSTOMER' }],
  });

  console.log('3. [TEST 2] Connecting Customer A via authenticated Socket.IO and subscribing to order...');
  const custASocket: ClientSocketType = ClientSocket(`http://localhost:${ctx.port}`, {
    extraHeaders: { Cookie: custACookie },
    transports: ['websocket'],
  });

  await new Promise<void>((resolve, reject) => {
    custASocket.on('connect', () => resolve());
    custASocket.on('connect_error', (err) => reject(err));
  });

  // Subscribe to order
  const subscribeAck = new Promise<any>((resolve) => {
    custASocket.on('subscribe:success', (data) => resolve(data));
  });
  custASocket.emit('subscribe:order', { orderReference: orderRef, email: customerA.email });
  const subResult = await subscribeAck;
  assert(subResult.orderReference === orderRef, 'Customer A subscription acknowledgment must match orderRef');

  console.log('4. [TEST 10] Verifying Customer B is FORBIDDEN from subscribing to Customer A order...');
  const custBSocket: ClientSocketType = ClientSocket(`http://localhost:${ctx.port}`, {
    extraHeaders: { Cookie: custBCookie },
    transports: ['websocket'],
  });
  await new Promise<void>((resolve) => custBSocket.on('connect', () => resolve()));

  const custBDenied = new Promise<any>((resolve) => {
    custBSocket.on('subscribe:error', (err) => resolve(err));
  });
  custBSocket.emit('subscribe:order', { orderReference: orderRef });
  const denyResult = await custBDenied;
  assert(denyResult.error === 'Forbidden', 'Customer B subscription must be rejected with Forbidden');

  console.log('5. [TEST 3] Verifying Kitchen Dashboard sees the new order on the board...');
  const kdsBoardRes = await request('GET', '/api/kitchen/orders', { cookie: kitchenCookie });
  assert(kdsBoardRes.status === 200, 'Kitchen board GET failed');
  const foundInNew = kdsBoardRes.data.data.newOrders.find((o: any) => o.orderReference === orderRef);
  assert(!!foundInNew, 'Test order must appear in Kitchen New Incoming queue');

  console.log('6. [TEST 4] Kitchen accepts order -> verifying customer receives real-time event...');
  const acceptPromise = new Promise<any>((resolve) => {
    custASocket.on('orders.statusChanged', (payload) => {
      if (payload.orderReference === orderRef) resolve(payload);
    });
  });

  const acceptRes = await request('POST', `/api/kitchen/orders/${testOrder._id}/accept`, {
    cookie: kitchenCookie,
  });
  assert(acceptRes.status === 200, 'Accept order API failed');

  const acceptEventPayload = await acceptPromise;
  assert(acceptEventPayload.orderStatus === OrderStatus.CONFIRMED, 'Status in real-time event must be CONFIRMED');
  assert(acceptEventPayload.orderReference === orderRef, 'OrderRef in event must match');
  console.log('   -> Real-time event received by customer for ACCEPTED/CONFIRMED status!');

  console.log('7. [TEST 5] Kitchen starts preparation -> verifying customer receives PREPARING event...');
  const prepPromise = new Promise<any>((resolve) => {
    custASocket.on('orders.statusChanged', (payload) => {
      if (payload.orderReference === orderRef && payload.orderStatus === OrderStatus.PREPARING) {
        resolve(payload);
      }
    });
  });

  const startPrepRes = await request('POST', `/api/kitchen/orders/${testOrder._id}/start`, {
    cookie: kitchenCookie,
    body: { note: 'Pan searing' },
  });
  assert(startPrepRes.status === 200, 'Start prep API failed');

  const prepEventPayload = await prepPromise;
  assert(prepEventPayload.orderStatus === OrderStatus.PREPARING, 'Real-time event must report status PREPARING');
  console.log('   -> Real-time event received by customer for PREPARING status!');

  console.log('8. [TEST 6] Kitchen marks READY -> verifying customer receives READY event for Takeaway ("Ready for Pickup")...');
  const readyPromise = new Promise<any>((resolve) => {
    custASocket.on('orders.statusChanged', (payload) => {
      if (payload.orderReference === orderRef && payload.orderStatus === OrderStatus.READY) {
        resolve(payload);
      }
    });
  });

  const readyRes = await request('POST', `/api/kitchen/orders/${testOrder._id}/ready`, {
    cookie: kitchenCookie,
    body: { note: 'Plated on heated cloche' },
  });
  assert(readyRes.status === 200, 'Mark ready API failed');

  const readyEventPayload = await readyPromise;
  assert(readyEventPayload.orderStatus === OrderStatus.READY, 'Real-time event must report status READY');
  console.log('   -> Real-time event received by customer for READY status!');

  console.log('9. [TEST 7] Page refresh test: Customer tracking API returns READY with complete breakdown...');
  const trackRes = await request('GET', `/api/orders/track/${orderRef}`, { cookie: custACookie });
  assert(trackRes.status === 200, 'Customer track API failed');
  assert(trackRes.data.data.orderStatus === OrderStatus.READY, 'Status from MongoDB must be READY');
  assert(!!trackRes.data.data.formattedSubtotal, 'formattedSubtotal must be present');
  assert(!!trackRes.data.data.formattedServiceCharge, 'formattedServiceCharge must be present');
  assert(!!trackRes.data.data.formattedTax, 'formattedTax must be present');
  assert(!!trackRes.data.data.formattedTotal, 'formattedTotal must be present');
  console.log('   -> MongoDB persists state accurately; refresh maintains READY and full pricing breakdown!');

  console.log('10. [TEST 8] Disconnect and Reconnect Socket.IO -> re-subscribe and sync...');
  custASocket.disconnect();
  assert(!custASocket.connected, 'Socket should be disconnected');

  custASocket.connect();
  await new Promise<void>((resolve) => {
    custASocket.on('connect', () => resolve());
  });
  assert(custASocket.connected, 'Socket reconnected successfully');

  // Re-subscribe
  const reSubPromise = new Promise<any>((resolve) => {
    custASocket.on('subscribe:success', (d) => resolve(d));
  });
  custASocket.emit('subscribe:order', { orderReference: orderRef });
  const reSubResult = await reSubPromise;
  assert(reSubResult.orderReference === orderRef, 'Reconnection re-subscription must succeed');
  console.log('   -> Socket reconnected and re-subscribed successfully!');

  console.log('11. [TEST 9] Verify Administrator order directory displays the updated status (READY)...');
  const adminRes = await request('GET', `/api/admin/orders/${testOrder._id}`, { cookie: kitchenCookie });
  assert(adminRes.status === 200, 'Admin GET order by ID failed');
  assert(adminRes.data.data.orderStatus === OrderStatus.READY, 'Admin must see order in READY status');

  console.log('12. [TEST 11] Verify unauthorized staff (FLOOR) CANNOT change kitchen order status...');
  const floorAttempt = await request('POST', `/api/kitchen/orders/${testOrder._id}/ready`, {
    cookie: floorCookie,
  });
  assert(floorAttempt.status === 403, 'Floor staff must receive 403 Forbidden on kitchen endpoints');

  console.log('13. [DINE-IN TEST] Testing Dine-in Pre-order with "Ready for Service" status mapping...');
  const dineInOrder = await Order.create({
    orderReference: `AUR-DINE-${testSuffix.slice(-4)}`,
    customerId: customerA._id.toString(),
    customerName: 'Customer Alpha Dine-in',
    customerEmail: customerA.email,
    customerPhone: '+94771112222',
    locationId: 'loc-colombo-main',
    orderType: OrderType.DINE_IN_PREORDER,
    reservationId: 'RES-TABLE-4',
    items: [
      {
        menuItemId: new mongoose.Types.ObjectId().toString(),
        dishName: 'Ceylon Black Pepper Crab',
        quantity: 2,
        unitPriceMinor: 650000,
        lineTotalMinor: 1300000,
      },
    ],
    subtotalMinor: 1300000,
    discountMinor: 0,
    taxMinor: 32500,
    serviceChargeMinor: 130000,
    totalMinor: 1462500,
    currency: 'LKR',
    orderStatus: OrderStatus.PREPARING,
    paymentStatus: PaymentStatus.PAID,
    scheduledFor: new Date(),
    statusHistory: [{ status: OrderStatus.PREPARING, changedAt: new Date(), actorType: 'STAFF' }],
  });

  const dineInReadyPromise = new Promise<any>((resolve) => {
    custASocket.on('orders.statusChanged', (p) => {
      if (p.orderReference === dineInOrder.orderReference && p.orderStatus === OrderStatus.READY) {
        resolve(p);
      }
    });
  });

  custASocket.emit('subscribe:order', { orderReference: dineInOrder.orderReference, email: customerA.email });

  const dineInReadyRes = await request('POST', `/api/kitchen/orders/${dineInOrder._id}/ready`, {
    cookie: kitchenCookie,
  });
  assert(dineInReadyRes.status === 200, 'Dine-in mark ready failed');

  const dineInPayload = await dineInReadyPromise;
  assert(dineInPayload.orderType === OrderType.DINE_IN_PREORDER, 'Order type must be DINE_IN_PREORDER');
  assert(dineInPayload.orderStatus === OrderStatus.READY, 'Status must be READY');
  console.log('   -> Dine-in order successfully marked READY and broadcast to customer!');

  console.log('\nCleaning up test artifacts...');
  custASocket.disconnect();
  custBSocket.disconnect();
  await Order.deleteMany({ _id: { $in: [testOrder._id, dineInOrder._id] } });
  await User.deleteMany({ _id: { $in: [customerA._id, customerB._id] } });
  await Staff.deleteMany({ _id: { $in: [kitchenStaff._id, floorStaff._id] } });

  await new Promise<void>((resolve) => ctx.server.close(() => resolve()));
  console.log('\n=============================================================');
  console.log('  ALL 12 REAL-TIME SYNCHRONIZATION TESTS PASSED SUCCESSFULLY!');
  console.log('=============================================================\n');
}

runSyncTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ REAL-TIME SYNC TEST SUITE FAILURE:', err);
    process.exit(1);
  });
