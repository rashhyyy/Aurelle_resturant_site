'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { OverrideConfirmModal } from '../../../../components/staff/manager/OverrideConfirmModal';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import { IOperationalAlert, AlertSeverity, AlertStatus, AlertType } from '../../../../types/manager';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  X,
  ShieldAlert,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';

export default function ManagerAlertsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const [alerts, setAlerts] = useState<IOperationalAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<{ open: number; acknowledged: number; resolved: number }>({
    open: 0,
    acknowledged: 0,
    resolved: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [selectedAlert, setSelectedAlert] = useState<IOperationalAlert | null>(null);
  const [modalType, setModalType] = useState<'resolve' | 'escalate' | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchAlerts = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const queryParams = new URLSearchParams({
          locationId,
          page: page.toString(),
          limit: '20',
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(severityFilter ? { severity: severityFilter } : {}),
        });

        const res = await apiClient<{
          success: boolean;
          data: {
            alerts: IOperationalAlert[];
            total: number;
            page: number;
            limit: number;
            counts: { open: number; acknowledged: number; resolved: number };
          };
        }>(`/manager/alerts?${queryParams.toString()}`);

        if (res.success && res.data) {
          setAlerts(res.data.alerts);
          setTotal(res.data.total);
          setCounts(res.data.counts);
        }
      } catch (err: any) {
        console.error('Failed to load operational alerts:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId, page, statusFilter, severityFilter]
  );

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchAlerts();
    socket.on('alert:created', handleUpdate);
    socket.on('alert:acknowledged', handleUpdate);
    socket.on('alert:resolved', handleUpdate);
    return () => {
      socket.off('alert:created', handleUpdate);
      socket.off('alert:acknowledged', handleUpdate);
      socket.off('alert:resolved', handleUpdate);
    };
  }, [socket, fetchAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiClient(`/manager/alerts/${alertId}/acknowledge?locationId=${locationId}`, {
        method: 'POST',
      });
      fetchAlerts();
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
    setSelectedAlert(null);
    setModalType(null);
    fetchAlerts();
  };

  const handleEscalateAlert = async (reason: string) => {
    if (!selectedAlert) return;
    await apiClient(`/manager/overrides?locationId=${locationId}`, {
      method: 'POST',
      data: {
        action: 'ESCALATE_ALERT',
        targetId: selectedAlert.id,
        reason,
      },
    });
    setSelectedAlert(null);
    setModalType(null);
    fetchAlerts();
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Operational Alerts"
        description="Monitor automated system threshold breaches, service bottlenecks, and managerial escalations."
        onRefresh={() => fetchAlerts(true)}
        refreshing={refreshing}
      />

      {/* Summary Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 font-mono text-xs">
        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'OPEN' ? '' : 'OPEN');
            setPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'OPEN'
              ? 'border-rose-500 bg-rose-950/20'
              : 'border-[#2A2925] bg-[#141412] hover:bg-[#1A1916]'
          }`}
        >
          <div className="text-rose-400 text-[11px] uppercase flex items-center justify-between">
            <span>Open Alerts</span>
            {counts.open > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          </div>
          <div className="text-2xl font-serif text-rose-400 font-semibold mt-1">
            {counts.open}
          </div>
          <div className="text-stone-500 text-[11px] mt-0.5">Requiring managerial review</div>
        </button>

        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'ACKNOWLEDGED' ? '' : 'ACKNOWLEDGED');
            setPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'ACKNOWLEDGED'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-[#2A2925] bg-[#141412] hover:bg-[#1A1916]'
          }`}
        >
          <div className="text-amber-400 text-[11px] uppercase">Acknowledged</div>
          <div className="text-2xl font-serif text-amber-400 font-semibold mt-1">
            {counts.acknowledged}
          </div>
          <div className="text-stone-500 text-[11px] mt-0.5">Assigned & in-progress</div>
        </button>

        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'RESOLVED' ? '' : 'RESOLVED');
            setPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'RESOLVED'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-[#2A2925] bg-[#141412] hover:bg-[#1A1916]'
          }`}
        >
          <div className="text-emerald-400 text-[11px] uppercase">Resolved</div>
          <div className="text-2xl font-serif text-emerald-400 font-semibold mt-1">
            {counts.resolved}
          </div>
          <div className="text-stone-500 text-[11px] mt-0.5">Completed conditions</div>
        </button>
      </div>

      {/* Filter toolbar */}
      <div
        className={`p-4 rounded-xl border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-mono bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-mono bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div className="text-xs font-mono text-[#A5A198]">
          Showing {alerts.length} of {total} alerts
        </div>
      </div>

      {/* Alerts List */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        {loading ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading operational alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            No alerts match the selected criteria.
          </div>
        ) : (
          <div className="divide-y divide-[#2A2925]">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1C1B17]/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold shrink-0 mt-0.5 ${
                      alert.severity === AlertSeverity.CRITICAL
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : alert.severity === AlertSeverity.HIGH
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {alert.severity}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-[#B99A63] uppercase">
                        {alert.alertType.replace(/_/g, ' ')}
                      </span>
                      {alert.sourceReference && (
                        <span className="font-mono text-xs text-stone-500">
                          • {alert.sourceReference}
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-sm text-[#F6F1E8] mb-1">
                      {alert.message}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-500">
                      <span>Triggered: {new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.acknowledgedBy && (
                        <span className="text-amber-400/80">
                          Ack by: {alert.acknowledgedBy.name}
                        </span>
                      )}
                      {alert.resolvedBy && (
                        <span className="text-emerald-400/80">
                          Resolved by: {alert.resolvedBy.name} ({alert.resolutionNotes})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {alert.status === AlertStatus.OPEN && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#A5A198] hover:text-[#F6F1E8] bg-[#1E1D1A] hover:bg-[#2A2925] border border-[#2A2925] transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== AlertStatus.RESOLVED && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAlert(alert);
                          setModalType('resolve');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        <span>Resolve</span>
                      </button>

                      {alert.severity !== AlertSeverity.CRITICAL && (
                        <button
                          onClick={() => {
                            setSelectedAlert(alert);
                            setModalType('escalate');
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 transition-colors"
                          title="Escalate severity to CRITICAL"
                        >
                          Escalate
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="p-4 border-t border-[#2A2925] flex items-center justify-between text-xs font-mono text-stone-400">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border border-[#2A2925] hover:bg-[#1C1B17] disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-3 py-1.5 rounded border border-[#2A2925] hover:bg-[#1C1B17] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Resolve Alert Modal */}
      {selectedAlert && modalType === 'resolve' && (
        <OverrideConfirmModal
          isOpen={true}
          onClose={() => {
            setSelectedAlert(null);
            setModalType(null);
          }}
          title="Resolve Operational Alert"
          actionName="ALERT RESOLUTION"
          description="Document the corrective actions taken before marking this operational condition as resolved."
          recordSummary={`${selectedAlert.alertType}: ${selectedAlert.message}`}
          onConfirm={handleResolveAlert}
        />
      )}

      {/* Escalate Alert Modal */}
      {selectedAlert && modalType === 'escalate' && (
        <OverrideConfirmModal
          isOpen={true}
          onClose={() => {
            setSelectedAlert(null);
            setModalType(null);
          }}
          title="Escalate Alert to Critical"
          actionName="MANAGERIAL ESCALATION"
          description="Escalate this alert to CRITICAL priority to trigger high-visibility alerts across floor and management displays."
          recordSummary={`${selectedAlert.alertType}: ${selectedAlert.message}`}
          onConfirm={handleEscalateAlert}
        />
      )}
    </StaffLayout>
  );
}
