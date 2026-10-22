'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { StaffLayout } from '../../../components/staff/StaffLayout';
import { useStaffAuth } from '../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import { useSocket } from '../../../context/SocketContext';
import { StaffRole } from '../../../types/staff';
import { AdminDashboardData } from '../../../types/dashboard';
import { apiClient } from '../../../lib/api';

// Admin Dashboard Components
import { DashboardHeader } from '../../../components/admin/DashboardHeader';
import { OverviewStatCard } from '../../../components/admin/OverviewStatCard';
import { RecentOrdersCard } from '../../../components/admin/RecentOrdersCard';
import { UpcomingReservationsCard } from '../../../components/admin/UpcomingReservationsCard';
import { KitchenActivityCard } from '../../../components/admin/KitchenActivityCard';
import { TableOccupancyCard } from '../../../components/admin/TableOccupancyCard';
import { VipEventsCard } from '../../../components/admin/VipEventsCard';
import { OperationalAlertsCard } from '../../../components/admin/OperationalAlertsCard';
import { QuickActionsCard } from '../../../components/admin/QuickActionsCard';
import { DashboardSkeleton } from '../../../components/admin/DashboardSkeleton';

import {
  ShoppingBag,
  Calendar,
  DollarSign,
  Armchair,
  Flame,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(
    async (isBackground = false) => {
      // Guard: only fetch if authenticated staff has ADMIN clearance
      if (!staff || staff.role !== StaffRole.ADMIN) {
        setLoading(false);
        return;
      }

      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const query = selectedLocation ? `?locationId=${encodeURIComponent(selectedLocation)}` : '';
        const res = await apiClient<{ success: boolean; data: AdminDashboardData }>(
          `/admin/dashboard/overview${query}`
        );

        if (res?.success && res?.data) {
          setDashboardData(res.data);
          setLastUpdated(new Date());
        } else {
          throw new Error('Invalid dashboard payload returned from server');
        }
      } catch (err: any) {
        console.warn('[Dashboard] Notice fetching operational overview:', err?.message || err);
        setError(
          err.message || 'Unable to load real-time operational data. Please verify network connection.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [staff, selectedLocation]
  );

  // Initial fetch and on location change (only for ADMIN)
  useEffect(() => {
    if (staff && staff.role === StaffRole.ADMIN) {
      fetchDashboard(false);
    }
  }, [staff, fetchDashboard]);

  // Real-time Socket.IO event subscription for background refresh
  useEffect(() => {
    if (!socket) return;

    const handleOperationalUpdate = () => {
      fetchDashboard(true);
    };

    socket.on('orders:updated' as any, handleOperationalUpdate);
    socket.on('orders.created' as any, handleOperationalUpdate);
    socket.on('orders.updated' as any, handleOperationalUpdate);
    socket.on('orders.statusChanged' as any, handleOperationalUpdate);
    socket.on('kitchen.orderReady' as any, handleOperationalUpdate);
    socket.on('reservations:updated' as any, handleOperationalUpdate);
    socket.on('tables:updated' as any, handleOperationalUpdate);
    socket.on('kitchen:updated' as any, handleOperationalUpdate);
    socket.on('notification:broadcast' as any, handleOperationalUpdate);

    return () => {
      socket.off('orders:updated' as any, handleOperationalUpdate);
      socket.off('orders.created' as any, handleOperationalUpdate);
      socket.off('orders.updated' as any, handleOperationalUpdate);
      socket.off('orders.statusChanged' as any, handleOperationalUpdate);
      socket.off('kitchen.orderReady' as any, handleOperationalUpdate);
      socket.off('reservations:updated' as any, handleOperationalUpdate);
      socket.off('tables:updated' as any, handleOperationalUpdate);
      socket.off('kitchen:updated' as any, handleOperationalUpdate);
      socket.off('notification:broadcast' as any, handleOperationalUpdate);
    };
  }, [socket, fetchDashboard]);

  const isDark = theme === 'dark';

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN]}>
      {loading && !dashboardData ? (
        <DashboardSkeleton />
      ) : error && !dashboardData ? (
        <div
          className={`border rounded-2xl p-10 text-center max-w-lg mx-auto my-12 ${
            isDark ? 'bg-[#1E1E1B] border-red-500/30' : 'bg-white border-red-300'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h3
            className={`text-lg font-serif mb-2 ${
              isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
            }`}
          >
            Failed to Load Operational Overview
          </h3>
          <p className="text-xs text-[#A5A198] mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => fetchDashboard(false)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B99A63] text-[#171715] text-xs font-medium uppercase tracking-wider hover:bg-[#cbb07e] transition-colors"
          >
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8 select-none">
          {/* Dashboard Header */}
          <DashboardHeader
            lastUpdated={lastUpdated}
            onRefresh={() => fetchDashboard(true)}
            refreshing={refreshing}
            locationName={dashboardData?.locationName}
          />

          {/* Quick Actions Shortcuts */}
          <QuickActionsCard />

          {/* Six Overview Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Today's Orders */}
            <OverviewStatCard
              title="Today's Orders"
              value={dashboardData?.statistics.todayOrders.value ?? null}
              available={!!dashboardData?.statistics.todayOrders.available}
              description={
                dashboardData?.statistics.todayOrders.description ||
                'Awaiting Order Management module (Stage 5)'
              }
              icon={<ShoppingBag size={18} />}
            />

            {/* Card 2: Today's Reservations */}
            <OverviewStatCard
              title="Today's Reservations"
              value={dashboardData?.statistics.todayReservations.value ?? null}
              available={!!dashboardData?.statistics.todayReservations.available}
              description={
                dashboardData?.statistics.todayReservations.description ||
                'Awaiting Reservation module (Stage 6)'
              }
              icon={<Calendar size={18} />}
            />

            {/* Card 3: Today's Revenue */}
            <OverviewStatCard
              title="Today's Revenue"
              value={
                dashboardData?.statistics.todayRevenue.available &&
                dashboardData?.statistics.todayRevenue.value !== null
                  ? `${dashboardData.statistics.todayRevenue.currency || 'LKR'} ${dashboardData.statistics.todayRevenue.value.toLocaleString()}`
                  : null
              }
              available={!!dashboardData?.statistics.todayRevenue.available}
              description={
                dashboardData?.statistics.todayRevenue.description ||
                'Awaiting transaction settlement records'
              }
              icon={<DollarSign size={18} />}
            />

            {/* Card 4: Occupied Tables */}
            <OverviewStatCard
              title="Occupied Tables"
              value={dashboardData?.statistics.occupiedTables.value ?? null}
              available={!!dashboardData?.statistics.occupiedTables.available}
              description={
                dashboardData?.statistics.occupiedTables.description ||
                'Awaiting Table Floor Plan module (Stage 7)'
              }
              icon={<Armchair size={18} />}
            />

            {/* Card 5: Orders Preparing */}
            <OverviewStatCard
              title="Orders Preparing"
              value={dashboardData?.statistics.ordersPreparing.value ?? null}
              available={!!dashboardData?.statistics.ordersPreparing.available}
              description={
                dashboardData?.statistics.ordersPreparing.description ||
                'Awaiting Kitchen KMS integration (Stage 8)'
              }
              icon={<Flame size={18} />}
            />

            {/* Card 6: Pending Requests */}
            <OverviewStatCard
              title="Pending Requests"
              value={dashboardData?.statistics.pendingRequests.value ?? 0}
              available={true}
              description={
                dashboardData?.statistics.pendingRequests.description ||
                'Pending staff onboarding and action items'
              }
              subtext={
                dashboardData?.statistics.pendingRequests.breakdown?.invitedStaff
                  ? `${dashboardData.statistics.pendingRequests.breakdown.invitedStaff} Invited Staff`
                  : undefined
              }
              icon={<AlertCircle size={18} />}
            />
          </div>

          {/* Recent Orders & Upcoming Reservations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentOrdersCard
              orders={dashboardData?.recentOrders || []}
              connected={!!dashboardData?.recentOrdersStatus.connected}
              statusMessage={
                dashboardData?.recentOrdersStatus.message ||
                'Order management module will be integrated in Stage 5.'
              }
            />

            <UpcomingReservationsCard
              reservations={dashboardData?.upcomingReservations || []}
              connected={!!dashboardData?.upcomingReservationsStatus.connected}
              statusMessage={
                dashboardData?.upcomingReservationsStatus.message ||
                'Reservation module will be integrated in Stage 6.'
              }
            />
          </div>

          {/* Kitchen Activity & Table Occupancy Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KitchenActivityCard
              activity={
                dashboardData?.kitchenActivity || {
                  newOrders: null,
                  acceptedOrders: null,
                  preparingOrders: null,
                  readyOrders: null,
                  connected: false,
                  message: 'Kitchen activity will appear once order management is connected.',
                }
              }
            />

            <TableOccupancyCard
              occupancy={
                dashboardData?.tableOccupancy || {
                  available: null,
                  reserved: null,
                  occupied: null,
                  awaitingCleaning: null,
                  unavailable: null,
                  totalConfigured: 0,
                  connected: false,
                  message: 'No tables configured yet.',
                }
              }
            />
          </div>

          {/* VIP & Events + Operational Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VipEventsCard
              vipEvents={
                dashboardData?.vipEvents || {
                  upcomingVipBookings: [],
                  pendingEnquiries: 0,
                  confirmedEvents: 0,
                  connected: false,
                  message: 'VIP & Event module will be connected in a later stage.',
                }
              }
            />

            <OperationalAlertsCard alerts={dashboardData?.alerts || []} />
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
