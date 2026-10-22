'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import { ReceptionReservationItem, TableAvailabilityItem } from '../../../../types/reception';
import {
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw,
  Armchair,
  UserCheck,
  UserX,
  Edit,
  ExternalLink,
  X,
  Phone,
  Mail,
  FileText,
  UtensilsCrossed,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function ReceptionReservationsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const locationId = selectedLocation || 'loc-colombo-main';

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [reservations, setReservations] = useState<ReceptionReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Table inventory for table assignment modal
  const [availableTables, setAvailableTables] = useState<TableAvailabilityItem[]>([]);

  // Action Modals State
  const [activeDossier, setActiveDossier] = useState<{
    reservation: ReceptionReservationItem;
    tableDetails: any[];
    linkedOrders: any[];
  } | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  const [assigningRes, setAssigningRes] = useState<ReceptionReservationItem | null>(null);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const [noShowRes, setNoShowRes] = useState<ReceptionReservationItem | null>(null);
  const [noShowNote, setNoShowNote] = useState('');
  const [noShowForce, setNoShowForce] = useState(false);
  const [noShowLoading, setNoShowLoading] = useState(false);
  const [noShowError, setNoShowError] = useState<string | null>(null);

  const [modifyingRes, setModifyingRes] = useState<ReceptionReservationItem | null>(null);
  const [modTime, setModTime] = useState('');
  const [modGuests, setModGuests] = useState(2);
  const [modRequests, setModRequests] = useState('');
  const [modLoading, setModLoading] = useState(false);
  const [modError, setModError] = useState<string | null>(null);

  // Initialize date filter in useEffect (avoids prerender dynamic evaluation warning)
  useEffect(() => {
    const today = new Date();
    setDateFilter(today.toISOString().split('T')[0]);
  }, []);

  const fetchReservations = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError(null);

        const params = new URLSearchParams({
          locationId,
          page: page.toString(),
          limit: '20',
        });

        if (dateFilter) params.append('date', dateFilter);
        if (statusFilter !== 'ALL') params.append('status', statusFilter);
        if (search.trim()) params.append('search', search.trim());

        const res = await apiClient<{
          success: boolean;
          data: {
            reservations: ReceptionReservationItem[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        }>(`/reception/reservations?${params.toString()}`);

        if (res?.success) {
          setReservations(res.data.reservations || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || 0);
        }
      } catch (err: any) {
        console.error('Fetch reservations error:', err);
        setError(err.message || 'Failed to load reservations.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [locationId, page, dateFilter, statusFilter, search]
  );

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Load available tables
  const loadAvailableTables = async () => {
    try {
      const res = await apiClient<{ success: boolean; data: TableAvailabilityItem[] }>(
        `/reception/tables/availability?locationId=${locationId}`
      );
      if (res?.success) {
        setAvailableTables(res.data);
      }
    } catch {}
  };

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchReservations(true);

    socket.on('reception.guestCheckedIn', handleUpdate);
    socket.on('reception.tableAssigned', handleUpdate);
    socket.on('reception.guestSeated', handleUpdate);
    socket.on('reception.walkInCreated', handleUpdate);
    socket.on('reception.noShowRecorded', handleUpdate);
    socket.on('reception.reservationModified', handleUpdate);
    socket.on('reservations.created', handleUpdate);

    return () => {
      socket.off('reception.guestCheckedIn', handleUpdate);
      socket.off('reception.tableAssigned', handleUpdate);
      socket.off('reception.guestSeated', handleUpdate);
      socket.off('reception.walkInCreated', handleUpdate);
      socket.off('reception.noShowRecorded', handleUpdate);
      socket.off('reception.reservationModified', handleUpdate);
      socket.off('reservations.created', handleUpdate);
    };
  }, [socket, fetchReservations]);

  // Action: Check In
  const handleCheckIn = async (resId: string) => {
    try {
      await apiClient(`/reception/reservations/${resId}/check-in`, { method: 'POST' });
      fetchReservations(true);
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  // Action: Seat Guest
  const handleSeat = async (resId: string) => {
    try {
      await apiClient(`/reception/reservations/${resId}/seat`, { method: 'POST' });
      fetchReservations(true);
    } catch (err: any) {
      alert(err.message || 'Seating failed');
    }
  };

  // Open Assign Table Modal
  const openAssignTableModal = (res: ReceptionReservationItem) => {
    setAssigningRes(res);
    setSelectedTableId(res.tableIds?.[0] || '');
    loadAvailableTables();
  };

  // Submit Table Assignment
  const handleAssignTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningRes || !selectedTableId) return;

    try {
      setAssignLoading(true);
      await apiClient(`/reception/reservations/${assigningRes.id}/assign-table`, {
        method: 'POST',
        body: JSON.stringify({ tableId: selectedTableId }),
      });
      setAssigningRes(null);
      fetchReservations(true);
    } catch (err: any) {
      alert(err.message || 'Failed to assign table.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Open No-Show Dialog
  const openNoShowModal = (res: ReceptionReservationItem) => {
    setNoShowRes(res);
    setNoShowNote('');
    setNoShowForce(false);
    setNoShowError(null);
  };

  // Confirm No-Show
  const handleConfirmNoShow = async () => {
    if (!noShowRes) return;
    try {
      setNoShowLoading(true);
      setNoShowError(null);
      await apiClient(`/reception/reservations/${noShowRes.id}/no-show`, {
        method: 'POST',
        body: JSON.stringify({
          note: noShowNote || undefined,
          force: noShowForce || undefined,
        }),
      });
      setNoShowRes(null);
      fetchReservations(true);
    } catch (err: any) {
      setNoShowError(err.message || 'Failed to mark no-show.');
    } finally {
      setNoShowLoading(false);
    }
  };

  // Open Modify Modal
  const openModifyModal = (res: ReceptionReservationItem) => {
    setModifyingRes(res);
    setModTime(res.reservationTime);
    setModGuests(res.guestCount);
    setModRequests(res.specialRequests || '');
    setModError(null);
  };

  // Submit Modification
  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyingRes) return;
    try {
      setModLoading(true);
      setModError(null);
      await apiClient(`/reception/reservations/${modifyingRes.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          time: modTime,
          guestCount: modGuests,
          specialRequests: modRequests,
        }),
      });
      setModifyingRes(null);
      fetchReservations(true);
    } catch (err: any) {
      setModError(err.message || 'Failed to modify reservation.');
    } finally {
      setModLoading(false);
    }
  };

  // View Dossier
  const openDossier = async (resId: string) => {
    try {
      setDossierLoading(true);
      const res = await apiClient<{
        success: boolean;
        data: {
          reservation: ReceptionReservationItem;
          tableDetails: any[];
          linkedOrders: any[];
        };
      }>(`/reception/reservations/${resId}`);

      if (res?.success) {
        setActiveDossier(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to fetch dossier');
    } finally {
      setDossierLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">CHECKED IN</span>;
      case 'SEATED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">SEATED</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#B99A63]/15 text-[#C1A87D] border border-[#B99A63]/30">CONFIRMED</span>;
      case 'NO_SHOW':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">NO SHOW</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-stone-500/15 text-stone-400 border border-stone-500/30">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-stone-500/15 text-stone-400 border border-stone-500/30">{status}</span>;
    }
  };

  const getArrivalBadge = (arrivalStatus: string) => {
    switch (arrivalStatus) {
      case 'DUE_NOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 animate-pulse">DUE NOW</span>;
      case 'LATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">OVERDUE</span>;
      case 'UPCOMING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-500/20 text-stone-400">UPCOMING</span>;
      default:
        return null;
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION]}>
      <StaffPageHeader
        title="Today's Reservations Manifest"
        subtitle="Operational arrival directory, guest check-in desk, table allocation, and dining status control."
        badge="RECEPTION DESK"
      />

      {/* Filter and Search Bar */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 mb-6 transition-colors ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search reference, guest, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-200 outline-none focus:border-[#C1A87D] transition"
            />
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-2.5 text-xs text-stone-200 outline-none focus:border-[#C1A87D] [color-scheme:dark] transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-2.5 text-xs text-stone-200 outline-none focus:border-[#C1A87D] transition"
            >
              <option value="ALL">All Reservation Statuses</option>
              <option value="CONFIRMED">Confirmed (Expected)</option>
              <option value="CHECKED_IN">Checked In (Foyer)</option>
              <option value="SEATED">Seated (Dining)</option>
              <option value="NO_SHOW">No Show</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Sync & Stats */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs font-mono text-stone-400">
              {totalCount} bookings found
            </span>
            <button
              onClick={() => fetchReservations(true)}
              disabled={refreshing}
              className={`p-2.5 rounded-xl border transition ${
                isDark
                  ? 'bg-[#12141A] border-[#2D3340] text-stone-400 hover:text-white'
                  : 'bg-[#F6F1E8] border-[#E5DFD3] text-stone-600 hover:text-black'
              }`}
              title="Refresh Manifest"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#B99A63]' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div
        className={`border rounded-2xl overflow-hidden transition-colors ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr
                className={`border-b text-[10.5px] uppercase tracking-wider ${
                  isDark
                    ? 'border-[#2C2C28] bg-[#171715] text-stone-400'
                    : 'border-[#E5DFD3] bg-[#F6F1E8] text-stone-600'
                }`}
              >
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Guest & Party</th>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Table</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Arrival Alert</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-400">
                    <Loader2 size={24} className="animate-spin text-[#B99A63] mx-auto mb-2" />
                    Loading daily manifest...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-500">
                    No reservations match the selected search or filter parameters.
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr
                    key={res.id}
                    className={`transition hover:bg-white/[0.02] ${
                      res.arrivalStatus === 'LATE' ? 'bg-rose-500/[0.03]' : ''
                    }`}
                  >
                    {/* Reference */}
                    <td className="px-5 py-4 font-bold text-[#C1A87D]">
                      <button
                        onClick={() => openDossier(res.id)}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        {res.reservationReference}
                      </button>
                    </td>

                    {/* Guest */}
                    <td className="px-5 py-4">
                      <div className="font-sans font-medium text-stone-200 text-sm">
                        {res.guestName}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                        <span>{res.guestCount} guests</span>
                        <span>•</span>
                        <span>{res.guestPhone}</span>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-5 py-4 font-semibold text-stone-300">
                      {res.reservationTime}
                    </td>

                    {/* Table */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold ${
                            res.assignedTableName !== 'Unassigned'
                              ? 'text-emerald-400'
                              : 'text-stone-500'
                          }`}
                        >
                          {res.assignedTableName || 'Unassigned'}
                        </span>
                        {(res.status === 'CONFIRMED' || res.status === 'CHECKED_IN') && (
                          <button
                            onClick={() => openAssignTableModal(res)}
                            className="p-1 text-stone-400 hover:text-[#C1A87D] transition"
                            title="Assign or change table"
                          >
                            <Edit size={12} />
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500">{res.seatingPreference}</div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">{getStatusBadge(res.status)}</td>

                    {/* Arrival Alert */}
                    <td className="px-5 py-4">{getArrivalBadge(res.arrivalStatus)}</td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Check In Action */}
                        {res.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCheckIn(res.id)}
                            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs transition"
                          >
                            Check In
                          </button>
                        )}

                        {/* Seat Action */}
                        {res.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => handleSeat(res.id)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs transition"
                          >
                            Seat
                          </button>
                        )}

                        {/* No Show Action (if confirmed & eligible) */}
                        {res.status === 'CONFIRMED' && (
                          <button
                            onClick={() => openNoShowModal(res)}
                            className="p-1.5 text-stone-500 hover:text-rose-400 transition"
                            title="Record No-Show"
                          >
                            <UserX size={15} />
                          </button>
                        )}

                        {/* Modify Action */}
                        {(res.status === 'CONFIRMED' || res.status === 'CHECKED_IN') && (
                          <button
                            onClick={() => openModifyModal(res)}
                            className="p-1.5 text-stone-500 hover:text-stone-300 transition"
                            title="Modify details"
                          >
                            <Edit size={15} />
                          </button>
                        )}

                        {/* Details Button */}
                        <button
                          onClick={() => openDossier(res.id)}
                          className="p-1.5 text-stone-500 hover:text-[#C1A87D] transition"
                          title="View Manifest Dossier"
                        >
                          <ExternalLink size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            className={`px-5 py-3.5 border-t flex items-center justify-between text-xs font-mono ${
              isDark ? 'border-[#2C2C28] bg-[#171715]' : 'border-[#E5DFD3] bg-[#F6F1E8]'
            }`}
          >
            <span className="text-stone-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Table Assignment Modal */}
      {assigningRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="font-serif font-bold text-lg text-stone-200">
                Assign Dining Table
              </h3>
              <button
                onClick={() => setAssigningRes(null)}
                className="text-stone-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs font-mono mb-4 text-stone-400">
              Assigning table for <span className="text-stone-200 font-bold">{assigningRes.guestName}</span> ({assigningRes.guestCount} guests, {assigningRes.reservationTime}).
            </div>

            <form onSubmit={handleAssignTableSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-stone-400 block mb-1.5 uppercase tracking-wider text-[10px]">
                  Select Available Table
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3.5 py-2.5 text-stone-200 outline-none focus:border-[#C1A87D]"
                  required
                >
                  <option value="">-- Choose Dining Table --</option>
                  {availableTables.map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                      disabled={t.capacity < assigningRes.guestCount}
                    >
                      Table {t.tableNumber} ({t.name}) — Cap: {t.capacity} [
                      {t.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAssigningRes(null)}
                  className="px-4 py-2 border border-stone-600 rounded-xl text-stone-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedTableId}
                  className="px-5 py-2 bg-[#B99A63] hover:bg-[#A88B54] text-[#12141A] font-bold rounded-xl disabled:opacity-50 transition"
                >
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: No-Show Confirmation Dialog */}
      {noShowRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="font-serif font-bold text-lg text-rose-400 flex items-center gap-2">
                <UserX size={20} />
                Record No-Show
              </h3>
              <button onClick={() => setNoShowRes(null)} className="text-stone-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-300 mb-4 leading-relaxed font-mono">
              Are you sure you want to mark <span className="text-white font-bold">{noShowRes.guestName}</span> ({noShowRes.reservationReference}) as NO_SHOW? This will immediately release all allocated tables.
            </p>

            {noShowError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {noShowError}
              </div>
            )}

            <div className="space-y-3 font-mono text-xs mb-4">
              <div>
                <label className="text-stone-400 block mb-1 text-[10px] uppercase">
                  Staff Observation Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Phone unreachable after 20 minutes"
                  value={noShowNote}
                  onChange={(e) => setNoShowNote(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                />
              </div>

              {(staff?.role === StaffRole.ADMIN || staff?.role === StaffRole.MANAGER) && (
                <label className="flex items-center gap-2 cursor-pointer text-stone-400 pt-1">
                  <input
                    type="checkbox"
                    checked={noShowForce}
                    onChange={(e) => setNoShowForce(e.target.checked)}
                    className="rounded border-[#2D3340]"
                  />
                  <span>Manager Override Grace Period</span>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setNoShowRes(null)}
                className="px-4 py-2 border border-stone-600 rounded-xl text-stone-300 hover:bg-white/5 transition text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNoShow}
                disabled={noShowLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl disabled:opacity-50 transition text-xs font-mono"
              >
                {noShowLoading ? 'Recording...' : 'Mark No-Show'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Modify Reservation Dialog */}
      {modifyingRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="font-serif font-bold text-lg text-stone-200">
                Modify Booking Details
              </h3>
              <button onClick={() => setModifyingRes(null)} className="text-stone-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {modError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {modError}
              </div>
            )}

            <form onSubmit={handleModifySubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-stone-400 block mb-1 text-[10px] uppercase">Time</label>
                  <input
                    type="text"
                    value={modTime}
                    onChange={(e) => setModTime(e.target.value)}
                    placeholder="7:30 PM"
                    className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                    required
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1 text-[10px] uppercase">Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={modGuests}
                    onChange={(e) => setModGuests(parseInt(e.target.value, 10))}
                    className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-400 block mb-1 text-[10px] uppercase">
                  Special Notes
                </label>
                <textarea
                  rows={2}
                  value={modRequests}
                  onChange={(e) => setModRequests(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModifyingRes(null)}
                  className="px-4 py-2 border border-stone-600 rounded-xl text-stone-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modLoading}
                  className="px-5 py-2 bg-[#B99A63] hover:bg-[#A88B54] text-[#12141A] font-bold rounded-xl disabled:opacity-50 transition"
                >
                  {modLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Full Reservation Dossier Drawer/Modal */}
      {activeDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div
            className={`border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <div className="text-[11px] font-mono text-[#B99A63] uppercase tracking-wider">
                  Reservation Dossier
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-100">
                  {activeDossier.reservation.reservationReference}
                </h3>
              </div>
              <button
                onClick={() => setActiveDossier(null)}
                className="text-stone-400 hover:text-white p-2"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 font-mono text-xs">
              {/* Guest & Timing Grid */}
              <div
                className={`p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-3 gap-4 ${
                  isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
                }`}
              >
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Guest Name</span>
                  <span className="font-bold text-sm text-stone-200">
                    {activeDossier.reservation.guestName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Party Size</span>
                  <span className="font-bold text-sm text-[#B99A63]">
                    {activeDossier.reservation.guestCount} Guests
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Sitting Time</span>
                  <span className="font-bold text-sm text-stone-200">
                    {activeDossier.reservation.reservationTime}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Contact Phone</span>
                  <span className="text-stone-300">{activeDossier.reservation.guestPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Email Address</span>
                  <span className="text-stone-300 truncate block">
                    {activeDossier.reservation.guestEmail}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase block">Current Status</span>
                  {getStatusBadge(activeDossier.reservation.status)}
                </div>
              </div>

              {/* Table Allocation & Special Requests */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
                }`}
              >
                <h4 className="text-[11px] font-bold text-stone-300 uppercase mb-2">
                  Table Allocation & Atmosphere
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <span className="text-stone-500">ASSIGNED TABLE:</span>{' '}
                    <span className="font-bold text-emerald-400">
                      {activeDossier.reservation.assignedTableName || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500">PREFERENCE:</span>{' '}
                    <span className="text-stone-300">
                      {activeDossier.reservation.seatingPreference}
                    </span>
                  </div>
                </div>
                {activeDossier.reservation.specialRequests && (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                    <span className="font-bold uppercase">Guest Request:</span>{' '}
                    {activeDossier.reservation.specialRequests}
                  </div>
                )}
              </div>

              {/* Linked Stage 7 Dine-in Pre-Orders */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
                }`}
              >
                <h4 className="text-[11px] font-bold text-stone-300 uppercase mb-3 flex items-center gap-2">
                  <UtensilsCrossed size={14} className="text-[#B99A63]" />
                  Linked Dine-In Pre-Orders (Stage 7)
                </h4>
                {activeDossier.linkedOrders.length === 0 ? (
                  <div className="text-stone-500 py-2">
                    No advance kitchen courses linked to this booking.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeDossier.linkedOrders.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-lg border border-white/5 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#B99A63]">{ord.orderReference}</div>
                          <div className="text-[10px] text-stone-400">
                            {ord.items?.length || 0} item(s) • Total: LKR{' '}
                            {Math.round((ord.totalMinor || 0) / 100).toLocaleString()}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                          {ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status History Timeline */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
                }`}
              >
                <h4 className="text-[11px] font-bold text-stone-300 uppercase mb-3">
                  Status Lifecycle Audit
                </h4>
                <div className="space-y-2.5">
                  {(activeDossier.reservation.statusHistory || []).map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B99A63] mt-1.5 shrink-0" />
                      <div>
                        <span className="font-bold text-stone-300">{h.status}</span> —{' '}
                        <span className="text-stone-400">{h.note || 'No notes'}</span>
                        <div className="text-[10px] text-stone-500">
                          {new Date(h.changedAt).toLocaleString()} ({h.actorType})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
