export interface MetricValue<T = number | null> {
  value: T;
  available: boolean;
  description: string;
  currency?: string;
  breakdown?: Record<string, number>;
}

export interface DashboardStatistics {
  todayOrders: MetricValue<number | null>;
  todayReservations: MetricValue<number | null>;
  todayRevenue: MetricValue<number | null>;
  occupiedTables: MetricValue<number | null>;
  ordersPreparing: MetricValue<number | null>;
  pendingRequests: MetricValue<number>;
}

export interface RecentOrderSummary {
  id: string;
  reference: string;
  orderType: 'Pickup' | 'Dine-In' | 'Pre-Order';
  orderTime: string;
  total: number;
  currency: string;
  status: 'Received' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
}

export interface UpcomingReservationSummary {
  id: string;
  reference: string;
  guestName: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  reservationType: 'Standard' | 'VIP Private Salon' | 'Chef Tasting' | 'Window Seating';
  status: 'Confirmed' | 'Seated' | 'Pending' | 'Cancelled';
}

export interface KitchenActivitySummary {
  newOrders: number | null;
  acceptedOrders: number | null;
  preparingOrders: number | null;
  readyOrders: number | null;
  connected: boolean;
  message: string;
}

export interface TableOccupancySummary {
  available: number | null;
  reserved: number | null;
  occupied: number | null;
  awaitingCleaning: number | null;
  unavailable: number | null;
  totalConfigured: number;
  connected: boolean;
  message: string;
}

export interface VipEventsSummary {
  upcomingVipBookings: Array<{
    id: string;
    roomName: string;
    guestName: string;
    time: string;
  }>;
  pendingEnquiries: number;
  confirmedEvents: number;
  connected: boolean;
  message: string;
}

export type AlertSeverity = 'Information' | 'Warning' | 'Critical';

export interface OperationalAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  timestamp: string;
  actionUrl?: string;
}

export interface AdminDashboardData {
  locationId: string;
  locationName: string;
  generatedAt: string;
  timezone: string;
  statistics: DashboardStatistics;
  recentOrders: RecentOrderSummary[];
  recentOrdersStatus: {
    connected: boolean;
    message: string;
  };
  upcomingReservations: UpcomingReservationSummary[];
  upcomingReservationsStatus: {
    connected: boolean;
    message: string;
  };
  kitchenActivity: KitchenActivitySummary;
  tableOccupancy: TableOccupancySummary;
  vipEvents: VipEventsSummary;
  alerts: OperationalAlert[];
  systemStatus: {
    databaseConnected: boolean;
    authSystem: string;
    socketRealtime: string;
    activeStaffCount: number;
  };
}
