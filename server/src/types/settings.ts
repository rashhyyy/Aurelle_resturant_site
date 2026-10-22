/**
 * Aurelle Restaurant Management Platform
 * System Settings & Policies Types (Stage 15)
 */

export interface IDayHours {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  isOpen: boolean;
  openTime: string; // "11:00" (24h HH:mm)
  closeTime: string; // "23:00"
}

export interface IHolidayClosure {
  date: string; // "YYYY-MM-DD"
  reason: string;
}

export interface IRestaurantGeneralSettings {
  restaurantName: string;
  tagline: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  currency: string;
  currencySymbol: string;
  timezone: string;
  websiteUrl: string;
}

export interface IReservationPolicySettings {
  maxAdvanceDays: number;
  minNoticeHours: number;
  defaultDurationMinutes: number;
  maxPartySize: number;
  timeIntervalMinutes: number;
  cancellationCutoffHours: number;
  requireDepositForPartyAbove: number;
}

export interface IOrderPolicySettings {
  onlineOrderingEnabled: boolean;
  takeawayEnabled: boolean;
  preorderEnabled: boolean;
  minLeadMinutes: number;
  maxAdvanceDays: number;
  orderCutoffMinutesBeforeClose: number;
  maxItemsPerOrder: number;
}

export interface IFinancialPolicySettings {
  serviceChargeRate: number; // e.g. 0.10 (10%)
  taxRate: number; // e.g. 0.025 (2.5%)
  currency: string; // "LKR"
  roundingRule: 'NEAREST' | 'UP' | 'DOWN';
  minimumOrderValueMinor: number; // 0
  tippingEnabled: boolean;
}

export interface IVipPolicySettings {
  advanceNoticeDays: number;
  minSpendRequirementMinor: number;
  cancellationNoticeHours: number;
  depositPercentage: number;
}

export interface IEventPolicySettings {
  proposalExpiryDays: number;
  contractConfirmationLeadDays: number;
  maxGuestCapacity: number;
  depositPercentage: number;
}

export interface INotificationPolicySettings {
  orderCreatedEmail: boolean;
  orderStatusSms: boolean;
  reservationConfirmedEmail: boolean;
  reservationReminderSms: boolean;
  staffInAppAlerts: boolean;
}

export interface IRestaurantSettingsSafeJSON {
  id: string;
  locationId: string;
  general: IRestaurantGeneralSettings;
  operatingHours: IDayHours[];
  kitchenHours: IDayHours[];
  holidayClosures: IHolidayClosure[];
  reservationPolicy: IReservationPolicySettings;
  orderPolicy: IOrderPolicySettings;
  financialPolicy: IFinancialPolicySettings;
  vipPolicy: IVipPolicySettings;
  eventPolicy: IEventPolicySettings;
  notificationPolicy: INotificationPolicySettings;
  version: number;
  updatedByStaffId?: string | null;
  updatedAt: string;
}

export const DEFAULT_WEEK_HOURS: IDayHours[] = [
  { day: 'MONDAY', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'TUESDAY', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'WEDNESDAY', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'THURSDAY', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'FRIDAY', isOpen: true, openTime: '11:00', closeTime: '23:30' },
  { day: 'SATURDAY', isOpen: true, openTime: '11:00', closeTime: '23:30' },
  { day: 'SUNDAY', isOpen: true, openTime: '11:00', closeTime: '23:00' },
];

export const DEFAULT_KITCHEN_HOURS: IDayHours[] = [
  { day: 'MONDAY', isOpen: true, openTime: '11:30', closeTime: '22:30' },
  { day: 'TUESDAY', isOpen: true, openTime: '11:30', closeTime: '22:30' },
  { day: 'WEDNESDAY', isOpen: true, openTime: '11:30', closeTime: '22:30' },
  { day: 'THURSDAY', isOpen: true, openTime: '11:30', closeTime: '22:30' },
  { day: 'FRIDAY', isOpen: true, openTime: '11:30', closeTime: '23:00' },
  { day: 'SATURDAY', isOpen: true, openTime: '11:30', closeTime: '23:00' },
  { day: 'SUNDAY', isOpen: true, openTime: '11:30', closeTime: '22:30' },
];
