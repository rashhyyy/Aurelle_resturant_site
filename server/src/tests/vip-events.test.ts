import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { VIPRoom } from '../models/vipRoom.model';
import { VIPBooking } from '../models/vipBooking.model';
import { VIPRoomAllocation } from '../models/vipRoomAllocation.model';
import { PrivateDiningPackage } from '../models/privateDiningPackage.model';
import { EventInquiry } from '../models/eventInquiry.model';
import { EventProposal } from '../models/eventProposal.model';
import { EventBooking } from '../models/eventBooking.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { StaffRole, StaffStatus } from '../types/staff';
import {
  VIPBookingStatus,
  EventInquiryStatus,
  EventProposalStatus,
  EventBookingStatus,
  PaymentStatus,
} from '../types/vip';
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

async function runVIPTestSuite() {
  console.log('\n=============================================================');
  console.log('   AURELLE STAGE 12: VIP ROOMS & EVENTS MANAGEMENT TEST SUITE');
  console.log('=============================================================\n');

  console.log('Connecting to MongoDB Atlas...');
  if (mongoose.connection.readyState !== 1) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
        break;
      } catch (err: any) {
        if (attempt === 3) throw err;
        console.log(`Connection attempt ${attempt} failed (${err.message}), retrying in 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
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
  const plainPassword = 'Aurelle@VIP2026!';
  const passwordHash = await hashPassword(plainPassword);

  console.log('1. Setting up Staff accounts (Admin, Reception, Manager)...');

  const adminStaff = await Staff.create({
    firstName: 'Victoria',
    lastName: 'VipAdmin',
    email: `vip_admin_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.ADMIN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const receptionStaff = await Staff.create({
    firstName: 'Rachel',
    lastName: 'ReceptionVIP',
    email: `vip_rec_${testSuffix}@aurelle.com`,
    passwordHash,
    role: StaffRole.RECEPTION,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  async function loginWithRetry(email: string, pass: string, maxAttempts = 3) {
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        const res = await request('POST', '/api/staff/auth/login', {
          body: { email, password: pass },
        });
        if (res.status === 200) return res;
        console.log(`Login attempt ${i} for ${email} returned ${res.status}, retrying in 2s...`);
      } catch (e: any) {
        console.log(`Login attempt ${i} for ${email} threw ${e.message}, retrying in 2s...`);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error(`Login failed after ${maxAttempts} attempts for ${email}`);
  }

  // Login admin
  const adminLoginRes = await loginWithRetry(adminStaff.email, plainPassword);
  assert(adminLoginRes.status === 200, 'Admin staff login should succeed (200)');
  const adminCookie = adminLoginRes.cookie;
  assert(!!adminCookie, 'Admin session cookie should be established');

  // Login reception
  const recLoginRes = await loginWithRetry(receptionStaff.email, plainPassword);
  assert(recLoginRes.status === 200, 'Reception staff login should succeed (200)');
  const recCookie = recLoginRes.cookie;

  console.log('✔ Staff accounts authenticated successfully');

  // =========================================================================
  // 2. VIP Room Management & Validation
  // =========================================================================
  console.log('\n2. Testing VIP Room Creation, Slug Uniqueness, and Validation...');

  const testRoomSlug = `test-salon-${testSuffix}`;
  const createRoomRes = await request('POST', '/api/admin/vip/rooms', {
    cookie: adminCookie,
    body: {
      locationId: 'loc-colombo-main',
      name: `Test Imperial Salon ${testSuffix}`,
      slug: testRoomSlug,
      tag: 'PRIVATE TASTING SUITE',
      subtitle: 'An intimate tasting room for connoisseurs',
      description: 'Handcrafted rosewood dining table, private cellar access, Bang & Olufsen acoustic system.',
      capacityMin: 4,
      capacityMax: 14,
      squareMeters: '55 m²',
      images: ['https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200'],
      amenities: [
        { label: 'Private Sommelier', detail: 'Dedicated cellar flight guidance' },
        { label: 'Private Cloakroom', detail: 'Personal attendant on standby' },
      ],
      features: ['Discreet VIP entrance', 'Custom degustation pairing', 'Acoustic isolation'],
      categories: ['Intimate', 'Tasting'],
      basePriceMinor: 6000000, // LKR 60,000
      currency: 'LKR',
      minimumSpendMinor: 18000000, // LKR 180,000
      bookingDurationMinutes: 180,
      bufferMinutes: 60,
      isActive: true,
      isPublished: true,
    },
  });

  assert(createRoomRes.status === 201, `Create room should succeed with 201, got ${createRoomRes.status}`);
  const createdRoom = createRoomRes.data.data;
  assert(createdRoom.slug === testRoomSlug, 'Created room slug must match');
  assert(createdRoom.capacityMax === 14, 'Created room capacityMax must match');
  console.log(`✔ VIP Room "${createdRoom.name}" created successfully`);

  // Test slug uniqueness collision
  const duplicateSlugRes = await request('POST', '/api/admin/vip/rooms', {
    cookie: adminCookie,
    body: {
      locationId: 'loc-colombo-main',
      name: 'Duplicate Room',
      slug: testRoomSlug,
      capacityMin: 2,
      capacityMax: 6,
      basePriceMinor: 1000000,
      minimumSpendMinor: 5000000,
      bookingDurationMinutes: 120,
      bufferMinutes: 60,
    },
  });
  assert(duplicateSlugRes.status === 400, 'Duplicate slug creation must be rejected (400)');
  console.log('✔ Duplicate room slug rejected with validation error');

  // Query public rooms
  const publicRoomsRes = await request('GET', '/api/vip/rooms?locationId=loc-colombo-main');
  assert(publicRoomsRes.status === 200, 'Public rooms query should succeed (200)');
  const foundInPublic = publicRoomsRes.data.data.some((r: any) => r.slug === testRoomSlug);
  assert(foundInPublic, 'Newly created published room must appear in public room directory');
  console.log('✔ VIP Room appears in public customer directory');

  // Query room by slug
  const getBySlugRes = await request('GET', `/api/vip/rooms/${testRoomSlug}`);
  assert(getBySlugRes.status === 200, 'Get room by slug should succeed (200)');
  assert(getBySlugRes.data.data.name === createdRoom.name, 'Room name must match');

  // =========================================================================
  // 3. Private Dining Packages
  // =========================================================================
  console.log('\n3. Testing Private Dining Packages...');

  const pkgRes = await request('POST', '/api/admin/vip/packages', {
    cookie: adminCookie,
    body: {
      locationId: 'loc-colombo-main',
      roomId: createdRoom.id,
      name: `Grand Imperial Degustation ${testSuffix}`,
      description: '7-course seasonal tasting with vintage wine pairings',
      includedServices: ['Private Sommelier', 'Canapé Reception', 'Handcrafted Petit Fours'],
      includedMenuItems: ['Wagyu Tartare', 'Glacier 51 Toothfish', 'Ceylon Spiced Souffle'],
      priceMinor: 2500000, // LKR 25,000 per guest
      currency: 'LKR',
      minimumGuests: 4,
      maximumGuests: 14,
      isPublished: true,
    },
  });
  assert(pkgRes.status === 201, 'Create private dining package should succeed (201)');
  const createdPkg = pkgRes.data.data;
  console.log(`✔ Created Private Dining Package: ${createdPkg.name}`);

  // Query packages
  const packagesRes = await request('GET', `/api/vip/packages?locationId=loc-colombo-main`);
  assert(packagesRes.status === 200, 'Get packages should succeed (200)');
  assert(packagesRes.data.data.length >= 1, 'Should find at least 1 package');

  // =========================================================================
  // 4. Availability & Atomic Double-Booking Prevention
  // =========================================================================
  console.log('\n4. Testing VIP Room Availability & Atomic Double-Booking Prevention...');

  // Use a future date to avoid conflicts with other tests
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15);
  futureDate.setUTCHours(19, 0, 0, 0); // 19:00 UTC
  const startAt = futureDate.toISOString();

  const endDate = new Date(futureDate);
  endDate.setUTCHours(22, 0, 0, 0); // 22:00 UTC (3 hours duration)
  const endAt = endDate.toISOString();

  // Check availability before booking
  const availBefore = await request(
    'GET',
    `/api/vip/availability?roomId=${createdRoom.id}&startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`
  );
  assert(availBefore.status === 200, 'Availability check should succeed (200)');
  assert(availBefore.data.data.isAvailable === true, 'Room must be available before booking');
  console.log('✔ Room verified available prior to booking');

  // Create First VIP Booking
  const booking1Res = await request('POST', '/api/vip/bookings', {
    body: {
      locationId: 'loc-colombo-main',
      roomId: createdRoom.id,
      guestCount: 8,
      startAt,
      endAt,
      guestName: 'Sir Arthur Conan',
      guestEmail: 'arthur.conan@example.com',
      guestPhone: '+94 77 987 6543',
      specialRequests: 'Dom Pérignon 2012 on arrival, no shellfish allergies.',
      packageId: createdPkg.id,
    },
  });

  assert(booking1Res.status === 201, `Booking creation should succeed (201), got ${booking1Res.status}`);
  const booking1 = booking1Res.data.data;
  assert(booking1.status === VIPBookingStatus.CONFIRMED, 'Booking status should be CONFIRMED');
  console.log(`✔ Created VIP Booking ${booking1.bookingReference} for ${booking1.guestName}`);

  // Check allocations in MongoDB
  const allocations = await VIPRoomAllocation.find({ roomId: createdRoom.id, bookingId: booking1.id });
  // Start: 19:00, End: 22:00, Buffer: 60 mins -> End with buffer: 23:00
  // Discrete 30m slots: 19:00, 19:30, 20:00, 20:30, 21:00, 21:30, 22:00, 22:30 -> 8 slots
  assert(allocations.length === 8, `Expected 8 discrete 30m allocation slots, got ${allocations.length}`);
  console.log(`✔ Verified ${allocations.length} atomic 30-minute allocation slots locked in MongoDB`);

  // Check availability immediately after booking
  const availAfter = await request(
    'GET',
    `/api/vip/availability?roomId=${createdRoom.id}&startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`
  );
  assert(availAfter.status === 200, 'Availability check should return 200');
  assert(availAfter.data.data.isAvailable === false, 'Room must now report NOT available');
  console.log('✔ Availability check correctly reflects occupied status');

  // Double-booking attempt directly overlapping
  const duplicateBookingRes = await request('POST', '/api/vip/bookings', {
    body: {
      locationId: 'loc-colombo-main',
      roomId: createdRoom.id,
      guestCount: 6,
      startAt,
      endAt,
      guestName: 'Another Guest',
      guestEmail: 'another@example.com',
      guestPhone: '+94 77 111 2222',
    },
  });
  assert(
    duplicateBookingRes.status === 409,
    `Overlapping booking must be rejected with 409 Conflict, got ${duplicateBookingRes.status}`
  );
  console.log('✔ Direct double-booking rejected with 409 Conflict');

  // Buffer collision test: booking immediately after event ends (at 22:00) within the 60-minute cleaning buffer
  const bufferStartDate = new Date(futureDate);
  bufferStartDate.setUTCHours(22, 15, 0, 0); // 22:15 (inside 22:00-23:00 buffer)
  const bufferEndDate = new Date(futureDate);
  bufferEndDate.setUTCHours(23, 45, 0, 0);

  const bufferCollisionRes = await request('POST', '/api/vip/bookings', {
    body: {
      locationId: 'loc-colombo-main',
      roomId: createdRoom.id,
      guestCount: 4,
      startAt: bufferStartDate.toISOString(),
      endAt: bufferEndDate.toISOString(),
      guestName: 'Buffer Guest',
      guestEmail: 'buffer@example.com',
      guestPhone: '+94 77 333 4444',
    },
  });
  assert(
    bufferCollisionRes.status === 409,
    `Booking during post-event turnaround buffer must be rejected with 409 Conflict, got ${bufferCollisionRes.status}`
  );
  console.log('✔ Turn-around cleaning buffer enforced: booking during buffer cleanly rejected');

  // =========================================================================
  // 5. Concurrency Race Condition Test (Atomic Hardware Lock)
  // =========================================================================
  console.log('\n5. Testing Concurrency Race Condition (10 Simultaneous Overlapping Bookings)...');

  const concurrentStartDate = new Date();
  concurrentStartDate.setDate(concurrentStartDate.getDate() + 20);
  concurrentStartDate.setUTCHours(18, 0, 0, 0);
  const cStart = concurrentStartDate.toISOString();

  const concurrentEndDate = new Date(concurrentStartDate);
  concurrentEndDate.setUTCHours(21, 0, 0, 0);
  const cEnd = concurrentEndDate.toISOString();

  // Launch 10 simultaneous parallel booking requests for the exact same room and timeslot
  const parallelAttempts = Array.from({ length: 10 }, (_, i) =>
    request('POST', '/api/vip/bookings', {
      body: {
        locationId: 'loc-colombo-main',
        roomId: createdRoom.id,
        guestCount: 6,
        startAt: cStart,
        endAt: cEnd,
        guestName: `Concurrent Guest ${i + 1}`,
        guestEmail: `concurrent_${i + 1}@example.com`,
        guestPhone: `+94 77 000 ${1000 + i}`,
      },
    })
  );

  const parallelResults = await Promise.all(parallelAttempts);
  const successResults = parallelResults.filter((r) => r.status === 201);
  const conflictResults = parallelResults.filter((r) => r.status === 409);

  assert(
    successResults.length === 1,
    `Expected exactly 1 booking to succeed under concurrent race condition, got ${successResults.length}`
  );
  assert(
    conflictResults.length === 9,
    `Expected exactly 9 bookings to be rejected with 409, got ${conflictResults.length}`
  );
  console.log(
    `✔ Concurrency race test PASSED: Exactly 1 succeeded, 9 cleanly rejected with 409. Zero double-bookings.`
  );

  // =========================================================================
  // 6. VIP Booking Lifecycle & Reception Check-in
  // =========================================================================
  console.log('\n6. Testing Booking Modification, Reception Check-in, and Cancellation...');

  // Modify booking
  const modifyRes = await request('PATCH', `/api/admin/vip/bookings/${booking1.bookingReference}`, {
    cookie: adminCookie,
    body: {
      guestCount: 10,
      specialRequests: 'Dom Pérignon 2012, no shellfish, added 2 vegetarian course pairings.',
    },
  });
  assert(modifyRes.status === 200, 'Modify booking should return 200');
  assert(modifyRes.data.data.guestCount === 10, 'Guest count should be updated to 10');
  console.log(`✔ Modified booking ${booking1.bookingReference} guest count and requests`);

  // Reception check-in
  const checkinRes = await request(
    'POST',
    `/api/admin/vip/bookings/${booking1.bookingReference}/check-in`,
    {
      cookie: recCookie,
    }
  );
  assert(checkinRes.status === 200, 'Reception check-in should succeed (200)');
  assert(checkinRes.data.data.status === VIPBookingStatus.CHECKED_IN, 'Status must be CHECKED_IN');
  console.log(`✔ Reception check-in succeeded for ${booking1.bookingReference}`);

  // Cancellation and slot release test on the concurrent booking winner
  const concurrentWinnerRef = successResults[0].data.data.bookingReference;
  const cancelRes = await request(
    'POST',
    `/api/admin/vip/bookings/${concurrentWinnerRef}/cancel`,
    {
      cookie: adminCookie,
      body: { reason: 'Guest had to reschedule international flight.' },
    }
  );
  assert(cancelRes.status === 200, 'Cancel booking should return 200');
  assert(cancelRes.data.data.status === VIPBookingStatus.CANCELLED, 'Status must be CANCELLED');

  // Verify allocations are released
  const releasedAllocations = await VIPRoomAllocation.find({
    bookingReference: concurrentWinnerRef,
  });
  assert(
    releasedAllocations.length === 0,
    `Allocations must be cleanly removed on cancellation, found ${releasedAllocations.length}`
  );

  // Verify timeslot is now available again
  const reavailRes = await request(
    'GET',
    `/api/vip/availability?roomId=${createdRoom.id}&startAt=${encodeURIComponent(cStart)}&endAt=${encodeURIComponent(cEnd)}`
  );
  assert(reavailRes.data.data.isAvailable === true, 'Timeslot must become available after cancellation');
  console.log('✔ Booking cancellation released room allocations; timeslot verified available again');

  // =========================================================================
  // 7. Event Inquiries, Formal Proposals, and Acceptance
  // =========================================================================
  console.log('\n7. Testing Event Inquiry, Proposal Creation, and Proposal Acceptance...');

  // Customer creates inquiry
  const inqDate = new Date();
  inqDate.setDate(inqDate.getDate() + 30);
  const preferredDate = inqDate.toISOString().slice(0, 10);

  const inquiryRes = await request('POST', '/api/vip/inquiries', {
    body: {
      locationId: 'loc-colombo-main',
      eventType: 'Executive Board Dinner',
      preferredDate,
      preferredTime: '19:30',
      guestCount: 12,
      preferredRoomId: createdRoom.id,
      requirements: 'High-level diplomatic discussion, acoustic privacy, custom 6-course menu.',
      budgetMinor: 40000000, // LKR 400,000
      currency: 'LKR',
      guestName: 'Ambassador De Silva',
      guestEmail: 'desilva.embassy@example.com',
      guestPhone: '+94 77 555 6677',
    },
  });
  assert(inquiryRes.status === 201, `Create inquiry should return 201, got ${inquiryRes.status}`);
  const createdInquiry = inquiryRes.data.data;
  assert(createdInquiry.status === EventInquiryStatus.NEW, 'New inquiry status must be NEW');
  console.log(`✔ Created Event Inquiry: ${createdInquiry.inquiryReference}`);

  // Staff updates inquiry status to UNDER_REVIEW
  const updateInqRes = await request(
    'PATCH',
    `/api/admin/vip/inquiries/${createdInquiry.id}/status`,
    {
      cookie: adminCookie,
      body: { status: EventInquiryStatus.UNDER_REVIEW },
    }
  );
  assert(updateInqRes.status === 200, 'Update inquiry status should return 200');
  assert(updateInqRes.data.data.status === EventInquiryStatus.UNDER_REVIEW, 'Status should be UNDER_REVIEW');

  // Staff generates formal Event Proposal
  const eventStart = new Date(`${preferredDate}T19:30:00Z`).toISOString();
  const eventEnd = new Date(`${preferredDate}T23:00:00Z`).toISOString();

  const proposalRes = await request('POST', '/api/admin/vip/proposals', {
    cookie: adminCookie,
    body: {
      inquiryId: createdInquiry.id,
      roomId: createdRoom.id,
      startAt: eventStart,
      endAt: eventEnd,
      guestCount: 12,
      packageId: createdPkg.id,
      servicesSnapshot: [
        'Dedicated Private Sommelier',
        'Bang & Olufsen Acoustic Isolation',
        'Diplomatic Security Escort',
      ],
      subtotalMinor: 35000000,
      taxMinor: 3500000,
      totalMinor: 38500000, // LKR 385,000
      currency: 'LKR',
      terms: 'Non-disclosure protocols respected. 50% deposit required 7 days prior.',
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    },
  });

  assert(proposalRes.status === 201, `Create proposal should return 201, got ${proposalRes.status}`);
  const proposal = proposalRes.data.data;
  assert(proposal.status === EventProposalStatus.SENT, 'Proposal status should be SENT');
  console.log(`✔ Event Proposal generated and sent (Total: LKR 385,000)`);

  // Verify inquiry status updated to PROPOSAL_SENT
  const inqCheck = await EventInquiry.findById(createdInquiry.id);
  assert(
    inqCheck?.status === EventInquiryStatus.PROPOSAL_SENT,
    'Inquiry status should be automatically transitioned to PROPOSAL_SENT'
  );

  // Accept Proposal (Converts proposal to confirmed EventBooking and claims room slots)
  const acceptRes = await request('POST', `/api/admin/vip/proposals/${proposal.id}/accept`, {
    cookie: adminCookie,
  });

  assert(acceptRes.status === 200, `Proposal acceptance should return 200, got ${acceptRes.status}`);
  const confirmedEvent = acceptRes.data.data;
  assert(confirmedEvent.status === EventBookingStatus.CONFIRMED, 'Event booking status must be CONFIRMED');
  assert(!!confirmedEvent.eventReference, 'Confirmed event must have an eventReference');
  console.log(`✔ Proposal Accepted: Confirmed Event Booking ${confirmedEvent.eventReference} created`);

  // Verify room slots are now atomically claimed for this event booking
  const eventAllocations = await VIPRoomAllocation.find({
    bookingReference: confirmedEvent.eventReference,
  });
  assert(
    eventAllocations.length > 0,
    `Room slots must be claimed in VIPRoomAllocation for event ${confirmedEvent.eventReference}`
  );
  console.log(`✔ Confirmed event claimed ${eventAllocations.length} atomic room slots`);

  // =========================================================================
  // 8. Manager Shift Overview Metrics
  // =========================================================================
  console.log('\n8. Testing Manager Overview Metrics...');

  const overviewRes = await request('GET', '/api/admin/vip/overview?locationId=loc-colombo-main', {
    cookie: adminCookie,
  });
  assert(overviewRes.status === 200, 'Overview query should return 200');
  const metrics = overviewRes.data.data;
  assert(metrics.totalActiveRooms >= 1, 'Should report at least 1 active room');
  assert(metrics.confirmedEvents >= 1, 'Should report at least 1 confirmed event');
  console.log(`✔ Manager Overview Metrics verified:`);
  console.log(`   - Total Active Rooms: ${metrics.totalActiveRooms}`);
  console.log(`   - Upcoming VIP Bookings: ${metrics.upcomingVIPBookings}`);
  console.log(`   - Confirmed Events: ${metrics.confirmedEvents}`);

  // =========================================================================
  // 9. Regulatory Staff Audit Log Verification
  // =========================================================================
  console.log('\n9. Verifying Regulatory Staff Audit Logs for VIP Operations...');

  const auditLogs = await StaffAuditLog.find({
    action: {
      $in: [
        'VIP_ROOM_CREATED',
        'VIP_BOOKING_CREATED',
        'VIP_BOOKING_MODIFIED',
        'VIP_GUEST_CHECKED_IN',
        'EVENT_PROPOSAL_CREATED',
        'EVENT_BOOKING_CONFIRMED',
      ],
    },
  });

  assert(auditLogs.length >= 5, `Expected at least 5 audit log entries, found ${auditLogs.length}`);
  console.log(`✔ Found ${auditLogs.length} verified VIP audit log records in database`);

  // =========================================================================
  // 10. Clean Teardown
  // =========================================================================
  console.log('\n10. Cleaning up test artifacts...');
  await Promise.all([
    Staff.deleteMany({ email: { $in: [adminStaff.email, receptionStaff.email] } }),
    VIPRoom.deleteOne({ _id: createdRoom.id }),
    VIPRoomAllocation.deleteMany({ roomId: createdRoom.id }),
    VIPBooking.deleteMany({ roomId: createdRoom.id }),
    PrivateDiningPackage.deleteOne({ _id: createdPkg.id }),
    EventInquiry.deleteOne({ _id: createdInquiry.id }),
    EventProposal.deleteOne({ _id: proposal.id }),
    EventBooking.deleteOne({ _id: confirmedEvent.id }),
  ]);

  server.close();
  console.log('✔ Test suite teardown completed cleanly');

  console.log('\n=============================================================');
  console.log('   ALL 10 VIP & EVENTS TEST PHASES PASSED WITH ZERO ERRORS   ');
  console.log('=============================================================\n');
}

runVIPTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  });
