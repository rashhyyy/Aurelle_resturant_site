'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IOrderAnalytics, AnalyticsDatePreset } from '../../../../../types/analytics';
import { AnalyticsTabs } from '../../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../../components/admin/analytics/AnalyticsDateFilter';
import { SimpleTrendChart } from '../../../../../components/admin/analytics/SimpleTrendChart';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { ShoppingBag, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function OrderAnalyticsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IOrderAnalytics | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/orders?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: IOrderAnalytics }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load order analytics:', err);
      setError(err?.message || 'Failed to fetch order analytics.');
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
            <span>Order Velocity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
            Order Throughput & Lifecycle
          </h1>
          <p className="text-xs text-[#8E8A80] mt-1 font-mono">
            Kitchen dispatch turnaround, completion velocity, and order volume distributions
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
            <span className="text-xs font-mono text-[#A5A198] uppercase">Total Orders</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? data.totalOrders : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Submitted across all channels</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Completion Rate</span>
            <div className="text-3xl font-serif font-bold text-[#B99A63] my-1">
              {data ? `${data.completionRate}%` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.completedOrders ?? 0} successfully delivered</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Average Turnaround</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? `${data.averagePrepTimeMinutes}m` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">From kitchen accept to plating ready</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Cancellation Rate</span>
            <div className="text-3xl font-serif font-bold text-red-400 my-1">
              {data ? `${data.cancellationRate}%` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.cancelledOrders ?? 0} voided tickets</p>
          </div>
        </div>

        {/* Peak Hours Histogram */}
        <SimpleTrendChart
          data={(data?.peakHours || []).map((h) => ({
            label: `${h.hour}:00`,
            value: h.orders,
          }))}
          title="Hourly Order Traffic Volume"
          subtitle="Identifies table turnover rushes and dinner service peaks"
          type="bar"
          height={220}
        />

        {/* Status Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8] mb-4">
              Status Allocation
            </h3>
            <div className="space-y-3">
              {(data?.byStatus || []).map((s) => (
                <div key={s.status} className="flex items-center justify-between text-xs font-mono border-b border-zinc-800/40 pb-2">
                  <span className="text-[#D0CBC0]">{s.status}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8E8A80]">{s.count} orders</span>
                    <span className="text-[#B99A63] font-bold w-12 text-right">{s.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8] mb-4">
              Channel Volume Distribution
            </h3>
            <div className="space-y-3">
              {(data?.byType || []).map((t) => (
                <div key={t.type} className="flex items-center justify-between text-xs font-mono border-b border-zinc-800/40 pb-2">
                  <span className="text-[#D0CBC0]">{t.type.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8E8A80]">{t.count} orders</span>
                    <span className="text-[#B99A63] font-bold w-12 text-right">{t.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StaffGuard>
  );
}
