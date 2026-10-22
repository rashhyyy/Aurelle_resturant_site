import mongoose from 'mongoose';
import { Order } from '../models/order.model';
import { Reservation } from '../models/reservation.model';
import { Table } from '../models/table.model';
import { DiningSession } from '../models/diningSession.model';
import { CleaningTask } from '../models/cleaningTask.model';
import { ServiceRequest } from '../models/serviceRequest.model';
import { WaitingList } from '../models/waitingList.model';
import { VIPBooking } from '../models/vipBooking.model';
import { EventInquiry } from '../models/eventInquiry.model';
import { EventProposal } from '../models/eventProposal.model';
import { Staff } from '../models/staff.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { OperationalAlert } from '../models/operationalAlert.model';
import {
  AlertType,
  AlertSourceType,
  AlertSeverity,
  AlertStatus,
  IOperationalAlertSafeJSON,
  ManagerOverviewData,
  ManagerOverrideAction,
  ManagerReportData,
} from '../types/manager';
import { OrderStatus, OrderType } from '../types/order';
import { ReservationStatus } from '../types/reservation';
import { TableStatus } from '../types/table';
import { CleaningTaskStatus, DiningSessionStatus, ServiceRequestStatus } from '../types/floor';
import { WaitingListStatus } from '../types/waitingList';
import { SafeStaff } from '../types/staff';
import { recordStaffAudit } from '../utils/auditLogger';
import { getLocationName } from '../config/locations';
import { logger } from '../utils/logger';

export class ManagerService {
  /**
   * Helper to safely broadcast events to location room via Socket.IO
   */
  private static emitToLocation(locationId: string, event: string, payload: any): void {
    try {
      // Import lazily to avoid circular dependencies
      const { getSocketServer } = require('../sockets/socket.server');
      const io = getSocketServer();
      if (io) {
        io.to(`location:${locationId}`).emit(event, payload);
        io.to('role:manager').emit(event, payload);
        io.to('role:admin').emit(event, payload);
      }
    } catch (err: any) {
      logger.warn(`[ManagerService] Failed to emit real-time event ${event}: ${err?.message}`);
    }
  }

  /**
   * Evaluates operational database state and creates/resolves alerts dynamically.
   * Enforces deduplication: never creates duplicate open alerts for the same sourceId + alertType.
   */
  public static async syncOperationalAlerts(locationId: string): Promise<void> {
    const now = new Date();

    try {
      // 1. Check Delayed Orders (Orders in CONFIRMED or PREPARING older than 25 minutes)
      const twentyFiveMinAgo = new Date(now.getTime() - 25 * 60 * 1000);
      const delayedOrders = await Order.find({
        locationId,
        orderStatus: { $in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
        createdAt: { $lt: twentyFiveMinAgo },
      }).limit(20);

      for (const order of delayedOrders) {
        const elapsedMin = Math.round((now.getTime() - order.createdAt.getTime()) / 60000);
        await OperationalAlert.findOneAndUpdate(
          {
            locationId,
            alertType: AlertType.ORDER_DELAYED,
            sourceId: order._id.toString(),
            status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          },
          {
            $setOnInsert: {
              locationId,
              alertType: AlertType.ORDER_DELAYED,
              sourceType: AlertSourceType.ORDER,
              sourceId: order._id.toString(),
              sourceReference: order.orderReference,
              severity: elapsedMin > 40 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
              status: AlertStatus.OPEN,
              message: `Order #${order.orderReference} preparation delayed (${elapsedMin}m elapsed).`,
              metadata: {
                orderReference: order.orderReference,
                elapsedMinutes: elapsedMin,
                status: order.orderStatus,
              },
            },
          },
          { upsert: true, new: true }
        );
      }

      // Auto-resolve delayed order alerts if order is now READY, COMPLETED, or CANCELLED
      const resolvedOrders = await Order.find({
        locationId,
        orderStatus: { $in: [OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
      }).select('_id');
      const resolvedOrderIds = resolvedOrders.map((o) => o._id.toString());
      if (resolvedOrderIds.length > 0) {
        await OperationalAlert.updateMany(
          {
            locationId,
            alertType: AlertType.ORDER_DELAYED,
            sourceId: { $in: resolvedOrderIds },
            status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          },
          {
            $set: {
              status: AlertStatus.RESOLVED,
              resolvedAt: now,
              resolutionNotes: 'Order reached next lifecycle stage.',
              'resolvedBy.name': 'Automated System Monitor',
            },
          }
        );
      }

      // 2. Check Overdue Order Handoff (Orders in READY status for > 10 minutes)
      const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const overdueHandoffs = await Order.find({
        locationId,
        orderStatus: OrderStatus.READY,
        readyAt: { $lt: tenMinAgo },
      }).limit(20);

      for (const order of overdueHandoffs) {
        const readyTime = order.readyAt || order.updatedAt;
        const elapsedMin = Math.round((now.getTime() - readyTime.getTime()) / 60000);
        await OperationalAlert.findOneAndUpdate(
          {
            locationId,
            alertType: AlertType.ORDER_HANDOFF_OVERDUE,
            sourceId: order._id.toString(),
            status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          },
          {
            $setOnInsert: {
              locationId,
              alertType: AlertType.ORDER_HANDOFF_OVERDUE,
              sourceType: AlertSourceType.ORDER,
              sourceId: order._id.toString(),
              sourceReference: order.orderReference,
              severity: elapsedMin > 20 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
              status: AlertStatus.OPEN,
              message: `Order #${order.orderReference} is ready but awaiting handoff for ${elapsedMin}m.`,
              metadata: { orderReference: order.orderReference, elapsedMinutes: elapsedMin },
            },
          },
          { upsert: true, new: true }
        );
      }

      // 3. Check Waiting Parties Exceeding Threshold (> 20 minutes)
      const twentyMinAgo = new Date(now.getTime() - 20 * 60 * 1000);
      const overdueWaiting = await WaitingList.find({
        locationId,
        status: WaitingListStatus.WAITING,
        createdAt: { $lt: twentyMinAgo },
      }).limit(20);

      for (const entry of overdueWaiting) {
        const elapsedMin = Math.round((now.getTime() - entry.createdAt.getTime()) / 60000);
        await OperationalAlert.findOneAndUpdate(
          {
            locationId,
            alertType: AlertType.WAITING_EXCEEDED,
            sourceId: entry._id.toString(),
            status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          },
          {
            $setOnInsert: {
              locationId,
              alertType: AlertType.WAITING_EXCEEDED,
              sourceType: AlertSourceType.WAITING_LIST,
              sourceId: entry._id.toString(),
              sourceReference: entry.guestName,
              severity: elapsedMin > 35 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
              status: AlertStatus.OPEN,
              message: `Waiting party "${entry.guestName}" (${entry.guestCount} guests) has been waiting ${elapsedMin}m.`,
              metadata: { guestName: entry.guestName, guestCount: entry.guestCount, elapsedMinutes: elapsedMin },
            },
          },
          { upsert: true, new: true }
        );
      }

      // 4. Check Tables Awaiting Cleaning (> 15 minutes)
      const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const overdueCleanings = await CleaningTask.find({
        locationId,
        status: CleaningTaskStatus.PENDING,
        createdAt: { $lt: fifteenMinAgo },
      }).limit(20);

      for (const task of overdueCleanings) {
        const elapsedMin = Math.round((now.getTime() - task.createdAt.getTime()) / 60000);
        await OperationalAlert.findOneAndUpdate(
          {
            locationId,
            alertType: AlertType.TABLE_CLEANING_OVERDUE,
            sourceId: task._id.toString(),
            status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          },
          {
            $setOnInsert: {
              locationId,
              alertType: AlertType.TABLE_CLEANING_OVERDUE,
              sourceType: AlertSourceType.CLEANING_TASK,
              sourceId: task._id.toString(),
              sourceReference: `Table ${task.tableNumber}`,
              severity: elapsedMin > 30 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
              status: AlertStatus.OPEN,
              message: `Table ${task.tableNumber} turnover cleaning is pending for ${elapsedMin}m.`,
              metadata: { tableNumber: task.tableNumber, elapsedMinutes: elapsedMin },
            },
          },
          { upsert: true, new: true }
        );
      }

      // 5. Check Unresolved Service Requests (> 10 minutes)
      const openRequests = await ServiceRequest.find({
        locationId,
        status: { $in: [ServiceRequestStatus.OPEN, ServiceRequestStatus.ACKNOWLEDGED] },
        createdAt: { $lt: tenMinAgo },
      }).limit(20);

      for (const req of openRequests) {
        const elapsedMin = Math.round((now.getTime() - req.createdAt.getTime()) / 60000);
        await OperationalAlert.findOneAndUpdate(
          {
            locationId,
            alertType: AlertType.SERVICE_REQUEST_PENDING,
            sourceId: req._id.toString(),
            status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          },
          {
            $setOnInsert: {
              locationId,
              alertType: AlertType.SERVICE_REQUEST_PENDING,
              sourceType: AlertSourceType.SERVICE_REQUEST,
              sourceId: req._id.toString(),
              sourceReference: `Table ${req.tableNumber}`,
              severity: elapsedMin > 25 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
              status: AlertStatus.OPEN,
              message: `Service request for Table ${req.tableNumber} (${req.requestType}) is unresolved for ${elapsedMin}m.`,
              metadata: { tableNumber: req.tableNumber, requestType: req.requestType, elapsedMinutes: elapsedMin },
            },
          },
          { upsert: true, new: true }
        );
      }

      // 6. Check Pending Event Inquiries (> 24 hours)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const pendingInquiries = await EventInquiry.find({
        locationId,
        status: 'RECEIVED',
        createdAt: { $lt: twentyFourHoursAgo },
      }).limit(10);

      for (const inq of pendingInquiries) {
        await OperationalAlert.findOneAndUpdate(
          {
            locationId,
            alertType: AlertType.VIP_INQUIRY_PENDING,
            sourceId: inq._id.toString(),
            status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          },
          {
            $setOnInsert: {
              locationId,
              alertType: AlertType.VIP_INQUIRY_PENDING,
              sourceType: AlertSourceType.VIP_INQUIRY,
              sourceId: inq._id.toString(),
              sourceReference: inq.inquiryReference,
              severity: AlertSeverity.MEDIUM,
              status: AlertStatus.OPEN,
              message: `Event inquiry #${inq.inquiryReference} (${inq.guestName}) awaiting manager response > 24 hours.`,
              metadata: { inquiryReference: inq.inquiryReference, guestName: inq.guestName },
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch (err: any) {
      logger.error(`[ManagerService] Alert synchronization failed: ${err?.message}`);
    }
  }

  /**
   * Retrieves high-level manager overview metrics and real MongoDB aggregates.
   */
  public static async getOverviewData(locationId: string): Promise<ManagerOverviewData> {
    await this.syncOperationalAlerts(locationId);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Active Orders (RECEIVED, CONFIRMED, PREPARING, READY)
    const activeOrdersCount = await Order.countDocuments({
      locationId,
      orderStatus: { $in: [OrderStatus.RECEIVED, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY] },
    });

    // 2. Today's Reservations (excluding CANCELLED and NO_SHOW)
    const todayReservationsCount = await Reservation.countDocuments({
      locationId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.SEATED, ReservationStatus.COMPLETED] },
    });

    // 3. Checked-In & Seated Guests Count today
    const activeGuestReservations = await Reservation.find({
      locationId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: [ReservationStatus.CHECKED_IN, ReservationStatus.SEATED] },
    }).select('guestCount');
    const checkedInGuests = activeGuestReservations.reduce((sum, r) => sum + (r.guestCount || 0), 0);

    // 4. Tables Occupancy Breakdown
    const totalTables = await Table.countDocuments({ locationId, isActive: true });
    const occupiedTables = await Table.countDocuments({ locationId, isActive: true, status: TableStatus.OCCUPIED });
    const availableTables = await Table.countDocuments({ locationId, isActive: true, status: TableStatus.AVAILABLE });
    const reservedTables = await Table.countDocuments({ locationId, isActive: true, status: TableStatus.RESERVED });
    const cleaningTables = await Table.countDocuments({
      locationId,
      isActive: true,
      status: { $in: [TableStatus.AWAITING_CLEANING, TableStatus.CLEANING] },
    });

    const occupancyRatePercent = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

    // 5. Pending VIP Requests (pending VIP bookings + pending event inquiries)
    const pendingVipBookings = await VIPBooking.countDocuments({
      locationId,
      status: 'PENDING',
    });
    const pendingEventInquiries = await EventInquiry.countDocuments({
      locationId,
      status: { $in: ['RECEIVED', 'IN_REVIEW'] },
    });
    const pendingVipRequests = pendingVipBookings + pendingEventInquiries;

    // 6. Active Service Issues (unresolved service requests + open HIGH/CRITICAL alerts)
    const openServiceRequestsCount = await ServiceRequest.countDocuments({
      locationId,
      status: { $in: [ServiceRequestStatus.OPEN, ServiceRequestStatus.ACKNOWLEDGED, ServiceRequestStatus.IN_PROGRESS] },
    });
    const openCriticalAlertsCount = await OperationalAlert.countDocuments({
      locationId,
      status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
      severity: { $in: [AlertSeverity.HIGH, AlertSeverity.CRITICAL] },
    });
    const activeServiceIssues = openServiceRequestsCount + openCriticalAlertsCount;

    // 7. Critical & High Alerts list for immediate attention
    const criticalAlertsDocs = await OperationalAlert.find({
      locationId,
      status: { $in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
    })
      .sort({ severity: -1, createdAt: -1 })
      .limit(6);

    // 8. Active Orders preview
    const recentActiveOrders = await Order.find({
      locationId,
      orderStatus: { $in: [OrderStatus.RECEIVED, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY] },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // 9. Reception breakdown for today
    const expectedArrivals = await Reservation.countDocuments({
      locationId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
    });
    const checkedInCount = await Reservation.countDocuments({
      locationId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      status: ReservationStatus.CHECKED_IN,
    });
    const seatedCount = await Reservation.countDocuments({
      locationId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      status: ReservationStatus.SEATED,
    });
    const waitingCount = await WaitingList.countDocuments({
      locationId,
      status: WaitingListStatus.WAITING,
    });
    const noShowCount = await Reservation.countDocuments({
      locationId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      status: ReservationStatus.NO_SHOW,
    });

    return {
      locationId,
      locationName: getLocationName(locationId),
      serverTime: now.toISOString(),
      metrics: {
        activeOrders: activeOrdersCount,
        todayReservations: todayReservationsCount,
        occupiedTables,
        checkedInGuests,
        pendingVipRequests,
        activeServiceIssues,
      },
      criticalAlerts: criticalAlertsDocs.map((a) => a.toSafeJSON()),
      activeOrdersPreview: recentActiveOrders.map((o) => ({
        id: o._id.toString(),
        orderReference: o.orderReference,
        orderType: o.orderType,
        orderStatus: o.orderStatus,
        totalMinor: o.totalMinor,
        currency: o.currency || 'LKR',
        createdAt: o.createdAt.toISOString(),
        itemsCount: o.items.reduce((acc, it) => acc + (it.quantity || 1), 0),
      })),
      floorOccupancy: {
        totalTables,
        occupiedCount: occupiedTables,
        availableCount: availableTables,
        reservedCount: reservedTables,
        cleaningCount: cleaningTables,
        occupancyRatePercent,
      },
      receptionStatus: {
        expectedArrivals,
        checkedInCount,
        seatedCount,
        waitingCount,
        noShowCount,
      },
    };
  }

  /**
   * Retrieves operational alerts with filtering and pagination.
   */
  public static async getAlerts(
    locationId: string,
    filters: {
      status?: AlertStatus;
      severity?: AlertSeverity;
      alertType?: AlertType;
      page?: number;
      limit?: number;
    }
  ): Promise<{ alerts: IOperationalAlertSafeJSON[]; total: number; page: number; limit: number; counts: Record<string, number> }> {
    await this.syncOperationalAlerts(locationId);

    const query: any = { locationId };
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.alertType) query.alertType = filters.alertType;

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [alertsDocs, total, openCount, ackCount, resCount] = await Promise.all([
      OperationalAlert.find(query).sort({ status: 1, severity: -1, createdAt: -1 }).skip(skip).limit(limit),
      OperationalAlert.countDocuments(query),
      OperationalAlert.countDocuments({ locationId, status: AlertStatus.OPEN }),
      OperationalAlert.countDocuments({ locationId, status: AlertStatus.ACKNOWLEDGED }),
      OperationalAlert.countDocuments({ locationId, status: AlertStatus.RESOLVED }),
    ]);

    return {
      alerts: alertsDocs.map((a) => a.toSafeJSON()),
      total,
      page,
      limit,
      counts: {
        open: openCount,
        acknowledged: ackCount,
        resolved: resCount,
      },
    };
  }

  /**
   * Acknowledges an alert atomically with audit trail and real-time emission.
   */
  public static async acknowledgeAlert(
    alertId: string,
    staff: SafeStaff,
    locationId: string
  ): Promise<IOperationalAlertSafeJSON> {
    const alert = await OperationalAlert.findOne({ _id: alertId, locationId });
    if (!alert) {
      throw new Error('Operational alert not found or unauthorized for this location.');
    }

    if (alert.status === AlertStatus.RESOLVED) {
      throw new Error('Cannot acknowledge an alert that has already been resolved.');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = {
      id: staff.id,
      name: `${staff.firstName} ${staff.lastName}`,
    };
    await alert.save();

    await recordStaffAudit({
      actorId: staff.id,
      actorName: `${staff.firstName} ${staff.lastName}`,
      actorEmail: staff.email,
      targetStaffId: staff.id,
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'OPERATIONAL_ALERT_ACKNOWLEDGED' as any,
      details: `Manager acknowledged alert "${alert.message}" (${alert.alertType})`,
      locationId,
      metadata: { alertId: alert._id.toString(), alertType: alert.alertType },
    });

    const safeAlert = alert.toSafeJSON();
    this.emitToLocation(locationId, 'alert:acknowledged', safeAlert);
    return safeAlert;
  }

  /**
   * Resolves an alert atomically with resolution notes, audit trail, and real-time emission.
   */
  public static async resolveAlert(
    alertId: string,
    staff: SafeStaff,
    resolutionNotes: string,
    locationId: string
  ): Promise<IOperationalAlertSafeJSON> {
    const alert = await OperationalAlert.findOne({ _id: alertId, locationId });
    if (!alert) {
      throw new Error('Operational alert not found or unauthorized for this location.');
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    alert.resolvedBy = {
      id: staff.id,
      name: `${staff.firstName} ${staff.lastName}`,
    };
    alert.resolutionNotes = resolutionNotes || 'Resolved by operations manager.';
    await alert.save();

    await recordStaffAudit({
      actorId: staff.id,
      actorName: `${staff.firstName} ${staff.lastName}`,
      actorEmail: staff.email,
      targetStaffId: staff.id,
      targetStaffName: `${staff.firstName} ${staff.lastName}`,
      targetStaffEmail: staff.email,
      action: 'OPERATIONAL_ALERT_RESOLVED' as any,
      details: `Manager resolved alert "${alert.message}" with notes: ${alert.resolutionNotes}`,
      locationId,
      metadata: { alertId: alert._id.toString(), alertType: alert.alertType, resolutionNotes },
    });

    const safeAlert = alert.toSafeJSON();
    this.emitToLocation(locationId, 'alert:resolved', safeAlert);
    return safeAlert;
  }

  /**
   * Executes an authorized manager override with concurrency protection and audit trail.
   */
  public static async executeOverride(
    action: ManagerOverrideAction,
    targetId: string,
    reason: string,
    staff: SafeStaff,
    locationId: string,
    extraData?: any
  ): Promise<{ success: boolean; message: string; record?: any }> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed operational reason (minimum 5 characters) is required for manager overrides.');
    }

    switch (action) {
      case ManagerOverrideAction.REASSIGN_SERVICE_REQUEST: {
        const { assignedStaffId, assignedStaffName } = extraData || {};
        if (!assignedStaffId || !assignedStaffName) {
          throw new Error('New staff assignee ID and Name must be provided.');
        }

        const request = await ServiceRequest.findOne({ _id: targetId, locationId });
        if (!request) throw new Error('Service request not found for this location.');

        const prevAssignee = request.assignedStaffName || 'Unassigned';
        request.assignedStaffId = assignedStaffId;
        request.assignedStaffName = assignedStaffName;
        request.status = ServiceRequestStatus.ACKNOWLEDGED;
        await request.save();

        await recordStaffAudit({
          actorId: staff.id,
          actorName: `${staff.firstName} ${staff.lastName}`,
          actorEmail: staff.email,
          targetStaffId: assignedStaffId,
          targetStaffName: assignedStaffName,
          targetStaffEmail: extraData.assignedStaffEmail || staff.email,
          action: 'SERVICE_TASK_REASSIGNED' as any,
          details: `Manager reassigned service request ${targetId} from ${prevAssignee} to ${assignedStaffName}. Reason: ${reason}`,
          locationId,
        });

        this.emitToLocation(locationId, 'floor:service_request_updated', request.toSafeJSON());
        return { success: true, message: `Service request successfully reassigned to ${assignedStaffName}.`, record: request.toSafeJSON() };
      }

      case ManagerOverrideAction.FORCE_CLEANING_COMPLETE: {
        const task = await CleaningTask.findOne({ _id: targetId, locationId });
        if (!task) throw new Error('Cleaning task not found for this location.');

        task.status = CleaningTaskStatus.COMPLETED;
        task.completedAt = new Date();
        task.completedBy = `${staff.firstName} ${staff.lastName} (Manager Override)`;
        task.notes = `Completed via manager override: ${reason}`;
        await task.save();

        // Release associated table to AVAILABLE
        await Table.findOneAndUpdate(
          { tableNumber: task.tableNumber, locationId },
          { $set: { status: TableStatus.AVAILABLE } }
        );

        await recordStaffAudit({
          actorId: staff.id,
          actorName: `${staff.firstName} ${staff.lastName}`,
          actorEmail: staff.email,
          targetStaffId: staff.id,
          targetStaffName: `${staff.firstName} ${staff.lastName}`,
          targetStaffEmail: staff.email,
          action: 'TABLE_CLEANING_FORCED' as any,
          details: `Manager force-completed cleaning for Table ${task.tableNumber}. Reason: ${reason}`,
          locationId,
        });

        this.emitToLocation(locationId, 'floor:cleaning_task_updated', task.toSafeJSON());
        this.emitToLocation(locationId, 'floor:table_status_changed', { tableNumber: task.tableNumber, status: TableStatus.AVAILABLE });
        return { success: true, message: `Table ${task.tableNumber} cleaning force completed and table released to Available.`, record: task.toSafeJSON() };
      }

      case ManagerOverrideAction.ESCALATE_ALERT: {
        const alert = await OperationalAlert.findOne({ _id: targetId, locationId });
        if (!alert) throw new Error('Operational alert not found.');

        alert.severity = AlertSeverity.CRITICAL;
        alert.message = `[ESCALATED BY MANAGER] ${alert.message}`;
        alert.metadata = { ...(alert.metadata || {}), escalatedBy: staff.id, escalateReason: reason };
        await alert.save();

        await recordStaffAudit({
          actorId: staff.id,
          actorName: `${staff.firstName} ${staff.lastName}`,
          actorEmail: staff.email,
          targetStaffId: staff.id,
          targetStaffName: `${staff.firstName} ${staff.lastName}`,
          targetStaffEmail: staff.email,
          action: 'MANAGER_OVERRIDE_EXECUTED' as any,
          details: `Manager escalated alert ${alert.id} to CRITICAL. Reason: ${reason}`,
          locationId,
        });

        this.emitToLocation(locationId, 'alert:created', alert.toSafeJSON());
        return { success: true, message: 'Alert successfully escalated to CRITICAL.', record: alert.toSafeJSON() };
      }

      case ManagerOverrideAction.CANCEL_DELAYED_ORDER: {
        const order = await Order.findOne({ _id: targetId, locationId });
        if (!order) throw new Error('Order not found for this location.');
        if (order.orderStatus === OrderStatus.COMPLETED || order.orderStatus === OrderStatus.CANCELLED) {
          throw new Error(`Cannot cancel order in ${order.orderStatus} state.`);
        }

        order.orderStatus = OrderStatus.CANCELLED;
        order.cancelledAt = new Date();
        order.cancellationReason = `Manager cancellation: ${reason}`;
        order.statusHistory.push({
          status: OrderStatus.CANCELLED,
          changedAt: new Date(),
          changedBy: staff.id,
          actorType: 'STAFF',
          note: reason,
        });
        await order.save();

        await recordStaffAudit({
          actorId: staff.id,
          actorName: `${staff.firstName} ${staff.lastName}`,
          actorEmail: staff.email,
          targetStaffId: staff.id,
          targetStaffName: `${staff.firstName} ${staff.lastName}`,
          targetStaffEmail: staff.email,
          action: 'ORDER_CANCELLED' as any,
          details: `Manager cancelled delayed order #${order.orderReference}. Reason: ${reason}`,
          locationId,
        });

        this.emitToLocation(locationId, 'order:status_changed', order.toSafeJSON());
        return { success: true, message: `Order #${order.orderReference} has been cancelled.`, record: order.toSafeJSON() };
      }

      default:
        throw new Error(`Unsupported override action: ${action}`);
    }
  }

  /**
   * Retrieves orders for manager monitoring with pagination, search, and status filtering.
   */
  public static async getOrders(
    locationId: string,
    options: {
      search?: string;
      status?: OrderStatus;
      orderType?: OrderType;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { locationId };

    if (options.status) query.orderStatus = options.status;
    if (options.orderType) query.orderType = options.orderType;

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      query.$or = [
        { orderReference: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
      ];
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const [ordersDocs, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders: ordersDocs.map((o) => o.toSafeJSON()),
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieves active kitchen orders categorized by workflow pipelines with elapsed timers and delay flags.
   */
  public static async getKitchenTickets(locationId: string) {
    const now = new Date();
    const activeKitchenOrders = await Order.find({
      locationId,
      orderStatus: { $in: [OrderStatus.RECEIVED, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY] },
    }).sort({ createdAt: 1 });

    const newOrders: any[] = [];
    const preparingOrders: any[] = [];
    const readyOrders: any[] = [];
    const scheduledOrders: any[] = [];

    for (const order of activeKitchenOrders) {
      const elapsedMin = Math.round((now.getTime() - order.createdAt.getTime()) / 60000);
      const isDelayed = elapsedMin > 25;

      const ticket = {
        ...order.toSafeJSON(),
        elapsedMinutes: elapsedMin,
        isDelayed,
        urgency: isDelayed ? 'HIGH' : elapsedMin > 15 ? 'MEDIUM' : 'NORMAL',
      };

      if (order.orderType === OrderType.DINE_IN_PREORDER && order.scheduledFor && order.scheduledFor > now) {
        scheduledOrders.push(ticket);
      } else if (order.orderStatus === OrderStatus.RECEIVED || order.orderStatus === OrderStatus.CONFIRMED) {
        newOrders.push(ticket);
      } else if (order.orderStatus === OrderStatus.PREPARING) {
        preparingOrders.push(ticket);
      } else if (order.orderStatus === OrderStatus.READY) {
        readyOrders.push(ticket);
      }
    }

    return {
      locationId,
      counts: {
        new: newOrders.length,
        preparing: preparingOrders.length,
        ready: readyOrders.length,
        scheduled: scheduledOrders.length,
        totalActive: activeKitchenOrders.length,
      },
      tickets: {
        new: newOrders,
        preparing: preparingOrders,
        ready: readyOrders,
        scheduled: scheduledOrders,
      },
    };
  }

  /**
   * Retrieves reservations for manager monitoring with pagination, search, and date filtering.
   */
  public static async getReservations(
    locationId: string,
    options: {
      search?: string;
      status?: ReservationStatus;
      date?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { locationId };

    if (options.status) query.status = options.status;

    if (options.date) {
      const parsedDate = new Date(options.date);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(parsedDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.reservationDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      query.$or = [
        { reservationReference: searchRegex },
        { guestName: searchRegex },
        { guestPhone: searchRegex },
      ];
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const [resDocs, total] = await Promise.all([
      Reservation.find(query).sort({ startAt: 1 }).skip(skip).limit(limit),
      Reservation.countDocuments(query),
    ]);

    return {
      reservations: resDocs.map((r) => r.toSafeJSON()),
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieves reception operational monitoring data (arrivals, seated, waiting list, no-shows).
   */
  public static async getReceptionSummary(locationId: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [todayReservations, waitingListEntries] = await Promise.all([
      Reservation.find({
        locationId,
        reservationDate: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ startAt: 1 }),
      WaitingList.find({
        locationId,
        status: WaitingListStatus.WAITING,
      }).sort({ createdAt: 1 }),
    ]);

    const expectedArrivals: any[] = [];
    const checkedInGuests: any[] = [];
    const seatedGuests: any[] = [];
    const noShows: any[] = [];

    for (const r of todayReservations) {
      const safe = r.toSafeJSON();
      if (r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED) {
        expectedArrivals.push(safe);
      } else if (r.status === ReservationStatus.CHECKED_IN) {
        checkedInGuests.push(safe);
      } else if (r.status === ReservationStatus.SEATED) {
        seatedGuests.push(safe);
      } else if (r.status === ReservationStatus.NO_SHOW) {
        noShows.push(safe);
      }
    }

    const waitingParties = waitingListEntries.map((w) => {
      const waitMin = Math.round((now.getTime() - w.createdAt.getTime()) / 60000);
      return {
        ...w.toSafeJSON(),
        elapsedWaitMinutes: waitMin,
        isDelayed: waitMin > 20,
      };
    });

    return {
      locationId,
      counts: {
        expectedArrivals: expectedArrivals.length,
        checkedIn: checkedInGuests.length,
        seated: seatedGuests.length,
        waiting: waitingParties.length,
        noShows: noShows.length,
      },
      expectedArrivals,
      checkedInGuests,
      seatedGuests,
      waitingParties,
      noShows,
    };
  }

  /**
   * Retrieves floor operations summary (table statuses, active dining sessions, requests, cleaning).
   */
  public static async getFloorSummary(locationId: string) {
    const [tables, diningSessions, serviceRequests, cleaningTasks] = await Promise.all([
      Table.find({ locationId, isActive: true }).sort({ tableNumber: 1 }),
      DiningSession.find({ locationId, status: DiningSessionStatus.ACTIVE }).sort({ seatedAt: -1 }),
      ServiceRequest.find({ locationId, status: { $ne: ServiceRequestStatus.RESOLVED } }).sort({ createdAt: -1 }),
      CleaningTask.find({ locationId, status: { $ne: CleaningTaskStatus.COMPLETED } }).sort({ createdAt: -1 }),
    ]);

    const counts = {
      available: tables.filter((t) => t.status === TableStatus.AVAILABLE).length,
      occupied: tables.filter((t) => t.status === TableStatus.OCCUPIED).length,
      reserved: tables.filter((t) => t.status === TableStatus.RESERVED).length,
      cleaning: tables.filter((t) => t.status === TableStatus.AWAITING_CLEANING || t.status === TableStatus.CLEANING).length,
      total: tables.length,
    };

    return {
      locationId,
      counts,
      tables: tables.map((t) => t.toSafeJSON()),
      activeDiningSessions: diningSessions.map((d) => d.toSafeJSON()),
      serviceRequests: serviceRequests.map((s) => s.toSafeJSON()),
      cleaningTasks: cleaningTasks.map((c) => c.toSafeJSON()),
    };
  }

  /**
   * Retrieves VIP and Events monitoring overview.
   */
  public static async getVipSummary(locationId: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [upcomingBookings, pendingInquiries, activeProposals] = await Promise.all([
      VIPBooking.find({
        locationId,
        date: { $gte: startOfDay },
        status: { $in: ['CONFIRMED', 'PENDING'] },
      }).sort({ date: 1, startTime: 1 }).limit(10),
      EventInquiry.find({
        locationId,
        status: { $in: ['RECEIVED', 'IN_REVIEW'] },
      }).sort({ createdAt: -1 }).limit(10),
      EventProposal.find({
        locationId,
        status: 'SENT',
      }).sort({ expiresAt: 1 }).limit(10),
    ]);

    return {
      locationId,
      counts: {
        upcomingBookings: upcomingBookings.length,
        pendingInquiries: pendingInquiries.length,
        activeProposals: activeProposals.length,
      },
      upcomingBookings: upcomingBookings.map((b) => b.toSafeJSON()),
      pendingInquiries: pendingInquiries.map((i) => i.toSafeJSON()),
      activeProposals: activeProposals.map((p) => p.toSafeJSON()),
    };
  }

  /**
   * Retrieves operational staff assignments for the location.
   */
  public static async getStaffAssignments(locationId: string) {
    const [staffDocs, tables] = await Promise.all([
      Staff.find({ locationIds: locationId, status: 'ACTIVE' }).select('-passwordHash'),
      Table.find({ locationId, isActive: true, assignedStaffId: { $ne: null } }),
    ]);

    // Group assigned tables by staff member
    const tablesByStaff: Record<string, string[]> = {};
    for (const t of tables) {
      if (t.assignedStaffId) {
        if (!tablesByStaff[t.assignedStaffId]) tablesByStaff[t.assignedStaffId] = [];
        tablesByStaff[t.assignedStaffId].push(t.tableNumber);
      }
    }

    const assignments = staffDocs.map((s) => {
      const assignedTables = tablesByStaff[s._id.toString()] || [];
      return {
        ...s.toSafeJSON(),
        operationalAssignment: assignedTables.length > 0 ? `Tables: ${assignedTables.join(', ')}` : 'Floor Roaming / Standby',
        assignedTables,
      };
    });

    return {
      locationId,
      totalStaff: staffDocs.length,
      assignments,
    };
  }

  /**
   * Generates daily operational reports aggregating real MongoDB collections.
   */
  public static async generateOperationalReport(
    locationId: string,
    dateRange: 'today' | 'yesterday' | '7days' | 'custom',
    startDateStr?: string,
    endDateStr?: string,
    staff?: SafeStaff
  ): Promise<ManagerReportData> {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (dateRange === 'yesterday') {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === '7days') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'custom' && startDateStr && endDateStr) {
      start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
    } else {
      // today default
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // 1. Orders within period
    const orders = await Order.find({
      locationId,
      createdAt: { $gte: start, $lte: end },
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.orderStatus === OrderStatus.COMPLETED).length;
    const cancelledOrders = orders.filter((o) => o.orderStatus === OrderStatus.CANCELLED).length;
    const totalRevenueMinor = orders
      .filter((o) => o.orderStatus === OrderStatus.COMPLETED)
      .reduce((sum, o) => sum + (o.totalMinor || 0), 0);

    // Calculate average preparation time (minutes from createdAt to readyAt)
    const prepOrders = orders.filter((o) => o.readyAt && o.createdAt);
    const averagePrepTimeMinutes =
      prepOrders.length > 0
        ? Math.round(
            prepOrders.reduce((sum, o) => sum + (o.readyAt!.getTime() - o.createdAt.getTime()), 0) /
              (prepOrders.length * 60000)
          )
        : 18; // Default operational baseline if no orders ready yet

    // 2. Reservations within period
    const reservations = await Reservation.find({
      locationId,
      reservationDate: { $gte: start, $lte: end },
    });

    const totalReservations = reservations.length;
    const noShows = reservations.filter((r) => r.status === ReservationStatus.NO_SHOW).length;

    // 3. Dining Sessions within period
    const diningSessions = await DiningSession.find({
      locationId,
      seatedAt: { $gte: start, $lte: end },
    });
    const completedDiningSessions = diningSessions.filter(
      (d) => d.status === DiningSessionStatus.CLOSED || d.status === DiningSessionStatus.SERVICE_COMPLETED
    ).length;

    // Table Turnover Time (minutes from seatedAt to completedAt)
    const completedSessions = diningSessions.filter((d) => d.completedAt && d.seatedAt);
    const tableTurnoverTimeMinutes =
      completedSessions.length > 0
        ? Math.round(
            completedSessions.reduce((sum, d) => sum + (d.completedAt!.getTime() - d.seatedAt.getTime()), 0) /
              (completedSessions.length * 60000)
          )
        : 75; // Baseline luxury dining turnover (75 mins)

    // 4. VIP & Events
    const vipBookings = await VIPBooking.countDocuments({
      locationId,
      date: { $gte: start, $lte: end },
    });
    const eventInquiries = await EventInquiry.countDocuments({
      locationId,
      createdAt: { $gte: start, $lte: end },
    });

    // 5. Service requests resolved
    const serviceRequestsResolved = await ServiceRequest.countDocuments({
      locationId,
      status: ServiceRequestStatus.RESOLVED,
      updatedAt: { $gte: start, $lte: end },
    });

    // 6. Operational Alerts
    const alertsTriggered = await OperationalAlert.countDocuments({
      locationId,
      createdAt: { $gte: start, $lte: end },
    });
    const alertsResolved = await OperationalAlert.countDocuments({
      locationId,
      status: AlertStatus.RESOLVED,
      resolvedAt: { $gte: start, $lte: end },
    });

    // Daily breakdown for period
    const dailyBreakdown: any[] = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = orders.filter((o) => o.createdAt >= dayStart && o.createdAt <= dayEnd);
      const dayRev = dayOrders
        .filter((o) => o.orderStatus === OrderStatus.COMPLETED)
        .reduce((sum, o) => sum + (o.totalMinor || 0), 0);
      const dayRes = reservations.filter((r) => r.reservationDate >= dayStart && r.reservationDate <= dayEnd).length;
      const daySessions = diningSessions.filter((d) => d.seatedAt >= dayStart && d.seatedAt <= dayEnd).length;

      dailyBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        orders: dayOrders.length,
        revenueMinor: dayRev,
        reservations: dayRes,
        diningSessions: daySessions,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      locationId,
      locationName: getLocationName(locationId),
      dateRange,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      generatedAt: now.toISOString(),
      generatedBy: {
        id: staff?.id || 'system',
        name: staff ? `${staff.firstName} ${staff.lastName}` : 'Operations Manager',
        role: staff?.role || 'MANAGER',
      },
      metrics: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalRevenueMinor,
        currency: 'LKR',
        averagePrepTimeMinutes,
        totalReservations,
        completedDiningSessions,
        noShows,
        tableTurnoverTimeMinutes,
        vipBookings,
        eventInquiries,
        serviceRequestsResolved,
        alertsTriggered,
        alertsResolved,
      },
      dailyBreakdown,
    };
  }

  /**
   * Generates standard RFC-4180 CSV export for operational reports.
   */
  public static async generateReportCSV(
    locationId: string,
    dateRange: 'today' | 'yesterday' | '7days' | 'custom',
    startDateStr?: string,
    endDateStr?: string,
    staff?: SafeStaff
  ): Promise<string> {
    const report = await this.generateOperationalReport(locationId, dateRange, startDateStr, endDateStr, staff);

    const escapeCSV = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const lines: string[] = [];
    lines.push('AURELLE RESTAURANT MANAGEMENT PLATFORM - OPERATIONAL REPORT');
    lines.push(`Location,${escapeCSV(report.locationName)} (${escapeCSV(report.locationId)})`);
    lines.push(`Period,${escapeCSV(report.dateRange)} (${escapeCSV(report.periodStart)} to ${escapeCSV(report.periodEnd)})`);
    lines.push(`Generated At,${escapeCSV(report.generatedAt)}`);
    lines.push(`Generated By,${escapeCSV(report.generatedBy.name)} (${escapeCSV(report.generatedBy.role)})`);
    lines.push('');
    lines.push('OPERATIONAL METRIC,VALUE,UNIT');
    lines.push(`Total Orders,${report.metrics.totalOrders},Count`);
    lines.push(`Completed Orders,${report.metrics.completedOrders},Count`);
    lines.push(`Cancelled Orders,${report.metrics.cancelledOrders},Count`);
    lines.push(`Total Revenue,${(report.metrics.totalRevenueMinor / 100).toFixed(2)},${report.metrics.currency}`);
    lines.push(`Average Preparation Time,${report.metrics.averagePrepTimeMinutes},Minutes`);
    lines.push(`Total Reservations,${report.metrics.totalReservations},Count`);
    lines.push(`Completed Dining Sessions,${report.metrics.completedDiningSessions},Count`);
    lines.push(`No-Shows,${report.metrics.noShows},Count`);
    lines.push(`Average Table Turnover Time,${report.metrics.tableTurnoverTimeMinutes},Minutes`);
    lines.push(`VIP Room Bookings,${report.metrics.vipBookings},Count`);
    lines.push(`Event Inquiries,${report.metrics.eventInquiries},Count`);
    lines.push(`Service Requests Resolved,${report.metrics.serviceRequestsResolved},Count`);
    lines.push(`Operational Alerts Triggered,${report.metrics.alertsTriggered},Count`);
    lines.push(`Operational Alerts Resolved,${report.metrics.alertsResolved},Count`);
    lines.push('');
    lines.push('DAILY BREAKDOWN');
    lines.push('Date,Orders,Revenue (LKR),Reservations,Dining Sessions');

    for (const d of report.dailyBreakdown) {
      lines.push(`${escapeCSV(d.date)},${d.orders},${(d.revenueMinor / 100).toFixed(2)},${d.reservations},${d.diningSessions}`);
    }

    if (staff) {
      await recordStaffAudit({
        actorId: staff.id,
        actorName: `${staff.firstName} ${staff.lastName}`,
        actorEmail: staff.email,
        targetStaffId: staff.id,
        targetStaffName: `${staff.firstName} ${staff.lastName}`,
        targetStaffEmail: staff.email,
        action: 'OPERATIONAL_REPORT_EXPORTED' as any,
        details: `Manager exported operational report for location ${locationId} (${report.dateRange})`,
        locationId,
      });
    }

    return lines.join('\r\n');
  }

  /**
   * Retrieves scoped audit activity history for the location.
   */
  public static async getActivityHistory(
    locationId: string,
    options: {
      search?: string;
      action?: string;
      staffId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = {
      $or: [{ locationId }, { locationId: null }],
    };

    if (options.action) query.action = options.action;
    if (options.staffId) query.actorId = options.staffId;

    if (options.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      query.$and = [
        {
          $or: [
            { actorName: searchRegex },
            { actorEmail: searchRegex },
            { details: searchRegex },
            { action: searchRegex },
          ],
        },
      ];
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      StaffAuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      StaffAuditLog.countDocuments(query),
    ]);

    // Sanitize records: remove sensitive IP or internal system metadata
    const sanitizedLogs = logs.map((log) => ({
      id: log._id.toString(),
      timestamp: log.createdAt.toISOString(),
      actorName: log.actorName,
      actorEmail: log.actorEmail,
      action: log.action,
      details: log.details,
      targetStaffName: log.targetStaffName,
      locationId: log.locationId,
    }));

    return {
      activities: sanitizedLogs,
      total,
      page,
      limit,
    };
  }
}
