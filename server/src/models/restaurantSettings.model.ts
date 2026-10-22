import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  IDayHours,
  IHolidayClosure,
  IRestaurantGeneralSettings,
  IReservationPolicySettings,
  IOrderPolicySettings,
  IFinancialPolicySettings,
  IVipPolicySettings,
  IEventPolicySettings,
  INotificationPolicySettings,
  IRestaurantSettingsSafeJSON,
  DEFAULT_WEEK_HOURS,
  DEFAULT_KITCHEN_HOURS,
} from '../types/settings';

export interface IRestaurantSettingsDocument extends Document {
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
  createdAt: Date;
  updatedAt: Date;
  toSafeJSON(): IRestaurantSettingsSafeJSON;
}

const DayHoursSchema = new Schema<IDayHours>(
  {
    day: {
      type: String,
      required: true,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: '11:00' },
    closeTime: { type: String, default: '23:00' },
  },
  { _id: false }
);

const HolidayClosureSchema = new Schema<IHolidayClosure>(
  {
    date: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const RestaurantSettingsSchema = new Schema<IRestaurantSettingsDocument>(
  {
    locationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    general: {
      restaurantName: { type: String, default: 'AURELLE Fine Dining & Lounge' },
      tagline: { type: String, default: 'An Unrivaled Gastronomic Odyssey' },
      description: {
        type: String,
        default: 'A premier culinary destination offering bespoke fine dining, curated pairings, and private salon experiences.',
      },
      contactEmail: { type: String, default: 'concierge@aurelle.luxury' },
      contactPhone: { type: String, default: '+94 11 234 5678' },
      address: {
        street: { type: String, default: '42 Galle Face Court' },
        city: { type: String, default: 'Colombo' },
        postalCode: { type: String, default: '00300' },
        country: { type: String, default: 'Sri Lanka' },
      },
      currency: { type: String, default: 'LKR' },
      currencySymbol: { type: String, default: 'Rs.' },
      timezone: { type: String, default: 'Asia/Colombo' },
      websiteUrl: { type: String, default: 'https://aurelle.luxury' },
    },
    operatingHours: {
      type: [DayHoursSchema],
      default: () => DEFAULT_WEEK_HOURS,
    },
    kitchenHours: {
      type: [DayHoursSchema],
      default: () => DEFAULT_KITCHEN_HOURS,
    },
    holidayClosures: {
      type: [HolidayClosureSchema],
      default: [],
    },
    reservationPolicy: {
      maxAdvanceDays: { type: Number, default: 30 },
      minNoticeHours: { type: Number, default: 2 },
      defaultDurationMinutes: { type: Number, default: 120 },
      maxPartySize: { type: Number, default: 16 },
      timeIntervalMinutes: { type: Number, default: 15 },
      cancellationCutoffHours: { type: Number, default: 4 },
      requireDepositForPartyAbove: { type: Number, default: 8 },
    },
    orderPolicy: {
      onlineOrderingEnabled: { type: Boolean, default: true },
      takeawayEnabled: { type: Boolean, default: true },
      preorderEnabled: { type: Boolean, default: true },
      minLeadMinutes: { type: Number, default: 30 },
      maxAdvanceDays: { type: Number, default: 7 },
      orderCutoffMinutesBeforeClose: { type: Number, default: 45 },
      maxItemsPerOrder: { type: Number, default: 20 },
    },
    financialPolicy: {
      serviceChargeRate: { type: Number, default: 0.10 }, // 10%
      taxRate: { type: Number, default: 0.025 }, // 2.5%
      currency: { type: String, default: 'LKR' },
      roundingRule: { type: String, enum: ['NEAREST', 'UP', 'DOWN'], default: 'NEAREST' },
      minimumOrderValueMinor: { type: Number, default: 0 },
      tippingEnabled: { type: Boolean, default: true },
    },
    vipPolicy: {
      advanceNoticeDays: { type: Number, default: 2 },
      minSpendRequirementMinor: { type: Number, default: 5000000 }, // Rs. 50,000.00
      cancellationNoticeHours: { type: Number, default: 24 },
      depositPercentage: { type: Number, default: 50 },
    },
    eventPolicy: {
      proposalExpiryDays: { type: Number, default: 7 },
      contractConfirmationLeadDays: { type: Number, default: 14 },
      maxGuestCapacity: { type: Number, default: 150 },
      depositPercentage: { type: Number, default: 50 },
    },
    notificationPolicy: {
      orderCreatedEmail: { type: Boolean, default: true },
      orderStatusSms: { type: Boolean, default: true },
      reservationConfirmedEmail: { type: Boolean, default: true },
      reservationReminderSms: { type: Boolean, default: true },
      staffInAppAlerts: { type: Boolean, default: true },
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    updatedByStaffId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

RestaurantSettingsSchema.methods.toSafeJSON = function (): IRestaurantSettingsSafeJSON {
  const doc = this as IRestaurantSettingsDocument;
  return {
    id: doc._id.toString(),
    locationId: doc.locationId,
    general: doc.general,
    operatingHours: doc.operatingHours,
    kitchenHours: doc.kitchenHours,
    holidayClosures: doc.holidayClosures,
    reservationPolicy: doc.reservationPolicy,
    orderPolicy: doc.orderPolicy,
    financialPolicy: doc.financialPolicy,
    vipPolicy: doc.vipPolicy,
    eventPolicy: doc.eventPolicy,
    notificationPolicy: doc.notificationPolicy,
    version: doc.version,
    updatedByStaffId: doc.updatedByStaffId,
    updatedAt: doc.updatedAt.toISOString(),
  };
};

export const RestaurantSettings: Model<IRestaurantSettingsDocument> =
  mongoose.models.RestaurantSettings ||
  mongoose.model<IRestaurantSettingsDocument>('RestaurantSettings', RestaurantSettingsSchema);
