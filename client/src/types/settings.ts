export interface IDayHours {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface IHolidayClosure {
  date: string;
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
  serviceChargeRate: number;
  taxRate: number;
  currency: string;
  roundingRule: 'NEAREST' | 'UP' | 'DOWN';
  minimumOrderValueMinor: number;
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
