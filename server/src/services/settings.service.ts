import mongoose from 'mongoose';
import { RestaurantSettings, IRestaurantSettingsDocument } from '../models/restaurantSettings.model';
import {
  IRestaurantSettingsSafeJSON,
  DEFAULT_WEEK_HOURS,
  DEFAULT_KITCHEN_HOURS,
} from '../types/settings';
import { SafeStaff } from '../types/staff';
import { recordStaffAudit } from '../utils/auditLogger';
import { RESTAURANT_LOCATIONS, getLocationName } from '../config/locations';
import { Staff } from '../models/staff.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { logger } from '../utils/logger';

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class SettingsService {
  /**
   * Safe real-time broadcast via Socket.IO
   */
  private static emitSettingsUpdate(locationId: string, section: string, version: number): void {
    try {
      const { getSocketServer } = require('../sockets/socket.server');
      const io = getSocketServer();
      if (io) {
        io.to(`location:${locationId}`).emit('settings.updated', {
          locationId,
          section,
          version,
          timestamp: new Date().toISOString(),
        });
        io.to('role:admin').emit('settings.updated', {
          locationId,
          section,
          version,
          timestamp: new Date().toISOString(),
        });
        io.to('role:manager').emit('settings.updated', {
          locationId,
          section,
          version,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      logger.warn(`[SettingsService] Real-time notification failure: ${err?.message}`);
    }
  }

  /**
   * Retrieves or initializes settings for a given location
   */
  public static async getSettingsForLocation(locationId: string): Promise<IRestaurantSettingsDocument> {
    let settings = await RestaurantSettings.findOne({ locationId });
    if (!settings) {
      const locInfo = RESTAURANT_LOCATIONS.find((l) => l.id === locationId);
      settings = await RestaurantSettings.create({
        locationId,
        general: {
          restaurantName: locInfo ? locInfo.name : 'AURELLE Fine Dining & Lounge',
          tagline: 'An Unrivaled Gastronomic Odyssey',
          description: 'A premier culinary destination offering bespoke fine dining, curated pairings, and private salon experiences.',
          contactEmail: 'concierge@aurelle.luxury',
          contactPhone: '+94 11 234 5678',
          address: {
            street: locInfo ? locInfo.address : '42 Galle Face Court',
            city: locInfo ? locInfo.city : 'Colombo',
            postalCode: '00300',
            country: 'Sri Lanka',
          },
          currency: 'LKR',
          currencySymbol: 'Rs.',
          timezone: 'Asia/Colombo',
          websiteUrl: 'https://aurelle.luxury',
        },
        operatingHours: DEFAULT_WEEK_HOURS,
        kitchenHours: DEFAULT_KITCHEN_HOURS,
        holidayClosures: [],
        version: 1,
      });
      logger.info(`[SettingsService] Initialized default settings for location: ${locationId}`);
    }
    return settings;
  }

  /**
   * Atomic update of a specific settings section with optimistic concurrency check
   */
  public static async updateSettingsSection(
    locationId: string,
    section: string,
    data: any,
    expectedVersion: number,
    staff: SafeStaff,
    ipAddress?: string
  ): Promise<IRestaurantSettingsDocument> {
    const validSections = [
      'general',
      'operatingHours',
      'kitchenHours',
      'holidayClosures',
      'reservationPolicy',
      'orderPolicy',
      'financialPolicy',
      'vipPolicy',
      'eventPolicy',
      'notificationPolicy',
    ];

    if (!validSections.includes(section)) {
      throw new Error(`Invalid settings section: ${section}`);
    }

    // Atomic update checking current version
    const updateQuery: any = {
      $set: {
        [section]: data,
        updatedByStaffId: staff.id,
      },
      $inc: {
        version: 1,
      },
    };

    const updated = await RestaurantSettings.findOneAndUpdate(
      { locationId, version: expectedVersion },
      updateQuery,
      { new: true }
    );

    if (!updated) {
      // Check if doc exists at all or if version mismatched
      const existing = await RestaurantSettings.findOne({ locationId });
      if (!existing) {
        throw new Error(`Settings not found for location ${locationId}`);
      }
      throw new ConflictError(
        `Settings update conflict: Current version is ${existing.version}, but you submitted version ${expectedVersion}. Please refresh the latest configuration and reapply your changes.`
      );
    }

    // Record audit log
    await recordStaffAudit({
      actorId: staff.id,
      actorName: `${staff.firstName} ${staff.lastName}`,
      actorEmail: staff.email,
      targetStaffId: staff.id,
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'SETTINGS_UPDATED',
      details: `Updated [${section}] settings for ${getLocationName(locationId)} (v${expectedVersion} -> v${updated.version})`,
      metadata: {
        locationId,
        section,
        previousVersion: expectedVersion,
        newVersion: updated.version,
      },
      locationId,
      ipAddress,
    });

    this.emitSettingsUpdate(locationId, section, updated.version);
    return updated;
  }

  /**
   * Reset section to default configuration
   */
  public static async resetSectionToDefaults(
    locationId: string,
    section: string,
    expectedVersion: number,
    staff: SafeStaff,
    ipAddress?: string
  ): Promise<IRestaurantSettingsDocument> {
    let defaultData: any;

    switch (section) {
      case 'operatingHours':
        defaultData = DEFAULT_WEEK_HOURS;
        break;
      case 'kitchenHours':
        defaultData = DEFAULT_KITCHEN_HOURS;
        break;
      case 'holidayClosures':
        defaultData = [];
        break;
      case 'reservationPolicy':
        defaultData = {
          maxAdvanceDays: 30,
          minNoticeHours: 2,
          defaultDurationMinutes: 120,
          maxPartySize: 16,
          timeIntervalMinutes: 15,
          cancellationCutoffHours: 4,
          requireDepositForPartyAbove: 8,
        };
        break;
      case 'orderPolicy':
        defaultData = {
          onlineOrderingEnabled: true,
          takeawayEnabled: true,
          preorderEnabled: true,
          minLeadMinutes: 30,
          maxAdvanceDays: 7,
          orderCutoffMinutesBeforeClose: 45,
          maxItemsPerOrder: 20,
        };
        break;
      case 'financialPolicy':
        defaultData = {
          serviceChargeRate: 0.10,
          taxRate: 0.025,
          currency: 'LKR',
          roundingRule: 'NEAREST',
          minimumOrderValueMinor: 0,
          tippingEnabled: true,
        };
        break;
      case 'vipPolicy':
        defaultData = {
          advanceNoticeDays: 2,
          minSpendRequirementMinor: 5000000,
          cancellationNoticeHours: 24,
          depositPercentage: 50,
        };
        break;
      case 'eventPolicy':
        defaultData = {
          proposalExpiryDays: 7,
          contractConfirmationLeadDays: 14,
          maxGuestCapacity: 150,
          depositPercentage: 50,
        };
        break;
      case 'notificationPolicy':
        defaultData = {
          orderCreatedEmail: true,
          orderStatusSms: true,
          reservationConfirmedEmail: true,
          reservationReminderSms: true,
          staffInAppAlerts: true,
        };
        break;
      default:
        throw new Error(`Cannot reset section: ${section}`);
    }

    return this.updateSettingsSection(locationId, section, defaultData, expectedVersion, staff, ipAddress);
  }

  /**
   * System security & session overview
   */
  public static async getSecurityOverview(): Promise<any> {
    const activeStaffByRole = await Staff.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const activeStaffMap: Record<string, number> = {};
    activeStaffByRole.forEach((r) => {
      activeStaffMap[r._id] = r.count;
    });

    return {
      session: {
        sessionType: 'Express Secure Cookie Session',
        maxAgeHours: 24,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
      },
      rateLimiting: {
        windowMs: 900000, // 15 mins
        maxRequestsPerWindow: 100,
        protectedEndpoints: ['/api/auth/*', '/api/staff/auth/*'],
      },
      rbac: {
        activeStaffCount: Object.values(activeStaffMap).reduce((a, b) => a + b, 0),
        roleBreakdown: activeStaffMap,
      },
      database: {
        state: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        dbName: mongoose.connection.name || 'aurelle',
        ssl: true,
      },
    };
  }

  /**
   * Locations management overview
   */
  public static async getLocationsOverview(): Promise<any[]> {
    const results = [];
    for (const loc of RESTAURANT_LOCATIONS) {
      const settings = await RestaurantSettings.findOne({ locationId: loc.id });
      results.push({
        ...loc,
        hasCustomSettings: !!settings,
        version: settings?.version || 1,
        currency: settings?.general?.currency || 'LKR',
        onlineOrderingEnabled: settings?.orderPolicy?.onlineOrderingEnabled ?? true,
        serviceChargeRate: settings?.financialPolicy?.serviceChargeRate ?? 0.10,
        taxRate: settings?.financialPolicy?.taxRate ?? 0.025,
      });
    }
    return results;
  }

  /**
   * Paginated system audit activity
   */
  public static async getActivityLogs(params: {
    locationId?: string;
    staffId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: any[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params.locationId) {
      query.locationId = params.locationId;
    }
    if (params.staffId) {
      query.$or = [{ actorId: params.staffId }, { targetStaffId: params.staffId }];
    }
    if (params.action) {
      query.action = params.action;
    }
    if (params.startDate || params.endDate) {
      query.createdAt = {};
      if (params.startDate) query.createdAt.$gte = new Date(params.startDate);
      if (params.endDate) query.createdAt.$lte = new Date(params.endDate);
    }

    const [logs, total] = await Promise.all([
      StaffAuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      StaffAuditLog.countDocuments(query),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log._id.toString(),
        actorId: log.actorId,
        actorName: log.actorName,
        actorEmail: log.actorEmail,
        targetStaffId: log.targetStaffId,
        targetStaffName: log.targetStaffName,
        targetStaffEmail: log.targetStaffEmail,
        action: log.action,
        details: log.details,
        metadata: log.metadata,
        locationId: log.locationId,
        locationName: log.locationId ? getLocationName(log.locationId) : undefined,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
