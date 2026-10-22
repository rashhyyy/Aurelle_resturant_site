'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import { TableAvailabilityItem } from '../../../../types/reception';
import {
  Users,
  PlusCircle,
  Armchair,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Phone,
  User,
} from 'lucide-react';

function ReceptionWalkInsContent() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDark = theme === 'dark';
  const locationId = selectedLocation || 'loc-colombo-main';

  const defaultTable = searchParams.get('tableNumber') || '';

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [guestPhone, setGuestPhone] = useState('+94 ');
  const [guestEmail, setGuestEmail] = useState('');
  const [seatingPreference, setSeatingPreference] = useState('No preference');
  const [specialRequests, setSpecialRequests] = useState('');
  const [actionType, setActionType] = useState<'seat' | 'waitlist'>('seat');
  const [selectedTableNumber, setSelectedTableNumber] = useState(defaultTable);

  const [availableTables, setAvailableTables] = useState<TableAvailabilityItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available tables
    apiClient<{ success: boolean; data: TableAvailabilityItem[] }>(
      `/reception/tables/availability?locationId=${locationId}`
    )
      .then((res) => {
        if (res?.success) {
          setAvailableTables(res.data.filter((t) => t.status === 'AVAILABLE'));
        }
      })
      .catch(() => {});
  }, [locationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccessResult(null);

      if (actionType === 'seat') {
        const payload: any = {
          locationId,
          guestName: guestName.trim(),
          guestCount,
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim() || undefined,
          seatingPreference,
          specialRequests: specialRequests.trim() || undefined,
          seatImmediately: true,
        };
        if (selectedTableNumber) {
          payload.tableNumber = selectedTableNumber;
        }

        const res = await apiClient<{ success: boolean; data: any }>(`/reception/walk-ins`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res?.success) {
          setSuccessResult({
            type: 'SEATED',
            reference: res.data.reservationReference,
            guestName: res.data.guestName,
            tableNumbers: res.data.tableNumbers,
            guestCount: res.data.guestCount,
          });
        }
      } else {
        // Add to waiting list
        const res = await apiClient<{ success: boolean; data: any }>(`/reception/waiting-list`, {
          method: 'POST',
          body: JSON.stringify({
            locationId,
            guestName: guestName.trim(),
            guestCount,
            guestPhone: guestPhone.trim(),
            guestEmail: guestEmail.trim() || undefined,
            seatingPreference,
            notes: specialRequests.trim() || undefined,
            estimatedWaitMinutes: 20,
          }),
        });

        if (res?.success) {
          setSuccessResult({
            type: 'WAITLIST',
            guestName: res.data.guestName,
            guestCount: res.data.guestCount,
            estimatedWaitMinutes: res.data.estimatedWaitMinutes,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Walk-in registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setGuestName('');
    setGuestCount(2);
    setGuestPhone('+94 ');
    setGuestEmail('');
    setSpecialRequests('');
    setSelectedTableNumber('');
    setSuccessResult(null);
    setError(null);
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION]}>
      <StaffPageHeader
        title="Walk-In Guest Registration"
        subtitle="Expedited registration for arriving guests without advance reservations. Allocate instant capacity or assign to the waiting list."
        badge="WALK-IN SERVICE"
      />

      <div className="max-w-2xl mx-auto">
        {/* Success Alert */}
        {successResult && (
          <div
            className={`border rounded-2xl p-6 sm:p-8 mb-8 transition-all animate-in fade-in ${
              isDark ? 'bg-[#1E1E1B] border-emerald-500/40' : 'bg-white border-emerald-500/40'
            }`}
          >
            <div className="flex items-center gap-3 text-emerald-400 mb-4">
              <CheckCircle2 size={24} />
              <h3 className="text-xl font-serif font-bold text-stone-100">
                {successResult.type === 'SEATED'
                  ? 'Walk-In Party Seated Successfully'
                  : 'Party Placed on Waiting List'}
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-200 mb-6 space-y-2">
              <div>
                GUEST: <span className="font-bold text-white">{successResult.guestName}</span> ({successResult.guestCount} guests)
              </div>
              {successResult.type === 'SEATED' ? (
                <>
                  <div>
                    ASSIGNED TABLE:{' '}
                    <span className="font-bold text-emerald-400 text-sm">
                      {successResult.tableNumbers?.join(', ') || 'Auto-Allocated'}
                    </span>
                  </div>
                  <div>REFERENCE: {successResult.reference}</div>
                </>
              ) : (
                <div>ESTIMATED WAIT: {successResult.estimatedWaitMinutes} minutes</div>
              )}
            </div>

            <div className="flex gap-3 font-mono text-xs">
              <button
                onClick={resetForm}
                className="px-5 py-2.5 bg-[#B99A63] hover:bg-[#A88B54] text-[#12141A] font-bold rounded-xl transition"
              >
                Register Another Walk-In
              </button>
              <Link
                href="/staff/reception"
                className="px-5 py-2.5 border border-white/10 rounded-xl text-stone-300 hover:text-white transition"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            {error.includes('waiting list') && (
              <button
                onClick={() => setActionType('waitlist')}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition"
              >
                Switch to Waitlist
              </button>
            )}
          </div>
        )}

        {/* Registration Form */}
        {!successResult && (
          <div
            className={`border rounded-2xl p-6 sm:p-8 transition-colors ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dispatch Action Selector */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                  Service Action
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType('seat')}
                    className={`p-3.5 rounded-xl border text-left font-mono text-xs transition flex items-center gap-3 ${
                      actionType === 'seat'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                        : 'border-[#2D3340] bg-[#12141A] text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Armchair size={18} className="text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-stone-100">Seat Immediately</div>
                      <div className="text-[10px] text-stone-400 font-normal">
                        Allocate dining table now
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('waitlist')}
                    className={`p-3.5 rounded-xl border text-left font-mono text-xs transition flex items-center gap-3 ${
                      actionType === 'waitlist'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300 font-bold'
                        : 'border-[#2D3340] bg-[#12141A] text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Clock size={18} className="text-purple-400 shrink-0" />
                    <div>
                      <div className="text-stone-100">Add to Waiting List</div>
                      <div className="text-[10px] text-stone-400 font-normal">
                        Foyer queue registration
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Sterling"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-3 text-xs text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                    Party Size (Guests) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                    className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-3 text-xs text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-3 text-xs text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-3 text-xs text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
                  />
                </div>
              </div>

              {/* Table assignment selector if seating immediately */}
              {actionType === 'seat' && (
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                    Specific Table (Optional — Auto-Allocates if blank)
                  </label>
                  <select
                    value={selectedTableNumber}
                    onChange={(e) => setSelectedTableNumber(e.target.value)}
                    className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-3 text-xs text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
                  >
                    <option value="">-- Best-Fit Available Table (Automatic) --</option>
                    {availableTables.map((t) => (
                      <option
                        key={t.id}
                        value={t.tableNumber}
                        disabled={t.capacity < guestCount}
                      >
                        Table {t.tableNumber} ({t.name}) — Cap: {t.capacity} [
                        {t.section.replace(/_/g, ' ')}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                  Seating Preference
                </label>
                <select
                  value={seatingPreference}
                  onChange={(e) => setSeatingPreference(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-3 text-xs text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
                >
                  <option value="No preference">No preference</option>
                  <option value="Main Dining Room">Main Dining Room</option>
                  <option value="Counter / Chef's View">Counter / Chef&apos;s View</option>
                  <option value="Outdoor Terrace">Outdoor Terrace</option>
                  <option value="Private Dining">Private Dining</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                  Special Notes / Dietary Notices
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Window booth requested, anniversary greeting, gluten allergy..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-[#12141A] border border-[#2D3340] rounded-xl px-4 py-3 text-xs text-stone-200 outline-none focus:border-[#C1A87D] font-mono transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#B99A63] hover:bg-[#A88B54] text-[#12141A] font-bold text-sm font-mono rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <PlusCircle size={18} />
                  )}
                  {actionType === 'seat' ? 'CONFIRM WALK-IN & SEAT GUEST' : 'ADD TO WAITING LIST'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}

export default function ReceptionWalkInsPage() {
  return (
    <Suspense
      fallback={
        <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION]}>
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        </StaffLayout>
      }
    >
      <ReceptionWalkInsContent />
    </Suspense>
  );
}
