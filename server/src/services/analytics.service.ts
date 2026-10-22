import mongoose from 'mongoose';
import { Order } from '../models/order.model';
import { Reservation } from '../models/reservation.model';
import { Table } from '../models/table.model';
import { DiningSession } from '../models/diningSession.model';
import { CleaningTask } from '../models/cleaningTask.model';
import { ServiceRequest } from '../models/serviceRequest.model';
import { VIPBooking } from '../models/vipBooking.model';
import { EventInquiry } from '../models/eventInquiry.model';
import { EventProposal } from '../models/eventProposal.model';
import { EventBooking } from '../models/eventBooking.model';
import { Staff } from '../models/staff.model';
import { OrderStatus, OrderType } from '../types/order';
import { ReservationStatus } from '../types/reservation';
import { DiningSessionStatus } from '../types/floor';
import {
  AnalyticsDatePreset,
  IExecutiveOverview,
  ISalesAnalytics,
  IOrderAnalytics,
  IMenuAnalytics,
  IKitchenAnalytics,
  IReservationAnalytics,
  ITableAnalytics,
  IVipEventAnalytics,
  IStaffAnalytics,
  ICustomerAnalytics,
  IMenuPerformanceItem,
} from '../types/analytics';

export class AnalyticsService {
  /**
   * Helper to normalize date preset into UTC start and end bounds
   */
  public static parseDateRange(
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): { startDate: Date; endDate: Date; preset: AnalyticsDatePreset } {
    const now = new Date();

    if (preset === 'custom' && customStart && customEnd) {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return { startDate: s, endDate: e, preset };
    }

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
        break;
      case 'last7days':
        start.setDate(now.getDate() - 6);
        break;
      case 'last30days':
        start.setDate(now.getDate() - 29);
        break;
      case 'thisMonth':
        start.setDate(1);
        break;
      case 'lastMonth': {
        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        end.setTime(firstDayOfCurrentMonth.getTime() - 1);
        start.setFullYear(end.getFullYear(), end.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;
      }
      default:
        start.setDate(now.getDate() - 29);
    }

    return { startDate: start, endDate: end, preset };
  }

  /**
   * Executive Overview
   */
  public static async getExecutiveOverview(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<IExecutiveOverview> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    // 1. Orders and Revenue
    const orders = await Order.find({
      locationId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const completedOrders = orders.filter((o) => o.orderStatus === OrderStatus.COMPLETED);
    const cancelledOrders = orders.filter((o) => o.orderStatus === OrderStatus.CANCELLED);
    const activeOrders = orders.filter((o) =>
      [OrderStatus.RECEIVED, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY].includes(o.orderStatus)
    );

    const grossMinor = completedOrders.reduce((acc, o) => acc + (o.totalMinor || 0), 0);
    const netMinor = completedOrders.reduce((acc, o) => acc + (o.subtotalMinor || 0), 0);
    const taxMinor = completedOrders.reduce((acc, o) => acc + (o.taxMinor || 0), 0);
    const serviceChargeMinor = completedOrders.reduce((acc, o) => acc + (o.serviceChargeMinor || 0), 0);

    const totalOrders = orders.length;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 1000) / 10 : 0;
    const aovMinor = completedOrders.length > 0 ? Math.round(grossMinor / completedOrders.length) : 0;

    // 2. Reservations
    const reservations = await Reservation.find({
      locationId,
      reservationDate: { $gte: startDate, $lte: endDate },
    }).lean();

    const confirmedRes = reservations.filter((r) => r.status === ReservationStatus.CONFIRMED).length;
    const seatedRes = reservations.filter((r) => r.status === ReservationStatus.SEATED).length;
    const completedRes = reservations.filter((r) => r.status === ReservationStatus.COMPLETED).length;
    const cancelledRes = reservations.filter((r) => r.status === ReservationStatus.CANCELLED).length;
    const noShowRes = reservations.filter((r) => r.status === ReservationStatus.NO_SHOW).length;
    const totalRes = reservations.length;
    const totalGuests = reservations.reduce((acc, r) => acc + (r.guestCount || 0), 0);

    const noShowRate = totalRes > 0 ? Math.round((noShowRes / totalRes) * 1000) / 10 : 0;
    const cancellationRate = totalRes > 0 ? Math.round((cancelledRes / totalRes) * 1000) / 10 : 0;

    // 3. Table Utilization
    const diningSessions = await DiningSession.find({
      locationId,
      seatedAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const totalTables = await Table.countDocuments({ locationId, isActive: true });
    const activeSessions = diningSessions.filter((s) => s.status === DiningSessionStatus.ACTIVE).length;
    const completedSessions = diningSessions.filter(
      (s) => s.status === DiningSessionStatus.CLOSED || s.status === DiningSessionStatus.SERVICE_COMPLETED
    );

    let totalDwellMinutes = 0;
    let completedWithDuration = 0;
    for (const session of completedSessions) {
      if (session.completedAt && session.seatedAt) {
        const mins = Math.round((new Date(session.completedAt).getTime() - new Date(session.seatedAt).getTime()) / 60000);
        if (mins > 0 && mins < 480) {
          totalDwellMinutes += mins;
          completedWithDuration++;
        }
      }
    }
    const avgDwellMinutes = completedWithDuration > 0 ? Math.round(totalDwellMinutes / completedWithDuration) : 90;
    const utilizationRate = totalTables > 0 ? Math.min(100, Math.round((activeSessions / totalTables) * 100)) : 0;

    // 4. VIP & Events
    const [vipBookings, eventInquiries, eventProposals, eventBookings] = await Promise.all([
      VIPBooking.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      EventInquiry.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      EventProposal.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      EventBooking.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
    ]);

    const vipRevenueMinor = vipBookings.reduce((acc, b) => acc + (b.quotedPriceMinor || 0), 0);
    const eventRevenueMinor = eventBookings.reduce((acc, b) => acc + (b.agreedTotalMinor || 0), 0);
    const eventConversionRate =
      eventInquiries.length > 0 ? Math.round((eventBookings.length / eventInquiries.length) * 1000) / 10 : 0;

    // 5. Staff
    const activeStaffCount = await Staff.countDocuments({ locationIds: locationId, status: 'ACTIVE' });
    const [cleaningDone, serviceResolved] = await Promise.all([
      CleaningTask.countDocuments({ locationId, status: 'COMPLETED', createdAt: { $gte: startDate, $lte: endDate } }),
      ServiceRequest.countDocuments({ locationId, status: 'RESOLVED', createdAt: { $gte: startDate, $lte: endDate } }),
    ]);

    // 6. Trend data points grouped by date
    const trendMap = new Map<string, { revenueMinor: number; orderCount: number; reservationCount: number }>();
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dateKey = cur.toISOString().split('T')[0];
      trendMap.set(dateKey, { revenueMinor: 0, orderCount: 0, reservationCount: 0 });
      cur.setDate(cur.getDate() + 1);
    }

    for (const o of completedOrders) {
      const d = new Date(o.createdAt).toISOString().split('T')[0];
      if (trendMap.has(d)) {
        const item = trendMap.get(d)!;
        item.revenueMinor += o.totalMinor || 0;
        item.orderCount += 1;
      }
    }

    for (const r of reservations) {
      const d = new Date(r.reservationDate).toISOString().split('T')[0];
      if (trendMap.has(d)) {
        trendMap.get(d)!.reservationCount += 1;
      }
    }

    const trend = Array.from(trendMap.entries()).map(([date, val]) => ({
      date,
      revenueMinor: val.revenueMinor,
      orderCount: val.orderCount,
      reservationCount: val.reservationCount,
    }));

    return {
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        preset,
      },
      locationId,
      revenue: {
        grossMinor,
        netMinor,
        taxMinor,
        serviceChargeMinor,
        currency: 'LKR',
      },
      orders: {
        total: totalOrders,
        completed: completedOrders.length,
        cancelled: cancelledOrders.length,
        active: activeOrders.length,
        completionRate,
        aovMinor,
      },
      reservations: {
        total: totalRes,
        confirmed: confirmedRes,
        seated: seatedRes,
        completed: completedRes,
        cancelled: cancelledRes,
        noShow: noShowRes,
        noShowRate,
        cancellationRate,
        totalGuests,
      },
      tables: {
        activeSessions,
        completedSessions: completedSessions.length,
        avgDwellMinutes,
        totalTables,
        utilizationRate,
      },
      vipEvents: {
        vipBookings: vipBookings.length,
        vipRevenueMinor,
        eventInquiries: eventInquiries.length,
        eventProposals: eventProposals.length,
        eventBookings: eventBookings.length,
        eventConversionRate,
        eventRevenueMinor,
      },
      staff: {
        activeStaffCount,
        cleaningTasksCompleted: cleaningDone,
        serviceRequestsResolved: serviceResolved,
      },
      trend,
    };
  }

  /**
   * Sales Analytics
   */
  public static async getSalesAnalytics(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<ISalesAnalytics> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    const orders = await Order.find({
      locationId,
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: OrderStatus.COMPLETED,
    }).lean();

    const totalGrossMinor = orders.reduce((sum, o) => sum + (o.totalMinor || 0), 0);
    const totalNetMinor = orders.reduce((sum, o) => sum + (o.subtotalMinor || 0), 0);
    const totalTaxMinor = orders.reduce((sum, o) => sum + (o.taxMinor || 0), 0);
    const totalServiceChargeMinor = orders.reduce((sum, o) => sum + (o.serviceChargeMinor || 0), 0);
    const orderCount = orders.length;
    const averageOrderValueMinor = orderCount > 0 ? Math.round(totalGrossMinor / orderCount) : 0;

    // By Order Type
    const typeMap = new Map<string, { count: number; revenueMinor: number }>();
    for (const o of orders) {
      const t = o.orderType || OrderType.TAKEAWAY;
      const cur = typeMap.get(t) || { count: 0, revenueMinor: 0 };
      cur.count += 1;
      cur.revenueMinor += o.totalMinor || 0;
      typeMap.set(t, cur);
    }

    const byOrderType = Array.from(typeMap.entries()).map(([orderType, data]) => ({
      orderType,
      count: data.count,
      revenueMinor: data.revenueMinor,
      percentage: totalGrossMinor > 0 ? Math.round((data.revenueMinor / totalGrossMinor) * 1000) / 10 : 0,
    }));

    // By Payment Method
    const payMap = new Map<string, { count: number; revenueMinor: number }>();
    for (const o of orders) {
      const pm = (o as any).paymentMethod || 'ONLINE_PAYMENT';
      const cur = payMap.get(pm) || { count: 0, revenueMinor: 0 };
      cur.count += 1;
      cur.revenueMinor += o.totalMinor || 0;
      payMap.set(pm, cur);
    }

    const byPaymentMethod = Array.from(payMap.entries()).map(([paymentMethod, data]) => ({
      paymentMethod,
      count: data.count,
      revenueMinor: data.revenueMinor,
    }));

    // Hourly Distribution (0 - 23)
    const hourlyArr = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orderCount: 0,
      revenueMinor: 0,
    }));

    for (const o of orders) {
      const hour = new Date(o.createdAt).getHours();
      if (hourlyArr[hour]) {
        hourlyArr[hour].orderCount += 1;
        hourlyArr[hour].revenueMinor += o.totalMinor || 0;
      }
    }

    // Daily breakdown
    const dailyMap = new Map<string, { grossMinor: number; netMinor: number; taxMinor: number; serviceChargeMinor: number; orders: number }>();
    for (const o of orders) {
      const d = new Date(o.createdAt).toISOString().split('T')[0];
      const cur = dailyMap.get(d) || { grossMinor: 0, netMinor: 0, taxMinor: 0, serviceChargeMinor: 0, orders: 0 };
      cur.grossMinor += o.totalMinor || 0;
      cur.netMinor += o.subtotalMinor || 0;
      cur.taxMinor += o.taxMinor || 0;
      cur.serviceChargeMinor += o.serviceChargeMinor || 0;
      cur.orders += 1;
      dailyMap.set(d, cur);
    }

    const dailyBreakdown = Array.from(dailyMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, val]) => ({
        date,
        ...val,
      }));

    return {
      totalGrossMinor,
      totalNetMinor,
      totalTaxMinor,
      totalServiceChargeMinor,
      orderCount,
      averageOrderValueMinor,
      byOrderType,
      byPaymentMethod,
      hourlyDistribution: hourlyArr,
      dailyBreakdown,
    };
  }

  /**
   * Order Analytics
   */
  public static async getOrderAnalytics(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<IOrderAnalytics> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    const orders = await Order.find({
      locationId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.orderStatus === OrderStatus.COMPLETED).length;
    const cancelledOrders = orders.filter((o) => o.orderStatus === OrderStatus.CANCELLED).length;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 1000) / 10 : 0;
    const cancellationRate = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 1000) / 10 : 0;

    // Prep time calculation
    let totalPrepMinutes = 0;
    let prepCount = 0;
    for (const o of orders) {
      if (o.preparationStartedAt && o.readyAt) {
        const mins = Math.round((new Date(o.readyAt).getTime() - new Date(o.preparationStartedAt).getTime()) / 60000);
        if (mins > 0 && mins < 240) {
          totalPrepMinutes += mins;
          prepCount++;
        }
      }
    }
    const averagePrepTimeMinutes = prepCount > 0 ? Math.round(totalPrepMinutes / prepCount) : 18;

    // By status
    const statusMap = new Map<string, number>();
    for (const o of orders) {
      statusMap.set(o.orderStatus, (statusMap.get(o.orderStatus) || 0) + 1);
    }
    const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 1000) / 10 : 0,
    }));

    // By type
    const typeMap = new Map<string, number>();
    for (const o of orders) {
      typeMap.set(o.orderType, (typeMap.get(o.orderType) || 0) + 1);
    }
    const byType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 1000) / 10 : 0,
    }));

    // Peak hours
    const peakMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) peakMap.set(i, 0);
    for (const o of orders) {
      const h = new Date(o.createdAt).getHours();
      peakMap.set(h, (peakMap.get(h) || 0) + 1);
    }
    const peakHours = Array.from(peakMap.entries()).map(([hour, ordersCount]) => ({
      hour,
      orders: ordersCount,
    }));

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      completionRate,
      cancellationRate,
      averagePrepTimeMinutes,
      byStatus,
      byType,
      peakHours,
    };
  }

  /**
   * Menu Performance Analytics
   */
  public static async getMenuAnalytics(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<IMenuAnalytics> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    const orders = await Order.find({
      locationId,
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: OrderStatus.COMPLETED,
    }).lean();

    const dishMap = new Map<string, { id: string; name: string; quantity: number; revenueMinor: number; unitPriceMinor: number }>();
    let totalDishesSold = 0;
    let totalMenuRevenueMinor = 0;

    for (const order of orders) {
      for (const item of order.items || []) {
        const key = item.dishName || item.menuItemId;
        const cur = dishMap.get(key) || {
          id: item.menuItemId,
          name: item.dishName,
          quantity: 0,
          revenueMinor: 0,
          unitPriceMinor: item.unitPriceMinor || 0,
        };
        cur.quantity += item.quantity || 1;
        cur.revenueMinor += item.lineTotalMinor || (item.unitPriceMinor * (item.quantity || 1));
        totalDishesSold += item.quantity || 1;
        totalMenuRevenueMinor += item.lineTotalMinor || 0;
        dishMap.set(key, cur);
      }
    }

    const dishList: IMenuPerformanceItem[] = Array.from(dishMap.values()).map((d) => ({
      id: d.id,
      name: d.name,
      category: 'Signature Courses', // default category
      priceMinor: d.unitPriceMinor,
      quantitySold: d.quantity,
      totalRevenueMinor: d.revenueMinor,
      portionOfSales: totalMenuRevenueMinor > 0 ? Math.round((d.revenueMinor / totalMenuRevenueMinor) * 1000) / 10 : 0,
    }));

    const sortedByRevenue = [...dishList].sort((a, b) => b.totalRevenueMinor - a.totalRevenueMinor);
    const topSellingDishes = sortedByRevenue.slice(0, 10);
    const leastSellingDishes = [...dishList].sort((a, b) => a.totalRevenueMinor - b.totalRevenueMinor).slice(0, 10);

    // Category breakdown
    const categoryMap = new Map<string, { dishesSold: number; revenueMinor: number }>();
    for (const dish of dishList) {
      const cat = dish.category || 'Mains';
      const cur = categoryMap.get(cat) || { dishesSold: 0, revenueMinor: 0 };
      cur.dishesSold += dish.quantitySold;
      cur.revenueMinor += dish.totalRevenueMinor;
      categoryMap.set(cat, cur);
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, val]) => ({
      category,
      dishesSold: val.dishesSold,
      revenueMinor: val.revenueMinor,
      percentage: totalMenuRevenueMinor > 0 ? Math.round((val.revenueMinor / totalMenuRevenueMinor) * 1000) / 10 : 0,
    }));

    return {
      totalDishesSold,
      totalMenuRevenueMinor,
      topSellingDishes,
      leastSellingDishes,
      categoryBreakdown,
    };
  }

  /**
   * Kitchen Analytics
   */
  public static async getKitchenAnalytics(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<IKitchenAnalytics> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    const orders = await Order.find({
      locationId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const totalTickets = orders.length;
    const completedTickets = orders.filter((o) => o.orderStatus === OrderStatus.COMPLETED).length;

    let ordersUnder20Mins = 0;
    let orders20To40Mins = 0;
    let ordersOver40Mins = 0;
    let totalPrepMinutes = 0;
    let countedPrep = 0;

    for (const o of orders) {
      if (o.preparationStartedAt && (o.readyAt || o.completedAt)) {
        const finish = o.readyAt || o.completedAt!;
        const mins = Math.round((new Date(finish).getTime() - new Date(o.preparationStartedAt).getTime()) / 60000);
        if (mins >= 0 && mins < 300) {
          totalPrepMinutes += mins;
          countedPrep++;
          if (mins <= 20) ordersUnder20Mins++;
          else if (mins <= 40) orders20To40Mins++;
          else ordersOver40Mins++;
        }
      }
    }

    const averagePrepMinutes = countedPrep > 0 ? Math.round(totalPrepMinutes / countedPrep) : 22;

    // Station / type load
    const stationMap = new Map<string, { count: number; totalMins: number }>();
    for (const o of orders) {
      const type = o.orderType || 'DINE_IN';
      const cur = stationMap.get(type) || { count: 0, totalMins: 0 };
      cur.count++;
      if (o.preparationStartedAt && (o.readyAt || o.completedAt)) {
        const mins = Math.round((new Date(o.readyAt || o.completedAt!).getTime() - new Date(o.preparationStartedAt).getTime()) / 60000);
        if (mins > 0 && mins < 300) cur.totalMins += mins;
      }
      stationMap.set(type, cur);
    }

    const stationLoad = Array.from(stationMap.entries()).map(([type, val]) => ({
      type,
      count: val.count,
      avgMinutes: val.count > 0 && val.totalMins > 0 ? Math.round(val.totalMins / val.count) : averagePrepMinutes,
    }));

    // Hourly throughput
    const hourlyThroughput = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      completed: 0,
    }));

    for (const o of orders) {
      if (o.readyAt || o.completedAt) {
        const h = new Date(o.readyAt || o.completedAt!).getHours();
        if (hourlyThroughput[h]) hourlyThroughput[h].completed++;
      }
    }

    return {
      totalTickets,
      completedTickets,
      averagePrepMinutes,
      ordersUnder20Mins,
      orders20To40Mins,
      ordersOver40Mins,
      stationLoad,
      hourlyThroughput,
    };
  }

  /**
   * Reservation Analytics
   */
  public static async getReservationAnalytics(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<IReservationAnalytics> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    const reservations = await Reservation.find({
      locationId,
      reservationDate: { $gte: startDate, $lte: endDate },
    }).lean();

    const totalBookings = reservations.length;
    const confirmedBookings = reservations.filter((r) => r.status === ReservationStatus.CONFIRMED).length;
    const seatedBookings = reservations.filter((r) => r.status === ReservationStatus.SEATED || r.status === ReservationStatus.COMPLETED).length;
    const cancelledBookings = reservations.filter((r) => r.status === ReservationStatus.CANCELLED).length;
    const noShowBookings = reservations.filter((r) => r.status === ReservationStatus.NO_SHOW).length;

    const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 1000) / 10 : 0;
    const noShowRate = totalBookings > 0 ? Math.round((noShowBookings / totalBookings) * 1000) / 10 : 0;

    const totalGuests = reservations.reduce((acc, r) => acc + (r.guestCount || 0), 0);
    const averagePartySize = totalBookings > 0 ? Math.round((totalGuests / totalBookings) * 10) / 10 : 2.5;

    // Party size buckets
    let p1_2 = 0;
    let p3_4 = 0;
    let p5_6 = 0;
    let p7plus = 0;

    for (const r of reservations) {
      const g = r.guestCount || 2;
      if (g <= 2) p1_2++;
      else if (g <= 4) p3_4++;
      else if (g <= 6) p5_6++;
      else p7plus++;
    }

    const partySizeDistribution = [
      { bucket: '1-2 Guests', count: p1_2, percentage: totalBookings > 0 ? Math.round((p1_2 / totalBookings) * 100) : 0 },
      { bucket: '3-4 Guests', count: p3_4, percentage: totalBookings > 0 ? Math.round((p3_4 / totalBookings) * 100) : 0 },
      { bucket: '5-6 Guests', count: p5_6, percentage: totalBookings > 0 ? Math.round((p5_6 / totalBookings) * 100) : 0 },
      { bucket: '7+ Guests', count: p7plus, percentage: totalBookings > 0 ? Math.round((p7plus / totalBookings) * 100) : 0 },
    ];

    // Peak time slots
    const slotMap = new Map<string, number>();
    for (const r of reservations) {
      if (r.startAt) {
        const d = new Date(r.startAt);
        const slot = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        slotMap.set(slot, (slotMap.get(slot) || 0) + 1);
      }
    }

    const peakTimeSlots = Array.from(slotMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([timeSlot, count]) => ({ timeSlot, count }));

    return {
      totalBookings,
      confirmedBookings,
      seatedBookings,
      cancelledBookings,
      noShowBookings,
      cancellationRate,
      noShowRate,
      averagePartySize,
      partySizeDistribution,
      peakTimeSlots,
    };
  }

  /**
   * Table Utilization Analytics
   */
  public static async getTableUtilization(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<ITableAnalytics> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    const [tables, diningSessions] = await Promise.all([
      Table.find({ locationId, isActive: true }).lean(),
      DiningSession.find({
        locationId,
        seatedAt: { $gte: startDate, $lte: endDate },
      }).lean(),
    ]);

    const totalTables = tables.length;
    const totalDiningSessions = diningSessions.length;

    let totalDwellMinutes = 0;
    let completedCount = 0;

    for (const session of diningSessions) {
      if (session.seatedAt && session.completedAt) {
        const mins = Math.round((new Date(session.completedAt).getTime() - new Date(session.seatedAt).getTime()) / 60000);
        if (mins > 0 && mins < 600) {
          totalDwellMinutes += mins;
          completedCount++;
        }
      }
    }

    const averageDwellMinutes = completedCount > 0 ? Math.round(totalDwellMinutes / completedCount) : 85;

    const daysCount = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    const turnoverRatePerDay =
      totalTables > 0 ? Math.round((totalDiningSessions / (totalTables * daysCount)) * 10) / 10 : 0;

    // Peak hour occupancy
    const hourOccupancy = Array.from({ length: 24 }, (_, i) => ({ hour: i, occupiedTables: 0 }));
    for (const s of diningSessions) {
      if (s.seatedAt) {
        const h = new Date(s.seatedAt).getHours();
        if (hourOccupancy[h]) hourOccupancy[h].occupiedTables++;
      }
    }

    return {
      totalTables,
      totalDiningSessions,
      averageDwellMinutes,
      turnoverRatePerDay,
      peakHourOccupancy: hourOccupancy,
    };
  }

  /**
   * VIP & Event Analytics
   */
  public static async getVipAndEventAnalytics(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<IVipEventAnalytics> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    const [vipBookings, inquiries, proposals, bookings] = await Promise.all([
      VIPBooking.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      EventInquiry.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      EventProposal.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      EventBooking.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
    ]);

    const vipRevenueMinor = vipBookings.reduce((sum, b) => sum + (b.quotedPriceMinor || 0), 0);
    const averageVipBookingValueMinor = vipBookings.length > 0 ? Math.round(vipRevenueMinor / vipBookings.length) : 0;

    const eventRevenueMinor = bookings.reduce((sum, b) => sum + (b.agreedTotalMinor || 0), 0);
    const eventConversionRate =
      inquiries.length > 0 ? Math.round((bookings.length / inquiries.length) * 1000) / 10 : 0;

    return {
      vipBookingsCount: vipBookings.length,
      vipRevenueMinor,
      averageVipBookingValueMinor,
      eventInquiriesCount: inquiries.length,
      eventProposalsCount: proposals.length,
      eventBookingsConfirmed: bookings.length,
      eventConversionRate,
      eventRevenueMinor,
    };
  }

  /**
   * Staff Operations Analytics
   */
  public static async getStaffAnalytics(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<IStaffAnalytics> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    const [staffList, cleaningTasks, serviceRequests] = await Promise.all([
      Staff.find({ locationIds: locationId, status: 'ACTIVE' }).lean(),
      CleaningTask.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      ServiceRequest.find({ locationId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
    ]);

    const roleMap = new Map<string, number>();
    for (const s of staffList) {
      roleMap.set(s.role, (roleMap.get(s.role) || 0) + 1);
    }
    const byRole = Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));

    const cleaningCompleted = cleaningTasks.filter((t) => t.status === 'COMPLETED').length;
    const cleaningPending = cleaningTasks.length - cleaningCompleted;
    const cleaningRate = cleaningTasks.length > 0 ? Math.round((cleaningCompleted / cleaningTasks.length) * 100) : 100;

    const requestsResolved = serviceRequests.filter((r) => r.status === 'RESOLVED').length;
    const requestsOpen = serviceRequests.length - requestsResolved;
    const resolutionRate =
      serviceRequests.length > 0 ? Math.round((requestsResolved / serviceRequests.length) * 100) : 100;

    return {
      totalStaffActive: staffList.length,
      byRole,
      cleaningTasks: {
        total: cleaningTasks.length,
        completed: cleaningCompleted,
        pending: cleaningPending,
        completionRate: cleaningRate,
      },
      serviceRequests: {
        total: serviceRequests.length,
        resolved: requestsResolved,
        open: requestsOpen,
        resolutionRate,
      },
    };
  }

  /**
   * Customer Analytics
   */
  public static async getCustomerAnalytics(
    locationId: string,
    preset: AnalyticsDatePreset = 'last30days',
    customStart?: string,
    customEnd?: string
  ): Promise<ICustomerAnalytics> {
    const { startDate, endDate } = this.parseDateRange(preset, customStart, customEnd);

    const orders = await Order.find({
      locationId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const customerMap = new Map<string, { customerName: string; customerEmail: string; orderCount: number; totalSpendMinor: number }>();

    for (const o of orders) {
      const email = o.customerEmail ? o.customerEmail.toLowerCase().trim() : 'guest@aurelle.luxury';
      const cur = customerMap.get(email) || {
        customerName: o.customerName || 'Aurelle Guest',
        customerEmail: email,
        orderCount: 0,
        totalSpendMinor: 0,
      };
      cur.orderCount += 1;
      if (o.orderStatus === OrderStatus.COMPLETED) {
        cur.totalSpendMinor += o.totalMinor || 0;
      }
      customerMap.set(email, cur);
    }

    const totalUniqueCustomers = customerMap.size;
    let repeatCustomers = 0;
    for (const c of customerMap.values()) {
      if (c.orderCount > 1) repeatCustomers++;
    }
    const newCustomers = totalUniqueCustomers - repeatCustomers;
    const repeatRate = totalUniqueCustomers > 0 ? Math.round((repeatCustomers / totalUniqueCustomers) * 1000) / 10 : 0;

    const topSpenders = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpendMinor - a.totalSpendMinor)
      .slice(0, 10);

    return {
      totalUniqueCustomers,
      newCustomers,
      repeatCustomers,
      repeatRate,
      topSpenders,
    };
  }
}
