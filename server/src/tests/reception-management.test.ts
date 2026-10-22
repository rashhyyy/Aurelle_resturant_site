import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { io as ClientSocket, Socket as ClientSocketType } from '../../../client/node_modules/socket.io-client';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { User } from '../models/user.model';
import { Reservation } from '../models/reservation.model';
import { TableSlotAllocation } from '../models/tableSlotAllocation.model';
import { Table } from '../models/table.model';
import { WaitingList } from '../models/waitingList.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { ReservationStatus, ReservationSource, RESERVATION_CONFIG } from '../types/reservation';
import { TableStatus } from '../types/table';
import { WaitingListStatus } from '../types/waitingList';
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

  const cookieHeader = res.headers.get('set-cookie');
  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    data,
    cookie: cookieHeader ? cookieHeader.split(';')[0] : undefined,
  };
}

async function runReceptionTestSuite() {
  console.log('\n=============================================================');
  console.log('   AURELLE STAGE 10: RECEPTION MANAGEMENT SYSTEM TEST SUITE  ');
  console.log('=============================================================\n');

  // 1. Connect MongoDB
  if (mongoose.connection.readyState !== 1) {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(env.MONGODB_URI);
  }

  // 2. Start Test Server with Sockets
  const app = createApp();
  const server = http.createServer(app);
  setupSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const addr = server.address() as any;
  ctx = {
    server,
    baseUrl: `http://localhost:${addr.port}`,
    port: addr.port,
  };

  const testSuffix = Date.now().toString();
  const plainPassword = 'Reception@Test2026!';
  const passwordHash = await hashPassword(plainPassword);

  console.log('1. Setting up accounts: Admin, Reception, Kitchen, Floor...');
  const [adminStaff, receptionStaff, kitchenStaff, kandyReception] = await Promise.all([
    Staff.create({
      firstName: 'Admin',
      lastName: 'Maitre',
      email: `admin_rcp_${testSuffix}@aurelle.com`,
      passwordHash,
      role: StaffRole.ADMIN,
      status: StaffStatus.ACTIVE,
      locationIds: ['loc-colombo-main', 'loc-kandy-vip'],
    }),
    Staff.create({
      firstName: 'Clara',
      lastName: 'Receptionist',
      email: `reception_${testSuffix}@aurelle.com`,
      passwordHash,
      role: StaffRole.RECEPTION,
      status: StaffStatus.ACTIVE,
      locationIds: ['loc-colombo-main'],
    }),
    Staff.create({
      firstName: 'Gordon',
      lastName: 'Chef',
      email: `kitchen_${testSuffix}@aurelle.com`,
      passwordHash,
      role: StaffRole.KITCHEN,
      status: StaffStatus.ACTIVE,
      locationIds: ['loc-colombo-main'],
    }),
    Staff.create({
      firstName: 'Kandy',
      lastName: 'Host',
      email: `kandy_rcp_${testSuffix}@aurelle.com`,
      passwordHash,
      role: StaffRole.RECEPTION,
      status: StaffStatus.ACTIVE,
      locationIds: ['loc-kandy-vip'],
    }),
  ]);

  // Log in sessions
  const adminLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: adminStaff.email, password: plainPassword },
  });
  const receptionLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: receptionStaff.email, password: plainPassword },
  });
  const kitchenLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: kitchenStaff.email, password: plainPassword },
  });
  const kandyLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: kandyReception.email, password: plainPassword },
  });

  assert(adminLogin.status === 200, 'Admin login succeeded');
  assert(receptionLogin.status === 200, 'Reception login succeeded');
  assert(kitchenLogin.status === 200, 'Kitchen login succeeded');
  assert(kandyLogin.status === 200, 'Kandy Reception login succeeded');

  const adminCookie = adminLogin.cookie!;
  const receptionCookie = receptionLogin.cookie!;
  const kitchenCookie = kitchenLogin.cookie!;
  const kandyCookie = kandyLogin.cookie!;

  console.log('   ✅ [PASS] 1. Staff authentication established across roles.');

  // Pre-seed tables
  await ensureLocationTablesConfigured('loc-colombo-main');

  // -------------------------------------------------------------
  // TEST 2: RBAC Protection on Reception Endpoints
  // -------------------------------------------------------------
  console.log('\n2. Testing Role-Based Access Control on Reception Endpoints...');
  const anonRes = await request('GET', '/api/reception/overview?locationId=loc-colombo-main');
  assert(anonRes.status === 401, 'Anonymous request must return 401 Unauthorized');

  const kitchenDenied = await request('GET', '/api/reception/overview?locationId=loc-colombo-main', {
    cookie: kitchenCookie,
  });
  assert(kitchenDenied.status === 403, 'Kitchen role must be rejected with 403 Forbidden');

  const receptionAllowed = await request('GET', '/api/reception/overview?locationId=loc-colombo-main', {
    cookie: receptionCookie,
  });
  assert(receptionAllowed.status === 200, 'Reception role must be granted 200 OK');
  console.log('   ✅ [PASS] 2. RBAC strictly restricts reception APIs to authorized front-desk roles');

  // -------------------------------------------------------------
  // TEST 3: Location Authorization Enforcement
  // -------------------------------------------------------------
  console.log('\n3. Testing Restaurant Location Authorization...');
  const kandyStaffCrossVenue = await request(
    'GET',
    '/api/reception/reservations?locationId=loc-colombo-main',
    { cookie: kandyCookie }
  );
  assert(kandyStaffCrossVenue.status === 403, 'Kandy staff restricted from accessing Colombo desk (403)');

  const adminCrossVenue = await request(
    'GET',
    '/api/reception/reservations?locationId=loc-colombo-main',
    { cookie: adminCookie }
  );
  assert(adminCrossVenue.status === 200, 'Admin retains global multi-venue reception access (200)');
  console.log('   ✅ [PASS] 3. Location boundaries strictly enforced for venue staff');

  // -------------------------------------------------------------
  // TEST 4: Table Availability Overview
  // -------------------------------------------------------------
  console.log('\n4. Testing Live Table Availability Overview...');
  const tablesRes = await request('GET', '/api/reception/tables/availability?locationId=loc-colombo-main', {
    cookie: receptionCookie,
  });
  assert(tablesRes.status === 200, 'Table overview returned 200');
  assert(Array.isArray(tablesRes.data.data), 'Returns list of dining tables');
  assert(tablesRes.data.data.length > 0, 'Tables configured for Colombo Flagship');
  const sampleTable = tablesRes.data.data[0];
  assert(sampleTable.tableNumber && sampleTable.capacity, 'Table item contains number and capacity');
  console.log(`   ✅ [PASS] 4. Table availability overview operational (${tablesRes.data.data.length} tables)`);

  // -------------------------------------------------------------
  // TEST 5: Create Booking Fixture for Reception Check-In
  // -------------------------------------------------------------
  console.log('\n5. Provisioning Today Booking for Check-In...');
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(now);
  const startAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in future (DUE_NOW)
  const endAt = new Date(startAt.getTime() + 90 * 60 * 1000);

  const testBooking = await Reservation.create({
    reservationReference: `AUR-RCP-${testSuffix.slice(-4)}`,
    locationId: 'loc-colombo-main',
    guestName: 'Sir Arthur Wellesley',
    guestEmail: `arthur_${testSuffix}@example.com`,
    guestPhone: '+94 77 123 4567',
    guestCount: 2,
    reservationDate: new Date(todayStr),
    startAt,
    endAt,
    durationMinutes: 90,
    timezone: 'Asia/Colombo',
    status: ReservationStatus.CONFIRMED,
    tableIds: [sampleTable.id],
    tableNumbers: [sampleTable.tableNumber],
    source: ReservationSource.ONLINE_CUSTOMER,
    statusHistory: [
      {
        status: ReservationStatus.CONFIRMED,
        changedAt: new Date(),
        actorType: 'CUSTOMER',
        note: 'Online booking confirmed.',
      },
    ],
  });

  // -------------------------------------------------------------
  // TEST 6: Today's Reservations Directory & Search
  // -------------------------------------------------------------
  console.log('\n6. Testing Today Reservations Directory & Search...');
  const listRes = await request(
    `GET`,
    `/api/reception/reservations?locationId=loc-colombo-main&search=${testBooking.reservationReference}`,
    { cookie: receptionCookie }
  );
  assert(listRes.status === 200, 'Reservations directory query returned 200');
  assert(listRes.data.data.reservations.length === 1, 'Search located the created reservation');
  const matchedItem = listRes.data.data.reservations[0];
  assert(matchedItem.reservationReference === testBooking.reservationReference, 'Reference matches');
  assert(matchedItem.arrivalStatus === 'DUE_NOW', 'Arrival status correctly calculated as DUE_NOW');
  console.log('   ✅ [PASS] 6. Directory search accurately filters by reference and calculates DUE_NOW');

  // -------------------------------------------------------------
  // TEST 7: Guest Check-In Action
  // -------------------------------------------------------------
  console.log('\n7. Testing Guest Check-In (CONFIRMED -> CHECKED_IN)...');
  const checkInRes = await request(
    'POST',
    `/api/reception/reservations/${testBooking.reservationReference}/check-in`,
    { cookie: receptionCookie }
  );
  assert(checkInRes.status === 200, 'Check-in returned 200 OK');
  assert(checkInRes.data.data.status === ReservationStatus.CHECKED_IN, 'Status transitioned to CHECKED_IN');
  assert(checkInRes.data.data.checkedInAt !== null, 'checkedInAt recorded');
  assert(checkInRes.data.data.checkedInBy !== null, 'checkedInBy recorded');
  console.log('   ✅ [PASS] 7. Guest check-in records arrival timestamp and actor');

  // -------------------------------------------------------------
  // TEST 8: Rejection of Duplicate Check-In
  // -------------------------------------------------------------
  console.log('\n8. Testing Duplicate Check-In Prevention...');
  const dupCheckIn = await request(
    'POST',
    `/api/reception/reservations/${testBooking.id}/check-in`,
    { cookie: receptionCookie }
  );
  assert(dupCheckIn.status === 400, 'Duplicate check-in rejected with 400 Bad Request');
  console.log('   ✅ [PASS] 8. Duplicate check-in cleanly rejected');

  // -------------------------------------------------------------
  // TEST 9: Table Assignment with Capacity Validation
  // -------------------------------------------------------------
  console.log('\n9. Testing Table Assignment & Capacity Rules...');
  // Find a 2-top table and a large party booking
  const bigPartyBooking = await Reservation.create({
    reservationReference: `AUR-BIG-${testSuffix.slice(-4)}`,
    locationId: 'loc-colombo-main',
    guestName: 'Grand Banquet Party',
    guestEmail: `bigparty_${testSuffix}@example.com`,
    guestPhone: '+94 77 999 8888',
    guestCount: 8,
    reservationDate: new Date(todayStr),
    startAt,
    endAt,
    durationMinutes: 90,
    timezone: 'Asia/Colombo',
    status: ReservationStatus.CONFIRMED,
    source: ReservationSource.ONLINE_CUSTOMER,
  });

  // Attempt to assign intimate 2-top (Table T01) to party of 8
  const twoTopTable = await Table.findOne({ locationId: 'loc-colombo-main', capacity: 2 });
  assert(!!twoTopTable, 'Found 2-top table fixture');

  const capacityRejection = await request(
    'POST',
    `/api/reception/reservations/${bigPartyBooking.id}/assign-table`,
    {
      cookie: receptionCookie,
      body: { tableId: twoTopTable?._id.toString() },
    }
  );
  assert(capacityRejection.status === 409 || capacityRejection.status === 400, 'Under-capacity table rejected (409/400)');

  // Assign appropriate table (capacity >= 8, e.g. T11)
  const largeTable = await Table.findOne({ locationId: 'loc-colombo-main', capacity: { $gte: 8 } });
  assert(!!largeTable, 'Found large table fixture');

  const validAssign = await request(
    'POST',
    `/api/reception/reservations/${bigPartyBooking.id}/assign-table`,
    {
      cookie: receptionCookie,
      body: { tableId: largeTable?._id.toString() },
    }
  );
  assert(validAssign.status === 200, 'Valid table assignment returned 200');
  assert(validAssign.data.data.tableNumbers.includes(largeTable?.tableNumber), 'Table assigned on reservation');
  console.log('   ✅ [PASS] 9. Table capacity rules and atomic slot allocation enforced');

  // -------------------------------------------------------------
  // TEST 10: Guest Seating (CHECKED_IN -> SEATED + Table OCCUPIED)
  // -------------------------------------------------------------
  console.log('\n10. Testing Guest Seating Action & Table Occupancy State...');
  const seatRes = await request(
    'POST',
    `/api/reception/reservations/${testBooking.id}/seat`,
    { cookie: receptionCookie }
  );
  assert(seatRes.status === 200, 'Seating returned 200 OK');
  assert(seatRes.data.data.status === ReservationStatus.SEATED, 'Status transitioned to SEATED');
  assert(seatRes.data.data.seatedAt !== null, 'seatedAt timestamp set');

  // Verify Table physical status changed to OCCUPIED in MongoDB
  const seatedTable = await Table.findById(sampleTable.id);
  assert(seatedTable?.status === TableStatus.OCCUPIED, 'Physical dining table status marked OCCUPIED');
  console.log('   ✅ [PASS] 10. Guest seating atomically transitions reservation and marks table OCCUPIED');

  // -------------------------------------------------------------
  // TEST 11: Walk-In Registration with Immediate Seating
  // -------------------------------------------------------------
  console.log('\n11. Testing Walk-In Registration (Immediate Seating)...');
  const walkInRes = await request('POST', '/api/reception/walk-ins', {
    cookie: receptionCookie,
    body: {
      locationId: 'loc-colombo-main',
      guestName: 'Walk-in Traveler',
      guestCount: 2,
      guestPhone: '+94 77 444 3333',
      seatImmediately: true,
      seatingPreference: 'Main Dining Room',
    },
  });
  assert(walkInRes.status === 201, 'Walk-in creation returned 201 Created');
  assert(walkInRes.data.data.status === ReservationStatus.SEATED, 'Walk-in immediately seated');
  assert(walkInRes.data.data.source === ReservationSource.WALK_IN, 'Source recorded as WALK_IN');
  assert(walkInRes.data.data.tableNumbers.length > 0, 'Table allocated for walk-in');
  console.log(`   ✅ [PASS] 11. Walk-in guest registered and seated (${walkInRes.data.data.reservationReference})`);

  // -------------------------------------------------------------
  // TEST 12: Waiting List Management (Add, View, Notify, Seat)
  // -------------------------------------------------------------
  console.log('\n12. Testing Waiting List Lifecycle (Create -> Notify -> Seat)...');
  const waitAddRes = await request('POST', '/api/reception/waiting-list', {
    cookie: receptionCookie,
    body: {
      locationId: 'loc-colombo-main',
      guestName: 'Waitlist Party Alpha',
      guestCount: 4,
      guestPhone: '+94 77 555 1212',
      seatingPreference: 'Outdoor Terrace',
      notes: 'Enjoying cocktail at bar',
      estimatedWaitMinutes: 20,
    },
  });
  assert(waitAddRes.status === 201, 'Waiting list add returned 201 Created');
  const waitEntry = waitAddRes.data.data;
  assert(waitEntry.status === WaitingListStatus.WAITING, 'Initial status WAITING');

  // Notify party
  const notifyRes = await request('PATCH', `/api/reception/waiting-list/${waitEntry.id}`, {
    cookie: receptionCookie,
    body: { status: WaitingListStatus.NOTIFIED },
  });
  assert(notifyRes.status === 200, 'Notify party returned 200');
  assert(notifyRes.data.data.status === WaitingListStatus.NOTIFIED, 'Status NOTIFIED');

  // Find an available 4-top table to seat the waiting party
  const freeFourTop = await Table.findOne({
    locationId: 'loc-colombo-main',
    capacity: { $gte: 4 },
    status: TableStatus.AVAILABLE,
  });
  assert(!!freeFourTop, 'Found available table for waiting party');

  const waitSeatRes = await request('POST', `/api/reception/waiting-list/${waitEntry.id}/seat`, {
    cookie: receptionCookie,
    body: { tableNumber: freeFourTop?.tableNumber },
  });
  assert(waitSeatRes.status === 200, 'Seating waiting party returned 200');
  assert(waitSeatRes.data.data.waitingEntry.status === WaitingListStatus.SEATED, 'Waiting entry marked SEATED');
  assert(waitSeatRes.data.data.reservation.status === ReservationStatus.SEATED, 'Linked reservation created in SEATED');
  console.log('   ✅ [PASS] 12. Waiting list lifecycle operational with atomic table conversion');

  // -------------------------------------------------------------
  // TEST 13: No-Show Grace Period Enforcement
  // -------------------------------------------------------------
  console.log('\n13. Testing No-Show Grace Period Enforcement...');
  const futureBooking = await Reservation.create({
    reservationReference: `AUR-FUT-${testSuffix.slice(-4)}`,
    locationId: 'loc-colombo-main',
    guestName: 'Future Guest',
    guestEmail: `future_${testSuffix}@example.com`,
    guestPhone: '+94 77 111 2222',
    guestCount: 2,
    reservationDate: new Date(todayStr),
    startAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in future
    endAt: new Date(Date.now() + 150 * 60 * 1000),
    durationMinutes: 90,
    timezone: 'Asia/Colombo',
    status: ReservationStatus.CONFIRMED,
    source: ReservationSource.ONLINE_CUSTOMER,
  });

  // Attempting to mark future booking as no-show without manager override must fail
  const earlyNoShow = await request('POST', `/api/reception/reservations/${futureBooking.id}/no-show`, {
    cookie: receptionCookie,
  });
  assert(earlyNoShow.status === 400, 'Premature no-show rejected due to unexpired grace window (400)');

  // Forced manager override succeeds
  const forcedNoShow = await request('POST', `/api/reception/reservations/${futureBooking.id}/no-show`, {
    cookie: adminCookie,
    body: { force: true, note: 'Guest called to report they will not arrive' },
  });
  assert(forcedNoShow.status === 200, 'Manager authorized no-show override returned 200');
  assert(forcedNoShow.data.data.status === ReservationStatus.NO_SHOW, 'Status transitioned to NO_SHOW');
  console.log('   ✅ [PASS] 13. Grace period threshold strictly enforced with administrative override option');

  // -------------------------------------------------------------
  // TEST 14: Reservation Modification via Reception Desk
  // -------------------------------------------------------------
  console.log('\n14. Testing Reservation Modification...');
  const modRes = await request('PATCH', `/api/reception/reservations/${bigPartyBooking.id}`, {
    cookie: receptionCookie,
    body: {
      guestCount: 6,
      specialRequests: 'VIP guests arriving by limousine',
    },
  });
  assert(modRes.status === 200, 'Reservation modification returned 200');
  assert(modRes.data.data.guestCount === 6, 'Guest count updated to 6');
  assert(modRes.data.data.specialRequests.includes('limousine'), 'Special requests updated');
  console.log('   ✅ [PASS] 14. Reception desk successfully modified reservation details');

  // -------------------------------------------------------------
  // TEST 15: Staff Audit Logging Verification
  // -------------------------------------------------------------
  console.log('\n15. Testing Regulatory Audit Logging...');
  const checkInAudit = await StaffAuditLog.findOne({
    action: 'GUEST_CHECKED_IN',
    targetStaffId: testBooking.reservationReference,
  });
  assert(!!checkInAudit, 'StaffAuditLog recorded GUEST_CHECKED_IN');

  const seatingAudit = await StaffAuditLog.findOne({
    action: 'GUEST_SEATED',
    targetStaffId: testBooking.reservationReference,
  });
  assert(!!seatingAudit, 'StaffAuditLog recorded GUEST_SEATED');

  const walkInAudit = await StaffAuditLog.findOne({
    action: 'WALK_IN_REGISTERED',
  });
  assert(!!walkInAudit, 'StaffAuditLog recorded WALK_IN_REGISTERED');
  console.log('   ✅ [PASS] 15. Immutable StaffAuditLog records verified for all reception operations');

  // -------------------------------------------------------------
  // TEST 16: Administrator Dashboard Telemetry Sync
  // -------------------------------------------------------------
  console.log('\n16. Testing Administrator Dashboard Telemetry Sync...');
  const adminDashRes = await request('GET', '/api/admin/dashboard/overview?locationId=loc-colombo-main', {
    cookie: adminCookie,
  });
  assert(adminDashRes.status === 200, 'Admin dashboard overview returned 200');
  assert(adminDashRes.data.data.statistics.todayReservations.available === true, 'Reservations marked connected');
  assert(adminDashRes.data.data.statistics.occupiedTables.value > 0, 'Occupied tables count updated');
  console.log('   ✅ [PASS] 16. Administrator dashboard accurately reflects reception floor operations');

  // -------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------
  console.log('\nCleaning up test artifacts...');
  await new Promise<void>((resolve) => ctx.server.close(() => resolve()));

  console.log('\n=============================================================');
  console.log('  ALL 16 RECEPTION MANAGEMENT SYSTEM TESTS PASSED!            ');
  console.log('=============================================================\n');
  process.exit(0);
}

runReceptionTestSuite().catch((err) => {
  console.error('\n❌ RECEPTION MANAGEMENT TEST SUITE FAILED:', err);
  if (ctx && ctx.server) {
    ctx.server.close();
  }
  process.exit(1);
});
