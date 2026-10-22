'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { apiClient } from '../../../../lib/api';
import { AnalyticsDatePreset } from '../../../../types/analytics';
import { AnalyticsDateFilter } from '../../../../components/admin/analytics/AnalyticsDateFilter';
import { StaffGuard } from '../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../types/staff';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  UtensilsCrossed,
  ChefHat,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

type ReportType = 'sales' | 'orders' | 'menu' | 'kitchen' | 'reservations' | 'vip-events' | 'activity';

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
}

export default function AdminReportsExportPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  const [preset, setPreset] = useState<AnalyticsDatePreset>('last30days');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [downloading, setDownloading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const REPORT_OPTIONS: ReportOption[] = [
    {
      id: 'sales',
      title: 'Sales & Revenue Ledger',
      description: 'Granular order receipts, item subtotals, tax breakdown, and service charges.',
      icon: DollarSign,
    },
    {
      id: 'orders',
      title: 'Order History & Statuses',
      description: 'Complete order log with guest contact, fulfillment channel, and dispatch timestamps.',
      icon: ShoppingBag,
    },
    {
      id: 'menu',
      title: 'Menu Velocity & Dish Margins',
      description: 'Volume sold, price realization, and contribution share by dish and category.',
      icon: UtensilsCrossed,
    },
    {
      id: 'kitchen',
      title: 'Kitchen Dispatch & Prep Times',
      description: 'Cooking durations, station load, turnaround averages, and delayed order audits.',
      icon: ChefHat,
    },
    {
      id: 'reservations',
      title: 'Guest Reservations & Attendance',
      description: 'Table bookings, guest party sizes, seating records, cancellations, and no-shows.',
      icon: Calendar,
    },
    {
      id: 'vip-events',
      title: 'VIP Rooms & Private Banquets',
      description: 'Salon reservations, private event inquiries, proposal status, and contract revenue.',
      icon: Sparkles,
    },
    {
      id: 'activity',
      title: 'System Governance & Audit Trail',
      description: 'Immutable record of staff actions, administrative policy changes, and security events.',
      icon: ShieldAlert,
    },
  ];

  // Fetch quick preview data based on selected report
  const fetchPreview = useCallback(async () => {
    try {
      setPreviewLoading(true);
      setError(null);
      let endpoint = '';
      if (selectedReport === 'sales') endpoint = `/analytics/sales?locationId=${locationId}&preset=${preset}`;
      else if (selectedReport === 'orders') endpoint = `/analytics/orders?locationId=${locationId}&preset=${preset}`;
      else if (selectedReport === 'menu') endpoint = `/analytics/menu?locationId=${locationId}&preset=${preset}`;
      else if (selectedReport === 'kitchen') endpoint = `/analytics/kitchen?locationId=${locationId}&preset=${preset}`;
      else if (selectedReport === 'reservations') endpoint = `/analytics/reservations?locationId=${locationId}&preset=${preset}`;
      else if (selectedReport === 'vip-events') endpoint = `/analytics/vip-events?locationId=${locationId}&preset=${preset}`;
      else if (selectedReport === 'activity') endpoint = `/settings/activity?locationId=${locationId}&limit=10`;

      if (preset === 'custom' && customStart && customEnd && selectedReport !== 'activity') {
        endpoint += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const res = await apiClient<{ success: boolean; data: any }>(endpoint);
      if (res && res.data) {
        if (selectedReport === 'sales') setPreviewRows(res.data.dailyBreakdown || []);
        else if (selectedReport === 'menu') setPreviewRows(res.data.topSellingDishes || []);
        else if (selectedReport === 'activity') setPreviewRows(res.data.logs || []);
        else setPreviewRows([res.data]);
      }
    } catch (err: any) {
      console.warn('Failed to load preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedReport, locationId, preset, customStart, customEnd]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      let exportUrl = `${apiUrl}/reports/export?reportType=${selectedReport}&locationId=${locationId}&preset=${preset}`;
      if (preset === 'custom' && customStart && customEnd) {
        exportUrl += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      // Download file via window
      const response = await fetch(exportUrl, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Export failed with HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurelle-${selectedReport}-${locationId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export download failed:', err);
      setError(err?.message || 'Failed to download CSV export.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <StaffGuard allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5"
          style={{ borderColor: isDark ? '#2C2C28' : '#E5DFD3' }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#B99A63] mb-1">
              <span>Business Intelligence</span>
              <span>/</span>
              <span>Executive Data Exports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Reports & Audit Data Export
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Export authoritative CSV logs formatted for executive presentation and financial compliance
            </p>
          </div>

          <button
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#B99A63] hover:bg-[#A88B54] text-black font-medium text-xs font-mono tracking-wider transition-all shadow-md disabled:opacity-50"
          >
            <Download size={16} className={downloading ? 'animate-bounce' : ''} />
            <span>{downloading ? 'Generating CSV...' : 'Download CSV Report'}</span>
          </button>
        </div>

        {/* Date Filter */}
        <AnalyticsDateFilter
          preset={preset}
          onPresetChange={(newPreset, start, end) => {
            setPreset(newPreset);
            setCustomStart(start);
            setCustomEnd(end);
          }}
          onRefresh={fetchPreview}
          isLoading={previewLoading}
        />

        {error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Report Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {REPORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedReport === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedReport(opt.id)}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-[#B99A63] bg-[#B99A63]/10 shadow-sm'
                    : isDark
                    ? 'bg-[#1E1E1B] border-[#2C2C28] hover:border-[#B99A63]/40'
                    : 'bg-white border-[#E5DFD3] hover:border-[#B99A63]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-[#B99A63] text-black' : 'bg-[#B99A63]/15 text-[#B99A63]'
                    }`}>
                      <Icon size={18} />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#B99A63] font-bold">
                        Selected
                      </span>
                    )}
                  </div>
                  <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                  }`}>
                    {opt.title}
                  </h3>
                  <p className="text-[11px] font-mono text-[#8E8A80] mt-2 line-clamp-2">
                    {opt.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-700/20 flex items-center gap-1.5 text-[10px] font-mono text-[#B99A63]">
                  <FileText size={12} />
                  <span>RFC 4180 CSV / Excel Ready</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Preview Panel */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'}`}>
          <div className="flex items-center justify-between mb-4 border-b border-zinc-700/30 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-[#B99A63]" />
              <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8]">
                Report Data Preview: {REPORT_OPTIONS.find((r) => r.id === selectedReport)?.title}
              </h3>
            </div>
            <span className="text-xs font-mono text-[#8E8A80]">
              Location: {selectedLocation === 'loc-kandy-vip' ? 'Aurelle Kandy' : 'Aurelle Colombo'}
            </span>
          </div>

          {previewLoading ? (
            <div className="py-12 text-center text-xs font-mono text-[#8E8A80]">
              Loading report telemetry preview...
            </div>
          ) : previewRows.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#737068]">
              No records in the database matching the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <pre className="text-[11px] font-mono text-[#D0CBC0] bg-black/20 p-4 rounded-xl overflow-x-auto max-h-96">
                {JSON.stringify(previewRows, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </StaffGuard>
  );
}
