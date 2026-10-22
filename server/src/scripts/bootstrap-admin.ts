import dns from 'dns';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { hashPassword } from '../utils/password';

// Ensure DNS resolvers work reliably across Windows environments for MongoDB Atlas SRV
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignored if custom resolvers cannot be bound
}

async function runBootstrap() {
  console.log('\n==================================================');
  console.log('  AURELLE — Initial Administrator Bootstrap Script');
  console.log('==================================================\n');

  try {
    console.log('[Bootstrap] Connecting to database...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('[Bootstrap] Database connection established.');

    // 1. Check if an administrator already exists
    const existingAdmin = await Staff.findOne({ role: StaffRole.ADMIN });
    if (existingAdmin) {
      console.log(`[Bootstrap] Notice: An administrator account already exists (${existingAdmin.email}).`);
      console.log('[Bootstrap] Exiting gracefully without making any modifications.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // 2. Parse command-line args or environment variables
    const args = process.argv.slice(2);
    const getArg = (flag: string): string | undefined => {
      const idx = args.indexOf(flag);
      return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
    };

    const email = (
      getArg('--email') ||
      process.env.BOOTSTRAP_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      'admin@aurelle.com'
    ).trim().toLowerCase();

    const password =
      getArg('--password') ||
      process.env.BOOTSTRAP_ADMIN_PASSWORD ||
      process.env.ADMIN_PASSWORD ||
      'Aurelle@Admin2026!';

    const firstName =
      getArg('--first-name') ||
      process.env.BOOTSTRAP_ADMIN_FIRST_NAME ||
      'System';

    const lastName =
      getArg('--last-name') ||
      process.env.BOOTSTRAP_ADMIN_LAST_NAME ||
      'Administrator';

    // 3. Validate password complexity (at least 8 chars)
    if (password.length < 8) {
      console.error('[Bootstrap] Error: Administrator password must be at least 8 characters long.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`[Bootstrap] Creating initial administrator: ${email}`);

    // 4. Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    // 5. Create administrator staff document
    const admin = new Staff({
      firstName,
      lastName,
      email,
      passwordHash,
      role: StaffRole.ADMIN,
      status: StaffStatus.ACTIVE,
      locationIds: ['default-location'],
    });

    await admin.save();

    console.log('\n✅ [Bootstrap] Administrator account created successfully:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Role:  ${StaffRole.ADMIN}`);
    console.log(`   - ID:    ${admin._id}`);
    console.log('   (Password was securely hashed with Argon2id and not printed)\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Bootstrap] Fatal error during administrator bootstrap:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

runBootstrap();
