'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../components/staff/StaffLayout';
import { useStaffAuth } from '../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import { useSocket } from '../../../context/SocketContext';
import { StaffRole } from '../../../types/staff';
import { apiClient } from '../../../lib/api';
import {
  ReceptionOverviewMetrics,
  ReceptionReservationItem,
  WaitingListItem,
} from '../../../types/reception';
import {
  Calendar,
  UserCheck,
  Armchair,
  Clock,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Phone,
  Check,
  ChevronRight,
  Radio,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

export default function ReceptionDashboardPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected: isConnected } = useSocket();
  const isDark = theme === 'dark';

  const [metrics, setMetrics] = useState<ReceptionOverviewMetrics | null>(null);
  const [reservations, setReservations] = useState<ReceptionReservationItem[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local clock state in Colombo time (UTC+05:30)
  const [currentLocalTime, setCurrentLocalTime] = useState('');
  const [currentLocalDate, setCurrentLocalDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentLocalTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Colombo',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentLocalDate(
        now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Colombo',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const locationId = selectedLocation || 'loc-colombo-main';

  // Load overview data
  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [overviewRes, resListRes, waitRes] = await Promise.all([
        apiClient<{ success: boolean; data: ReceptionOverviewMetrics }>(
          `/reception/overview?locationId=${locationId}`
        ),
        apiClient<{ success: boolean; data: { reservations: ReceptionReservationItem[] } }>(
          `/reception/reservations?locationId=${locationId}&limit=10`
        ),
        apiClient<{ success: boolean; data: WaitingListItem[] }>(
          `/reception/waiting-list?locationId=${locationId}&status=WAITING`
        ),
      ]);

      if (overviewRes?.success) setMetrics(overviewRes.data);
      if (resListRes?.success) setReservations(resListRes.data.reservations || []);
      if (waitRes?.success) setWaitingList(waitRes.data || []);
    } catch (err: any) {
      console.error('Reception load error:', err);
      setError(err.message || 'Failed to connect to reception service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      loadData(true);
    };

    socket.on('reception.guestCheckedIn', handleUpdate);
    socket.on('reception.tableAssigned', handleUpdate);
    socket.on('reception.guestSeated', handleUpdate);
    socket.on('reception.walkInCreated', handleUpdate);
    socket.on('reception.waitingListUpdated', handleUpdate);
    socket.on('reception.noShowRecorded', handleUpdate);
    socket.on('reception.reservationModified', handleUpdate);
    socket.on('reservations.created', handleUpdate);

    return () => {
      socket.off('reception.guestCheckedIn', handleUpdate);
      socket.off('reception.tableAssigned', handleUpdate);
      socket.off('reception.guestSeated', handleUpdate);
      socket.off('reception.walkInCreated', handleUpdate);
      socket.off('reception.waitingListUpdated', handleUpdate);
      socket.off('reception.noShowRecorded', handleUpdate);
      socket.off('reception.reservationModified', handleUpdate);
      socket.off('reservations.created', handleUpdate);
    };
  }, [socket, loadData]);

  // Quick check-in from dashboard
  const handleQuickCheckIn = async (resId: string) => {
    try {
      await apiClient(`/reception/reservations/${resId}/check-in`, { method: 'POST' });
      loadData(true);
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  // Quick seat from dashboard
  const handleQuickSeat = async (resId: string) => {
    try {
      await apiClient(`/reception/reservations/${resId}/seat`, { method: 'POST' });
      loadData(true);
    } catch (err: any) {
      alert(err.message || 'Seating failed');
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
      {/* 1. Header (Section 3) */}
      <div
        className={`border rounded-2xl p-6 sm:p-8 mb-8 shadow-sm transition-colors ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B99A63]/15 border border-[#B99A63]/30 text-[#B99A63] text-xs font-mono uppercase tracking-wider mb-3">
              <Sparkles size={13} />
              AURELLE / RECEPTION
            </div>

            <h1
              className={`text-2xl sm:text-3xl font-serif tracking-wide ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              Reception Operations
            </h1>

            <p
              className={`text-sm mt-1.5 max-w-2xl leading-relaxed ${
                isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
              }`}
            >
              Welcome guests and manage today&apos;s dining reservations.
            </p>
          </div>

          {/* Telemetry info box */}
          <div
            className={`border rounded-xl p-4 text-xs font-mono space-y-2 min-w-[280px] ${
              isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#737068]">LOCATION:</span>
              <span className="text-[#B99A63] font-medium truncate">
                {metrics?.locationName || selectedLocation || 'Colombo Flagship'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#737068]">DATE:</span>
              <span className="text-stone-300 font-medium">{currentLocalDate || 'Loading...'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#737068]">LOCAL TIME:</span>
              <span className="text-[#B99A63] font-semibold">{currentLocalTime || 'Loading...'}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-[#737068]">REALTIME:</span>
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-stone-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-stone-500" />
                  CONNECTING
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded text-xs transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Summary Cards (Section 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Card 1: Today's Reservations */}
        <div
          className={`border rounded-xl p-5 transition-all ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737068]">
              Today&apos;s Reservations
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#B99A63]/15 text-[#B99A63] flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif font-medium text-[#F6F1E8]">
            {loading ? <Loader2 size={24} className="animate-spin text-stone-500" /> : metrics?.todayReservations ?? 0}
          </div>
          <div className="text-[11px] text-[#A5A198] mt-1">Bookings scheduled today</div>
        </div>

        {/* Card 2: Expected Arrivals */}
        <div
          className={`border rounded-xl p-5 transition-all ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737068]">
              Expected Arrivals
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif font-medium text-amber-400">
            {loading ? <Loader2 size={24} className="animate-spin text-stone-500" /> : metrics?.expectedArrivals ?? 0}
          </div>
          <div className="text-[11px] text-[#A5A198] mt-1">Confirmed not yet arrived</div>
        </div>

        {/* Card 3: Checked-In Guests */}
        <div
          className={`border rounded-xl p-5 transition-all ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737068]">
              Checked-In Guests
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif font-medium text-cyan-400">
            {loading ? <Loader2 size={24} className="animate-spin text-stone-500" /> : metrics?.checkedInGuests ?? 0}
          </div>
          <div className="text-[11px] text-[#A5A198] mt-1">Parties in foyer / bar</div>
        </div>

        {/* Card 4: Seated Guests */}
        <div
          className={`border rounded-xl p-5 transition-all ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737068]">
              Seated Guests
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Armchair size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif font-medium text-emerald-400">
            {loading ? <Loader2 size={24} className="animate-spin text-stone-500" /> : metrics?.seatedGuests ?? 0}
          </div>
          <div className="text-[11px] text-[#A5A198] mt-1">Currently dining</div>
        </div>

        {/* Card 5: Waiting Parties */}
        <div
          className={`border rounded-xl p-5 transition-all ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#737068]">
              Waiting Parties
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-serif font-medium text-purple-400">
            {loading ? <Loader2 size={24} className="animate-spin text-stone-500" /> : metrics?.waitingParties ?? 0}
          </div>
          <div className="text-[11px] text-[#A5A198] mt-1">Active waitlist entries</div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/staff/reception/check-in"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B99A63] hover:bg-[#A88B54] text-[#12141A] font-medium text-xs rounded-xl shadow-sm transition"
          >
            <UserCheck size={16} />
            Check-In Terminal
          </Link>

          <Link
            href="/staff/reception/walk-ins"
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-medium transition ${
              isDark
                ? 'bg-[#1E1E1B] border-[#2C2C28] text-stone-200 hover:border-[#B99A63]/50'
                : 'bg-white border-[#E5DFD3] text-stone-800 hover:border-[#B99A63]'
            }`}
          >
            <PlusCircle size={15} className="text-[#B99A63]" />
            Register Walk-In
          </Link>

          <Link
            href="/staff/reception/waiting-list"
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-medium transition ${
              isDark
                ? 'bg-[#1E1E1B] border-[#2C2C28] text-stone-200 hover:border-purple-500/50'
                : 'bg-white border-[#E5DFD3] text-stone-800 hover:border-purple-500'
            }`}
          >
            <Users size={15} className="text-purple-400" />
            Waiting List ({metrics?.waitingParties ?? 0})
          </Link>

          <Link
            href="/staff/reception/tables"
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-medium transition ${
              isDark
                ? 'bg-[#1E1E1B] border-[#2C2C28] text-stone-200 hover:border-emerald-500/50'
                : 'bg-white border-[#E5DFD3] text-stone-800 hover:border-emerald-500'
            }`}
          >
            <Armchair size={15} className="text-emerald-400" />
            Table Overview ({metrics?.tableSummary.available ?? 0} Free)
          </Link>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono rounded-lg border transition ${
            isDark
              ? 'bg-[#1E1E1B] border-[#2C2C28] text-stone-400 hover:text-white'
              : 'bg-white border-[#E5DFD3] text-stone-600 hover:text-black'
          }`}
          title="Refresh reception data"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#B99A63]' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* Main Split View: Today's Schedule & Waiting List Glance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left 2 Cols: Today's Incoming & Active Reservations */}
        <div className="lg:col-span-2">
          <div
            className={`border rounded-2xl p-6 transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-serif font-semibold text-[#F6F1E8]">
                  Today&apos;s Reservations
                </h2>
                <span className="text-xs font-mono text-stone-400">
                  ({reservations.length} upcoming/active)
                </span>
              </div>
              <Link
                href="/staff/reception/reservations"
                className="text-xs font-mono text-[#B99A63] hover:underline flex items-center gap-1"
              >
                View Full Book <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-3">
                <Loader2 size={24} className="animate-spin text-[#B99A63]" />
                <span className="text-xs font-mono">Loading reservation manifest...</span>
              </div>
            ) : reservations.length === 0 ? (
              <div className="py-12 text-center text-stone-500 font-mono text-xs">
                No active reservations scheduled for this sitting.
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-[#B99A63]/30 ${
                      isDark ? 'bg-[#171715] border-[#282723]' : 'bg-[#FAF8F5] border-[#EDE7DE]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#B99A63]/10 border border-[#B99A63]/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-mono text-stone-400 uppercase">
                          {res.reservationTime.split(' ')[1]}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#B99A63]">
                          {res.reservationTime.split(' ')[0]}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-stone-200">{res.guestName}</h4>
                          {getStatusBadge(res.status)}
                          {getArrivalBadge(res.arrivalStatus)}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400 mt-1 font-mono">
                          <span>REF: {res.reservationReference}</span>
                          <span>•</span>
                          <span>{res.guestCount} guests</span>
                          <span>•</span>
                          <span className="text-[#B99A63]">
                            Table: {res.assignedTableName || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {res.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleQuickCheckIn(res.id)}
                          className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono transition"
                        >
                          Check In
                        </button>
                      )}

                      {res.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => handleQuickSeat(res.id)}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono transition"
                        >
                          Seat Guest
                        </button>
                      )}

                      <Link
                        href={`/staff/reception/reservations?search=${res.reservationReference}`}
                        className={`p-1.5 rounded-lg border text-stone-400 hover:text-white transition ${
                          isDark ? 'border-[#2C2C28] bg-[#1E1E1B]' : 'border-[#E5DFD3] bg-white'
                        }`}
                        title="View Dossier"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Waiting List & Table Quick Glance */}
        <div className="space-y-6">
          {/* Waiting List Glance */}
          <div
            className={`border rounded-2xl p-6 transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-serif font-semibold text-[#F6F1E8]">
                Waiting List
              </h3>
              <Link
                href="/staff/reception/waiting-list"
                className="text-xs font-mono text-purple-400 hover:underline"
              >
                Manage ({waitingList.length})
              </Link>
            </div>

            {waitingList.length === 0 ? (
              <div className="py-8 text-center text-stone-500 font-mono text-xs">
                No parties currently on the waitlist.
              </div>
            ) : (
              <div className="space-y-2.5">
                {waitingList.slice(0, 5).map((w) => (
                  <div
                    key={w.id}
                    className={`border rounded-xl p-3 flex items-center justify-between text-xs font-mono ${
                      isDark ? 'bg-[#171715] border-[#282723]' : 'bg-[#FAF8F5] border-[#EDE7DE]'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-stone-200">{w.guestName}</div>
                      <div className="text-[11px] text-stone-400">
                        {w.guestCount} guests • {w.seatingPreference}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-400 font-semibold">{w.waitDurationMinutes}m</div>
                      <div className="text-[10px] text-stone-500">waiting</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table Capacity Glance */}
          <div
            className={`border rounded-2xl p-6 transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-serif font-semibold text-[#F6F1E8]">
                Dining Floor Readiness
              </h3>
              <Link
                href="/staff/reception/tables"
                className="text-xs font-mono text-[#B99A63] hover:underline"
              >
                Full Grid
              </Link>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span>AVAILABLE TABLES</span>
                <span className="font-bold">{metrics?.tableSummary.available ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <span>OCCUPIED / SEATED</span>
                <span className="font-bold">{metrics?.tableSummary.occupied ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <span>RESERVED NEXT 90 MIN</span>
                <span className="font-bold">{metrics?.tableSummary.reserved ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-500/10 border border-stone-500/20 text-stone-400">
                <span>TOTAL CONFIGURED TABLES</span>
                <span className="font-bold">{metrics?.tableSummary.total ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
