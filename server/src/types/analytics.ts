/**
 * Aurelle Restaurant Management Platform
 * Analytics, BI & Reporting Types (Stage 15)
 */

export type AnalyticsDatePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export interface IDateRangeFilter {
  startDate: Date;
  endDate: Date;
  preset: AnalyticsDatePreset;
}

export interface IRevenueMetrics {
  grossMinor: number;
  netMinor: number;
  taxMinor: number;
  serviceChargeMinor: number;
  currency: string;
}

export interface IOrderSummaryMetrics {
  total: number;
  completed: number;
  cancelled: number;
  active: number;
  completionRate: number; // e.g. 96.5%
  aovMinor: number;
}

export interface IReservationSummaryMetrics {
  total: number;
  confirmed: number;
  seated: number;
  completed: number;
  cancelled: number;
  noShow: number;
  noShowRate: number;
  cancellationRate: number;
  totalGuests: number;
}

export interface ITableSummaryMetrics {
  activeSessions: number;
  completedSessions: number;
  avgDwellMinutes: number;
  totalTables: number;
  utilizationRate: number;
}

export interface IVipEventSummaryMetrics {
  vipBookings: number;
  vipRevenueMinor: number;
  eventInquiries: number;
  eventProposals: number;
  eventBookings: number;
  eventConversionRate: number;
  eventRevenueMinor: number;
}

export interface IStaffSummaryMetrics {
  activeStaffCount: number;
  cleaningTasksCompleted: number;
  serviceRequestsResolved: number;
}

export interface IDailyTrendPoint {
  date: string; // YYYY-MM-DD
  revenueMinor: number;
  orderCount: number;
  reservationCount: number;
}

export interface IExecutiveOverview {
  dateRange: {
    start: string;
    end: string;
    preset: AnalyticsDatePreset;
  };
  locationId: string;
  revenue: IRevenueMetrics;
  orders: IOrderSummaryMetrics;
  reservations: IReservationSummaryMetrics;
  tables: ITableSummaryMetrics;
  vipEvents: IVipEventSummaryMetrics;
  staff: IStaffSummaryMetrics;
  trend: IDailyTrendPoint[];
}

export interface ISalesAnalytics {
  totalGrossMinor: number;
  totalNetMinor: number;
  totalTaxMinor: number;
  totalServiceChargeMinor: number;
  orderCount: number;
  averageOrderValueMinor: number;
  byOrderType: {
    orderType: string;
    count: number;
    revenueMinor: number;
    percentage: number;
  }[];
  byPaymentMethod: {
    paymentMethod: string;
    count: number;
    revenueMinor: number;
  }[];
  hourlyDistribution: {
    hour: number; // 0-23
    orderCount: number;
    revenueMinor: number;
  }[];
  dailyBreakdown: {
    date: string;
    grossMinor: number;
    netMinor: number;
    taxMinor: number;
    serviceChargeMinor: number;
    orders: number;
  }[];
}

export interface IOrderAnalytics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  completionRate: number;
  cancellationRate: number;
  averagePrepTimeMinutes: number;
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  byType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  peakHours: {
    hour: number;
    orders: number;
  }[];
}

export interface IMenuPerformanceItem {
  id: string;
  name: string;
  category: string;
  priceMinor: number;
  quantitySold: number;
  totalRevenueMinor: number;
  portionOfSales: number; // percentage
}

export interface IMenuAnalytics {
  totalDishesSold: number;
  totalMenuRevenueMinor: number;
  topSellingDishes: IMenuPerformanceItem[];
  leastSellingDishes: IMenuPerformanceItem[];
  categoryBreakdown: {
    category: string;
    dishesSold: number;
    revenueMinor: number;
    percentage: number;
  }[];
}

export interface IKitchenAnalytics {
  totalTickets: number;
  completedTickets: number;
  averagePrepMinutes: number;
  ordersUnder20Mins: number;
  orders20To40Mins: number;
  ordersOver40Mins: number;
  stationLoad: {
    type: string;
    count: number;
    avgMinutes: number;
  }[];
  hourlyThroughput: {
    hour: number;
    completed: number;
  }[];
}

export interface IReservationAnalytics {
  totalBookings: number;
  confirmedBookings: number;
  seatedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  cancellationRate: number;
  noShowRate: number;
  averagePartySize: number;
  partySizeDistribution: {
    bucket: string; // "1-2 guests", "3-4 guests", "5-6 guests", "7+ guests"
    count: number;
    percentage: number;
  }[];
  peakTimeSlots: {
    timeSlot: string; // "18:00", "19:00", etc.
    count: number;
  }[];
}

export interface ITableAnalytics {
  totalTables: number;
  totalDiningSessions: number;
  averageDwellMinutes: number;
  turnoverRatePerDay: number;
  peakHourOccupancy: {
    hour: number;
    occupiedTables: number;
  }[];
}

export interface IVipEventAnalytics {
  vipBookingsCount: number;
  vipRevenueMinor: number;
  averageVipBookingValueMinor: number;
  eventInquiriesCount: number;
  eventProposalsCount: number;
  eventBookingsConfirmed: number;
  eventConversionRate: number;
  eventRevenueMinor: number;
}

export interface IStaffAnalytics {
  totalStaffActive: number;
  byRole: {
    role: string;
    count: number;
  }[];
  cleaningTasks: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
  serviceRequests: {
    total: number;
    resolved: number;
    open: number;
    resolutionRate: number;
  };
}

export interface ICustomerAnalytics {
  totalUniqueCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  topSpenders: {
    customerName: string;
    customerEmail: string;
    orderCount: number;
    totalSpendMinor: number;
  }[];
}
