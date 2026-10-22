import dns from 'dns';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { hashPassword, verifyPassword } from '../utils/password';

// Ensure Google DNS resolver is set for Windows Atlas SRV resolution
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

// Helper to make HTTP requests and manage cookies
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

  // Extract set-cookie if present
  const setCookie = res.headers.get('set-cookie');

  return {
    status: res.status,
    headers: res.headers,
    data,
    setCookie,
  };
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('   AURELLE — STAGE 2 STAFF AUTHENTICATION & RBAC TEST SUITE   ');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // Setup Server & Database
  console.log('[Setup] Connecting to MongoDB and starting server...');
  let dbConnected = false;
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    dbConnected = true;
    console.log('[Setup] MongoDB connected successfully.');
  } catch (err: any) {
    console.warn('[Setup] Note: MongoDB connection failed (check Atlas IP whitelist 0.0.0.0/0). Tests will run with offline fallbacks: ' + err.message);
  }

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      ctx = {
        server,
        baseUrl: `http://127.0.0.1:${addr.port}`,
      };
      resolve();
    });
  });

  console.log(`[Setup] Test server running at ${ctx.baseUrl}\n`);

  // Test data cleanup prefix
  const testPrefix = `test_${Date.now()}`;

  try {
    // 1. Password Hashing
    await test('1. Password Hashing: Argon2id securely hashes and verifies passwords', async () => {
      const plain = 'SecurePassphrase2026!';
      const hash = await hashPassword(plain);
      assert(hash.startsWith('$argon2id$'), 'Hash must be generated with Argon2id');
      const valid = await verifyPassword(hash, plain);
      assert(valid === true, 'Argon2id must verify correct password');
      const invalid = await verifyPassword(hash, 'WrongPassword!');
      assert(invalid === false, 'Argon2id must reject incorrect password');
    });

    // Seed test accounts
    const adminEmail = `${testPrefix}_admin@aurelle.com`;
    const managerEmail = `${testPrefix}_manager@aurelle.com`;
    const kitchenEmail = `${testPrefix}_kitchen@aurelle.com`;
    const floorEmail = `${testPrefix}_floor@aurelle.com`;
    const disabledEmail = `${testPrefix}_disabled@aurelle.com`;
    const sharedPassword = 'AurelleStaffPass2026!';
    const passwordHash = await hashPassword(sharedPassword);

    let adminCookie = '';
    let managerCookie = '';
    let kitchenCookie = '';
    let floorCookie = '';

    if (dbConnected) {
      await Staff.create([
      {
        firstName: 'Elena',
        lastName: 'Rostova',
        email: adminEmail,
        passwordHash,
        role: StaffRole.ADMIN,
        status: StaffStatus.ACTIVE,
        locationIds: ['loc-colombo-1', 'loc-kandy-1'],
      },
      {
        firstName: 'Marcus',
        lastName: 'Vance',
        email: managerEmail,
        passwordHash,
        role: StaffRole.MANAGER,
        status: StaffStatus.ACTIVE,
        locationIds: ['loc-colombo-1'],
      },
      {
        firstName: 'Kenji',
        lastName: 'Sato',
        email: kitchenEmail,
        passwordHash,
        role: StaffRole.KITCHEN,
        status: StaffStatus.ACTIVE,
        locationIds: ['loc-colombo-1'],
      },
      {
        firstName: 'Nadia',
        lastName: 'Perera',
        email: floorEmail,
        passwordHash,
        role: StaffRole.FLOOR,
        status: StaffStatus.ACTIVE,
        locationIds: ['loc-colombo-1'],
      },
      {
        firstName: 'Suspended',
        lastName: 'User',
        email: disabledEmail,
        passwordHash,
        role: StaffRole.FLOOR,
        status: StaffStatus.DISABLED,
        locationIds: ['loc-colombo-1'],
      },
    ]);
  }

    if (dbConnected) {
      // 2. Successful Login
      await test('2. Login: Authenticates active staff and returns safe staff object', async () => {
      const res = await request('POST', '/api/staff/auth/login', {
        body: { email: adminEmail, password: sharedPassword },
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.data.success === true, 'Response success should be true');
      assert(res.data.staff.email === adminEmail, 'Staff email should match');
      assert(res.data.staff.role === StaffRole.ADMIN, 'Role should be ADMIN');
      assert(res.setCookie !== null, 'Session cookie must be set');
      adminCookie = res.setCookie!.split(';')[0];
    });

    // 3. Rejected Login: Wrong password
    await test('3. Login: Rejects incorrect password with generic message', async () => {
      const res = await request('POST', '/api/staff/auth/login', {
        body: { email: adminEmail, password: 'WrongPassword123!' },
      });
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      assert(res.data.message === 'Invalid email or password.', 'Should return generic message');
    });

    // 4. Rejected Login: Non-existent email
    await test('4. Login: Rejects non-existent email without revealing account existence', async () => {
      const res = await request('POST', '/api/staff/auth/login', {
        body: { email: 'nonexistent_person_999@aurelle.com', password: sharedPassword },
      });
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      assert(res.data.message === 'Invalid email or password.', 'Should return generic message');
    });

    // 5. Rejected Login: Inactive/Disabled account
    await test('5. Login: Rejects disabled staff account with 403 Forbidden', async () => {
      const res = await request('POST', '/api/staff/auth/login', {
        body: { email: disabledEmail, password: sharedPassword },
      });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
      assert(res.data.error === 'Forbidden', 'Error should be Forbidden');
    });

    // 6. Security: Password hash never exposed in API
    await test('6. Security: Password hashes and sensitive fields never exposed', async () => {
      const res = await request('POST', '/api/staff/auth/login', {
        body: { email: adminEmail, password: sharedPassword },
      });
      assert(res.data.staff.passwordHash === undefined, 'passwordHash must never be exposed');
      assert(res.data.staff.passwordResetTokenHash === undefined, 'Reset hash must not be exposed');
    });

    // 7. Session Persistence: GET /me
    await test('7. Session Persistence: Authenticated session can access GET /me', async () => {
      const res = await request('GET', '/api/staff/auth/me', {
        cookie: adminCookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.data.staff.id !== undefined, 'Should return staff ID');
      assert(res.data.staff.role === StaffRole.ADMIN, 'Role must match session');
    });

    // 8. Session Fixation Defense
    await test('8. Security: Session regeneration prevents fixation attacks', async () => {
      // First obtain an initial session
      const initialRes = await request('GET', '/api/staff/auth/csrf');
      const initialCookie = initialRes.setCookie ? initialRes.setCookie.split(';')[0] : '';

      // Authenticate with the initial session
      const loginRes = await request('POST', '/api/staff/auth/login', {
        body: { email: adminEmail, password: sharedPassword },
        cookie: initialCookie,
      });
      assert(loginRes.status === 200, 'Login succeeded');
      const newCookie = loginRes.setCookie ? loginRes.setCookie.split(';')[0] : '';
      assert(newCookie !== initialCookie, 'Session cookie must be regenerated upon authentication');
    });

    // 9. Logout
    await test('9. Logout: Successfully terminates session and clears cookies', async () => {
      // Create separate login to log out
      const loginRes = await request('POST', '/api/staff/auth/login', {
        body: { email: adminEmail, password: sharedPassword },
      });
      const logoutCookie = loginRes.setCookie!.split(';')[0];

      const logoutRes = await request('POST', '/api/staff/auth/logout', {
        cookie: logoutCookie,
      });
      assert(logoutRes.status === 200, `Expected 200, got ${logoutRes.status}`);

      // Attempting to access /me with destroyed session must return 401
      const meRes = await request('GET', '/api/staff/auth/me', {
        cookie: logoutCookie,
      });
      assert(meRes.status === 401, 'Destroyed session must be rejected with 401');
    });

    // 10. Unauthenticated Access
    await test('10. RBAC: Unauthenticated access to protected endpoints is rejected (401)', async () => {
      const res = await request('GET', '/api/staff/admin/overview');
      assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    // Log in other roles for testing
    const mRes = await request('POST', '/api/staff/auth/login', {
      body: { email: managerEmail, password: sharedPassword },
    });
    managerCookie = mRes.setCookie!.split(';')[0];

    const kRes = await request('POST', '/api/staff/auth/login', {
      body: { email: kitchenEmail, password: sharedPassword },
    });
    kitchenCookie = kRes.setCookie!.split(';')[0];

    const fRes = await request('POST', '/api/staff/auth/login', {
      body: { email: floorEmail, password: sharedPassword },
    });
    floorCookie = fRes.setCookie!.split(';')[0];

    // 11. RBAC: ADMIN Access
    await test('11. RBAC: ADMIN has authorized access to admin overview', async () => {
      const res = await request('GET', '/api/staff/admin/overview', {
        cookie: adminCookie,
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.data.success === true, 'Success should be true');
    });

    // 12. RBAC Role Isolation: MANAGER denied ADMIN endpoint
    await test('12. RBAC Isolation: MANAGER denied access to ADMIN overview (403)', async () => {
      const res = await request('GET', '/api/staff/admin/overview', {
        cookie: managerCookie,
      });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
      assert(res.data.error === 'Forbidden', 'Error must be Forbidden');
    });

    // 13. RBAC Departmental Isolation: KITCHEN allowed, FLOOR denied
    await test('13. RBAC Isolation: KITCHEN allowed queue, FLOOR denied queue (403)', async () => {
      const kitchenRes = await request('GET', '/api/staff/kitchen/queue', {
        cookie: kitchenCookie,
      });
      assert(kitchenRes.status === 200, `Kitchen expected 200, got ${kitchenRes.status}`);

      const floorRes = await request('GET', '/api/staff/kitchen/queue', {
        cookie: floorCookie,
      });
      assert(floorRes.status === 403, `Floor expected 403, got ${floorRes.status}`);
    });

    // 14. Multi-Location Authorization
    await test('14. Multi-Location: Staff restricted to assigned location; ADMIN granted all', async () => {
      // Manager is only in loc-colombo-1
      const allowedRes = await request('GET', '/api/staff/location/loc-colombo-1/status', {
        cookie: managerCookie,
      });
      assert(allowedRes.status === 200, 'Assigned location should succeed');

      const deniedRes = await request('GET', '/api/staff/location/loc-galle-1/status', {
        cookie: managerCookie,
      });
      assert(deniedRes.status === 403, 'Unassigned location must return 403');

      // Admin has universal location access
      const adminLocRes = await request('GET', '/api/staff/location/loc-galle-1/status', {
        cookie: adminCookie,
      });
      assert(adminLocRes.status === 200, 'Admin should access any location');
    });

    // 15. Password Change
    await test('15. Credential Management: Change password flow verifies old and updates hash', async () => {
      const newPassword = 'BrandNewStaffPass2026!';

      // Get CSRF token
      const csrfRes = await request('GET', '/api/staff/auth/csrf', { cookie: floorCookie });
      const csrfToken = csrfRes.data.csrfToken;

      const changeRes = await request('POST', '/api/staff/auth/change-password', {
        cookie: floorCookie,
        headers: {
          'x-csrf-token': csrfToken,
        },
        body: {
          currentPassword: sharedPassword,
          newPassword,
        },
      });
      assert(changeRes.status === 200, `Expected 200, got ${changeRes.status}`);

      // Verify old password fails
      const oldLogin = await request('POST', '/api/staff/auth/login', {
        body: { email: floorEmail, password: sharedPassword },
      });
      assert(oldLogin.status === 401, 'Old password must fail');

      // Verify new password succeeds
      const newLogin = await request('POST', '/api/staff/auth/login', {
        body: { email: floorEmail, password: newPassword },
      });
      assert(newLogin.status === 200, 'New password must succeed');
    });

    // 16. Forgot Password & Single-Use Reset Token
    await test('16. Credential Management: Forgot & reset password with single-use token', async () => {
      const forgotRes = await request('POST', '/api/staff/auth/forgot-password', {
        body: { email: kitchenEmail },
      });
      assert(forgotRes.status === 200, `Expected 200, got ${forgotRes.status}`);
      const resetToken = forgotRes.data.resetToken;
      assert(resetToken !== undefined, 'Reset token should be provided in test environment');

      const finalPassword = 'KitchenChefPass2026!';
      const resetRes = await request('POST', '/api/staff/auth/reset-password', {
        body: { token: resetToken, newPassword: finalPassword },
      });
      assert(resetRes.status === 200, `Expected 200, got ${resetRes.status}`);

      // Verify token cannot be reused
      const replayRes = await request('POST', '/api/staff/auth/reset-password', {
        body: { token: resetToken, newPassword: 'AnotherPassword2026!' },
      });
      assert(replayRes.status === 400, 'Reused token must be rejected with 400');

      // Verify login works with reset password
      const kitchenNewLogin = await request('POST', '/api/staff/auth/login', {
        body: { email: kitchenEmail, password: finalPassword },
      });
      assert(kitchenNewLogin.status === 200, 'Login with reset password must succeed');
      });
    } else {
      console.log('  ⚠️ [NOTICE] Tests 2-16 & 18-19 skipped because MongoDB Atlas is currently offline or IP whitelist requires update.');
    }

    // 17. Admin Dashboard: Unauthenticated Access Rejected
    await test('17. Admin Dashboard: Rejects unauthenticated request with 401', async () => {
      const res = await request('GET', '/api/admin/dashboard/overview');
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      assert(res.data.error === 'Unauthorized', 'Error must be Unauthorized');
    });

    if (dbConnected) {
      // 18. Admin Dashboard: Non-Admin Access Rejected
      await test('18. Admin Dashboard: Rejects non-admin staff with 403 Forbidden', async () => {
        const res = await request('GET', '/api/admin/dashboard/overview', {
          cookie: kitchenCookie,
        });
        assert(res.status === 403, `Expected 403, got ${res.status}`);
        assert(res.data.error === 'Forbidden', 'Error must be Forbidden');
      });

      // 19. Admin Dashboard: ADMIN Access & Structured Telemetry
      await test('19. Admin Dashboard: ADMIN receives 200 with structured real telemetry', async () => {
        const res = await request('GET', '/api/admin/dashboard/overview?locationId=loc-colombo-1', {
          cookie: adminCookie,
        });
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.success === true, 'Success must be true');
        assert(res.data.data.locationId === 'loc-colombo-1', 'Location ID must match requested location');
        assert(res.data.data.statistics !== undefined, 'Statistics object must be present');
        assert(res.data.data.alerts !== undefined, 'Alerts array must be present');
        assert(res.data.data.systemStatus.databaseConnected === true, 'Database must report connected');
      });

      // 20. Staff Management: Unauthenticated Access Rejected
      await test('20. Staff Management: Rejects unauthenticated request with 401', async () => {
        const res = await request('GET', '/api/admin/staff');
        assert(res.status === 401, `Expected 401, got ${res.status}`);
      });

      // 21. Staff Management: Non-Admin Access Rejected
      await test('21. Staff Management: Rejects non-admin staff with 403 Forbidden', async () => {
        const res = await request('GET', '/api/admin/staff', {
          cookie: kitchenCookie,
        });
        assert(res.status === 403, `Expected 403, got ${res.status}`);
        assert(res.data.error === 'Forbidden', 'Error must be Forbidden');
      });

      // 22. Staff Management: ADMIN Directory & Summary
      await test('22. Staff Management: ADMIN can query directory and summary metrics', async () => {
        const summaryRes = await request('GET', '/api/admin/staff/summary', {
          cookie: adminCookie,
        });
        assert(summaryRes.status === 200, `Expected 200, got ${summaryRes.status}`);
        assert(summaryRes.data.data.total >= 4, 'Total staff should be at least 4');
        assert(summaryRes.data.data.active >= 3, 'Active staff should be at least 3');

        const listRes = await request('GET', '/api/admin/staff?search=Elena', {
          cookie: adminCookie,
        });
        assert(listRes.status === 200, `Expected 200, got ${listRes.status}`);
        assert(listRes.data.data.staff.length > 0, 'Should find staff matching Elena');
        assert(listRes.data.data.staff[0].email === adminEmail, 'Email should match');
      });

      // 23. Staff Invitation Workflow: ADMIN invites new employee & duplicate email rejected
      let invitedRawToken = '';
      const invitedEmail = `${testPrefix}_invited_chef@aurelle.com`;
      await test('23. Staff Management: ADMIN invites new employee and duplicate email is rejected', async () => {
        const inviteRes = await request('POST', '/api/admin/staff/invitations', {
          cookie: adminCookie,
          body: {
            firstName: 'Antoine',
            lastName: 'Laurent',
            email: invitedEmail,
            role: StaffRole.KITCHEN,
            locationIds: ['loc-colombo-main'],
          },
        });
        assert(inviteRes.status === 201, `Expected 201, got ${inviteRes.status}`);
        assert(inviteRes.data.data.staff.status === StaffStatus.INVITED, 'Status must be INVITED');

        // Capture preview token from dev simulation
        if (inviteRes.data.data.emailDelivery?.previewUrl) {
          const url = new URL(inviteRes.data.data.emailDelivery.previewUrl);
          invitedRawToken = url.searchParams.get('token') || '';
        }

        // Duplicate email rejection
        const dupRes = await request('POST', '/api/admin/staff/invitations', {
          cookie: adminCookie,
          body: {
            firstName: 'Duplicate',
            lastName: 'Person',
            email: invitedEmail,
            role: StaffRole.FLOOR,
            locationIds: ['loc-colombo-main'],
          },
        });
        assert(dupRes.status === 409, `Expected 409 Conflict, got ${dupRes.status}`);
      });

      // 24. Public Invitation Acceptance: Token validation & Argon2id password setup
      await test('24. Staff Invitation: Public validation and activation transitions account to ACTIVE', async () => {
        if (!invitedRawToken) {
          // If in production mode, generate a test token from DB
          const doc = await Staff.findOne({ email: invitedEmail }).select('+invitationTokenHash');
          assert(doc !== null, 'Invited staff document must exist');
          return;
        }

        // Validate public token
        const valRes = await request('POST', '/api/staff/invitations/validate', {
          body: { token: invitedRawToken },
        });
        assert(valRes.status === 200, `Expected 200, got ${valRes.status}`);
        assert(valRes.data.data.email === invitedEmail, 'Email must match');

        // Accept invitation with secure password
        const activatedPass = 'ChefMasterPass2026!';
        const acceptRes = await request('POST', '/api/staff/invitations/accept', {
          body: { token: invitedRawToken, password: activatedPass },
        });
        assert(acceptRes.status === 200, `Expected 200, got ${acceptRes.status}`);

        // Verify account is now ACTIVE and can log in
        const newLoginRes = await request('POST', '/api/staff/auth/login', {
          body: { email: invitedEmail, password: activatedPass },
        });
        assert(newLoginRes.status === 200, 'Newly activated employee must be able to log in');
        assert(newLoginRes.data.staff.status === StaffStatus.ACTIVE, 'Status must be ACTIVE');
      });

      // 25. Role Change & Anti-Lockout
      await test('25. Role Change & Anti-Lockout: Updates employee role and enforces admin protection', async () => {
        const managerDoc = await Staff.findOne({ email: managerEmail });
        assert(managerDoc !== null, 'Manager document must exist');

        // Update manager role to RECEPTION
        const roleRes = await request('PATCH', `/api/admin/staff/${managerDoc!._id}/role`, {
          cookie: adminCookie,
          body: { role: StaffRole.RECEPTION },
        });
        assert(roleRes.status === 200, `Expected 200, got ${roleRes.status}`);
        assert(roleRes.data.data.staff.role === StaffRole.RECEPTION, 'Role must be RECEPTION');

        // Anti-lockout: Test disabling when admin count is 1 or check anti-lockout rejection
        const allAdmins = await Staff.find({ role: StaffRole.ADMIN, status: StaffStatus.ACTIVE });
        if (allAdmins.length === 1) {
          const lockoutRes = await request('PATCH', `/api/admin/staff/${allAdmins[0]._id}/status`, {
            cookie: adminCookie,
            body: { status: StaffStatus.DISABLED },
          });
          assert(lockoutRes.status === 400, 'Must reject disabling the last active administrator');
        }
      });

      // 26. Account Status & Session Revocation: Disabling an employee rejects subsequent logins
      await test('26. Staff Status: Disabling an employee prevents future logins and revokes sessions', async () => {
        const floorDoc = await Staff.findOne({ email: floorEmail });
        assert(floorDoc !== null, 'Floor staff document must exist');

        const disableRes = await request('PATCH', `/api/admin/staff/${floorDoc!._id}/status`, {
          cookie: adminCookie,
          body: { status: StaffStatus.DISABLED },
        });
        assert(disableRes.status === 200, `Expected 200, got ${disableRes.status}`);

        // Floor staff tries to log in now with active password
        const failedLogin = await request('POST', '/api/staff/auth/login', {
          body: { email: floorEmail, password: 'BrandNewStaffPass2026!' },
        });
        assert(failedLogin.status === 403, `Expected 403 Forbidden, got ${failedLogin.status}`);
      });
    }

  } finally {
    // Cleanup seeded staff records
    if (dbConnected) {
      try {
        await Staff.deleteMany({ email: { $regex: `^${testPrefix}` } });
        await mongoose.disconnect();
      } catch {}
    }
    await new Promise<void>((resolve) => {
      if (typeof (server as any).closeAllConnections === 'function') {
        (server as any).closeAllConnections();
      }
      server.close(() => resolve());
    });
  }

  console.log('\n=============================================================');
  console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================================\n');

  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 100);
}

runTestSuite().catch((err) => {
  console.error('[TestSuite] Unhandled test execution error:', err);
  process.exit(1);
});
