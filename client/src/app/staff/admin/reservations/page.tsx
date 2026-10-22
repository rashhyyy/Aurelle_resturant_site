'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  MoreVertical,
  Users,
  MapPin,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffStatusBadge } from '../../../../components/staff/StaffStatusBadge';
import {
  ClientReservation,
  ReservationStatus,
  ReservationSummaryMetrics,
} from '../../../../types/reservation';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';

const LOCATIONS = [
  { id: 'all', name: 'All Locations' },
  { id: 'loc-colombo-main', name: 'Aurelle Colombo' },
  { id: 'loc-kandy-vip', name: 'Aurelle Kandy' },
];

export default function AdminReservationsPage() {
  const { staff, loading: authLoading } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [reservations, setReservations] = useState<ClientReservation[]>([]);
  const [summary, setSummary] = useState<ReservationSummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortFilter, setSortFilter] = useState<'startAt' | 'createdAt'>('startAt');

  // Action state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Confirm / Reject / Cancel Dialog States
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [dialogReason, setDialogReason] = useState('');

  const fetchReservationsAndSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (locationFilter !== 'all') params.append('locationId', locationFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (sortFilter) params.append('sortBy', sortFilter);

      const summaryParams = locationFilter !== 'all' ? `?locationId=${locationFilter}` : '';

      const [resListRes, summaryRes] = await Promise.all([
        apiClient<{
          success: boolean;
          data: { reservations: ClientReservation[]; total: number };
        }>(`/admin/reservations?${params.toString()}`),
        apiClient<{ success: boolean; data: ReservationSummaryMetrics }>(
          `/admin/reservations/summary${summaryParams}`
        ),
      ]);

      if (resListRes?.success && Array.isArray(resListRes.data?.reservations)) {
        setReservations(resListRes.data.reservations);
      } else {
        setError('Failed to load reservations.');
      }

      if (summaryRes?.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Network error retrieving reservation records.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, locationFilter, dateFilter, sortFilter]);

  useEffect(() => {
    fetchReservationsAndSummary();
  }, [fetchReservationsAndSummary]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleEvent = () => {
      fetchReservationsAndSummary();
    };

    socket.on('reservations.created', handleEvent);
    socket.on('reservations.updated', handleEvent);
    socket.on('reservations.cancelled', handleEvent);
    socket.on('reservations.confirmed', handleEvent);

    return () => {
      socket.off('reservations.created', handleEvent);
      socket.off('reservations.updated', handleEvent);
      socket.off('reservations.cancelled', handleEvent);
      socket.off('reservations.confirmed', handleEvent);
    };
  }, [socket, fetchReservationsAndSummary]);

  // Action handlers
  const handleConfirm = async (resId: string) => {
    try {
      setActionLoadingId(resId);
      setActionMessage(null);

      const res = await apiClient<{ success: boolean; message: string }>(
        `/admin/reservations/${resId}/confirm`,
        { method: 'POST' }
      );

      if (res?.success) {
        setActionMessage(res.message || 'Reservation confirmed successfully.');
        setConfirmingId(null);
        fetchReservationsAndSummary();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to confirm reservation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (resId: string) => {
    try {
      setActionLoadingId(resId);
      setActionMessage(null);

      const res = await apiClient<{ success: boolean; message: string }>(
        `/admin/reservations/${resId}/reject`,
        {
          method: 'POST',
          data: { reason: dialogReason || 'Declined by administration' },
        }
      );

      if (res?.success) {
        setActionMessage(res.message || 'Reservation request declined.');
        setRejectingId(null);
        setDialogReason('');
        fetchReservationsAndSummary();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject reservation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (resId: string) => {
    try {
      setActionLoadingId(resId);
      setActionMessage(null);

      const res = await apiClient<{ success: boolean; message: string }>(
        `/admin/reservations/${resId}/cancel`,
        {
          method: 'POST',
          data: { reason: dialogReason || 'Cancelled by staff' },
        }
      );

      if (res?.success) {
        setActionMessage(res.message || 'Reservation cancelled.');
        setCancellingId(null);
        setDialogReason('');
        fetchReservationsAndSummary();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-[#B99A63]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#B99A63] font-semibold block">
          AURELLE / OPERATIONS
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div>
            <h1
              className={`text-3xl sm:text-4xl font-serif font-normal tracking-tight ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              Reservation Management
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Manage guest bookings, availability, and upcoming dining experiences.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchReservationsAndSummary()}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#2C2C28] hover:bg-stone-800 text-stone-300'
                : 'border-stone-300 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          className={`border rounded-2xl p-5 shadow-sm ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-stone-400 block">
            TODAY&apos;S RESERVATIONS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl sm:text-3xl font-serif font-semibold ${
                isDark ? 'text-[#F6F1E8]' : 'text-stone-900'
              }`}
            >
              {summary ? summary.todayTotal : '—'}
            </span>
            <Calendar className="w-5 h-5 text-[#B99A63]" />
          </div>
          <span className="text-[11px] font-mono text-[#B99A63] mt-1 block">
            Confirmed guest manifest today
          </span>
        </div>

        <div
          className={`border rounded-2xl p-5 shadow-sm ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-stone-400 block">
            UPCOMING RESERVATIONS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl sm:text-3xl font-serif font-semibold text-amber-500`}
            >
              {summary ? summary.upcomingTotal : '—'}
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Future scheduled bookings
          </span>
        </div>

        <div
          className={`border rounded-2xl p-5 shadow-sm ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-stone-400 block">
            PENDING REQUESTS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl sm:text-3xl font-serif font-semibold text-blue-400`}
            >
              {summary ? summary.pendingTotal : '—'}
            </span>
            <AlertCircle className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Awaiting manager confirmation
          </span>
        </div>

        <div
          className={`border rounded-2xl p-5 shadow-sm ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-stone-400 block">
            CANCELLED RESERVATIONS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl sm:text-3xl font-serif font-semibold text-stone-400`}
            >
              {summary ? summary.cancelledTotal : '—'}
            </span>
            <XCircle className="w-5 h-5 text-stone-400" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Capacity released
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`border rounded-2xl p-4 shadow-sm space-y-4 ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, guest name, phone, table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border transition-colors ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-white focus:border-[#B99A63]'
                  : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-[#B99A63]'
              }`}
            />
          </div>

          {/* Location */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition-colors ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-white focus:border-[#B99A63]'
                  : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-[#B99A63]'
              }`}
            >
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition-colors ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-white focus:border-[#B99A63]'
                  : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-[#B99A63]'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="SEATED">Seated</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition-colors ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-white focus:border-[#B99A63] [color-scheme:dark]'
                  : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-[#B99A63]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Reservation Directory Table */}
      <div
        className={`border rounded-2xl overflow-hidden shadow-sm ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead
              className={`border-b text-[10px] uppercase font-mono tracking-wider ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-stone-400'
                  : 'bg-stone-50 border-stone-200 text-stone-500'
              }`}
            >
              <tr>
                <th className="px-5 py-3.5 font-medium">Reference</th>
                <th className="px-5 py-3.5 font-medium">Guest Manifest</th>
                <th className="px-5 py-3.5 font-medium">Venue</th>
                <th className="px-5 py-3.5 font-medium">Date & Time</th>
                <th className="px-5 py-3.5 font-medium">Guests</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Assigned Table</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#B99A63] mb-2" />
                    <span>Loading reservation records...</span>
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No reservations matching current filters.
                  </td>
                </tr>
              ) : (
                reservations.map((res) => {
                  const isPending = res.status === ReservationStatus.PENDING;
                  const isConfirmed = res.status === ReservationStatus.CONFIRMED;

                  return (
                    <tr
                      key={res.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-stone-800/40' : 'hover:bg-stone-50'
                      }`}
                    >
                      <td className="px-5 py-4 font-mono font-medium text-[#B99A63]">
                        <Link
                          href={`/staff/admin/reservations/${res.id}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>{res.reservationReference}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{res.guestName}</div>
                        <div className="text-[11px] text-stone-400">
                          {res.guestPhone} · {res.guestEmail}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-300">
                        {res.locationName}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-white">{res.reservationDate}</div>
                        <div className="text-[11px] text-stone-400">{res.reservationTime}</div>
                      </td>
                      <td className="px-5 py-4 text-stone-300">
                        <span className="font-semibold">{res.guestCount}</span> Guests
                      </td>
                      <td className="px-5 py-4">
                        <StaffStatusBadge status={res.status} />
                      </td>
                      <td className="px-5 py-4 font-mono text-[#B99A63]">
                        {res.tableNumbers.length > 0
                          ? res.tableNumbers.join(', ')
                          : 'Unassigned'}
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoadingId === res.id}
                              onClick={() => handleConfirm(res.id)}
                              className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded text-[11px] text-emerald-200 transition-colors inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirm</span>
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === res.id}
                              onClick={() => {
                                setRejectingId(res.id);
                                setDialogReason('');
                              }}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-[11px] text-stone-300 transition-colors inline-flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {isConfirmed && (
                          <button
                            type="button"
                            disabled={actionLoadingId === res.id}
                            onClick={() => {
                              setCancellingId(res.id);
                              setDialogReason('');
                            }}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-red-950/60 border border-stone-600 hover:border-red-800/80 rounded text-[11px] text-stone-300 hover:text-red-300 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <Link
                          href={`/staff/admin/reservations/${res.id}`}
                          className={`p-1.5 rounded-lg border inline-flex items-center justify-center transition-colors ${
                            isDark
                              ? 'border-[#2C2C28] hover:bg-stone-800 text-stone-400 hover:text-white'
                              : 'border-stone-200 hover:bg-stone-100 text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <Eye size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Dialog Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`w-full max-w-md border rounded-2xl p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-stone-300'
            }`}
          >
            <h3 className="text-base font-serif font-semibold text-white">
              Reject Reservation Request
            </h3>
            <p className="text-xs text-stone-400">
              Provide a reason for declining this reservation. This will update the status to
              REJECTED and release table capacity.
            </p>
            <input
              type="text"
              placeholder="Reason for declining..."
              value={dialogReason}
              onChange={(e) => setDialogReason(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-white'
                  : 'bg-stone-50 border-stone-200 text-stone-900'
              }`}
            />
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 text-xs font-mono uppercase text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingId)}
                className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-xl text-xs font-mono uppercase text-white"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`w-full max-w-md border rounded-2xl p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-stone-300'
            }`}
          >
            <h3 className="text-base font-serif font-semibold text-white">
              Cancel Reservation
            </h3>
            <p className="text-xs text-stone-400">
              Are you sure you want to cancel this booking? Table capacity will be immediately
              returned to inventory.
            </p>
            <input
              type="text"
              placeholder="Cancellation reason..."
              value={dialogReason}
              onChange={(e) => setDialogReason(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-white'
                  : 'bg-stone-50 border-stone-200 text-stone-900'
              }`}
            />
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setCancellingId(null)}
                className="px-4 py-2 text-xs font-mono uppercase text-stone-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleCancel(cancellingId)}
                className="px-4 py-2 bg-stone-700 hover:bg-red-800 rounded-xl text-xs font-mono uppercase text-white transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
