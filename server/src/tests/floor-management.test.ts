import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { User } from '../models/user.model';
import { Reservation } from '../models/reservation.model';
import { Table } from '../models/table.model';
import { TableSlotAllocation } from '../models/tableSlotAllocation.model';
import { DiningSession } from '../models/diningSession.model';
import { ServiceRequest } from '../models/serviceRequest.model';
import { CleaningTask } from '../models/cleaningTask.model';
import { KitchenAlert } from '../models/kitchenAlert.model';
import { Order } from '../models/order.model';
import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { TableStatus, TableSection } from '../types/table';
import {
  DiningSessionStatus,
  ServiceRequestStatus,
  ServiceRequestType,
  CleaningTaskStatus,
  KitchenAlertStatus,
} from '../types/floor';
import { ReservationStatus, ReservationSource } from '../types/reservation';
import { OrderStatus, OrderType } from '../types/order';
import { hashPassword } from '../utils/password';
import { setupSocketServer } from '../sockets/socket.server';
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
    cookie: setCookie ? setCookie.split(';')[0] : undefined,
  };
}

async function runFloorTestSuite() {
  console.log('\n=============================================================');
  console.log('   AURELLE STAGE 11: FLOOR MANAGEMENT SYSTEM TEST SUITE      ');
  console.log('=============================================================\n');

  console.log('Connecting to MongoDB Atlas...');
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI);
  }

  const app = createApp();
  const server = http.createServer(app);
  setupSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address() as any;
      ctx = {
        server,
        port: addr.port,
        baseUrl: `http://localhost:${addr.port}`,
      };
      resolve();
    });
  });

  const testSuffix = Date.now().toString();
  const plainPassword = 'Aurelle@Floor2026!';
  const passwordHash = await hashPassword(plainPassword);

  console.log('1. Setting up accounts: Admin, Manager, Floor Staff, Kitchen Staff, Kandy Floor Staff...');

  const adminStaff = await Staff.create({
    firstName: 'Admin',
    lastName: 'Director',
    email: `admin_flr_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.ADMIN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main', 'loc-kandy-vip'],
  });

  const floorStaff = await Staff.create({
    firstName: 'Felix',
    lastName: 'FloorCaptain',
    email: `floor_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.FLOOR,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const kitchenStaff = await Staff.create({
    firstName: 'Chef',
    lastName: 'Cook',
    email: `kitchen_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.KITCHEN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const kandyFloorStaff = await Staff.create({
    firstName: 'Kandy',
    lastName: 'Server',
    email: `kandy_flr_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.FLOOR,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-kandy-vip'],
  });

  // Login sessions
  const adminLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: adminStaff.email, password: plainPassword },
  });
  assert(adminLogin.status === 200, 'Admin login failed');
  const adminCookie = adminLogin.cookie!;

  const floorLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: floorStaff.email, password: plainPassword },
  });
  assert(floorLogin.status === 200, 'Floor login failed');
  const floorCookie = floorLogin.cookie!;

  const kitchenLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: kitchenStaff.email, password: plainPassword },
  });
  assert(kitchenLogin.status === 200, 'Kitchen login failed');
  const kitchenCookie = kitchenLogin.cookie!;

  const kandyLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: kandyFloorStaff.email, password: plainPassword },
  });
  assert(kandyLogin.status === 200, 'Kandy staff login failed');
  const kandyCookie = kandyLogin.cookie!;

  console.log('   ✅ [PASS] 1. Staff authentication established across roles.');

  // Pre-seed tables for colombo
  await ensureLocationTablesConfigured('loc-colombo-main');

  // -------------------------------------------------------------
  // TEST 2: RBAC Protection on Floor Endpoints
  // -------------------------------------------------------------
  console.log('\n2. Testing RBAC Protection on Floor Management APIs...');
  const unauthRes = await request('GET', '/api/floor/overview?locationId=loc-colombo-main');
  assert(unauthRes.status === 401, 'Unauthenticated access must be rejected with 401');

  const kitchenRes = await request('GET', '/api/floor/overview?locationId=loc-colombo-main', {
    cookie: kitchenCookie,
  });
  assert(kitchenRes.status === 403, 'Kitchen staff must be forbidden from floor APIs (403)');

  const floorRes = await request('GET', '/api/floor/overview?locationId=loc-colombo-main', {
    cookie: floorCookie,
  });
  assert(floorRes.status === 200, 'Authorized floor staff must access floor overview (200 OK)');
  assert(floorRes.data.success === true, 'Response must have success: true');
  console.log('   ✅ [PASS] 2. RBAC strictly guards floor operations endpoints');

  // -------------------------------------------------------------
  // TEST 3: Location Access Authorization
  // -------------------------------------------------------------
  console.log('\n3. Testing Location Access Boundaries...');
  const crossLocRes = await request('GET', '/api/floor/overview?locationId=loc-colombo-main', {
    cookie: kandyCookie,
  });
  assert(crossLocRes.status === 403, 'Kandy staff accessing Colombo floor must receive 403');
  console.log('   ✅ [PASS] 3. Restaurant location boundaries strictly enforced');

  // -------------------------------------------------------------
  // TEST 4: Table Inventory & Layout API
  // -------------------------------------------------------------
  console.log('\n4. Testing Floor Tables & Layout Retrieval...');
  const tablesRes = await request('GET', '/api/floor/tables?locationId=loc-colombo-main', {
    cookie: floorCookie,
  });
  assert(tablesRes.status === 200, 'Floor tables request must return 200');
  assert(Array.isArray(tablesRes.data.data), 'Data must be an array of tables');
  assert(tablesRes.data.data.length >= 18, 'Colombo must have at least 18 tables configured');

  const layoutRes = await request('GET', '/api/floor/layout?locationId=loc-colombo-main', {
    cookie: floorCookie,
  });
  assert(layoutRes.status === 200, 'Floor layout request must return 200');
  assert(typeof layoutRes.data.data.setupRequired === 'boolean', 'Layout must indicate setup status');
  console.log(`   ✅ [PASS] 4. Floor tables (${tablesRes.data.data.length}) and layout retrieved successfully`);

  // -------------------------------------------------------------
  // TEST 5: Floor Layout Configuration (Admin only)
  // -------------------------------------------------------------
  console.log('\n5. Testing Floor Layout Configuration & Permission Gates...');
  const sampleTable = tablesRes.data.data[0];

  // Unauthorized floor staff attempting layout edit
  const floorEditRes = await request('PUT', '/api/floor/layout', {
    cookie: floorCookie,
    body: {
      locationId: 'loc-colombo-main',
      layout: [
        {
          tableId: sampleTable.id,
          positionX: 25,
          positionY: 30,
          width: 15,
          height: 15,
          shape: 'ROUND',
        },
      ],
    },
  });
  assert(floorEditRes.status === 403, 'Floor staff must NOT be permitted to modify layout (403)');

  // Admin updating layout
  const adminEditRes = await request('PUT', '/api/floor/layout', {
    cookie: adminCookie,
    body: {
      locationId: 'loc-colombo-main',
      layout: [
        {
          tableId: sampleTable.id,
          positionX: 25,
          positionY: 30,
          width: 15,
          height: 15,
          shape: 'ROUND',
        },
      ],
    },
  });
  assert(adminEditRes.status === 200, 'Admin must successfully update layout geometry (200)');
  console.log('   ✅ [PASS] 5. Floor layout geometry updates guarded by administrator permission');

  // -------------------------------------------------------------
  // TEST 6: Table Staff Assignment & My Tables View
  // -------------------------------------------------------------
  console.log('\n6. Testing Floor Staff Table Assignment & My Tables...');
  const assignRes = await request('POST', `/api/floor/tables/${sampleTable.id}/assign`, {
    cookie: adminCookie,
    body: { staffId: floorStaff._id.toString() },
  });
  assert(assignRes.status === 200, 'Assign staff must return 200');
  assert(assignRes.data.data.assignedStaffId === floorStaff._id.toString(), 'Assigned staff ID must match');

  const myTablesRes = await request('GET', '/api/floor/my-tables?locationId=loc-colombo-main', {
    cookie: floorCookie,
  });
  assert(myTablesRes.status === 200, 'My tables must return 200');
  assert(myTablesRes.data.data.some((t: any) => t.id === sampleTable.id), 'Assigned table must appear in My Tables');
  console.log(`   ✅ [PASS] 6. Staff assignment persisted; Table ${sampleTable.tableNumber} visible in My Tables`);

  // -------------------------------------------------------------
  // TEST 7: Reception Seating Integration & DiningSession Creation
  // -------------------------------------------------------------
  console.log('\n7. Testing Reception Seating Integration & Dining Session Activation...');
  const seatingRes = await request('POST', '/api/reception/walk-ins', {
    cookie: adminCookie,
    body: {
      locationId: 'loc-colombo-main',
      guestName: 'Sir Arthur Wellesley',
      guestCount: 2,
      guestPhone: '+94 77 123 4567',
      seatingPreference: 'Main Dining Room',
      seatImmediately: true,
      tableId: sampleTable.id,
    },
  });
  assert(seatingRes.status === 201, 'Walk-in seating must succeed (201)');

  // Verify dining session was created and table is OCCUPIED
  const sessionsRes = await request('GET', '/api/floor/sessions?locationId=loc-colombo-main', {
    cookie: floorCookie,
  });
  assert(sessionsRes.status === 200, 'Sessions API must return 200');
  const matchedSession = sessionsRes.data.data.find((s: any) => s.guestName === 'Sir Arthur Wellesley');
  assert(matchedSession !== undefined, 'Active DiningSession must exist for seated guest');
  assert(matchedSession.status === DiningSessionStatus.ACTIVE, 'DiningSession must be ACTIVE');

  // Verify table status transitioned to OCCUPIED
  const tableCheckRes = await request('GET', `/api/floor/tables/${sampleTable.id}?locationId=loc-colombo-main`, {
    cookie: floorCookie,
  });
  assert(tableCheckRes.status === 200, 'Table detail must return 200');
  assert(tableCheckRes.data.data.status === TableStatus.OCCUPIED, 'Table status must be OCCUPIED');
  assert(tableCheckRes.data.data.activeSession !== null, 'Table detail must include active session');
  console.log(`   ✅ [PASS] 7. Seating activated DiningSession (${matchedSession.id}) and marked Table OCCUPIED`);

  // -------------------------------------------------------------
  // TEST 8: Service Request Management (Create -> In Progress -> Resolve)
  // -------------------------------------------------------------
  console.log('\n8. Testing Service Request Management Workflow...');
  const createReqRes = await request('POST', '/api/floor/service-requests', {
    cookie: floorCookie,
    body: {
      locationId: 'loc-colombo-main',
      tableId: sampleTable.id,
      requestType: ServiceRequestType.WATER,
      description: 'Sparkling water with lime requested',
      priority: 'HIGH',
    },
  });
  assert(createReqRes.status === 201, 'Service request creation must return 201');
  const createdReq = createReqRes.data.data;
  assert(createdReq.status === ServiceRequestStatus.OPEN, 'Request must start in OPEN state');

  // Transition to IN_PROGRESS
  const startReqRes = await request('PATCH', `/api/floor/service-requests/${createdReq.id}`, {
    cookie: floorCookie,
    body: { status: ServiceRequestStatus.IN_PROGRESS },
  });
  assert(startReqRes.status === 200, 'Transition to IN_PROGRESS must return 200');
  assert(startReqRes.data.data.status === ServiceRequestStatus.IN_PROGRESS, 'Status must be IN_PROGRESS');

  // Resolve request
  const resolveReqRes = await request('PATCH', `/api/floor/service-requests/${createdReq.id}`, {
    cookie: floorCookie,
    body: { status: ServiceRequestStatus.RESOLVED },
  });
  assert(resolveReqRes.status === 200, 'Transition to RESOLVED must return 200');
  assert(resolveReqRes.data.data.status === ServiceRequestStatus.RESOLVED, 'Status must be RESOLVED');
  console.log('   ✅ [PASS] 8. Service request lifecycle (OPEN -> IN_PROGRESS -> RESOLVED) verified');

  // -------------------------------------------------------------
  // TEST 9: Kitchen Food-Ready Integration & Food Handoff
  // -------------------------------------------------------------
  console.log('\n9. Testing Kitchen Ready Alerts & Food Handoff Action...');
  // Create a real dine-in order
  const category = (await MenuCategory.findOne()) ||
    (await MenuCategory.create({
      name: 'Mains',
      slug: `mains-${testSuffix}`,
      displayOrder: 1,
      isActive: true,
    }));
  const dish =
    (await MenuItem.findOne({ isPublished: true, isAvailable: true })) ||
    (await MenuItem.create({
      name: 'Wagyu Ribeye',
      slug: `wagyu-${testSuffix}`,
      description: 'Premium Australian Wagyu Ribeye cut',
      categoryId: category._id,
      categoryName: category.name,
      categorySlug: category.slug,
      priceMinor: 950000,
      priceFormatted: 'LKR 9,500.00',
      isPublished: true,
      isAvailable: true,
      orderTypes: [OrderType.DINE_IN_PREORDER],
    }));

  const testOrder = await Order.create({
    orderReference: `AUR-FLR-${testSuffix.slice(-5)}`,
    locationId: 'loc-colombo-main',
    customerId: null,
    customerName: 'Sir Arthur Wellesley',
    customerEmail: 'wellesley@example.com',
    customerPhone: '+94 77 123 4567',
    orderType: OrderType.DINE_IN_PREORDER,
    orderStatus: OrderStatus.READY,
    reservationId: seatingRes.data.data.reservationReference,
    items: [
      {
        menuItemId: dish._id.toString(),
        dishName: dish.name,
        quantity: 2,
        unitPriceMinor: dish.priceMinor,
        lineTotalMinor: dish.priceMinor * 2,
      },
    ],
    subtotalMinor: dish.priceMinor * 2,
    taxMinor: 0,
    serviceChargeMinor: 0,
    totalMinor: dish.priceMinor * 2,
    scheduledFor: new Date(),
    readyAt: new Date(),
  });

  // Create alert for table
  const alertDoc = await KitchenAlert.create({
    locationId: 'loc-colombo-main',
    orderId: testOrder._id.toString(),
    orderReference: testOrder.orderReference,
    tableId: sampleTable.id,
    tableNumber: sampleTable.tableNumber,
    itemsSummary: '2x Wagyu Ribeye',
    status: KitchenAlertStatus.NEW,
  });

  // Floor staff acknowledges alert
  const ackRes = await request('POST', `/api/floor/kitchen-alerts/${alertDoc._id}/acknowledge`, {
    cookie: floorCookie,
  });
  assert(ackRes.status === 200, 'Acknowledge kitchen alert must return 200');
  assert(ackRes.data.data.status === KitchenAlertStatus.ACKNOWLEDGED, 'Status must be ACKNOWLEDGED');

  // Floor staff performs authorized food handoff
  const handoffRes = await request('POST', `/api/floor/orders/${testOrder._id}/handoff`, {
    cookie: floorCookie,
  });
  assert(handoffRes.status === 200, 'Order handoff must return 200');
  assert(handoffRes.data.data.order.orderStatus === OrderStatus.COMPLETED, 'Order status must be COMPLETED');

  // Verify alert is resolved
  const checkAlert = await KitchenAlert.findById(alertDoc._id);
  assert(checkAlert?.status === KitchenAlertStatus.RESOLVED, 'Kitchen alert must be resolved on handoff');
  console.log('   ✅ [PASS] 9. Kitchen alert acknowledged and food handoff completed to table');

  // -------------------------------------------------------------
  // TEST 10: Table Turnover & Dining Session Closure
  // -------------------------------------------------------------
  console.log('\n10. Testing Dining Session Closure & Table Turnover...');
  const closeRes = await request('POST', `/api/floor/sessions/${matchedSession.id}/close`, {
    cookie: floorCookie,
  });
  assert(closeRes.status === 200, 'Closing dining session must return 200');
  assert(closeRes.data.data.session.status === DiningSessionStatus.CLOSED, 'Session must be CLOSED');
  assert(closeRes.data.data.cleaningTasks.length > 0, 'Must generate cleaning task');

  // Verify physical table transitioned to AWAITING_CLEANING
  const checkTurnoverTable = await Table.findById(sampleTable.id);
  assert(checkTurnoverTable?.status === TableStatus.AWAITING_CLEANING, 'Table status must be AWAITING_CLEANING');
  console.log('   ✅ [PASS] 10. Dining session closed; Table moved to AWAITING_CLEANING with CleaningTask created');

  // -------------------------------------------------------------
  // TEST 11: Cleaning Task Workflow (PENDING -> IN_PROGRESS -> COMPLETED)
  // -------------------------------------------------------------
  console.log('\n11. Testing Table Cleaning Task Workflow...');
  const cleaningTaskId = closeRes.data.data.cleaningTasks[0].id;

  // Start cleaning
  const startCleanRes = await request('POST', `/api/floor/cleaning-tasks/${cleaningTaskId}/start`, {
    cookie: floorCookie,
  });
  assert(startCleanRes.status === 200, 'Start cleaning task must return 200');
  assert(startCleanRes.data.data.status === CleaningTaskStatus.IN_PROGRESS, 'Status must be IN_PROGRESS');

  const tableInCleaning = await Table.findById(sampleTable.id);
  assert(tableInCleaning?.status === TableStatus.CLEANING, 'Table status must be CLEANING during task');

  // Complete cleaning
  const completeCleanRes = await request('POST', `/api/floor/cleaning-tasks/${cleaningTaskId}/complete`, {
    cookie: floorCookie,
  });
  assert(completeCleanRes.status === 200, 'Complete cleaning must return 200');
  assert(completeCleanRes.data.data.status === CleaningTaskStatus.COMPLETED, 'Task must be COMPLETED');

  const tableNowAvailable = await Table.findById(sampleTable.id);
  assert(tableNowAvailable?.status === TableStatus.AVAILABLE, 'Table status must return to AVAILABLE');
  console.log('   ✅ [PASS] 11. Sanitization completed; Table returned to AVAILABLE status');

  // -------------------------------------------------------------
  // TEST 12: Floor Activity History Archive
  // -------------------------------------------------------------
  console.log('\n12. Testing Floor Activity History Archive...');
  const historyRes = await request('GET', '/api/floor/history?locationId=loc-colombo-main', {
    cookie: floorCookie,
  });
  assert(historyRes.status === 200, 'Floor history must return 200');
  assert(Array.isArray(historyRes.data.data.sessions), 'Sessions must be array');
  assert(Array.isArray(historyRes.data.data.cleaningTasks), 'Cleaning tasks must be array');
  assert(Array.isArray(historyRes.data.data.serviceRequests), 'Service requests must be array');
  console.log('   ✅ [PASS] 12. Floor activity history archive operational');

  // -------------------------------------------------------------
  // TEST 13: Regulatory Audit Logging
  // -------------------------------------------------------------
  console.log('\n13. Testing Regulatory Staff Audit Logging...');
  const auditLogs = await StaffAuditLog.find({ locationId: 'loc-colombo-main' }).sort({ createdAt: -1 }).limit(10);
  assert(auditLogs.length > 0, 'Audit logs must be recorded');
  const actionsRecorded = auditLogs.map((l) => l.action);
  assert(
    actionsRecorded.includes('DINING_SESSION_CLOSED' as any) ||
    actionsRecorded.includes('CLEANING_STARTED' as any) ||
    actionsRecorded.includes('FOOD_HANDOFF_COMPLETED' as any) ||
    actionsRecorded.includes('FLOOR_ASSIGNMENT_CHANGED' as any),
    'Audit logs must capture floor operational milestones'
  );
  console.log('   ✅ [PASS] 13. StaffAuditLog regulatory compliance verified');

  // -------------------------------------------------------------
  // TEST 14: Administrator Dashboard Integration
  // -------------------------------------------------------------
  console.log('\n14. Testing Administrator Dashboard Telemetry Integration...');
  const adminDashRes = await request('GET', '/api/admin/dashboard/overview?locationId=loc-colombo-main', {
    cookie: adminCookie,
  });
  assert(adminDashRes.status === 200, 'Admin dashboard overview must return 200');
  assert(adminDashRes.data.data.tableOccupancy.connected === true, 'Table occupancy must be connected');
  console.log('   ✅ [PASS] 14. Admin dashboard seamlessly consumes live floor metrics');

  // Cleanup
  console.log('\nCleaning up test artifacts...');
  await Staff.deleteMany({ email: { $in: [adminStaff.email, floorStaff.email, kitchenStaff.email, kandyFloorStaff.email] } });
  await DiningSession.deleteMany({ locationId: 'loc-colombo-main', guestName: 'Sir Arthur Wellesley' });
  await ServiceRequest.deleteMany({ locationId: 'loc-colombo-main', tableId: sampleTable.id });
  await CleaningTask.deleteMany({ locationId: 'loc-colombo-main', tableId: sampleTable.id });
  await KitchenAlert.deleteMany({ locationId: 'loc-colombo-main', orderId: testOrder._id.toString() });
  await Order.deleteMany({ _id: testOrder._id });
  await server.close();

  console.log('\n=============================================================');
  console.log('  ALL 14 FLOOR MANAGEMENT SYSTEM TESTS PASSED SUCCESSFULLY!  ');
  console.log('=============================================================\n');
  await mongoose.disconnect();
  process.exit(0);
}

runFloorTestSuite().catch((err) => {
  console.error('\n❌ FLOOR MANAGEMENT TEST SUITE FAILED:', err);
  process.exit(1);
});
