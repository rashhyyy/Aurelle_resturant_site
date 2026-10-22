'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import { ManagerReportData } from '../../../../types/manager';
import {
  TrendingUp,
  Download,
  Calendar,
  Clock,
  ShoppingBag,
  Users,
  Armchair,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export default function ManagerReportsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [data, setData] = useState<ManagerReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  const fetchReport = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          locationId,
          dateRange,
          ...(dateRange === 'custom' ? { startDate, endDate } : {}),
        });

        const res = await apiClient<{ success: boolean; data: ManagerReportData }>(
          `/manager/reports?${queryParams.toString()}`
        );

        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        console.error('Failed to generate report:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId, dateRange, startDate, endDate]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const queryParams = new URLSearchParams({
        locationId,
        dateRange,
        ...(dateRange === 'custom' ? { startDate, endDate } : {}),
      });

      // Fetch CSV blob
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/manager/reports/export?${queryParams.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download report CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurelle-operational-report-${locationId}-${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || 'Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Daily Operational Reports"
        description="Comprehensive daily performance summaries, financial totals, table turnover rates, and operational throughput."
        onRefresh={() => fetchReport(true)}
        refreshing={refreshing}
        actions={
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B99A63] hover:bg-[#A38652] text-black font-semibold text-xs font-mono transition-all shadow-md disabled:opacity-50"
          >
            {exporting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Export CSV</span>
              </>
            )}
          </button>
        }
      />

      {/* Date Range Selector */}
      <div
        className={`p-4 rounded-xl border mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {(['today', 'yesterday', '7days', 'custom'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all capitalize ${
                dateRange === range
                  ? 'bg-[#B99A63] text-black font-semibold'
                  : 'bg-[#1C1B17] text-stone-400 hover:text-[#F6F1E8] border border-[#2A2925]'
              }`}
            >
              {range === '7days' ? 'Last 7 Days' : range}
            </button>
          ))}

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400 ml-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#1C1B17] border border-[#2A2925] px-2.5 py-1 rounded text-[#F6F1E8] focus:outline-none"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#1C1B17] border border-[#2A2925] px-2.5 py-1 rounded text-[#F6F1E8] focus:outline-none"
              />
            </div>
          )}
        </div>

        {data && (
          <div className="text-xs font-mono text-stone-500">
            Period: {new Date(data.periodStart).toLocaleDateString()} —{' '}
            {new Date(data.periodEnd).toLocaleDateString()}
          </div>
        )}
      </div>

      {loading && !data ? (
        <div className="py-20 text-center text-stone-500 font-mono text-sm">
          <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Aggregating operational reports...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className={`p-5 rounded-xl border ${
                isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                  Total Orders
                </span>
                <ShoppingBag size={16} />
              </div>
              <div className="text-2xl font-serif font-bold text-[#F6F1E8]">
                {data.metrics.totalOrders}
              </div>
              <div className="text-xs font-mono text-stone-500 mt-1">
                {data.metrics.completedOrders} completed • {data.metrics.cancelledOrders} cancelled
              </div>
            </div>

            <div
              className={`p-5 rounded-xl border ${
                isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-[#B99A63] mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                  Completed Revenue
                </span>
                <span className="text-xs font-mono">{data.metrics.currency}</span>
              </div>
              <div className="text-2xl font-serif font-bold text-[#B99A63]">
                {(data.metrics.totalRevenueMinor / 100).toLocaleString('en-US', {
                  style: 'currency',
                  currency: data.metrics.currency,
                })}
              </div>
              <div className="text-xs font-mono text-stone-500 mt-1">
                Verified settled transactions
              </div>
            </div>

            <div
              className={`p-5 rounded-xl border ${
                isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-blue-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                  Reservations & Dining
                </span>
                <Calendar size={16} />
              </div>
              <div className="text-2xl font-serif font-bold text-blue-400">
                {data.metrics.totalReservations}
              </div>
              <div className="text-xs font-mono text-stone-500 mt-1">
                {data.metrics.completedDiningSessions} dining turns • {data.metrics.noShows} no-shows
              </div>
            </div>

            <div
              className={`p-5 rounded-xl border ${
                isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                  Average Turn Time
                </span>
                <Clock size={16} />
              </div>
              <div className="text-2xl font-serif font-bold text-emerald-400">
                {data.metrics.tableTurnoverTimeMinutes}m
              </div>
              <div className="text-xs font-mono text-stone-500 mt-1">
                Kitchen prep avg: {data.metrics.averagePrepTimeMinutes}m
              </div>
            </div>
          </div>

          {/* Secondary KPIs Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-[#141412] border border-[#2A2925]">
              <div className="text-stone-400 uppercase text-[10px]">VIP Salons Booked</div>
              <div className="text-xl font-serif font-bold text-[#F6F1E8] mt-1">
                {data.metrics.vipBookings}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141412] border border-[#2A2925]">
              <div className="text-stone-400 uppercase text-[10px]">Event Inquiries</div>
              <div className="text-xl font-serif font-bold text-[#F6F1E8] mt-1">
                {data.metrics.eventInquiries}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141412] border border-[#2A2925]">
              <div className="text-stone-400 uppercase text-[10px]">Service Calls Resolved</div>
              <div className="text-xl font-serif font-bold text-emerald-400 mt-1">
                {data.metrics.serviceRequestsResolved}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141412] border border-[#2A2925]">
              <div className="text-stone-400 uppercase text-[10px]">Operational Alerts</div>
              <div className="text-xl font-serif font-bold text-amber-400 mt-1">
                {data.metrics.alertsResolved} / {data.metrics.alertsTriggered}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Resolved / Triggered</div>
            </div>
          </div>

          {/* Daily Breakdown Table */}
          <div
            className={`p-6 rounded-xl border ${
              isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg text-[#F6F1E8]">Daily Operational Breakdown</h3>
                <p className="text-xs text-[#A5A198]">Throughput metrics by calendar day</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead>
                  <tr className="border-b border-[#2A2925] text-xs text-[#A5A198] uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Orders</th>
                    <th className="py-2.5 px-3">Completed Revenue</th>
                    <th className="py-2.5 px-3">Reservations</th>
                    <th className="py-2.5 px-3">Dining Turns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2925] text-xs">
                  {data.dailyBreakdown.map((day) => (
                    <tr key={day.date} className="hover:bg-[#1C1B17]/60">
                      <td className="py-3 px-3 font-semibold text-[#F6F1E8]">{day.date}</td>
                      <td className="py-3 px-3 text-stone-300">{day.orders}</td>
                      <td className="py-3 px-3 text-[#B99A63]">
                        {(day.revenueMinor / 100).toLocaleString('en-US', {
                          style: 'currency',
                          currency: data.metrics.currency,
                        })}
                      </td>
                      <td className="py-3 px-3 text-blue-400">{day.reservations}</td>
                      <td className="py-3 px-3 text-emerald-400">{day.diningSessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </StaffLayout>
  );
}
