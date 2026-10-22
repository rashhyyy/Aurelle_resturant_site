'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { ISalesAnalytics, AnalyticsDatePreset } from '../../../../../types/analytics';
import { AnalyticsTabs } from '../../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../../components/admin/analytics/AnalyticsDateFilter';
import { SimpleTrendChart } from '../../../../../components/admin/analytics/SimpleTrendChart';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { DollarSign, CreditCard, ShoppingBag, AlertCircle } from 'lucide-react';

export default function SalesAnalyticsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ISalesAnalytics | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/sales?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: ISalesAnalytics }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load sales analytics:', err);
      setError(err?.message || 'Failed to fetch sales analytics.');
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
            <span>Revenue Audits</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
            Sales & Financial Realization
          </h1>
          <p className="text-xs text-[#8E8A80] mt-1 font-mono">
            Granular breakdown of net income, taxes, and service surcharges
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

        {/* Financial Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Gross Revenue</span>
            <div className="text-2xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? formatLKR(data.totalGrossMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.orderCount ?? 0} settled transactions</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Net Food & Beverage</span>
            <div className="text-2xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? formatLKR(data.totalNetMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Before tax and service fees</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Service Charge (10%)</span>
            <div className="text-2xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? formatLKR(data.totalServiceChargeMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Allocated for staff distribution</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Average Order Value</span>
            <div className="text-2xl font-serif font-bold text-[#B99A63] my-1">
              {data ? formatLKR(data.averageOrderValueMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Spend velocity per dining check</p>
          </div>
        </div>

        {/* Breakdown by Order Type */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
          <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8] mb-4">
            Revenue Share by Dining Channel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data?.byOrderType || []).map((t) => (
              <div key={t.orderType} className="p-4 rounded-xl border border-zinc-700/30 bg-black/10">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#A5A198]">{t.orderType.replace('_', ' ')}</span>
                  <span className="text-[#B99A63] font-bold">{t.percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
                  <div className="h-full bg-[#B99A63]" style={{ width: `${t.percentage}%` }} />
                </div>
                <div className="flex justify-between items-center text-xs font-mono text-[#D0CBC0]">
                  <span>{formatLKR(t.revenueMinor)}</span>
                  <span>{t.count} orders</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Distribution Histogram */}
        <SimpleTrendChart
          data={(data?.hourlyDistribution || []).map((h) => ({
            label: `${h.hour}:00`,
            value: h.revenueMinor / 100,
          }))}
          title="Revenue Velocity by Hour of Day"
          subtitle="Identifies peak service waves and kitchen surges"
          type="bar"
          formatValue={(v) => `Rs. ${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          height={220}
        />

        {/* Daily Breakdown Table */}
        <div className={`p-6 rounded-2xl border overflow-hidden ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
          <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8] mb-4">
            Daily Financial Ledger
          </h3>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-700/40 text-[#A5A198] uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Orders</th>
                  <th className="py-2.5 px-3">Net Sales</th>
                  <th className="py-2.5 px-3">Service Fee</th>
                  <th className="py-2.5 px-3">Govt Tax</th>
                  <th className="py-2.5 px-3">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-[#D0CBC0]">
                {(data?.dailyBreakdown || []).slice(0, 15).map((row) => (
                  <tr key={row.date} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 text-[#F6F1E8] font-semibold">{row.date}</td>
                    <td className="py-2.5 px-3">{row.orders}</td>
                    <td className="py-2.5 px-3">{formatLKR(row.netMinor)}</td>
                    <td className="py-2.5 px-3">{formatLKR(row.serviceChargeMinor)}</td>
                    <td className="py-2.5 px-3">{formatLKR(row.taxMinor)}</td>
                    <td className="py-2.5 px-3 text-[#B99A63] font-semibold">{formatLKR(row.grossMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StaffGuard>
  );
}
