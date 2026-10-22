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
import { TableAvailabilityItem } from '../../../../types/reception';
import {
  Armchair,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

export default function ReceptionTablesPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';
  const locationId = selectedLocation || 'loc-colombo-main';

  const [tables, setTables] = useState<TableAvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sectionFilter, setSectionFilter] = useState('ALL');

  const fetchTables = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError(null);

        const res = await apiClient<{ success: boolean; data: TableAvailabilityItem[] }>(
          `/reception/tables/availability?locationId=${locationId}`
        );

        if (res?.success) {
          setTables(res.data || []);
        }
      } catch (err: any) {
        console.error('Fetch tables error:', err);
        setError(err.message || 'Failed to load table overview.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [locationId]
  );

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchTables(true);

    socket.on('reception.guestSeated', handleUpdate);
    socket.on('reception.tableAssigned', handleUpdate);
    socket.on('reception.noShowRecorded', handleUpdate);
    socket.on('reception.walkInCreated', handleUpdate);

    return () => {
      socket.off('reception.guestSeated', handleUpdate);
      socket.off('reception.tableAssigned', handleUpdate);
      socket.off('reception.noShowRecorded', handleUpdate);
      socket.off('reception.walkInCreated', handleUpdate);
    };
  }, [socket, fetchTables]);

  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  const sections = ['ALL', ...Array.from(new Set(tables.map((t) => t.section)))];
  const filteredTables =
    sectionFilter === 'ALL' ? tables : tables.filter((t) => t.section === sectionFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400';
      case 'OCCUPIED':
        return 'border-rose-500/40 bg-rose-500/5 text-rose-400';
      case 'RESERVED':
        return 'border-amber-500/40 bg-amber-500/5 text-amber-400';
      case 'CLEANING':
        return 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400';
      default:
        return 'border-stone-600/40 bg-stone-600/5 text-stone-400';
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION]}>
      <StaffPageHeader
        title="Dining Table Availability"
        subtitle="Real-time dining room floor plan overview, table capacity, current seatings, and upcoming bookings."
        badge="FLOOR AVAILABILITY"
      />

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div
          className={`border rounded-xl p-4 flex items-center justify-between font-mono ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div>
            <span className="text-[10px] text-stone-400 uppercase block">AVAILABLE</span>
            <span className="text-xl font-bold text-emerald-400">{availableCount} Tables</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={16} />
          </div>
        </div>

        <div
          className={`border rounded-xl p-4 flex items-center justify-between font-mono ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div>
            <span className="text-[10px] text-stone-400 uppercase block">OCCUPIED</span>
            <span className="text-xl font-bold text-rose-400">{occupiedCount} Tables</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
            <Armchair size={16} />
          </div>
        </div>

        <div
          className={`border rounded-xl p-4 flex items-center justify-between font-mono ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div>
            <span className="text-[10px] text-stone-400 uppercase block">RESERVED</span>
            <span className="text-xl font-bold text-amber-400">{reservedCount} Tables</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Clock size={16} />
          </div>
        </div>

        <div
          className={`border rounded-xl p-4 flex items-center justify-between font-mono ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div>
            <span className="text-[10px] text-stone-400 uppercase block">TOTAL</span>
            <span className="text-xl font-bold text-stone-200">{tables.length} Tables</span>
          </div>
          <button
            onClick={() => fetchTables(true)}
            disabled={refreshing}
            className="p-2 text-stone-400 hover:text-white transition"
            title="Refresh tables"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#B99A63]' : ''} />
          </button>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setSectionFilter(sec)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition ${
              sectionFilter === sec
                ? 'bg-[#B99A63] text-[#12141A] font-bold shadow-sm'
                : isDark
                ? 'bg-[#1E1E1B] text-stone-400 border border-[#2C2C28] hover:text-white'
                : 'bg-white text-stone-600 border border-[#E5DFD3] hover:text-black'
            }`}
          >
            {sec.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-400 flex flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#B99A63]" />
          <span className="text-xs font-mono">Loading floor layout and occupancy...</span>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-16 text-center text-stone-500 font-mono text-xs">
          No tables found in this section.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTables.map((t) => (
            <div
              key={t.id}
              className={`border-2 rounded-2xl p-5 flex flex-col justify-between transition hover:shadow-lg ${
                isDark ? 'bg-[#1E1E1B]' : 'bg-white'
              } ${getStatusColor(t.status)}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif font-bold text-xl text-stone-100">
                    {t.tableNumber}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border uppercase">
                    {t.status}
                  </span>
                </div>

                <div className="text-xs text-stone-300 font-medium mb-3">{t.name}</div>

                <div className="text-[11px] font-mono text-stone-400 space-y-1 mb-4 pb-3 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <span>CAPACITY:</span>
                    <span className="font-bold text-stone-200">
                      {t.minPartySize} - {t.capacity} Guests
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SECTION:</span>
                    <span>{t.section.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Occupant details */}
                {t.currentOccupant ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[11px] mb-3">
                    <span className="font-bold block uppercase text-[10px]">Currently Seated:</span>
                    <div className="font-semibold text-stone-100">{t.currentOccupant.guestName}</div>
                    <div className="text-[10px] text-stone-400">
                      {t.currentOccupant.guestCount} guests • Ref: {t.currentOccupant.reservationReference}
                    </div>
                  </div>
                ) : t.nextReservation ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[11px] mb-3">
                    <span className="font-bold block uppercase text-[10px]">Next Booking:</span>
                    <div className="font-semibold text-stone-100">{t.nextReservation.guestName}</div>
                    <div className="text-[10px] text-stone-400">
                      {t.nextReservation.guestCount} guests at{' '}
                      {new Date(t.nextReservation.startAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-300 font-mono text-[11px] mb-3 flex items-center justify-between">
                    <span>Table is open</span>
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-2">
                {t.status === 'AVAILABLE' ? (
                  <Link
                    href={`/staff/reception/walk-ins?tableNumber=${t.tableNumber}`}
                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <PlusCircle size={14} /> Seat Walk-In
                  </Link>
                ) : (
                  <Link
                    href={`/staff/reception/reservations?search=${t.tableNumber}`}
                    className="w-full py-2 bg-stone-700/20 hover:bg-stone-700/30 text-stone-300 border border-stone-600/30 rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition"
                  >
                    View Reservation
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </StaffLayout>
  );
}
