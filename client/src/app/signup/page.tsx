"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const COUNTRY_CODES = [
  "Sri Lanka (+94)",
  "United Kingdom (+44)",
  "United States (+1)",
  "Australia (+61)",
  "Canada (+1)",
  "United Arab Emirates (+971)",
  "Singapore (+65)",
  "India (+91)",
  "Germany (+49)",
  "France (+33)",
];

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("Sri Lanka (+94)");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedFirst || !trimmedLast) {
      setErrorMessage("Please enter both your first name and last name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    try {
      setSubmitting(true);
      await register({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: trimmedEmail,
        countryCode,
        phone: trimmedPhone,
        password,
      });

      router.replace(redirectTarget);
    } catch (err: any) {
      const msg = err.message || "";
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate") ||
        msg.includes("409")
      ) {
        setErrorMessage(
          "An account with this email address already exists. Please sign in or use another email."
        );
      } else {
        setErrorMessage(
          msg || "Unable to complete registration. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative selection:bg-[#C1A87D] selection:text-black">
      {/* Ambient Luxury Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[340px] bg-[#C1A87D]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg mx-auto relative z-10">
        {/* Crest & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#C1A87D]/40 bg-[#16171C]/70 shadow-lg shadow-black/40 mb-4 text-[#C1A87D]">
            <Sparkles className="w-5 h-5 stroke-[1.7]" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.3em] text-[#C1A87D] font-mono block mb-2">
            AURELLE MEMBERSHIP
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-wide text-stone-100">
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 font-light">
            Join the Aurelle circle for priority reservations, tailored menus, and exclusive culinary privileges.
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-[#101114] border border-stone-800 rounded-xl p-5 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-sm">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-[4px] bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Name Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    className="w-full bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none pl-10 pr-3 py-2.5 sm:py-3 text-sm text-stone-100 rounded-[2px] transition-colors placeholder:text-stone-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    className="w-full bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none pl-10 pr-3 py-2.5 sm:py-3 text-sm text-stone-100 rounded-[2px] transition-colors placeholder:text-stone-600"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold mb-2">
                Email Address *
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
                  placeholder="name@example.com"
                  className="w-full bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none pl-10 pr-4 py-2.5 sm:py-3 text-sm text-stone-100 rounded-[2px] transition-colors placeholder:text-stone-600"
                />
              </div>
            </div>

            {/* Phone Number Grid */}
            <div>
              <label className="block text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold mb-2">
                Phone Number (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="sm:col-span-5 bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none px-3 py-2.5 sm:py-3 text-xs text-stone-100 rounded-[2px]"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c} value={c} className="bg-[#111215] text-stone-200">
                      {c}
                    </option>
                  ))}
                </select>
                <div className="relative sm:col-span-7">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="77 123 4567"
                    className="w-full bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none pl-10 pr-4 py-2.5 sm:py-3 text-sm text-stone-100 rounded-[2px] transition-colors placeholder:text-stone-600"
                  />
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Password */}
              <div>
                <label className="block text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold mb-2">
                  Password * (Min 8 chars)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none pl-9 pr-9 py-2.5 sm:py-3 text-sm text-stone-100 rounded-[2px] transition-colors placeholder:text-stone-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-stone-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#16171B] border border-stone-800 focus:border-[#C1A87D] focus:outline-none pl-9 pr-9 py-2.5 sm:py-3 text-sm text-stone-100 rounded-[2px] transition-colors placeholder:text-stone-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-stone-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms check notice */}
            <p className="text-[11px] text-stone-500 leading-relaxed pt-1">
              By creating an account, you agree to Aurelle&apos;s{" "}
              <Link href="/terms" className="text-stone-400 underline hover:text-[#C1A87D]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-stone-400 underline hover:text-[#C1A87D]">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#C1A87D] hover:bg-[#D5BC8F] text-[#121316] font-semibold text-xs tracking-[0.2em] uppercase py-3.5 px-6 rounded-[2px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {submitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sign In Redirect */}
          <div className="mt-7 pt-6 border-t border-stone-800/80 text-center">
            <p className="text-xs text-stone-400">
              Already have an account?{" "}
              <Link
                href={`/signin${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
                className="text-[#C1A87D] hover:underline font-medium transition-colors ml-1"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#C1A87D] border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
