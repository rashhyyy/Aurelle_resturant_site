'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Briefcase,
  ChefHat,
  BellRing,
  Armchair,
  CheckCircle2,
  Clock,
  Ban,
  MapPin,
  ExternalLink,
  Edit,
  MoreHorizontal,
} from 'lucide-react';
import { SafeStaff, StaffRole, StaffStatus } from '../../types/staff';
import { RestaurantLocationOption } from '../../types/staffManagement';

interface StaffMobileCardListProps {
  staffList: SafeStaff[];
  loading: boolean;
  locations: RestaurantLocationOption[];
  onSelectAction: (action: string, staff: SafeStaff) => void;
  isDark: boolean;
}

export const StaffMobileCardList: React.FC<StaffMobileCardListProps> = ({
  staffList,
  loading,
  locations,
  onSelectAction,
  isDark,
}) => {
  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case StaffRole.ADMIN:
        return { icon: Shield, label: 'Admin', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case StaffRole.MANAGER:
        return { icon: Briefcase, label: 'Manager', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      case StaffRole.KITCHEN:
        return { icon: ChefHat, label: 'Kitchen', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case StaffRole.RECEPTION:
        return { icon: BellRing, label: 'Reception', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case StaffRole.FLOOR:
        return { icon: Armchair, label: 'Floor', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    }
  };

  const getStatusBadge = (status: StaffStatus) => {
    switch (status) {
      case StaffStatus.ACTIVE:
        return { icon: CheckCircle2, label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case StaffStatus.INVITED:
        return { icon: Clock, label: 'Invited', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case StaffStatus.DISABLED:
        return { icon: Ban, label: 'Disabled', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    }
  };

  const getLocationLabel = (locId: string) => {
    const loc = locations.find((l) => l.id === locId);
    return loc ? loc.name.replace('Aurelle ', '') : locId;
  };

  if (loading) {
    return (
      <div className="md:hidden space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`border rounded-xl p-4 animate-pulse ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="h-4 bg-current opacity-10 rounded w-32 mb-2" />
            <div className="h-3 bg-current opacity-5 rounded w-48 mb-3" />
            <div className="h-8 bg-current opacity-5 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <div
        className={`md:hidden border rounded-xl p-8 text-center ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <p className={`text-sm ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
          No employees match criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {staffList.map((emp) => {
        const roleMeta = getRoleBadge(emp.role);
        const statusMeta = getStatusBadge(emp.status);
        const RoleIcon = roleMeta.icon;
        const StatusIcon = statusMeta.icon;
        const initials = `${emp.firstName[0] || ''}${emp.lastName[0] || ''}`.toUpperCase();

        return (
          <div
            key={emp.id}
            className={`border rounded-xl p-4 shadow-sm transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            {/* Header: Name & Role Badge */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#B99A63]/20 border border-[#B99A63]/30 text-[#B99A63] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div>
                  <Link
                    href={`/staff/admin/staff/${emp.id}`}
                    className={`font-medium hover:text-[#B99A63] text-sm ${
                      isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                    }`}
                  >
                    {emp.firstName} {emp.lastName}
                  </Link>
                  <div className={`text-xs font-mono truncate max-w-[180px] ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
                    {emp.email}
                  </div>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${roleMeta.color}`}
              >
                <RoleIcon size={11} />
                {roleMeta.label}
              </span>
            </div>

            {/* Badges: Status and Locations */}
            <div className="flex flex-wrap items-center gap-2 mb-3 pt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusMeta.color}`}
              >
                <StatusIcon size={11} />
                {statusMeta.label}
              </span>

              {emp.locationIds && emp.locationIds.length > 0 && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans ${
                    isDark ? 'bg-[#2C2C28] text-[#D1CDC7]' : 'bg-[#EFECE6] text-[#4A4740]'
                  }`}
                >
                  <MapPin size={9} className="text-[#B99A63]" />
                  {getLocationLabel(emp.locationIds[0])}
                  {emp.locationIds.length > 1 && ` +${emp.locationIds.length - 1}`}
                </span>
              )}
            </div>

            {/* Action Bar */}
            <div
              className={`flex items-center justify-between pt-3 border-t text-xs ${
                isDark ? 'border-[#2C2C28]' : 'border-[#E5DFD3]'
              }`}
            >
              <Link
                href={`/staff/admin/staff/${emp.id}`}
                className="text-[#B99A63] font-medium hover:underline flex items-center gap-1"
              >
                Details <ExternalLink size={12} />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectAction('edit_profile', emp)}
                  className={`p-1.5 rounded-lg border ${
                    isDark ? 'border-[#2C2C28] text-[#A5A198]' : 'border-[#E5DFD3] text-[#6B685F]'
                  }`}
                  title="Edit Contact"
                >
                  <Edit size={13} />
                </button>

                <button
                  onClick={() => onSelectAction('change_role', emp)}
                  className={`p-1.5 rounded-lg border ${
                    isDark ? 'border-[#2C2C28] text-blue-400' : 'border-[#E5DFD3] text-blue-600'
                  }`}
                  title="Change Role"
                >
                  <Shield size={13} />
                </button>

                <button
                  onClick={() => onSelectAction('manage_locations', emp)}
                  className={`p-1.5 rounded-lg border ${
                    isDark ? 'border-[#2C2C28] text-amber-400' : 'border-[#E5DFD3] text-amber-600'
                  }`}
                  title="Locations"
                >
                  <MapPin size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
