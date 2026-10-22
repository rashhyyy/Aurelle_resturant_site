'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  IServiceRequestSafeJSON,
  ICleaningTaskSafeJSON,
  IKitchenAlertSafeJSON,
  ServiceRequestStatus,
  ServiceRequestPriority,
  CleaningTaskStatus,
  KitchenAlertStatus,
} from '../../../../types/floor';
import {
  ClipboardList,
  Sparkles,
  Flame,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Check,
  Armchair,
  Filter,
  User,
  ArrowRight,
} from 'lucide-react';

type UnifiedTaskType = 'SERVICE_REQUEST' | 'CLEANING' | 'FOOD_HANDOFF';

interface UnifiedTaskItem {
  id: string;
  sourceId: string;
  type: UnifiedTaskType;
  title: string;
  description: string;
  tableNumber: string;
  priority: ServiceRequestPriority | 'HIGH' | 'NORMAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'RESOLVED';
  assignedStaffName?: string | null;
  createdAt: string;
  orderId?: string;
}

export default function UnifiedFloorTasksPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected: isConnected } = useSocket();
  const isDark = theme === 'dark';

  const [serviceRequests, setServiceRequests] = useState<IServiceRequestSafeJSON[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<ICleaningTaskSafeJSON[]>([]);
  const [kitchenAlerts, setKitchenAlerts] = useState<IKitchenAlertSafeJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | UnifiedTaskType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchAllTasks = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [reqRes, cleanRes, alertRes] = await Promise.all([
        apiClient.get(`/api/floor/service-requests?locationId=${locationId}&status=ALL`),
        apiClient.get(`/api/floor/cleaning-tasks?locationId=${locationId}&status=ALL`),
        apiClient.get(`/api/floor/kitchen-alerts?locationId=${locationId}&status=ALL`),
      ]);

      if (reqRes.data?.success) setServiceRequests(reqRes.data.data);
      if (cleanRes.data?.success) setCleaningTasks(cleanRes.data.data);
      if (alertRes.data?.success) setKitchenAlerts(alertRes.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load floor tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = () => {
      fetchAllTasks(true);
    };

    socket.on('floor.serviceRequestCreated', handleUpdate);
    socket.on('floor.serviceRequestUpdated', handleUpdate);
    socket.on('floor.cleaningStarted', handleUpdate);
    socket.on('floor.cleaningCompleted', handleUpdate);
    socket.on('floor.kitchenOrderReady', handleUpdate);
    socket.on('floor.sessionClosed', handleUpdate);

    return () => {
      socket.off('floor.serviceRequestCreated', handleUpdate);
      socket.off('floor.serviceRequestUpdated', handleUpdate);
      socket.off('floor.cleaningStarted', handleUpdate);
      socket.off('floor.cleaningCompleted', handleUpdate);
      socket.off('floor.kitchenOrderReady', handleUpdate);
      socket.off('floor.sessionClosed', handleUpdate);
    };
  }, [socket, isConnected, fetchAllTasks]);

  // Transform and normalize tasks into unified list
  const unifiedTasks = useMemo<UnifiedTaskItem[]>(() => {
    const list: UnifiedTaskItem[] = [];

    // 1. Service Requests
    serviceRequests.forEach((req) => {
      list.push({
        id: `sr-${req.id}`,
        sourceId: req.id,
        type: 'SERVICE_REQUEST',
        title: `Guest Service: ${req.requestType.replace('_', ' ')}`,
        description: req.description,
        tableNumber: req.tableNumber,
        priority: req.priority,
        status:
          req.status === ServiceRequestStatus.RESOLVED || req.status === ServiceRequestStatus.CANCELLED
            ? 'RESOLVED'
            : req.status === ServiceRequestStatus.IN_PROGRESS
            ? 'IN_PROGRESS'
            : 'PENDING',
        assignedStaffName: req.assignedStaffName,
        createdAt: req.createdAt,
      });
    });

    // 2. Cleaning Tasks
    cleaningTasks.forEach((task) => {
      list.push({
        id: `cl-${task.id}`,
        sourceId: task.id,
        type: 'CLEANING',
        title: `Table Sanitization & Turnover`,
        description: task.notes || `Prepare Table ${task.tableNumber} for upcoming dining guests.`,
        tableNumber: task.tableNumber,
        priority: task.priority,
        status:
          task.status === CleaningTaskStatus.COMPLETED
            ? 'COMPLETED'
            : task.status === CleaningTaskStatus.IN_PROGRESS
            ? 'IN_PROGRESS'
            : 'PENDING',
        assignedStaffName: task.assignedStaffName,
        createdAt: task.createdAt,
      });
    });

    // 3. Kitchen Food Handoffs
    kitchenAlerts.forEach((alert) => {
      list.push({
        id: `ka-${alert.id}`,
        sourceId: alert.id,
        type: 'FOOD_HANDOFF',
        title: `Food Pass: Order ${alert.orderReference}`,
        description: alert.itemsSummary || 'Dishes ready on pass for delivery to guest table.',
        tableNumber: alert.tableNumber || 'Station',
        priority: 'HIGH',
        status:
          alert.status === KitchenAlertStatus.RESOLVED
            ? 'COMPLETED'
            : alert.status === KitchenAlertStatus.ACKNOWLEDGED
            ? 'IN_PROGRESS'
            : 'PENDING',
        assignedStaffName: alert.acknowledgedBy,
        createdAt: alert.createdAt,
        orderId: alert.orderId,
      });
    });

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [serviceRequests, cleaningTasks, kitchenAlerts]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return unifiedTasks.filter((task) => {
      if (typeFilter !== 'ALL' && task.type !== typeFilter) return false;
      if (statusFilter === 'ACTIVE' && (task.status === 'COMPLETED' || task.status === 'RESOLVED')) {
        return false;
      }
      if (statusFilter === 'COMPLETED' && task.status !== 'COMPLETED' && task.status !== 'RESOLVED') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          task.tableNumber.toLowerCase().includes(q) ||
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          (task.assignedStaffName && task.assignedStaffName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [unifiedTasks, typeFilter, statusFilter, searchQuery]);

  // Action handlers
  const handleAction = async (task: UnifiedTaskItem) => {
    try {
      if (task.type === 'SERVICE_REQUEST') {
        if (task.status === 'PENDING') {
          await apiClient.patch(`/api/floor/service-requests/${task.sourceId}?locationId=${locationId}`, {
            status: ServiceRequestStatus.IN_PROGRESS,
          });
        } else {
          await apiClient.patch(`/api/floor/service-requests/${task.sourceId}?locationId=${locationId}`, {
            status: ServiceRequestStatus.RESOLVED,
          });
        }
      } else if (task.type === 'CLEANING') {
        if (task.status === 'PENDING') {
          await apiClient.post(`/api/floor/cleaning-tasks/${task.sourceId}/start?locationId=${locationId}`);
        } else {
          await apiClient.post(`/api/floor/cleaning-tasks/${task.sourceId}/complete?locationId=${locationId}`);
        }
      } else if (task.type === 'FOOD_HANDOFF') {
        if (task.status === 'PENDING') {
          await apiClient.post(`/api/floor/kitchen-alerts/${task.sourceId}/acknowledge?locationId=${locationId}`);
        } else if (task.orderId) {
          await apiClient.post(`/api/floor/orders/${task.orderId}/handoff?locationId=${locationId}`);
        }
      }
      fetchAllTasks(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update task');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'LOW':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
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
                AURELLE / FLOOR TASKS
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 font-mono">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
              Floor Service Tasks & Reset Checklists
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Unified operational queue for guest calls, food pass handoffs, and dining turnover sanitization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/staff/floor"
              className="text-xs px-3 py-2 rounded-lg border border-border/60 hover:bg-accent text-foreground transition font-medium"
            >
              &larr; Floor Operations
            </Link>
            <button
              onClick={() => fetchAllTasks(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border/60 hover:bg-accent transition text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Failed to load service tasks</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
            <button onClick={() => fetchAllTasks(false)} className="text-xs underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* CONTROLS & FILTER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* SEARCH */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search table, task type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
              } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TYPE FILTER */}
            <div className="flex items-center bg-accent/40 p-1 rounded-lg border border-border/40 text-xs">
              {(
                [
                  { id: 'ALL', label: 'All Types' },
                  { id: 'SERVICE_REQUEST', label: 'Guest Calls' },
                  { id: 'FOOD_HANDOFF', label: 'Food Pass' },
                  { id: 'CLEANING', label: 'Sanitization' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    typeFilter === f.id
                      ? 'bg-amber-500 text-black shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* STATUS FILTER */}
            <div className="flex items-center bg-accent/40 p-1 rounded-lg border border-border/40 text-xs">
              {(
                [
                  { id: 'ACTIVE', label: 'Active Tasks' },
                  { id: 'COMPLETED', label: 'Completed' },
                  { id: 'ALL', label: 'All' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    statusFilter === f.id
                      ? 'bg-amber-500 text-black shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TASK CARDS LIST */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
            <span className="text-xs">Loading operational service tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-serif font-medium text-foreground">No Tasks in Queue</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              All guest requests, kitchen pickups, and turnover sanitization tasks are completed for this section.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const isFinished = task.status === 'COMPLETED' || task.status === 'RESOLVED';
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
                  } ${isFinished ? 'opacity-60' : 'hover:border-amber-500/40'}`}
                >
                  <div>
                    {/* TOP ROW: ICON, BADGES */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                            task.type === 'SERVICE_REQUEST'
                              ? 'bg-purple-500/10 text-purple-400'
                              : task.type === 'FOOD_HANDOFF'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {task.type === 'SERVICE_REQUEST' && <BellRing className="w-4 h-4" />}
                          {task.type === 'FOOD_HANDOFF' && <Flame className="w-4 h-4" />}
                          {task.type === 'CLEANING' && <Sparkles className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-mono font-bold text-foreground">
                          Table {task.tableNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isFinished
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* TITLE & DESCRIPTION */}
                    <h4 className="text-sm font-semibold text-foreground mb-1">{task.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {task.description}
                    </p>
                  </div>

                  {/* FOOTER & ACTION BUTTON */}
                  <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {!isFinished && (
                      <button
                        onClick={() => handleAction(task)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                          task.status === 'IN_PROGRESS'
                            ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                            : 'bg-amber-500 text-black hover:bg-amber-400'
                        }`}
                      >
                        {task.status === 'PENDING' ? (
                          <>
                            <span>Start Task</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </>
                        )}
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
