/**
 * Architecture Registry of Aurelle Platform Modules
 *
 * Each business domain in the Aurelle restaurant management platform follows
 * a uniform layered architecture pattern:
 * - routes: Express route definitions and RBAC middleware attachments
 * - controllers: HTTP request handling and response serialization
 * - services: Core business rules, database queries, and notifications
 * - models: Mongoose schema definitions and validation
 * - validation: Zod request validation schemas
 */

export interface ModuleMetadata {
  id: string;
  name: string;
  description: string;
  status: 'foundation' | 'in_development' | 'active';
  targetRoles: string[];
}

export const PLATFORM_MODULES: Record<string, ModuleMetadata> = {
  auth: {
    id: 'auth',
    name: 'Authentication & Session Management',
    description: 'Secure session management, Argon2id password hashing, and user credential verification',
    status: 'foundation',
    targetRoles: ['admin', 'manager', 'chef', 'receptionist', 'waitstaff', 'customer'],
  },
  customers: {
    id: 'customers',
    name: 'Customer Account Management',
    description: 'Guest profiles, dietary restrictions, dining preferences, and order history',
    status: 'foundation',
    targetRoles: ['customer', 'receptionist', 'manager', 'admin'],
  },
  employees: {
    id: 'employees',
    name: 'Employee & Staff Management',
    description: 'Staff directory, role assignments, shift scheduling, and credentials',
    status: 'foundation',
    targetRoles: ['admin', 'manager'],
  },
  menu: {
    id: 'menu',
    name: 'Menu & Recipe Management',
    description: 'Dishes, multi-cuisine categories, pricing, seasonal availability, allergens',
    status: 'foundation',
    targetRoles: ['admin', 'manager', 'chef'],
  },
  orders: {
    id: 'orders',
    name: 'Food Ordering & Kitchen Display System',
    description: 'Dine-in, takeaway, and delivery orders, kitchen ticketing, and real-time state tracking',
    status: 'foundation',
    targetRoles: ['customer', 'waitstaff', 'chef', 'manager', 'admin'],
  },
  reservations: {
    id: 'reservations',
    name: 'Table Reservation System',
    description: 'Dining reservations, party sizes, time slot management, and seating allocations',
    status: 'active',
    targetRoles: ['customer', 'receptionist', 'manager', 'admin'],
  },
  reception: {
    id: 'reception',
    name: 'Reception & Foyer Management System',
    description: 'Guest check-in, live table availability, seating dispatch, walk-in registration, and waitlist management',
    status: 'active',
    targetRoles: ['receptionist', 'manager', 'admin'],
  },
  tables: {
    id: 'tables',
    name: 'Floor Plan & Table Management',
    description: 'Restaurant layout, table statuses (available, occupied, reserved, cleaning), and server assignments',
    status: 'active',
    targetRoles: ['receptionist', 'waitstaff', 'manager', 'admin'],
  },
  floor: {
    id: 'floor',
    name: 'Floor Operations & Interactive Floor Plan',
    description: 'Real-time dining session tracking, table turnover, service requests, kitchen alerts, and cleaning management',
    status: 'active',
    targetRoles: ['waitstaff', 'floor', 'manager', 'admin'],
  },
  'vip-rooms': {
    id: 'vip-rooms',
    name: 'VIP Dining & Private Rooms',
    description: 'Exclusive salon suites (The Ivory Room, The Garden Salon, Chef\'s Table, The Cellar Vault), private dining packages and amenities',
    status: 'active',
    targetRoles: ['customer', 'receptionist', 'manager', 'admin'],
  },
  events: {
    id: 'events',
    name: 'Private Events & Banquets',
    description: 'Corporate banquets, celebrations, custom event inquiries, proposals, and confirmed event bookings',
    status: 'active',
    targetRoles: ['customer', 'receptionist', 'manager', 'admin'],
  },
  notifications: {
    id: 'notifications',
    name: 'Real-Time Notification Engine',
    description: 'Push alerts, order updates, booking confirmations via Socket.IO and SMS/Email',
    status: 'active',
    targetRoles: ['admin', 'manager', 'chef', 'receptionist', 'waitstaff', 'customer'],
  },
  reports: {
    id: 'reports',
    name: 'Analytics, Reporting & Sales Audits',
    description: 'Revenue reports, peak dining hours, inventory tracking, and guest satisfaction metrics',
    status: 'active',
    targetRoles: ['admin', 'manager'],
  },
  settings: {
    id: 'settings',
    name: 'Restaurant Settings & Policies',
    description: 'Operating hours, service charges, tax rates, and booking lead-time configurations',
    status: 'active',
    targetRoles: ['admin', 'manager'],
  },
  'audit-logs': {
    id: 'audit-logs',
    name: 'Security & Audit Logging',
    description: 'Immutable record of staff actions, administrative changes, and security events',
    status: 'active',
    targetRoles: ['admin'],
  },
};
