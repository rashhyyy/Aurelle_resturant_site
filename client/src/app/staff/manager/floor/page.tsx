'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { OverrideConfirmModal } from '../../../../components/staff/manager/OverrideConfirmModal';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  Armchair,
  Users,
  Clock,
  Sparkles,
  AlertCircle,
  Eye,
  X,
  User,
  ArrowRight,
  CheckCircle2,
  BellRing,
  RotateCcw,
} from 'lucide-react';

interface TableRecord {
  id: string;
  tableNumber: string;
  name: string;
  capacity: number;
  section: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'AWAITING_CLEANING' | 'CLEANING' | 'UNAVAILABLE';
  assignedStaffId?: string;
  assignedStaffName?: string;
  layout?: {
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    shape: string;
  };
}

interface DiningSessionRecord {
  id: string;
  tableNumbers: string[];
  guestName: string;
  guestCount: number;
  seatedAt: string;
  assignedStaffNames: string[];
}

interface ServiceRequestRecord {
  id: string;
  tableNumber: string;
  requestType: string;
  priority: string;
  status: string;
  assignedStaffName?: string;
  createdAt: string;
}

interface CleaningTaskRecord {
  id: string;
  tableNumber: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface FloorData {
  locationId: string;
  counts: {
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    total: number;
  };
  tables: TableRecord[];
  activeDiningSessions: DiningSessionRecord[];
  serviceRequests: ServiceRequestRecord[];
  cleaningTasks: CleaningTaskRecord[];
}

export default function ManagerFloorPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const [data, setData] = useState<FloorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null);
  const [sectionFilter, setSectionFilter] = useState('ALL');

  // Override modal state
  const [cleaningOverrideTask, setCleaningOverrideTask] = useState<CleaningTaskRecord | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchFloor = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await apiClient<{ success: boolean; data: FloorData }>(
          `/manager/floor?locationId=${locationId}`
        );
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        console.error('Failed to load floor data:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId]
  );

  useEffect(() => {
    fetchFloor();
  }, [fetchFloor]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchFloor();
    socket.on('floor:table_status_changed', handleUpdate);
    socket.on('floor:service_request_created', handleUpdate);
    socket.on('floor:service_request_updated', handleUpdate);
    socket.on('floor:cleaning_task_updated', handleUpdate);
    socket.on('guest:seated', handleUpdate);
    return () => {
      socket.off('floor:table_status_changed', handleUpdate);
      socket.off('floor:service_request_created', handleUpdate);
      socket.off('floor:service_request_updated', handleUpdate);
      socket.off('floor:cleaning_task_updated', handleUpdate);
      socket.off('guest:seated', handleUpdate);
    };
  }, [socket, fetchFloor]);

  const handleForceCleaningComplete = async (reason: string) => {
    if (!cleaningOverrideTask) return;
    await apiClient(`/manager/overrides?locationId=${locationId}`, {
      method: 'POST',
      data: {
        action: 'FORCE_CLEANING_COMPLETE',
        targetId: cleaningOverrideTask.id,
        reason,
      },
    });
    setCleaningOverrideTask(null);
    fetchFloor();
  };

  const filteredTables =
    data?.tables.filter((t) => (sectionFilter === 'ALL' ? true : t.section === sectionFilter)) || [];

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Floor Operations Monitoring"
        description="Monitor dining room tables, live guest sessions, turnover cleanings, and service calls."
        onRefresh={() => fetchFloor(true)}
        refreshing={refreshing}
      />

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 font-mono text-xs">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/15">
            <div className="text-emerald-400 text-[11px] uppercase">Available Tables</div>
            <div className="text-2xl font-serif text-emerald-400 font-semibold mt-1">
              {data.counts.available}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/15">
            <div className="text-blue-400 text-[11px] uppercase">Occupied Tables</div>
            <div className="text-2xl font-serif text-blue-400 font-semibold mt-1">
              {data.counts.occupied}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/15">
            <div className="text-purple-400 text-[11px] uppercase">Reserved Tables</div>
            <div className="text-2xl font-serif text-purple-400 font-semibold mt-1">
              {data.counts.reserved}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/15">
            <div className="text-amber-400 text-[11px] uppercase">Awaiting Cleaning</div>
            <div className="text-2xl font-serif text-amber-400 font-semibold mt-1">
              {data.counts.cleaning}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-[#B99A63]/30 bg-[#B99A63]/10">
            <div className="text-[#B99A63] text-[11px] uppercase">Active Dining Sessions</div>
            <div className="text-2xl font-serif text-[#F6F1E8] font-semibold mt-1">
              {data.activeDiningSessions.length}
            </div>
          </div>
        </div>
      )}

      {/* Main Floor Plan Grid */}
      <div
        className={`p-6 rounded-xl border mb-6 ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#2A2925]">
          <div>
            <h3 className="font-serif text-lg text-[#F6F1E8]">Read-Only Floor Plan Overview</h3>
            <p className="text-xs text-[#A5A198]">
              Live dining room table occupancy mapping based on real MongoDB floor layout
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-400">Section:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
            >
              <option value="ALL">All Sections</option>
              <option value="MAIN_DINING">Main Dining</option>
              <option value="CHEFS_COUNTER">Chef&apos;s Counter</option>
              <option value="OUTDOOR_TERRACE">Outdoor Terrace</option>
              <option value="PRIVATE_DINING">Private Dining</option>
            </select>
          </div>
        </div>

        {loading && !data ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading floor layout...
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-16 text-center text-stone-500 font-mono text-sm">
            No tables found matching the section filter.
          </div>
        ) : (
          /* Visual Table Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredTables.map((table) => {
              const isOccupied = table.status === 'OCCUPIED';
              const isAvailable = table.status === 'AVAILABLE';
              const isReserved = table.status === 'RESERVED';
              const isCleaning = table.status === 'AWAITING_CLEANING' || table.status === 'CLEANING';

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                    isOccupied
                      ? 'bg-blue-950/20 border-blue-500/40 hover:border-blue-400'
                      : isCleaning
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 animate-pulse'
                      : isReserved
                      ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-400'
                      : 'bg-[#181714] border-[#2A2925] hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif text-lg font-bold text-[#F6F1E8]">
                      {table.tableNumber}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOccupied
                          ? 'bg-blue-400'
                          : isCleaning
                          ? 'bg-amber-400'
                          : isReserved
                          ? 'bg-purple-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                  </div>

                  <div className="text-xs font-mono text-stone-400 space-y-1 mb-2">
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-[#B99A63]" />
                      <span>{table.capacity} Seats</span>
                    </div>
                    {table.assignedStaffName ? (
                      <div className="truncate text-stone-300">
                        Waiter: {table.assignedStaffName}
                      </div>
                    ) : (
                      <div className="text-stone-600">Unassigned</div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#2A2925] flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded ${
                        isOccupied
                          ? 'bg-blue-500/20 text-blue-300'
                          : isCleaning
                          ? 'bg-amber-500/20 text-amber-300'
                          : isReserved
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {table.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Dining Sessions & Service Tasks Split View */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Dining Sessions */}
          <div
            className={`p-6 rounded-xl border ${
              isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
            }`}
          >
            <h3 className="font-serif text-lg text-[#F6F1E8] mb-1">Active Dining Sessions</h3>
            <p className="text-xs text-[#A5A198] mb-4">Guests currently dining in the restaurant</p>

            {data.activeDiningSessions.length === 0 ? (
              <div className="py-8 text-center text-stone-500 font-mono text-xs">
                No active dining sessions at this time.
              </div>
            ) : (
              <div className="divide-y divide-[#2A2925] border border-[#2A2925] rounded-lg overflow-hidden">
                {data.activeDiningSessions.map((session) => {
                  const elapsedMin = Math.round(
                    (Date.now() - new Date(session.seatedAt).getTime()) / 60000
                  );
                  return (
                    <div key={session.id} className="p-3.5 bg-[#1C1B17]/40 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-[#F6F1E8]">
                          {session.guestName}{' '}
                          <span className="text-xs font-mono text-[#B99A63]">
                            ({session.guestCount} guests)
                          </span>
                        </div>
                        <div className="text-xs font-mono text-stone-400 mt-0.5">
                          Tables: {session.tableNumbers.join(', ')} • Waiter:{' '}
                          {session.assignedStaffNames?.join(', ') || 'Floor Team'}
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs text-stone-400">
                        <div className="text-emerald-400 font-medium">{elapsedMin}m elapsed</div>
                        <div className="text-stone-500">
                          Seated {new Date(session.seatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outstanding Service Requests & Cleaning Tasks */}
          <div
            className={`p-6 rounded-xl border ${
              isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif text-lg text-[#F6F1E8]">Service & Cleaning Tasks</h3>
              <span className="text-xs font-mono text-amber-400">
                {data.serviceRequests.length + data.cleaningTasks.length} Pending
              </span>
            </div>
            <p className="text-xs text-[#A5A198] mb-4">Service calls and table turnovers awaiting completion</p>

            {data.serviceRequests.length === 0 && data.cleaningTasks.length === 0 ? (
              <div className="py-8 text-center text-stone-500 font-mono text-xs">
                All table service and cleaning tasks are clear.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Cleaning Tasks */}
                {data.cleaningTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/15 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles size={16} className="text-amber-400" />
                      <div>
                        <div className="font-medium text-sm text-[#F6F1E8]">
                          Table {task.tableNumber} Turnover Cleaning
                        </div>
                        <div className="text-xs font-mono text-stone-400">
                          Priority: {task.priority} • Status: {task.status}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCleaningOverrideTask(task)}
                      className="px-2.5 py-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors"
                      title="Manager Override: Release table directly to Available"
                    >
                      Force Complete
                    </button>
                  </div>
                ))}

                {/* Service Requests */}
                {data.serviceRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg border border-[#2A2925] bg-[#1C1B17]/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <BellRing size={16} className="text-[#B99A63]" />
                      <div>
                        <div className="font-medium text-sm text-[#F6F1E8]">
                          Table {req.tableNumber} — {req.requestType}
                        </div>
                        <div className="text-xs font-mono text-stone-400">
                          Priority: {req.priority} • Assigned: {req.assignedStaffName || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Inspection Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#141412] border border-[#B99A63]/30 rounded-xl shadow-2xl p-6 text-[#F6F1E8]">
            <button
              onClick={() => setSelectedTable(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-[#F6F1E8]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between border-b border-[#2A2925] pb-4 mb-4">
              <div>
                <span className="text-xs font-mono text-[#B99A63] uppercase tracking-wider">
                  Table Inspection
                </span>
                <h2 className="text-xl font-serif text-[#F6F1E8]">Table {selectedTable.tableNumber}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase bg-[#1C1B17] text-[#B99A63]">
                {selectedTable.section}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono bg-[#1C1B17] p-3 rounded-lg mb-4">
              <div>
                <span className="text-stone-500">Capacity:</span> {selectedTable.capacity} Guests
              </div>
              <div>
                <span className="text-stone-500">Current Status:</span>{' '}
                <span className="text-emerald-400 font-semibold">{selectedTable.status}</span>
              </div>
              <div>
                <span className="text-stone-500">Assigned Waiter:</span>{' '}
                {selectedTable.assignedStaffName || 'Unassigned / Floor Pool'}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#2A2925]">
              <button
                onClick={() => setSelectedTable(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono text-[#A5A198] hover:text-[#F6F1E8] bg-[#1E1D1A] hover:bg-[#2A2925] border border-[#2A2925] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Cleaning Complete Modal */}
      {cleaningOverrideTask && (
        <OverrideConfirmModal
          isOpen={true}
          onClose={() => setCleaningOverrideTask(null)}
          title="Force Table Turnover Complete"
          actionName="TABLE CLEANING OVERRIDE"
          description="Force complete the turnover cleaning task for this table and immediately release it back to AVAILABLE status in the reservation allocation pool."
          recordSummary={`Table ${cleaningOverrideTask.tableNumber} Cleaning Task`}
          onConfirm={handleForceCleaningComplete}
        />
      )}
    </StaffLayout>
  );
}
