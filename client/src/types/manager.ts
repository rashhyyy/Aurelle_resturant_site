/**
 * Aurelle Restaurant Management Platform
 * Client Manager Subsystem Types (Stage 13)
 */

export enum AlertType {
  ORDER_DELAYED = 'ORDER_DELAYED',
  ORDER_HANDOFF_OVERDUE = 'ORDER_HANDOFF_OVERDUE',
  WAITING_EXCEEDED = 'WAITING_EXCEEDED',
  TABLE_CLEANING_OVERDUE = 'TABLE_CLEANING_OVERDUE',
  SERVICE_REQUEST_PENDING = 'SERVICE_REQUEST_PENDING',
  VIP_INQUIRY_PENDING = 'VIP_INQUIRY_PENDING',
  EVENT_PROPOSAL_EXPIRING = 'EVENT_PROPOSAL_EXPIRING',
  CAPACITY_WARNING = 'CAPACITY_WARNING',
  RESERVATION_OVERBOOKING_RISK = 'RESERVATION_OVERBOOKING_RISK',
  OTHER = 'OTHER',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
}

export interface IOperationalAlert {
  id: string;
  locationId: string;
  alertType: AlertType;
  sourceType: string;
  sourceId: string;
  sourceReference?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  metadata?: Record<string, any>;
  acknowledgedAt?: string | null;
  acknowledgedBy?: {
    id: string;
    name: string;
  } | null;
  resolvedAt?: string | null;
  resolvedBy?: {
    id: string;
    name: string;
  } | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerOverviewData {
  locationId: string;
  locationName: string;
  serverTime: string;
  metrics: {
    activeOrders: number;
    todayReservations: number;
    occupiedTables: number;
    checkedInGuests: number;
    pendingVipRequests: number;
    activeServiceIssues: number;
  };
  criticalAlerts: IOperationalAlert[];
  activeOrdersPreview: Array<{
    id: string;
    orderReference: string;
    orderType: string;
    orderStatus: string;
    totalMinor: number;
    currency: string;
    createdAt: string;
    itemsCount: number;
  }>;
  floorOccupancy: {
    totalTables: number;
    occupiedCount: number;
    availableCount: number;
    reservedCount: number;
    cleaningCount: number;
    occupancyRatePercent: number;
  };
  receptionStatus: {
    expectedArrivals: number;
    checkedInCount: number;
    seatedCount: number;
    waitingCount: number;
    noShowCount: number;
  };
}

export interface ManagerReportData {
  locationId: string;
  locationName: string;
  dateRange: 'today' | 'yesterday' | '7days' | 'custom';
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  generatedBy: {
    id: string;
    name: string;
    role: string;
  };
  metrics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenueMinor: number;
    currency: string;
    averagePrepTimeMinutes: number;
    totalReservations: number;
    completedDiningSessions: number;
    noShows: number;
    tableTurnoverTimeMinutes: number;
    vipBookings: number;
    eventInquiries: number;
    serviceRequestsResolved: number;
    alertsTriggered: number;
    alertsResolved: number;
  };
  dailyBreakdown: Array<{
    date: string;
    orders: number;
    revenueMinor: number;
    reservations: number;
    diningSessions: number;
  }>;
}
