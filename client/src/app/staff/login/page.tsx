'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStaffAuth } from '../../../context/StaffAuthContext';
import { ROLE_DASHBOARDS, StaffRole } from '../../../types/staff';
import { apiClient } from '../../../lib/api';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  X,
} from 'lucide-react';

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { staff, loading: authLoading, login, getDefaultRedirect } = useStaffAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!authLoading && staff) {
      const redirectParam = searchParams.get('redirect');
      if (redirectParam && redirectParam.startsWith('/staff')) {
        router.replace(redirectParam);
      } else {
        router.replace(getDefaultRedirect(staff.role));
      }
    }
  }, [staff, authLoading, router, searchParams, getDefaultRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both staff email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const authenticatedStaff = await login(email, password);

      const redirectParam = searchParams.get('redirect');
      const targetUrl =
        redirectParam && redirectParam.startsWith('/staff')
          ? redirectParam
          : ROLE_DASHBOARDS[authenticatedStaff.role] || '/staff/login';

      router.replace(targetUrl);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    try {
      setForgotSubmitting(true);
      const res = await apiClient<{ success: boolean; message: string; resetToken?: string }>(
        '/staff/auth/forgot-password',
        {
          data: { email: forgotEmail },
        }
      );
      setForgotMessage(res.message);
    } catch (err: any) {
      setForgotMessage(err.message || 'Unable to process password reset request.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D10] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#C1A87D] selection:text-black">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C1A87D]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Crest & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#17181E] border border-[#C1A87D]/30 shadow-lg shadow-[#C1A87D]/5 mb-4 text-[#C1A87D]">
            <Shield size={24} />
          </div>
          <h1 className="font-serif text-3xl font-light tracking-[0.2em] text-[#F6F4EE] uppercase">
            AURELLE
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-[#C1A87D] mt-1.5 font-mono">
            Staff Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#14151B] border border-[#262521] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A5A198] mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737068]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@aurelle.com"
                  autoComplete="username"
                  required
                  className="w-full bg-[#0C0D10] border border-[#2A2925] rounded-lg pl-10 pr-4 py-3 text-sm text-[#F6F4EE] placeholder-[#55524B] focus:outline-none focus:border-[#C1A87D] focus:ring-1 focus:ring-[#C1A87D] transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A5A198]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(true);
                    setForgotMessage(null);
                  }}
                  className="text-xs text-[#C1A87D] hover:underline font-mono tracking-tight"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737068]">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#0C0D10] border border-[#2A2925] rounded-lg pl-10 pr-11 py-3 text-sm text-[#F6F4EE] placeholder-[#55524B] focus:outline-none focus:border-[#C1A87D] focus:ring-1 focus:ring-[#C1A87D] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#737068] hover:text-[#ECE7DF] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 px-4 rounded-lg bg-[#C1A87D] text-[#0C0D10] font-medium text-sm tracking-wide transition-all hover:bg-[#d4be93] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#C1A87D]/10"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0C0D10] border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-[#22211F] text-center">
            <p className="text-[11px] text-[#737068] leading-relaxed">
              Authorized Aurelle restaurant personnel only. Unauthorized access attempts are monitored and recorded.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#14151B] border border-[#33312B] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-[#737068] hover:text-[#ECE7DF] transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-serif text-[#F6F4EE] mb-2">Reset Staff Credentials</h3>
            <p className="text-xs text-[#A5A198] mb-6 leading-relaxed">
              Enter your verified staff email address. If an active staff account is found, password recovery instructions will be dispatched.
            </p>

            {forgotMessage ? (
              <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                <span>{forgotMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-[#A5A198] mb-1.5">
                    Registered Staff Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="employee@aurelle.com"
                    required
                    className="w-full bg-[#0C0D10] border border-[#2A2925] rounded-lg px-3.5 py-2.5 text-sm text-[#F6F4EE] placeholder-[#55524B] focus:outline-none focus:border-[#C1A87D]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 text-xs font-mono uppercase text-[#A5A198] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-4 py-2 rounded-lg bg-[#C1A87D] text-[#0C0D10] text-xs font-medium uppercase tracking-wider hover:bg-[#d4be93] disabled:opacity-50"
                  >
                    {forgotSubmitting ? 'Requesting...' : 'Request Reset'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0C0D10] flex items-center justify-center text-[#C1A87D]">
          Loading...
        </div>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
