'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import { ReceptionReservationItem } from '../../../../types/reception';
import {
  History,
  Search,
  Calendar,
  Users,
  Loader2,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';

export default function ReceptionHistoryPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';
  const locationId = selectedLocation || 'loc-colombo-main';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [historyItems, setHistoryItems] = useState<ReceptionReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReceptionReservationItem | null>(null);

  const fetchHistory = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        const params = new URLSearchParams({
          locationId,
          page: page.toString(),
          limit: '25',
        });

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
        }>(`/admin/reservations?${params.toString()}`);

        if (res?.success) {
          setHistoryItems(res.data.reservations || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || 0);
        }
      } catch (err: any) {
        console.error('Fetch history error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [locationId, page, statusFilter, search]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">COMPLETED</span>;
      case 'SEATED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">SEATED</span>;
      case 'NO_SHOW':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">NO SHOW</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-stone-500/15 text-stone-400 border border-stone-500/30">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-stone-500/15 text-stone-400 border border-stone-500/30">{status}</span>;
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION]}>
      <StaffPageHeader
        title="Reception Booking & Visit History"
        subtitle="Complete chronological archive of past dining seatings, completed visits, cancellations, and no-shows."
        badge="RECEPTION LOGS"
      />

      {/* Filter Bar */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 mb-6 transition-colors ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search reference, guest name, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-2.5 text-xs text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
            >
              <option value="ALL">All Historical Records</option>
              <option value="COMPLETED">Completed Dining Visits</option>
              <option value="SEATED">Currently Seated Visits</option>
              <option value="NO_SHOW">No-Show Records</option>
              <option value="CANCELLED">Cancelled Bookings</option>
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs">
            <span className="text-stone-400">{totalCount} archived records</span>
            <button
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              className={`p-2.5 rounded-xl border transition ${
                isDark
                  ? 'bg-[#12141A] border-[#2D3340] text-stone-400 hover:text-white'
                  : 'bg-[#F6F1E8] border-[#E5DFD3] text-stone-600 hover:text-black'
              }`}
              title="Refresh logs"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#B99A63]' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
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
                <th className="px-5 py-3.5">Guest Name</th>
                <th className="px-5 py-3.5">Party</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Assigned Tables</th>
                <th className="px-5 py-3.5">Final Status</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-400">
                    <Loader2 size={24} className="animate-spin text-[#B99A63] mx-auto mb-2" />
                    Loading archive records...
                  </td>
                </tr>
              ) : historyItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-500">
                    No historical records match your search criteria.
                  </td>
                </tr>
              ) : (
                historyItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-bold text-[#C1A87D]">
                      {item.reservationReference}
                    </td>
                    <td className="px-5 py-4 font-sans font-medium text-stone-200">
                      {item.guestName}
                    </td>
                    <td className="px-5 py-4 text-stone-400">{item.guestCount} guests</td>
                    <td className="px-5 py-4 text-stone-300">
                      <div>{item.reservationDate}</div>
                      <div className="text-[10px] text-stone-500">{item.reservationTime}</div>
                    </td>
                    <td className="px-5 py-4 text-emerald-400 font-bold">
                      {item.tableNumbers && item.tableNumbers.length > 0
                        ? item.tableNumbers.join(', ')
                        : 'Unassigned'}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-1.5 text-stone-400 hover:text-[#C1A87D] transition"
                        title="View Audit Timeline"
                      >
                        <ExternalLink size={15} />
                      </button>
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

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 font-mono">
              <div>
                <span className="text-[10px] text-[#B99A63] uppercase">Archived Visit Record</span>
                <h3 className="text-lg font-bold text-stone-100">
                  {selectedItem.reservationReference}
                </h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-stone-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div
                className={`p-3.5 rounded-xl border grid grid-cols-2 gap-3 ${
                  isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
                }`}
              >
                <div>
                  <span className="text-stone-500 block text-[10px]">GUEST</span>
                  <span className="font-bold text-stone-200">{selectedItem.guestName}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">PARTY SIZE</span>
                  <span className="text-stone-200">{selectedItem.guestCount} guests</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">TABLES</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedItem.tableNumbers?.join(', ') || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">FINAL STATUS</span>
                  {getStatusBadge(selectedItem.status)}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-stone-300 uppercase mb-2">
                  Lifecycle Status History
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(selectedItem.statusHistory || []).map((h, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-white/5 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-stone-300">
                        <span>{h.status}</span>
                        <span className="text-[10px] text-stone-500">
                          {new Date(h.changedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-stone-400 text-[10px] mt-0.5">{h.note || 'No notes'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-stone-600 rounded-xl text-stone-300 text-xs font-mono hover:bg-white/5 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
