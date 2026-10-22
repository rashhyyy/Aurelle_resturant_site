'use client';

import React, { useState } from 'react';
import { StaffLayout } from '../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../components/staff/StaffPageHeader';
import { StaffStatusBadge } from '../../../components/staff/StaffStatusBadge';
import { useStaffAuth } from '../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import { ROLE_LABELS } from '../../../types/staff';
import { apiClient } from '../../../lib/api';
import {
  User,
  Mail,
  Shield,
  MapPin,
  KeyRound,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function StaffProfilePage() {
  const { staff, csrfToken } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!staff) return null;

  const roleInfo = ROLE_LABELS[staff.role] || { title: staff.role, subtitle: '' };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    try {
      setPasswordSubmitting(true);
      await apiClient('/staff/auth/change-password', {
        headers: {
          'x-csrf-token': csrfToken || '',
        },
        data: {
          currentPassword,
          newPassword,
        },
      });

      setPasswordMessage({
        type: 'success',
        text: 'Password updated successfully. Please use your new password next time you sign in.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.message || 'Failed to update password. Please verify current credentials.',
      });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <StaffLayout>
      <StaffPageHeader
        title="Staff Profile & Security"
        subtitle="View your verified employee credentials, access roles, and update account password."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Account Details (Read-Only) */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className={`border rounded-2xl p-6 sm:p-8 shadow-sm ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center gap-4 pb-6 border-b border-[#B99A63]/15 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center text-lg font-mono font-bold">
                {staff.firstName[0]}
                {staff.lastName[0]}
              </div>
              <div>
                <h3
                  className={`text-xl font-serif ${
                    isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                  }`}
                >
                  {staff.firstName} {staff.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#B99A63] font-semibold">
                    {roleInfo.title}
                  </span>
                  <StaffStatusBadge status={staff.status} />
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-mono tracking-wider text-[#737068] mb-1">
                  First Name
                </label>
                <div
                  className={`p-3 rounded-lg border font-mono ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF]'
                      : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#171715]'
                  }`}
                >
                  {staff.firstName}
                </div>
              </div>

              <div>
                <label className="block uppercase font-mono tracking-wider text-[#737068] mb-1">
                  Last Name
                </label>
                <div
                  className={`p-3 rounded-lg border font-mono ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF]'
                      : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#171715]'
                  }`}
                >
                  {staff.lastName}
                </div>
              </div>

              <div>
                <label className="block uppercase font-mono tracking-wider text-[#737068] mb-1">
                  Email Address
                </label>
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border font-mono ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF]'
                      : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#171715]'
                  }`}
                >
                  <Mail size={14} className="text-[#B99A63]" />
                  <span>{staff.email}</span>
                </div>
              </div>

              <div>
                <label className="block uppercase font-mono tracking-wider text-[#737068] mb-1">
                  System Role Clearance
                </label>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg border font-mono ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF]'
                      : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#171715]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[#B99A63]" />
                    <span className="font-semibold text-[#B99A63]">{staff.role}</span>
                  </div>
                  <span className="text-[10px] text-[#737068]">Read-only</span>
                </div>
              </div>

              <div>
                <label className="block uppercase font-mono tracking-wider text-[#737068] mb-1">
                  Assigned Restaurant Locations
                </label>
                <div
                  className={`p-3 rounded-lg border font-mono ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF]'
                      : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#171715]'
                  }`}
                >
                  {staff.locationIds && staff.locationIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {staff.locationIds.map((loc) => (
                        <span
                          key={loc}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 text-xs"
                        >
                          <MapPin size={11} />
                          {loc}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#737068]">No assigned locations</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Account Security & Password Change */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className={`border rounded-2xl p-6 sm:p-8 shadow-sm ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center">
                <KeyRound size={18} />
              </div>
              <div>
                <h3
                  className={`text-lg font-serif ${
                    isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                  }`}
                >
                  Change Password
                </h3>
                <p className="text-xs text-[#737068]">
                  Encrypted using Argon2id with OWASP parameters
                </p>
              </div>
            </div>

            {passwordMessage && (
              <div
                className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 mb-5 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/30 border border-red-500/30 text-red-300'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#737068] mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs focus:outline-none focus:border-[#B99A63] transition-colors ${
                      isDark
                        ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF] placeholder-[#55524B]'
                        : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#171715] placeholder-[#9E9A90]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#737068] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-xs focus:outline-none focus:border-[#B99A63] transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF] placeholder-[#55524B]'
                      : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#171715] placeholder-[#9E9A90]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#737068] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-xs focus:outline-none focus:border-[#B99A63] transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF] placeholder-[#55524B]'
                      : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#171715] placeholder-[#9E9A90]'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={passwordSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-lg bg-[#B99A63] text-[#171715] font-medium text-xs tracking-wider uppercase transition-colors hover:bg-[#cbb07e] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {passwordSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
