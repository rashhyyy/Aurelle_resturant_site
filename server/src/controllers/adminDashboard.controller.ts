import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Staff } from '../models/staff.model';
import { StaffStatus } from '../types/staff';
import {
  AdminDashboardData,
  RecentOrderSummary,
  UpcomingReservationSummary,
  TableOccupancySummary,
  OperationalAlert,
} from '../types/dashboard';

const LOCATION_NAMES: Record<string, string> = {
  'loc-colombo-main': 'Aurelle Colombo (Flagship)',
  'loc-kandy-vip': 'Aurelle Kandy (Grand Salon)',
  'default-location': 'Aurelle Flagship (Main Dining)',
};

/**
 * GET /api/admin/dashboard/overview
 * Returns unified operational metrics, live alerts, and recent transaction feeds
 * for authorized administrators.
 */
export const getAdminDashboardOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestedLocationId =
      (req.query.locationId as string) ||
      req.staff?.locationIds[0] ||
      'loc-colombo-main';

    const locationName =
      LOCATION_NAMES[requestedLocationId] ||
      requestedLocationId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    // 1. Safely query verified Staff database records
    let activeStaffCount = 0;
    let invitedStaffCount = 0;
    try {
      if (mongoose.connection.readyState === 1) {
        activeStaffCount = await Staff.countDocuments({ status: StaffStatus.ACTIVE });
        invitedStaffCount = await Staff.countDocuments({ status: StaffStatus.INVITED });
      }
    } catch {
      // Fallback if database is reconnecting
    }

    // 2. Safely query operational collections if registered in MongoDB
    const db = mongoose.connection.readyState === 1 ? mongoose.connection.db : undefined;

    let ordersConnected = false;
    let todayOrdersCount: number | null = null;
    let todayRevenueTotal: number | null = null;
    let ordersPreparingCount: number | null = null;
    let recentOrders: RecentOrderSummary[] = [];

    let reservationsConnected = false;
    let todayReservationsCount: number | null = null;
    let checkedInCount = 0;
    let seatedCount = 0;
    let pendingArrivalsCount = 0;
    let noShowCount = 0;
    let pendingReservationsCount = 0;
    let upcomingReservations: UpcomingReservationSummary[] = [];

    let tableSummary: TableOccupancySummary = {
      available: null,
      reserved: null,
      occupied: null,
      awaitingCleaning: null,
      unavailable: null,
      totalConfigured: 0,
      connected: false,
      message: 'No tables configured yet.',
    };

    if (db) {
      // Check Orders collection
      const orderCollections = await db.listCollections({ name: 'orders' }).toArray();
      if (orderCollections.length > 0) {
        ordersConnected = true;
        const orderCol = db.collection('orders');

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        todayOrdersCount = await orderCol.countDocuments({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          ...(requestedLocationId ? { locationId: requestedLocationId } : {}),
        });

        ordersPreparingCount = await orderCol.countDocuments({
          $or: [
            { orderStatus: 'PREPARING' },
            { status: { $in: ['Preparing', 'preparing', 'PREPARING'] } },
          ],
          ...(requestedLocationId ? { locationId: requestedLocationId } : {}),
        });

        const revenueAgg = await orderCol
          .aggregate([
            {
              $match: {
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                $and: [
                  { orderStatus: { $nin: ['Cancelled', 'cancelled', 'CANCELLED', 'Void', 'void'] } },
                ],
                ...(requestedLocationId ? { locationId: requestedLocationId } : {}),
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $cond: [
                      { $ifNull: ['$totalMinor', false] },
                      { $divide: ['$totalMinor', 100] },
                      { $ifNull: ['$total', 0] },
                    ],
                  },
                },
              },
            },
          ])
          .toArray();

        todayRevenueTotal = Math.round(revenueAgg[0]?.total || 0);

        const rawOrders = await orderCol
          .find(requestedLocationId ? { locationId: requestedLocationId } : {})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray();

        recentOrders = rawOrders.map((o: any) => ({
          id: o._id.toString(),
          reference: o.orderReference || o.reference || `AUR-${o._id.toString().slice(-5).toUpperCase()}`,
          orderType: o.orderType || 'TAKEAWAY',
          orderTime: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
          total: o.totalMinor ? Math.round(o.totalMinor / 100) : (o.total || 0),
          currency: o.currency || 'LKR',
          status: o.orderStatus || o.status || 'RECEIVED',
        }));
      }

      // Check Reservations collection
      const resCollections = await db.listCollections({ name: 'reservations' }).toArray();
      if (resCollections.length > 0) {
        reservationsConnected = true;
        const resCol = db.collection('reservations');

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayBaseQuery = {
          $or: [
            { startAt: { $gte: startOfDay, $lte: endOfDay } },
            { reservationDate: { $gte: startOfDay, $lte: endOfDay } },
          ],
          ...(requestedLocationId ? { locationId: requestedLocationId } : {}),
        };

        todayReservationsCount = await resCol.countDocuments({
          ...todayBaseQuery,
          status: { $nin: ['Cancelled', 'cancelled', 'CANCELLED', 'REJECTED', 'Rejected'] },
        });

        [checkedInCount, seatedCount, pendingArrivalsCount, noShowCount, pendingReservationsCount] = await Promise.all([
          resCol.countDocuments({ ...todayBaseQuery, status: 'CHECKED_IN' }),
          resCol.countDocuments({ ...todayBaseQuery, status: 'SEATED' }),
          resCol.countDocuments({ ...todayBaseQuery, status: 'CONFIRMED' }),
          resCol.countDocuments({ ...todayBaseQuery, status: 'NO_SHOW' }),
          resCol.countDocuments({ status: 'PENDING', ...(requestedLocationId ? { locationId: requestedLocationId } : {}) }),
        ]);

        const rawReservations = await resCol
          .find({
            $or: [{ startAt: { $gte: new Date() } }, { reservationDate: { $gte: new Date() } }],
            status: { $nin: ['Cancelled', 'cancelled', 'CANCELLED', 'REJECTED', 'Rejected'] },
            ...(requestedLocationId ? { locationId: requestedLocationId } : {}),
          })
          .sort({ startAt: 1, reservationDate: 1, reservationTime: 1 })
          .limit(5)
          .toArray();

        upcomingReservations = rawReservations.map((r: any) => ({
          id: r._id.toString(),
          reference: r.reservationReference || r.reference || `RES-${r._id.toString().slice(-6).toUpperCase()}`,
          guestName: r.guestName || 'Reserved Guest',
          reservationDate: r.startAt
            ? new Date(r.startAt).toISOString()
            : r.reservationDate
              ? new Date(r.reservationDate).toISOString()
              : '',
          reservationTime: r.startAt
            ? new Date(r.startAt).toLocaleTimeString('en-US', {
                timeZone: 'Asia/Colombo',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
            : r.reservationTime || '7:30 PM',
          guestCount: r.guestCount || 2,
          reservationType: r.seatingPreference || r.reservationType || 'Standard',
          status: r.status || 'Confirmed',
        }));
      }

      // Check Tables collection
      const tableCollections = await db.listCollections({ name: 'tables' }).toArray();
      if (tableCollections.length > 0) {
        const tableCol = db.collection('tables');
        const query = requestedLocationId ? { locationId: requestedLocationId } : {};

        const total = await tableCol.countDocuments(query);
        const occupied = await tableCol.countDocuments({ ...query, status: 'OCCUPIED' });
        const available = await tableCol.countDocuments({ ...query, status: 'AVAILABLE' });
        const reserved = await tableCol.countDocuments({ ...query, status: 'RESERVED' });
        const cleaning = await tableCol.countDocuments({ ...query, status: { $in: ['CLEANING', 'AWAITING_CLEANING'] } });
        const unavailable = await tableCol.countDocuments({ ...query, status: 'UNAVAILABLE' });

        tableSummary = {
          available,
          reserved,
          occupied,
          awaitingCleaning: cleaning,
          unavailable,
          totalConfigured: total,
          connected: true,
          message: total === 0 ? 'No tables configured yet.' : `${total} tables configured`,
        };
      }
    }

    // 3. Build Real Operational Alerts
    const alerts: OperationalAlert[] = [];

    if (invitedStaffCount > 0) {
      alerts.push({
        id: 'alert-invited-staff',
        title: 'Pending Staff Invitations',
        description: `${invitedStaffCount} employee invitation(s) are awaiting onboarding activation.`,
        severity: 'Warning',
        timestamp: new Date().toISOString(),
        actionUrl: '/staff/admin/staff',
      });
    }

    alerts.push({
      id: 'alert-architecture-milestone',
      title: 'Administrator Control Hub Active',
      description:
        'Live backend telemetry is connected. Operational order processing (Stage 5) and table seating (Stage 6) are awaiting module activation.',
      severity: 'Information',
      timestamp: new Date().toISOString(),
      actionUrl: '/staff/admin/settings',
    });

    const pendingRequestsCount = invitedStaffCount + pendingReservationsCount;

    // 4. Construct Structured Dashboard Response
    const responsePayload: AdminDashboardData = {
      locationId: requestedLocationId,
      locationName,
      generatedAt: new Date().toISOString(),
      timezone: 'Asia/Colombo (UTC+05:30)',
      statistics: {
        todayOrders: {
          value: todayOrdersCount,
          available: ordersConnected,
          description: ordersConnected
            ? 'Total orders placed today'
            : 'Awaiting Order Management module (Stage 5)',
        },
        todayReservations: {
          value: todayReservationsCount,
          available: reservationsConnected,
          description: reservationsConnected
            ? "Confirmed bookings for today's sittings"
            : 'Awaiting Reservation module (Stage 6)',
        },
        todayRevenue: {
          value: todayRevenueTotal,
          available: ordersConnected && todayRevenueTotal !== null,
          currency: 'LKR',
          description: ordersConnected
            ? 'Settled and finalized transactions'
            : 'Awaiting transaction settlement records',
        },
        occupiedTables: {
          value: tableSummary.occupied,
          available: tableSummary.connected,
          description: tableSummary.connected
            ? 'Dining tables currently seated'
            : 'Awaiting Table Floor Plan module (Stage 7)',
        },
        ordersPreparing: {
          value: ordersPreparingCount,
          available: ordersConnected,
          description: ordersConnected
            ? 'Active tickets on kitchen line'
            : 'Awaiting Kitchen KMS integration (Stage 8)',
        },
        pendingRequests: {
          value: pendingRequestsCount,
          available: true,
          description: 'Pending administrative action items',
          breakdown: {
            invitedStaff: invitedStaffCount,
            reservations: pendingReservationsCount,
            events: 0,
          },
        },
      },
      recentOrders,
      recentOrdersStatus: {
        connected: ordersConnected,
        message: ordersConnected
          ? `${recentOrders.length} recent orders loaded`
          : 'Order management module will be integrated in Stage 5.',
      },
      upcomingReservations,
      upcomingReservationsStatus: {
        connected: reservationsConnected,
        message: reservationsConnected
          ? `${upcomingReservations.length} upcoming reservations loaded`
          : 'Reservation module will be integrated in Stage 6.',
      },
      kitchenActivity: {
        newOrders: null,
        acceptedOrders: null,
        preparingOrders: ordersPreparingCount,
        readyOrders: null,
        connected: ordersConnected,
        message: 'Kitchen activity will appear once order management is connected.',
      },
      tableOccupancy: tableSummary,
      vipEvents: {
        upcomingVipBookings: [],
        pendingEnquiries: 0,
        confirmedEvents: 0,
        connected: false,
        message: 'VIP & Event management module will be connected in a later stage.',
      },
      alerts,
      systemStatus: {
        databaseConnected: mongoose.connection.readyState === 1,
        authSystem: 'ACTIVE',
        socketRealtime: 'CONNECTED',
        activeStaffCount,
      },
    };

    res.status(200).json({
      success: true,
      data: responsePayload,
    });
  } catch (error) {
    next(error);
  }
};
