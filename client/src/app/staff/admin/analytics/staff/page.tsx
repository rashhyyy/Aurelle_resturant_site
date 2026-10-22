'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IStaffAnalytics, AnalyticsDatePreset } from '../../../../../types/analytics';
import { AnalyticsTabs } from '../../../../../components/admin/analytics/AnalyticsTabs';
import { AnalyticsDateFilter } from '../../../../../components/admin/analytics/AnalyticsDateFilter';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { UserCheck, Users, Sparkles, BellRing, AlertCircle } from 'lucide-react';

export default function StaffAnalyticsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IStaffAnalytics | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/analytics/staff?locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await apiClient<{ success: boolean; data: IStaffAnalytics }>(url);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load staff analytics:', err);
      setError(err?.message || 'Failed to fetch staff operational analytics.');
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
            <span>Staff Efficiency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
            Staff Operations & Floor Responsiveness
          </h1>
          <p className="text-xs text-[#8E8A80] mt-1 font-mono">
            Roster coverage by role, hygiene sanitation velocity, and guest call resolutions
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Active Personnel</span>
            <div className="text-3xl font-serif font-bold text-[#F6F1E8] my-1">
              {data ? data.totalStaffActive : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">Assigned to active location shifts</p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Table Turn Cleaning Rate</span>
            <div className="text-3xl font-serif font-bold text-emerald-400 my-1">
              {data ? `${data.cleaningTasks.completionRate}%` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">
              {data?.cleaningTasks.completed ?? 0} of {data?.cleaningTasks.total ?? 0} sweeps completed
            </p>
          </div>

          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
            <span className="text-xs font-mono text-[#A5A198] uppercase">Guest Request Resolution</span>
            <div className="text-3xl font-serif font-bold text-[#B99A63] my-1">
              {data ? `${data.serviceRequests.resolutionRate}%` : '---'}
            </div>
            <p className="text-[11px] font-mono text-[#8E8A80]">
              {data?.serviceRequests.resolved ?? 0} of {data?.serviceRequests.total ?? 0} calls fulfilled
            </p>
          </div>
        </div>

        {/* Role Breakdown */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
          <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8] mb-4">
            Roster Coverage by Operational Role
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {(data?.byRole || []).map((r) => (
              <div key={r.role} className="p-4 rounded-xl border border-zinc-700/30 bg-black/10 text-center">
                <span className="text-xs font-mono text-[#A5A198] uppercase">{r.role}</span>
                <div className="text-2xl font-serif font-bold text-[#F6F1E8] my-1">{r.count}</div>
                <span className="text-[10px] font-mono text-[#8E8A80]">Staff active</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StaffGuard>
  );
}
