'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { IVIPBookingSafeJSON, VIPBookingStatus } from '../../../../types/vip';
import { apiClient } from '../../../../lib/api';
import {
  Sparkles,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  UserCheck,
  UserX,
  FileText,
  UtensilsCrossed,
  X,
} from 'lucide-react';

export default function ReceptionVipPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const locationId = selectedLocation || 'loc-colombo-main';

  const [bookings, setBookings] = useState<IVIPBookingSafeJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [todayDateStr, setTodayDateStr] = useState<string>('');

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDateFilter(today);
    setTodayDateStr(today);
  }, []);

  // Check-in in progress ID
  const [checkingInRef, setCheckingInRef] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiClient<any>(
        `/api/admin/vip/bookings?locationId=${encodeURIComponent(locationId)}`
      );
      setBookings(res?.data || []);
    } catch (err: any) {
      console.error('Failed to load VIP bookings:', err);
      setError(err?.message || 'Failed to load VIP arrivals from ledger.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchBookings(true);
    };

    socket.on('vip.bookingCreated', handleUpdate);
    socket.on('vip.bookingUpdated', handleUpdate);
    socket.on('vip.bookingCancelled', handleUpdate);

    return () => {
      socket.off('vip.bookingCreated', handleUpdate);
      socket.off('vip.bookingUpdated', handleUpdate);
      socket.off('vip.bookingCancelled', handleUpdate);
    };
  }, [socket, fetchBookings]);

  // VIP Check-in Action
  const handleCheckIn = async (booking: IVIPBookingSafeJSON) => {
    try {
      setCheckingInRef(booking.bookingReference);
      await apiClient<any>(
        `/api/admin/vip/bookings/${booking.bookingReference}/check-in`,
        { method: 'POST' }
      );
      showToast(`VIP Guest ${booking.guestName} (${booking.roomName || 'Private Salon'}) checked in successfully.`);
      fetchBookings(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to check in VIP guest.');
    } finally {
      setCheckingInRef(null);
    }
  };

  // Filtered List
  const filteredBookings = bookings.filter((b) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = b.guestName.toLowerCase().includes(q);
      const matchRef = b.bookingReference.toLowerCase().includes(q);
      const matchRoom = b.roomName?.toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchRoom) return false;
    }

    if (dateFilter) {
      const bDate = new Date(b.startAt).toISOString().slice(0, 10);
      if (bDate !== dateFilter) return false;
    }

    if (statusFilter !== 'ALL' && b.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Today Counts
  const todayBookings = todayDateStr
    ? bookings.filter(
        (b) => new Date(b.startAt).toISOString().slice(0, 10) === todayDateStr
      )
    : [];
  const todayConfirmed = todayBookings.filter((b) => b.status === VIPBookingStatus.CONFIRMED).length;
  const todayCheckedIn = todayBookings.filter((b) => b.status === VIPBookingStatus.CHECKED_IN).length;

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION]}>
      <div className="space-y-6">
        {/* Header */}
        <StaffPageHeader
          title="VIP Guest Arrivals"
          subtitle="Coordinate private salon receptions, verify exclusive reservations, and initiate bespoke guest check-in."
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchBookings(true)}
                disabled={refreshing || loading}
                className={`p-2.5 rounded-lg border transition-all ${
                  isDark
                    ? 'border-[#22211E] bg-[#141412] hover:bg-[#1E1E1C] text-stone-300'
                    : 'border-[#E5DFD3] bg-white hover:bg-stone-50 text-stone-700'
                }`}
                title="Refresh VIP arrivals"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          }
        />

        {/* Toast */}
        {toastMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Today's VIP Bookings
              </span>
              <Sparkles size={16} className="text-[#B99A63]" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-stone-100">{todayBookings.length}</p>
            <span className="text-[11px] text-stone-400">Total salon sessions scheduled</span>
          </div>

          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Awaiting Arrival
              </span>
              <Clock size={16} className="text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-amber-400">{todayConfirmed}</p>
            <span className="text-[11px] text-stone-400">Pending reception welcome</span>
          </div>

          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Checked In & Seated
              </span>
              <UserCheck size={16} className="text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-emerald-400">{todayCheckedIn}</p>
            <span className="text-[11px] text-stone-400">Currently dining in salons</span>
          </div>

          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                VIP Guests Expected
              </span>
              <Users size={16} className="text-[#B99A63]" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-stone-100">
              {todayBookings.reduce((sum, b) => sum + b.guestCount, 0)} Guests
            </p>
            <span className="text-[11px] text-stone-400">Total VIP party headcount</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all ${
            isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
          }`}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by VIP host name, reference, or room..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none ${
                isDark
                  ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                  : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
              }`}
            />
          </div>

          {/* Date & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-stone-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-xs outline-none border ${
                  isDark
                    ? 'bg-[#1C1B18] border-[#2B2A26] text-stone-200'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-xs outline-none cursor-pointer border ${
                isDark
                  ? 'bg-[#1C1B18] border-[#2B2A26] text-stone-200'
                  : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}
            >
              <option value="ALL">All Statuses</option>
              <option value={VIPBookingStatus.CONFIRMED}>Confirmed (Awaiting)</option>
              <option value={VIPBookingStatus.CHECKED_IN}>Checked In</option>
              <option value={VIPBookingStatus.COMPLETED}>Completed</option>
              <option value={VIPBookingStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        </div>

        {/* Arrivals Table */}
        <div
          className={`rounded-2xl border overflow-hidden transition-all ${
            isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
          }`}
        >
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-stone-400">
              <Loader2 size={32} className="animate-spin text-[#B99A63]" />
              <p className="text-xs uppercase tracking-wider">Loading VIP arrivals ledger...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-16 text-center text-stone-400 space-y-2">
              <Sparkles size={36} className="mx-auto text-stone-600" />
              <p className="text-sm font-serif">No VIP arrivals found for this date.</p>
              <button
                onClick={() => {
                  setDateFilter('');
                  setStatusFilter('ALL');
                  setSearch('');
                }}
                className="text-xs text-[#B99A63] hover:underline"
              >
                Show all dates
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[10.5px] uppercase tracking-wider font-semibold ${
                      isDark
                        ? 'border-[#22211E] text-stone-400 bg-[#171715]'
                        : 'border-[#E5DFD3] text-stone-500 bg-stone-50'
                    }`}
                  >
                    <th className="py-3.5 px-4">Booking Ref & Guest</th>
                    <th className="py-3.5 px-4">VIP Salon</th>
                    <th className="py-3.5 px-4">Scheduled Window</th>
                    <th className="py-3.5 px-4">Party Size</th>
                    <th className="py-3.5 px-4">Dining Package / Requests</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Reception Action</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y text-xs ${
                    isDark ? 'divide-[#22211E] text-stone-200' : 'divide-[#E5DFD3] text-stone-800'
                  }`}
                >
                  {filteredBookings.map((b) => {
                    const start = new Date(b.startAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const end = new Date(b.endAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={b.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#1A1A18]' : 'hover:bg-stone-50/80'
                        }`}
                      >
                        {/* Guest */}
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-mono text-[10px] text-[#B99A63] font-semibold">
                              {b.bookingReference}
                            </span>
                            <div className="font-serif font-medium text-stone-100 text-sm mt-0.5">
                              {b.guestName}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                              <span>{b.guestPhone}</span>
                            </div>
                          </div>
                        </td>

                        {/* Room */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium text-stone-100">
                            <Sparkles size={14} className="text-[#B99A63]" />
                            <span>{b.roomName || 'Private Suite'}</span>
                          </div>
                        </td>

                        {/* Window */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-stone-300">
                            <Clock size={13} className="text-[#B99A63]" />
                            <span>{start} – {end}</span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {new Date(b.startAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* Party Size */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                            <Users size={13} className="text-[#B99A63]" />
                            <span>{b.guestCount} Guests</span>
                          </div>
                        </td>

                        {/* Package / Notes */}
                        <td className="py-4 px-4 max-w-xs">
                          {b.packageName && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 block w-fit mb-1">
                              {b.packageName}
                            </span>
                          )}
                          {b.specialRequests ? (
                            <p className="text-[11px] text-stone-400 truncate">
                              {b.specialRequests}
                            </p>
                          ) : (
                            <span className="text-[11px] text-stone-500">No special requests</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {b.status === VIPBookingStatus.CONFIRMED && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Awaiting Arrival
                            </span>
                          )}
                          {b.status === VIPBookingStatus.CHECKED_IN && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 size={11} />
                              Checked In
                            </span>
                          )}
                          {b.status === VIPBookingStatus.COMPLETED && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-stone-700/50 text-stone-400">
                              Completed
                            </span>
                          )}
                          {b.status === VIPBookingStatus.CANCELLED && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              Cancelled
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          {b.status === VIPBookingStatus.CONFIRMED ? (
                            <button
                              onClick={() => handleCheckIn(b)}
                              disabled={checkingInRef === b.bookingReference}
                              className="px-3 py-1.5 rounded-lg bg-[#B99A63] hover:bg-[#A88952] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 ml-auto shadow-sm"
                            >
                              {checkingInRef === b.bookingReference ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <UserCheck size={12} />
                              )}
                              <span>Check In Host</span>
                            </button>
                          ) : (
                            <span className="text-stone-500 text-xs">Arrived</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
