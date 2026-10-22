import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { Order } from '../models/order.model';
import { Reservation } from '../models/reservation.model';
import { Table } from '../models/table.model';
import { CleaningTask } from '../models/cleaningTask.model';
import { ServiceRequest } from '../models/serviceRequest.model';
import { WaitingList } from '../models/waitingList.model';
import { VIPBooking } from '../models/vipBooking.model';
import { EventInquiry } from '../models/eventInquiry.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { OperationalAlert } from '../models/operationalAlert.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { OrderStatus, OrderType, PaymentStatus } from '../types/order';
import { ReservationStatus, ReservationSource } from '../types/reservation';
import { TableStatus, TableSection } from '../types/table';
import { CleaningTaskStatus, ServiceRequestStatus, ServiceRequestType, ServiceRequestPriority } from '../types/floor';
import { WaitingListStatus } from '../types/waitingList';
import { AlertStatus, AlertSeverity, AlertType, AlertSourceType, ManagerOverrideAction } from '../types/manager';
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

async function runStage13TestSuite() {
  console.log('\n============================================================');
  console.log('🧪 AURELLE STAGE 13 — MANAGER OPERATIONS INTEGRATION SUITE');
  console.log('============================================================\n');

  // Connect to Database
  if (mongoose.connection.readyState !== 1) {
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 25000 });
    console.log('✅ Connected to MongoDB Atlas');
  }

  // Spin up test server
  const app = createApp();
  const server = http.createServer(app);
  setupSocketServer(server);

  const port = 5098;
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
  console.log(`🚀 Test HTTP server initialized on port ${port}`);

  let managerCookie: string = '';
  let floorCookie: string = '';
  let testManagerId: string = '';
  let testFloorId: string = '';
  const testLocationId = 'loc-colombo-main';
  const unauthorizedLocationId = 'loc-kandy-vip';

  try {
    // ----------------------------------------------------
    // PHASE 1: SEED TEST STAFF ACCOUNTS & AUTHENTICATION
    // ----------------------------------------------------
    console.log('\n--- PHASE 1: Staff Roles & Authentication Setup ---');

    const hashedPassword = await hashPassword('Stage13@TestPass!');

    // 1. Manager Account (assigned ONLY to loc-colombo-main)
    let managerStaff = await Staff.findOne({ email: 'stage13.manager@aurelle.com' });
    if (!managerStaff) {
      managerStaff = await Staff.create({
        firstName: 'Marcus',
        lastName: 'Vance',
        email: 'stage13.manager@aurelle.com',
        passwordHash: hashedPassword,
        role: StaffRole.MANAGER,
        status: StaffStatus.ACTIVE,
        locationIds: [testLocationId],
      });
    }
    testManagerId = managerStaff._id.toString();

    // 2. Floor Account (restricted role without manager permissions)
    let floorStaff = await Staff.findOne({ email: 'stage13.floor@aurelle.com' });
    if (!floorStaff) {
      floorStaff = await Staff.create({
        firstName: 'Fiona',
        lastName: 'Floor',
        email: 'stage13.floor@aurelle.com',
        passwordHash: hashedPassword,
        role: StaffRole.FLOOR,
        status: StaffStatus.ACTIVE,
        locationIds: [testLocationId],
      });
    }
    testFloorId = floorStaff._id.toString();

    // Log in as Manager
    const managerLogin = await request('POST', '/api/staff/auth/login', {
      body: { email: 'stage13.manager@aurelle.com', password: 'Stage13@TestPass!' },
    });
    assert(managerLogin.status === 200, `Manager login failed with status ${managerLogin.status}`);
    managerCookie = managerLogin.cookie!;
    console.log('  ✓ Manager authenticated successfully');

    // Log in as Floor
    const floorLogin = await request('POST', '/api/staff/auth/login', {
      body: { email: 'stage13.floor@aurelle.com', password: 'Stage13@TestPass!' },
    });
    assert(floorLogin.status === 200, `Floor login failed with status ${floorLogin.status}`);
    floorCookie = floorLogin.cookie!;
    console.log('  ✓ Floor staff authenticated successfully');

    // ----------------------------------------------------
    // PHASE 2: SECURITY, RBAC & LOCATION SCOPING
    // ----------------------------------------------------
    console.log('\n--- PHASE 2: Security, RBAC & Location Authorization ---');

    // Test 1: Unauthenticated request to /api/manager/overview returns 401
    const unauthRes = await request('GET', '/api/manager/overview');
    assert(unauthRes.status === 401, `Expected 401 for unauthenticated request, got ${unauthRes.status}`);
    console.log('  ✓ Unauthenticated user receives 401 Unauthorized');

    // Test 2: Floor staff attempting to access manager overview returns 403 Forbidden
    const floorAccessRes = await request('GET', '/api/manager/overview', { cookie: floorCookie });
    assert(floorAccessRes.status === 403, `Expected 403 for unauthorized floor role, got ${floorAccessRes.status}`);
    console.log('  ✓ Unauthorized staff role (FLOOR) receives 403 Forbidden');

    // Test 3: Manager can access manager overview for assigned location
    const managerOverviewRes = await request('GET', `/api/manager/overview?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(managerOverviewRes.status === 200, `Expected 200 for manager overview, got ${managerOverviewRes.status}`);
    assert(managerOverviewRes.data.success === true, 'Response success should be true');
    console.log('  ✓ Authenticated MANAGER accesses manager overview (200 OK)');

    // Test 4: Manager cannot access unauthorized location (loc-kandy-vip) returns 403 Forbidden
    const forbiddenLocRes = await request('GET', `/api/manager/overview?locationId=${unauthorizedLocationId}`, {
      cookie: managerCookie,
    });
    assert(forbiddenLocRes.status === 403, `Expected 403 for unauthorized location, got ${forbiddenLocRes.status}`);
    console.log('  ✓ Cross-location access blocked with 403 Forbidden');

    // Test 5: Manager cannot access administrator-only staff management API
    const adminStaffRes = await request('GET', '/api/admin/staff', { cookie: managerCookie });
    assert(adminStaffRes.status === 403, `Expected 403 for manager attempting admin staff API, got ${adminStaffRes.status}`);
    console.log('  ✓ Manager blocked from admin-only APIs (403 Forbidden)');

    // ----------------------------------------------------
    // PHASE 3: REAL SEED DATA & OVERVIEW AGGREGATION
    // ----------------------------------------------------
    console.log('\n--- PHASE 3: Live MongoDB Metrics & Overview Aggregation ---');

    const uniquePrefix = `MGR-${Date.now().toString().slice(-5)}`;

    // Create a real active order
    const testOrder = await Order.create({
      orderReference: `${uniquePrefix}-ORD`,
      customerName: 'Sir Arthur Wellesley',
      customerEmail: 'arthur@wellington.org',
      customerPhone: '+94770001111',
      locationId: testLocationId,
      orderType: OrderType.DINE_IN_PREORDER,
      orderStatus: OrderStatus.PREPARING,
      paymentStatus: PaymentStatus.PAID,
      scheduledFor: new Date(),
      subtotalMinor: 1500000,
      taxMinor: 37500,
      serviceChargeMinor: 150000,
      totalMinor: 1687500,
      currency: 'LKR',
      items: [
        {
          menuItemId: 'dish-wagyu',
          dishName: 'A5 Wagyu Striploin',
          quantity: 2,
          unitPriceMinor: 750000,
          lineTotalMinor: 1500000,
          selectedOptions: [],
        },
      ],
      statusHistory: [
        { status: OrderStatus.PREPARING, changedAt: new Date(), actorType: 'STAFF', note: 'Kitchen started' },
      ],
    });

    // Create a real reservation for today
    const now = new Date();
    const testReservation = await Reservation.create({
      reservationReference: `${uniquePrefix}-RES`,
      locationId: testLocationId,
      guestName: 'Lady Catherine',
      guestEmail: 'catherine@debourgh.co.uk',
      guestPhone: '+94770002222',
      guestCount: 4,
      reservationDate: now,
      startAt: new Date(now.getTime() + 3600000),
      endAt: new Date(now.getTime() + 7200000),
      durationMinutes: 120,
      timezone: 'Asia/Colombo',
      status: ReservationStatus.CONFIRMED,
      source: ReservationSource.ONLINE_CUSTOMER,
      tableNumbers: ['T12'],
      seatingPreference: 'Main Dining Room',
      statusHistory: [{ status: ReservationStatus.CONFIRMED, changedAt: now, actorType: 'STAFF' }],
    });

    // Create a real occupied table
    let testTable = await Table.findOne({ tableNumber: 'MGR-T1', locationId: testLocationId });
    if (!testTable) {
      testTable = await Table.create({
        tableNumber: 'MGR-T1',
        name: 'Manager Test Table',
        locationId: testLocationId,
        capacity: 4,
        minPartySize: 2,
        section: TableSection.MAIN_DINING,
        status: TableStatus.OCCUPIED,
        isActive: true,
      });
    } else {
      testTable.status = TableStatus.OCCUPIED;
      await testTable.save();
    }

    // Verify Overview Aggregation endpoint
    const overviewRes = await request('GET', `/api/manager/overview?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(overviewRes.status === 200, 'Overview response status should be 200');
    const ovData = overviewRes.data.data;
    assert(typeof ovData.metrics.activeOrders === 'number', 'activeOrders should be a number');
    assert(ovData.metrics.activeOrders >= 1, 'Should include at least 1 active order');
    assert(ovData.metrics.todayReservations >= 1, 'Should include at least 1 today reservation');
    assert(ovData.metrics.occupiedTables >= 1, 'Should include at least 1 occupied table');
    assert(ovData.floorOccupancy.totalTables >= 1, 'Total tables count should be present');
    console.log(`  ✓ Overview metrics aggregated accurately:`);
    console.log(`    - Active Orders: ${ovData.metrics.activeOrders}`);
    console.log(`    - Today Reservations: ${ovData.metrics.todayReservations}`);
    console.log(`    - Occupied Tables: ${ovData.metrics.occupiedTables}`);
    console.log(`    - Floor Occupancy: ${ovData.floorOccupancy.occupancyRatePercent}%`);

    // ----------------------------------------------------
    // PHASE 4: DOMAIN MONITORING ENDPOINTS
    // ----------------------------------------------------
    console.log('\n--- PHASE 4: Domain Monitoring Endpoints ---');

    // 1. Order Monitoring
    const ordersRes = await request('GET', `/api/manager/orders?locationId=${testLocationId}&search=${testOrder.orderReference}`, {
      cookie: managerCookie,
    });
    assert(ordersRes.status === 200, 'Orders query should return 200');
    assert(ordersRes.data.data.orders.length >= 1, 'Should find seeded order by reference');
    console.log('  ✓ Orders monitoring endpoint verified with search & filters');

    // 2. Order Details
    const orderDetailRes = await request('GET', `/api/manager/orders/${testOrder._id}?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(orderDetailRes.status === 200, 'Order detail should return 200');
    assert(orderDetailRes.data.data.orderReference === testOrder.orderReference, 'Order ref should match');
    console.log('  ✓ Order details endpoint verified');

    // 3. Kitchen Monitoring
    const kitchenRes = await request('GET', `/api/manager/kitchen?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(kitchenRes.status === 200, 'Kitchen query should return 200');
    assert(typeof kitchenRes.data.data.counts.totalActive === 'number', 'Kitchen active count should be number');
    console.log('  ✓ Kitchen monitoring pipeline tickets verified');

    // 4. Reservation Monitoring
    const resRes = await request('GET', `/api/manager/reservations?locationId=${testLocationId}&search=${testReservation.reservationReference}`, {
      cookie: managerCookie,
    });
    assert(resRes.status === 200, 'Reservation query should return 200');
    assert(resRes.data.data.reservations.length >= 1, 'Should find seeded reservation');
    console.log('  ✓ Reservation monitoring endpoint verified');

    // 5. Reception Monitoring
    const receptionRes = await request('GET', `/api/manager/reception?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(receptionRes.status === 200, 'Reception query should return 200');
    assert(typeof receptionRes.data.data.counts.expectedArrivals === 'number', 'Expected arrivals count should exist');
    console.log('  ✓ Reception monitoring endpoint verified');

    // 6. Floor Operations Monitoring
    const floorRes = await request('GET', `/api/manager/floor?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(floorRes.status === 200, 'Floor query should return 200');
    assert(Array.isArray(floorRes.data.data.tables), 'Tables list should be returned');
    console.log('  ✓ Floor operations monitoring endpoint verified');

    // 7. VIP & Events Monitoring
    const vipRes = await request('GET', `/api/manager/vip-events?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(vipRes.status === 200, 'VIP query should return 200');
    assert(typeof vipRes.data.data.counts.upcomingBookings === 'number', 'Upcoming VIP bookings count exists');
    console.log('  ✓ VIP & Events monitoring endpoint verified');

    // 8. Staff Operations View
    const staffRes = await request('GET', `/api/manager/staff?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(staffRes.status === 200, 'Staff assignments query should return 200');
    assert(staffRes.data.data.assignments.length >= 1, 'Should return staff assigned to location');
    console.log('  ✓ Staff operations overview endpoint verified');

    // ----------------------------------------------------
    // PHASE 5: OPERATIONAL ALERTS & DEDUPLICATION
    // ----------------------------------------------------
    console.log('\n--- PHASE 5: Operational Alerts, Deduplication & Management ---');

    // Create a delayed order to test dynamic alert generation
    const delayedOrder = await Order.create({
      orderReference: `${uniquePrefix}-DLY`,
      customerName: 'Delayed Party',
      customerEmail: 'delayed@test.com',
      customerPhone: '+94770009999',
      locationId: testLocationId,
      orderType: OrderType.TAKEAWAY,
      orderStatus: OrderStatus.PREPARING,
      paymentStatus: PaymentStatus.PAID,
      scheduledFor: new Date(),
      subtotalMinor: 500000,
      taxMinor: 12500,
      serviceChargeMinor: 50000,
      totalMinor: 562500,
      currency: 'LKR',
      items: [{ menuItemId: 'd1', dishName: 'Truffle Pasta', quantity: 1, unitPriceMinor: 500000, lineTotalMinor: 500000 }],
      createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago (> 25m threshold)
    });

    // Query alerts (triggers dynamic sync)
    const alertsRes = await request('GET', `/api/manager/alerts?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(alertsRes.status === 200, 'Alerts endpoint should return 200');
    const alertList = alertsRes.data.data.alerts;
    assert(alertList.length >= 1, 'Should have at least 1 alert');

    const delayedAlert = alertList.find((a: any) => a.sourceId === delayedOrder._id.toString());
    assert(!!delayedAlert, 'Dynamic delayed order alert was not created');
    assert(delayedAlert.status === 'OPEN', 'Alert initial status should be OPEN');
    console.log(`  ✓ Alert generated dynamically: "${delayedAlert.message}"`);

    // Verify Deduplication: Querying alerts again must NOT create duplicate alerts for the same delayed order
    await request('GET', `/api/manager/alerts?locationId=${testLocationId}`, { cookie: managerCookie });
    const duplicateCheck = await OperationalAlert.countDocuments({
      locationId: testLocationId,
      alertType: AlertType.ORDER_DELAYED,
      sourceId: delayedOrder._id.toString(),
      status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
    });
    assert(duplicateCheck === 1, `Expected exactly 1 open alert, found ${duplicateCheck}`);
    console.log('  ✓ Alert deduplication confirmed: no duplicate alerts generated');

    // Test Alert Acknowledgment
    const ackRes = await request('POST', `/api/manager/alerts/${delayedAlert.id}/acknowledge?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(ackRes.status === 200, 'Alert acknowledge should return 200');
    assert(ackRes.data.data.status === 'ACKNOWLEDGED', 'Status should be ACKNOWLEDGED');
    assert(!!ackRes.data.data.acknowledgedBy, 'AcknowledgedBy should be populated');
    console.log('  ✓ Alert acknowledged atomically with manager identity');

    // Test Alert Resolution
    const resolveRes = await request('POST', `/api/manager/alerts/${delayedAlert.id}/resolve?locationId=${testLocationId}`, {
      cookie: managerCookie,
      body: { resolutionNotes: 'Kitchen expediter dispatched order.' },
    });
    assert(resolveRes.status === 200, 'Alert resolve should return 200');
    assert(resolveRes.data.data.status === 'RESOLVED', 'Status should be RESOLVED');
    assert(resolveRes.data.data.resolutionNotes === 'Kitchen expediter dispatched order.', 'Resolution notes recorded');
    console.log('  ✓ Alert resolved atomically with resolution notes recorded');

    // ----------------------------------------------------
    // PHASE 6: MANAGER OVERRIDES & SAFEGUARDS
    // ----------------------------------------------------
    console.log('\n--- PHASE 6: Manager Overrides & Safeguards ---');

    // 1. Validation test: Missing or short reason must fail
    const invalidOverride = await request('POST', `/api/manager/overrides?locationId=${testLocationId}`, {
      cookie: managerCookie,
      body: {
        action: ManagerOverrideAction.FORCE_CLEANING_COMPLETE,
        targetId: 'dummy-id',
        reason: 'no', // too short (< 5 chars)
      },
    });
    assert(invalidOverride.status === 400, `Expected 400 for missing reason, got ${invalidOverride.status}`);
    console.log('  ✓ Override rejected when operational reason is under 5 characters');

    // 2. Real override execution: Force Cleaning Complete
    // Create an uncleaned table and cleaning task
    const dirtyTable = await Table.create({
      tableNumber: 'MGR-DIRTY',
      name: 'Dirty Table',
      locationId: testLocationId,
      capacity: 2,
      minPartySize: 1,
      section: TableSection.MAIN_DINING,
      status: TableStatus.AWAITING_CLEANING,
      isActive: true,
    });

    const cleaningTask = await CleaningTask.create({
      locationId: testLocationId,
      tableId: dirtyTable._id.toString(),
      tableNumber: dirtyTable.tableNumber,
      status: CleaningTaskStatus.PENDING,
      priority: ServiceRequestPriority.HIGH,
    });

    const overrideRes = await request('POST', `/api/manager/overrides?locationId=${testLocationId}`, {
      cookie: managerCookie,
      body: {
        action: ManagerOverrideAction.FORCE_CLEANING_COMPLETE,
        targetId: cleaningTask._id.toString(),
        reason: 'VIP guest walk-in requires immediate seating.',
      },
    });
    assert(overrideRes.status === 200, `Expected 200 for override execution, got ${overrideRes.status}`);

    // Verify database state: task completed, table set to AVAILABLE
    const updatedTable = await Table.findById(dirtyTable._id);
    assert(updatedTable?.status === TableStatus.AVAILABLE, 'Table status should be updated to AVAILABLE');
    const updatedTask = await CleaningTask.findById(cleaningTask._id);
    assert(updatedTask?.status === CleaningTaskStatus.COMPLETED, 'Cleaning task should be COMPLETED');
    console.log('  ✓ Manager override executed: Table released to AVAILABLE and task COMPLETED');

    // ----------------------------------------------------
    // PHASE 7: DAILY REPORTS & CSV EXPORT
    // ----------------------------------------------------
    console.log('\n--- PHASE 7: Daily Operational Reports & CSV Export ---');

    // Mark test order as COMPLETED to verify revenue calculation
    testOrder.orderStatus = OrderStatus.COMPLETED;
    testOrder.completedAt = new Date();
    testOrder.readyAt = new Date(testOrder.createdAt.getTime() + 18 * 60000);
    await testOrder.save();

    const reportRes = await request('GET', `/api/manager/reports?locationId=${testLocationId}&dateRange=today`, {
      cookie: managerCookie,
    });
    assert(reportRes.status === 200, 'Report endpoint should return 200');
    const reportData = reportRes.data.data;
    assert(reportData.metrics.completedOrders >= 1, 'Completed orders should be >= 1');
    assert(reportData.metrics.totalRevenueMinor >= testOrder.totalMinor, 'Revenue should reflect completed order');
    assert(Array.isArray(reportData.dailyBreakdown), 'Daily breakdown array should exist');
    console.log(`  ✓ Operational report calculated:`);
    console.log(`    - Completed Orders: ${reportData.metrics.completedOrders}`);
    console.log(`    - Total Revenue: ${(reportData.metrics.totalRevenueMinor / 100).toFixed(2)} ${reportData.metrics.currency}`);
    console.log(`    - Avg Prep Time: ${reportData.metrics.averagePrepTimeMinutes}m`);

    // Test CSV Export
    const csvRes = await request('GET', `/api/manager/reports/export?locationId=${testLocationId}&dateRange=today`, {
      cookie: managerCookie,
    });
    assert(csvRes.status === 200, 'CSV export should return 200');
    assert(csvRes.contentType?.includes('text/csv') || typeof csvRes.data === 'string', 'Should return CSV format');
    assert(csvRes.data.includes('AURELLE RESTAURANT MANAGEMENT PLATFORM'), 'CSV should contain header');
    assert(csvRes.data.includes('Total Orders'), 'CSV should contain metrics');
    console.log('  ✓ Operational report exported as compliant CSV document');

    // ----------------------------------------------------
    // PHASE 8: ACTIVITY HISTORY & AUDIT LOGGING
    // ----------------------------------------------------
    console.log('\n--- PHASE 8: Scoped Activity History & Audit Logging ---');

    const activityRes = await request('GET', `/api/manager/activity?locationId=${testLocationId}`, {
      cookie: managerCookie,
    });
    assert(activityRes.status === 200, 'Activity history should return 200');
    const activities = activityRes.data.data.activities;
    assert(activities.length >= 1, 'Should contain audit logs for manager actions');

    const overrideLog = activities.find((a: any) => a.action === 'TABLE_CLEANING_FORCED');
    assert(!!overrideLog, 'Audit log for TABLE_CLEANING_FORCED should be present');
    console.log('  ✓ Activity history returned location-scoped sanitized audit records');
    console.log(`    - Latest action: ${activities[0].action} by ${activities[0].actorName}`);

    // Clean up test records
    await Order.deleteMany({ orderReference: { $regex: uniquePrefix } });
    await Reservation.deleteMany({ reservationReference: { $regex: uniquePrefix } });
    await Table.deleteMany({ tableNumber: { $in: ['MGR-T1', 'MGR-DIRTY'] } });
    await CleaningTask.deleteMany({ tableNumber: 'MGR-DIRTY' });
    await OperationalAlert.deleteMany({ locationId: testLocationId, sourceReference: { $regex: uniquePrefix } });

    console.log('\n============================================================');
    console.log('🎉 ALL 8 PHASES & 24 REQUIREMENTS PASSED WITH ZERO ERRORS');
    console.log('============================================================\n');
  } finally {
    await closeSocketServer();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }
}

runStage13TestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  });
