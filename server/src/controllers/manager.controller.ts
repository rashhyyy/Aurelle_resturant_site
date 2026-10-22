import { Request, Response, NextFunction } from 'express';
import { ManagerService } from '../services/manager.service';
import { StaffRole } from '../types/staff';
import { AlertStatus, AlertSeverity, AlertType, ManagerOverrideAction } from '../types/manager';
import { OrderStatus, OrderType } from '../types/order';
import { ReservationStatus } from '../types/reservation';
import { Order } from '../models/order.model';
import { logger } from '../utils/logger';

/**
 * Resolves and validates locationId against authenticated staff permissions.
 */
function resolveLocation(req: Request): string {
  const reqLoc =
    (req.query.locationId as string) ||
    (req.body && req.body.locationId) ||
    (req.params && req.params.locationId) ||
    req.staff?.locationIds[0] ||
    'loc-colombo-main';

  if (!req.staff) {
    throw { status: 401, message: 'Authentication required.' };
  }

  // Admins have global multi-location access
  if (req.staff.role === StaffRole.ADMIN) {
    return reqLoc;
  }

  // Managers and staff must be assigned to requested location
  if (!req.staff.locationIds.includes(reqLoc)) {
    throw { status: 403, message: 'Access denied: You are not authorized for this restaurant location.' };
  }

  return reqLoc;
}

export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const data = await ManagerService.getOverviewData(locationId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { search, status, orderType, page, limit } = req.query;

    const data = await ManagerService.getOrders(locationId, {
      search: search as string,
      status: status as OrderStatus,
      orderType: orderType as OrderType,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { id } = req.params;

    const order = await Order.findOne({
      $or: [{ _id: id }, { orderReference: id?.toUpperCase() }],
      locationId,
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found for this location.' });
      return;
    }

    res.status(200).json({ success: true, data: order.toSafeJSON() });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getKitchen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const data = await ManagerService.getKitchenTickets(locationId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getReservations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { search, status, date, page, limit } = req.query;

    const data = await ManagerService.getReservations(locationId, {
      search: search as string,
      status: status as ReservationStatus,
      date: date as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getReception = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const data = await ManagerService.getReceptionSummary(locationId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getFloor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const data = await ManagerService.getFloorSummary(locationId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getVipEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const data = await ManagerService.getVipSummary(locationId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const data = await ManagerService.getStaffAssignments(locationId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { status, severity, alertType, page, limit } = req.query;

    const data = await ManagerService.getAlerts(locationId, {
      status: status as AlertStatus,
      severity: severity as AlertSeverity,
      alertType: alertType as AlertType,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const acknowledgeAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { id } = req.params;

    const alert = await ManagerService.acknowledgeAlert(id, req.staff!, locationId);
    res.status(200).json({ success: true, message: 'Alert acknowledged.', data: alert });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    res.status(400).json({ success: false, error: err.message || 'Failed to acknowledge alert.' });
  }
};

export const resolveAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const alert = await ManagerService.resolveAlert(id, req.staff!, resolutionNotes, locationId);
    res.status(200).json({ success: true, message: 'Alert resolved.', data: alert });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    res.status(400).json({ success: false, error: err.message || 'Failed to resolve alert.' });
  }
};

export const executeOverride = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { action, targetId, reason, extraData } = req.body;

    if (!action || !targetId) {
      res.status(400).json({ success: false, error: 'action and targetId are required fields.' });
      return;
    }

    const result = await ManagerService.executeOverride(
      action as ManagerOverrideAction,
      targetId,
      reason,
      req.staff!,
      locationId,
      extraData
    );

    res.status(200).json(result);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    res.status(400).json({ success: false, error: err.message || 'Failed to execute override.' });
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { dateRange, startDate, endDate } = req.query;

    const data = await ManagerService.generateOperationalReport(
      locationId,
      (dateRange as any) || 'today',
      startDate as string,
      endDate as string,
      req.staff!
    );

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const exportReportCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { dateRange, startDate, endDate } = req.query;

    const csvContent = await ManagerService.generateReportCSV(
      locationId,
      (dateRange as any) || 'today',
      startDate as string,
      endDate as string,
      req.staff!
    );

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="aurelle-operational-report-${locationId}-${timestamp}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};

export const getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locationId = resolveLocation(req);
    const { search, action, staffId, page, limit } = req.query;

    const data = await ManagerService.getActivityHistory(locationId, {
      search: search as string,
      action: action as string,
      staffId: staffId as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 25,
    });

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
};
