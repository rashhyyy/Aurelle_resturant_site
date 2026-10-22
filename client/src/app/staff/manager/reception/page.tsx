'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  UserCheck,
  Clock,
  Users,
  AlertTriangle,
  Armchair,
  CheckCircle2,
  Calendar,
  Phone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ReceptionData {
  locationId: string;
  counts: {
    expectedArrivals: number;
    checkedIn: number;
    seated: number;
    waiting: number;
    noShows: number;
  };
  expectedArrivals: any[];
  checkedInGuests: any[];
  seatedGuests: any[];
  waitingParties: Array<{
    id: string;
    guestName: string;
    guestCount: number;
    guestPhone: string;
    seatingPreference?: string;
    createdAt: string;
    elapsedWaitMinutes: number;
    isDelayed: boolean;
  }>;
  noShows: any[];
}

export default function ManagerReceptionPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const [data, setData] = useState<ReceptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'expected' | 'waiting' | 'checkedIn' | 'seated' | 'noShows'>(
    'expected'
  );

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchReception = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await apiClient<{ success: boolean; data: ReceptionData }>(
          `/manager/reception?locationId=${locationId}`
        );
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        console.error('Failed to load reception overview:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId]
  );

  useEffect(() => {
    fetchReception();
  }, [fetchReception]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchReception();
    socket.on('guest:checked_in', handleUpdate);
    socket.on('guest:seated', handleUpdate);
    socket.on('reservation:status_changed', handleUpdate);
    socket.on('reception:waiting_list_updated', handleUpdate);
    return () => {
      socket.off('guest:checked_in', handleUpdate);
      socket.off('guest:seated', handleUpdate);
      socket.off('reservation:status_changed', handleUpdate);
      socket.off('reception:waiting_list_updated', handleUpdate);
    };
  }, [socket, fetchReception]);

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Reception Operations"
        description="Monitor guest arrivals, front-of-house check-in queues, walk-in waiting parties, and table allocations."
        onRefresh={() => fetchReception(true)}
        refreshing={refreshing}
      />

      {/* Overview Metric Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 font-mono text-xs">
          <button
            onClick={() => setActiveTab('expected')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'expected'
                ? 'border-[#B99A63] bg-[#B99A63]/10'
                : 'border-[#2A2925] bg-[#141412] hover:bg-[#1A1916]'
            }`}
          >
            <div className="text-stone-400 text-[11px] uppercase">Expected Arrivals</div>
            <div className="text-2xl font-serif text-[#F6F1E8] font-semibold mt-1">
              {data.counts.expectedArrivals}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('waiting')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'waiting'
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-[#2A2925] bg-[#141412] hover:bg-[#1A1916]'
            }`}
          >
            <div className="text-amber-400 text-[11px] uppercase flex items-center gap-1">
              <span>Waiting List</span>
              {data.waitingParties.some((w) => w.isDelayed) && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <div className="text-2xl font-serif text-amber-400 font-semibold mt-1">
              {data.counts.waiting}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('checkedIn')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'checkedIn'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-[#2A2925] bg-[#141412] hover:bg-[#1A1916]'
            }`}
          >
            <div className="text-purple-400 text-[11px] uppercase">Checked In</div>
            <div className="text-2xl font-serif text-purple-400 font-semibold mt-1">
              {data.counts.checkedIn}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('seated')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'seated'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-[#2A2925] bg-[#141412] hover:bg-[#1A1916]'
            }`}
          >
            <div className="text-emerald-400 text-[11px] uppercase">Seated Today</div>
            <div className="text-2xl font-serif text-emerald-400 font-semibold mt-1">
              {data.counts.seated}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('noShows')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === 'noShows'
                ? 'border-rose-500 bg-rose-500/10'
                : 'border-[#2A2925] bg-[#141412] hover:bg-[#1A1916]'
            }`}
          >
            <div className="text-rose-400 text-[11px] uppercase">No-Shows</div>
            <div className="text-2xl font-serif text-rose-400 font-semibold mt-1">
              {data.counts.noShows}
            </div>
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        {loading && !data ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading reception manifests...
          </div>
        ) : data ? (
          <div>
            {/* Header for Active Tab */}
            <div className="p-4 border-b border-[#2A2925] flex items-center justify-between bg-[#1C1B17]/40">
              <h3 className="font-serif text-base text-[#F6F1E8]">
                {activeTab === 'expected' && "Today's Expected Arrivals"}
                {activeTab === 'waiting' && 'Walk-In Waiting Parties'}
                {activeTab === 'checkedIn' && 'Checked-In Parties Awaiting Seating'}
                {activeTab === 'seated' && 'Currently Seated Parties'}
                {activeTab === 'noShows' && 'Recorded No-Shows'}
              </h3>
              <Link
                href="/staff/reception"
                className="text-xs font-mono text-[#B99A63] hover:underline flex items-center gap-1"
              >
                <span>Launch Reception Dashboard</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* TAB 1: EXPECTED ARRIVALS */}
            {activeTab === 'expected' && (
              <div className="divide-y divide-[#2A2925]">
                {data.expectedArrivals.length === 0 ? (
                  <div className="text-center py-16 text-stone-500 font-mono text-sm">
                    No remaining expected arrivals for today.
                  </div>
                ) : (
                  data.expectedArrivals.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-[#1C1B17]/50">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-base text-[#F6F1E8] font-medium">{r.guestName}</span>
                          <span className="font-mono text-xs text-stone-400">#{r.reservationReference}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400">
                            {r.status}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-stone-400 mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users size={12} className="text-[#B99A63]" /> {r.guestCount} Guests
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />{' '}
                            {new Date(r.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>
                            {r.tableNumbers && r.tableNumbers.length > 0
                              ? `Table ${r.tableNumbers.join(', ')}`
                              : 'Table Unassigned'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-stone-400">{r.guestPhone}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: WAITING PARTIES */}
            {activeTab === 'waiting' && (
              <div className="divide-y divide-[#2A2925]">
                {data.waitingParties.length === 0 ? (
                  <div className="text-center py-16 text-stone-500 font-mono text-sm">
                    No walk-in parties currently waiting.
                  </div>
                ) : (
                  data.waitingParties.map((w) => (
                    <div
                      key={w.id}
                      className={`p-4 flex items-center justify-between hover:bg-[#1C1B17]/50 ${
                        w.isDelayed ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-base text-[#F6F1E8] font-medium">{w.guestName}</span>
                          <span className="font-mono text-xs text-[#B99A63]">{w.guestCount} Guests</span>
                          {w.isDelayed && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40">
                              WAITING {w.elapsedWaitMinutes}m (DELAYED)
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-stone-400 mt-1">
                          Preference: {w.seatingPreference || 'Any table'} • Phone: {w.guestPhone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <Clock size={12} className={w.isDelayed ? 'text-rose-400' : 'text-stone-400'} />
                        <span className={w.isDelayed ? 'text-rose-400 font-semibold' : 'text-stone-400'}>
                          {w.elapsedWaitMinutes}m elapsed
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: CHECKED IN GUESTS */}
            {activeTab === 'checkedIn' && (
              <div className="divide-y divide-[#2A2925]">
                {data.checkedInGuests.length === 0 ? (
                  <div className="text-center py-16 text-stone-500 font-mono text-sm">
                    No guests currently checked in waiting for a table.
                  </div>
                ) : (
                  data.checkedInGuests.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-[#1C1B17]/50">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-base text-[#F6F1E8] font-medium">{r.guestName}</span>
                          <span className="font-mono text-xs text-purple-400">CHECKED IN</span>
                        </div>
                        <div className="text-xs font-mono text-stone-400 mt-1">
                          Party of {r.guestCount} • Table {r.tableNumbers?.join(', ') || 'Pending'}
                        </div>
                      </div>
                      <div className="font-mono text-xs text-stone-400">
                        Arrival: {new Date(r.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: SEATED GUESTS */}
            {activeTab === 'seated' && (
              <div className="divide-y divide-[#2A2925]">
                {data.seatedGuests.length === 0 ? (
                  <div className="text-center py-16 text-stone-500 font-mono text-sm">
                    No parties currently seated.
                  </div>
                ) : (
                  data.seatedGuests.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-[#1C1B17]/50">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-base text-[#F6F1E8] font-medium">{r.guestName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-semibold">
                            SEATED
                          </span>
                        </div>
                        <div className="text-xs font-mono text-stone-400 mt-1">
                          Table {r.tableNumbers?.join(', ')} • {r.guestCount} Guests
                        </div>
                      </div>
                      <div className="font-mono text-xs text-emerald-400">In Dining Room</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: NO SHOWS */}
            {activeTab === 'noShows' && (
              <div className="divide-y divide-[#2A2925]">
                {data.noShows.length === 0 ? (
                  <div className="text-center py-16 text-stone-500 font-mono text-sm">
                    No recorded no-shows for today.
                  </div>
                ) : (
                  data.noShows.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-[#1C1B17]/50">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-base text-stone-400 font-medium">{r.guestName}</span>
                          <span className="font-mono text-xs text-stone-500">#{r.reservationReference}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-400">
                            NO SHOW
                          </span>
                        </div>
                        <div className="text-xs font-mono text-stone-500 mt-1">
                          Was booked for {r.guestCount} guests at{' '}
                          {new Date(r.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-stone-500">{r.guestPhone}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </StaffLayout>
  );
}
