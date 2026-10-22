/**
 * Aurelle Restaurant Management Platform
 * Manager Subsystem Types & Operational Definitions (Stage 13)
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

export enum AlertSourceType {
  ORDER = 'ORDER',
  RESERVATION = 'RESERVATION',
  TABLE = 'TABLE',
  SERVICE_REQUEST = 'SERVICE_REQUEST',
  CLEANING_TASK = 'CLEANING_TASK',
  WAITING_LIST = 'WAITING_LIST',
  VIP_INQUIRY = 'VIP_INQUIRY',
  EVENT_PROPOSAL = 'EVENT_PROPOSAL',
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

export interface IOperationalAlertSafeJSON {
  id: string;
  locationId: string;
  alertType: AlertType;
  sourceType: AlertSourceType;
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

export interface ManagerOverviewMetrics {
  activeOrders: number;
  todayReservations: number;
  occupiedTables: number;
  checkedInGuests: number;
  pendingVipRequests: number;
  activeServiceIssues: number;
}

export interface ManagerOverviewData {
  locationId: string;
  locationName: string;
  serverTime: string;
  metrics: ManagerOverviewMetrics;
  criticalAlerts: IOperationalAlertSafeJSON[];
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

export enum ManagerOverrideAction {
  REASSIGN_SERVICE_REQUEST = 'REASSIGN_SERVICE_REQUEST',
  ESCALATE_ALERT = 'ESCALATE_ALERT',
  FORCE_CLEANING_COMPLETE = 'FORCE_CLEANING_COMPLETE',
  CANCEL_DELAYED_ORDER = 'CANCEL_DELAYED_ORDER',
  APPROVE_RESERVATION_EXCEPTION = 'APPROVE_RESERVATION_EXCEPTION',
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
