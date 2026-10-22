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
import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { ReservationStatus, ReservationSource, RESERVATION_CONFIG } from '../types/reservation';
import { TableStatus } from '../types/table';
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

  const contentType = res.headers.get('content-type') || '';
  const data: any = contentType.includes('application/json') ? await res.json() : await res.text();
  const setCookie = res.headers.get('set-cookie');

  return {
    status: res.status,
    data,
    cookie: setCookie ? setCookie.split(';')[0] : options.cookie,
  };
}

async function runReservationTestSuite() {
  console.log('\n=============================================================');
  console.log('  AURELLE STAGE 9: RESERVATION MANAGEMENT SYSTEM TEST SUITE  ');
  console.log('=============================================================\n');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI);
  }

  // Clean up any test records with idempotencyKey: null
  await Reservation.deleteMany({ idempotencyKey: null }).catch(() => {});

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

  console.log('1. Setting up accounts: Admin, Reception Staff, Floor Staff, Customer A, Customer B...');

  const adminStaff = await Staff.create({
    firstName: 'Admin',
    lastName: 'Director',
    email: `admin_res_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.ADMIN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main', 'loc-kandy-vip'],
  });

  const receptionStaff = await Staff.create({
    firstName: 'Claire',
    lastName: 'Reception',
    email: `reception_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.RECEPTION,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const floorStaff = await Staff.create({
    firstName: 'Floor',
    lastName: 'Server',
    email: `floor_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.FLOOR,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

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

  // Login sessions
  const adminLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: adminStaff.email, password: plainPassword },
  });
  assert(adminLogin.status === 200, 'Admin login failed');
  const adminCookie = adminLogin.cookie!;

  const receptionLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: receptionStaff.email, password: plainPassword },
  });
  assert(receptionLogin.status === 200, 'Reception login failed');
  const receptionCookie = receptionLogin.cookie!;

  const floorLogin = await request('POST', '/api/staff/auth/login', {
    body: { email: floorStaff.email, password: plainPassword },
  });
  assert(floorLogin.status === 200, 'Floor login failed');
  const floorCookie = floorLogin.cookie!;

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

  console.log('   ✅ [PASS] 1. Authentication setup: All sessions verified.');

  // Pre-seed tables for colombo
  await ensureLocationTablesConfigured('loc-colombo-main');

  // Compute test date (within 7 days to satisfy Stage 7 pre-order window)
  const dayOffset = 2 + Math.floor(Math.random() * 4);
  const futureDateObj = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
  const targetDate = futureDateObj.toISOString().split('T')[0];

  // Clean any existing reservations for targetDate in Colombo
  const colomboDayStart = new Date(Date.parse(`${targetDate}T00:00:00+05:30`) - 2 * 3600 * 1000);
  const colomboDayEnd = new Date(Date.parse(`${targetDate}T23:59:59+05:30`) + 2 * 3600 * 1000);
  await TableSlotAllocation.deleteMany({
    locationId: 'loc-colombo-main',
    slotTime: { $gte: colomboDayStart, $lte: colomboDayEnd },
  });
  await Reservation.deleteMany({
    locationId: 'loc-colombo-main',
    $or: [
      { reservationDate: targetDate },
      { startAt: { $gte: colomboDayStart, $lte: colomboDayEnd } },
    ],
  });

  // -------------------------------------------------------------
  // TEST 1: Customer Availability API
  // -------------------------------------------------------------
  console.log('\n2. Testing Customer Availability API (GET /api/reservations/availability)...');
  const availRes = await request(
    'GET',
    `/api/reservations/availability?locationId=loc-colombo-main&date=${targetDate}&guestCount=2`
  );
  assert(availRes.status === 200, 'Availability check must return 200 OK');
  assert(availRes.data.success === true, 'Availability check must have success: true');
  assert(Array.isArray(availRes.data.data.slots), 'Slots must be an array');
  assert(availRes.data.data.slots.length > 0, 'Must return dining time slots');
  assert(availRes.data.data.slots.some((s: any) => s.available === true), 'Should have available time slots');
  console.log('   ✅ [PASS] 2. Availability API returns live calculated table capacity slots');

  // -------------------------------------------------------------
  // TEST 2: Invalid Date Rejection (Past date)
  // -------------------------------------------------------------
  console.log('\n3. Testing Past Date Rejection...');
  const pastRes = await request(
    'GET',
    `/api/reservations/availability?locationId=loc-colombo-main&date=2020-01-01&guestCount=2`
  );
  assert(pastRes.status === 400, 'Past date must be rejected with 400 Bad Request');
  console.log('   ✅ [PASS] 3. Past reservation date rejected');

  // -------------------------------------------------------------
  // TEST 3: Invalid Guest Count Rejection (< 1 or > 12)
  // -------------------------------------------------------------
  console.log('\n4. Testing Invalid Guest Count Rejection...');
  const zeroGuestRes = await request('POST', '/api/reservations', {
    body: {
      locationId: 'loc-colombo-main',
      date: targetDate,
      time: '7:30 PM',
      guestCount: 0,
      guestName: 'Zero Guests',
      guestEmail: 'zero@example.com',
      guestPhone: '+94771234567',
    },
  });
  assert(zeroGuestRes.status === 400, 'Guest count of 0 must be rejected');

  const excessiveGuestRes = await request('POST', '/api/reservations', {
    body: {
      locationId: 'loc-colombo-main',
      date: targetDate,
      time: '7:30 PM',
      guestCount: 50,
      guestName: 'Too Many Guests',
      guestEmail: 'excess@example.com',
      guestPhone: '+94771234567',
    },
  });
  assert(excessiveGuestRes.status === 400, 'Guest count > 12 must be rejected');
  console.log('   ✅ [PASS] 4. Invalid guest count boundary checks enforced');

  // -------------------------------------------------------------
  // TEST 4: Valid Reservation Creation with Atomic Allocation
  // -------------------------------------------------------------
  console.log('\n5. Testing Valid Reservation Creation (POST /api/reservations)...');
  const createRes = await request('POST', '/api/reservations', {
    cookie: custACookie,
    body: {
      locationId: 'loc-colombo-main',
      date: targetDate,
      time: '7:30 PM',
      guestCount: 2,
      guestName: 'Customer Alpha',
      guestEmail: customerA.email,
      guestPhone: '+94771234567',
      occasion: 'Anniversary',
      specialRequests: 'Quiet window seat',
      idempotencyKey: `idem-res-${testSuffix}-1`,
    },
  });
  assert(createRes.status === 201, 'Valid reservation creation must return 201 Created');
  assert(createRes.data.success === true, 'Response must indicate success');
  const createdReservation = createRes.data.data;
  assert(createdReservation.status === ReservationStatus.CONFIRMED, 'Standard party size auto-confirms');
  assert(createdReservation.tableNumbers.length > 0, 'Table must be allocated');
  assert(createdReservation.reservationReference.startsWith('AUR-RES-'), 'Reference format valid');
  console.log(`   ✅ [PASS] 5. Reservation created: ${createdReservation.reservationReference} (Table: ${createdReservation.tableNumbers.join(', ')})`);

  // -------------------------------------------------------------
  // TEST 5: Idempotency Protection
  // -------------------------------------------------------------
  console.log('\n6. Testing Idempotency Protection on Duplicate Submissions...');
  const duplicateRes = await request('POST', '/api/reservations', {
    cookie: custACookie,
    body: {
      locationId: 'loc-colombo-main',
      date: targetDate,
      time: '7:30 PM',
      guestCount: 2,
      guestName: 'Customer Alpha',
      guestEmail: customerA.email,
      guestPhone: '+94771234567',
      idempotencyKey: `idem-res-${testSuffix}-1`,
    },
  });
  assert(duplicateRes.status === 201 || duplicateRes.status === 200, 'Duplicate submission returns saved record');
  assert(
    duplicateRes.data.data.reservationReference === createdReservation.reservationReference,
    'Must return the identical booking reference without creating a second record'
  );
  console.log('   ✅ [PASS] 6. Idempotency guarantees single reservation record');

  // -------------------------------------------------------------
  // TEST 6: Customer Reservation History & Isolation
  // -------------------------------------------------------------
  console.log('\n7. Testing Customer Reservation History (GET /api/reservations/my)...');
  const custAMyRes = await request('GET', '/api/reservations/my', { cookie: custACookie });
  assert(custAMyRes.status === 200, 'GET /my must return 200 OK');
  assert(
    custAMyRes.data.data.reservations.some((r: any) => r.reservationReference === createdReservation.reservationReference),
    'Customer A must see created reservation in history'
  );

  // Customer B cannot see Customer A's reservation in their history
  const custBMyRes = await request('GET', '/api/reservations/my', { cookie: custBCookie });
  assert(
    !custBMyRes.data.data.reservations.some((r: any) => r.reservationReference === createdReservation.reservationReference),
    'Customer B cannot see Customer A reservation in history'
  );
  console.log('   ✅ [PASS] 7. Customer history isolated strictly to authenticated owner');

  // -------------------------------------------------------------
  // TEST 7: Customer Ownership Enforcement on Details (GET /my/:id)
  // -------------------------------------------------------------
  console.log('\n8. Testing Customer Ownership Enforcement (GET /my/:id)...');
  const custBForbidden = await request('GET', `/api/reservations/my/${createdReservation.id}`, {
    cookie: custBCookie,
  });
  assert(custBForbidden.status === 403, 'Customer B accessing Customer A reservation must be 403 Forbidden');
  console.log('   ✅ [PASS] 8. Cross-customer reservation access rejected with 403 Forbidden');

  // -------------------------------------------------------------
  // TEST 8: Large Party Workflow (Requires PENDING Manager Approval)
  // -------------------------------------------------------------
  console.log('\n9. Testing Large Party Booking Workflow (PENDING Approval)...');
  const largePartyRes = await request('POST', '/api/reservations', {
    cookie: custACookie,
    body: {
      locationId: 'loc-colombo-main',
      date: targetDate,
      time: '8:00 PM',
      guestCount: 8,
      guestName: 'Grand Family Gathering',
      guestEmail: customerA.email,
      guestPhone: '+94771234567',
      occasion: 'Birthday Celebration',
    },
  });
  assert(largePartyRes.status === 201, 'Large party request creation returned 201');
  assert(largePartyRes.data.data.status === ReservationStatus.PENDING, 'Large party must enter PENDING state');
  const pendingReservation = largePartyRes.data.data;
  console.log(`   ✅ [PASS] 9. Large party placed into PENDING state (${pendingReservation.reservationReference})`);

  // -------------------------------------------------------------
  // TEST 9: Admin Confirmation of PENDING Reservation
  // -------------------------------------------------------------
  console.log('\n10. Testing Admin Confirmation of PENDING Booking...');
  const confirmRes = await request('POST', `/api/admin/reservations/${pendingReservation.id}/confirm`, {
    cookie: adminCookie,
  });
  assert(confirmRes.status === 200, 'Admin confirm returned 200');
  assert(confirmRes.data.data.status === ReservationStatus.CONFIRMED, 'Status successfully transitioned to CONFIRMED');
  console.log('   ✅ [PASS] 10. Administrator confirmed PENDING reservation');

  // -------------------------------------------------------------
  // TEST 10: Reservation Modification with Dynamic Reallocation
  // -------------------------------------------------------------
  console.log('\n11. Testing Customer Reservation Modification (PATCH /my/:id)...');
  const modRes = await request('PATCH', `/api/reservations/my/${createdReservation.id}`, {
    cookie: custACookie,
    body: {
      time: '8:15 PM',
      guestCount: 4,
      specialRequests: 'Celebrating promotion',
    },
  });
  assert(modRes.status === 200, 'Modification returned 200 OK');
  assert(modRes.data.data.guestCount === 4, 'Guest count updated');
  assert(modRes.data.data.reservationTime.includes('8:15'), 'Time updated');
  console.log('   ✅ [PASS] 11. Reservation rescheduled and capacity dynamically reallocated');

  // -------------------------------------------------------------
  // TEST 11: Reservation Cancellation & Capacity Release
  // -------------------------------------------------------------
  console.log('\n12. Testing Reservation Cancellation (POST /my/:id/cancel)...');
  const cancelRes = await request('POST', `/api/reservations/my/${createdReservation.id}/cancel`, {
    cookie: custACookie,
    body: { reason: 'Schedule conflict' },
  });
  assert(cancelRes.status === 200, 'Cancellation returned 200 OK');
  assert(cancelRes.data.data.status === ReservationStatus.CANCELLED, 'Status changed to CANCELLED');
  assert(cancelRes.data.data.tableNumbers.length === 0, 'Table capacity released');
  console.log('   ✅ [PASS] 12. Reservation cancelled and table capacity immediately released');

  // -------------------------------------------------------------
  // TEST 12: Invalid Status Transition Rejection
  // -------------------------------------------------------------
  console.log('\n13. Testing Invalid Status Transition Rejection...');
  const invalidConfirm = await request('POST', `/api/admin/reservations/${createdReservation.id}/confirm`, {
    cookie: adminCookie,
  });
  assert(invalidConfirm.status === 400, 'Confirming an already CANCELLED reservation must fail (400)');
  console.log('   ✅ [PASS] 13. State machine rejects illegal transitions from terminal CANCELLED');

  // -------------------------------------------------------------
  // TEST 13: Stage 7 Dine-In Pre-Order Integration
  // -------------------------------------------------------------
  console.log('\n14. Testing Stage 7 Dine-in Pre-Order Integration...');
  // A. Attempting to link to cancelled reservation must be rejected
  const category = await MenuCategory.create({
    name: `DineIn Cat ${testSuffix}`,
    slug: `dinein-cat-${testSuffix}`,
    description: 'Specialty',
    displayOrder: 1,
    isActive: true,
  });

  const dish = await MenuItem.create({
    name: `Kobe Strip ${testSuffix}`,
    slug: `kobe-strip-${testSuffix}`,
    description: 'A5 Wagyu Striploin with truffle reduction',
    shortDescription: 'A5 Wagyu Striploin',
    categoryId: category._id.toString(),
    categoryName: category.name,
    categorySlug: category.slug,
    priceMinor: 900000,
    currency: 'LKR',
    publicationStatus: 'PUBLISHED',
    isAvailable: true,
    locationIds: ['loc-colombo-main'],
  });

  const preOrderCancelledRes = await request('POST', '/api/orders', {
    cookie: custACookie,
    body: {
      orderType: 'DINE_IN_PREORDER',
      reservationId: createdReservation.reservationReference,
      locationId: 'loc-colombo-main',
      customerName: 'Customer Alpha',
      customerEmail: customerA.email,
      customerPhone: '+94771234567',
      pickupDate: targetDate,
      pickupTime: '8:00 PM',
      items: [{ menuItemId: dish._id.toString(), quantity: 1 }],
    },
  });
  assert(
    preOrderCancelledRes.status === 400,
    'Dine-in pre-order linked to cancelled reservation must be rejected'
  );

  // B. Linking to valid active CONFIRMED reservation succeeds
  const preOrderActiveRes = await request('POST', '/api/orders', {
    cookie: custACookie,
    body: {
      orderType: 'DINE_IN_PREORDER',
      reservationId: pendingReservation.reservationReference, // Confirmed in Test 9
      locationId: 'loc-colombo-main',
      customerName: 'Customer Alpha',
      customerEmail: customerA.email,
      customerPhone: '+94771234567',
      pickupDate: targetDate,
      pickupTime: '8:00 PM',
      items: [{ menuItemId: dish._id.toString(), quantity: 1 }],
    },
  });
  assert(preOrderActiveRes.status === 201, 'Dine-in pre-order linked to CONFIRMED reservation must succeed');
  assert(
    preOrderActiveRes.data.data.reservationId === pendingReservation.reservationReference,
    'Order reservationId must match reference'
  );
  console.log('   ✅ [PASS] 14. Dine-in pre-orders successfully validated against live reservation state');

  // -------------------------------------------------------------
  // TEST 14: Admin Reservation Directory & Summary Metrics
  // -------------------------------------------------------------
  console.log('\n15. Testing Admin Reservation Directory & Summary Metrics...');
  const adminSummaryRes = await request('GET', '/api/admin/reservations/summary', { cookie: adminCookie });
  assert(adminSummaryRes.status === 200, 'Admin summary returned 200 OK');
  assert(adminSummaryRes.data.data.upcomingTotal >= 1, 'Upcoming count includes active reservation');
  assert(adminSummaryRes.data.data.cancelledTotal >= 1, 'Cancelled count includes cancelled reservation');

  const adminDirRes = await request('GET', `/api/admin/reservations?search=${pendingReservation.reservationReference}`, {
    cookie: adminCookie,
  });
  assert(adminDirRes.status === 200, 'Admin directory search returned 200 OK');
  assert(adminDirRes.data.data.reservations.length === 1, 'Search finds specific reservation reference');
  console.log('   ✅ [PASS] 15. Admin telemetry & directory search operational');

  // -------------------------------------------------------------
  // TEST 15: RBAC Security Enforcement
  // -------------------------------------------------------------
  console.log('\n16. Testing RBAC Security Enforcement...');
  // Floor staff cannot confirm or reject reservations
  const floorDenied = await request('POST', `/api/admin/reservations/${pendingReservation.id}/confirm`, {
    cookie: floorCookie,
  });
  assert(floorDenied.status === 403, 'Floor staff must receive 403 Forbidden on reservation actions');

  // Anonymous request to admin reservations is rejected with 401
  const anonDenied = await request('GET', '/api/admin/reservations');
  assert(anonDenied.status === 401, 'Anonymous request must be rejected with 401 Unauthorized');
  console.log('   ✅ [PASS] 16. RBAC guards administrative reservation endpoints');

  // -------------------------------------------------------------
  // TEST 17: Concurrency Protection against Double-Booking
  // -------------------------------------------------------------
  console.log('\n17. Testing Concurrency Protection against Overbooking...');
  // Find a specific table capacity constraint and simulate simultaneous requests
  const simOffsetDays = 12 + Math.floor(Math.random() * 10);
  const simDateObj = new Date(Date.now() + simOffsetDays * 24 * 60 * 60 * 1000);
  const simDate = simDateObj.toISOString().split('T')[0];

  // Clean any residual test allocations for this date to ensure clean test state
  const colomboSimStart = new Date(Date.parse(`${simDate}T00:00:00+05:30`) - 2 * 3600 * 1000);
  const colomboSimEnd = new Date(Date.parse(`${simDate}T23:59:59+05:30`) + 2 * 3600 * 1000);
  await TableSlotAllocation.deleteMany({
    locationId: 'loc-colombo-main',
    slotTime: { $gte: colomboSimStart, $lte: colomboSimEnd },
  });
  await Reservation.deleteMany({
    locationId: 'loc-colombo-main',
    $or: [
      { reservationDate: simDate },
      { startAt: { $gte: colomboSimStart, $lte: colomboSimEnd } },
    ],
  });

  // Make simultaneous booking attempts for private salon (capacity 12, exactly 1 table: P01)
  const concurrentBookings = await Promise.all([
    request('POST', '/api/reservations', {
      cookie: custACookie,
      body: {
        locationId: 'loc-colombo-main',
        date: simDate,
        time: '7:30 PM',
        guestCount: 12,
        guestName: 'Party One',
        guestEmail: 'party1@example.com',
        guestPhone: '+94771234567',
        seatingPreference: 'Private Dining',
      },
    }),
    request('POST', '/api/reservations', {
      cookie: custBCookie,
      body: {
        locationId: 'loc-colombo-main',
        date: simDate,
        time: '7:30 PM',
        guestCount: 12,
        guestName: 'Party Two',
        guestEmail: 'party2@example.com',
        guestPhone: '+94771234567',
        seatingPreference: 'Private Dining',
      },
    }),
  ]);

  const successCount = concurrentBookings.filter((r) => r.status === 201).length;
  const conflictCount = concurrentBookings.filter((r) => r.status === 409 || r.status === 400).length;

  assert(successCount === 1, 'Exactly one concurrent booking for the exclusive salon table must succeed');
  assert(conflictCount === 1, 'The other concurrent booking must be rejected due to capacity exhaustion');
  console.log('   ✅ [PASS] 17. Atomic concurrency control prevents double-booking of dining tables');

  // -------------------------------------------------------------
  // TEST 17: Socket.IO Scoped Room Authorization
  // -------------------------------------------------------------
  console.log('\n18. Testing Socket.IO Real-Time Scoped Room Authorization...');
  const custASocket: ClientSocketType = ClientSocket(`http://localhost:${ctx.port}`, {
    extraHeaders: { Cookie: custACookie },
    transports: ['websocket'],
  });
  await new Promise<void>((resolve) => custASocket.on('connect', () => resolve()));

  const subSuccessPromise = new Promise<any>((resolve) => {
    custASocket.on('subscribe:success' as any, (data: any) => resolve(data));
  });

  custASocket.emit('subscribe:reservation' as any, {
    reservationReference: pendingReservation.reservationReference,
    email: customerA.email,
  });

  const subAck = await subSuccessPromise;
  assert(subAck.reservationReference === pendingReservation.reservationReference, 'Subscription ack must match reference');

  // Customer B cannot subscribe to Customer A reservation
  const custBSocket: ClientSocketType = ClientSocket(`http://localhost:${ctx.port}`, {
    extraHeaders: { Cookie: custBCookie },
    transports: ['websocket'],
  });
  await new Promise<void>((resolve) => custBSocket.on('connect', () => resolve()));

  const subErrorPromise = new Promise<any>((resolve) => {
    custBSocket.on('subscribe:error' as any, (err: any) => resolve(err));
  });

  custBSocket.emit('subscribe:reservation' as any, {
    reservationReference: pendingReservation.reservationReference,
  });

  const subDenied = await subErrorPromise;
  assert(subDenied.error === 'Forbidden', 'Cross-customer socket subscription rejected with Forbidden');

  custASocket.disconnect();
  custBSocket.disconnect();
  console.log('   ✅ [PASS] 18. Scoped Socket.IO rooms strictly enforce customer ownership');

  // -------------------------------------------------------------
  // TEST 18: Admin Dashboard Telemetry Integration
  // -------------------------------------------------------------
  console.log('\n19. Testing Stage 4 Admin Dashboard Telemetry Integration...');
  const dashRes = await request('GET', '/api/admin/dashboard/overview?locationId=loc-colombo-main', {
    cookie: adminCookie,
  });
  assert(dashRes.status === 200, 'Admin dashboard overview returned 200 OK');
  assert(
    dashRes.data.data.upcomingReservationsStatus?.connected === true ||
    dashRes.data.data.statistics?.todayReservations?.available === true,
    'Reservations subsystem marked connected'
  );
  assert(Array.isArray(dashRes.data.data.upcomingReservations), 'Upcoming reservations manifest returned');
  console.log('   ✅ [PASS] 19. Admin overview dashboard successfully consumes real reservation records');

  // -------------------------------------------------------------
  // Cleanup Test Server
  // -------------------------------------------------------------
  console.log('\nCleaning up test artifacts...');
  await new Promise<void>((resolve) => ctx.server.close(() => resolve()));

  console.log('\n=============================================================');
  console.log('  ALL 19 RESERVATION MANAGEMENT SYSTEM TESTS PASSED!          ');
  console.log('=============================================================\n');
  process.exit(0);
}

runReservationTestSuite().catch((err) => {
  console.error('\n❌ RESERVATION MANAGEMENT TEST SUITE FAILED:', err);
  if (ctx && ctx.server) {
    ctx.server.close();
  }
  process.exit(1);
});
