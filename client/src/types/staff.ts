export enum StaffRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  KITCHEN = 'KITCHEN',
  RECEPTION = 'RECEPTION',
  FLOOR = 'FLOOR',
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  DISABLED = 'DISABLED',
}

export interface SafeStaff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  locationIds: string[];
  phone?: string;
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
  invitationExpiresAt?: string | null;
  invitationSentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const ROLE_DASHBOARDS: Record<StaffRole, string> = {
  [StaffRole.ADMIN]: '/staff/admin',
  [StaffRole.MANAGER]: '/staff/manager',
  [StaffRole.KITCHEN]: '/staff/kitchen',
  [StaffRole.RECEPTION]: '/staff/reception',
  [StaffRole.FLOOR]: '/staff/floor',
};

export const ROLE_LABELS: Record<StaffRole, { title: string; subtitle: string }> = {
  [StaffRole.ADMIN]: {
    title: 'Administrator',
    subtitle: 'Full System Control & Governance',
  },
  [StaffRole.MANAGER]: {
    title: 'Operations Manager',
    subtitle: 'Daily Restaurant Floor & Performance Management',
  },
  [StaffRole.KITCHEN]: {
    title: 'Kitchen Executive / Chef',
    subtitle: 'Live Preparation Queue & Ticket Workflow',
  },
  [StaffRole.RECEPTION]: {
    title: 'Maitre D’ / Receptionist',
    subtitle: 'Guest Arrivals, Reservations & Table Allocations',
  },
  [StaffRole.FLOOR]: {
    title: 'Floor Captain & Waitstaff',
    subtitle: 'Dining Room Tables & Guest Service Execution',
  },
};
