'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { apiClient } from '../../../../lib/api';
import { IExecutiveOverview, AnalyticsDatePreset } from '../../../../types/analytics';
import { AnalyticsTabs } from '../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../components/admin/analytics/AnalyticsDateFilter';
import { SimpleTrendChart } from '../../../../components/admin/analytics/SimpleTrendChart';
import { OverviewStatCard } from '../../../../components/admin/OverviewStatCard';
import { StaffGuard } from '../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../types/staff';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Armchair,
  Sparkles,
  Users,
  AlertCircle,
} from 'lucide-react';

export default function ExecutiveAnalyticsOverviewPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IExecutiveOverview | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/overview?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: IExecutiveOverview }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load executive overview:', err);
      setError(err?.message || 'Failed to fetch executive analytics.');
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
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5"
          style={{ borderColor: isDark ? '#2C2C28' : '#E5DFD3' }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#B99A63] mb-1">
              <span>Business Intelligence</span>
              <span>/</span>
              <span>Executive Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Executive Overview
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Live operational metrics for {selectedLocation === 'loc-kandy-vip' ? 'Aurelle Kandy' : 'Aurelle Colombo'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <AnalyticsTabs />

        {/* Date Filter Bar */}
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

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <OverviewStatCard
            title="Gross Revenue"
            value={data ? formatLKR(data.revenue.grossMinor) : null}
            available={!loading}
            description="Total realized receipts from completed dining orders"
            icon={<DollarSign size={18} />}
            badge={data ? `${data.orders.completed} completed` : undefined}
          />
          <OverviewStatCard
            title="Order Velocity"
            value={data ? `${data.orders.total}` : null}
            available={!loading}
            description={`Completion rate: ${data?.orders.completionRate ?? 0}%`}
            icon={<ShoppingBag size={18} />}
            subtext={data ? `Avg Order: ${formatLKR(data.orders.aovMinor)}` : undefined}
          />
          <OverviewStatCard
            title="Table Occupancy"
            value={data ? `${data.tables.utilizationRate}%` : null}
            available={!loading}
            description={`Avg dwell time: ${data?.tables.avgDwellMinutes ?? 0} mins`}
            icon={<Armchair size={18} />}
            badge={data ? `${data.tables.activeSessions} active tables` : undefined}
          />
          <OverviewStatCard
            title="Reservations"
            value={data ? `${data.reservations.total}` : null}
            available={!loading}
            description={`${data?.reservations.totalGuests ?? 0} total guests accommodated`}
            icon={<Calendar size={18} />}
            subtext={data ? `No-show rate: ${data.reservations.noShowRate}%` : undefined}
          />
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono text-[#A5A198]">VIP & Event Banquets</span>
              <Sparkles size={16} className="text-[#B99A63]" />
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-[#F6F1E8]">
              {data ? formatLKR(data.vipEvents.vipRevenueMinor + data.vipEvents.eventRevenueMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80] mt-1">
              {data?.vipEvents.vipBookings ?? 0} VIP suites | {data?.vipEvents.eventBookings ?? 0} Banquets confirmed
            </p>
          </div>

          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono text-[#A5A198]">Staff On Duty</span>
              <Users size={16} className="text-[#B99A63]" />
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-[#F6F1E8]">
              {data ? `${data.staff.activeStaffCount} active` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80] mt-1">
              {data?.staff.cleaningTasksCompleted ?? 0} hygiene sweeps | {data?.staff.serviceRequestsResolved ?? 0} service calls
            </p>
          </div>

          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono text-[#A5A198]">Tax & Service Surcharge</span>
              <TrendingUp size={16} className="text-[#B99A63]" />
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-[#F6F1E8]">
              {data ? formatLKR(data.revenue.taxMinor + data.revenue.serviceChargeMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80] mt-1">
              Govt Tax: {data ? formatLKR(data.revenue.taxMinor) : '0'} | Service: {data ? formatLKR(data.revenue.serviceChargeMinor) : '0'}
            </p>
          </div>
        </div>

        {/* Daily Revenue Trend Chart */}
        <div className="space-y-4">
          <SimpleTrendChart
            data={(data?.trend || []).map((t) => ({
              label: t.date.slice(5),
              value: t.revenueMinor / 100,
            }))}
            title="Daily Realized Gross Revenue (LKR)"
            subtitle="Authoritative completed dining and online sales telemetry"
            type="line"
            formatValue={(v) => `Rs. ${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            height={240}
          />
        </div>
      </div>
    </StaffGuard>
  );
}
