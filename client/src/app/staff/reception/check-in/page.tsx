'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import { ReceptionReservationItem } from '../../../../types/reception';
import {
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  Armchair,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  User,
} from 'lucide-react';

export default function ReceptionCheckInTerminalPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';
  const locationId = selectedLocation || 'loc-colombo-main';

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<ReceptionReservationItem[]>([]);
  const [selectedRes, setSelectedRes] = useState<ReceptionReservationItem | null>(null);

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Search candidate reservations
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    try {
      setSearching(true);
      setCheckInSuccess(false);
      setCheckInError(null);
      setSelectedRes(null);

      const params = new URLSearchParams({
        locationId,
        search: query.trim(),
        limit: '10',
      });

      const res = await apiClient<{
        success: boolean;
        data: { reservations: ReceptionReservationItem[] };
      }>(`/reception/reservations?${params.toString()}`);

      if (res?.success) {
        setCandidates(res.data.reservations || []);
        if (res.data.reservations && res.data.reservations.length === 1) {
          setSelectedRes(res.data.reservations[0]);
        }
      }
    } catch (err: any) {
      setCheckInError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleExecuteCheckIn = async () => {
    if (!selectedRes) return;

    try {
      setCheckingIn(true);
      setCheckInError(null);

      const res = await apiClient<{ success: boolean; data: ReceptionReservationItem }>(
        `/reception/reservations/${selectedRes.id}/check-in`,
        { method: 'POST' }
      );

      if (res?.success) {
        setCheckInSuccess(true);
        setSelectedRes(res.data);
      }
    } catch (err: any) {
      setCheckInError(err.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION]}>
      <StaffPageHeader
        title="Guest Check-In Terminal"
        subtitle="Expedited guest welcoming station: scan reference, verify reservation details, and record arrival."
        badge="CHECK-IN DESK"
      />

      <div className="max-w-3xl mx-auto">
        {/* Search Card */}
        <div
          className={`border rounded-2xl p-6 mb-8 transition-colors ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Enter booking reference (e.g. AUR-RES-1234), guest name, or phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl pl-11 pr-4 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
              />
            </div>

            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="px-6 py-3 bg-[#B99A63] hover:bg-[#A88B54] text-[#12141A] font-bold text-xs font-mono rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
              Verify Booking
            </button>
          </form>
        </div>

        {/* Search Results List if multiple */}
        {candidates.length > 1 && !selectedRes && (
          <div
            className={`border rounded-2xl p-6 mb-8 transition-colors ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <h3 className="font-serif text-base font-bold text-stone-200 mb-4">
              Multiple Matches Found ({candidates.length})
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedRes(c)}
                  className={`border rounded-xl p-4 cursor-pointer flex items-center justify-between transition hover:border-[#B99A63] ${
                    isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#FAF8F5] border-[#E5DFD3]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-stone-200">{c.guestName}</div>
                    <div className="text-stone-400 mt-0.5">
                      REF: {c.reservationReference} • {c.guestCount} guests • {c.reservationTime}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-[#B99A63]/15 text-[#C1A87D] font-bold">
                    Select
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Booking Verification Card */}
        {selectedRes && (
          <div
            className={`border rounded-2xl p-6 sm:p-8 transition-colors ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#B99A63]">
                  Reservation Verification
                </span>
                <h3 className="text-2xl font-serif font-bold text-stone-100">
                  {selectedRes.guestName}
                </h3>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-stone-400 block">REFERENCE</span>
                <span className="text-base font-bold text-[#C1A87D]">
                  {selectedRes.reservationReference}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {checkInError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{checkInError}</span>
              </div>
            )}

            {/* Success Message */}
            {checkInSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>
                    Guest successfully checked in at{' '}
                    {new Date(selectedRes.checkedInAt || Date.now()).toLocaleTimeString()}!
                  </span>
                </div>
                <Link
                  href={`/staff/reception/reservations?search=${selectedRes.reservationReference}`}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-emerald-200 transition font-bold"
                >
                  Proceed to Seating
                </Link>
              </div>
            )}

            {/* Verification Checklist */}
            <div
              className={`p-4 rounded-xl border mb-6 font-mono text-xs space-y-2.5 ${
                isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-stone-400">VENUE:</span>
                <span className="text-stone-200 font-bold">{selectedRes.locationName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">SITTING DATE:</span>
                <span className="text-stone-200">{selectedRes.reservationDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">SCHEDULED TIME:</span>
                <span className="text-stone-200 font-bold">{selectedRes.reservationTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">PARTY SIZE:</span>
                <span className="text-[#B99A63] font-bold">{selectedRes.guestCount} Guests</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">ASSIGNED TABLE:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedRes.assignedTableName || selectedRes.tableNumbers?.join(', ') || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-stone-400">CURRENT STATUS:</span>
                <span className="font-bold text-cyan-400">{selectedRes.status}</span>
              </div>
            </div>

            {selectedRes.specialRequests && (
              <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs">
                <span className="font-bold uppercase">Special Requests:</span>{' '}
                {selectedRes.specialRequests}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedRes(null)}
                className="px-4 py-2 text-stone-400 hover:text-white font-mono text-xs"
              >
                Clear Selection
              </button>

              {selectedRes.status === 'CONFIRMED' && !checkInSuccess && (
                <button
                  type="button"
                  onClick={handleExecuteCheckIn}
                  disabled={checkingIn}
                  className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-sm rounded-xl disabled:opacity-50 transition flex items-center gap-2 shadow-lg"
                >
                  {checkingIn ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserCheck size={18} />
                  )}
                  CONFIRM GUEST CHECK-IN
                </button>
              )}

              {selectedRes.status === 'CHECKED_IN' && (
                <div className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Guest is in Foyer / Awaiting Table Escort
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
