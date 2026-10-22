"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../lib/api";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const redirectTarget = searchParams.get("redirect") || "/profile";

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTarget);
    }
  }, [user, authLoading, router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login(trimmedEmail, password);
      router.replace(redirectTarget);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Invalid email or password. Please verify your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const trimmed = forgotEmail.trim().toLowerCase();
    if (!trimmed) {
      setForgotError("Please enter your email address.");
      return;
    }

    try {
      setForgotSubmitting(true);
      const res = await apiClient<{ success: boolean; message: string }>(
        "/auth/forgot-password",
        {
          method: "POST",
          data: { email: trimmed },
        }
      );
      setForgotSuccess(
        res?.message ||
          "If an account exists with this email, password reset instructions have been sent."
      );
    } catch (err: any) {
      setForgotError(err.message || "Failed to process password reset request.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative selection:bg-[#C1A87D] selection:text-black">
      {/* Ambient Luxury Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[340px] bg-[#C1A87D]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Crest & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#C1A87D]/40 bg-[#16171C]/70 shadow-lg shadow-black/40 mb-4 text-[#C1A87D]">
            <Sparkles className="w-5 h-5 stroke-[1.7]" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#C1A87D] font-mono block mb-2">
            AURELLE MEMBERSHIP
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-wide text-stone-100">
            Sign In
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 font-light">
            Access your personalized reservations, private orders, and culinary profile.
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-[#101114] border border-stone-800 rounded-xl p-5 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-sm">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-[4px] bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none pl-10 pr-4 py-3 text-sm text-stone-100 rounded-[2px] transition-colors placeholder:text-stone-600"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotSuccess(null);
                    setForgotError(null);
                    setForgotModalOpen(true);
                  }}
                  className="text-[11px] text-[#C1A87D] hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none pl-10 pr-11 py-3 text-sm text-stone-100 rounded-[2px] transition-colors placeholder:text-stone-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 text-xs text-stone-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#C1A87D] rounded border-stone-700 bg-stone-900 cursor-pointer"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#C1A87D] hover:bg-[#D5BC8F] text-[#121316] font-semibold text-xs tracking-[0.2em] uppercase py-3.5 px-6 rounded-[2px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {submitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sign Up Redirect */}
          <div className="mt-7 pt-6 border-t border-stone-800/80 text-center">
            <p className="text-xs text-stone-400">
              Don&apos;t have an account yet?{" "}
              <Link
                href={`/signup${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
                className="text-[#C1A87D] hover:underline font-medium transition-colors ml-1"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setForgotModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-md bg-[#101114] border border-stone-800 rounded-xl p-6 sm:p-8 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#C1A87D] font-mono">
                  RESET PASSWORD
                </span>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="p-1 rounded text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs text-stone-300 leading-relaxed">
                  Enter your registered email address. We will verify your account and provide instructions to safely reset your password.
                </p>

                {forgotSuccess ? (
                  <div className="mt-5 p-4 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>{forgotSuccess}</span>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                    {forgotError && (
                      <div className="p-3 rounded bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                        <span>{forgotError}</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold mb-2">
                        Account Email
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none px-4 py-2.5 text-sm text-stone-100 rounded-[2px]"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(false)}
                        className="px-4 py-2 text-xs uppercase tracking-wider text-stone-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotSubmitting}
                        className="bg-[#C1A87D] hover:bg-[#D5BC8F] text-[#121316] font-semibold text-xs tracking-wider uppercase px-5 py-2.5 rounded-[2px] transition-colors disabled:opacity-50"
                      >
                        {forgotSubmitting ? "Sending..." : "Send Reset Link"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#C1A87D] border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
