'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Shield,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { StaffRole } from '../../types/staff';
import { RestaurantLocationOption } from '../../types/staffManagement';
import { apiClient } from '../../lib/api';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locations: RestaurantLocationOption[];
  isDark: boolean;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  locations,
  isDark,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>(StaffRole.FLOOR);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['loc-colombo-main']);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    staffName: string;
    email: string;
    previewUrl?: string;
    delivered: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleToggleLocation = (locId: string) => {
    setSelectedLocations((prev) => {
      if (prev.includes(locId)) {
        if (prev.length === 1) return prev; // At least one location required
        return prev.filter((id) => id !== locId);
      } else {
        return [...prev, locId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMessage('First name, last name, and email address are required.');
      return;
    }

    if (selectedLocations.length === 0) {
      setErrorMessage('Please assign at least one restaurant location.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient<{
        success: boolean;
        message: string;
        data: {
          staff: any;
          emailDelivery: {
            delivered: boolean;
            simulated: boolean;
            previewUrl?: string;
          };
        };
      }>('/admin/staff/invitations', {
        method: 'POST',
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          role,
          locationIds: selectedLocations,
        },
      });

      if (res?.success) {
        setSuccessResult({
          staffName: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
          previewUrl: res.data.emailDelivery.previewUrl,
          delivered: res.data.emailDelivery.delivered,
        });
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create staff invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (successResult?.previewUrl) {
      navigator.clipboard.writeText(successResult.previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole(StaffRole.FLOOR);
    setSelectedLocations(['loc-colombo-main']);
    setErrorMessage(null);
    setSuccessResult(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-[#2C2C28] bg-[#171715]' : 'border-[#E5DFD3] bg-[#F9F7F2]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B99A63]/20 flex items-center justify-center text-[#B99A63]">
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className={`text-base font-serif font-medium ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
                {successResult ? 'Invitation Dispatched' : 'Invite New Employee'}
              </h3>
              <p className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                Aurelle Restaurant Governance
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-[#A5A198] hover:text-[#F6F1E8] hover:bg-[#2C2C28]' : 'text-[#6B685F] hover:text-[#171715] hover:bg-[#EFECE6]'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {successResult ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h4 className={`text-lg font-serif ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
                Account Invitation Created
              </h4>
              <p className={`text-xs mt-1 max-w-sm mx-auto leading-relaxed ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
                An invitation has been initialized for <strong>{successResult.staffName}</strong> ({successResult.email}) with status <strong>INVITED</strong>.
              </p>
            </div>

            {successResult.previewUrl && (
              <div
                className={`p-4 rounded-xl border text-left space-y-2 ${
                  isDark ? 'bg-[#171715] border-[#B99A63]/30' : 'bg-[#F9F7F2] border-[#B99A63]/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#B99A63] font-semibold flex items-center gap-1.5">
                    <Mail size={13} />
                    Direct Activation Link (Testing / Dev Mode)
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 text-[11px] text-[#B99A63] font-medium hover:underline cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={successResult.previewUrl}
                  className={`w-full text-xs font-mono px-3 py-2 rounded border truncate ${
                    isDark ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#D1CDC7]' : 'bg-white border-[#E5DFD3] text-[#4A4740]'
                  }`}
                />
                <p className={`text-[11px] ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                  The employee can open this link to configure their password and activate their account.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 px-4 rounded-lg bg-[#B99A63] text-[#171715] font-semibold text-xs uppercase tracking-wider hover:bg-[#A88B54] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Names row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  First Name <span className="text-[#B99A63]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Kenji"
                  className={`w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 focus:ring-[#B99A63] ${
                    isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Last Name <span className="text-[#B99A63]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sato"
                  className={`w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 focus:ring-[#B99A63] ${
                    isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                  }`}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Email Address <span className="text-[#B99A63]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@aurelle.com"
                className={`w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 focus:ring-[#B99A63] ${
                  isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                }`}
              />
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Phone Number <span className={`text-[10px] ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>(Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className={`w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-1 focus:ring-[#B99A63] ${
                  isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                }`}
              />
            </div>

            {/* Staff Role Selector */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Staff Role <span className="text-[#B99A63]">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider outline-none border cursor-pointer ${
                  isDark ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                }`}
              >
                <option value={StaffRole.ADMIN}>Administrator (Full System Control)</option>
                <option value={StaffRole.MANAGER}>Operations Manager (Dining Floor & Orders)</option>
                <option value={StaffRole.KITCHEN}>Kitchen Staff (Culinary Pass & KMS)</option>
                <option value={StaffRole.RECEPTION}>Reception Staff (Reservations & Check-In)</option>
                <option value={StaffRole.FLOOR}>Floor Staff (Table Service & Orders)</option>
              </select>
            </div>

            {/* Restaurant Locations Selector */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Assigned Restaurant Locations <span className="text-[#B99A63]">*</span>
              </label>
              <div className="space-y-1.5">
                {locations.map((loc) => {
                  const isChecked = selectedLocations.includes(loc.id);
                  return (
                    <label
                      key={loc.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? isDark
                            ? 'bg-[#B99A63]/10 border-[#B99A63]/40 text-[#F6F1E8]'
                            : 'bg-[#B99A63]/15 border-[#B99A63]/50 text-[#171715]'
                          : isDark
                          ? 'border-[#2C2C28] text-[#A5A198] hover:bg-[#171715]'
                          : 'border-[#E5DFD3] text-[#6B685F] hover:bg-[#F9F7F2]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleLocation(loc.id)}
                        className="rounded border-[#B99A63] text-[#B99A63] focus:ring-0"
                      />
                      <MapPin size={13} className="text-[#B99A63]" />
                      <span className="font-medium">{loc.name}</span>
                      <span className={`text-[10px] ml-auto font-mono ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                        {loc.city}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-current/10">
              <button
                type="button"
                onClick={handleResetAndClose}
                className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                  isDark ? 'text-[#A5A198] hover:text-[#F6F1E8]' : 'text-[#6B685F] hover:text-[#171715]'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-[#B99A63] text-[#171715] font-semibold text-xs uppercase tracking-wider hover:bg-[#A88B54] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Generating Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    Dispatch Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
