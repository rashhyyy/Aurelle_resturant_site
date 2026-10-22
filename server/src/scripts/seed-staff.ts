import dns from 'dns';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { Staff } from '../models/staff.model';
import { StaffRole, StaffStatus } from '../types/staff';
import { hashPassword } from '../utils/password';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const DEMO_STAFF = [
  {
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@aurelle.com',
    password: 'Aurelle@Admin2026!',
    role: StaffRole.ADMIN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main', 'loc-kandy-vip'],
  },
  {
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'manager@aurelle.com',
    password: 'Manager@2026!',
    role: StaffRole.MANAGER,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  },
  {
    firstName: 'Kenji',
    lastName: 'Sato',
    email: 'kitchen@aurelle.com',
    password: 'Kitchen@2026!',
    role: StaffRole.KITCHEN,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  },
  {
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'reception@aurelle.com',
    password: 'Reception@2026!',
    role: StaffRole.RECEPTION,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  },
  {
    firstName: 'Nadia',
    lastName: 'Perera',
    email: 'floor@aurelle.com',
    password: 'Floor@2026!',
    role: StaffRole.FLOOR,
    status: StaffStatus.ACTIVE,
    locationIds: ['loc-colombo-main'],
  },
];

async function seedDemoStaff() {
  console.log('[Seed] Connecting to database...');
  await mongoose.connect(env.MONGODB_URI);

  for (const staffData of DEMO_STAFF) {
    const existing = await Staff.findOne({ email: staffData.email });
    const passwordHash = await hashPassword(staffData.password);

    if (existing) {
      existing.firstName = staffData.firstName;
      existing.lastName = staffData.lastName;
      existing.passwordHash = passwordHash;
      existing.role = staffData.role;
      existing.status = staffData.status;
      existing.locationIds = staffData.locationIds;
      await existing.save();
      console.log(`[Seed] Updated: ${staffData.email} (${staffData.role})`);
    } else {
      await Staff.create({
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        passwordHash,
        role: staffData.role,
        status: staffData.status,
        locationIds: staffData.locationIds,
      });
      console.log(`[Seed] Created: ${staffData.email} (${staffData.role})`);
    }
  }

  console.log('\n✅ All demo staff accounts are seeded and ready for testing!');
  await mongoose.disconnect();
  process.exit(0);
}

seedDemoStaff().catch((err) => {
  console.error('[Seed] Error seeding staff accounts:', err);
  process.exit(1);
});
