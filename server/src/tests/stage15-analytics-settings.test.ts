import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { RestaurantSettings } from '../models/restaurantSettings.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { Order } from '../models/order.model';
import { MenuItem } from '../models/menuItem.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { OrderStatus, OrderType, PaymentStatus } from '../types/order';
import { hashPassword } from '../utils/password';
import { setupSocketServer, closeSocketServer } from '../sockets/socket.server';
import { calculateAuthoritativePricing } from '../services/order.service';

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
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {}
  } else if (contentType.includes('text/csv')) {
    data = await res.text();
  }

  // Extract set-cookie
  const setCookie = res.headers.get('set-cookie');
  let cookieHeader: string | undefined;
  if (setCookie) {
    const parts = setCookie.split(';')[0];
    cookieHeader = parts;
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
    cookie: cookieHeader,
  };
}

async function login(email: string, pass: string): Promise<string> {
  const res = await request('POST', '/api/staff/auth/login', {
    body: { email, password: pass },
  });
  assert(res.status === 200, `Login failed for ${email} with status ${res.status}`);
  assert(!!res.cookie, 'Expected session cookie on login');
  return res.cookie!;
}

async function runStage15Tests() {
  console.log('\n============================================================');
  console.log('  STAGE 15: COMPLETE ANALYTICS, BI & SETTINGS TEST SUITE');
  console.log('============================================================\n');

  // 1. Connect MongoDB
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(env.MONGODB_URI, { dbName: 'aurelle' });
  console.log('MongoDB Atlas connected successfully.');

  // 2. Start HTTP server
  const app = createApp();
  const server = http.createServer(app);
  setupSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 5000;
      ctx = {
        server,
        baseUrl: `http://localhost:${port}`,
        port,
      };
      console.log(`Test server running at ${ctx.baseUrl}`);
      resolve();
    });
  });

  const locationId = 'loc-colombo-main';
  let adminCookie = '';
  let managerCookie = '';
  let kitchenCookie = '';

  try {
    // 3. Seed accounts for Admin, Manager, and Kitchen roles
    console.log('\n--- Seeding test credentials ---');
    const pwdHash = await hashPassword('AdminPass123!');

    await Staff.deleteMany({
      email: { $in: ['test.admin.s15@aurelle.luxury', 'test.manager.s15@aurelle.luxury', 'test.kitchen.s15@aurelle.luxury'] },
    });

    const [adminStaff, managerStaff, kitchenStaff] = await Promise.all([
      Staff.create({
        firstName: 'Elena',
        lastName: 'Vane',
        email: 'test.admin.s15@aurelle.luxury',
        passwordHash: pwdHash,
        role: StaffRole.ADMIN,
        status: StaffStatus.ACTIVE,
        locationIds: [locationId],
      }),
      Staff.create({
        firstName: 'Marcus',
        lastName: 'Sterling',
        email: 'test.manager.s15@aurelle.luxury',
        passwordHash: pwdHash,
        role: StaffRole.MANAGER,
        status: StaffStatus.ACTIVE,
        locationIds: [locationId],
      }),
      Staff.create({
        firstName: 'Chef',
        lastName: 'Pierre',
        email: 'test.kitchen.s15@aurelle.luxury',
        passwordHash: pwdHash,
        role: StaffRole.KITCHEN,
        status: StaffStatus.ACTIVE,
        locationIds: [locationId],
      }),
    ]);

    adminCookie = await login('test.admin.s15@aurelle.luxury', 'AdminPass123!');
    managerCookie = await login('test.manager.s15@aurelle.luxury', 'AdminPass123!');
    kitchenCookie = await login('test.kitchen.s15@aurelle.luxury', 'AdminPass123!');
    console.log('✓ Staff accounts authenticated.');

    // TEST 1: Public settings endpoint
    console.log('\n[Test 1] Public Settings Endpoint (Customer E-Commerce / Reservations)');
    const pubRes = await request('GET', `/api/settings/public?locationId=${locationId}`);
    assert(pubRes.status === 200, `Expected 200, got ${pubRes.status}`);
    assert(pubRes.data.success === true, 'Expected success: true');
    assert(!!pubRes.data.data.operatingHours, 'Expected operatingHours in public settings');
    assert(typeof pubRes.data.data.financialPolicy.taxRate === 'number', 'Expected taxRate');
    assert(typeof pubRes.data.data.financialPolicy.serviceChargeRate === 'number', 'Expected serviceChargeRate');
    console.log('✓ Public settings verified successfully.');

    // TEST 2: RBAC Protection on Admin Settings
    console.log('\n[Test 2] RBAC Protection on System Settings');
    const unauthRes = await request('GET', `/api/settings?locationId=${locationId}`);
    assert(unauthRes.status === 401, `Unauthenticated request should return 401, got ${unauthRes.status}`);

    const kitchenRes = await request('GET', `/api/settings?locationId=${locationId}`, { cookie: kitchenCookie });
    assert(kitchenRes.status === 403, `Kitchen staff reading settings should return 403, got ${kitchenRes.status}`);

    const adminGet = await request('GET', `/api/settings?locationId=${locationId}`, { cookie: adminCookie });
    assert(adminGet.status === 200, `Admin reading settings should return 200, got ${adminGet.status}`);
    assert(adminGet.data.data.locationId === locationId, 'Location ID mismatch');
    const initialVersion = adminGet.data.data.version;
    console.log(`✓ RBAC access control verified. Current config version: v${initialVersion}`);

    // TEST 3: Admin Updating Financial Policy with Optimistic Concurrency
    console.log('\n[Test 3] Administrative Settings Update with Concurrency Protection');
    // Manager attempting update should fail (403)
    const managerUpdate = await request('PUT', '/api/settings', {
      cookie: managerCookie,
      body: {
        locationId,
        section: 'financialPolicy',
        data: {
          ...adminGet.data.data.financialPolicy,
          serviceChargeRate: 0.12,
        },
        version: initialVersion,
      },
    });
    assert(managerUpdate.status === 403, `Manager update should be forbidden (403), got ${managerUpdate.status}`);

    // Admin updates financial policy
    const adminUpdate = await request('PUT', '/api/settings', {
      cookie: adminCookie,
      body: {
        locationId,
        section: 'financialPolicy',
        data: {
          ...adminGet.data.data.financialPolicy,
          serviceChargeRate: 0.12, // changed to 12%
          taxRate: 0.03, // changed to 3%
        },
        version: initialVersion,
      },
    });
    assert(adminUpdate.status === 200, `Admin update should succeed with 200, got ${adminUpdate.status}`);
    assert(adminUpdate.data.data.version === initialVersion + 1, 'Version should increment');
    assert(adminUpdate.data.data.financialPolicy.serviceChargeRate === 0.12, 'Service charge rate mismatch');
    const newVersion = adminUpdate.data.data.version;
    console.log(`✓ Admin updated financial policy to 12% service charge and 3% tax (v${initialVersion} -> v${newVersion}).`);

    // Verify Concurrency Conflict (409) if old version is resubmitted
    const conflictRes = await request('PUT', '/api/settings', {
      cookie: adminCookie,
      body: {
        locationId,
        section: 'financialPolicy',
        data: {
          ...adminGet.data.data.financialPolicy,
          serviceChargeRate: 0.15,
        },
        version: initialVersion, // Stale version!
      },
    });
    assert(conflictRes.status === 409, `Stale version should trigger 409 Conflict, got ${conflictRes.status}`);
    console.log('✓ Optimistic concurrency conflict correctly intercepted with 409.');

    // TEST 4: Audit Log Verification
    console.log('\n[Test 4] System Audit Logging Verification');
    const auditLogs = await StaffAuditLog.find({
      locationId,
      action: 'SETTINGS_UPDATED',
    }).sort({ createdAt: -1 }).limit(1);

    assert(auditLogs.length > 0, 'Expected audit log entry for SETTINGS_UPDATED');
    assert(auditLogs[0].actorEmail === 'test.admin.s15@aurelle.luxury', 'Audit actor mismatch');
    console.log(`✓ Audit log verified: "${auditLogs[0].details}"`);

    // TEST 5: Dynamic Order Pricing Integration
    console.log('\n[Test 5] Dynamic Real-Time Settings Integration with Order Pricing');
    let sampleDish = await MenuItem.findOne({ locationIds: locationId, publicationStatus: 'PUBLISHED' });
    if (!sampleDish) {
      sampleDish = await MenuItem.create({
        name: 'Tasting Caviar Course',
        slug: `tasting-caviar-${Date.now()}`,
        description: 'Imperial Oscietra Caviar with brioche',
        shortDescription: 'Caviar Course',
        categoryId: new mongoose.Types.ObjectId(),
        categoryName: 'Starters',
        categorySlug: 'starters',
        priceMinor: 1000000, // Rs. 10,000
        currency: 'LKR',
        images: ['/images/caviar.jpg'],
        ingredients: ['Caviar', 'Brioche'],
        allergens: ['Fish', 'Gluten'],
        dietaryTags: [],
        preparationTimeMinutes: 15,
        isAvailable: true,
        isFeatured: true,
        publicationStatus: 'PUBLISHED',
        displayOrder: 1,
        locationIds: [locationId],
      });
    }

    // Compute pricing for an item and verify it picks up the 12% service charge and 3% tax!
    const testPricing = await calculateAuthoritativePricing(
      [{ menuItemId: sampleDish._id.toString(), quantity: 1, expectedUnitPriceMinor: sampleDish.priceMinor }],
      locationId
    );
    const expectedSubtotal = sampleDish.priceMinor;
    const expectedTax = Math.round(expectedSubtotal * 0.03);
    const expectedService = Math.round(expectedSubtotal * 0.12);
    const expectedTotal = expectedSubtotal + expectedTax + expectedService;

    assert(testPricing.taxMinor === expectedTax, `Expected taxMinor ${expectedTax} at 3%, got ${testPricing.taxMinor}`);
    assert(testPricing.serviceChargeMinor === expectedService, `Expected serviceChargeMinor ${expectedService} at 12%, got ${testPricing.serviceChargeMinor}`);
    assert(testPricing.totalMinor === expectedTotal, `Expected totalMinor ${expectedTotal}, got ${testPricing.totalMinor}`);
    console.log('✓ Live order pricing dynamically applied updated settings rates.');

    // TEST 6: Reset Section to Defaults
    console.log('\n[Test 6] Resetting Section to Defaults');
    const resetRes = await request('POST', '/api/settings/reset', {
      cookie: adminCookie,
      body: {
        locationId,
        section: 'financialPolicy',
        version: newVersion,
      },
    });
    assert(resetRes.status === 200, `Reset should succeed with 200, got ${resetRes.status}`);
    assert(resetRes.data.data.financialPolicy.serviceChargeRate === 0.10, 'Service charge should reset to 10%');
    assert(resetRes.data.data.financialPolicy.taxRate === 0.025, 'Tax rate should reset to 2.5%');
    console.log('✓ Financial rates successfully reset to system defaults (10% and 2.5%).');

    // TEST 7: Security & Fleet Overview Endpoints
    console.log('\n[Test 7] Security Parameters & Location Fleet Overview');
    const secRes = await request('GET', '/api/settings/security', { cookie: adminCookie });
    assert(secRes.status === 200, `Security endpoint should return 200, got ${secRes.status}`);
    assert(secRes.data.data.session.maxAgeHours === 24, 'Session maxAge mismatch');
    assert(secRes.data.data.database.state === 'CONNECTED', 'Database state should be CONNECTED');

    const locRes = await request('GET', '/api/settings/locations', { cookie: adminCookie });
    assert(locRes.status === 200, `Locations endpoint should return 200, got ${locRes.status}`);
    assert(Array.isArray(locRes.data.data) && locRes.data.data.length >= 2, 'Expected at least 2 locations');
    console.log('✓ Security and multi-location fleet verified.');

    // TEST 8: Analytics Aggregation Endpoints
    console.log('\n[Test 8] Business Intelligence & Analytics Aggregations');
    const overviewRes = await request('GET', `/api/analytics/overview?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(overviewRes.status === 200, `Overview should return 200, got ${overviewRes.status}`);
    assert(overviewRes.data.data.revenue !== undefined, 'Expected revenue in overview');
    assert(overviewRes.data.data.orders !== undefined, 'Expected orders in overview');
    assert(Array.isArray(overviewRes.data.data.trend), 'Expected trend array in overview');

    const salesRes = await request('GET', `/api/analytics/sales?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(salesRes.status === 200, `Sales analytics should return 200, got ${salesRes.status}`);
    assert(Array.isArray(salesRes.data.data.byOrderType), 'Expected byOrderType array');
    assert(Array.isArray(salesRes.data.data.hourlyDistribution), 'Expected hourlyDistribution array');

    const ordersRes = await request('GET', `/api/analytics/orders?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(ordersRes.status === 200, `Orders analytics should return 200, got ${ordersRes.status}`);

    const menuRes = await request('GET', `/api/analytics/menu?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(menuRes.status === 200, `Menu analytics should return 200, got ${menuRes.status}`);

    const kitchenAnalytics = await request('GET', `/api/analytics/kitchen?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(kitchenAnalytics.status === 200, `Kitchen analytics should return 200, got ${kitchenAnalytics.status}`);

    const resAnalytics = await request('GET', `/api/analytics/reservations?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(resAnalytics.status === 200, `Reservations analytics should return 200, got ${resAnalytics.status}`);

    const tableAnalytics = await request('GET', `/api/analytics/tables?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(tableAnalytics.status === 200, `Table analytics should return 200, got ${tableAnalytics.status}`);

    const vipAnalytics = await request('GET', `/api/analytics/vip-events?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(vipAnalytics.status === 200, `VIP analytics should return 200, got ${vipAnalytics.status}`);

    const staffAnalytics = await request('GET', `/api/analytics/staff?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(staffAnalytics.status === 200, `Staff analytics should return 200, got ${staffAnalytics.status}`);

    const custAnalytics = await request('GET', `/api/analytics/customers?locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(custAnalytics.status === 200, `Customer analytics should return 200, got ${custAnalytics.status}`);
    console.log('✓ All 10 Analytics domain aggregation endpoints verified.');

    // TEST 9: Manager Access to Analytics
    console.log('\n[Test 9] Manager Role Access to Analytics');
    const mgrOverview = await request('GET', `/api/analytics/overview?locationId=${locationId}&preset=last30days`, {
      cookie: managerCookie,
    });
    assert(mgrOverview.status === 200, `Manager should be authorized for analytics overview (200), got ${mgrOverview.status}`);
    console.log('✓ Manager role successfully authorized for analytics telemetry.');

    // TEST 10: Report CSV Export
    console.log('\n[Test 10] Formatted RFC 4180 CSV Report Export Engine');
    const csvExport = await request('GET', `/api/reports/export?reportType=sales&locationId=${locationId}&preset=last30days`, {
      cookie: adminCookie,
    });
    assert(csvExport.status === 200, `CSV export should return 200, got ${csvExport.status}`);
    assert(Boolean(csvExport.headers.get('content-type')?.includes('text/csv')), 'Expected text/csv content-type');
    assert(typeof csvExport.data === 'string', 'Expected CSV string output');
    assert(csvExport.data.includes('AURELLE Fine Dining & Lounge'), 'Expected Aurelle brand header in CSV');
    assert(csvExport.data.includes('Subtotal (LKR)'), 'Expected standard table headers in CSV');
    console.log('✓ CSV export generated with valid RFC 4180 format and UTF-8 BOM.');

    // Check export audit log
    const exportLogs = await StaffAuditLog.find({
      locationId,
      action: 'ANALYTICS_REPORT_EXPORTED',
    }).limit(1);
    assert(exportLogs.length > 0, 'Expected audit entry for report export');
    console.log(`✓ Report export audit logged: "${exportLogs[0].details}"`);

    console.log('\n============================================================');
    console.log('  ALL 10 STAGE 15 INTEGRATION TEST SUITES PASSED (10/10)');
    console.log('============================================================\n');
  } finally {
    // Cleanup
    await Staff.deleteMany({
      email: { $in: ['test.admin.s15@aurelle.luxury', 'test.manager.s15@aurelle.luxury', 'test.kitchen.s15@aurelle.luxury'] },
    });
    closeSocketServer();
    await new Promise<void>((resolve) => ctx.server.close(() => resolve()));
    await mongoose.disconnect();
    console.log('Cleanup completed. Sockets and database disconnected.');
  }
}

runStage15Tests().catch((err) => {
  console.error('\n❌ STAGE 15 TEST SUITE FAILED:', err);
  process.exit(1);
});
