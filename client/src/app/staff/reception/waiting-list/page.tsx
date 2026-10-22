'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import { WaitingListItem, WaitingListStatus, TableAvailabilityItem } from '../../../../types/reception';
import {
  Users,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
  RefreshCw,
  X,
  Armchair,
  Phone,
  Trash2,
} from 'lucide-react';

export default function ReceptionWaitingListPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';
  const locationId = selectedLocation || 'loc-colombo-main';

  const [entries, setEntries] = useState<WaitingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available tables for seating modal
  const [availableTables, setAvailableTables] = useState<TableAvailabilityItem[]>([]);

  // Add party modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [guestPhone, setGuestPhone] = useState('+94 ');
  const [seatingPreference, setSeatingPreference] = useState('No preference');
  const [notes, setNotes] = useState('');
  const [estimatedWait, setEstimatedWait] = useState(15);
  const [addLoading, setAddLoading] = useState(false);

  // Seating modal
  const [seatingEntry, setSeatingEntry] = useState<WaitingListItem | null>(null);
  const [selectedTableNumber, setSelectedTableNumber] = useState('');
  const [seatLoading, setSeatLoading] = useState(false);

  const fetchWaitingList = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError(null);

        const res = await apiClient<{ success: boolean; data: WaitingListItem[] }>(
          `/reception/waiting-list?locationId=${locationId}`
        );

        if (res?.success) {
          setEntries(res.data || []);
        }
      } catch (err: any) {
        console.error('Fetch waitlist error:', err);
        setError(err.message || 'Failed to load waiting list.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [locationId]
  );

  useEffect(() => {
    fetchWaitingList();
  }, [fetchWaitingList]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchWaitingList(true);

    socket.on('reception.waitingListUpdated', handleUpdate);
    socket.on('reception.guestSeated', handleUpdate);

    return () => {
      socket.off('reception.waitingListUpdated', handleUpdate);
      socket.off('reception.guestSeated', handleUpdate);
    };
  }, [socket, fetchWaitingList]);

  // Load available tables
  const loadAvailableTables = async () => {
    try {
      const res = await apiClient<{ success: boolean; data: TableAvailabilityItem[] }>(
        `/reception/tables/availability?locationId=${locationId}`
      );
      if (res?.success) {
        setAvailableTables(res.data.filter((t) => t.status === 'AVAILABLE'));
      }
    } catch {}
  };

  // Add waiting party
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      await apiClient(`/reception/waiting-list`, {
        method: 'POST',
        body: JSON.stringify({
          locationId,
          guestName: guestName.trim(),
          guestCount,
          guestPhone: guestPhone.trim(),
          seatingPreference,
          notes: notes.trim() || undefined,
          estimatedWaitMinutes: estimatedWait,
        }),
      });

      setShowAddModal(false);
      setGuestName('');
      setGuestCount(2);
      setGuestPhone('+94 ');
      setNotes('');
      fetchWaitingList(true);
    } catch (err: any) {
      alert(err.message || 'Failed to add party');
    } finally {
      setAddLoading(false);
    }
  };

  // Notify guest
  const handleNotify = async (entry: WaitingListItem) => {
    try {
      await apiClient(`/reception/waiting-list/${entry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: WaitingListStatus.NOTIFIED }),
      });
      fetchWaitingList(true);
    } catch (err: any) {
      alert(err.message || 'Failed to notify party');
    }
  };

  // Open Seat Modal
  const openSeatModal = (entry: WaitingListItem) => {
    setSeatingEntry(entry);
    setSelectedTableNumber('');
    loadAvailableTables();
  };

  // Seat waiting party
  const handleSeatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatingEntry || !selectedTableNumber) return;

    try {
      setSeatLoading(true);
      await apiClient(`/reception/waiting-list/${seatingEntry.id}/seat`, {
        method: 'POST',
        body: JSON.stringify({ tableNumber: selectedTableNumber }),
      });

      setSeatingEntry(null);
      fetchWaitingList(true);
    } catch (err: any) {
      alert(err.message || 'Failed to seat waiting party');
    } finally {
      setSeatLoading(false);
    }
  };

  // Cancel waiting party
  const handleCancelEntry = async (id: string) => {
    if (!confirm('Remove this party from the waiting list?')) return;
    try {
      await apiClient(`/reception/waiting-list/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: WaitingListStatus.CANCELLED }),
      });
      fetchWaitingList(true);
    } catch (err: any) {
      alert(err.message || 'Failed to remove party');
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION]}>
      <StaffPageHeader
        title="Foyer Waiting List Queue"
        subtitle="Manage guest arrivals awaiting dining table availability. Notify guests and seat immediately upon table clearance."
        badge="QUEUE DESK"
      />

      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B99A63] hover:bg-[#A88B54] text-[#12141A] font-bold text-xs font-mono rounded-xl shadow-sm transition"
          >
            <PlusCircle size={16} />
            Add Party to Waitlist
          </button>
          <span className="text-xs font-mono text-stone-400">
            {entries.length} active waiting parties
          </span>
        </div>

        <button
          onClick={() => fetchWaitingList(true)}
          disabled={refreshing}
          className={`p-2.5 rounded-xl border transition ${
            isDark
              ? 'bg-[#1E1E1B] border-[#2C2C28] text-stone-400 hover:text-white'
              : 'bg-white border-[#E5DFD3] text-stone-600 hover:text-black'
          }`}
          title="Refresh Queue"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#B99A63]' : ''} />
        </button>
      </div>

      {/* Queue List Cards */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 flex flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#B99A63]" />
          <span className="text-xs font-mono">Loading waiting queue...</span>
        </div>
      ) : entries.length === 0 ? (
        <div
          className={`border rounded-2xl p-12 text-center transition-colors ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <Users size={32} className="text-stone-600 mx-auto mb-3" />
          <h4 className="font-serif text-lg text-stone-200 mb-1">Queue Is Currently Clear</h4>
          <p className="text-xs font-mono text-stone-400 max-w-sm mx-auto mb-6">
            All arriving guests have been seated. New walk-ins can be added to the queue when tables are committed.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[#B99A63] hover:bg-[#A88B54] text-[#12141A] font-bold text-xs font-mono rounded-xl transition"
          >
            Add First Party
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((item, index) => (
            <div
              key={item.id}
              className={`border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-purple-500/30 ${
                isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-mono font-bold flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] uppercase text-stone-400">POS</span>
                  <span className="text-sm">#{index + 1}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-serif font-bold text-stone-100">
                      {item.guestName}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        item.status === 'NOTIFIED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-stone-400 mt-1">
                    <span>{item.guestCount} guests</span>
                    <span>•</span>
                    <span>{item.guestPhone}</span>
                    <span>•</span>
                    <span className="text-stone-300">{item.seatingPreference}</span>
                  </div>

                  {item.notes && (
                    <div className="text-[11px] font-mono text-amber-300/80 mt-1.5">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Waiting Stats & Actions */}
              <div className="flex items-center gap-3 self-end sm:self-center font-mono text-xs">
                <div className="text-right mr-2">
                  <div className="text-sm font-bold text-purple-400">
                    {item.waitDurationMinutes}m elapsed
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Est: ~{item.estimatedWaitMinutes}m
                  </div>
                </div>

                {item.status === 'WAITING' && (
                  <button
                    onClick={() => handleNotify(item)}
                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition flex items-center gap-1.5 font-bold"
                  >
                    <Bell size={14} /> Notify Table Ready
                  </button>
                )}

                <button
                  onClick={() => openSeatModal(item)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Armchair size={14} /> Seat Party
                </button>

                <button
                  onClick={() => handleCancelEntry(item.id)}
                  className="p-2 text-stone-500 hover:text-rose-400 transition"
                  title="Remove from queue"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Waiting Party Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="font-serif font-bold text-lg text-stone-200">
                Add Party to Waiting List
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-stone-400 block mb-1 text-[10px] uppercase">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-stone-400 block mb-1 text-[10px] uppercase">
                    Party Size *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                    className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1 text-[10px] uppercase">
                    Est. Wait (Min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={estimatedWait}
                    onChange={(e) => setEstimatedWait(parseInt(e.target.value, 10))}
                    className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-400 block mb-1 text-[10px] uppercase">
                  Contact Telephone *
                </label>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1 text-[10px] uppercase">
                  Seating Preference
                </label>
                <select
                  value={seatingPreference}
                  onChange={(e) => setSeatingPreference(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                >
                  <option value="No preference">No preference</option>
                  <option value="Main Dining Room">Main Dining Room</option>
                  <option value="Counter / Chef's View">Counter / Chef&apos;s View</option>
                  <option value="Outdoor Terrace">Outdoor Terrace</option>
                  <option value="Private Dining">Private Dining</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1 text-[10px] uppercase">
                  Notes / Requests
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Waiting at cocktail lounge"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2 text-stone-200 outline-none focus:border-[#C1A87D]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-600 rounded-xl text-stone-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 bg-[#B99A63] hover:bg-[#A88B54] text-[#12141A] font-bold rounded-xl disabled:opacity-50 transition"
                >
                  {addLoading ? 'Adding...' : 'Add to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seat Waiting Party Modal */}
      {seatingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div
            className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="font-serif font-bold text-lg text-emerald-400 flex items-center gap-2">
                <Armchair size={18} />
                Seat Waiting Party
              </h3>
              <button onClick={() => setSeatingEntry(null)} className="text-stone-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs font-mono text-stone-300 mb-4">
              Select an available table to escort and seat <span className="text-white font-bold">{seatingEntry.guestName}</span> ({seatingEntry.guestCount} guests).
            </p>

            <form onSubmit={handleSeatSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-stone-400 block mb-1 text-[10px] uppercase">
                  Select Available Table *
                </label>
                <select
                  required
                  value={selectedTableNumber}
                  onChange={(e) => setSelectedTableNumber(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-3 py-2.5 text-stone-200 outline-none focus:border-[#C1A87D]"
                >
                  <option value="">-- Choose Dining Table --</option>
                  {availableTables.map((t) => (
                    <option
                      key={t.id}
                      value={t.tableNumber}
                      disabled={t.capacity < seatingEntry.guestCount}
                    >
                      Table {t.tableNumber} ({t.name}) — Cap: {t.capacity} [
                      {t.section.replace(/_/g, ' ')}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSeatingEntry(null)}
                  className="px-4 py-2 border border-stone-600 rounded-xl text-stone-300 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={seatLoading || !selectedTableNumber}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50 transition"
                >
                  {seatLoading ? 'Seating...' : 'Confirm Seating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
