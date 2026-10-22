/**
 * Aurelle Restaurant Management Platform
 * Floor Operations & Management Types (Stage 11)
 */

import { TableSection, TableStatus, ITableSafeJSON, ITableLayout } from './table';

export enum DiningSessionStatus {
  ACTIVE = 'ACTIVE',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  CLOSED = 'CLOSED',
}

export enum ServiceRequestType {
  WATER = 'WATER',
  CUTLERY = 'CUTLERY',
  BILL = 'BILL',
  ASSISTANCE = 'ASSISTANCE',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER',
}

export enum ServiceRequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ServiceRequestStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export enum CleaningTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum KitchenAlertStatus {
  NEW = 'NEW',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
}

export interface IDiningSessionSafeJSON {
  id: string;
  locationId: string;
  tableIds: string[];
  tableNumbers: string[];
  reservationId?: string | null;
  reservationReference?: string | null;
  guestName: string;
  guestCount: number;
  status: DiningSessionStatus;
  seatedAt: string;
  completedAt?: string | null;
  completedBy?: string | null;
  assignedStaffIds: string[];
  assignedStaffNames: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IServiceRequestSafeJSON {
  id: string;
  locationId: string;
  tableId: string;
  tableNumber: string;
  diningSessionId?: string | null;
  requestType: ServiceRequestType;
  description: string;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdBy: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICleaningTaskSafeJSON {
  id: string;
  locationId: string;
  tableId: string;
  tableNumber: string;
  priority: ServiceRequestPriority;
  status: CleaningTaskStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  notes?: string;
  startedAt?: string | null;
  startedBy?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IKitchenAlertSafeJSON {
  id: string;
  locationId: string;
  orderId: string;
  orderReference: string;
  tableId?: string | null;
  tableNumber?: string | null;
  diningSessionId?: string | null;
  itemsSummary: string;
  status: KitchenAlertStatus;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FloorOverviewMetrics {
  locationId: string;
  locationName: string;
  localDate: string;
  localTime: string;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  awaitingCleaningTables: number;
  activeServiceRequests: number;
  activeDiningSessions: number;
  kitchenReadyAlerts: number;
  totalTables: number;
  tableSummary: {
    available: number;
    occupied: number;
    reserved: number;
    awaitingCleaning: number;
    cleaning: number;
    unavailable: number;
    total: number;
  };
}

export interface FloorTableDetailItem extends ITableSafeJSON {
  activeSession?: IDiningSessionSafeJSON | null;
  currentReservation?: {
    reference: string;
    guestName: string;
    guestCount: number;
    status: string;
    time: string;
  } | null;
  upcomingReservations?: Array<{
    reference: string;
    guestName: string;
    guestCount: number;
    time: string;
    status: string;
  }>;
  relatedOrders?: Array<{
    orderId: string;
    orderReference: string;
    orderStatus: string;
    orderType: string;
    totalMinor: number;
    itemsSummary: string;
  }>;
  serviceRequests?: IServiceRequestSafeJSON[];
  cleaningTask?: ICleaningTaskSafeJSON | null;
  kitchenAlerts?: IKitchenAlertSafeJSON[];
}
