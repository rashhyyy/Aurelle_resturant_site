/**
 * Aurelle Restaurant Management Platform
 * Staff Roles, Statuses, and Permissions (Stage 2)
 */

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

export type StaffPermission =
  | 'staff.manage'
  | 'menu.manage'
  | 'orders.view'
  | 'orders.manage'
  | 'kitchen.orders.manage'
  | 'reservations.manage'
  | 'reception.checkin'
  | 'floor.tables.manage'
  | 'floor.tasks.manage'
  | 'floor.orders.handoff'
  | 'floor.layout.manage'
  | 'reports.view'
  | 'settings.manage'
  | 'vip.rooms.manage'
  | 'vip.bookings.manage'
  | 'events.inquiries.manage'
  | 'events.proposals.manage'
  | 'manager.dashboard.view'
  | 'manager.orders.view'
  | 'manager.kitchen.view'
  | 'manager.reservations.view'
  | 'manager.reception.view'
  | 'manager.floor.view'
  | 'manager.vip.view'
  | 'manager.staff.view'
  | 'manager.alerts.view'
  | 'manager.alerts.manage'
  | 'manager.reports.view'
  | 'manager.operations.override'
  | 'manager.activity.view';

/**
 * Explicit Least-Privilege Permission Matrix for Aurelle Staff Roles
 */
export const STAFF_PERMISSIONS: Record<StaffRole, StaffPermission[]> = {
  [StaffRole.ADMIN]: [
    'staff.manage',
    'menu.manage',
    'orders.view',
    'orders.manage',
    'kitchen.orders.manage',
    'reservations.manage',
    'reception.checkin',
    'floor.tables.manage',
    'floor.tasks.manage',
    'floor.orders.handoff',
    'floor.layout.manage',
    'reports.view',
    'settings.manage',
    'vip.rooms.manage',
    'vip.bookings.manage',
    'events.inquiries.manage',
    'events.proposals.manage',
    'manager.dashboard.view',
    'manager.orders.view',
    'manager.kitchen.view',
    'manager.reservations.view',
    'manager.reception.view',
    'manager.floor.view',
    'manager.vip.view',
    'manager.staff.view',
    'manager.alerts.view',
    'manager.alerts.manage',
    'manager.reports.view',
    'manager.operations.override',
    'manager.activity.view',
  ],
  [StaffRole.MANAGER]: [
    'menu.manage',
    'orders.view',
    'orders.manage',
    'reservations.manage',
    'reception.checkin',
    'floor.tables.manage',
    'floor.tasks.manage',
    'floor.orders.handoff',
    'floor.layout.manage',
    'reports.view',
    'vip.bookings.manage',
    'events.inquiries.manage',
    'events.proposals.manage',
    'manager.dashboard.view',
    'manager.orders.view',
    'manager.kitchen.view',
    'manager.reservations.view',
    'manager.reception.view',
    'manager.floor.view',
    'manager.vip.view',
    'manager.staff.view',
    'manager.alerts.view',
    'manager.alerts.manage',
    'manager.reports.view',
    'manager.operations.override',
    'manager.activity.view',
  ],
  [StaffRole.KITCHEN]: [
    'orders.view',
    'orders.manage',
    'kitchen.orders.manage',
  ],
  [StaffRole.RECEPTION]: [
    'orders.view',
    'reservations.manage',
    'reception.checkin',
    'floor.tables.manage',
    'vip.bookings.manage',
  ],
  [StaffRole.FLOOR]: [
    'orders.view',
    'orders.manage',
    'floor.tables.manage',
    'floor.tasks.manage',
    'floor.orders.handoff',
  ],
};

export type StaffAuditAction =
  | 'STAFF_INVITED'
  | 'INVITATION_RESENT'
  | 'INVITATION_REVOKED'
  | 'INVITATION_ACCEPTED'
  | 'ROLE_CHANGED'
  | 'LOCATIONS_CHANGED'
  | 'ACCOUNT_DISABLED'
  | 'ACCOUNT_ENABLED'
  | 'PASSWORD_RESET_INITIATED'
  | 'PROFILE_UPDATED'
  | 'MENU_ITEM_CREATED'
  | 'MENU_ITEM_UPDATED'
  | 'PRICE_CHANGED'
  | 'AVAILABILITY_CHANGED'
  | 'MENU_ITEM_PUBLISHED'
  | 'MENU_ITEM_UNPUBLISHED'
  | 'MENU_ITEM_ARCHIVED'
  | 'MENU_ITEM_DUPLICATED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_UPDATED'
  | 'CATEGORY_ARCHIVED'
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'ORDER_STATUS_CHANGED'
  | 'KITCHEN_ORDER_ACCEPTED'
  | 'ORDER_PREPARATION_STARTED'
  | 'ORDER_READY'
  | 'ORDER_COMPLETED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_MODIFIED'
  | 'RESERVATION_CANCELLED'
  | 'RESERVATION_REJECTED'
  | 'GUEST_CHECKED_IN'
  | 'TABLE_ASSIGNED'
  | 'GUEST_SEATED'
  | 'WALK_IN_REGISTERED'
  | 'WAITING_ENTRY_CREATED'
  | 'WAITING_ENTRY_SEATED'
  | 'WAITING_ENTRY_CANCELLED'
  | 'RESERVATION_MARKED_NOSHOW'
  | 'FLOOR_ASSIGNMENT_CHANGED'
  | 'DINING_SESSION_CREATED'
  | 'DINING_SESSION_CLOSED'
  | 'TABLE_STATUS_CHANGED'
  | 'SERVICE_REQUEST_CREATED'
  | 'SERVICE_REQUEST_UPDATED'
  | 'SERVICE_REQUEST_RESOLVED'
  | 'KITCHEN_ALERT_ACKNOWLEDGED'
  | 'FOOD_HANDOFF_COMPLETED'
  | 'CLEANING_TASK_CREATED'
  | 'CLEANING_STARTED'
  | 'CLEANING_COMPLETED'
  | 'FLOOR_LAYOUT_MODIFIED'
  | 'VIP_ROOM_CREATED'
  | 'VIP_ROOM_MODIFIED'
  | 'VIP_ROOM_ARCHIVED'
  | 'VIP_BOOKING_CREATED'
  | 'VIP_BOOKING_MODIFIED'
  | 'VIP_BOOKING_CANCELLED'
  | 'VIP_GUEST_CHECKED_IN'
  | 'EVENT_INQUIRY_CREATED'
  | 'EVENT_INQUIRY_UPDATED'
  | 'EVENT_PROPOSAL_CREATED'
  | 'EVENT_PROPOSAL_ACCEPTED'
  | 'EVENT_PROPOSAL_DECLINED'
  | 'EVENT_BOOKING_CONFIRMED'
  | 'OPERATIONAL_ALERT_ACKNOWLEDGED'
  | 'OPERATIONAL_ALERT_RESOLVED'
  | 'MANAGER_OVERRIDE_EXECUTED'
  | 'OPERATIONAL_REPORT_EXPORTED'
  | 'SERVICE_TASK_REASSIGNED'
  | 'TABLE_CLEANING_FORCED'
  | 'SETTINGS_UPDATED'
  | 'SETTINGS_RESET'
  | 'ANALYTICS_REPORT_EXPORTED';

export interface SafeStaff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: StaffRole;
  status: StaffStatus;
  locationIds: string[];
  lastLoginAt?: Date | null;
  invitationExpiresAt?: Date | null;
  invitationSentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
