'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IKitchenAnalytics, AnalyticsDatePreset } from '../../../../../types/analytics';
import { AnalyticsTabs } from '../../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../../components/admin/analytics/AnalyticsDateFilter';
import { SimpleTrendChart } from '../../../../../components/admin/analytics/SimpleTrendChart';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { ChefHat, Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function KitchenAnalyticsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IKitchenAnalytics | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/kitchen?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: IKitchenAnalytics }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load kitchen analytics:', err);
      setError(err?.message || 'Failed to fetch kitchen analytics.');
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
            <span>Kitchen Performance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
            Kitchen Station & Ticket Telemetry
          </h1>
          <p className="text-xs text-[#8E8A80] mt-1 font-mono">
            Preparation duration benchmarks, rush-hour throughput, and delay monitoring
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
            <span className="text-xs font-mono text-[#A5A198] uppercase">Total Tickets</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? data.totalTickets : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">{data?.completedTickets ?? 0} dispatched plates</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Avg Plating Time</span>
            <div className="text-3xl font-serif font-bold text-[#B99A63] my-1">
              {data ? `${data.averagePrepMinutes}m` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">From fire to ready pass</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Rapid Prep (&le; 20m)</span>
            <div className="text-3xl font-serif font-bold text-emerald-400 my-1">
              {data ? data.ordersUnder20Mins : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Swift course handoffs</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Extended (&gt; 40m)</span>
            <div className="text-3xl font-serif font-bold text-amber-400 my-1">
              {data ? data.ordersOver40Mins : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Complex tasting menus or delays</p>
          </div>
        </div>

        {/* Hourly Kitchen Throughput */}
        <SimpleTrendChart
          data={(data?.hourlyThroughput || []).map((h) => ({
            label: `${h.hour}:00`,
            value: h.completed,
          }))}
          title="Hourly Completed Ticket Throughput"
          subtitle="Dish dispatches per service window"
          type="bar"
          height={220}
        />

        {/* Station Breakdown */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
          <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8] mb-4">
            Station & Order Channel Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data?.stationLoad || []).map((s) => (
              <div key={s.type} className="p-4 rounded-xl border border-zinc-700/30 bg-black/10">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-[#F6F1E8] font-semibold">{s.type.replace('_', ' ')}</span>
                  <span className="text-[#B99A63] font-bold">{s.avgMinutes} mins avg</span>
                </div>
                <p className="text-[11px] font-mono text-[#8E8A80] mt-1">{s.count} total tickets</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StaffGuard>
  );
}
