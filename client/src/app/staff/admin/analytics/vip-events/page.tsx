'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IVipEventAnalytics, AnalyticsDatePreset } from '../../../../../types/analytics';
import { AnalyticsTabs } from '../../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../../components/admin/analytics/AnalyticsDateFilter';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { Sparkles, GlassWater, Award, DollarSign, AlertCircle } from 'lucide-react';

export default function VipEventAnalyticsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IVipEventAnalytics | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/vip-events?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: IVipEventAnalytics }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load VIP analytics:', err);
      setError(err?.message || 'Failed to fetch VIP and event analytics.');
    } finally {
      setLoading(false);
    }
  }, [locationId, preset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatLKR = (minor: number) => {
    return `Rs. ${(minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <StaffGuard allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#B99A63] mb-1">
            <span>Business Intelligence</span>
            <span>/</span>
            <span>Private Salons & Banquets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
            VIP Suites & Event Sales Telemetry
          </h1>
          <p className="text-xs text-[#8E8A80] mt-1 font-mono">
            Private dining room utilization, bespoke catering contracts, and conversion pipelines
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
            <span className="text-xs font-mono text-[#A5A198] uppercase">VIP Room Revenue</span>
            <div className="text-2xl font-serif font-bold text-[#B99A63] my-1">
              {data ? formatLKR(data.vipRevenueMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.vipBookingsCount ?? 0} salon suites hosted</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Avg VIP Booking</span>
            <div className="text-2xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? formatLKR(data.averageVipBookingValueMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Per salon reservation value</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Private Banquets</span>
            <div className="text-2xl font-serif font-bold text-[#B99A63] my-1">
              {data ? formatLKR(data.eventRevenueMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.eventBookingsConfirmed ?? 0} confirmed banquets</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Inquiry Conversion</span>
            <div className="text-2xl font-serif font-bold text-emerald-400 my-1">
              {data ? `${data.eventConversionRate}%` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.eventInquiriesCount ?? 0} lead inquiries</p>
          </div>
        </div>

        {/* Funnel Overview */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
          <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8] mb-4">
            Private Event Pipeline Funnel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl border border-zinc-700/30 bg-black/10">
              <span className="text-xs font-mono text-[#A5A198] uppercase">1. Inquiries Received</span>
              <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-2">
                {data?.eventInquiriesCount ?? 0}
              </div>
              <p className="text-[11px] font-mono text-[#8E8A80]">Prospective client outreach</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-700/30 bg-black/10">
              <span className="text-xs font-mono text-[#A5A198] uppercase">2. Proposals Issued</span>
              <div className="text-3xl font-serif font-bold text-[#B99A63] my-2">
                {data?.eventProposalsCount ?? 0}
              </div>
              <p className="text-[11px] font-mono text-[#8E8A80]">Bespoke catering itineraries</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-700/30 bg-black/10">
              <span className="text-xs font-mono text-[#A5A198] uppercase">3. Confirmed Events</span>
              <div className="text-3xl font-serif font-bold text-emerald-400 my-2">
                {data?.eventBookingsConfirmed ?? 0}
              </div>
              <p className="text-[11px] font-mono text-[#8E8A80]">Deposit paid & scheduled</p>
            </div>
          </div>
        </div>
      </div>
    </StaffGuard>
  );
}
