'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MoreVertical,
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
  UserCheck,
  UserX,
  Mail,
  KeyRound,
} from 'lucide-react';
import { SafeStaff, StaffRole, StaffStatus } from '../../types/staff';
import { RestaurantLocationOption } from '../../types/staffManagement';

interface StaffDirectoryTableProps {
  staffList: SafeStaff[];
  loading: boolean;
  locations: RestaurantLocationOption[];
  onSelectAction: (action: string, staff: SafeStaff) => void;
  isDark: boolean;
}

export const StaffDirectoryTable: React.FC<StaffDirectoryTableProps> = ({
  staffList,
  loading,
  locations,
  onSelectAction,
  isDark,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case StaffRole.ADMIN:
        return {
          icon: Shield,
          label: 'Admin',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        };
      case StaffRole.MANAGER:
        return {
          icon: Briefcase,
          label: 'Manager',
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        };
      case StaffRole.KITCHEN:
        return {
          icon: ChefHat,
          label: 'Kitchen',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        };
      case StaffRole.RECEPTION:
        return {
          icon: BellRing,
          label: 'Reception',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        };
      case StaffRole.FLOOR:
        return {
          icon: Armchair,
          label: 'Floor',
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        };
    }
  };

  const getStatusBadge = (status: StaffStatus) => {
    switch (status) {
      case StaffStatus.ACTIVE:
        return {
          icon: CheckCircle2,
          label: 'Active',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      case StaffStatus.INVITED:
        return {
          icon: Clock,
          label: 'Invited',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case StaffStatus.DISABLED:
        return {
          icon: Ban,
          label: 'Disabled',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        };
    }
  };

  const getLocationLabel = (locId: string) => {
    const loc = locations.find((l) => l.id === locId);
    return loc ? loc.name.replace('Aurelle ', '') : locId;
  };

  if (loading) {
    return (
      <div
        className={`hidden md:block border rounded-xl overflow-hidden shadow-sm ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="p-8 text-center animate-pulse">
          <div className="h-4 bg-current opacity-10 rounded w-48 mx-auto mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-current opacity-5 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <div
        className={`hidden md:block border rounded-xl p-12 text-center shadow-sm ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#B99A63]/10 text-[#B99A63]">
          <Shield size={24} />
        </div>
        <h3 className={`text-base font-serif font-medium ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
          No Employees Found
        </h3>
        <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
          No staff records match the current search filters. Try adjusting your search query or role/status filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`hidden md:block border rounded-xl overflow-visible shadow-sm ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className={`border-b text-[11px] font-mono uppercase tracking-wider ${
                isDark ? 'bg-[#171715]/50 border-[#2C2C28] text-[#A5A198]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#6B685F]'
              }`}
            >
              <th className="py-3.5 px-4 font-semibold">Employee</th>
              <th className="py-3.5 px-4 font-semibold">Contact</th>
              <th className="py-3.5 px-4 font-semibold">Role</th>
              <th className="py-3.5 px-4 font-semibold">Locations</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold">Last Active</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y text-sm ${isDark ? 'divide-[#2C2C28]' : 'divide-[#E5DFD3]'}`}>
            {staffList.map((emp) => {
              const roleMeta = getRoleBadge(emp.role);
              const statusMeta = getStatusBadge(emp.status);
              const RoleIcon = roleMeta.icon;
              const StatusIcon = statusMeta.icon;
              const initials = `${emp.firstName[0] || ''}${emp.lastName[0] || ''}`.toUpperCase();

              return (
                <tr
                  key={emp.id}
                  className={`transition-colors ${
                    isDark ? 'hover:bg-[#252522]' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  {/* Name & Avatar */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#B99A63]/20 border border-[#B99A63]/30 text-[#B99A63] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/staff/admin/staff/${emp.id}`}
                          className={`font-medium hover:text-[#B99A63] transition-colors flex items-center gap-1.5 ${
                            isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                          }`}
                        >
                          <span className="truncate">
                            {emp.firstName} {emp.lastName}
                          </span>
                        </Link>
                        {emp.phone && (
                          <div className={`text-xs ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                            {emp.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-4">
                    <span className={`text-xs font-mono truncate block max-w-[200px] ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                      {emp.email}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleMeta.color}`}
                    >
                      <RoleIcon size={12} />
                      {roleMeta.label}
                    </span>
                  </td>

                  {/* Locations */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {emp.locationIds && emp.locationIds.length > 0 ? (
                        emp.locationIds.map((locId) => (
                          <span
                            key={locId}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans ${
                              isDark ? 'bg-[#2C2C28] text-[#D1CDC7]' : 'bg-[#EFECE6] text-[#4A4740]'
                            }`}
                          >
                            <MapPin size={10} className="text-[#B99A63]" />
                            {getLocationLabel(locId)}
                          </span>
                        ))
                      ) : (
                        <span className={`text-xs italic ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                          Unassigned
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusMeta.color}`}
                    >
                      <StatusIcon size={12} />
                      {statusMeta.label}
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="py-3.5 px-4">
                    <span className={`text-xs ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
                      {emp.lastLoginAt
                        ? new Date(emp.lastLoginAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never active'}
                    </span>
                  </td>

                  {/* Action Menu */}
                  <td className="py-3.5 px-4 text-right relative">
                    <div className="inline-block text-left">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === emp.id ? null : emp.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#171715] border-[#2C2C28] text-[#A5A198] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                            : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#6B685F] hover:text-[#171715] hover:border-[#B99A63]'
                        }`}
                        title="Employee Actions"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeMenuId === emp.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div
                            className={`absolute right-4 mt-1 w-48 rounded-xl shadow-2xl border py-1.5 z-50 text-left text-xs ${
                              isDark
                                ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#F6F1E8]'
                                : 'bg-white border-[#E5DFD3] text-[#171715]'
                            }`}
                          >
                            <Link
                              href={`/staff/admin/staff/${emp.id}`}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#B99A63]/15 transition-colors"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <ExternalLink size={13} className="text-[#B99A63]" />
                              View Full Profile
                            </Link>

                            <button
                              onClick={() => {
                                onSelectAction('edit_profile', emp);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#B99A63]/15 transition-colors"
                            >
                              <Edit size={13} className="text-[#B99A63]" />
                              Edit Contact Details
                            </button>

                            <button
                              onClick={() => {
                                onSelectAction('change_role', emp);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#B99A63]/15 transition-colors"
                            >
                              <Shield size={13} className="text-blue-400" />
                              Change Role
                            </button>

                            <button
                              onClick={() => {
                                onSelectAction('manage_locations', emp);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#B99A63]/15 transition-colors"
                            >
                              <MapPin size={13} className="text-amber-400" />
                              Manage Locations
                            </button>

                            {emp.status === StaffStatus.INVITED ? (
                              <>
                                <button
                                  onClick={() => {
                                    onSelectAction('resend_invitation', emp);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#B99A63]/15 transition-colors"
                                >
                                  <Mail size={13} className="text-amber-400" />
                                  Resend Invitation
                                </button>
                                <button
                                  onClick={() => {
                                    onSelectAction('revoke_invitation', emp);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-400 hover:bg-rose-500/15 transition-colors"
                                >
                                  <Ban size={13} />
                                  Revoke Invitation
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    onSelectAction('password_reset', emp);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#B99A63]/15 transition-colors"
                                >
                                  <KeyRound size={13} className="text-[#B99A63]" />
                                  Send Password Reset
                                </button>

                                {emp.status === StaffStatus.ACTIVE ? (
                                  <button
                                    onClick={() => {
                                      onSelectAction('toggle_status', emp);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-400 hover:bg-rose-500/15 transition-colors border-t border-current/10"
                                  >
                                    <UserX size={13} />
                                    Disable Account
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      onSelectAction('toggle_status', emp);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-emerald-400 hover:bg-emerald-500/15 transition-colors border-t border-current/10"
                                  >
                                    <UserCheck size={13} />
                                    Enable Account
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
