import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { io as ClientSocket, Socket as ClientSocketType } from '../../../client/node_modules/socket.io-client';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { OrderType, OrderStatus, PaymentStatus, ORDER_CONFIG } from '../types/order';
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

async function runE2EOrderLifecycleTest() {
  console.log('\n======================================================================');
  console.log('  AURELLE: END-TO-END CUSTOMER TO KITCHEN ORDER SYNCHRONIZATION TEST');
  console.log('======================================================================\n');

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

  // 1. Ensure test dishes exist in database
  console.log('1. Ensuring "Tandoori Malabar Prawns" and "Claypot Kingfish Thiyal" exist in database...');
  let category = await MenuCategory.findOne({ slug: 'sri-lankan' });
  if (!category) {
    category = await MenuCategory.create({
      name: 'Sri Lankan Haute Cuisine',
      slug: 'sri-lankan',
      description: 'Heritage coastal flavors',
      displayOrder: 1,
      isActive: true,
      locationIds: ['loc-colombo-main'],
    });
  }

  let prawnItem = await MenuItem.findOne({ slug: 'tandoori-malabar-prawns' });
  if (!prawnItem) {
    prawnItem = await MenuItem.create({
      name: 'Tandoori Malabar Prawns',
      slug: 'tandoori-malabar-prawns',
      categoryId: category._id,
      categoryName: category.name,
      categorySlug: category.slug,
      priceMinor: 640000, // 6,400 LKR
      currency: 'LKR',
      shortDescription: 'Clay-oven roasted jumbo prawns',
      description: 'Clay-oven roasted jumbo prawns, Kashmiri chili marinade, stone-ground mustard',
      images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641'],
      ingredients: ['Jumbo Tiger Prawns', 'Kashmiri Chili', 'Hung Curd'],
      allergens: ['Shellfish', 'Milk'],
      dietaryTags: ['GLUTEN-FREE'],
      preparationTimeMinutes: 20,
      isAvailable: true,
      isFeatured: true,
      publicationStatus: 'PUBLISHED',
      displayOrder: 1,
      locationIds: ['loc-colombo-main'],
    });
  }

  let kingfishItem = await MenuItem.findOne({ slug: 'claypot-kingfish-thiyal' });
  if (!kingfishItem) {
    kingfishItem = await MenuItem.create({
      name: 'Claypot Kingfish Thiyal',
      slug: 'claypot-kingfish-thiyal',
      categoryId: category._id,
      categoryName: category.name,
      categorySlug: category.slug,
      priceMinor: 590000, // 5,900 LKR
      currency: 'LKR',
      shortDescription: 'Seared coastal kingfish simmered in goraka',
      description: 'Seared coastal kingfish simmered in wood-fired black goraka reduction',
      images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2'],
      ingredients: ['Wild Kingfish Fillet', 'Goraka'],
      allergens: ['Fish'],
      dietaryTags: ['GLUTEN-FREE', 'DAIRY-FREE'],
      preparationTimeMinutes: 20,
      isAvailable: true,
      isFeatured: false,
      displayOrder: 2,
      locationIds: ['loc-colombo-main'],
    });
  }

  console.log(`   -> Prawns Item: ${prawnItem.name} (${prawnItem.priceMinor / 100} LKR, ID: ${prawnItem._id})`);
  console.log(`   -> Kingfish Item: ${kingfishItem.name} (${kingfishItem.priceMinor / 100} LKR, ID: ${kingfishItem._id})`);

  // 2. Set up Kitchen Staff session
  console.log('2. Setting up Kitchen Staff account & session...');
  const kitchenStaff = await Staff.create({
    firstName: 'Executive',
    lastName: 'Chef Laurent',
    email: `kitchen_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.KITCHEN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const kitchenLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: kitchenStaff.email, password: plainPassword },
  });
  assert(kitchenLogin.status === 200, 'Kitchen staff login must succeed');
  const kitchenCookie = kitchenLogin.cookie!;

  // 3. Financial Calculation Verification
  console.log('3. [STEP 1] Validating Cart calculations: Subtotal, Service Charge (10%), Tax (2.5%), Total...');
  const expectedSubtotalMinor = prawnItem.priceMinor + kingfishItem.priceMinor; // 640000 + 590000 = 1230000 (12,300 LKR)
  const expectedServiceChargeMinor = Math.round(expectedSubtotalMinor * ORDER_CONFIG.serviceChargeRate); // 123000 (1,230 LKR)
  const expectedTaxMinor = Math.round(expectedSubtotalMinor * ORDER_CONFIG.taxRate); // 30750 (307.50 LKR -> 30750 minor)
  const expectedTotalMinor = expectedSubtotalMinor + expectedServiceChargeMinor + expectedTaxMinor; // 1383750

  assert(expectedSubtotalMinor === 1230000, 'Subtotal must equal 1,230,000 minor units (12,300 LKR)');
  assert(expectedServiceChargeMinor === 123000, 'Service charge must equal 10% (123,000 minor units)');
  assert(expectedTaxMinor === 30750, 'Tax must equal 2.5% (30,750 minor units)');
  console.log(`   -> Calculations verified: Subtotal = 12,300 LKR, Service (10%) = 1,230 LKR, Tax (2.5%) = 307.50 LKR, Total = ${expectedTotalMinor / 100} LKR`);

  // 4. Test Scheduled Pre-Order: Pickup time at 6:00 PM (scheduled > 30 minutes in advance)
  console.log('4. [STEP 2] Submitting Takeaway Order with scheduled pickup at 6:00 PM...');
  // Choose a pickup date and 6:00 PM slot:
  const targetPickupDate = new Date();
  targetPickupDate.setDate(targetPickupDate.getDate() + 1); // Tomorrow 6:00 PM to strictly ensure future scheduling
  targetPickupDate.setHours(18, 0, 0, 0); // 6:00 PM

  const idempotencyKey = `idem-kds-${testSuffix}`;
  const checkoutPayload = {
    items: [
      {
        menuItemId: prawnItem._id.toString(),
        quantity: 1,
        expectedUnitPriceMinor: prawnItem.priceMinor,
        specialInstructions: 'Extra roasted garlic & lemon',
      },
      {
        menuItemId: kingfishItem._id.toString(),
        quantity: 1,
        expectedUnitPriceMinor: kingfishItem.priceMinor,
        specialInstructions: 'Less spice, toasted coconut garnish',
      },
    ],
    orderType: 'TAKEAWAY',
    locationId: 'loc-colombo-main',
    customerName: 'Ananya Fernando',
    customerEmail: `ananya_${testSuffix}@luxury.com`,
    customerPhone: '+94 77 987 6543',
    customerNotes: 'VIP guest table tasting preview',
    pickupDate: targetPickupDate.toISOString().slice(0, 10),
    pickupTime: '6:00 PM',
    scheduledFor: targetPickupDate.toISOString(),
    expectedSubtotalMinor,
    confirmPriceChange: true,
    idempotencyKey,
  };

  const createOrderRes = await request('POST', '/api/orders', { body: checkoutPayload });
  assert(createOrderRes.status === 201, `Create order must return 201 Created. Got ${createOrderRes.status}: ${JSON.stringify(createOrderRes.data)}`);
  const createdOrder = createOrderRes.data.data;
  assert(!!createdOrder.orderReference, 'Order must have a unique reference');
  assert(createdOrder.orderStatus === OrderStatus.RECEIVED, 'Initial order status must be RECEIVED');
  assert(createdOrder.items.length === 2, 'Must have exactly 2 items');
  assert(createdOrder.items[0].dishName === 'Tandoori Malabar Prawns', 'Item 1 dishName must match');
  assert(createdOrder.items[1].dishName === 'Claypot Kingfish Thiyal', 'Item 2 dishName must match');
  assert(createdOrder.totalMinor === expectedTotalMinor, 'Total minor must match authoritative calculation');
  console.log(`   -> Confirmed Order created: ${createdOrder.orderReference} (${createdOrder.formattedTotal})`);

  // 5. Test Idempotency Protection
  console.log('5. [STEP 3] Verifying Idempotency Protection: resubmitting with same key returns existing order...');
  const duplicateRes = await request('POST', '/api/orders', { body: checkoutPayload });
  assert(duplicateRes.status === 200 || duplicateRes.status === 201, 'Duplicate submission must be gracefully handled');
  assert(duplicateRes.data.data.orderReference === createdOrder.orderReference, 'Must return same order reference');
  const countInDb = await Order.countDocuments({ idempotencyKey });
  assert(countInDb === 1, 'Only exactly 1 database document must exist for this idempotency key');
  console.log('   -> Idempotency verified: duplicate submission prevented, single order preserved!');

  // 6. Verify Scheduled Pre-Orders Category in KDS
  console.log('6. [STEP 4] Verifying Order categorisation: order scheduled for 6:00 PM appears in SCHEDULED PRE-ORDERS...');
  const schedRes = await request('GET', '/api/kitchen/orders/scheduled', { cookie: kitchenCookie });
  assert(schedRes.status === 200, 'Scheduled orders GET failed');
  const foundInScheduled = schedRes.data.data.find((o: any) => o.orderReference === createdOrder.orderReference);
  assert(!!foundInScheduled, 'Order scheduled beyond 30m must appear in Scheduled Pre-Orders queue');
  console.log(`   -> Verified Order ${createdOrder.orderReference} is in SCHEDULED PRE-ORDERS with pickup time 6:00 PM!`);

  // 7. Test Active Order Creation (within 30 min preparation window) for Live Kitchen Queue
  console.log('7. [STEP 5] Creating an immediate active Takeaway Order (pickup in 25 min) for Live KDS testing...');
  const activePickupDate = new Date(Date.now() + 25 * 60 * 1000);
  const activeOrder = await Order.create({
    orderReference: `AUR-LIVE-${testSuffix.slice(-4)}`,
    customerName: 'Marcus Sterling',
    customerEmail: `marcus_${testSuffix}@luxury.com`,
    customerPhone: '+94 71 555 4321',
    locationId: 'loc-colombo-main',
    orderType: OrderType.TAKEAWAY,
    items: [
      {
        menuItemId: prawnItem._id.toString(),
        dishName: prawnItem.name,
        quantity: 1,
        unitPriceMinor: prawnItem.priceMinor,
        lineTotalMinor: prawnItem.priceMinor,
        specialInstructions: 'Mild chili',
      },
      {
        menuItemId: kingfishItem._id.toString(),
        dishName: kingfishItem.name,
        quantity: 1,
        unitPriceMinor: kingfishItem.priceMinor,
        lineTotalMinor: kingfishItem.priceMinor,
        specialInstructions: 'Extra goraka glaze',
      },
    ],
    subtotalMinor: expectedSubtotalMinor,
    discountMinor: 0,
    taxMinor: expectedTaxMinor,
    serviceChargeMinor: expectedServiceChargeMinor,
    totalMinor: expectedTotalMinor,
    currency: 'LKR',
    orderStatus: OrderStatus.RECEIVED,
    paymentStatus: PaymentStatus.PAID,
    scheduledFor: activePickupDate,
    customerNotes: 'Please pack in eco-friendly luxury containers',
    statusHistory: [{ status: OrderStatus.RECEIVED, changedAt: new Date(), actorType: 'CUSTOMER' }],
  });

  // 8. Connect Guest Customer Socket to test real-time order tracking
  console.log('8. [STEP 6] Connecting Guest Customer Socket and subscribing to active order reference...');
  const guestSocket: ClientSocketType = ClientSocket(`http://localhost:${ctx.port}`, {
    transports: ['websocket'],
  });
  await new Promise<void>((resolve, reject) => {
    guestSocket.on('connect', () => resolve());
    guestSocket.on('connect_error', (err) => reject(err));
  });

  const subPromise = new Promise<any>((resolve) => {
    guestSocket.on('subscribe:success', (d) => resolve(d));
  });
  guestSocket.emit('subscribe:order', {
    orderReference: activeOrder.orderReference,
    email: activeOrder.customerEmail,
  });
  const subAck = await subPromise;
  assert(subAck.orderReference === activeOrder.orderReference, 'Guest socket must be subscribed to order room');
  console.log(`   -> Guest Customer connected and subscribed to live room for ${activeOrder.orderReference}!`);

  // 9. Verify Active Order appears in KDS NEW ORDERS
  console.log('9. [STEP 7] Verifying Kitchen Board sees active order in NEW ORDERS...');
  const boardRes = await request('GET', '/api/kitchen/orders', { cookie: kitchenCookie });
  assert(boardRes.status === 200, 'GET /api/kitchen/orders must succeed');
  const inNew = boardRes.data.data.newOrders.find((o: any) => o.orderReference === activeOrder.orderReference);
  assert(!!inNew, 'Active order must appear in NEW ORDERS column');
  console.log(`   -> Order ${activeOrder.orderReference} confirmed in NEW ORDERS queue!`);

  // 10. Kitchen Action: Accept Order -> CONFIRMED
  console.log('10. [STEP 8] Kitchen executes "Accept Order" -> status transitions to CONFIRMED...');
  const acceptSocketPromise = new Promise<any>((resolve) => {
    guestSocket.on('orders.statusChanged', (payload) => {
      if (payload.orderReference === activeOrder.orderReference && payload.orderStatus === OrderStatus.CONFIRMED) {
        resolve(payload);
      }
    });
  });

  const acceptRes = await request('POST', `/api/kitchen/orders/${activeOrder._id}/accept`, {
    cookie: kitchenCookie,
  });
  assert(acceptRes.status === 200, 'Accept order API must succeed');
  const acceptPayload = await acceptSocketPromise;
  assert(acceptPayload.orderStatus === OrderStatus.CONFIRMED, 'Customer socket must receive CONFIRMED status update');
  console.log('   -> Real-time Socket.IO: Customer tracking updated to "Order Accepted" (CONFIRMED)!');

  // 11. Kitchen Action: Start Preparation -> PREPARING
  console.log('11. [STEP 9] Kitchen executes "Start Prep" -> status transitions to PREPARING with live timer...');
  const prepSocketPromise = new Promise<any>((resolve) => {
    guestSocket.on('orders.statusChanged', (payload) => {
      if (payload.orderReference === activeOrder.orderReference && payload.orderStatus === OrderStatus.PREPARING) {
        resolve(payload);
      }
    });
  });

  const startPrepRes = await request('POST', `/api/kitchen/orders/${activeOrder._id}/start`, {
    cookie: kitchenCookie,
    body: { note: 'Pan-searing prawns and claypot reduction simmering' },
  });
  assert(startPrepRes.status === 200, 'Start prep API must succeed');
  const prepPayload = await prepSocketPromise;
  assert(prepPayload.orderStatus === OrderStatus.PREPARING, 'Customer socket must receive PREPARING status update');
  assert(!!prepPayload.preparationStartedAt, 'preparationStartedAt must be recorded for live timer');
  console.log('   -> Real-time Socket.IO: Customer tracking updated to "Preparing" (PREPARING)!');

  // 12. Kitchen Action: Mark Ready -> READY ("Ready for Pickup")
  console.log('12. [STEP 10] Kitchen executes "Mark Ready" -> status transitions to READY ("Ready for Pickup")...');
  const readySocketPromise = new Promise<any>((resolve) => {
    guestSocket.on('orders.statusChanged', (payload) => {
      if (payload.orderReference === activeOrder.orderReference && payload.orderStatus === OrderStatus.READY) {
        resolve(payload);
      }
    });
  });

  const readyRes = await request('POST', `/api/kitchen/orders/${activeOrder._id}/ready`, {
    cookie: kitchenCookie,
    body: { note: 'Packed in heated insulated pass box' },
  });
  assert(readyRes.status === 200, 'Mark ready API must succeed');
  const readyPayload = await readySocketPromise;
  assert(readyPayload.orderStatus === OrderStatus.READY, 'Customer socket must receive READY status update');
  assert(!!readyPayload.readyAt, 'readyAt timestamp must be recorded');
  console.log('   -> Real-time Socket.IO: Customer tracking updated to "Ready for Pickup" (READY)!');

  // 13. Kitchen Action: Complete Handoff -> COMPLETED ("Completed")
  console.log('13. [STEP 11] Kitchen executes "Complete Handoff" -> status transitions to COMPLETED...');
  const completeSocketPromise = new Promise<any>((resolve) => {
    guestSocket.on('orders.statusChanged', (payload) => {
      if (payload.orderReference === activeOrder.orderReference && payload.orderStatus === OrderStatus.COMPLETED) {
        resolve(payload);
      }
    });
  });

  const completeRes = await request('POST', `/api/kitchen/orders/${activeOrder._id}/complete`, {
    cookie: kitchenCookie,
    body: { note: 'Handed off to guest Marcus Sterling at counter' },
  });
  assert(completeRes.status === 200, 'Complete handoff API must succeed');
  const completePayload = await completeSocketPromise;
  assert(completePayload.orderStatus === OrderStatus.COMPLETED, 'Customer socket must receive COMPLETED status update');
  assert(!!completePayload.completedAt, 'completedAt timestamp must be recorded');
  console.log('   -> Real-time Socket.IO: Customer tracking updated to "Completed" (COMPLETED)!');

  // 14. Customer Tracking API Verification (Page Refresh simulation)
  console.log('14. [STEP 12] Simulating page reload: GET /api/orders/track/:reference returns authoritative COMPLETED state...');
  const reloadRes = await request('GET', `/api/orders/track/${activeOrder.orderReference}`);
  assert(reloadRes.status === 200, 'Track API must succeed without auth');
  const reloaded = reloadRes.data.data;
  assert(reloaded.orderStatus === OrderStatus.COMPLETED, 'Persisted status must be COMPLETED');
  assert(reloaded.statusHistory.length === 5, 'Status history must have all 5 milestones recorded');
  assert(reloaded.items.length === 2, 'Items must be intact');
  assert(reloaded.formattedTotal.includes('LKR'), 'Formatted total must include currency');
  console.log('   -> Page reload verification passed: Full status history and pricing intact!');

  // Cleanup
  console.log('\nCleaning up test records from database...');
  guestSocket.disconnect();
  await Order.deleteMany({
    _id: { $in: [new mongoose.Types.ObjectId(createdOrder.id), activeOrder._id] },
  });
  await Staff.deleteOne({ _id: kitchenStaff._id });
  await new Promise<void>((resolve) => ctx.server.close(() => resolve()));

  console.log('\n======================================================================');
  console.log('  ALL 12 END-TO-END ORDER SYNCHRONIZATION TESTS PASSED SUCCESSFULLY!  ');
  console.log('======================================================================\n');
}

runE2EOrderLifecycleTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ E2E ORDER LIFECYCLE TEST FAILED:', err);
    process.exit(1);
  });
