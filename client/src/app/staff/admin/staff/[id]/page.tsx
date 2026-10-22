'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { StaffLayout } from '../../../../../components/staff/StaffLayout';
import { StaffRole, SafeStaff, StaffStatus } from '../../../../../types/staff';
import {
  RestaurantLocationOption,
  StaffAuditLogItem,
} from '../../../../../types/staffManagement';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { StaffActionModals } from '../../../../../components/staff-mgmt/StaffActionModals';
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  MapPin,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  RefreshCw,
  Edit,
  KeyRound,
  UserX,
  UserCheck,
  Send,
  Ban,
  CheckCircle2,
} from 'lucide-react';

function StaffMemberDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;

  const { staff } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [staffData, setStaffData] = useState<SafeStaff | null>(null);
  const [activityLogs, setActivityLogs] = useState<StaffAuditLogItem[]>([]);
  const [locations, setLocations] = useState<RestaurantLocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal action state
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Fetch staff member info and locations
  const fetchStaffDetails = useCallback(async () => {
    if (!staff || staff.role !== StaffRole.ADMIN || !staffId) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const [empRes, permRes] = await Promise.all([
        apiClient<{ success: boolean; data: SafeStaff }>(`/admin/staff/${staffId}`),
        apiClient<{
          success: boolean;
          data: { locations: RestaurantLocationOption[] };
        }>('/admin/staff/permissions'),
      ]);

      if (empRes?.success && empRes.data) {
        setStaffData(empRes.data);
      }
      if (permRes?.success && permRes.data) {
        setLocations(permRes.data.locations);
      }
    } catch (err: any) {
      console.warn('[StaffDetails] Error fetching details:', err?.message || err);
      setErrorMessage(err.message || 'Failed to load employee details.');
    } finally {
      setLoading(false);
    }
  }, [staff, staffId]);

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    if (!staff || staff.role !== StaffRole.ADMIN || !staffId) return;
    setLogsLoading(true);

    try {
      const logsRes = await apiClient<{
        success: boolean;
        data: StaffAuditLogItem[];
      }>(`/admin/staff/${staffId}/activity`);

      if (logsRes?.success && Array.isArray(logsRes.data)) {
        setActivityLogs(logsRes.data);
      }
    } catch (err: any) {
      console.warn('[StaffDetails] Notice fetching activity logs:', err?.message || err);
    } finally {
      setLogsLoading(false);
    }
  }, [staff, staffId]);

  useEffect(() => {
    fetchStaffDetails();
    fetchActivityLogs();
  }, [fetchStaffDetails, fetchActivityLogs]);

  const handleActionSuccess = () => {
    fetchStaffDetails();
    fetchActivityLogs();
  };

  const getRoleBadge = (role: StaffRole) => {
    const roleColors: Record<StaffRole, string> = {
      [StaffRole.ADMIN]: 'bg-[#B99A63]/15 text-[#B99A63] border-[#B99A63]/30',
      [StaffRole.MANAGER]: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      [StaffRole.KITCHEN]: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      [StaffRole.RECEPTION]: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      [StaffRole.FLOOR]: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider border ${
          roleColors[role] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }`}
      >
        {role}
      </span>
    );
  };

  const getStatusBadge = (status: StaffStatus) => {
    if (status === StaffStatus.ACTIVE) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      );
    }
    if (status === StaffStatus.INVITED) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Invited
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Disabled
      </span>
    );
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN]}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* TOP BREADCRUMB & BACK LINK */}
        <div className="flex items-center justify-between pb-3 border-b border-current/10">
          <Link
            href="/staff/admin/staff"
            className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider transition-colors ${
              isDark
                ? 'text-[#A5A198] hover:text-[#B99A63]'
                : 'text-[#6B685F] hover:text-[#B99A63]'
            }`}
          >
            <ArrowLeft size={14} />
            Back to Staff Directory
          </Link>

          <button
            onClick={() => {
              fetchStaffDetails();
              fetchActivityLogs();
            }}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'border-[#2C2C28] text-[#A5A198] hover:text-[#F6F1E8]'
                : 'border-[#E5DFD3] text-[#6B685F] hover:text-[#171715]'
            }`}
          >
            <RefreshCw size={13} className={loading || logsLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline font-mono uppercase tracking-wider">Refresh</span>
          </button>
        </div>

        {/* ERROR STATE */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchStaffDetails}
              className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-mono text-[11px] uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && !staffData ? (
          <div
            className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <RefreshCw size={24} className="animate-spin text-[#B99A63] mx-auto mb-3" />
            <p className={`text-xs font-mono ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
              Loading employee dossier...
            </p>
          </div>
        ) : staffData ? (
          <>
            {/* HERO PROFILE CARD */}
            <div
              className={`p-6 sm:p-8 rounded-2xl border transition-all ${
                isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#B99A63]/15 border border-[#B99A63]/30 flex items-center justify-center text-[#B99A63] font-serif font-bold text-2xl sm:text-3xl shrink-0 shadow-inner">
                    {staffData.firstName?.[0] || 'A'}
                    {staffData.lastName?.[0] || 'U'}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <h1
                        className={`text-xl sm:text-2xl font-serif font-semibold tracking-tight ${
                          isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                        }`}
                      >
                        {staffData.firstName} {staffData.lastName}
                      </h1>
                      {getRoleBadge(staffData.role)}
                      {getStatusBadge(staffData.status)}
                    </div>

                    <div
                      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${
                        isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-mono">
                        <Mail size={13} className="text-[#B99A63]" />
                        {staffData.email}
                      </span>
                      {staffData.phone && (
                        <span className="flex items-center gap-1.5 font-mono">
                          <Phone size={13} className="text-[#B99A63]" />
                          {staffData.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* QUICK ACTION BUTTONS */}
                <div className="flex flex-wrap items-center gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-current/10">
                  <button
                    onClick={() => setActiveAction('edit_profile')}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      isDark
                        ? 'border-[#2C2C28] text-[#D1CDC7] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                        : 'border-[#E5DFD3] text-[#4A4740] hover:text-[#171715] hover:border-[#B99A63]'
                    }`}
                  >
                    <Edit size={13} className="text-[#B99A63]" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => setActiveAction('change_role')}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      isDark
                        ? 'border-[#2C2C28] text-[#D1CDC7] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                        : 'border-[#E5DFD3] text-[#4A4740] hover:text-[#171715] hover:border-[#B99A63]'
                    }`}
                  >
                    <Shield size={13} className="text-[#B99A63]" />
                    Change Role
                  </button>

                  <button
                    onClick={() => setActiveAction('manage_locations')}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      isDark
                        ? 'border-[#2C2C28] text-[#D1CDC7] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                        : 'border-[#E5DFD3] text-[#4A4740] hover:text-[#171715] hover:border-[#B99A63]'
                    }`}
                  >
                    <MapPin size={13} className="text-[#B99A63]" />
                    Locations
                  </button>

                  {staffData.status === StaffStatus.INVITED && (
                    <>
                      <button
                        onClick={() => setActiveAction('resend_invitation')}
                        className="px-3 py-2 rounded-lg bg-[#B99A63]/15 border border-[#B99A63]/40 text-[#B99A63] hover:bg-[#B99A63]/25 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <Send size={13} />
                        Resend Invite
                      </button>
                      <button
                        onClick={() => setActiveAction('revoke_invitation')}
                        className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      >
                        <Ban size={13} />
                        Revoke Invite
                      </button>
                    </>
                  )}

                  {staffData.status !== StaffStatus.INVITED && (
                    <>
                      <button
                        onClick={() => setActiveAction('password_reset')}
                        className={`px-3 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                          isDark
                            ? 'border-[#2C2C28] text-[#D1CDC7] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                            : 'border-[#E5DFD3] text-[#4A4740] hover:text-[#171715] hover:border-[#B99A63]'
                        }`}
                      >
                        <KeyRound size={13} className="text-[#B99A63]" />
                        Reset Password
                      </button>

                      <button
                        onClick={() => setActiveAction('toggle_status')}
                        className={`px-3 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                          staffData.status === StaffStatus.ACTIVE
                            ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {staffData.status === StaffStatus.ACTIVE ? (
                          <>
                            <UserX size={13} />
                            Disable Account
                          </>
                        ) : (
                          <>
                            <UserCheck size={13} />
                            Enable Account
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* TWO-COLUMN DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LEFT COLUMN: OVERVIEW SPECIFICATIONS */}
              <div
                className={`p-6 rounded-2xl border space-y-5 md:col-span-1 ${
                  isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
                }`}
              >
                <h3
                  className={`text-xs font-mono uppercase tracking-[0.2em] font-semibold ${
                    isDark ? 'text-[#B99A63]' : 'text-[#8C6D37]'
                  }`}
                >
                  Account Specifications
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className={`block font-mono text-[11px] mb-1 ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                      Employee ID
                    </span>
                    <span className="font-mono text-xs select-all text-[#B99A63]">
                      {staffData.id}
                    </span>
                  </div>

                  <div>
                    <span className={`block font-mono text-[11px] mb-1 ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                      Assigned Venues
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {staffData.locationIds && staffData.locationIds.length > 0 ? (
                        staffData.locationIds.map((locId) => {
                          const found = locations.find((l) => l.id === locId);
                          return (
                            <span
                              key={locId}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono border flex items-center gap-1 ${
                                isDark
                                  ? 'bg-[#171715] border-[#2C2C28] text-[#D1CDC7]'
                                  : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#4A4740]'
                              }`}
                            >
                              <MapPin size={10} className="text-[#B99A63]" />
                              {found?.name || locId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-gray-400 italic">No assigned venues</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`block font-mono text-[11px] mb-1 ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                      Account Created
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <Calendar size={13} className="text-[#B99A63]" />
                      <span>
                        {staffData.createdAt
                          ? new Date(staffData.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className={`block font-mono text-[11px] mb-1 ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                      Last Authentication
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock size={13} className="text-[#B99A63]" />
                      <span>
                        {staffData.lastLoginAt
                          ? new Date(staffData.lastLoginAt).toLocaleString()
                          : 'Never authenticated'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className={`block font-mono text-[11px] mb-1 ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                      Password Changed
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <KeyRound size={13} className="text-[#B99A63]" />
                      <span>
                        {staffData.passwordChangedAt
                          ? new Date(staffData.passwordChangedAt).toLocaleDateString()
                          : 'Not changed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: RECENT AUDIT LOGS */}
              <div
                className={`p-6 rounded-2xl border space-y-4 md:col-span-2 ${
                  isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-current/10">
                  <div className="flex items-center gap-2">
                    <Activity size={15} className="text-[#B99A63]" />
                    <h3
                      className={`text-xs font-mono uppercase tracking-[0.2em] font-semibold ${
                        isDark ? 'text-[#B99A63]' : 'text-[#8C6D37]'
                      }`}
                    >
                      Audit Trail & Security Events
                    </h3>
                  </div>
                  <span className={`text-[11px] font-mono ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                    {activityLogs.length} events logged
                  </span>
                </div>

                {logsLoading ? (
                  <div className="py-8 text-center text-xs font-mono text-gray-400">
                    <RefreshCw size={18} className="animate-spin text-[#B99A63] mx-auto mb-2" />
                    Fetching audit events...
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-gray-400">
                    No recorded security audit actions for this account yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                    {activityLogs.map((log) => (
                      <div
                        key={log._id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          isDark
                            ? 'bg-[#171715] border-[#2C2C28]'
                            : 'bg-[#F9F7F2] border-[#E5DFD3]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold uppercase tracking-wider text-[#B99A63] text-[11px]">
                            {log.action}
                          </span>
                          <span className={`text-[11px] font-mono ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                          {typeof log.details === 'string'
                            ? log.details
                            : (log.details as any)?.description || 'Administrative state update executed.'}
                        </p>
                        <div
                          className={`flex items-center gap-3 text-[11px] font-mono ${
                            isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'
                          }`}
                        >
                          <span>Actor: {log.actorEmail}</span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MODALS */}
            <StaffActionModals
              actionType={activeAction}
              targetStaff={staffData}
              onClose={() => setActiveAction(null)}
              onSuccess={handleActionSuccess}
              locations={locations}
              isDark={isDark}
            />
          </>
        ) : (
          <div
            className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <AlertCircle size={28} className="text-rose-400 mx-auto mb-2" />
            <h2 className="text-base font-serif font-medium">Employee Not Found</h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
              The requested staff ID does not exist or has been removed.
            </p>
            <Link
              href="/staff/admin/staff"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#B99A63] text-[#171715] text-xs font-mono uppercase tracking-wider font-semibold"
            >
              Return to Directory
            </Link>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}

export default function StaffMemberDetailsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#171715] flex items-center justify-center text-[#B99A63] font-mono text-xs">
          Loading employee dossier...
        </div>
      }
    >
      <StaffMemberDetailsContent />
    </React.Suspense>
  );
}
