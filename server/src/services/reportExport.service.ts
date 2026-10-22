import { Order } from '../models/order.model';
import { Reservation } from '../models/reservation.model';
import { VIPBooking } from '../models/vipBooking.model';
import { EventBooking } from '../models/eventBooking.model';
import { StaffAuditLog } from '../models/staffAuditLog.model';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDatePreset } from '../types/analytics';
import { getLocationName } from '../config/locations';

export class ReportExportService {
  /**
   * Escape a string value for standard CSV (RFC 4180)
   */
  private static escapeCSV(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Convert minor currency (cents) to standard decimal string
   */
  private static formatCurrency(minor: number): string {
    return (minor / 100).toFixed(2);
  }

  /**
   * Generates a CSV string with standard header metadata and data rows
   */
  public static async generateCSVReport(params: {
    reportType: 'sales' | 'orders' | 'menu' | 'kitchen' | 'reservations' | 'vip-events' | 'activity';
    locationId: string;
    preset?: AnalyticsDatePreset;
    startDate?: string;
    endDate?: string;
  }): Promise<{ filename: string; csvContent: string }> {
    const { reportType, locationId, preset = 'last30days', startDate, endDate } = params;
    const { startDate: start, endDate: end } = AnalyticsService.parseDateRange(preset, startDate, endDate);
    const locationName = getLocationName(locationId);
    const generatedAt = new Date().toISOString();
    const dateRangeStr = `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;

    // Metadata header
    const metadataLines = [
      `"AURELLE Fine Dining & Lounge - Executive Management Report"`,
      `"Report Type: ${reportType.toUpperCase()}"`,
      `"Location: ${locationName} (${locationId})"`,
      `"Date Range: ${dateRangeStr} [Preset: ${preset}]"`,
      `"Generated At: ${generatedAt}"`,
      `""`, // blank line before table
    ];

    let headerColumns: string[] = [];
    const dataRows: string[][] = [];

    switch (reportType) {
      case 'sales': {
        headerColumns = [
          'Date',
          'Order Reference',
          'Order Type',
          'Customer Name',
          'Subtotal (LKR)',
          'Service Charge (LKR)',
          'Tax (LKR)',
          'Total Gross (LKR)',
          'Order Status',
          'Payment Status',
        ];

        const orders = await Order.find({
          locationId,
          createdAt: { $gte: start, $lte: end },
        }).sort({ createdAt: -1 }).lean();

        let totalSubtotal = 0;
        let totalServiceCharge = 0;
        let totalTax = 0;
        let totalGross = 0;

        for (const o of orders) {
          totalSubtotal += o.subtotalMinor || 0;
          totalServiceCharge += o.serviceChargeMinor || 0;
          totalTax += o.taxMinor || 0;
          totalGross += o.totalMinor || 0;

          dataRows.push([
            new Date(o.createdAt).toISOString().split('T')[0],
            o.orderReference,
            o.orderType,
            o.customerName,
            this.formatCurrency(o.subtotalMinor || 0),
            this.formatCurrency(o.serviceChargeMinor || 0),
            this.formatCurrency(o.taxMinor || 0),
            this.formatCurrency(o.totalMinor || 0),
            o.orderStatus,
            o.paymentStatus,
          ]);
        }

        // Summary row
        dataRows.push([
          'TOTAL',
          `${orders.length} orders`,
          '',
          '',
          this.formatCurrency(totalSubtotal),
          this.formatCurrency(totalServiceCharge),
          this.formatCurrency(totalTax),
          this.formatCurrency(totalGross),
          '',
          '',
        ]);
        break;
      }

      case 'orders': {
        headerColumns = [
          'Order Reference',
          'Date',
          'Type',
          'Customer Name',
          'Customer Phone',
          'Items Count',
          'Total (LKR)',
          'Status',
          'Created At',
          'Completed At',
        ];

        const orders = await Order.find({
          locationId,
          createdAt: { $gte: start, $lte: end },
        }).sort({ createdAt: -1 }).lean();

        for (const o of orders) {
          const itemsCount = (o.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
          dataRows.push([
            o.orderReference,
            new Date(o.createdAt).toISOString().split('T')[0],
            o.orderType,
            o.customerName,
            o.customerPhone,
            String(itemsCount),
            this.formatCurrency(o.totalMinor || 0),
            o.orderStatus,
            new Date(o.createdAt).toLocaleTimeString(),
            o.completedAt ? new Date(o.completedAt).toLocaleTimeString() : 'N/A',
          ]);
        }
        break;
      }

      case 'menu': {
        headerColumns = [
          'Dish Name',
          'Category',
          'Quantity Sold',
          'Unit Price (LKR)',
          'Total Revenue (LKR)',
          'Share of Sales (%)',
        ];

        const menuData = await AnalyticsService.getMenuAnalytics(locationId, preset, startDate, endDate);
        const allDishes = [...menuData.topSellingDishes];

        for (const d of allDishes) {
          dataRows.push([
            d.name,
            d.category,
            String(d.quantitySold),
            this.formatCurrency(d.priceMinor),
            this.formatCurrency(d.totalRevenueMinor),
            `${d.portionOfSales}%`,
          ]);
        }
        break;
      }

      case 'kitchen': {
        headerColumns = [
          'Order Reference',
          'Order Type',
          'Items Count',
          'Prep Started At',
          'Ready At',
          'Duration (Mins)',
          'Status',
        ];

        const orders = await Order.find({
          locationId,
          createdAt: { $gte: start, $lte: end },
        }).sort({ createdAt: -1 }).lean();

        for (const o of orders) {
          const itemsCount = (o.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
          let duration = 'N/A';
          if (o.preparationStartedAt && (o.readyAt || o.completedAt)) {
            const finish = o.readyAt || o.completedAt!;
            const mins = Math.round((new Date(finish).getTime() - new Date(o.preparationStartedAt).getTime()) / 60000);
            duration = `${mins} mins`;
          }

          dataRows.push([
            o.orderReference,
            o.orderType,
            String(itemsCount),
            o.preparationStartedAt ? new Date(o.preparationStartedAt).toLocaleTimeString() : 'N/A',
            o.readyAt ? new Date(o.readyAt).toLocaleTimeString() : 'N/A',
            duration,
            o.orderStatus,
          ]);
        }
        break;
      }

      case 'reservations': {
        headerColumns = [
          'Reservation Reference',
          'Date',
          'Start Time',
          'Guest Name',
          'Guest Email',
          'Guest Phone',
          'Party Size',
          'Status',
          'Tables',
        ];

        const reservations = await Reservation.find({
          locationId,
          reservationDate: { $gte: start, $lte: end },
        }).sort({ reservationDate: -1 }).lean();

        for (const r of reservations) {
          dataRows.push([
            r.reservationReference,
            new Date(r.reservationDate).toISOString().split('T')[0],
            r.startAt ? new Date(r.startAt).toLocaleTimeString() : 'N/A',
            r.guestName,
            r.guestEmail,
            r.guestPhone,
            String(r.guestCount),
            r.status,
            (r.tableNumbers || []).join(', ') || 'Unassigned',
          ]);
        }
        break;
      }

      case 'vip-events': {
        headerColumns = [
          'Category',
          'Reference',
          'Client Name',
          'Date',
          'Guest Count',
          'Amount (LKR)',
          'Status',
        ];

        const [vipBookings, eventBookings] = await Promise.all([
          VIPBooking.find({ locationId, createdAt: { $gte: start, $lte: end } }).lean(),
          EventBooking.find({ locationId, createdAt: { $gte: start, $lte: end } }).lean(),
        ]);

        for (const v of vipBookings) {
          dataRows.push([
            'VIP Room',
            v.bookingReference,
            (v as any).guestName || 'VIP Guest',
            new Date(v.startAt).toISOString().split('T')[0],
            String(v.guestCount),
            this.formatCurrency(v.quotedPriceMinor || 0),
            v.status,
          ]);
        }

        for (const e of eventBookings) {
          dataRows.push([
            'Private Event',
            e.eventReference,
            (e as any).contactName || e.guestName || 'Event Host',
            new Date((e as any).eventDate || e.startAt || e.createdAt).toISOString().split('T')[0],
            String(e.guestCount),
            this.formatCurrency(e.agreedTotalMinor || 0),
            e.status,
          ]);
        }
        break;
      }

      case 'activity': {
        headerColumns = [
          'Timestamp',
          'Actor Name',
          'Actor Email',
          'Action',
          'Target Staff',
          'Details',
          'IP Address',
        ];

        const logs = await StaffAuditLog.find({
          locationId,
          createdAt: { $gte: start, $lte: end },
        }).sort({ createdAt: -1 }).limit(1000).lean();

        for (const l of logs) {
          dataRows.push([
            new Date(l.createdAt).toISOString(),
            l.actorName,
            l.actorEmail,
            l.action,
            l.targetStaffName || 'N/A',
            l.details,
            l.ipAddress || 'Internal',
          ]);
        }
        break;
      }
    }

    const headerLine = headerColumns.map(this.escapeCSV).join(',');
    const dataLines = dataRows.map((row) => row.map(this.escapeCSV).join(','));

    // UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + [...metadataLines, headerLine, ...dataLines].join('\r\n');
    const filename = `aurelle-${reportType}-${locationId}-${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;

    return { filename, csvContent };
  }
}
