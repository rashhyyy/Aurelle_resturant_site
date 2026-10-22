'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  FloorTableDetailItem,
  TableStatus,
  ServiceRequestStatus,
} from '../../../../types/floor';
import {
  Armchair,
  Users,
  Clock,
  Sparkles,
  BellRing,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  User,
  ShoppingBag,
} from 'lucide-react';

export default function MyAssignedTablesPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected: isConnected } = useSocket();
  const isDark = theme === 'dark';

  const [myTables, setMyTables] = useState<FloorTableDetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchMyTables = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await apiClient.get(`/api/floor/my-tables?locationId=${locationId}`);
      if (res.data?.success) {
        setMyTables(res.data.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load assigned tables');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchMyTables();
  }, [fetchMyTables]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = () => {
      fetchMyTables(true);
    };

    socket.on('floor.tableUpdated', handleUpdate);
    socket.on('floor.guestSeated', handleUpdate);
    socket.on('floor.sessionClosed', handleUpdate);
    socket.on('floor.serviceRequestCreated', handleUpdate);
    socket.on('floor.serviceRequestUpdated', handleUpdate);
    socket.on('floor.kitchenOrderReady', handleUpdate);

    return () => {
      socket.off('floor.tableUpdated', handleUpdate);
      socket.off('floor.guestSeated', handleUpdate);
      socket.off('floor.sessionClosed', handleUpdate);
      socket.off('floor.serviceRequestCreated', handleUpdate);
      socket.off('floor.serviceRequestUpdated', handleUpdate);
      socket.off('floor.kitchenOrderReady', handleUpdate);
    };
  }, [socket, isConnected, fetchMyTables]);

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Close this dining session and start table turnover?')) return;
    try {
      await apiClient.post(`/api/floor/sessions/${sessionId}/close?locationId=${locationId}`);
      fetchMyTables(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to close session');
    }
  };

  const handleHandoff = async (orderId: string) => {
    try {
      await apiClient.post(`/api/floor/orders/${orderId}/handoff?locationId=${locationId}`);
      fetchMyTables(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to complete handoff');
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR]}>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                AURELLE / FLOOR SERVICE
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {staff?.firstName} {staff?.lastName} ({staff?.role})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
              My Assigned Tables
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live service status and active orders for tables currently assigned to your shift.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchMyTables(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border/60 hover:bg-accent transition text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/staff/floor/floor-plan"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-xs transition"
            >
              <Armchair className="w-3.5 h-3.5" />
              <span>View Full Floor Plan</span>
            </Link>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Failed to load assigned tables</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
            <button onClick={() => fetchMyTables(false)} className="text-xs underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm">Loading your assigned tables...</span>
          </div>
        ) : myTables.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <Armchair className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Tables Currently Assigned</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
              You do not have any dining tables assigned to your station for this shift. Managers can assign tables via the Interactive Floor Plan or Table Roster.
            </p>
            <div className="mt-5">
              <Link
                href="/staff/floor/floor-plan"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold transition"
              >
                <span>Browse Restaurant Floor Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myTables.map((table) => {
              const hasAlert = table.kitchenAlerts && table.kitchenAlerts.length > 0;
              const hasRequests = table.serviceRequests && table.serviceRequests.length > 0;
              const durationMinutes = table.activeSession
                ? Math.floor((Date.now() - new Date(table.activeSession.seatedAt).getTime()) / 60000)
                : 0;

              return (
                <div
                  key={table.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-4">
                    {/* CARD HEADER */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-mono font-bold text-amber-500">
                            Table {table.tableNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              table.status === TableStatus.AVAILABLE
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : table.status === TableStatus.OCCUPIED
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : table.status === TableStatus.AWAITING_CLEANING
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : 'bg-zinc-500/10 text-zinc-400'
                            }`}
                          >
                            {table.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {table.section.replace('_', ' ')} &bull; {table.capacity} Seats
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasAlert && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Kitchen Order Ready" />
                        )}
                        {hasRequests && (
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" title="Service Request Open" />
                        )}
                      </div>
                    </div>

                    {/* ACTIVE SESSION DETAILS */}
                    {table.activeSession ? (
                      <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/60 border-amber-200/60'}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">
                            {table.activeSession.guestName}
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {table.activeSession.guestCount} Guests
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {durationMinutes}m seated
                          </span>
                          {table.activeSession.reservationReference && (
                            <span className="font-mono text-[11px] text-amber-500">
                              {table.activeSession.reservationReference}
                            </span>
                          )}
                        </div>
                        {table.activeSession.notes && (
                          <p className="text-xs italic text-amber-500/90 pt-1 border-t border-amber-500/10">
                            "{table.activeSession.notes}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className={`p-3 rounded-xl border text-center text-xs text-muted-foreground ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        No guests seated currently
                      </div>
                    )}

                    {/* KITCHEN READY ALERTS */}
                    {hasAlert && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-amber-500">
                          <span className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5" /> Food Ready in Kitchen
                          </span>
                        </div>
                        {table.kitchenAlerts!.map((alert) => (
                          <div key={alert.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-foreground line-clamp-1">{alert.itemsSummary}</span>
                            <button
                              onClick={() => handleHandoff(alert.orderId)}
                              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition"
                            >
                              Handoff
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SERVICE REQUESTS */}
                    {hasRequests && (
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                        <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                          <BellRing className="w-3.5 h-3.5" /> Guest Service Requests
                        </div>
                        {table.serviceRequests!.map((req) => (
                          <div key={req.id} className="text-xs text-foreground flex items-center justify-between">
                            <span className="capitalize">{req.requestType.toLowerCase()}: {req.description}</span>
                            <span className="text-[10px] text-purple-400 font-mono font-medium">{req.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="pt-4 border-t border-border/40 mt-4 flex items-center justify-between gap-2">
                    <Link
                      href={`/staff/floor/floor-plan?table=${table.tableNumber}`}
                      className="text-xs text-amber-500 hover:underline font-medium"
                    >
                      Table Dossier &rarr;
                    </Link>

                    {table.activeSession && (
                      <button
                        onClick={() => handleCloseSession(table.activeSession!.id)}
                        className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
                      >
                        Turnover Table
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
