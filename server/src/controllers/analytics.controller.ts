import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsDatePreset } from '../types/analytics';

export class AnalyticsController {
  private static extractParams(req: Request) {
    const locationId = (req.query.locationId as string) || 'loc-colombo-main';
    const preset = (req.query.preset as AnalyticsDatePreset) || 'last30days';
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    return { locationId, preset, startDate, endDate };
  }

  public static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getExecutiveOverview(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getSalesAnalytics(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getOrderAnalytics(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getMenuAnalytics(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getKitchen(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getKitchenAnalytics(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getReservations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getReservationAnalytics(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getTables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getTableUtilization(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getVipEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getVipAndEventAnalytics(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getStaffAnalytics(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locationId, preset, startDate, endDate } = AnalyticsController.extractParams(req);
      const data = await AnalyticsService.getCustomerAnalytics(locationId, preset, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
