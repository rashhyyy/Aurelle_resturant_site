'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  Users,
  Shield,
  Armchair,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Info,
} from 'lucide-react';

interface StaffAssignment {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  locationIds: string[];
  operationalAssignment: string;
  assignedTables: string[];
}

export default function ManagerStaffPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [staffList, setStaffList] = useState<StaffAssignment[]>([]);
  const [totalStaff, setTotalStaff] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchStaff = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await apiClient<{
          success: boolean;
          data: { locationId: string; totalStaff: number; assignments: StaffAssignment[] };
        }>(`/manager/staff?locationId=${locationId}`);

        if (res.success && res.data) {
          setStaffList(res.data.assignments);
          setTotalStaff(res.data.totalStaff);
        }
      } catch (err: any) {
        console.error('Failed to load staff assignments:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId]
  );

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filteredStaff = staffList.filter((s) => {
    const matchesRole = roleFilter ? s.role === roleFilter : true;
    const matchesSearch = search
      ? `${s.firstName} ${s.lastName} ${s.email} ${s.operationalAssignment}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true;
    return matchesRole && matchesSearch;
  });

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Staff Operations Overview"
        description="Monitor staff station rosters, dining floor table allocations, and operational assignments."
        onRefresh={() => fetchStaff(true)}
        refreshing={refreshing}
      />

      {/* Operational Disclaimer Banner */}
      <div className="mb-6 p-4 rounded-xl bg-[#1C1B17] border border-[#2A2925] text-xs font-mono text-[#A5A198] flex items-start gap-3">
        <Info size={16} className="text-[#B99A63] shrink-0 mt-0.5" />
        <div>
          <span className="text-[#F6F1E8] font-semibold block mb-0.5">
            Operational Station & Table Assignments
          </span>
          Information displayed reflects configured restaurant floor stations and system roles. This reflects dining room coverage and table assignments rather than payroll time-clock or punch attendance.
        </div>
      </div>

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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee name, role..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="MANAGER">Manager</option>
            <option value="FLOOR">Floor Staff</option>
            <option value="RECEPTION">Reception</option>
            <option value="KITCHEN">Kitchen</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>

        <div className="text-xs font-mono text-[#A5A198] shrink-0">
          Showing {filteredStaff.length} of {totalStaff} team members
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-500 font-mono text-sm">
          <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading team assignments...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-20 text-center text-stone-500 font-mono text-sm">
          No staff found matching the filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#B99A63]/15 text-[#B99A63] flex items-center justify-center font-serif font-bold text-xs">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-serif text-base text-[#F6F1E8] font-medium leading-tight">
                        {member.firstName} {member.lastName}
                      </h4>
                      <span className="text-[11px] font-mono text-stone-500">{member.email}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      member.role === 'ADMIN'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : member.role === 'MANAGER'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : member.role === 'FLOOR'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : member.role === 'RECEPTION'
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#1C1B17] border border-[#2A2925] mb-3 text-xs font-mono">
                  <div className="text-stone-500 text-[10px] uppercase mb-1">
                    Floor & Station Assignment
                  </div>
                  <div className="text-[#F6F1E8] font-medium flex items-center gap-1.5">
                    <Armchair size={14} className="text-[#B99A63]" />
                    <span>{member.operationalAssignment}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#2A2925] flex items-center justify-between text-xs font-mono text-stone-500">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={12} />
                  <span>{member.status}</span>
                </span>
                <span>{member.locationIds.length} Locations</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </StaffLayout>
  );
}
