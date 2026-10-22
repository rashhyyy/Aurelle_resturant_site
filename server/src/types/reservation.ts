/**
 * Aurelle Restaurant Management Platform
 * Reservation Subsystem Types & Rules (Stage 9)
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

export enum SeatingPreference {
  NO_PREFERENCE = 'No preference',
  MAIN_DINING = 'Main Dining Room',
  CHEFS_COUNTER = "Counter / Chef's View",
  OUTDOOR_TERRACE = 'Outdoor Terrace',
  PRIVATE_DINING = 'Private Dining',
}

/**
 * State Transition Matrix for Reservation Lifecycle
 */
export const ALLOWED_RESERVATION_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [
    ReservationStatus.CONFIRMED,
    ReservationStatus.CANCELLED,
    ReservationStatus.REJECTED,
  ],
  [ReservationStatus.CONFIRMED]: [
    ReservationStatus.CHECKED_IN,
    ReservationStatus.CANCELLED,
    ReservationStatus.NO_SHOW,
  ],
  [ReservationStatus.CHECKED_IN]: [
    ReservationStatus.SEATED,
    ReservationStatus.CANCELLED,
  ],
  [ReservationStatus.SEATED]: [
    ReservationStatus.COMPLETED,
  ],
  [ReservationStatus.COMPLETED]: [],
  [ReservationStatus.CANCELLED]: [],
  [ReservationStatus.NO_SHOW]: [],
  [ReservationStatus.REJECTED]: [],
};

/**
 * Authoritative Restaurant Reservation Rules & Policy Configuration
 */
export const RESERVATION_CONFIG = {
  timezone: 'Asia/Colombo',
  defaultDurationMinutes: 90,
  largePartyDurationMinutes: 120,
  largePartyThreshold: 5,
  turnoverBufferMinutes: 15,
  minLeadHours: 1, // Minimum lead time to book a table
  maxAdvanceDays: 30, // Maximum days in advance a guest can book
  minPartySize: 1,
  maxPartySize: 12,
  cancellationCutoffHours: 2, // Cutoff before reservation start time to cancel
  noShowGracePeriodMinutes: 15, // Threshold after start time before marking no-show
  operatingHours: {
    lunch: { start: '12:00', end: '15:30', lastSeating: '14:00' },
    dinner: { start: '17:30', end: '23:00', lastSeating: '21:30' },
  },
  standardTimeSlots: [
    '12:00 PM',
    '12:30 PM',
    '1:00 PM',
    '1:30 PM',
    '2:00 PM',
    '5:30 PM',
    '6:00 PM',
    '6:30 PM',
    '7:00 PM',
    '7:30 PM',
    '8:00 PM',
    '8:15 PM',
    '8:30 PM',
    '9:00 PM',
    '9:30 PM',
  ],
  defaultLocationId: 'loc-colombo-main',
};

export interface IReservationStatusHistory {
  status: ReservationStatus;
  changedAt: Date;
  actorType: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
  actorId?: string;
  note?: string;
}

export interface IReservation {
  reservationReference: string;
  customerId?: string | null;
  locationId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  reservationDate: Date;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  timezone: string;
  status: ReservationStatus;
  tableIds: string[];
  tableNumbers: string[];
  seatingPreference: string;
  specialRequests?: string;
  occasion?: string;
  source: ReservationSource;
  idempotencyKey?: string | null;
  confirmedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  checkedInAt?: Date | null;
  checkedInBy?: string | null;
  seatedAt?: Date | null;
  seatedBy?: string | null;
  completedAt?: Date | null;
  statusHistory: IReservationStatusHistory[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReservationSafeJSON {
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

export interface ReservationSummaryMetrics {
  todayTotal: number;
  upcomingTotal: number;
  pendingTotal: number;
  confirmedTotal: number;
  seatedTotal: number;
  cancelledTotal: number;
  completedTotal: number;
}

export interface AvailableTimeSlot {
  time: string; // e.g. "7:30 PM"
  time24: string; // e.g. "19:30"
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
  operatingHours: typeof RESERVATION_CONFIG.operatingHours;
  isFullyBooked: boolean;
}
