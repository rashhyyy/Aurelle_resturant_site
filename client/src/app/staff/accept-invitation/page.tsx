'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../../lib/api';
import { StaffRole } from '../../../types/staff';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Mail,
  User,
} from 'lucide-react';

interface InvitationDetails {
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  expiresAt: string;
}

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Verification states
  const [validating, setValidating] = useState(true);
  const [invitationData, setInvitationData] = useState<InvitationDetails | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 1. Validate Token on Mount
  useEffect(() => {
    if (!token) {
      setTokenError('Invitation token is missing from the URL. Please verify the invitation link provided in your email.');
      setValidating(false);
      return;
    }

    setValidating(true);
    setTokenError(null);

    apiClient<{
      success: boolean;
      data: InvitationDetails;
    }>(`/staff/invitations/validate?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (res?.success && res.data) {
          setInvitationData(res.data);
        } else {
          setTokenError('This invitation has expired or is invalid.');
        }
      })
      .catch((err: any) => {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('expired')) {
          setTokenError('This invitation has expired. Please contact your restaurant administrator to request a new invitation.');
        } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('used')) {
          setTokenError('This invitation has already been accepted. You may log in with your existing password.');
        } else {
          setTokenError(msg || 'Unable to validate invitation. The link may be invalid or expired.');
        }
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

  // Password Policy Checklist
  const rules = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: Boolean(password && password === confirmPassword),
    };
  }, [password, confirmPassword]);

  const allRulesPassed =
    rules.length &&
    rules.uppercase &&
    rules.lowercase &&
    rules.number &&
    rules.special &&
    rules.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!token) {
      setSubmitError('Missing invitation token.');
      return;
    }
    if (!allRulesPassed) {
      setSubmitError('Please satisfy all password security requirements.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient<{ success: boolean; message: string }>(
        '/staff/invitations/accept',
        {
          method: 'POST',
          data: {
            token,
            password,
            confirmPassword,
          },
        }
      );

      if (res?.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to activate your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D10] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#B99A63] selection:text-black">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#B99A63]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        {/* Crest & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#17181E] border border-[#B99A63]/30 shadow-lg shadow-[#B99A63]/5 mb-4 text-[#B99A63]">
            <Shield size={24} />
          </div>
          <h1 className="font-serif text-3xl font-light tracking-[0.2em] text-[#F6F4EE] uppercase">
            A U R E L L E
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-[#B99A63] mt-1.5 font-mono">
            Staff Account Activation
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#14151B] border border-[#262521] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {/* 1. VALIDATING SPINNER */}
          {validating && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw size={28} className="animate-spin text-[#B99A63] mx-auto" />
              <p className="text-sm font-mono text-[#A5A198]">
                Verifying your staff invitation token...
              </p>
            </div>
          )}

          {/* 2. TOKEN ERROR STATE */}
          {!validating && tokenError && (
            <div className="space-y-6 text-center py-4">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <AlertCircle size={24} />
              </div>

              <div>
                <h2 className="text-lg font-serif text-[#F6F4EE]">Invitation Unavailable</h2>
                <p className="text-xs text-[#A5A198] mt-2 leading-relaxed max-w-sm mx-auto">
                  {tokenError}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/staff/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#B99A63] text-[#171715] font-semibold text-xs font-mono uppercase tracking-wider hover:bg-[#A88B54] transition-colors"
                >
                  Return to Staff Sign In
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* 3. SUCCESS STATE */}
          {!validating && success && (
            <div className="space-y-6 text-center py-4">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 size={30} />
              </div>

              <div>
                <h2 className="text-xl font-serif text-[#F6F4EE]">Account Activated</h2>
                <p className="text-xs text-[#A5A198] mt-2 leading-relaxed max-w-sm mx-auto">
                  Your credentials have been securely stored. You can now authenticate with your email and new password.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/staff/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#B99A63] text-[#171715] font-semibold text-xs font-mono uppercase tracking-wider hover:bg-[#A88B54] transition-colors shadow-lg shadow-[#B99A63]/10"
                >
                  Proceed to Staff Sign In
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* 4. ACTIVE FORM */}
          {!validating && !tokenError && !success && invitationData && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Brief */}
              <div className="p-4 rounded-xl bg-[#0C0D10] border border-[#262521] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#F6F4EE]">
                    <User size={13} className="text-[#B99A63]" />
                    <span>
                      {invitationData.firstName} {invitationData.lastName}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30">
                    {invitationData.role}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-[#A5A198]">
                  <Mail size={13} className="text-[#737068]" />
                  <span>{invitationData.email}</span>
                </div>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A5A198] mb-1.5">
                  Create Confidential Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737068]">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-[#0C0D10] border border-[#2A2925] rounded-lg pl-10 pr-11 py-2.5 text-sm text-[#F6F4EE] placeholder-[#55524B] focus:outline-none focus:border-[#B99A63] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#737068] hover:text-[#F6F4EE]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A5A198] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737068]">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-[#0C0D10] border border-[#2A2925] rounded-lg pl-10 pr-11 py-2.5 text-sm text-[#F6F4EE] placeholder-[#55524B] focus:outline-none focus:border-[#B99A63] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#737068] hover:text-[#F6F4EE]"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-4 rounded-xl bg-[#0C0D10] border border-[#22211F] space-y-2 text-xs">
                <span className="block font-mono text-[11px] uppercase tracking-wider text-[#A5A198]">
                  Password Policy Requirements:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.length ? 'text-emerald-400' : 'text-[#737068]'
                    }`}
                  >
                    {rules.length ? <Check size={12} /> : <X size={12} />}
                    <span>8+ characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.uppercase ? 'text-emerald-400' : 'text-[#737068]'
                    }`}
                  >
                    {rules.uppercase ? <Check size={12} /> : <X size={12} />}
                    <span>1 uppercase letter</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.lowercase ? 'text-emerald-400' : 'text-[#737068]'
                    }`}
                  >
                    {rules.lowercase ? <Check size={12} /> : <X size={12} />}
                    <span>1 lowercase letter</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.number ? 'text-emerald-400' : 'text-[#737068]'
                    }`}
                  >
                    {rules.number ? <Check size={12} /> : <X size={12} />}
                    <span>1 number</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.special ? 'text-emerald-400' : 'text-[#737068]'
                    }`}
                  >
                    {rules.special ? <Check size={12} /> : <X size={12} />}
                    <span>1 special character</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.match && password ? 'text-emerald-400' : 'text-[#737068]'
                    }`}
                  >
                    {rules.match && password ? <Check size={12} /> : <X size={12} />}
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!allRulesPassed || submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-[#B99A63] text-[#171715] font-semibold text-xs font-mono uppercase tracking-wider hover:bg-[#A88B54] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-[#B99A63]/10"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Staff Account</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Notice */}
          <div className="mt-8 pt-6 border-t border-[#22211F] text-center">
            <p className="text-[11px] text-[#737068] leading-relaxed">
              Upon activation, your Aurelle staff account becomes active with role-restricted access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0C0D10] flex items-center justify-center text-[#B99A63] font-mono text-xs">
          Loading invitation...
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
