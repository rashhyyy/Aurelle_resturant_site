export enum RecipientType {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
}

export enum NotificationCategory {
  ORDER = 'ORDER',
  RESERVATION = 'RESERVATION',
  KITCHEN = 'KITCHEN',
  RECEPTION = 'RECEPTION',
  FLOOR = 'FLOOR',
  VIP = 'VIP',
  EVENT = 'EVENT',
  MANAGEMENT = 'MANAGEMENT',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum DeliveryChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export interface INotification {
  _id: string;
  recipientType: RecipientType;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientRole?: string;
  locationId?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  channels: DeliveryChannel[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICategoryPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface INotificationPreferences {
  _id?: string;
  recipientType: RecipientType;
  recipientId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  categories: {
    orders: ICategoryPreferences;
    reservations: ICategoryPreferences;
    kitchen: ICategoryPreferences;
    reception: ICategoryPreferences;
    floor: ICategoryPreferences;
    vip: ICategoryPreferences;
    events: ICategoryPreferences;
    management: ICategoryPreferences;
    security: ICategoryPreferences;
    system: ICategoryPreferences;
  };
  doNotDisturb: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface INotificationDelivery {
  _id: string;
  notificationId: string | INotification;
  channel: DeliveryChannel;
  recipientType: RecipientType;
  recipientId: string;
  recipientDestination: string;
  status: DeliveryStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: string;
  lastAttemptAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  providerMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryMonitoringData {
  stats: {
    totalDeliveries: number;
    deliveredCount: number;
    pendingCount: number;
    failedCount: number;
    inAppCount: number;
    emailCount: number;
    smsCount: number;
    successRate: number;
  };
  deliveries: INotificationDelivery[];
  page: number;
  totalPages: number;
  total: number;
}
