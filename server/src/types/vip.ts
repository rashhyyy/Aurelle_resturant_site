/**
 * Aurelle Restaurant Management Platform
 * VIP Rooms & Private Events Management Types (Stage 12)
 */

export enum VIPBookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  NO_SHOW = 'NO_SHOW',
}

export enum EventInquiryStatus {
  NEW = 'NEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
}

export enum EventProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum EventBookingStatus {
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  DEPOSIT_PAID = 'DEPOSIT_PAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export interface IVIPRoomAmenity {
  label: string;
  detail: string;
}

export interface IVIPRoomSafeJSON {
  id: string;
  locationId: string;
  name: string;
  slug: string;
  tag?: string;
  subtitle?: string;
  description: string;
  shortDescription?: string;
  capacityMin: number;
  capacityMax: number;
  squareMeters?: string;
  images: string[];
  amenities: IVIPRoomAmenity[];
  features: string[];
  categories: string[];
  basePriceMinor: number;
  currency: string;
  minimumSpendMinor: number;
  bookingDurationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPrivateDiningPackageSafeJSON {
  id: string;
  locationId: string;
  roomId?: string | null;
  name: string;
  description: string;
  includedServices: string[];
  includedMenuItems: string[];
  priceMinor: number;
  currency: string;
  minimumGuests: number;
  maximumGuests: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IVIPBookingSafeJSON {
  id: string;
  bookingReference: string;
  customerId?: string | null;
  locationId: string;
  roomId: string;
  roomName?: string;
  roomSlug?: string;
  guestCount: number;
  startAt: string;
  endAt: string;
  timezone: string;
  status: VIPBookingStatus;
  packageId?: string | null;
  packageName?: string | null;
  packageSnapshot?: {
    name: string;
    priceMinor: number;
    currency: string;
    description?: string;
  } | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  occasion?: string;
  quotedPriceMinor: number;
  currency: string;
  paymentStatus: PaymentStatus;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IEventInquirySafeJSON {
  id: string;
  inquiryReference: string;
  customerId?: string | null;
  locationId: string;
  eventType: string;
  preferredDate: string;
  preferredTime: string;
  guestCount: number;
  preferredRoomId?: string | null;
  preferredRoomName?: string | null;
  requirements: string;
  budgetMinor?: number | null;
  currency: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: EventInquiryStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  activeProposalId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IEventProposalSafeJSON {
  id: string;
  inquiryId: string;
  proposalVersion: number;
  locationId: string;
  roomId: string;
  roomName?: string;
  startAt: string;
  endAt: string;
  guestCount: number;
  packageSnapshot?: {
    name: string;
    priceMinor: number;
    currency: string;
  } | null;
  servicesSnapshot: string[];
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
  terms: string;
  expiresAt: string;
  status: EventProposalStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEventBookingSafeJSON {
  id: string;
  eventReference: string;
  inquiryId?: string | null;
  acceptedProposalId?: string | null;
  customerId?: string | null;
  locationId: string;
  roomId: string;
  roomName?: string;
  startAt: string;
  endAt: string;
  guestCount: number;
  eventType: string;
  status: EventBookingStatus;
  paymentStatus: PaymentStatus;
  agreedTotalMinor: number;
  currency: string;
  specialRequirements?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VIPOverviewMetrics {
  locationId: string;
  totalActiveRooms: number;
  upcomingVIPBookings: number;
  pendingEventInquiries: number;
  confirmedEvents: number;
  todayArrivals: number;
}
