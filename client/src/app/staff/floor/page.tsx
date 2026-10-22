'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../components/staff/StaffLayout';
import { useStaffAuth } from '../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import { useSocket } from '../../../context/SocketContext';
import { StaffRole } from '../../../types/staff';
import { apiClient } from '../../../lib/api';
import {
  FloorOverviewMetrics,
  FloorTableDetailItem,
  IDiningSessionSafeJSON,
  IServiceRequestSafeJSON,
  IKitchenAlertSafeJSON,
  ICleaningTaskSafeJSON,
  TableStatus,
  ServiceRequestStatus,
  ServiceRequestPriority,
} from '../../../types/floor';
import {
  Armchair,
  Users,
  MapPin,
  Clock,
  Sparkles,
  BellRing,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  PlusCircle,
  Radio,
  Check,
  X,
} from 'lucide-react';

export default function FloorDashboardPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected: isConnected } = useSocket();
  const isDark = theme === 'dark';

  const [metrics, setMetrics] = useState<FloorOverviewMetrics | null>(null);
  const [activeSessions, setActiveSessions] = useState<IDiningSessionSafeJSON[]>([]);
  const [serviceRequests, setServiceRequests] = useState<IServiceRequestSafeJSON[]>([]);
  const [kitchenAlerts, setKitchenAlerts] = useState<IKitchenAlertSafeJSON[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<ICleaningTaskSafeJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local clock state in Colombo time (UTC+05:30)
  const [colomboClock, setColomboClock] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setColomboClock(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Colombo',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchFloorData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [overviewRes, sessionsRes, requestsRes, alertsRes, cleaningRes] = await Promise.all([
        apiClient.get(`/api/floor/overview?locationId=${locationId}`),
        apiClient.get(`/api/floor/sessions?locationId=${locationId}`),
        apiClient.get(`/api/floor/service-requests?locationId=${locationId}&status=ALL`),
        apiClient.get(`/api/floor/kitchen-alerts?locationId=${locationId}&status=ALL`),
        apiClient.get(`/api/floor/cleaning-tasks?locationId=${locationId}&status=ALL`),
      ]);

      if (overviewRes.data?.success) setMetrics(overviewRes.data.data);
      if (sessionsRes.data?.success) setActiveSessions(sessionsRes.data.data);
      if (requestsRes.data?.success) setServiceRequests(requestsRes.data.data);
      if (alertsRes.data?.success) setKitchenAlerts(alertsRes.data.data);
      if (cleaningRes.data?.success) setCleaningTasks(cleaningRes.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load floor operations data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchFloorData();
  }, [fetchFloorData]);

  // Real-time Socket.IO listener for live floor synchronization
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleFloorUpdate = () => {
      fetchFloorData(true);
    };

    socket.on('floor.tableUpdated', handleFloorUpdate);
    socket.on('floor.guestSeated', handleFloorUpdate);
    socket.on('floor.sessionClosed', handleFloorUpdate);
    socket.on('floor.serviceRequestCreated', handleFloorUpdate);
    socket.on('floor.serviceRequestUpdated', handleFloorUpdate);
    socket.on('floor.kitchenOrderReady', handleFloorUpdate);
    socket.on('floor.cleaningStarted', handleFloorUpdate);
    socket.on('floor.cleaningCompleted', handleFloorUpdate);

    return () => {
      socket.off('floor.tableUpdated', handleFloorUpdate);
      socket.off('floor.guestSeated', handleFloorUpdate);
      socket.off('floor.sessionClosed', handleFloorUpdate);
      socket.off('floor.serviceRequestCreated', handleFloorUpdate);
      socket.off('floor.serviceRequestUpdated', handleFloorUpdate);
      socket.off('floor.kitchenOrderReady', handleFloorUpdate);
      socket.off('floor.cleaningStarted', handleFloorUpdate);
      socket.off('floor.cleaningCompleted', handleFloorUpdate);
    };
  }, [socket, isConnected, fetchFloorData]);

  // Actions
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await apiClient.post(`/api/floor/kitchen-alerts/${alertId}/acknowledge?locationId=${locationId}`);
      fetchFloorData(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to acknowledge alert');
    }
  };

  const handleHandoffOrder = async (orderId: string) => {
    try {
      await apiClient.post(`/api/floor/orders/${orderId}/handoff?locationId=${locationId}`);
      fetchFloorData(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to complete order handoff');
    }
  };

  const handleResolveRequest = async (requestId: string) => {
    try {
      await apiClient.patch(`/api/floor/service-requests/${requestId}?locationId=${locationId}`, {
        status: ServiceRequestStatus.RESOLVED,
      });
      fetchFloorData(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to resolve request');
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to close this dining session and start table turnover?')) return;
    try {
      await apiClient.post(`/api/floor/sessions/${sessionId}/close?locationId=${locationId}`);
      fetchFloorData(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to close session');
    }
  };

  const activeAlerts = kitchenAlerts.filter((a) => a.status !== 'RESOLVED');
  const openRequests = serviceRequests.filter((r) => r.status !== ServiceRequestStatus.RESOLVED && r.status !== ServiceRequestStatus.CANCELLED);
  const pendingCleaning = cleaningTasks.filter((c) => c.status !== 'COMPLETED');

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR]}>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                AURELLE / FLOOR OPERATIONS
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/60 border border-border/40 text-muted-foreground font-mono">
                {staff?.role ? `ROLE: ${staff.role}` : 'ROLE: FLOOR'}
              </span>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                }`}
              >
                <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse text-emerald-500' : 'text-zinc-500'}`} />
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-foreground">
              Floor Operations
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Coordinate dining-room service, table availability, and guest needs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {metrics?.locationName || (locationId === 'loc-kandy-vip' ? 'Aurelle Sanctuary & Pavilion (Kandy)' : 'Aurelle Grand Reserve')}
              </div>
              <div className="text-sm font-mono font-medium text-foreground">
                {colomboClock || metrics?.localTime || '--:--'} (SLST)
              </div>
            </div>

            <button
              onClick={() => fetchFloorData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border/60 hover:bg-accent transition text-foreground"
              title="Refresh Floor Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Failed to synchronize floor data</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
            <button onClick={() => fetchFloorData(false)} className="text-xs underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* AVAILABLE TABLES */}
          <div className={`p-4 rounded-xl border transition ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Available Tables</span>
              <Armchair className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-serif text-emerald-500">
              {loading ? '--' : metrics?.availableTables ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Ready for guests</span>
              <span className="text-xs font-medium text-foreground">{metrics ? `${Math.round(((metrics.availableTables || 0) / (metrics.totalTables || 1)) * 100)}%` : ''}</span>
            </div>
          </div>

          {/* OCCUPIED TABLES */}
          <div className={`p-4 rounded-xl border transition ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Occupied Tables</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-serif text-amber-500">
              {loading ? '--' : metrics?.occupiedTables ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Dining actively</span>
              <span className="text-xs font-medium text-foreground">{metrics?.activeDiningSessions ?? 0} sessions</span>
            </div>
          </div>

          {/* RESERVED TABLES */}
          <div className={`p-4 rounded-xl border transition ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Reserved Tables</span>
              <Clock className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold font-serif text-sky-500">
              {loading ? '--' : metrics?.reservedTables ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Allocated upcoming bookings
            </div>
          </div>

          {/* AWAITING CLEANING */}
          <div className={`p-4 rounded-xl border transition ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Awaiting Cleaning</span>
              <Sparkles className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold font-serif text-rose-500">
              {loading ? '--' : metrics?.awaitingCleaningTables ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Turnover required</span>
              <span className="text-xs font-medium text-foreground">{pendingCleaning.length} tasks</span>
            </div>
          </div>

          {/* ACTIVE SERVICE REQUESTS */}
          <div className={`p-4 rounded-xl border col-span-2 sm:col-span-1 transition ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Service Requests</span>
              <BellRing className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold font-serif text-purple-500">
              {loading ? '--' : openRequests.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Guest calls</span>
              {openRequests.some((r) => r.priority === ServiceRequestPriority.URGENT) && (
                <span className="text-rose-500 font-medium">Urgent</span>
              )}
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS BAR */}
        <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/staff/floor/floor-plan"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-black shadow-sm transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Interactive Floor Plan</span>
            </Link>

            <Link
              href="/staff/floor/my-tables"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-border/80 hover:bg-accent transition text-foreground"
            >
              <Armchair className="w-3.5 h-3.5 text-amber-500" />
              <span>My Assigned Tables</span>
            </Link>

            <Link
              href="/staff/floor/active-service"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-border/80 hover:bg-accent transition text-foreground"
            >
              <Users className="w-3.5 h-3.5 text-sky-500" />
              <span>Active Service ({activeSessions.length})</span>
            </Link>

            <Link
              href="/staff/floor/cleaning"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-border/80 hover:bg-accent transition text-foreground"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Cleaning Tasks ({pendingCleaning.length})</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/staff/floor/service-requests"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Service Requests ({openRequests.length})</span>
            </Link>

            <Link
              href="/staff/floor/kitchen-alerts"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Kitchen Alerts ({activeAlerts.length})</span>
            </Link>
          </div>
        </div>

        {/* MAIN SPLIT GRID: ACTIVE SESSIONS & REAL-TIME ALERTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1 & 2: ACTIVE DINING SESSIONS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  Active Dining Sessions
                </h2>
                <p className="text-xs text-muted-foreground">Currently seated tables requiring floor service</p>
              </div>
              <Link
                href="/staff/floor/active-service"
                className="text-xs font-medium text-amber-500 hover:text-amber-400 flex items-center gap-1"
              >
                <span>View All ({activeSessions.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs">Loading active tables...</span>
              </div>
            ) : activeSessions.length === 0 ? (
              <div className={`p-8 rounded-xl border text-center ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <Armchair className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium text-foreground">No active dining sessions</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tables will appear here automatically when reception seats guests.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {activeSessions.slice(0, 6).map((session) => {
                  const seatedDurationMinutes = Math.floor(
                    (Date.now() - new Date(session.seatedAt).getTime()) / (1000 * 60)
                  );
                  return (
                    <div
                      key={session.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition ${
                        isDark ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Table {session.tableNumbers.join(', ')}
                            </span>
                            <h3 className="text-sm font-medium text-foreground mt-1.5">
                              {session.guestName}
                            </h3>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {session.guestCount} {session.guestCount === 1 ? 'Guest' : 'Guests'}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {seatedDurationMinutes}m seated
                          </span>
                          {session.assignedStaffNames.length > 0 && (
                            <span className="truncate max-w-[140px] text-zinc-400">
                              Server: {session.assignedStaffNames.join(', ')}
                            </span>
                          )}
                        </div>

                        {session.notes && (
                          <div className="mt-2 text-xs italic text-amber-500/80 bg-amber-500/5 p-1.5 rounded">
                            "{session.notes}"
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                        <Link
                          href={`/staff/floor/floor-plan?table=${session.tableNumbers[0]}`}
                          className="text-xs text-amber-500 hover:underline"
                        >
                          View Table
                        </Link>
                        <button
                          onClick={() => handleCloseSession(session.id)}
                          className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-medium"
                        >
                          Turnover Table
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 3: REAL-TIME SERVICE REQUESTS & KITCHEN ALERTS */}
          <div className="space-y-6">
            {/* FOOD READY KITCHEN ALERTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Kitchen Ready Alerts ({activeAlerts.length})
                </h3>
                <Link
                  href="/staff/floor/kitchen-alerts"
                  className="text-xs text-amber-500 hover:underline"
                >
                  View All
                </Link>
              </div>

              {activeAlerts.length === 0 ? (
                <div className={`p-4 rounded-xl border text-center text-xs text-muted-foreground ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  No pending food ready alerts
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeAlerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-xl border transition ${
                        isDark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-amber-500">
                            {alert.tableNumber ? `Table ${alert.tableNumber}` : 'Dine-In'}
                          </span>
                          <p className="text-xs font-medium text-foreground mt-0.5 line-clamp-1">
                            {alert.itemsSummary}
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            Order {alert.orderReference}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
                          {alert.status}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-end gap-2">
                        {alert.status === 'NEW' && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleHandoffOrder(alert.orderId)}
                          className="text-xs px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-black font-medium transition"
                        >
                          Confirm Handoff
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GUEST SERVICE REQUESTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-purple-500" />
                  Service Requests ({openRequests.length})
                </h3>
                <Link
                  href="/staff/floor/service-requests"
                  className="text-xs text-purple-400 hover:underline"
                >
                  Manage
                </Link>
              </div>

              {openRequests.length === 0 ? (
                <div className={`p-4 rounded-xl border text-center text-xs text-muted-foreground ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  No open service requests
                </div>
              ) : (
                <div className="space-y-2.5">
                  {openRequests.slice(0, 3).map((req) => (
                    <div
                      key={req.id}
                      className={`p-3 rounded-xl border transition ${
                        isDark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-purple-400">
                              Table {req.tableNumber}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-purple-500/20 text-purple-300">
                              {req.requestType}
                            </span>
                          </div>
                          <p className="text-xs text-foreground mt-1 line-clamp-1">
                            {req.description}
                          </p>
                        </div>
                        {req.priority === ServiceRequestPriority.URGENT && (
                          <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-500/10 px-1 py-0.5 rounded">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">
                          By {req.createdBy}
                        </span>
                        <button
                          onClick={() => handleResolveRequest(req.id)}
                          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition text-xs font-medium flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TABLE CLEANING TURNOVER GLANCE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  Turnover Queue ({pendingCleaning.length})
                </h3>
                <Link
                  href="/staff/floor/cleaning"
                  className="text-xs text-rose-400 hover:underline"
                >
                  View Tasks
                </Link>
              </div>

              {pendingCleaning.length === 0 ? (
                <div className={`p-4 rounded-xl border text-center text-xs text-muted-foreground ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  All tables sanitized and ready
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingCleaning.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400">
                          Table {task.tableNumber}
                        </span>
                        <span className="text-muted-foreground">
                          {task.status === 'IN_PROGRESS' ? 'Sanitizing now...' : 'Awaiting cleaner'}
                        </span>
                      </div>
                      <Link
                        href="/staff/floor/cleaning"
                        className="text-xs font-medium text-rose-400 hover:underline"
                      >
                        Action
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
