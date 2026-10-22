'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Users,
  Armchair,
  Clock,
  X,
  Sparkles,
} from 'lucide-react';

interface ReservationRecord {
  id: string;
  reservationReference: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  reservationDate: string;
  startAt: string;
  endAt: string;
  status: string;
  tableNumbers: string[];
  seatingPreference: string;
  specialRequests?: string;
  occasion?: string;
  source: string;
  createdAt: string;
}

export default function ManagerReservationsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [todayStr, setTodayStr] = useState('');
  const [tomorrowStr, setTomorrowStr] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRes, setSelectedRes] = useState<ReservationRecord | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  useEffect(() => {
    const t = new Date();
    const today = t.toISOString().split('T')[0];
    const tm = new Date(t.getTime() + 86400000);
    const tomorrow = tm.toISOString().split('T')[0];
    setTodayStr(today);
    setTomorrowStr(tomorrow);
    setDateFilter(today);
  }, []);

  const fetchReservations = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const queryParams = new URLSearchParams({
          locationId,
          page: page.toString(),
          limit: '15',
          ...(dateFilter ? { date: dateFilter } : {}),
          ...(search ? { search } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        });

        const res = await apiClient<{
          success: boolean;
          data: { reservations: ReservationRecord[]; total: number; page: number; limit: number };
        }>(`/manager/reservations?${queryParams.toString()}`);

        if (res.success && res.data) {
          setReservations(res.data.reservations);
          setTotal(res.data.total);
        }
      } catch (err: any) {
        console.error('Failed to load reservations:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId, page, dateFilter, search, statusFilter]
  );

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchReservations();
    socket.on('reservation:created', handleUpdate);
    socket.on('reservation:status_changed', handleUpdate);
    socket.on('guest:checked_in', handleUpdate);
    socket.on('guest:seated', handleUpdate);
    return () => {
      socket.off('reservation:created', handleUpdate);
      socket.off('reservation:status_changed', handleUpdate);
      socket.off('guest:checked_in', handleUpdate);
      socket.off('guest:seated', handleUpdate);
    };
  }, [socket, fetchReservations]);

  const setDateShortcut = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDateFilter(d.toISOString().split('T')[0]);
    setPage(1);
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Reservation Monitoring"
        description="Monitor daily seatings, guest party arrivals, and dining room reservation manifests."
        onRefresh={() => fetchReservations(true)}
        refreshing={refreshing}
      />

      {/* Date & Search Filter Bar */}
      <div
        className={`p-4 rounded-xl border mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Shortcuts */}
          <div className="flex items-center gap-1 bg-[#1C1B17] p-1 rounded-lg border border-[#2A2925] text-xs font-mono">
            <button
              onClick={() => setDateShortcut(0)}
              className={`px-3 py-1 rounded transition-colors ${
                todayStr && dateFilter === todayStr
                  ? 'bg-[#B99A63] text-black font-semibold'
                  : 'text-stone-400 hover:text-[#F6F1E8]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateShortcut(1)}
              className={`px-3 py-1 rounded transition-colors ${
                tomorrowStr && dateFilter === tomorrowStr
                  ? 'bg-[#B99A63] text-black font-semibold'
                  : 'text-stone-400 hover:text-[#F6F1E8]'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2 bg-[#1C1B17] border border-[#2A2925] px-3 py-1.5 rounded-lg text-xs font-mono">
            <Calendar size={14} className="text-[#B99A63]" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-[#F6F1E8] focus:outline-none"
            />
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference, guest..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none font-sans"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-mono bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="SEATED">Seated</option>
            <option value="COMPLETED">Completed</option>
            <option value="NO_SHOW">No Show</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="text-xs font-mono text-[#A5A198] shrink-0">
          Total: {total} reservations
        </div>
      </div>

      {/* Reservations Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        {loading ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading reservations...
          </div>
        ) : reservations.length === 0 ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            No reservations found for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#2A2925] bg-[#1C1B17]/40 text-xs font-mono text-[#A5A198] uppercase">
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Party</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Preference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2925]">
                {reservations.map((res) => (
                  <tr
                    key={res.id}
                    className="hover:bg-[#1C1B17]/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedRes(res)}
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-[#F6F1E8]">
                      #{res.reservationReference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#F6F1E8]">{res.guestName}</div>
                      <div className="text-xs text-stone-500 font-mono">{res.guestPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-xs font-mono text-[#F6F1E8]">
                        <Users size={12} className="text-[#B99A63]" />
                        <span>{res.guestCount} guests</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-stone-400">
                      <div>
                        {new Date(res.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#B99A63]">
                      {res.tableNumbers && res.tableNumbers.length > 0
                        ? `Table ${res.tableNumbers.join(', ')}`
                        : 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-400">
                      {res.seatingPreference || 'Standard'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-mono uppercase font-semibold ${
                          res.status === 'SEATED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : res.status === 'CHECKED_IN'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                            : res.status === 'CONFIRMED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            : res.status === 'NO_SHOW'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : res.status === 'COMPLETED'
                            ? 'bg-stone-500/20 text-stone-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedRes(res)}
                        className="p-1.5 rounded hover:bg-[#2A2925] text-stone-400 hover:text-[#F6F1E8] transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="p-4 border-t border-[#2A2925] flex items-center justify-between text-xs font-mono text-stone-400">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border border-[#2A2925] hover:bg-[#1C1B17] disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {Math.ceil(total / 15)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 15)}
              className="px-3 py-1.5 rounded border border-[#2A2925] hover:bg-[#1C1B17] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Reservation Detail Modal */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#141412] border border-[#B99A63]/30 rounded-xl shadow-2xl p-6 text-[#F6F1E8]">
            <button
              onClick={() => setSelectedRes(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-[#F6F1E8]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between border-b border-[#2A2925] pb-4 mb-4">
              <div>
                <span className="text-xs font-mono text-[#B99A63] uppercase tracking-wider">
                  Reservation Manifest
                </span>
                <h2 className="text-xl font-serif text-[#F6F1E8]">#{selectedRes.reservationReference}</h2>
              </div>
              <span
                className={`px-3 py-1 rounded text-xs font-mono uppercase font-semibold ${
                  selectedRes.status === 'SEATED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : selectedRes.status === 'CONFIRMED'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {selectedRes.status}
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono bg-[#1C1B17] p-3 rounded-lg mb-4">
              <div>
                <span className="text-stone-500">Guest:</span>{' '}
                <span className="text-sm font-sans font-medium text-[#F6F1E8]">{selectedRes.guestName}</span>
              </div>
              <div>
                <span className="text-stone-500">Contact:</span> {selectedRes.guestPhone} • {selectedRes.guestEmail}
              </div>
              <div>
                <span className="text-stone-500">Party Size:</span> {selectedRes.guestCount} Guests
              </div>
              <div>
                <span className="text-stone-500">Time:</span>{' '}
                {new Date(selectedRes.startAt).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
              <div>
                <span className="text-stone-500">Allocated Table:</span>{' '}
                <span className="text-[#B99A63] font-semibold">
                  {selectedRes.tableNumbers && selectedRes.tableNumbers.length > 0
                    ? `Table ${selectedRes.tableNumbers.join(', ')}`
                    : 'Unallocated'}
                </span>
              </div>
              <div>
                <span className="text-stone-500">Seating Preference:</span> {selectedRes.seatingPreference}
              </div>
              {selectedRes.occasion && (
                <div>
                  <span className="text-stone-500">Special Occasion:</span> {selectedRes.occasion}
                </div>
              )}
            </div>

            {selectedRes.specialRequests && (
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs mb-4">
                <strong>Guest Special Requests:</strong> {selectedRes.specialRequests}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#2A2925]">
              <button
                onClick={() => setSelectedRes(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono text-[#A5A198] hover:text-[#F6F1E8] bg-[#1E1D1A] hover:bg-[#2A2925] border border-[#2A2925] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
