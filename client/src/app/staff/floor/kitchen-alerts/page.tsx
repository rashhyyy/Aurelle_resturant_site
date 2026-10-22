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
  IKitchenAlertSafeJSON,
  KitchenAlertStatus,
} from '../../../../types/floor';
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Armchair,
  Clock,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function KitchenAlertsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected: isConnected } = useSocket();
  const isDark = theme === 'dark';

  const [alerts, setAlerts] = useState<IKitchenAlertSafeJSON[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchAlerts = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await apiClient.get(
        `/api/floor/kitchen-alerts?locationId=${locationId}&status=${statusFilter}`
      );
      if (res.data?.success) {
        setAlerts(res.data.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load kitchen alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId, statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = () => {
      fetchAlerts(true);
    };

    socket.on('floor.kitchenOrderReady', handleUpdate);

    return () => {
      socket.off('floor.kitchenOrderReady', handleUpdate);
    };
  }, [socket, isConnected, fetchAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiClient.post(`/api/floor/kitchen-alerts/${alertId}/acknowledge?locationId=${locationId}`);
      fetchAlerts(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to acknowledge alert');
    }
  };

  const handleHandoff = async (orderId: string) => {
    try {
      await apiClient.post(`/api/floor/orders/${orderId}/handoff?locationId=${locationId}`);
      fetchAlerts(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to complete order handoff');
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
                AURELLE / KITCHEN INTEGRATION
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono font-medium">
                {alerts.length} Alerts
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
              Kitchen-Ready Food Alerts
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live notifications when the kitchen marks dine-in orders ready for customer table handoff.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAlerts(true)}
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
              <span>Interactive Floor Plan</span>
            </Link>
          </div>
        </div>

        {/* STATUS FILTER TABS */}
        <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto">
          {['ALL', KitchenAlertStatus.NEW, KitchenAlertStatus.ACKNOWLEDGED, KitchenAlertStatus.RESOLVED].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                statusFilter === st
                  ? 'bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Failed to load alerts</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
            <button onClick={() => fetchAlerts(false)} className="text-xs underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm">Loading kitchen alerts...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <Flame className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Food-Ready Alerts</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
              There are no kitchen alerts in this status. When chefs mark plated dishes ready on the Kitchen Display System (Stage 8), notifications will arrive in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {alert.tableNumber ? `Table ${alert.tableNumber}` : 'Dine-In Order'}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground mt-2">
                        Order {alert.orderReference}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        alert.status === KitchenAlertStatus.NEW
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : alert.status === KitchenAlertStatus.ACKNOWLEDGED
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>

                  {/* ITEMS SUMMARY */}
                  <div className={`p-3 rounded-xl border mt-3 text-xs ${isDark ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                    <span className="text-muted-foreground block text-[11px] mb-0.5">Plated Dishes:</span>
                    <p className="font-medium text-foreground">{alert.itemsSummary}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      Ready {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {alert.acknowledgedBy && (
                      <span>Ack by {alert.acknowledgedBy}</span>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}
                {alert.status !== KitchenAlertStatus.RESOLVED && (
                  <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
                    {alert.status === KitchenAlertStatus.NEW && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => handleHandoff(alert.orderId)}
                      className="text-xs px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold transition"
                    >
                      Confirm Handoff to Table
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
