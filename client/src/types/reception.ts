import { ClientReservation, ReservationStatus } from './reservation';

export interface ReceptionOverviewMetrics {
  locationId: string;
  locationName: string;
  localDate: string;
  localTime: string;
  todayReservations: number;
  expectedArrivals: number;
  checkedInGuests: number;
  seatedGuests: number;
  waitingParties: number;
  noShowCount: number;
  tableSummary: {
    available: number;
    reserved: number;
    occupied: number;
    cleaning: number;
    unavailable: number;
    total: number;
  };
}

export type ArrivalStatus = 'UPCOMING' | 'DUE_NOW' | 'LATE' | 'CHECKED_IN' | 'SEATED' | 'NO_SHOW' | 'CANCELLED';

export interface ReceptionReservationItem extends ClientReservation {
  arrivalStatus: ArrivalStatus;
  assignedTableName?: string;
  minutesUntilArrival: number;
}

export interface TableAvailabilityItem {
  id: string;
  tableNumber: string;
  name: string;
  capacity: number;
  minPartySize: number;
  section: string;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CLEANING' | 'UNAVAILABLE';
  currentOccupant?: {
    reservationReference: string;
    guestName: string;
    guestCount: number;
    status: ReservationStatus;
    seatedAt?: string;
  } | null;
  nextReservation?: {
    reservationReference: string;
    guestName: string;
    guestCount: number;
    startAt: string;
  } | null;
}

export enum WaitingListStatus {
  WAITING = 'WAITING',
  NOTIFIED = 'NOTIFIED',
  SEATED = 'SEATED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface WaitingListItem {
  id: string;
  locationId: string;
  locationName: string;
  guestName: string;
  guestCount: number;
  guestPhone: string;
  guestEmail?: string | null;
  seatingPreference?: string;
  notes?: string;
  status: WaitingListStatus;
  arrivedAt: string;
  notifiedAt?: string | null;
  seatedAt?: string | null;
  cancelledAt?: string | null;
  reservationId?: string | null;
  tableId?: string | null;
  tableNumber?: string | null;
  waitDurationMinutes: number;
  estimatedWaitMinutes?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
