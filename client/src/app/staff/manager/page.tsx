'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../components/staff/manager/ManagerHeader';
import { OverrideConfirmModal } from '../../../components/staff/manager/OverrideConfirmModal';
import { useStaffAuth } from '../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import { useSocket } from '../../../context/SocketContext';
import { StaffRole } from '../../../types/staff';
import { apiClient } from '../../../lib/api';
import { ManagerOverviewData, IOperationalAlert, AlertSeverity, AlertStatus } from '../../../types/manager';
import {
  ShoppingBag,
  Calendar,
  Armchair,
  Users,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Clock,
  ChefHat,
  UserCheck,
  TrendingUp,
  History,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

export default function ManagerOverviewPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected } = useSocket();
  const isDark = theme === 'dark';

  const [data, setData] = useState<ManagerOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected alert for acknowledge/resolve modal
  const [selectedAlert, setSelectedAlert] = useState<IOperationalAlert | null>(null);
  const [actionType, setActionType] = useState<'acknowledge' | 'resolve' | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchOverview = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      setError(null);
      try {
        const res = await apiClient<{ success: boolean; data: ManagerOverviewData }>(
          `/manager/overview?locationId=${locationId}`
        );
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve operational metrics.');
      } finally {
        setLoading(false);
        if (isManualRefresh) setRefreshing(false);
      }
    },
    [locationId]
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Reactive Socket.IO updates
  useEffect(() => {
    if (!socket) return;

    const handleDataChange = () => {
      fetchOverview();
    };

    socket.on('order:created', handleDataChange);
    socket.on('order:status_changed', handleDataChange);
    socket.on('kitchen:order_updated', handleDataChange);
    socket.on('reservation:created', handleDataChange);
    socket.on('reservation:status_changed', handleDataChange);
    socket.on('guest:checked_in', handleDataChange);
    socket.on('guest:seated', handleDataChange);
    socket.on('floor:table_status_changed', handleDataChange);
    socket.on('floor:service_request_created', handleDataChange);
    socket.on('floor:cleaning_task_updated', handleDataChange);
    socket.on('alert:created', handleDataChange);
    socket.on('alert:acknowledged', handleDataChange);
    socket.on('alert:resolved', handleDataChange);

    return () => {
      socket.off('order:created', handleDataChange);
      socket.off('order:status_changed', handleDataChange);
      socket.off('kitchen:order_updated', handleDataChange);
      socket.off('reservation:created', handleDataChange);
      socket.off('reservation:status_changed', handleDataChange);
      socket.off('guest:checked_in', handleDataChange);
      socket.off('guest:seated', handleDataChange);
      socket.off('floor:table_status_changed', handleDataChange);
      socket.off('floor:service_request_created', handleDataChange);
      socket.off('floor:cleaning_task_updated', handleDataChange);
      socket.off('alert:created', handleDataChange);
      socket.off('alert:acknowledged', handleDataChange);
      socket.off('alert:resolved', handleDataChange);
    };
  }, [socket, fetchOverview]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await apiClient(`/manager/alerts/${alertId}/acknowledge?locationId=${locationId}`, {
        method: 'POST',
      });
      fetchOverview();
    } catch (err: any) {
      alert(err?.message || 'Failed to acknowledge alert.');
    }
  };

  const handleResolveAlert = async (reason: string) => {
    if (!selectedAlert) return;
    await apiClient(`/manager/alerts/${selectedAlert.id}/resolve?locationId=${locationId}`, {
      method: 'POST',
      data: { resolutionNotes: reason },
    });
    fetchOverview();
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Restaurant Operations"
        description="Monitor daily performance and coordinate restaurant operations."
        onRefresh={() => fetchOverview(true)}
        refreshing={refreshing}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchOverview(true)}
            className="text-xs font-mono text-[#B99A63] underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#A5A198]">
          <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-mono tracking-wider">Aggregating live operational metrics...</p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* 1. Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Active Orders */}
            <Link
              href="/staff/manager/orders"
              className={`p-5 rounded-xl border transition-all duration-200 group flex flex-col justify-between ${
                isDark
                  ? 'bg-[#141412] border-[#2A2925] hover:border-[#B99A63]/50 hover:bg-[#1A1916]'
                  : 'bg-white border-stone-200 hover:border-[#B99A63] shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-amber-500 mb-3">
                <span className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <ShoppingBag size={18} />
                </span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <div className="text-3xl font-serif text-[#F6F1E8] mb-1 font-semibold">
                  {data.metrics.activeOrders}
                </div>
                <div className="text-xs font-mono text-[#A5A198] uppercase tracking-wider">Active Orders</div>
              </div>
            </Link>

            {/* Today's Reservations */}
            <Link
              href="/staff/manager/reservations"
              className={`p-5 rounded-xl border transition-all duration-200 group flex flex-col justify-between ${
                isDark
                  ? 'bg-[#141412] border-[#2A2925] hover:border-[#B99A63]/50 hover:bg-[#1A1916]'
                  : 'bg-white border-stone-200 hover:border-[#B99A63] shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-blue-400 mb-3">
                <span className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Calendar size={18} />
                </span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <div className="text-3xl font-serif text-[#F6F1E8] mb-1 font-semibold">
                  {data.metrics.todayReservations}
                </div>
                <div className="text-xs font-mono text-[#A5A198] uppercase tracking-wider">
                  Today&apos;s Bookings
                </div>
              </div>
            </Link>

            {/* Occupied Tables */}
            <Link
              href="/staff/manager/floor"
              className={`p-5 rounded-xl border transition-all duration-200 group flex flex-col justify-between ${
                isDark
                  ? 'bg-[#141412] border-[#2A2925] hover:border-[#B99A63]/50 hover:bg-[#1A1916]'
                  : 'bg-white border-stone-200 hover:border-[#B99A63] shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-400 mb-3">
                <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Armchair size={18} />
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {data.floorOccupancy.occupancyRatePercent}%
                </span>
              </div>
              <div>
                <div className="text-3xl font-serif text-[#F6F1E8] mb-1 font-semibold">
                  {data.metrics.occupiedTables}
                  <span className="text-sm font-sans text-stone-500 font-normal">
                    /{data.floorOccupancy.totalTables}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#A5A198] uppercase tracking-wider">Occupied Tables</div>
              </div>
            </Link>

            {/* Checked-In Guests */}
            <Link
              href="/staff/manager/reception"
              className={`p-5 rounded-xl border transition-all duration-200 group flex flex-col justify-between ${
                isDark
                  ? 'bg-[#141412] border-[#2A2925] hover:border-[#B99A63]/50 hover:bg-[#1A1916]'
                  : 'bg-white border-stone-200 hover:border-[#B99A63] shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-purple-400 mb-3">
                <span className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Users size={18} />
                </span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <div className="text-3xl font-serif text-[#F6F1E8] mb-1 font-semibold">
                  {data.metrics.checkedInGuests}
                </div>
                <div className="text-xs font-mono text-[#A5A198] uppercase tracking-wider">
                  Checked-In Guests
                </div>
              </div>
            </Link>

            {/* Pending VIP Requests */}
            <Link
              href="/staff/manager/vip-events"
              className={`p-5 rounded-xl border transition-all duration-200 group flex flex-col justify-between ${
                isDark
                  ? 'bg-[#141412] border-[#2A2925] hover:border-[#B99A63]/50 hover:bg-[#1A1916]'
                  : 'bg-white border-stone-200 hover:border-[#B99A63] shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-[#B99A63] mb-3">
                <span className="p-2 rounded-lg bg-[#B99A63]/10 border border-[#B99A63]/30">
                  <Sparkles size={18} />
                </span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <div className="text-3xl font-serif text-[#F6F1E8] mb-1 font-semibold">
                  {data.metrics.pendingVipRequests}
                </div>
                <div className="text-xs font-mono text-[#A5A198] uppercase tracking-wider">
                  Pending VIP Inquiries
                </div>
              </div>
            </Link>

            {/* Active Service Issues */}
            <Link
              href="/staff/manager/alerts"
              className={`p-5 rounded-xl border transition-all duration-200 group flex flex-col justify-between ${
                data.metrics.activeServiceIssues > 0
                  ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
                  : isDark
                  ? 'bg-[#141412] border-[#2A2925] hover:border-[#B99A63]'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-rose-400 mb-3">
                <span className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <AlertTriangle size={18} />
                </span>
                {data.metrics.activeServiceIssues > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <div>
                <div className="text-3xl font-serif text-rose-400 mb-1 font-semibold">
                  {data.metrics.activeServiceIssues}
                </div>
                <div className="text-xs font-mono text-rose-300 uppercase tracking-wider">Service Issues</div>
              </div>
            </Link>
          </div>

          {/* 2. Critical & High Operational Alerts Bar */}
          {data.criticalAlerts && data.criticalAlerts.length > 0 && (
            <div className="border border-rose-500/30 rounded-xl bg-rose-950/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-400" size={18} />
                  <h3 className="font-serif text-base text-[#F6F1E8] tracking-wide">
                    Operational Conditions Requiring Attention
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {data.criticalAlerts.length} Active
                  </span>
                </div>
                <Link
                  href="/staff/manager/alerts"
                  className="text-xs font-mono text-[#B99A63] hover:underline flex items-center gap-1"
                >
                  <span>View All Alerts</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="space-y-2">
                {data.criticalAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#141412]/90 border border-[#2A2925]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold ${
                          alert.severity === AlertSeverity.CRITICAL
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : alert.severity === AlertSeverity.HIGH
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-sm text-[#F6F1E8] font-medium">{alert.message}</span>
                      <span className="text-xs font-mono text-stone-500">
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {alert.status === AlertStatus.OPEN && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="px-2.5 py-1 text-xs font-mono text-[#A5A198] hover:text-[#F6F1E8] bg-[#1E1D1A] hover:bg-[#2A2925] border border-[#2A2925] rounded transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedAlert(alert);
                          setActionType('resolve');
                        }}
                        className="px-2.5 py-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 size={12} />
                        <span>Resolve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Middle Grid: Floor Occupancy & Reception Workflow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dining Floor Status */}
            <div
              className={`p-6 rounded-xl border ${
                isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg text-[#F6F1E8]">Dining Room Capacity</h3>
                  <p className="text-xs text-[#A5A198]">Physical occupancy and table turnarounds</p>
                </div>
                <Link
                  href="/staff/manager/floor"
                  className="text-xs font-mono text-[#B99A63] hover:underline flex items-center gap-1"
                >
                  <span>Floor Plan</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {/* Occupancy Progress Bar */}
              <div className="w-full bg-[#1C1B17] h-3 rounded-full overflow-hidden flex mb-4 border border-[#2A2925]">
                <div
                  style={{
                    width: `${
                      data.floorOccupancy.totalTables > 0
                        ? (data.floorOccupancy.occupiedCount / data.floorOccupancy.totalTables) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-emerald-500 transition-all duration-500"
                  title="Occupied"
                />
                <div
                  style={{
                    width: `${
                      data.floorOccupancy.totalTables > 0
                        ? (data.floorOccupancy.reservedCount / data.floorOccupancy.totalTables) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-blue-500 transition-all duration-500"
                  title="Reserved"
                />
                <div
                  style={{
                    width: `${
                      data.floorOccupancy.totalTables > 0
                        ? (data.floorOccupancy.cleaningCount / data.floorOccupancy.totalTables) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-amber-500 transition-all duration-500"
                  title="Cleaning"
                />
              </div>

              {/* Breakdown Legend */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#1C1B17] border border-[#2A2925]">
                  <div className="text-emerald-400 font-semibold text-lg">
                    {data.floorOccupancy.occupiedCount}
                  </div>
                  <div className="text-stone-400 text-[11px] mt-0.5">Occupied</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1C1B17] border border-[#2A2925]">
                  <div className="text-blue-400 font-semibold text-lg">
                    {data.floorOccupancy.reservedCount}
                  </div>
                  <div className="text-stone-400 text-[11px] mt-0.5">Reserved</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1C1B17] border border-[#2A2925]">
                  <div className="text-amber-400 font-semibold text-lg">
                    {data.floorOccupancy.cleaningCount}
                  </div>
                  <div className="text-stone-400 text-[11px] mt-0.5">Cleaning</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1C1B17] border border-[#2A2925]">
                  <div className="text-[#F6F1E8] font-semibold text-lg">
                    {data.floorOccupancy.availableCount}
                  </div>
                  <div className="text-stone-400 text-[11px] mt-0.5">Available</div>
                </div>
              </div>
            </div>

            {/* Reception & Arrivals Workflow */}
            <div
              className={`p-6 rounded-xl border ${
                isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg text-[#F6F1E8]">Guest Arrival Queue</h3>
                  <p className="text-xs text-[#A5A198]">Maitre D&apos; check-ins, waiting parties, and no-shows</p>
                </div>
                <Link
                  href="/staff/manager/reception"
                  className="text-xs font-mono text-[#B99A63] hover:underline flex items-center gap-1"
                >
                  <span>Reception Hub</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#1C1B17] border border-[#2A2925]">
                  <div className="text-stone-400 text-[11px]">Expected Arrivals</div>
                  <div className="text-2xl font-serif text-[#F6F1E8] font-semibold mt-1">
                    {data.receptionStatus.expectedArrivals}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#1C1B17] border border-[#2A2925]">
                  <div className="text-stone-400 text-[11px]">Checked In</div>
                  <div className="text-2xl font-serif text-purple-400 font-semibold mt-1">
                    {data.receptionStatus.checkedInCount}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#1C1B17] border border-[#2A2925]">
                  <div className="text-stone-400 text-[11px]">Seated Today</div>
                  <div className="text-2xl font-serif text-emerald-400 font-semibold mt-1">
                    {data.receptionStatus.seatedCount}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#1C1B17] border border-[#2A2925]">
                  <div className="text-stone-400 text-[11px]">Waiting Parties</div>
                  <div className="text-2xl font-serif text-amber-400 font-semibold mt-1">
                    {data.receptionStatus.waitingCount}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#1C1B17] border border-[#2A2925]">
                  <div className="text-stone-400 text-[11px]">No-Shows</div>
                  <div className="text-2xl font-serif text-rose-400 font-semibold mt-1">
                    {data.receptionStatus.noShowCount}
                  </div>
                </div>
                <Link
                  href="/staff/manager/reception"
                  className="p-3 rounded-lg bg-[#B99A63]/10 border border-[#B99A63]/30 flex flex-col justify-center items-center text-[#B99A63] hover:bg-[#B99A63]/20 transition-colors"
                >
                  <UserCheck size={18} className="mb-1" />
                  <span className="text-[11px] font-semibold">Open Reception</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4. Active Orders Preview */}
          <div
            className={`p-6 rounded-xl border ${
              isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg text-[#F6F1E8]">Active Orders Pipeline</h3>
                <p className="text-xs text-[#A5A198]">Real-time orders currently in preparation or delivery</p>
              </div>
              <Link
                href="/staff/manager/orders"
                className="text-xs font-mono text-[#B99A63] hover:underline flex items-center gap-1"
              >
                <span>All Orders</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {data.activeOrdersPreview.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-sm font-mono">
                No orders currently in active preparation.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#2A2925] text-xs font-mono text-[#A5A198] uppercase">
                      <th className="py-2.5 px-3">Order Ref</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Placed</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2925]">
                    {data.activeOrdersPreview.map((order) => (
                      <tr key={order.id} className="hover:bg-[#1C1B17]/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-[#F6F1E8]">
                          #{order.orderReference}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-stone-400">
                          {order.orderType}
                        </td>
                        <td className="py-3 px-3 text-stone-300 font-mono text-xs">
                          {order.itemsCount} dishes
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold ${
                              order.orderStatus === 'PREPARING'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : order.orderStatus === 'READY'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-[#B99A63]">
                          {(order.totalMinor / 100).toLocaleString('en-US', {
                            style: 'currency',
                            currency: order.currency || 'LKR',
                          })}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-stone-500">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/staff/manager/orders?highlight=${order.id}`}
                            className="p-1.5 rounded hover:bg-[#2A2925] text-stone-400 hover:text-[#F6F1E8] transition-colors inline-block"
                            title="Inspect Order"
                          >
                            <Eye size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5. Operations Navigation Quick Grid */}
          <div>
            <h3 className="font-serif text-lg text-[#F6F1E8] mb-3">Restaurant Management Modules</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Link
                href="/staff/manager/orders"
                className="p-4 rounded-xl border border-[#2A2925] bg-[#141412] hover:border-[#B99A63]/50 hover:bg-[#1A1916] transition-all group"
              >
                <ShoppingBag className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-medium text-sm text-[#F6F1E8]">Order Management</div>
                <div className="text-xs text-stone-500 mt-0.5">Filter, search, inspect timeline</div>
              </Link>

              <Link
                href="/staff/manager/kitchen"
                className="p-4 rounded-xl border border-[#2A2925] bg-[#141412] hover:border-[#B99A63]/50 hover:bg-[#1A1916] transition-all group"
              >
                <ChefHat className="text-rose-400 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-medium text-sm text-[#F6F1E8]">Kitchen Monitor</div>
                <div className="text-xs text-stone-500 mt-0.5">Ticket pipelines & delays</div>
              </Link>

              <Link
                href="/staff/manager/floor"
                className="p-4 rounded-xl border border-[#2A2925] bg-[#141412] hover:border-[#B99A63]/50 hover:bg-[#1A1916] transition-all group"
              >
                <Armchair className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-medium text-sm text-[#F6F1E8]">Floor Operations</div>
                <div className="text-xs text-stone-500 mt-0.5">Interactive floor plan & turns</div>
              </Link>

              <Link
                href="/staff/manager/vip-events"
                className="p-4 rounded-xl border border-[#2A2925] bg-[#141412] hover:border-[#B99A63]/50 hover:bg-[#1A1916] transition-all group"
              >
                <Sparkles className="text-[#B99A63] mb-2 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-medium text-sm text-[#F6F1E8]">VIP & Events</div>
                <div className="text-xs text-stone-500 mt-0.5">Salons, proposals, bookings</div>
              </Link>

              <Link
                href="/staff/manager/staff"
                className="p-4 rounded-xl border border-[#2A2925] bg-[#141412] hover:border-[#B99A63]/50 hover:bg-[#1A1916] transition-all group"
              >
                <Users className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-medium text-sm text-[#F6F1E8]">Staff Operations</div>
                <div className="text-xs text-stone-500 mt-0.5">Table assignments & roles</div>
              </Link>

              <Link
                href="/staff/manager/alerts"
                className="p-4 rounded-xl border border-[#2A2925] bg-[#141412] hover:border-[#B99A63]/50 hover:bg-[#1A1916] transition-all group"
              >
                <AlertTriangle className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-medium text-sm text-[#F6F1E8]">Operational Alerts</div>
                <div className="text-xs text-stone-500 mt-0.5">Escalations & resolutions</div>
              </Link>

              <Link
                href="/staff/manager/reports"
                className="p-4 rounded-xl border border-[#2A2925] bg-[#141412] hover:border-[#B99A63]/50 hover:bg-[#1A1916] transition-all group"
              >
                <TrendingUp className="text-teal-400 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-medium text-sm text-[#F6F1E8]">Daily Reports</div>
                <div className="text-xs text-stone-500 mt-0.5">Financial & throughput KPIs</div>
              </Link>

              <Link
                href="/staff/manager/activity"
                className="p-4 rounded-xl border border-[#2A2925] bg-[#141412] hover:border-[#B99A63]/50 hover:bg-[#1A1916] transition-all group"
              >
                <History className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <div className="font-medium text-sm text-[#F6F1E8]">Activity History</div>
                <div className="text-xs text-stone-500 mt-0.5">Audit log & governance trail</div>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Resolve Alert Modal */}
      {selectedAlert && actionType === 'resolve' && (
        <OverrideConfirmModal
          isOpen={true}
          onClose={() => {
            setSelectedAlert(null);
            setActionType(null);
          }}
          title="Resolve Operational Alert"
          actionName="ALERT RESOLUTION"
          description="Confirm that the underlying operational condition has been addressed and record resolution notes."
          recordSummary={`${selectedAlert.alertType}: ${selectedAlert.message}`}
          onConfirm={handleResolveAlert}
        />
      )}
    </StaffLayout>
  );
}
