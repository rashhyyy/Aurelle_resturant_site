/**
 * Aurelle Restaurant Management Platform
 * Client-Side Reservation Types (Stage 9)
 */

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  SEATED = 'SEATED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  REJECTED = 'REJECTED',
}

export enum ReservationSource {
  ONLINE_CUSTOMER = 'ONLINE_CUSTOMER',
  WALK_IN = 'WALK_IN',
  PHONE = 'PHONE',
  STAFF_PORTAL = 'STAFF_PORTAL',
}

export interface ClientReservation {
  id: string;
  reservationId: string;
  reservationReference: string;
  customerId?: string | null;
  locationId: string;
  locationName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  reservationDate: string;
  reservationTime: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  timezone: string;
  status: ReservationStatus;
  tableIds: string[];
  tableNumbers: string[];
  seatingPreference: string;
  specialRequests?: string;
  occasion?: string;
  source: ReservationSource;
  canModify: boolean;
  canCancel: boolean;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  seatedAt?: string | null;
  seatedBy?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  statusHistory: Array<{
    status: ReservationStatus;
    changedAt: string;
    actorType: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableTimeSlot {
  time: string;
  time24: string;
  available: boolean;
  remainingTables: number;
  reason?: string;
}

export interface AvailabilityResult {
  locationId: string;
  locationName: string;
  date: string;
  guestCount: number;
  timezone: string;
  slots: AvailableTimeSlot[];
  operatingHours: {
    lunch: { start: string; end: string; lastSeating: string };
    dinner: { start: string; end: string; lastSeating: string };
  };
  isFullyBooked: boolean;
}

export interface ReservationSummaryMetrics {
  todayTotal: number;
  upcomingTotal: number;
  pendingTotal: number;
  confirmedTotal: number;
  seatedTotal: number;
  cancelledTotal: number;
  completedTotal: number;
}
