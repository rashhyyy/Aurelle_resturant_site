import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { User } from '../models/user.model';
import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { Order } from '../models/order.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { PublicationStatus } from '../types/menu';
import { OrderType, OrderStatus, PaymentStatus, ORDER_CONFIG } from '../types/order';
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

async function runTests() {
  console.log('\n=============================================================');
  console.log('  AURELLE STAGE 7: ORDER MANAGEMENT SYSTEM TEST SUITE');
  console.log('=============================================================\n');

  // 1. Connect MongoDB
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI);
  }

  // Ensure fresh sparse index on idempotencyKey
  try {
    await mongoose.connection.db?.collection('orders').dropIndex('idempotencyKey_1');
  } catch {}

  // 2. Setup server
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
  const testAdminEmail = `admin_order_${testSuffix}@aurelle.com`;
  const testFloorEmail = `floor_order_${testSuffix}@aurelle.com`;
  const testCustomerAEmail = `cust_a_${testSuffix}@example.com`;
  const testCustomerBEmail = `cust_b_${testSuffix}@example.com`;
  const plainPassword = 'Aurelle@Secure2026!';
  const passwordHash = await hashPassword(plainPassword);

  // Create Staff Accounts
  const adminStaff = await Staff.create({
    firstName: 'Admin',
    lastName: 'OrderMaster',
    email: testAdminEmail,
    passwordHash,
    role: StaffRole.ADMIN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const floorStaff = await Staff.create({
    firstName: 'Floor',
    lastName: 'Attendant',
    email: testFloorEmail,
    passwordHash,
    role: StaffRole.FLOOR,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  // Create Customers (User model)
  const customerA = await User.create({
    username: `cust_a_${testSuffix}`,
    email: testCustomerAEmail,
    passwordHash,
    role: 'user',
  });

  const customerB = await User.create({
    username: `cust_b_${testSuffix}`,
    email: testCustomerBEmail,
    passwordHash,
    role: 'user',
  });

  // Create Test Menu Category and Dishes
  const testCategory = await MenuCategory.create({
    name: `Order Category ${testSuffix}`,
    slug: `order-cat-${testSuffix}`,
    displayOrder: 1,
    isVisible: true,
  });

  // 1. Published and Available dish (LKR 5,000 = 500,000 minor)
  const publishedDish = await MenuItem.create({
    name: `Pepper Crab ${testSuffix}`,
    slug: `pepper-crab-${testSuffix}`,
    description: 'Fresh lagoon crab in Tellicherry pepper sauce',
    shortDescription: 'Fresh crab in pepper sauce',
    categoryId: testCategory._id,
    categoryName: testCategory.name,
    categorySlug: testCategory.slug,
    priceMinor: 500000,
    currency: 'LKR',
    publicationStatus: PublicationStatus.PUBLISHED,
    isAvailable: true,
    locationIds: ['loc-colombo-main'],
  });

  // 2. Draft dish
  const draftDish = await MenuItem.create({
    name: `Draft Ribs ${testSuffix}`,
    slug: `draft-ribs-${testSuffix}`,
    description: 'Tamarind beef ribs',
    categoryId: testCategory._id,
    categoryName: testCategory.name,
    categorySlug: testCategory.slug,
    priceMinor: 600000,
    currency: 'LKR',
    publicationStatus: PublicationStatus.DRAFT,
    isAvailable: true,
    locationIds: ['loc-colombo-main'],
  });

  // 3. Out-of-Stock dish
  const unavailableDish = await MenuItem.create({
    name: `Sold Out Kingfish ${testSuffix}`,
    slug: `sold-out-fish-${testSuffix}`,
    description: 'Claypot kingfish curry',
    categoryId: testCategory._id,
    categoryName: testCategory.name,
    categorySlug: testCategory.slug,
    priceMinor: 400000,
    currency: 'LKR',
    publicationStatus: PublicationStatus.PUBLISHED,
    isAvailable: false,
    locationIds: ['loc-colombo-main'],
  });

  let adminCookie = '';
  let floorCookie = '';
  let customerACookie = '';
  let customerBCookie = '';
  let createdOrderId = '';
  let createdOrderRef = '';

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Authenticate users and acquire sessions
  await test('1. Authentication Setup: Admin, Floor, and Customer sessions established', async () => {
    // Admin login
    const adminLogin = await request('POST', '/api/staff/auth/login', {
      body: { email: testAdminEmail, password: plainPassword },
    });
    assert(adminLogin.status === 200, 'Admin login failed');
    adminCookie = adminLogin.cookie || '';

    // Floor login
    const floorLogin = await request('POST', '/api/staff/auth/login', {
      body: { email: testFloorEmail, password: plainPassword },
    });
    assert(floorLogin.status === 200, 'Floor login failed');
    floorCookie = floorLogin.cookie || '';

    // Customer A login
    const custALogin = await request('POST', '/api/auth/login', {
      body: { login: testCustomerAEmail, password: plainPassword },
    });
    assert(custALogin.status === 200, 'Customer A login failed');
    customerACookie = custALogin.cookie || '';

    // Customer B login
    const custBLogin = await request('POST', '/api/auth/login', {
      body: { login: testCustomerBEmail, password: plainPassword },
    });
    assert(custBLogin.status === 200, 'Customer B login failed');
    customerBCookie = custBLogin.cookie || '';
  });

  // Calculate a valid future pickup time (tomorrow at 7:30 PM)
  const validPickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pickupDateStr = validPickupDate.toISOString().split('T')[0];
  const pickupTimeStr = '7:30 PM';

  // 2. Valid takeaway order creation
  await test('2. Order Creation: Customer creates valid takeaway order with server price calculation', async () => {
    const idempotencyKey = `idem-${testSuffix}-1`;
    const res = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: publishedDish._id.toString(), quantity: 2 }],
        orderType: 'TAKEAWAY',
        locationId: 'loc-colombo-main',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: pickupDateStr,
        pickupTime: pickupTimeStr,
        idempotencyKey,
      },
    });

    assert(res.status === 201, `Expected 201 Created, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.success === true, 'Response must be success');
    assert(res.data.data.orderReference.startsWith('AUR-'), 'Order reference must start with AUR-');
    assert(res.data.data.orderStatus === OrderStatus.RECEIVED, 'Initial status must be RECEIVED');
    assert(res.data.data.paymentStatus === PaymentStatus.UNPAID, 'Payment status must be UNPAID');

    // Financial check: 2 * 500,000 minor = 1,000,000 minor
    // tax: 2.5% = 25,000 minor
    // service charge: 10% = 100,000 minor
    // total: 1,125,000 minor
    assert(res.data.data.subtotalMinor === 1000000, `Subtotal expected 1000000, got ${res.data.data.subtotalMinor}`);
    assert(res.data.data.taxMinor === 25000, `Tax expected 25000, got ${res.data.data.taxMinor}`);
    assert(res.data.data.serviceChargeMinor === 100000, `Service charge expected 100000, got ${res.data.data.serviceChargeMinor}`);
    assert(res.data.data.totalMinor === 1125000, `Total expected 1125000, got ${res.data.data.totalMinor}`);
    assert(res.data.data.formattedTotal === 'LKR 11,250', `Formatted total expected "LKR 11,250", got ${res.data.data.formattedTotal}`);

    createdOrderId = res.data.data.id;
    createdOrderRef = res.data.data.orderReference;
  });

  // 3. Reject invalid/non-existent menu item
  await test('3. Integrity: Reject order referencing non-existent menu dish (400 Bad Request)', async () => {
    const res = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: '60c72b2f9b1d8b0015f8b999', quantity: 1 }],
        orderType: 'TAKEAWAY',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: pickupDateStr,
        pickupTime: pickupTimeStr,
      },
    });

    assert(res.status === 400, `Expected 400 for non-existent item, got ${res.status}`);
    assert(res.data.success === false, 'Must indicate failure');
  });

  // 4. Reject unpublished (DRAFT) dish
  await test('4. Integrity: Reject order for unpublished/draft dish (400 Bad Request)', async () => {
    const res = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: draftDish._id.toString(), quantity: 1 }],
        orderType: 'TAKEAWAY',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: pickupDateStr,
        pickupTime: pickupTimeStr,
      },
    });

    assert(res.status === 400, `Expected 400 for draft dish, got ${res.status}`);
    assert(res.data.message.includes('draft'), 'Error message must cite draft status');
  });

  // 5. Reject out-of-stock dish
  await test('5. Stock Validation: Reject order containing unavailable dish (400 Bad Request)', async () => {
    const res = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: unavailableDish._id.toString(), quantity: 1 }],
        orderType: 'TAKEAWAY',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: pickupDateStr,
        pickupTime: pickupTimeStr,
      },
    });

    assert(res.status === 400, `Expected 400 for out-of-stock dish, got ${res.status}`);
    assert(res.data.message.includes('out of stock'), 'Error message must cite out of stock');
  });

  // 6. Reject invalid quantity (0 or negative)
  await test('6. Quantity Validation: Reject invalid zero or negative quantity (400 Bad Request)', async () => {
    const res = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: publishedDish._id.toString(), quantity: 0 }],
        orderType: 'TAKEAWAY',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: pickupDateStr,
        pickupTime: pickupTimeStr,
      },
    });

    assert(res.status === 400, `Expected 400 for zero quantity, got ${res.status}`);
  });

  // 7. Prevent price tampering (client supplying fake prices)
  await test('7. Price Security: Reject or overwrite client-supplied fake prices with authoritative database minor units', async () => {
    const res = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: publishedDish._id.toString(), quantity: 1, unitPriceMinor: 100, price: 1 }],
        subtotalMinor: 100,
        totalMinor: 100,
        orderType: 'TAKEAWAY',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: pickupDateStr,
        pickupTime: pickupTimeStr,
      },
    });

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    // Backend MUST recompute based on real price (500000 minor)
    assert(res.data.data.subtotalMinor === 500000, 'Subtotal must be computed from MongoDB record (500000)');
    assert(res.data.data.totalMinor === 562500, 'Total must be computed from MongoDB record (562500)');
  });

  // 8. Prevent duplicate order submission (idempotency key)
  await test('8. Idempotency: Duplicate order submission returns original order without re-inserting', async () => {
    const idempotencyKey = `idem-${testSuffix}-dup`;
    const orderPayload = {
      items: [{ menuItemId: publishedDish._id.toString(), quantity: 1 }],
      orderType: 'TAKEAWAY',
      customerName: 'Customer Alpha',
      customerEmail: testCustomerAEmail,
      customerPhone: '+94 77 123 4567',
      pickupDate: pickupDateStr,
      pickupTime: pickupTimeStr,
      idempotencyKey,
    };

    const firstRes = await request('POST', '/api/orders', { body: orderPayload, cookie: customerACookie });
    assert(firstRes.status === 201, 'First submission expected 201');

    const secondRes = await request('POST', '/api/orders', { body: orderPayload, cookie: customerACookie });
    // Must return the exact same order reference
    assert(secondRes.data.data.orderReference === firstRes.data.data.orderReference, 'Must return matching order reference');

    // Verify only one order was persisted in MongoDB
    const count = await Order.countDocuments({ idempotencyKey });
    assert(count === 1, `Expected exactly 1 order in database for idempotency key, found ${count}`);
  });

  // 9. Reject invalid pickup time (past time or outside operating hours)
  await test('9. Scheduling Validation: Reject pickup times outside operating hours or in the past', async () => {
    // Past date (yesterday)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastRes = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: publishedDish._id.toString(), quantity: 1 }],
        orderType: 'TAKEAWAY',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: yesterday,
        pickupTime: '2:00 PM',
      },
    });
    assert(pastRes.status === 400, `Expected 400 for past pickup time, got ${pastRes.status}`);

    // Outside operating hours (3:00 AM)
    const hoursRes = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: publishedDish._id.toString(), quantity: 1 }],
        orderType: 'TAKEAWAY',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: pickupDateStr,
        pickupTime: '3:00 AM',
      },
    });
    assert(hoursRes.status === 400, `Expected 400 for outside operating hours, got ${hoursRes.status}`);
  });

  // 10. Customer Order History (/api/orders/my)
  await test('10. Customer Isolation: GET /api/orders/my returns only authenticated customer orders', async () => {
    // Customer A has placed orders
    const resA = await request('GET', '/api/orders/my', { cookie: customerACookie });
    assert(resA.status === 200, 'Customer A orders expected 200');
    assert(resA.data.data.orders.length > 0, 'Customer A should see their placed orders');

    // Customer B has placed 0 orders
    const resB = await request('GET', '/api/orders/my', { cookie: customerBCookie });
    assert(resB.status === 200, 'Customer B orders expected 200');
    assert(resB.data.data.orders.length === 0, 'Customer B should see 0 orders');

    // Unauthenticated request
    const resAnon = await request('GET', '/api/orders/my');
    assert(resAnon.status === 401, 'Unauthenticated call must receive 401');
  });

  // 11. Cross-Customer Order Access Prevention
  await test('11. Security: Customer B cannot access Customer A order details (403 Forbidden)', async () => {
    const res = await request('GET', `/api/orders/my/${createdOrderId}`, { cookie: customerBCookie });
    assert(res.status === 403, `Expected 403 Forbidden for cross-customer access, got ${res.status}`);
  });

  // 12. Invalid reservation rejection for dine-in pre-orders
  await test('12. Reservation Contract: Dine-in pre-order with non-existent reservation rejected (400 Bad Request)', async () => {
    const res = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: publishedDish._id.toString(), quantity: 1 }],
        orderType: 'DINE_IN_PREORDER',
        reservationId: 'RES-INVALID-9999',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: pickupDateStr,
        pickupTime: pickupTimeStr,
      },
    });

    assert(res.status === 400, `Expected 400 for invalid reservation link, got ${res.status}`);
    assert(res.data.message.includes('reservation') || res.data.message.includes('Reservation'), 'Error message must cite reservation');
  });

  // 13. Admin Order Management: List, Search, and Filter
  await test('13. Admin Directory: ADMIN can query order directory, search by reference, and filter by status', async () => {
    // List all
    const listRes = await request('GET', '/api/admin/orders', { cookie: adminCookie });
    assert(listRes.status === 200, 'Admin orders list expected 200');
    assert(listRes.data.data.orders.length > 0, 'Orders list should not be empty');

    // Search by reference
    const searchRes = await request('GET', `/api/admin/orders?search=${createdOrderRef}`, { cookie: adminCookie });
    assert(searchRes.status === 200, 'Search expected 200');
    assert(searchRes.data.data.orders.length === 1, 'Search by exact reference should return 1 order');
    assert(searchRes.data.data.orders[0].orderReference === createdOrderRef, 'Search must match reference');

    // Filter by status
    const filterRes = await request('GET', '/api/admin/orders?status=RECEIVED', { cookie: adminCookie });
    assert(filterRes.status === 200, 'Filter expected 200');
    assert(filterRes.data.data.orders.every((o: any) => o.orderStatus === 'RECEIVED'), 'All filtered orders must be RECEIVED');
  });

  // 14. Admin Order Summary Metrics
  await test('14. Summary Metrics: /api/admin/orders/summary returns aggregated live telemetry', async () => {
    const res = await request('GET', '/api/admin/orders/summary', { cookie: adminCookie });
    assert(res.status === 200, 'Admin summary expected 200');
    assert(typeof res.data.data.todayOrders === 'number', 'todayOrders must be a number');
    assert(typeof res.data.data.activeOrders === 'number', 'activeOrders must be a number');
    assert(res.data.data.activeOrders > 0, 'activeOrders must be > 0');
  });

  // 15. Order Status Lifecycle: Confirm -> Preparing -> Ready -> Completed
  await test('15. Lifecycle Transitions: Order transitions through CONFIRMED -> PREPARING -> READY -> COMPLETED', async () => {
    // 1. Confirm
    const confirmRes = await request('POST', `/api/admin/orders/${createdOrderId}/confirm`, { cookie: adminCookie });
    assert(confirmRes.status === 200, `Confirm expected 200, got ${confirmRes.status}`);
    assert(confirmRes.data.data.orderStatus === OrderStatus.CONFIRMED, 'Status must be CONFIRMED');
    assert(confirmRes.data.data.confirmedAt !== null, 'confirmedAt must be populated');

    // 2. Start Preparation
    const prepRes = await request('PATCH', `/api/admin/orders/${createdOrderId}/status`, {
      cookie: adminCookie,
      body: { status: OrderStatus.PREPARING, note: 'Chef began cooking' },
    });
    assert(prepRes.status === 200, `Prep expected 200, got ${prepRes.status}`);
    assert(prepRes.data.data.orderStatus === OrderStatus.PREPARING, 'Status must be PREPARING');

    // 3. Mark Ready
    const readyRes = await request('PATCH', `/api/admin/orders/${createdOrderId}/status`, {
      cookie: adminCookie,
      body: { status: OrderStatus.READY },
    });
    assert(readyRes.status === 200, 'Ready expected 200');
    assert(readyRes.data.data.orderStatus === OrderStatus.READY, 'Status must be READY');

    // 4. Complete
    const completeRes = await request('PATCH', `/api/admin/orders/${createdOrderId}/status`, {
      cookie: adminCookie,
      body: { status: OrderStatus.COMPLETED },
    });
    assert(completeRes.status === 200, 'Complete expected 200');
    assert(completeRes.data.data.orderStatus === OrderStatus.COMPLETED, 'Status must be COMPLETED');

    // 5. Invalid transition test: COMPLETED -> RECEIVED must be rejected with 400
    const invalidRes = await request('PATCH', `/api/admin/orders/${createdOrderId}/status`, {
      cookie: adminCookie,
      body: { status: OrderStatus.RECEIVED },
    });
    assert(invalidRes.status === 400, 'Invalid transition must return 400 Bad Request');
  });

  // 16. Customer Order Cancellation Rules
  await test('16. Cancellation Policy: Customer can cancel RECEIVED order, rejected once COMPLETED', async () => {
    // 1. Create a fresh order to cancel
    const newOrderRes = await request('POST', '/api/orders', {
      cookie: customerACookie,
      body: {
        items: [{ menuItemId: publishedDish._id.toString(), quantity: 1 }],
        orderType: 'TAKEAWAY',
        customerName: 'Customer Alpha',
        customerEmail: testCustomerAEmail,
        customerPhone: '+94 77 123 4567',
        pickupDate: pickupDateStr,
        pickupTime: pickupTimeStr,
      },
    });
    assert(newOrderRes.status === 201, 'Order creation expected 201');
    const cancellableId = newOrderRes.data.data.id;

    // 2. Customer cancels their own order while RECEIVED
    const cancelRes = await request('POST', `/api/orders/my/${cancellableId}/cancel`, {
      cookie: customerACookie,
      body: { reason: 'Plans changed' },
    });
    assert(cancelRes.status === 200, `Cancel expected 200, got ${cancelRes.status}`);
    assert(cancelRes.data.data.orderStatus === OrderStatus.CANCELLED, 'Status must be CANCELLED');

    // 3. Attempting to cancel an already COMPLETED order is rejected
    const cancelCompletedRes = await request('POST', `/api/orders/my/${createdOrderId}/cancel`, {
      cookie: customerACookie,
      body: { reason: 'Try cancel completed' },
    });
    assert(cancelCompletedRes.status === 400, 'Cancelling completed order must be rejected with 400');
  });

  // 17. Audit Logging in StaffAuditLog
  await test('17. Regulatory Governance: Order creation and transitions generate StaffAuditLog records', async () => {
    const logs = await StaffAuditLog.find({
      action: { $in: ['ORDER_CREATED', 'ORDER_CONFIRMED', 'ORDER_PREPARATION_STARTED', 'ORDER_READY', 'ORDER_COMPLETED', 'ORDER_CANCELLED'] },
    });
    assert(logs.length > 0, 'Audit records must be created for order actions');
  });

  // 18. RBAC: Unauthorized status update rejection
  await test('18. RBAC Security: FLOOR staff or anonymous callers cannot confirm or cancel orders', async () => {
    // Anonymous call to confirm order
    const anonRes = await request('POST', `/api/admin/orders/${createdOrderId}/confirm`);
    assert(anonRes.status === 401, 'Anonymous staff call must receive 401 Unauthorized');

    // FLOOR staff call to confirm order (only Admin/Manager allowed)
    const floorRes = await request('POST', `/api/admin/orders/${createdOrderId}/confirm`, { cookie: floorCookie });
    assert(floorRes.status === 403, 'FLOOR staff must receive 403 Forbidden on confirm order');
  });

  // 19. Admin Dashboard Integration: Overview API reflects live orders
  await test('19. Dashboard Overview: /api/admin/dashboard/overview reflects real order data', async () => {
    const res = await request('GET', '/api/admin/dashboard/overview?locationId=loc-colombo-main', { cookie: adminCookie });
    assert(res.status === 200, 'Dashboard overview expected 200');
    assert(res.data.data.todayOrders !== null, 'todayOrders must be populated from MongoDB');
    assert(Array.isArray(res.data.data.recentOrders), 'recentOrders must be an array');
  });

  // Clean up test records
  console.log('\n  Cleaning up test fixtures...');
  await Staff.deleteMany({ email: { $in: [testAdminEmail, testFloorEmail] } });
  await User.deleteMany({ email: { $in: [testCustomerAEmail, testCustomerBEmail] } });
  await MenuItem.deleteMany({ slug: new RegExp(testSuffix) });
  await MenuCategory.deleteMany({ slug: new RegExp(testSuffix) });
  await Order.deleteMany({ customerEmail: { $in: [testCustomerAEmail, testCustomerBEmail] } });

  server.close();
  await mongoose.disconnect();

  console.log('\n=============================================================');
  console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
