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
  ICleaningTaskSafeJSON,
  CleaningTaskStatus,
} from '../../../../types/floor';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Armchair,
  Clock,
  ArrowRight,
  Check,
  User,
} from 'lucide-react';

export default function CleaningTasksPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected: isConnected } = useSocket();
  const isDark = theme === 'dark';

  const [tasks, setTasks] = useState<ICleaningTaskSafeJSON[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchTasks = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await apiClient.get(
        `/api/floor/cleaning-tasks?locationId=${locationId}&status=${statusFilter}`
      );
      if (res.data?.success) {
        setTasks(res.data.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load cleaning tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = () => {
      fetchTasks(true);
    };

    socket.on('floor.cleaningStarted', handleUpdate);
    socket.on('floor.cleaningCompleted', handleUpdate);
    socket.on('floor.tableUpdated', handleUpdate);

    return () => {
      socket.off('floor.cleaningStarted', handleUpdate);
      socket.off('floor.cleaningCompleted', handleUpdate);
      socket.off('floor.tableUpdated', handleUpdate);
    };
  }, [socket, isConnected, fetchTasks]);

  const handleStartCleaning = async (taskId: string) => {
    try {
      await apiClient.post(`/api/floor/cleaning-tasks/${taskId}/start?locationId=${locationId}`);
      fetchTasks(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to start cleaning');
    }
  };

  const handleCompleteCleaning = async (taskId: string) => {
    try {
      await apiClient.post(`/api/floor/cleaning-tasks/${taskId}/complete?locationId=${locationId}`);
      fetchTasks(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to complete cleaning');
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR]}>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                AURELLE / TABLE TURNOVER
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-mono font-medium">
                {tasks.length} Turnover Tasks
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
              Table Turnover & Cleaning
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Sanitization workflow to transition tables from awaiting cleaning to available for reception seating.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTasks(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border/60 hover:bg-accent transition text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-rose-500' : ''}`} />
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

        {/* STATUS TABS */}
        <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto">
          {['ALL', CleaningTaskStatus.PENDING, CleaningTaskStatus.IN_PROGRESS, CleaningTaskStatus.COMPLETED].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                statusFilter === st
                  ? 'bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30'
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
              <p className="font-medium">Failed to load turnover tasks</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
            <button onClick={() => fetchTasks(false)} className="text-xs underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-sm">Loading cleaning tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Cleaning Tasks</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
              All dining tables are currently sanitized and ready for guest seating. Cleaning tasks are created automatically when dining sessions conclude.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Table {task.tableNumber}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground mt-2">
                        Sanitization Required
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        task.status === CleaningTaskStatus.PENDING
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : task.status === CleaningTaskStatus.IN_PROGRESS
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  {task.notes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-zinc-800/40 p-2 rounded-lg border border-border/40">
                      {task.notes}
                    </p>
                  )}

                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Created:</span>
                      <span className="font-mono">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {task.startedBy && (
                      <div className="flex items-center justify-between">
                        <span>Cleaner:</span>
                        <span className="font-medium text-foreground">{task.startedBy}</span>
                      </div>
                    )}
                    {task.completedBy && (
                      <div className="flex items-center justify-between">
                        <span>Completed by:</span>
                        <span className="font-medium text-emerald-500">{task.completedBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}
                {task.status !== CleaningTaskStatus.COMPLETED && (
                  <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
                    {task.status === CleaningTaskStatus.PENDING ? (
                      <button
                        onClick={() => handleStartCleaning(task.id)}
                        className="text-xs px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-semibold transition"
                      >
                        Start Cleaning
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompleteCleaning(task.id)}
                        className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Complete Cleaning
                      </button>
                    )}
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
