'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { IVIPRoomSafeJSON } from '../../../../types/vip';
import { apiClient } from '../../../../lib/api';
import {
  Sparkles,
  Plus,
  Search,
  RefreshCw,
  Users,
  Clock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';

export default function AdminVipRoomsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const locationId = selectedLocation || 'loc-colombo-main';

  const [rooms, setRooms] = useState<IVIPRoomSafeJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Preview Modal
  const [previewRoom, setPreviewRoom] = useState<IVIPRoomSafeJSON | null>(null);

  // Action Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive' | 'togglePublish';
    room: IVIPRoomSafeJSON | null;
    isProcessing: boolean;
  }>({
    isOpen: false,
    type: 'archive',
    room: null,
    isProcessing: false,
  });

  const fetchRooms = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiClient<any>(
        `/api/admin/vip/rooms?locationId=${encodeURIComponent(locationId)}`
      );
      setRooms(res?.data || []);
    } catch (err: any) {
      console.error('Failed to load VIP rooms:', err);
      setError(err?.message || 'Failed to load VIP rooms from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdate = () => {
      fetchRooms(true);
    };

    socket.on('vip.roomAvailabilityChanged', handleRoomUpdate);
    socket.on('vip.bookingCreated', handleRoomUpdate);

    return () => {
      socket.off('vip.roomAvailabilityChanged', handleRoomUpdate);
      socket.off('vip.bookingCreated', handleRoomUpdate);
    };
  }, [socket, fetchRooms]);

  // Quick Notification Helper
  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Toggle Publication
  const handleTogglePublish = async (room: IVIPRoomSafeJSON) => {
    try {
      setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
      const res = await apiClient<any>(
        `/api/admin/vip/rooms/${room.id}`,
        { method: 'PATCH', data: { isPublished: !room.isPublished } }
      );
      const updated: IVIPRoomSafeJSON = res.data;
      setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast(
        `Room "${updated.name}" is now ${updated.isPublished ? 'PUBLISHED' : 'UNPUBLISHED (DRAFT)'}.`
      );
      setConfirmModal({ isOpen: false, type: 'togglePublish', room: null, isProcessing: false });
    } catch (err: any) {
      alert(err?.message || 'Failed to update publication status.');
      setConfirmModal((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // Archive / Delete Room
  const handleArchiveRoom = async (room: IVIPRoomSafeJSON) => {
    try {
      setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
      await apiClient<any>(`/api/admin/vip/rooms/${room.id}`, { method: 'DELETE' });
      showToast(`VIP Room "${room.name}" has been archived.`);
      setConfirmModal({ isOpen: false, type: 'archive', room: null, isProcessing: false });
      fetchRooms(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to archive VIP room.');
      setConfirmModal((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // Filtered List
  const filteredRooms = rooms.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchSlug = r.slug.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      if (!matchName && !matchSlug && !matchDesc) return false;
    }
    if (publishedFilter === 'PUBLISHED' && !r.isPublished) return false;
    if (publishedFilter === 'DRAFT' && r.isPublished) return false;
    if (statusFilter === 'ACTIVE' && !r.isActive) return false;
    if (statusFilter === 'ARCHIVED' && r.isActive) return false;
    return true;
  });

  // Overview Counts
  const totalRooms = rooms.length;
  const publishedCount = rooms.filter((r) => r.isPublished && r.isActive).length;
  const draftCount = rooms.filter((r) => !r.isPublished && r.isActive).length;
  const totalCapacity = rooms
    .filter((r) => r.isActive)
    .reduce((sum, r) => sum + r.capacityMax, 0);

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="space-y-6">
        {/* Top Header */}
        <StaffPageHeader
          title="VIP Rooms & Private Suites"
          subtitle="Manage private salon inventory, capacities, minimum spend rules, and publication status."
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchRooms(true)}
                disabled={refreshing || loading}
                className={`p-2.5 rounded-lg border transition-all ${
                  isDark
                    ? 'border-[#22211E] bg-[#141412] hover:bg-[#1E1E1C] text-stone-300'
                    : 'border-[#E5DFD3] bg-white hover:bg-stone-50 text-stone-700'
                }`}
                title="Refresh Room List"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <Link
                href="/staff/admin/vip-rooms/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B99A63] hover:bg-[#A88952] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md shadow-[#B99A63]/20"
              >
                <Plus size={16} />
                <span>New VIP Room</span>
              </Link>
            </div>
          }
        />

        {/* Success Toast */}
        {successMsg && (
          <div className="p-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Total Rooms
              </span>
              <Sparkles size={16} className="text-[#B99A63]" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-stone-100">{totalRooms}</p>
            <span className="text-[11px] text-stone-400">At current restaurant location</span>
          </div>

          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Published & Active
              </span>
              <Eye size={16} className="text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-emerald-400">{publishedCount}</p>
            <span className="text-[11px] text-stone-400">Live on customer website</span>
          </div>

          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Drafts / Offline
              </span>
              <EyeOff size={16} className="text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-amber-400">{draftCount}</p>
            <span className="text-[11px] text-stone-400">Hidden from public booking</span>
          </div>

          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Combined VIP Capacity
              </span>
              <Users size={16} className="text-[#B99A63]" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-stone-100">{totalCapacity} Guests</p>
            <span className="text-[11px] text-stone-400">Simultaneous private salon max</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all ${
            isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
          }`}
        >
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by room name, slug, or features..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg text-xs outline-none transition-all ${
                isDark
                  ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-200 focus:border-[#B99A63]'
                  : 'bg-stone-50 border border-stone-200 text-stone-800 focus:border-[#B99A63]'
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className={`px-3 py-2 rounded-lg text-xs outline-none cursor-pointer border ${
                isDark
                  ? 'bg-[#1C1B18] border-[#2B2A26] text-stone-200'
                  : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}
            >
              <option value="ALL">All Publication States</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Drafts Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-3 py-2 rounded-lg text-xs outline-none cursor-pointer border ${
                isDark
                  ? 'bg-[#1C1B18] border-[#2B2A26] text-stone-200'
                  : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}
            >
              <option value="ALL">All Operational Statuses</option>
              <option value="ACTIVE">Active Rooms</option>
              <option value="ARCHIVED">Archived Rooms</option>
            </select>
          </div>
        </div>

        {/* Room Table / Directory */}
        <div
          className={`rounded-xl border overflow-hidden transition-all ${
            isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
          }`}
        >
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-stone-400">
              <Loader2 size={32} className="animate-spin text-[#B99A63]" />
              <p className="text-xs tracking-wider uppercase">Loading VIP room ledger...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-16 text-center text-stone-400 space-y-3">
              <Sparkles size={36} className="mx-auto text-stone-600" />
              <p className="text-sm font-serif">No VIP rooms found matching your filters.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setPublishedFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-[#B99A63] hover:underline"
              >
                Clear all filters
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
                    <th className="py-3.5 px-4">Room & Space</th>
                    <th className="py-3.5 px-4">Capacity</th>
                    <th className="py-3.5 px-4">Pricing & Min. Spend</th>
                    <th className="py-3.5 px-4">Duration / Buffer</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y text-xs ${
                    isDark ? 'divide-[#22211E] text-stone-200' : 'divide-[#E5DFD3] text-stone-800'
                  }`}
                >
                  {filteredRooms.map((room) => {
                    const priceFormatted = `${room.currency} ${(room.basePriceMinor / 100).toLocaleString()}`;
                    const minSpendFormatted = `${room.currency} ${(room.minimumSpendMinor / 100).toLocaleString()}`;
                    const primaryImage =
                      room.images && room.images.length > 0
                        ? room.images[0]
                        : 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=600';

                    return (
                      <tr
                        key={room.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#1A1A18]' : 'hover:bg-stone-50/80'
                        }`}
                      >
                        {/* Room & Space */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-stone-800 relative">
                              <img
                                src={primaryImage}
                                alt={room.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-medium text-sm text-stone-100">
                                  {room.name}
                                </span>
                                {room.tag && (
                                  <span className="text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30">
                                    {room.tag}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                                <span className="font-mono">slug: /{room.slug}</span>
                                {room.squareMeters && (
                                  <>
                                    <span>•</span>
                                    <span>{room.squareMeters}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Capacity */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-stone-300">
                            <Users size={14} className="text-[#B99A63]" />
                            <span className="font-medium">
                              {room.capacityMin} – {room.capacityMax} Guests
                            </span>
                          </div>
                        </td>

                        {/* Pricing */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="font-medium text-stone-200">Base: {priceFormatted}</div>
                            <div className="text-[11px] text-stone-400">
                              Min. Spend: {minSpendFormatted}
                            </div>
                          </div>
                        </td>

                        {/* Duration & Buffer */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-0.5 text-stone-300">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-stone-400" />
                              <span>{room.bookingDurationMinutes} mins block</span>
                            </div>
                            <div className="text-[11px] text-stone-400">
                              Buffer: {room.bufferMinutes} mins prep
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {room.isPublished ? (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 size={11} />
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <EyeOff size={11} />
                                Draft
                              </span>
                            )}

                            {!room.isActive && (
                              <span className="text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded bg-stone-700/50 text-stone-400 border border-stone-600/50">
                                Archived
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview */}
                            <button
                              onClick={() => setPreviewRoom(room)}
                              className={`p-2 rounded hover:bg-[#B99A63]/20 text-stone-300 hover:text-[#B99A63] transition-colors`}
                              title="Preview Room Details"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Toggle Publish */}
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'togglePublish',
                                  room,
                                  isProcessing: false,
                                })
                              }
                              className={`p-2 rounded hover:bg-stone-700/30 transition-colors ${
                                room.isPublished
                                  ? 'text-amber-400 hover:text-amber-300'
                                  : 'text-emerald-400 hover:text-emerald-300'
                              }`}
                              title={room.isPublished ? 'Unpublish (Make Draft)' : 'Publish Room'}
                            >
                              {room.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>

                            {/* Edit */}
                            <Link
                              href={`/staff/admin/vip-rooms/${room.id}/edit`}
                              className="p-2 rounded hover:bg-stone-700/30 text-stone-300 hover:text-white transition-colors"
                              title="Edit Room"
                            >
                              <Edit size={15} />
                            </Link>

                            {/* Archive */}
                            <button
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'archive',
                                  room,
                                  isProcessing: false,
                                })
                              }
                              className="p-2 rounded hover:bg-rose-900/30 text-stone-400 hover:text-rose-400 transition-colors"
                              title="Archive Room"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Room Detail Preview Slideout / Modal */}
        {previewRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div
              className={`max-w-2xl w-full rounded-2xl border p-6 space-y-6 max-h-[90vh] overflow-y-auto ${
                isDark ? 'bg-[#171715] border-[#22211E]' : 'bg-white border-[#E5DFD3]'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-4 border-stone-700/40">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#B99A63]" />
                  <h3 className="font-serif text-xl font-medium text-stone-100">
                    {previewRoom.name}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewRoom(null)}
                  className="p-1 rounded text-stone-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Photos Carousel/Row */}
              {previewRoom.images && previewRoom.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden max-h-48">
                  {previewRoom.images.slice(0, 2).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={previewRoom.name}
                      className="w-full h-48 object-cover rounded"
                    />
                  ))}
                </div>
              )}

              {/* Descriptions */}
              <div className="space-y-2">
                <h4 className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                  About the Space
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {previewRoom.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-stone-900/50 border border-stone-800">
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block">Min Capacity</span>
                  <span className="text-sm font-semibold text-stone-100">
                    {previewRoom.capacityMin} Guests
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block">Max Capacity</span>
                  <span className="text-sm font-semibold text-stone-100">
                    {previewRoom.capacityMax} Guests
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block">Base Price</span>
                  <span className="text-sm font-semibold text-[#B99A63]">
                    {previewRoom.currency} {(previewRoom.basePriceMinor / 100).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block">Min. Spend</span>
                  <span className="text-sm font-semibold text-[#B99A63]">
                    {previewRoom.currency} {(previewRoom.minimumSpendMinor / 100).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Amenities */}
              {previewRoom.amenities && previewRoom.amenities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                    Amenities & Dedicated Concierge Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewRoom.amenities.map((a, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-stone-900/30 border border-stone-800 text-xs flex flex-col"
                      >
                        <span className="font-semibold text-stone-200">{a.label}</span>
                        <span className="text-[11px] text-stone-400">{a.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features List */}
              {previewRoom.features && previewRoom.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                    Highlights & Inclusions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {previewRoom.features.map((f, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded bg-[#B99A63]/10 text-[#C1A87D] border border-[#B99A63]/25"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                <Link
                  href={`/vip-events/${previewRoom.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-[#B99A63] hover:underline"
                >
                  <span>View Public Customer Page</span>
                  <ExternalLink size={13} />
                </Link>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/staff/admin/vip-rooms/${previewRoom.id}/edit`}
                    className="px-4 py-2 rounded-lg bg-[#B99A63] text-white text-xs font-semibold"
                  >
                    Edit Space
                  </Link>
                  <button
                    onClick={() => setPreviewRoom(null)}
                    className="px-4 py-2 rounded-lg border border-stone-700 text-stone-300 text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal.isOpen && confirmModal.room && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div
              className={`max-w-md w-full rounded-2xl border p-6 space-y-4 ${
                isDark ? 'bg-[#171715] border-[#22211E]' : 'bg-white border-[#E5DFD3]'
              }`}
            >
              <h3 className="font-serif text-lg font-medium text-stone-100">
                {confirmModal.type === 'archive'
                  ? `Archive "${confirmModal.room.name}"?`
                  : confirmModal.room.isPublished
                  ? `Unpublish "${confirmModal.room.name}"?`
                  : `Publish "${confirmModal.room.name}"?`}
              </h3>

              <p className="text-xs text-stone-300 leading-relaxed">
                {confirmModal.type === 'archive'
                  ? 'Archiving this room will hide it from new customer inquiries and availability checks while preserving all historical reservations and ledger reports.'
                  : confirmModal.room.isPublished
                  ? 'Unpublishing will set this room to draft mode. Guests on the customer website will no longer see it in the private spaces directory.'
                  : 'Publishing will immediately make this VIP suite available for public browsing and reservation inquiries.'}
              </p>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={confirmModal.isProcessing}
                  onClick={() =>
                    setConfirmModal({ isOpen: false, type: 'archive', room: null, isProcessing: false })
                  }
                  className="px-4 py-2 rounded-lg border border-stone-700 text-stone-300 text-xs hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirmModal.isProcessing}
                  onClick={() => {
                    if (confirmModal.type === 'archive') {
                      handleArchiveRoom(confirmModal.room!);
                    } else {
                      handleTogglePublish(confirmModal.room!);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 text-white ${
                    confirmModal.type === 'archive'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-[#B99A63] hover:bg-[#A88952]'
                  }`}
                >
                  {confirmModal.isProcessing && <Loader2 size={13} className="animate-spin" />}
                  <span>Confirm</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
