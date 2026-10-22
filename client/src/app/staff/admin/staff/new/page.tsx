'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StaffLayout } from '../../../../../components/staff/StaffLayout';
import { StaffRole } from '../../../../../types/staff';
import { RestaurantLocationOption } from '../../../../../types/staffManagement';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import {
  ArrowLeft,
  UserPlus,
  Mail,
  MapPin,
  Shield,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function StandaloneAddEmployeePage() {
  const router = useRouter();
  const { staff } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>(StaffRole.FLOOR);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Metadata & UI states
  const [locations, setLocations] = useState<RestaurantLocationOption[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    delivered: boolean;
    simulated: boolean;
    previewUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch available restaurant locations
  useEffect(() => {
    if (staff && staff.role === StaffRole.ADMIN) {
      apiClient<{
        success: boolean;
        data: { locations: RestaurantLocationOption[] };
      }>('/admin/staff/permissions')
        .then((res) => {
          if (res?.success && res.data?.locations) {
            setLocations(res.data.locations);
            if (res.data.locations.length > 0) {
              setSelectedLocations([res.data.locations[0].id]);
            }
          }
        })
        .catch((err) => {
          console.warn('[AddEmployeePage] Could not load locations:', err);
        })
        .finally(() => setLoadingConfig(false));
    }
  }, [staff]);

  const handleToggleLocation = (locId: string) => {
    setSelectedLocations((prev) => {
      if (prev.includes(locId)) {
        if (prev.length === 1) return prev; // Must keep at least one
        return prev.filter((id) => id !== locId);
      } else {
        return [...prev, locId];
      }
    });
  };

  const handleCopyLink = () => {
    if (successInfo?.previewUrl) {
      navigator.clipboard.writeText(successInfo.previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First and last name are required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (selectedLocations.length === 0) {
      setErrorMessage('Please assign at least one restaurant location.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient<{
        success: boolean;
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
          phone: phone.trim() || undefined,
          role,
          locationIds: selectedLocations,
        },
      });

      if (res?.success && res.data) {
        setSuccessInfo(res.data.emailDelivery);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch staff invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole(StaffRole.FLOOR);
    setSuccessInfo(null);
    setErrorMessage(null);
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN]}>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* TOP BREADCRUMB */}
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
        </div>

        {/* PAGE HEADER */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#B99A63] font-semibold">
            AURELLE / ADMINISTRATION
          </span>
          <h1
            className={`text-2xl sm:text-3xl font-serif tracking-tight mt-1 ${
              isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
            }`}
          >
            Add New Employee
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
            Invite a new staff member to join Aurelle with role-based access and assigned venue clearance.
          </p>
        </div>

        {/* SUCCESS CARD */}
        {successInfo && (
          <div
            className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-serif font-semibold text-base">Invitation Dispatched Successfully</h3>
                <p className="text-xs opacity-90 mt-0.5">
                  An activation email has been generated. The invitation link remains active for 48 hours.
                </p>
              </div>
            </div>

            {successInfo.previewUrl && (
              <div
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#B99A63]">
                  <span>Development Activation Link:</span>
                  <button
                    onClick={handleCopyLink}
                    className="hover:underline flex items-center gap-1.5 text-xs font-mono"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={successInfo.previewUrl}
                  className="w-full text-xs font-mono px-3 py-2 bg-transparent border rounded-lg truncate outline-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-[#B99A63] text-[#171715] font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#A88B54] transition-colors"
              >
                Invite Another Employee
              </button>
              <Link
                href="/staff/admin/staff"
                className="px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider transition-colors hover:border-[#B99A63]"
              >
                View Staff Directory
              </Link>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* INVITATION FORM */}
        {!successInfo && (
          <form
            onSubmit={handleSubmit}
            className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            {/* NAME ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  First Name <span className="text-[#B99A63]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Antoine"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
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
                  placeholder="Laurent"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                  }`}
                />
              </div>
            </div>

            {/* EMAIL & PHONE ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Email Address <span className="text-[#B99A63]">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chef.laurent@aurelle.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                      isDark
                        ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                        : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  Phone Number <span className={`text-[10px] font-mono ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>(Optional)</span>
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'
                    }`}
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
                      isDark
                        ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                        : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* ROLE SELECTOR */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Staff Role <span className="text-[#B99A63]">*</span>
              </label>
              <div className="relative">
                <Shield
                  size={15}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'
                  }`}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider outline-none border cursor-pointer ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]'
                      : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
                  }`}
                >
                  <option value={StaffRole.ADMIN}>Administrator (Full Administrative Control)</option>
                  <option value={StaffRole.MANAGER}>Operations Manager (Daily Management)</option>
                  <option value={StaffRole.KITCHEN}>Kitchen Staff (Executive Pass & KMS)</option>
                  <option value={StaffRole.RECEPTION}>Reception Staff (Reservations & Front Desk)</option>
                  <option value={StaffRole.FLOOR}>Floor Staff (Table Service & Floor Tasks)</option>
                </select>
              </div>
            </div>

            {/* LOCATION CHECKBOXES */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                Restaurant Location(s) <span className="text-[#B99A63]">*</span>
              </label>

              {loadingConfig ? (
                <div className="py-4 text-xs font-mono text-gray-400 flex items-center gap-2">
                  <RefreshCw size={13} className="animate-spin text-[#B99A63]" />
                  Loading restaurant venues...
                </div>
              ) : locations.length === 0 ? (
                <div className="p-3 rounded-lg border border-rose-500/30 text-rose-300 text-xs">
                  No restaurant locations configured.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {locations.map((loc) => {
                    const isChecked = selectedLocations.includes(loc.id);
                    return (
                      <label
                        key={loc.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? isDark
                              ? 'bg-[#B99A63]/10 border-[#B99A63]/40 text-[#F6F1E8]'
                              : 'bg-[#B99A63]/15 border-[#B99A63]/50 text-[#171715]'
                            : isDark
                            ? 'border-[#2C2C28] text-[#A5A198] hover:bg-[#252522]'
                            : 'border-[#E5DFD3] text-[#6B685F] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleLocation(loc.id)}
                          className="rounded border-[#B99A63] text-[#B99A63] focus:ring-0"
                        />
                        <MapPin size={14} className="text-[#B99A63] shrink-0" />
                        <div>
                          <div className="font-medium">{loc.name}</div>
                          {loc.city && (
                            <div className={`text-[10px] font-mono ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                              {loc.city}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FORM FOOTER */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-current/10">
              <Link
                href="/staff/admin/staff"
                className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors ${
                  isDark
                    ? 'text-[#A5A198] hover:text-[#F6F1E8]'
                    : 'text-[#6B685F] hover:text-[#171715]'
                }`}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#B99A63] text-[#171715] font-semibold text-xs font-mono uppercase tracking-wider hover:bg-[#A88B54] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </StaffLayout>
  );
}
