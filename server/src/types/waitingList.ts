/**
 * Aurelle Restaurant Management Platform
 * Waiting List Subsystem Types & Rules (Stage 10)
 */

export enum WaitingListStatus {
  WAITING = 'WAITING',
  NOTIFIED = 'NOTIFIED',
  SEATED = 'SEATED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface IWaitingList {
  locationId: string;
  guestName: string;
  guestCount: number;
  guestPhone: string;
  guestEmail?: string | null;
  seatingPreference?: string;
  notes?: string;
  status: WaitingListStatus;
  arrivedAt: Date;
  notifiedAt?: Date | null;
  seatedAt?: Date | null;
  cancelledAt?: Date | null;
  reservationId?: string | null;
  tableId?: string | null;
  tableNumber?: string | null;
  estimatedWaitMinutes?: number;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWaitingListSafeJSON {
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
