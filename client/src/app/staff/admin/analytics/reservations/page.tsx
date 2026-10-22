'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IReservationAnalytics, AnalyticsDatePreset } from '../../../../../types/analytics';
import { AnalyticsTabs } from '../../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../../components/admin/analytics/AnalyticsDateFilter';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { Calendar, Users, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

export default function ReservationAnalyticsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IReservationAnalytics | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/reservations?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: IReservationAnalytics }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load reservation analytics:', err);
      setError(err?.message || 'Failed to fetch reservation analytics.');
    } finally {
      setLoading(false);
    }
  }, [locationId, preset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <StaffGuard allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#B99A63] mb-1">
            <span>Business Intelligence</span>
            <span>/</span>
            <span>Table Booking Trends</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
            Reservation & Guest Demand Telemetry
          </h1>
          <p className="text-xs text-[#8E8A80] mt-1 font-mono">
            Booking volumes, party distribution, peak seating hours, and guest reliability metrics
          </p>
        </div>

        <AnalyticsTabs />

        <AnalyticsDateFilter
          preset={preset}
          onPresetChange={(newPreset, start, end) => {
            setPreset(newPreset);
            setCustomStart(start);
            setCustomEnd(end);
          }}
          onRefresh={fetchData}
          isLoading={loading}
        />

        {error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Total Bookings</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? data.totalBookings : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.seatedBookings ?? 0} seated & served</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Average Party Size</span>
            <div className="text-3xl font-serif font-bold text-[#B99A63] my-1">
              {data ? `${data.averagePartySize} guests` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Mean cover count per table</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">No-Show Rate</span>
            <div className="text-3xl font-serif font-bold text-amber-400 my-1">
              {data ? `${data.noShowRate}%` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.noShowBookings ?? 0} unfulfilled tables</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Cancellation Rate</span>
            <div className="text-3xl font-serif font-bold text-red-400 my-1">
              {data ? `${data.cancellationRate}%` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.cancelledBookings ?? 0} cancelled bookings</p>
          </div>
        </div>

        {/* Party Size Distribution & Peak Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8] mb-4">
              Party Size Breakdown
            </h3>
            <div className="space-y-3">
              {(data?.partySizeDistribution || []).map((p) => (
                <div key={p.bucket} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#D0CBC0]">{p.bucket}</span>
                    <span className="text-[#B99A63] font-bold">{p.count} reservations ({p.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-[#B99A63]" style={{ width: `${p.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8] mb-4">
              Prime Dining Timeslots
            </h3>
            <div className="space-y-2.5">
              {(data?.peakTimeSlots || []).map((slot) => (
                <div key={slot.timeSlot} className="flex items-center justify-between text-xs font-mono border-b border-zinc-800/40 pb-2">
                  <div className="flex items-center gap-2 text-[#F6F1E8]">
                    <Clock size={13} className="text-[#B99A63]" />
                    <span>{slot.timeSlot}</span>
                  </div>
                  <span className="text-[#B99A63] font-bold">{slot.count} guest seatings</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StaffGuard>
  );
}
