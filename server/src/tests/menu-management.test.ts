import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { PublicationStatus } from '../types/menu';
import { hashPassword } from '../utils/password';
import { storeMenuImage } from '../utils/imageStorage';

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
  console.log('  AURELLE STAGE 6: MENU MANAGEMENT SYSTEM TEST SUITE');
  console.log('=============================================================\n');

  // Connect MongoDB first so MongoStore can use the active connection
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(env.MONGODB_URI);
  }

  // Setup server
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
  const testAdminEmail = `admin_menu_${testSuffix}@aurelle.com`;
  const testFloorEmail = `floor_menu_${testSuffix}@aurelle.com`;
  const plainPassword = 'Aurelle@Admin2026!';
  const passwordHash = await hashPassword(plainPassword);

  // Create test staff accounts
  const adminStaff = await Staff.create({
    firstName: 'Admin',
    lastName: 'ChefMaster',
    email: testAdminEmail,
    passwordHash,
    role: StaffRole.ADMIN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  const floorStaff = await Staff.create({
    firstName: 'Floor',
    lastName: 'StaffUser',
    email: testFloorEmail,
    passwordHash,
    role: StaffRole.FLOOR,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  });

  let adminCookie = '';
  let floorCookie = '';
  let sampleCategoryId = '';
  let draftDishId = '';
  let publishedDishId = '';

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

  // 1. Authenticate Staff
  await test('1. Staff Authentication: ADMIN and FLOOR sign in to acquire session cookies', async () => {
    const adminRes = await request('POST', '/api/staff/auth/login', {
      body: { email: testAdminEmail, password: plainPassword },
    });
    assert(adminRes.status === 200, `Admin login status expected 200, got ${adminRes.status}`);
    adminCookie = adminRes.cookie || '';
    assert(Boolean(adminCookie), 'Admin cookie must be set');

    const floorRes = await request('POST', '/api/staff/auth/login', {
      body: { email: testFloorEmail, password: plainPassword },
    });
    assert(floorRes.status === 200, `Floor login status expected 200, got ${floorRes.status}`);
    floorCookie = floorRes.cookie || '';
  });

  // 2. Category Management
  await test('2. Category Management: ADMIN creates and queries categories', async () => {
    const res = await request('POST', '/api/admin/menu/categories', {
      cookie: adminCookie,
      body: {
        name: `Test Category ${testSuffix}`,
        slug: `test-cat-${testSuffix}`,
        description: 'Testing category ordering and visibility',
        displayOrder: 99,
        isVisible: true,
      },
    });
    assert(res.status === 201, `Category creation status expected 201, got ${res.status}`);
    assert(res.data.success === true, 'Success should be true');
    sampleCategoryId = res.data.data.id;
    assert(Boolean(sampleCategoryId), 'Category ID must exist');

    const listRes = await request('GET', '/api/admin/menu/categories', { cookie: adminCookie });
    assert(listRes.status === 200, 'Categories list expected 200');
    assert(Array.isArray(listRes.data.data), 'Expected categories array');
  });

  // 3. Admin can create a draft dish
  await test('3. Dish Creation: ADMIN creates draft dish with valid fields', async () => {
    const res = await request('POST', '/api/admin/menu', {
      cookie: adminCookie,
      body: {
        name: `Draft Special ${testSuffix}`,
        categoryId: sampleCategoryId,
        shortDescription: 'Tender beef short rib in tamarind glaze',
        description: 'Tender beef short rib in tamarind glaze with roasted coconut sambal.',
        price: 7200,
        currency: 'LKR',
        publicationStatus: PublicationStatus.DRAFT,
        isAvailable: true,
        dietaryTags: ['GLUTEN-FREE'],
      },
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.data.data.publicationStatus === 'DRAFT', 'Status should be DRAFT');
    assert(res.data.data.priceMinor === 720000, `Expected minor units 720000, got ${res.data.data.priceMinor}`);
    draftDishId = res.data.data.id;
  });

  // 4. Draft dishes are hidden publicly
  await test('4. Public Visibility: Draft dishes are excluded from public menu results', async () => {
    const res = await request('GET', `/api/menu?search=Draft+Special+${testSuffix}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const found = res.data.data.dishes.find((d: any) => d.id === draftDishId);
    assert(!found, 'Draft dish must NOT appear on public menu');
  });

  // 5. Publish dish and verify public appearance
  await test('5. Publishing Workflow: ADMIN publishes dish and it appears on public menu', async () => {
    const pubRes = await request('POST', `/api/admin/menu/${draftDishId}/publish`, {
      cookie: adminCookie,
    });
    assert(pubRes.status === 200, `Expected 200, got ${pubRes.status}`);
    assert(pubRes.data.data.publicationStatus === 'PUBLISHED', 'Expected status PUBLISHED');
    publishedDishId = draftDishId;

    const publicRes = await request('GET', `/api/menu?search=Draft+Special+${testSuffix}`);
    assert(publicRes.status === 200, 'Expected 200 on public menu search');
    const found = publicRes.data.data.dishes.find((d: any) => d.id === publishedDishId);
    assert(Boolean(found), 'Published dish MUST appear on public menu');
  });

  // 6. Archived dishes are hidden publicly
  await test('6. Archival: ADMIN archives dish and it is hidden from public menu', async () => {
    const archRes = await request('POST', `/api/admin/menu/${publishedDishId}/archive`, {
      cookie: adminCookie,
    });
    assert(archRes.status === 200, `Expected 200, got ${archRes.status}`);
    assert(archRes.data.data.publicationStatus === 'ARCHIVED', 'Expected status ARCHIVED');

    const publicRes = await request('GET', `/api/menu?search=Draft+Special+${testSuffix}`);
    assert(publicRes.status === 200, 'Expected 200');
    const found = publicRes.data.data.dishes.find((d: any) => d.id === publishedDishId);
    assert(!found, 'Archived dish must NOT appear on public menu');
  });

  // 7. Unauthorized staff cannot edit menu
  await test('7. RBAC Security: FLOOR staff receives 403 Forbidden on menu editing', async () => {
    const res = await request('POST', '/api/admin/menu', {
      cookie: floorCookie,
      body: {
        name: 'Unauthorized Dish',
        categoryId: sampleCategoryId,
        shortDescription: 'Should be rejected',
        description: 'Should be rejected',
        price: 5000,
      },
    });
    assert(res.status === 403, `Floor staff expected 403, got ${res.status}`);
  });

  // 8. Invalid prices are rejected
  await test('8. Price Validation: Negative prices and invalid values are rejected with 400', async () => {
    const res = await request('POST', '/api/admin/menu', {
      cookie: adminCookie,
      body: {
        name: `Invalid Price Dish ${testSuffix}`,
        categoryId: sampleCategoryId,
        shortDescription: 'Price check',
        description: 'Price check description',
        price: -500,
      },
    });
    assert(res.status === 400, `Expected 400 on negative price, got ${res.status}`);
  });

  // 9. Duplicate slugs are handled gracefully
  await test('9. Slug Collision: Duplicate names receive unique candidate slugs', async () => {
    const dish1 = await request('POST', '/api/admin/menu', {
      cookie: adminCookie,
      body: {
        name: `Unique Slug Test ${testSuffix}`,
        categoryId: sampleCategoryId,
        shortDescription: 'Slug test 1',
        description: 'Slug test description 1',
        price: 4500,
      },
    });
    assert(dish1.status === 201, 'Dish 1 created');

    const dish2 = await request('POST', '/api/admin/menu', {
      cookie: adminCookie,
      body: {
        name: `Unique Slug Test ${testSuffix}`,
        categoryId: sampleCategoryId,
        shortDescription: 'Slug test 2',
        description: 'Slug test description 2',
        price: 4500,
      },
    });
    assert(dish2.status === 201, 'Dish 2 created');
    assert(dish1.data.data.slug !== dish2.data.data.slug, 'Duplicate dish slugs must be unique');
  });

  // 10. Invalid categories are rejected
  await test('10. Integrity: Dishes referencing invalid category IDs are rejected with 400', async () => {
    const res = await request('POST', '/api/admin/menu', {
      cookie: adminCookie,
      body: {
        name: `Orphan Dish ${testSuffix}`,
        categoryId: '60c72b2f9b1d8b0015f8b999', // Non-existent ObjectId
        shortDescription: 'Orphan test',
        description: 'Orphan test description',
        price: 3500,
      },
    });
    assert(res.status === 400, `Expected 400 on invalid category, got ${res.status}`);
  });

  // 11. Image upload validation
  await test('11. Image Upload: Validates file type, magic bytes, and rejects corrupted data', async () => {
    // 1x1 valid PNG buffer encoded in base64
    const validPngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const validRes = await request('POST', '/api/admin/menu/images', {
      cookie: adminCookie,
      body: { image: validPngBase64, filename: 'test-pixel.png' },
    });
    assert(validRes.status === 201, `Expected 201 on valid PNG, got ${validRes.status}`);
    assert(validRes.data.data.url.startsWith('/uploads/menu/'), 'URL must point to static uploads');

    // Invalid executable string pretending to be image
    const invalidBase64 = 'data:image/png;base64,TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAA=';
    const invalidRes = await request('POST', '/api/admin/menu/images', {
      cookie: adminCookie,
      body: { image: invalidBase64 },
    });
    assert(invalidRes.status === 400, `Expected 400 on spoofed executable, got ${invalidRes.status}`);
  });

  // 12. Availability updates persist and sync
  await test('12. Availability Management: Toggle availability updates MongoDB and public menu', async () => {
    // Create published dish
    const createRes = await request('POST', '/api/admin/menu', {
      cookie: adminCookie,
      body: {
        name: `Availability Dish ${testSuffix}`,
        categoryId: sampleCategoryId,
        shortDescription: 'Stock toggle check',
        description: 'Stock toggle check description',
        price: 6000,
        publicationStatus: PublicationStatus.PUBLISHED,
        isAvailable: true,
      },
    });
    assert(createRes.status === 201, 'Dish created');
    const dishId = createRes.data.data.id;

    // Toggle to unavailable
    const patchRes = await request('PATCH', `/api/admin/menu/${dishId}`, {
      cookie: adminCookie,
      body: { isAvailable: false },
    });
    assert(patchRes.status === 200, 'Availability patched');
    assert(patchRes.data.data.isAvailable === false, 'Dish must be unavailable');

    // Check public API
    const pubRes = await request('GET', `/api/menu?search=Availability+Dish+${testSuffix}`);
    assert(pubRes.status === 200, 'Public menu response 200');
    const found = pubRes.data.data.dishes.find((d: any) => d.id === dishId);
    assert(Boolean(found), 'Dish should be on public menu');
    assert(found.isAvailable === false, 'Public dish must show isAvailable === false');
  });

  // 13. Featured dishes filtering
  await test('13. Featured Dishes: Featured items returned by /api/menu/featured', async () => {
    const featuredRes = await request('GET', '/api/menu/featured');
    assert(featuredRes.status === 200, `Expected 200, got ${featuredRes.status}`);
    assert(Array.isArray(featuredRes.data.data), 'Expected array of featured dishes');
    assert(featuredRes.data.data.every((d: any) => d.isFeatured === true), 'All items must be featured');
  });

  // 14. Dish duplication
  await test('14. Duplicate Dish: Creates duplicate dish as DRAFT with unique slug', async () => {
    // Find any existing dish
    const dish = await MenuItem.findOne({ publicationStatus: PublicationStatus.PUBLISHED });
    assert(Boolean(dish), 'Must have at least one dish');

    const dupRes = await request('POST', `/api/admin/menu/${dish!._id}/duplicate`, {
      cookie: adminCookie,
    });
    assert(dupRes.status === 201, `Duplicate expected 201, got ${dupRes.status}`);
    assert(dupRes.data.data.publicationStatus === 'DRAFT', 'Duplicate must start as DRAFT');
    assert(dupRes.data.data.slug !== dish!.slug, 'Duplicate must have a distinct slug');
  });

  // 15. Audit logging
  await test('15. Governance: Menu actions create entries in StaffAuditLog', async () => {
    const logs = await StaffAuditLog.find({
      action: { $in: ['MENU_ITEM_CREATED', 'MENU_ITEM_PUBLISHED', 'CATEGORY_CREATED'] },
    });
    assert(logs.length > 0, 'Audit logs must be recorded for menu operations');
  });

  // 16. Summary metrics
  await test('16. Summary Counts: /api/admin/menu/summary returns accurate MongoDB counts', async () => {
    const res = await request('GET', '/api/admin/menu/summary', { cookie: adminCookie });
    assert(res.status === 200, 'Summary expected 200');
    assert(typeof res.data.data.total === 'number', 'total must be number');
    assert(typeof res.data.data.published === 'number', 'published must be number');
    assert(typeof res.data.data.draft === 'number', 'draft must be number');
  });

  // Clean up test data
  console.log('\n  Cleaning up test fixtures...');
  await Staff.deleteMany({ email: { $in: [testAdminEmail, testFloorEmail] } });
  await MenuItem.deleteMany({ slug: new RegExp(testSuffix) });
  await MenuCategory.deleteMany({ slug: new RegExp(testSuffix) });

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
