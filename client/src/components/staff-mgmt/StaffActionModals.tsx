'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Shield,
  MapPin,
  Edit,
  UserX,
  UserCheck,
  Mail,
  KeyRound,
  Ban,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { SafeStaff, StaffRole, StaffStatus } from '../../types/staff';
import { RestaurantLocationOption } from '../../types/staffManagement';
import { apiClient } from '../../lib/api';

interface StaffActionModalsProps {
  actionType: string | null;
  targetStaff: SafeStaff | null;
  onClose: () => void;
  onSuccess: () => void;
  locations: RestaurantLocationOption[];
  isDark: boolean;
}

export const StaffActionModals: React.FC<StaffActionModalsProps> = ({
  actionType,
  targetStaff,
  onClose,
  onSuccess,
  locations,
  isDark,
}) => {
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>(StaffRole.FLOOR);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resentUrl, setResentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (targetStaff) {
      setFirstName(targetStaff.firstName || '');
      setLastName(targetStaff.lastName || '');
      setPhone(targetStaff.phone || '');
      setSelectedRole(targetStaff.role || StaffRole.FLOOR);
      setSelectedLocations(targetStaff.locationIds || ['loc-colombo-main']);
      setErrorMessage(null);
      setInfoMessage(null);
      setResentUrl(null);
      setCopied(false);
    }
  }, [targetStaff, actionType]);

  if (!actionType || !targetStaff) return null;

  const handleToggleLocation = (locId: string) => {
    setSelectedLocations((prev) => {
      if (prev.includes(locId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== locId);
      } else {
        return [...prev, locId];
      }
    });
  };

  const handleCopyLink = () => {
    if (resentUrl) {
      navigator.clipboard.writeText(resentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Submit Handler
  const handleExecute = async () => {
    setErrorMessage(null);
    setSubmitting(true);

    try {
      if (actionType === 'edit_profile') {
        await apiClient(`/admin/staff/${targetStaff.id}`, {
          method: 'PATCH',
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || null,
          },
        });
        onSuccess();
        onClose();
      } else if (actionType === 'change_role') {
        await apiClient(`/admin/staff/${targetStaff.id}/role`, {
          method: 'PATCH',
          data: { role: selectedRole },
        });
        onSuccess();
        onClose();
      } else if (actionType === 'manage_locations') {
        await apiClient(`/admin/staff/${targetStaff.id}/locations`, {
          method: 'PATCH',
          data: { locationIds: selectedLocations },
        });
        onSuccess();
        onClose();
      } else if (actionType === 'toggle_status') {
        const nextStatus =
          targetStaff.status === StaffStatus.ACTIVE ? StaffStatus.DISABLED : StaffStatus.ACTIVE;
        await apiClient(`/admin/staff/${targetStaff.id}/status`, {
          method: 'PATCH',
          data: { status: nextStatus },
        });
        onSuccess();
        onClose();
      } else if (actionType === 'resend_invitation') {
        const res = await apiClient<{
          success: boolean;
          data: { emailDelivery?: { previewUrl?: string } };
        }>(`/admin/staff/${targetStaff.id}/resend-invitation`, {
          method: 'POST',
        });
        if (res?.data?.emailDelivery?.previewUrl) {
          setResentUrl(res.data.emailDelivery.previewUrl);
        }
        setInfoMessage('Invitation re-dispatched successfully.');
        onSuccess();
      } else if (actionType === 'revoke_invitation') {
        await apiClient(`/admin/staff/${targetStaff.id}/revoke-invitation`, {
          method: 'POST',
        });
        onSuccess();
        onClose();
      } else if (actionType === 'password_reset') {
        await apiClient(`/admin/staff/${targetStaff.id}/password-reset`, {
          method: 'POST',
        });
        setInfoMessage('Password reset instructions generated and sent.');
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-[#2C2C28] bg-[#171715]' : 'border-[#E5DFD3] bg-[#F9F7F2]'
          }`}
        >
          <h3 className={`text-sm font-serif font-medium ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
            {actionType === 'edit_profile' && 'Edit Contact Information'}
            {actionType === 'change_role' && 'Assign Staff Role'}
            {actionType === 'manage_locations' && 'Manage Venue Assignments'}
            {actionType === 'toggle_status' &&
              (targetStaff.status === StaffStatus.ACTIVE ? 'Disable Staff Account' : 'Enable Staff Account')}
            {actionType === 'resend_invitation' && 'Resend Staff Invitation'}
            {actionType === 'revoke_invitation' && 'Revoke Invitation'}
            {actionType === 'password_reset' && 'Initiate Password Reset'}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${
              isDark ? 'text-[#A5A198] hover:text-[#F6F1E8]' : 'text-[#6B685F] hover:text-[#171715]'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* 1. Edit Profile Form */}
          {actionType === 'edit_profile' && (
            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${
                    isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${
                    isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${
                    isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* 2. Change Role Form */}
          {actionType === 'change_role' && (
            <div className="space-y-3">
              <p className={`text-xs ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
                Updating role for <strong>{targetStaff.firstName} {targetStaff.lastName}</strong> ({targetStaff.email}).
                Active sessions will be invalidated immediately.
              </p>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider outline-none border cursor-pointer ${
                  isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                }`}
              >
                <option value={StaffRole.ADMIN}>Administrator (Full System Control)</option>
                <option value={StaffRole.MANAGER}>Operations Manager</option>
                <option value={StaffRole.KITCHEN}>Kitchen Staff (Executive Pass & KMS)</option>
                <option value={StaffRole.RECEPTION}>Reception Staff (Reservations & Check-In)</option>
                <option value={StaffRole.FLOOR}>Floor Staff (Table Service)</option>
              </select>

              {targetStaff.role === StaffRole.ADMIN && selectedRole !== StaffRole.ADMIN && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>
                    Warning: Demoting this administrator will revoke their administrative clearance across all venues.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3. Manage Locations */}
          {actionType === 'manage_locations' && (
            <div className="space-y-2">
              <p className={`text-xs mb-2 ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
                Assign which Aurelle restaurant venues <strong>{targetStaff.firstName}</strong> can access:
              </p>
              {locations.map((loc) => {
                const isChecked = selectedLocations.includes(loc.id);
                return (
                  <label
                    key={loc.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer ${
                      isChecked
                        ? isDark
                          ? 'bg-[#B99A63]/10 border-[#B99A63]/40 text-[#F6F1E8]'
                          : 'bg-[#B99A63]/15 border-[#B99A63]/50 text-[#171715]'
                        : isDark
                        ? 'border-[#2C2C28] text-[#A5A198]'
                        : 'border-[#E5DFD3] text-[#6B685F]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleLocation(loc.id)}
                      className="rounded border-[#B99A63] text-[#B99A63]"
                    />
                    <MapPin size={13} className="text-[#B99A63]" />
                    <span className="font-medium">{loc.name}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* 4. Disable / Enable Confirmation */}
          {actionType === 'toggle_status' && (
            <div className="space-y-3">
              {targetStaff.status === StaffStatus.ACTIVE ? (
                <>
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-rose-500/15 border border-rose-500/30 text-rose-400">
                    <UserX size={24} />
                  </div>
                  <p className={`text-xs text-center leading-relaxed ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                    Are you sure you want to disable <strong>{targetStaff.firstName} {targetStaff.lastName}</strong>?
                    All active sessions will be terminated immediately, and they will be barred from signing in.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <UserCheck size={24} />
                  </div>
                  <p className={`text-xs text-center leading-relaxed ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                    Restore access for <strong>{targetStaff.firstName} {targetStaff.lastName}</strong>? They will be permitted to authenticate into their assigned role.
                  </p>
                </>
              )}
            </div>
          )}

          {/* 5. Resend Invitation */}
          {actionType === 'resend_invitation' && (
            <div className="space-y-3">
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Generate a new 48-hour secure invitation token for <strong>{targetStaff.email}</strong>. Any previous invitation links will be invalidated.
              </p>

              {resentUrl && (
                <div className={`p-3 rounded-lg border text-left space-y-1.5 ${isDark ? 'bg-[#171715] border-[#B99A63]/30' : 'bg-[#F9F7F2] border-[#B99A63]/40'}`}>
                  <div className="flex items-center justify-between text-xs font-mono text-[#B99A63]">
                    <span>Activation Link:</span>
                    <button onClick={handleCopyLink} className="hover:underline flex items-center gap-1">
                      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={resentUrl}
                    className="w-full text-xs font-mono px-2 py-1 bg-transparent border rounded truncate"
                  />
                </div>
              )}
            </div>
          )}

          {/* 6. Revoke Invitation */}
          {actionType === 'revoke_invitation' && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <Ban size={24} />
              </div>
              <p className={`text-xs text-center leading-relaxed ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Cancel pending invitation for <strong>{targetStaff.email}</strong>? The invitation token will be cleared and the account will transition to DISABLED.
              </p>
            </div>
          )}

          {/* 7. Password Reset */}
          {actionType === 'password_reset' && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[#B99A63]/15 border border-[#B99A63]/30 text-[#B99A63]">
                <KeyRound size={24} />
              </div>
              <p className={`text-xs text-center leading-relaxed ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Dispatch password reset instructions to <strong>{targetStaff.email}</strong>? A single-use secure reset token will be created with a 1-hour expiration.
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-current/10">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider ${
                isDark ? 'text-[#A5A198] hover:text-[#F6F1E8]' : 'text-[#6B685F] hover:text-[#171715]'
              }`}
            >
              {infoMessage ? 'Close' : 'Cancel'}
            </button>

            {!infoMessage && (
              <button
                type="button"
                onClick={handleExecute}
                disabled={submitting}
                className={`px-5 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 ${
                  actionType === 'toggle_status' && targetStaff.status === StaffStatus.ACTIVE
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : actionType === 'revoke_invitation'
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-[#B99A63] text-[#171715] hover:bg-[#A88B54]'
                }`}
              >
                {submitting ? 'Processing...' : 'Confirm Action'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
