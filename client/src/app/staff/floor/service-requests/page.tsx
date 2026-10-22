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
  IServiceRequestSafeJSON,
  ServiceRequestStatus,
  ServiceRequestType,
  ServiceRequestPriority,
  FloorTableDetailItem,
} from '../../../../types/floor';
import {
  BellRing,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Armchair,
  Check,
  X,
  Search,
} from 'lucide-react';

export default function ServiceRequestsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected: isConnected } = useSocket();
  const isDark = theme === 'dark';

  const [requests, setRequests] = useState<IServiceRequestSafeJSON[]>([]);
  const [tables, setTables] = useState<FloorTableDetailItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Request Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tableNumber: '',
    requestType: ServiceRequestType.WATER,
    priority: ServiceRequestPriority.NORMAL,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchRequests = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [reqRes, tabRes] = await Promise.all([
        apiClient.get(`/api/floor/service-requests?locationId=${locationId}&status=${statusFilter}`),
        apiClient.get(`/api/floor/tables?locationId=${locationId}`),
      ]);

      if (reqRes.data?.success) setRequests(reqRes.data.data);
      if (tabRes.data?.success) setTables(tabRes.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load service requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = () => {
      fetchRequests(true);
    };

    socket.on('floor.serviceRequestCreated', handleUpdate);
    socket.on('floor.serviceRequestUpdated', handleUpdate);

    return () => {
      socket.off('floor.serviceRequestCreated', handleUpdate);
      socket.off('floor.serviceRequestUpdated', handleUpdate);
    };
  }, [socket, isConnected, fetchRequests]);

  const handleUpdateStatus = async (requestId: string, newStatus: ServiceRequestStatus) => {
    try {
      await apiClient.patch(`/api/floor/service-requests/${requestId}?locationId=${locationId}`, {
        status: newStatus,
      });
      fetchRequests(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update request');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tableNumber || !formData.description) {
      alert('Please select a table and enter description.');
      return;
    }
    try {
      setSubmitting(true);
      await apiClient.post('/api/floor/service-requests', {
        locationId,
        tableNumber: formData.tableNumber,
        requestType: formData.requestType,
        priority: formData.priority,
        description: formData.description,
      });
      setIsModalOpen(false);
      setFormData({
        tableNumber: '',
        requestType: ServiceRequestType.WATER,
        priority: ServiceRequestPriority.NORMAL,
        description: '',
      });
      fetchRequests(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR]}>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">
                AURELLE / FLOOR SERVICE
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono font-medium">
                {requests.length} Requests
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
              Guest Service Requests
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Coordinate water refills, extra cutlery, bill requests, and guest assistance calls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRequests(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border/60 hover:bg-accent transition text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-500' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Request</span>
            </button>
          </div>
        </div>

        {/* STATUS TABS */}
        <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto">
          {['ALL', ServiceRequestStatus.OPEN, ServiceRequestStatus.IN_PROGRESS, ServiceRequestStatus.RESOLVED].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                statusFilter === st
                  ? 'bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Failed to load requests</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
            <button onClick={() => fetchRequests(false)} className="text-xs underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* REQUESTS LIST */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="text-sm">Loading service requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <BellRing className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Service Requests</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
              There are no active requests in this filter category. Click "New Request" to log a guest need.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Table {req.tableNumber}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {req.requestType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {req.priority === ServiceRequestPriority.URGENT && (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          Urgent
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          req.status === ServiceRequestStatus.OPEN
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : req.status === ServiceRequestStatus.IN_PROGRESS
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : req.status === ServiceRequestStatus.RESOLVED
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-zinc-500/10 text-zinc-400'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground mt-2">
                    {req.description}
                  </p>

                  <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>By {req.createdBy}</span>
                    <span className="font-mono">
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                {req.status !== ServiceRequestStatus.RESOLVED && req.status !== ServiceRequestStatus.CANCELLED && (
                  <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
                    {req.status === ServiceRequestStatus.OPEN && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, ServiceRequestStatus.IN_PROGRESS)}
                        className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-medium"
                      >
                        Start Task
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(req.id, ServiceRequestStatus.RESOLVED)}
                      className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* NEW SERVICE REQUEST MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-purple-500" />
                  New Service Request
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    Dining Table *
                  </label>
                  <select
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-foreground"
                  >
                    <option value="">Select Table...</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.tableNumber}>
                        Table {t.tableNumber} ({t.section.replace('_', ' ')}) &bull; {t.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">
                      Request Type *
                    </label>
                    <select
                      value={formData.requestType}
                      onChange={(e) => setFormData({ ...formData, requestType: e.target.value as ServiceRequestType })}
                      className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-foreground"
                    >
                      {Object.values(ServiceRequestType).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as ServiceRequestPriority })}
                      className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-foreground"
                    >
                      {Object.values(ServiceRequestPriority).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-muted-foreground font-medium mb-1">
                    Details / Instructions *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Still water carafe requested, extra napkins and butter knife..."
                    rows={3}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border/60 bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-border/60 hover:bg-accent text-foreground font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Request</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
