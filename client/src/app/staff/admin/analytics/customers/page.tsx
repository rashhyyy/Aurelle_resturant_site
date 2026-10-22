'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { ICustomerAnalytics, AnalyticsDatePreset } from '../../../../../types/analytics';
import { AnalyticsTabs } from '../../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../../components/admin/analytics/AnalyticsDateFilter';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { Users, Crown, HeartHandshake, AlertCircle } from 'lucide-react';

export default function CustomerAnalyticsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ICustomerAnalytics | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/customers?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: ICustomerAnalytics }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load customer analytics:', err);
      setError(err?.message || 'Failed to fetch customer telemetry.');
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
            <span>Patron Loyalty</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
            Customer Retention & Lifetime Spend
          </h1>
          <p className="text-xs text-[#8E8A80] mt-1 font-mono">
            Unique patron retention, repeat dining frequency, and top clientele valuation
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
            <span className="text-xs font-mono text-[#A5A198] uppercase">Total Unique Guests</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? data.totalUniqueCustomers : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Individual dining profiles</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Repeat Patron Rate</span>
            <div className="text-3xl font-serif font-bold text-[#B99A63] my-1">
              {data ? `${data.repeatRate}%` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.repeatCustomers ?? 0} returning clientele</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">New Guests</span>
            <div className="text-3xl font-serif font-bold text-emerald-400 my-1">
              {data ? data.newCustomers : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">First-time reservations/orders</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Returning Guests</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? data.repeatCustomers : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Multiple visits completed</p>
          </div>
        </div>

        {/* Top Spenders Table */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="text-[#B99A63]" size={18} />
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8]">
              Top Clientele by Spend Velocity
            </h3>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-700/40 text-[#A5A198] uppercase">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Patron Name</th>
                  <th className="py-2.5 px-3">Contact Email</th>
                  <th className="py-2.5 px-3">Orders Placed</th>
                  <th className="py-2.5 px-3">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-[#D0CBC0]">
                {(data?.topSpenders || []).map((customer, i) => (
                  <tr key={customer.customerEmail || i} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#B99A63]">{i + 1}</td>
                    <td className="py-2.5 px-3 text-[#F6F1E8] font-medium">{customer.customerName}</td>
                    <td className="py-2.5 px-3 text-[#A5A198]">{customer.customerEmail}</td>
                    <td className="py-2.5 px-3 font-semibold">{customer.orderCount}</td>
                    <td className="py-2.5 px-3 text-[#B99A63] font-semibold">{formatLKR(customer.totalSpendMinor)}</td>
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
