'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  History,
  Search,
  Filter,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  action: string;
  details: string;
  targetStaffName?: string;
  locationId?: string;
}

export default function ManagerActivityPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchActivities = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const queryParams = new URLSearchParams({
          locationId,
          page: page.toString(),
          limit: '25',
          ...(search ? { search } : {}),
          ...(actionFilter ? { action: actionFilter } : {}),
        });

        const res = await apiClient<{
          success: boolean;
          data: { activities: ActivityItem[]; total: number; page: number; limit: number };
        }>(`/manager/activity?${queryParams.toString()}`);

        if (res.success && res.data) {
          setActivities(res.data.activities);
          setTotal(res.data.total);
        }
      } catch (err: any) {
        console.error('Failed to load activity logs:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId, page, search, actionFilter]
  );

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Activity & Governance History"
        description="Immutable operational audit trail logging managerial overrides, service status transitions, and staff floor assignments."
        onRefresh={() => fetchActivities(true)}
        refreshing={refreshing}
      />

      {/* Toolbar */}
      <div
        className={`p-4 rounded-xl border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search employee, action, details..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-mono bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="OPERATIONAL_ALERT_ACKNOWLEDGED">Alert Acknowledged</option>
            <option value="OPERATIONAL_ALERT_RESOLVED">Alert Resolved</option>
            <option value="MANAGER_OVERRIDE_EXECUTED">Manager Override</option>
            <option value="SERVICE_TASK_REASSIGNED">Service Task Reassigned</option>
            <option value="TABLE_CLEANING_FORCED">Table Cleaning Forced</option>
            <option value="ORDER_CANCELLED">Order Cancelled</option>
            <option value="OPERATIONAL_REPORT_EXPORTED">Report Exported</option>
          </select>
        </div>

        <div className="text-xs font-mono text-[#A5A198] shrink-0">
          Total: {total} audit records
        </div>
      </div>

      {/* Audit Log Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        {loading ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading audit history...
          </div>
        ) : activities.length === 0 ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            No audit records found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#2A2925] bg-[#1C1B17]/40 text-xs font-mono text-[#A5A198] uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2925]">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-[#1C1B17]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-stone-400 whitespace-nowrap">
                      <div>
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                      <div className="text-stone-500">
                        {new Date(act.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#F6F1E8] text-xs font-sans">
                        {act.actorName}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">{act.actorEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30">
                        {act.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-300 font-sans max-w-md">
                      {act.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 25 && (
          <div className="p-4 border-t border-[#2A2925] flex items-center justify-between text-xs font-mono text-stone-400">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border border-[#2A2925] hover:bg-[#1C1B17] disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {Math.ceil(total / 25)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 25)}
              className="px-3 py-1.5 rounded border border-[#2A2925] hover:bg-[#1C1B17] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
