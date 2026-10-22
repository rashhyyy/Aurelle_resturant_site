import { StaffRole } from '../types/staff';

export interface NavItem {
  label: string;
  href: string;
  iconName: string;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const ROLE_NAVIGATION: Record<StaffRole, NavSection[]> = {
  [StaffRole.ADMIN]: [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/staff/admin', iconName: 'LayoutDashboard' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Orders', href: '/staff/admin/orders', iconName: 'ShoppingBag' },
        { label: 'Reservations', href: '/staff/admin/reservations', iconName: 'Calendar' },
        { label: 'Tables & Floor Plan', href: '/staff/admin/tables', iconName: 'Armchair' },
        { label: 'Floor Layout Editor', href: '/staff/admin/floor-layout', iconName: 'Grid' },
        { label: 'Kitchen Overview', href: '/staff/admin/kitchen', iconName: 'ChefHat' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Menu Management', href: '/staff/admin/menu', iconName: 'UtensilsCrossed' },
        { label: 'VIP Rooms', href: '/staff/admin/vip-rooms', iconName: 'Sparkles' },
        { label: 'Events', href: '/staff/admin/events', iconName: 'GlassWater' },
        { label: 'Customers', href: '/staff/admin/customers', iconName: 'Users' },
        { label: 'Staff Management', href: '/staff/admin/staff', iconName: 'UserCheck' },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { label: 'Executive Analytics', href: '/staff/admin/analytics', iconName: 'BarChart3' },
        { label: 'Export Reports', href: '/staff/admin/reports', iconName: 'FileSpreadsheet' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Notifications', href: '/staff/notifications', iconName: 'Bell' },
        { label: 'Delivery Tracking', href: '/staff/admin/notifications', iconName: 'Send' },
        { label: 'Settings', href: '/staff/admin/settings', iconName: 'Settings' },
      ],
    },
  ],

  [StaffRole.MANAGER]: [
    {
      title: 'OPERATIONS MONITORING',
      items: [
        { label: 'Overview', href: '/staff/manager', iconName: 'LayoutDashboard' },
        { label: 'Orders', href: '/staff/manager/orders', iconName: 'ShoppingBag' },
        { label: 'Kitchen', href: '/staff/manager/kitchen', iconName: 'ChefHat' },
        { label: 'Reservations', href: '/staff/manager/reservations', iconName: 'Calendar' },
        { label: 'Reception', href: '/staff/manager/reception', iconName: 'UserCheck' },
        { label: 'Floor Operations', href: '/staff/manager/floor', iconName: 'Armchair' },
        { label: 'VIP & Events', href: '/staff/manager/vip-events', iconName: 'Sparkles' },
      ],
    },
    {
      title: 'MANAGEMENT & GOVERNANCE',
      items: [
        { label: 'Staff Operations', href: '/staff/manager/staff', iconName: 'Users' },
        { label: 'Operational Alerts', href: '/staff/manager/alerts', iconName: 'AlertTriangle' },
        { label: 'Daily Reports', href: '/staff/manager/reports', iconName: 'TrendingUp' },
        { label: 'Activity History', href: '/staff/manager/activity', iconName: 'History' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Notifications', href: '/staff/notifications', iconName: 'Bell' },
        { label: 'My Profile', href: '/staff/profile', iconName: 'User' },
      ],
    },
  ],

  [StaffRole.KITCHEN]: [
    {
      title: 'KITCHEN WORKFLOW',
      items: [
        { label: 'Kitchen Display', href: '/staff/kitchen', iconName: 'ChefHat' },
        { label: 'New Orders', href: '/staff/kitchen/new-orders', iconName: 'Clock' },
        { label: 'Preparing', href: '/staff/kitchen/preparing', iconName: 'Flame' },
        { label: 'Ready Orders', href: '/staff/kitchen/ready', iconName: 'CheckCircle2' },
        { label: 'Scheduled Orders', href: '/staff/kitchen/scheduled', iconName: 'Calendar' },
        { label: 'Order History', href: '/staff/kitchen/history', iconName: 'History' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Notifications', href: '/staff/notifications', iconName: 'Bell' },
        { label: 'My Profile', href: '/staff/profile', iconName: 'User' },
      ],
    },
  ],

  [StaffRole.RECEPTION]: [
    {
      title: 'GUEST ARRIVALS',
      items: [
        { label: 'Dashboard', href: '/staff/reception', iconName: 'LayoutDashboard' },
        { label: "Today's Reservations", href: '/staff/reception/reservations', iconName: 'Calendar' },
        { label: 'VIP Arrivals', href: '/staff/reception/vip', iconName: 'Sparkles' },
        { label: 'Guest Check-In', href: '/staff/reception/check-in', iconName: 'UserCheck' },
        { label: 'Table Availability', href: '/staff/reception/tables', iconName: 'Armchair' },
        { label: 'Walk-In Guests', href: '/staff/reception/walk-ins', iconName: 'Users' },
        { label: 'Waiting List', href: '/staff/reception/waiting-list', iconName: 'Clock' },
        { label: 'Booking History', href: '/staff/reception/history', iconName: 'History' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Notifications', href: '/staff/notifications', iconName: 'Bell' },
        { label: 'My Profile', href: '/staff/profile', iconName: 'User' },
      ],
    },
  ],

  [StaffRole.FLOOR]: [
    {
      title: 'DINING FLOOR SERVICE',
      items: [
        { label: 'Dashboard', href: '/staff/floor', iconName: 'LayoutDashboard' },
        { label: 'Floor Plan', href: '/staff/floor/floor-plan', iconName: 'MapPin' },
        { label: 'My Tables', href: '/staff/floor/my-tables', iconName: 'Armchair' },
        { label: 'Active Service', href: '/staff/floor/active-service', iconName: 'Users' },
        { label: 'Service Requests', href: '/staff/floor/service-requests', iconName: 'BellRing' },
        { label: 'Kitchen Alerts', href: '/staff/floor/kitchen-alerts', iconName: 'Flame' },
        { label: 'Cleaning Tasks', href: '/staff/floor/cleaning', iconName: 'Sparkles' },
        { label: 'Activity History', href: '/staff/floor/history', iconName: 'History' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Notifications', href: '/staff/notifications', iconName: 'Bell' },
        { label: 'My Profile', href: '/staff/profile', iconName: 'User' },
      ],
    },
  ],
};
