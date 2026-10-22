'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IMenuAnalytics, AnalyticsDatePreset } from '../../../../../types/analytics';
import { AnalyticsTabs } from '../../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../../components/admin/analytics/AnalyticsDateFilter';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { UtensilsCrossed, Award, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

export default function MenuAnalyticsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IMenuAnalytics | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/menu?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: IMenuAnalytics }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load menu analytics:', err);
      setError(err?.message || 'Failed to fetch menu analytics.');
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
            <span>Gastronomy Performance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
            Menu Intelligence & Item Velocity
          </h1>
          <p className="text-xs text-[#8E8A80] mt-1 font-mono">
            Authoritative sales volume, margin performance, and course contribution analysis
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

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Total Portions Served</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? data.totalDishesSold.toLocaleString() : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Individual culinary plates prepared</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Menu Gross Contribution</span>
            <div className="text-3xl font-serif font-bold text-[#B99A63] my-1">
              {data ? formatLKR(data.totalMenuRevenueMinor) : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Aggregated food & beverage line receipts</p>
          </div>
        </div>

        {/* Top Best Sellers Table */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-[#B99A63]" size={18} />
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8]">
              Top 10 Signature Dishes (By Realized Revenue)
            </h3>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-700/40 text-[#A5A198] uppercase">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Culinary Item</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Portions</th>
                  <th className="py-2.5 px-3">Total Gross</th>
                  <th className="py-2.5 px-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-[#D0CBC0]">
                {(data?.topSellingDishes || []).map((dish, i) => (
                  <tr key={dish.id || i} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#B99A63]">{i + 1}</td>
                    <td className="py-2.5 px-3 text-[#F6F1E8] font-medium">{dish.name}</td>
                    <td className="py-2.5 px-3">{formatLKR(dish.priceMinor)}</td>
                    <td className="py-2.5 px-3 font-semibold">{dish.quantitySold}</td>
                    <td className="py-2.5 px-3 text-[#B99A63] font-semibold">{formatLKR(dish.totalRevenueMinor)}</td>
                    <td className="py-2.5 px-3">{dish.portionOfSales}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Least Selling Dishes */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="text-amber-500" size={18} />
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8]">
              Low Velocity Dishes (Menu Optimization Candidates)
            </h3>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-700/40 text-[#A5A198] uppercase">
                  <th className="py-2.5 px-3">Dish Name</th>
                  <th className="py-2.5 px-3">Portions Sold</th>
                  <th className="py-2.5 px-3">Realized Revenue</th>
                  <th className="py-2.5 px-3">Share of Menu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-[#D0CBC0]">
                {(data?.leastSellingDishes || []).map((dish, idx) => (
                  <tr key={dish.id || idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 text-[#F6F1E8]">{dish.name}</td>
                    <td className="py-2.5 px-3">{dish.quantitySold}</td>
                    <td className="py-2.5 px-3">{formatLKR(dish.totalRevenueMinor)}</td>
                    <td className="py-2.5 px-3">{dish.portionOfSales}%</td>
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
