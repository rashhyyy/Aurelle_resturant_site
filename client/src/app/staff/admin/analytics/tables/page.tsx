'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { ITableAnalytics, AnalyticsDatePreset } from '../../../../../types/analytics';
import { AnalyticsTabs } from '../../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../../components/admin/analytics/AnalyticsDateFilter';
import { SimpleTrendChart } from '../../../../../components/admin/analytics/SimpleTrendChart';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { Armchair, Clock, RotateCcw, AlertCircle } from 'lucide-react';

export default function TableUtilizationPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ITableAnalytics | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/tables?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: ITableAnalytics }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load table analytics:', err);
      setError(err?.message || 'Failed to fetch table utilization telemetry.');
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
            <span>Floor Dynamics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
            Table Occupancy & Dwell Duration
          </h1>
          <p className="text-xs text-[#8E8A80] mt-1 font-mono">
            Dining session duration, turnover velocity, and peak seating telemetry
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
            <span className="text-xs font-mono text-[#A5A198] uppercase">Total Dining Tables</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? data.totalTables : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Configured dining inventory</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Dining Sessions</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? data.totalDiningSessions : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Seated customer service cycles</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Avg Dwell Time</span>
            <div className="text-3xl font-serif font-bold text-[#B99A63] my-1">
              {data ? `${data.averageDwellMinutes}m` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">From seating to check settlement</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Turnover Rate</span>
            <div className="text-3xl font-serif font-bold text-[#B99A63] my-1">
              {data ? `${data.turnoverRatePerDay}x` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Daily turnovers per table</p>
          </div>
        </div>

        {/* Peak Hour Occupancy */}
        <SimpleTrendChart
          data={(data?.peakHourOccupancy || []).map((h) => ({
            label: `${h.hour}:00`,
            value: h.occupiedTables,
          }))}
          title="Concurrent Seated Tables by Hour"
          subtitle="Peak capacity load across dining salon and terrace"
          type="bar"
          height={220}
        />
      </div>
    </StaffGuard>
  );
}
