/**
 * Aurelle Restaurant Management Platform
 * Role-Based Access Control (RBAC) Foundation
 */

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CHEF = 'chef',
  RECEPTIONIST = 'receptionist',
  WAITSTAFF = 'waitstaff',
  CUSTOMER = 'customer',
}

export const STAFF_ROLES = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.CHEF,
  UserRole.RECEPTIONIST,
  UserRole.WAITSTAFF,
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export interface RolePermissions {
  canAccessAdminPortal: boolean;
  canAccessStaffPortal: boolean;
  canManageUsers: boolean;
  canManageMenu: boolean;
  canManageOrders: boolean;
  canManageReservations: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.ADMIN]: {
    canAccessAdminPortal: true,
    canAccessStaffPortal: true,
    canManageUsers: true,
    canManageMenu: true,
    canManageOrders: true,
    canManageReservations: true,
    canViewReports: true,
    canManageSettings: true,
  },
  [UserRole.MANAGER]: {
    canAccessAdminPortal: false,
    canAccessStaffPortal: true,
    canManageUsers: false,
    canManageMenu: true,
    canManageOrders: true,
    canManageReservations: true,
    canViewReports: true,
    canManageSettings: false,
  },
  [UserRole.CHEF]: {
    canAccessAdminPortal: false,
    canAccessStaffPortal: true,
    canManageUsers: false,
    canManageMenu: false,
    canManageOrders: true, // Kitchen displays
    canManageReservations: false,
    canViewReports: false,
    canManageSettings: false,
  },
  [UserRole.RECEPTIONIST]: {
    canAccessAdminPortal: false,
    canAccessStaffPortal: true,
    canManageUsers: false,
    canManageMenu: false,
    canManageOrders: false,
    canManageReservations: true, // Bookings & VIP rooms
    canViewReports: false,
    canManageSettings: false,
  },
  [UserRole.WAITSTAFF]: {
    canAccessAdminPortal: false,
    canAccessStaffPortal: true,
    canManageUsers: false,
    canManageMenu: false,
    canManageOrders: true, // Table orders & floor operations
    canManageReservations: false,
    canViewReports: false,
    canManageSettings: false,
  },
  [UserRole.CUSTOMER]: {
    canAccessAdminPortal: false,
    canAccessStaffPortal: false,
    canManageUsers: false,
    canManageMenu: false,
    canManageOrders: false,
    canManageReservations: false,
    canViewReports: false,
    canManageSettings: false,
  },
};
