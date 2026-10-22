'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { SettingsTabs } from '../../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { History, Shield, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetStaffName?: string;
  action: string;
  details: string;
  locationId?: string;
  locationName?: string;
  ipAddress?: string;
  createdAt: string;
}

export default function SystemActivityLogPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const locationId = selectedLocation || staff?.locationIds?.[0];

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      let url = `/settings/activity?page=${page}&limit=20`;
      if (locationId) url += `&locationId=${locationId}`;
      const res = await apiClient<{ success: boolean; data: { logs: AuditLogItem[]; total: number; page: number; totalPages: number } }>(url);
      if (res && res.data) {
        setLogs(res.data.logs);
        setTotalPages(res.data.totalPages);
        setTotalLogs(res.data.total);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load system activity logs.');
    } finally {
      setLoading(false);
    }
  }, [page, locationId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.actorName.toLowerCase().includes(term) ||
      l.details.toLowerCase().includes(term)
    );
  });

  return (
    <StaffGuard allowedRoles={[StaffRole.ADMIN]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5"
          style={{ borderColor: isDark ? '#2C2C28' : '#E5DFD3' }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#B99A63] mb-1">
              <span>Settings</span>
              <span>/</span>
              <span>System Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Audit Activity History
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Immutable ledger of administrative actions, policy updates, and operational changes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#A5A198]">{totalLogs} events recorded</span>
            <button
              onClick={loadLogs}
              disabled={loading}
              className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                isDark ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#D0CBC0]' : 'bg-white border-[#E5DFD3]'
              }`}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#B99A63]' : ''} />
            </button>
          </div>
        </div>

        <SettingsTabs />

        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8A80]" />
            <input
              type="text"
              placeholder="Search actions, actors, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-zinc-700 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[#A5A198]">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-zinc-700 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className={`p-6 rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-700/40 text-[#A5A198] uppercase">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-[#D0CBC0]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8E8A80]">
                      Loading audit activity trail...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#737068]">
                      No audit events matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-[#A5A198] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-[#F6F1E8] font-semibold">
                        {log.actorName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#B99A63]/15 text-[#B99A63] text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-[#F6F1E8]" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 text-[#8E8A80]">
                        {log.locationName || log.locationId || 'Global'}
                      </td>
                      <td className="py-2.5 px-3 text-[#737068]">
                        {log.ipAddress || 'Internal'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StaffGuard>
  );
}
