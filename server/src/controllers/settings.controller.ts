import { Request, Response, NextFunction } from 'express';
import { SettingsService, ConflictError } from '../services/settings.service';
import { logger } from '../utils/logger';

export class SettingsController {
  /**
   * GET /api/settings/public?locationId=...
   * Public settings for client web app (operating hours, taxes, min lead time)
   */
  public static async getPublicSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locationId = (req.query.locationId as string) || 'loc-colombo-main';
      const settings = await SettingsService.getSettingsForLocation(locationId);

      res.status(200).json({
        success: true,
        data: {
          locationId: settings.locationId,
          general: {
            restaurantName: settings.general.restaurantName,
            contactPhone: settings.general.contactPhone,
            currency: settings.general.currency,
            currencySymbol: settings.general.currencySymbol,
          },
          operatingHours: settings.operatingHours,
          holidayClosures: settings.holidayClosures,
          orderPolicy: settings.orderPolicy,
          financialPolicy: {
            serviceChargeRate: settings.financialPolicy.serviceChargeRate,
            taxRate: settings.financialPolicy.taxRate,
            currency: settings.financialPolicy.currency,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/settings?locationId=...
   * Admin and Manager retrieval of full settings
   */
  public static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locationId = (req.query.locationId as string) || 'loc-colombo-main';
      const settings = await SettingsService.getSettingsForLocation(locationId);

      res.status(200).json({
        success: true,
        data: settings.toSafeJSON(),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/settings
   * Admin update of a specific settings section with optimistic concurrency check
   */
  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, section, data, version } = req.body;

      if (!locationId || !section || data === undefined || version === undefined) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'locationId, section, data, and version are required fields.',
        });
        return;
      }

      if (!req.staff) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const updated = await SettingsService.updateSettingsSection(
        locationId,
        section,
        data,
        Number(version),
        req.staff,
        ip
      );

      res.status(200).json({
        success: true,
        message: `Section [${section}] updated successfully.`,
        data: updated.toSafeJSON(),
      });
    } catch (err: any) {
      if (err instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/settings/reset
   * Admin reset of a specific section to defaults
   */
  public static async resetSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, section, version } = req.body;

      if (!locationId || !section || version === undefined) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'locationId, section, and version are required fields.',
        });
        return;
      }

      if (!req.staff) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const updated = await SettingsService.resetSectionToDefaults(
        locationId,
        section,
        Number(version),
        req.staff,
        ip
      );

      res.status(200).json({
        success: true,
        message: `Section [${section}] has been reset to defaults.`,
        data: updated.toSafeJSON(),
      });
    } catch (err: any) {
      if (err instanceof ConflictError) {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/settings/security
   */
  public static async getSecurity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await SettingsService.getSecurityOverview();
      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/settings/locations
   */
  public static async getLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locations = await SettingsService.getLocationsOverview();
      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/settings/activity
   */
  public static async getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, staffId, action, startDate, endDate, page, limit } = req.query;
      const result = await SettingsService.getActivityLogs({
        locationId: locationId as string,
        staffId: staffId as string,
        action: action as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
