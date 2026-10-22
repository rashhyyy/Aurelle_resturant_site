"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar,
  Users,
  ChevronDown,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { apiClient } from "../../lib/api";
import { usePreferences } from "../../context/PreferencesContext";
import {
  AvailabilityResult,
  AvailableTimeSlot,
  ClientReservation,
  ReservationStatus,
} from "../../types/reservation";

const LOCATIONS = [
  { id: "loc-colombo-main", name: "Aurelle Colombo (Flagship)" },
  { id: "loc-kandy-vip", name: "Aurelle Kandy (Sanctuary)" },
];

export default function ReservationsPage() {
  const { t } = usePreferences();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [locationId, setLocationId] = useState("loc-colombo-main");
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [time, setTime] = useState("7:30 PM");
  const [partySize, setPartySize] = useState("2 guests");
  const [seating, setSeating] = useState("No preference");

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("+94 ");
  const [email, setEmail] = useState("");
  const [occasion, setOccasion] = useState("No occasion");
  const [specialRequests, setSpecialRequests] = useState("");

  // Live Availability State
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<ClientReservation | null>(null);

  // Initialize date bounds on client mount (avoids prerender dynamic evaluation error)
  useEffect(() => {
    const today = new Date();
    setMinDate(today.toISOString().split("T")[0]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  // Prepopulate if customer session exists
  useEffect(() => {
    apiClient<{ success: boolean; user?: { username: string; email: string } }>("/auth/me")
      .then((res) => {
        if (res?.user) {
          setFullName((prev) => prev || res.user?.username || "");
          setEmail((prev) => prev || res.user?.email || "");
        }
      })
      .catch(() => {});
  }, []);

  const getGuestCountNumber = (partyStr: string): number => {
    const match = partyStr.match(/^(\d+)/);
    if (match) return parseInt(match[1], 10);
    if (partyStr.includes("6+")) return 6;
    return 2;
  };

  // Fetch real availability from backend
  const fetchAvailability = useCallback(async () => {
    try {
      setLoadingAvailability(true);
      setAvailabilityError(null);

      const count = getGuestCountNumber(partySize);
      const params = new URLSearchParams({
        locationId,
        date,
        guestCount: count.toString(),
      });
      if (seating && seating !== "No preference") {
        params.append("seatingPreference", seating);
      }

      const res = await apiClient<{ success: boolean; data: AvailabilityResult }>(
        `/reservations/availability?${params.toString()}`
      );

      if (res?.success && res.data) {
        setAvailability(res.data);
        // Auto-select first available slot if current time is not available
        const currentSlot = res.data.slots.find((s) => s.time === time);
        if (!currentSlot || !currentSlot.available) {
          const firstAvailable = res.data.slots.find((s) => s.available);
          if (firstAvailable) {
            setTime(firstAvailable.time);
          }
        }
      }
    } catch (err: any) {
      setAvailabilityError(err.message || "Failed to check live availability.");
    } finally {
      setLoadingAvailability(false);
    }
  }, [locationId, date, partySize, seating, time]);

  useEffect(() => {
    if (date) {
      fetchAvailability();
    }
  }, [locationId, date, partySize, seating]);

  // Format date for Review step
  const formatDisplayDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch {
      return dateString;
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const guestCount = getGuestCountNumber(partySize);
      const idempotencyKey = `res-client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const payload = {
        locationId,
        date,
        time,
        guestCount,
        guestName: fullName,
        guestEmail: email,
        guestPhone: contactNumber,
        seatingPreference: seating,
        occasion,
        specialRequests,
        idempotencyKey,
      };

      const res = await apiClient<{ success: boolean; data: ClientReservation; message: string }>(
        "/reservations",
        {
          method: "POST",
          data: payload,
        }
      );

      if (res?.success && res.data) {
        setConfirmedReservation(res.data);
        setStep(4);
      } else {
        setSubmitError("Failed to record reservation. Please try again.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Unable to complete reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLocationName =
    LOCATIONS.find((l) => l.id === locationId)?.name || "Aurelle Flagship";

  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 pb-28">
      {/* ======================================================== */}
      {/* 1. HERO HEADER WITH MOODY RESTAURANT AMBIENCE            */}
      {/* ======================================================== */}
      <section data-hero="true" className="relative w-full h-[62vh] min-h-[440px] sm:min-h-[480px] max-h-[580px] flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=90&w=2400&auto=format&fit=crop"
            alt="Aurelle dining room table setup"
            fill
            priority
            quality={85}
            className="object-cover object-center brightness-[1.06] contrast-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45 pointer-events-none" />
        </motion.div>

        {/* Content with Smooth Staggered Load Animations */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-4 pt-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-[11px] sm:text-xs uppercase tracking-[0.32em] text-[#C1A87D] font-medium block"
          >
            RESERVATIONS & PRIVATE DINING
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-6xl lg:text-[72px] font-serif font-normal text-white keep-white tracking-tight leading-[1.08] drop-shadow-md"
          >
            {t("res.title", "Your table awaits.")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="text-stone-200 keep-white text-xs sm:text-[13px] font-light leading-relaxed max-w-2xl mx-auto pt-2 drop-shadow-sm"
          >
            {t("res.subtitle", "Select your venue, date, and guest count below. Real-time dining capacity is verified directly with the restaurant floor inventory.")}
          </motion.p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. MULTI-STEP PROGRESS STEPPER (Steps 1, 2, 3)          */}
      {/* ======================================================== */}
      {step < 4 && (
        <div className="max-w-md mx-auto px-4 mt-8 sm:mt-12 mb-6 sm:mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-6 right-6 h-[1px] bg-stone-800 -z-0" />

            {/* Step 1 */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${
                  step === 1
                    ? "bg-white text-black"
                    : step > 1
                      ? "bg-[#C1A87D] text-black"
                      : "bg-[#1C1F26] text-stone-400 border border-stone-700"
                }`}
              >
                1
              </div>
              <span className="text-[11px] text-stone-300 font-medium mt-2">
                Find a table
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${
                  step === 2
                    ? "bg-white text-black"
                    : step > 2
                      ? "bg-[#C1A87D] text-black"
                      : "bg-[#1C1F26] text-stone-400 border border-stone-700"
                }`}
              >
                2
              </div>
              <span className="text-[11px] text-stone-400 font-light mt-2">
                Your details
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${
                  step === 3
                    ? "bg-white text-black"
                    : "bg-[#1C1F26] text-stone-400 border border-stone-700"
                }`}
              >
                3
              </div>
              <span className="text-[11px] text-stone-400 font-light mt-2">
                Review
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. STEP CONTENT CARDS                                    */}
      {/* ======================================================== */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        <AnimatePresence mode="wait">
          {/* ---------------- STEP 1: FIND A TABLE ---------------- */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="bg-[#17191E]/95 border border-[#272B35] rounded-[2px] p-4 sm:p-10 shadow-2xl space-y-6 sm:space-y-8"
            >
              {/* VENUE SELECTION */}
              <div>
                <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#C1A87D] font-medium block mb-2">
                  SELECT RESTAURANT VENUE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setLocationId(loc.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-[2px] border text-left transition-all ${
                        locationId === loc.id
                          ? "bg-[#252A35] border-[#C1A87D] text-white shadow-md"
                          : "bg-[#1E222A] border-[#2D3341] text-stone-400 hover:text-white hover:border-stone-500"
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-[#C1A87D] shrink-0" />
                      <div className="text-xs font-medium">{loc.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* DATE */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-2">
                    DATE
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      min={minDate || undefined}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-3.5 py-3 text-xs sm:text-sm text-stone-200 outline-none focus:border-[#C1A87D] transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* PARTY SIZE */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-2">
                    PARTY SIZE
                  </label>
                  <div className="relative">
                    <select
                      value={partySize}
                      onChange={(e) => setPartySize(e.target.value)}
                      className="w-full appearance-none bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-3.5 py-3 pr-8 text-xs sm:text-sm text-stone-200 outline-none focus:border-[#C1A87D] cursor-pointer transition-colors"
                    >
                      <option value="1 guest">1 guest</option>
                      <option value="2 guests">2 guests</option>
                      <option value="3 guests">3 guests</option>
                      <option value="4 guests">4 guests</option>
                      <option value="5 guests">5 guests</option>
                      <option value="6 guests">6 guests</option>
                      <option value="8 guests">8 guests (Grand Table)</option>
                      <option value="12 guests">12 guests (Private Salon)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* SEATING */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-2">
                    SEATING PREFERENCE
                  </label>
                  <div className="relative">
                    <select
                      value={seating}
                      onChange={(e) => setSeating(e.target.value)}
                      className="w-full appearance-none bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-3.5 py-3 pr-8 text-xs sm:text-sm text-stone-200 outline-none focus:border-[#C1A87D] cursor-pointer transition-colors"
                    >
                      <option value="No preference">No preference</option>
                      <option value="Main Dining Room">Main Dining Room</option>
                      <option value="Counter / Chef's View">
                        Counter / Chef&apos;s View
                      </option>
                      <option value="Outdoor Terrace">Outdoor Terrace</option>
                      <option value="Private Dining">Private Dining</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* REAL-TIME AVAILABLE SLOTS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-stone-400 font-medium flex items-center gap-2">
                    <span>AVAILABLE DINING SLOTS</span>
                    {loadingAvailability && (
                      <Loader2 className="w-3 h-3 text-[#C1A87D] animate-spin" />
                    )}
                  </span>
                  {availability && (
                    <span className="text-[10px] text-stone-400">
                      Standard Sitting: {availability.operatingHours.dinner.start} – {availability.operatingHours.dinner.end}
                    </span>
                  )}
                </div>

                {availabilityError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-[2px] text-red-200 text-xs flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{availabilityError}</span>
                  </div>
                )}

                {availability && availability.isFullyBooked && (
                  <div className="p-4 bg-[#21232B] border border-amber-700/40 rounded-[2px] text-amber-200 text-xs text-center space-y-1">
                    <div className="font-medium">No available tables remaining for this date.</div>
                    <div className="text-stone-400 text-[11px]">
                      Please choose an alternate date or party size.
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 flex-wrap">
                  {(availability?.slots || []).map((slot: AvailableTimeSlot) => {
                    const isSelected = time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setTime(slot.time)}
                        className={`px-5 py-2.5 text-xs font-medium tracking-wide transition-all rounded-[2px] flex items-center gap-1.5 ${
                          !slot.available
                            ? "bg-[#181A20] text-stone-600 border border-stone-800/60 cursor-not-allowed line-through"
                            : isSelected
                              ? "bg-[#252A35] text-white border border-[#C1A87D] shadow-md ring-1 ring-[#C1A87D]/50"
                              : "bg-[#1E222A] text-stone-300 border border-[#2D3341] hover:border-stone-500 hover:text-white"
                        }`}
                      >
                        <span>{slot.time}</span>
                        {slot.available && slot.remainingTables <= 2 && (
                          <span className="text-[9px] text-[#C1A87D] font-mono">
                            ({slot.remainingTables} left)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Continue Action */}
              <div className="flex justify-between items-center pt-4 border-t border-stone-800/80">
                <Link
                  href="/account/reservations"
                  className="text-xs text-[#C1A87D] hover:underline uppercase tracking-wider font-medium"
                >
                  Manage My Bookings
                </Link>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#F6F2EB] hover:bg-white text-[#15161A] text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3.5 rounded-[2px] transition-colors shadow-md"
                >
                  CONTINUE
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 2: YOUR DETAILS ---------------- */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="bg-[#17191E]/95 border border-[#272B35] rounded-[2px] p-4 sm:p-10 shadow-2xl space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {/* FULL NAME */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-2">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g. Lord Christopher Sterling"
                    className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-4 py-3 text-sm text-stone-200 placeholder-stone-500 outline-none focus:border-[#C1A87D] transition-colors"
                  />
                </div>

                {/* CONTACT NUMBER */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-2">
                    CONTACT TELEPHONE *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-4 py-3 text-sm text-stone-200 placeholder-stone-500 outline-none focus:border-[#C1A87D] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {/* EMAIL */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-2">
                    CONFIRMATION EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-4 py-3 text-sm text-stone-200 placeholder-stone-500 outline-none focus:border-[#C1A87D] transition-colors"
                  />
                </div>

                {/* OCCASION */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-2">
                    OCCASION
                  </label>
                  <div className="relative">
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full appearance-none bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-4 py-3 pr-8 text-sm text-stone-200 outline-none focus:border-[#C1A87D] cursor-pointer transition-colors"
                    >
                      <option value="No occasion">No occasion</option>
                      <option value="Birthday">Birthday</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Business Dinner">Business Dinner</option>
                      <option value="Date Night">Date Night</option>
                      <option value="Celebration">Celebration</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* SPECIAL REQUESTS */}
              <div>
                <label className="text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-2">
                  DIETARY RESTRICTIONS OR SPECIAL REQUESTS
                </label>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Inform our culinary team of any allergies, preferences, or special arrangements."
                  className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] p-4 text-sm text-stone-200 placeholder-stone-500 outline-none focus:border-[#C1A87D] transition-colors resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-stone-800/80">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-transparent hover:bg-stone-800 border border-stone-600 hover:border-white text-stone-200 text-xs font-semibold tracking-[0.16em] uppercase px-7 py-3 rounded-[2px] transition-colors text-center"
                >
                  BACK
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={!fullName.trim() || !email.trim() || !contactNumber.trim()}
                  onClick={() => setStep(3)}
                  className="bg-[#F6F2EB] disabled:opacity-50 hover:bg-white text-[#15161A] text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3 rounded-[2px] transition-colors shadow-md text-center"
                >
                  CONTINUE
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 3: REVIEW ---------------- */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="bg-[#17191E]/95 border border-[#272B35] rounded-[2px] p-4 sm:p-12 text-center shadow-2xl space-y-6"
            >
              <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                REVIEW YOUR RESERVATION
              </span>

              <h2 className="text-2xl sm:text-5xl font-serif font-normal text-white tracking-tight">
                {formatDisplayDate(date)}
              </h2>

              <div className="flex items-center justify-center gap-3 text-stone-300 text-sm sm:text-base font-light flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#C1A87D]" />
                  <span>{time}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#C1A87D]" />
                  <span>{partySize}</span>
                </div>
                <span>•</span>
                <span className="text-stone-400">{seating}</span>
              </div>

              <div className="max-w-md mx-auto bg-[#1F232B] border border-[#2D3340] rounded-[2px] p-4 text-xs text-left space-y-2">
                <div className="flex justify-between text-stone-300">
                  <span className="text-stone-400">Venue:</span>
                  <span className="font-medium text-white">{selectedLocationName}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span className="text-stone-400">Guest:</span>
                  <span className="font-medium text-white">{fullName}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span className="text-stone-400">Contact:</span>
                  <span>{contactNumber}</span>
                </div>
                {occasion !== "No occasion" && (
                  <div className="flex justify-between text-stone-300">
                    <span className="text-stone-400">Occasion:</span>
                    <span className="text-[#C1A87D]">{occasion}</span>
                  </div>
                )}
                {specialRequests && (
                  <div className="pt-1 border-t border-stone-800 text-stone-400">
                    <span className="text-stone-500 block mb-0.5">Special Requests:</span>
                    <span>{specialRequests}</span>
                  </div>
                )}
              </div>

              {submitError && (
                <div className="max-w-md mx-auto p-3 bg-red-950/40 border border-red-800/60 rounded-[2px] text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center sm:justify-end gap-3 pt-6 border-t border-stone-800/80">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep(2)}
                  className="bg-transparent hover:bg-stone-800 border border-stone-600 hover:border-white text-stone-200 text-xs font-semibold tracking-[0.16em] uppercase px-7 py-3 rounded-[2px] transition-colors text-center"
                >
                  BACK
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="bg-[#F6F2EB] disabled:opacity-50 hover:bg-white text-[#15161A] text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3 rounded-[2px] transition-colors shadow-md flex items-center justify-center gap-2 text-center"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? "CONFIRMING..." : "CONFIRM RESERVATION"}</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ---------------- STEP 4: CONFIRMATION SUCCESS ---------------- */}
          {step === 4 && confirmedReservation && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="text-center py-12 space-y-6"
            >
              {confirmedReservation.status === ReservationStatus.CONFIRMED ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#B99A63]/20 border border-[#B99A63]/40 flex items-center justify-center mx-auto text-[#B99A63] shadow-xl">
                    <CheckCircle2 className="w-8 h-8 stroke-[2]" />
                  </div>

                  <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                    BOOKING CONFIRMED
                  </span>

                  <h2 className="text-4xl sm:text-5xl lg:text-[58px] font-serif font-normal text-white tracking-tight leading-tight">
                    Your table is secured.
                  </h2>

                  <p className="text-stone-300 text-xs sm:text-sm font-light max-w-lg mx-auto leading-relaxed">
                    We look forward to welcoming you to {confirmedReservation.locationName}. A
                    confirmation has been logged in our dining manifest.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#525E50] border border-[#6B7A69] flex items-center justify-center mx-auto text-white shadow-xl">
                    <Clock className="w-7 h-7 stroke-[1.8]" />
                  </div>

                  <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                    REQUEST RECEIVED
                  </span>

                  <h2 className="text-4xl sm:text-5xl lg:text-[58px] font-serif font-normal text-white tracking-tight leading-tight">
                    Your table request is pending.
                  </h2>

                  <p className="text-stone-300 text-xs sm:text-sm font-light max-w-lg mx-auto leading-relaxed">
                    Thank you for your private dining reservation request. Our management team
                    will confirm your salon arrangement shortly.
                  </p>
                </>
              )}

              {/* Reference Card */}
              <div className="max-w-md mx-auto bg-[#181B22] border border-[#272B35] rounded-[2px] p-6 text-left space-y-3 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <span className="text-stone-400 uppercase tracking-widest text-[10px]">
                    BOOKING REFERENCE
                  </span>
                  <span className="font-mono text-base font-bold text-[#C1A87D] tracking-wider">
                    {confirmedReservation.reservationReference}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px]">VENUE</span>
                    <span className="text-white font-medium">
                      {confirmedReservation.locationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">STATUS</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase ${
                        confirmedReservation.status === "CONFIRMED"
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                          : "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                      }`}
                    >
                      {confirmedReservation.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">DATE & TIME</span>
                    <span className="text-white">
                      {confirmedReservation.reservationDate} · {confirmedReservation.reservationTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">GUESTS</span>
                    <span className="text-white">
                      {confirmedReservation.guestCount} Guests
                    </span>
                  </div>
                  {confirmedReservation.tableNumbers.length > 0 && (
                    <div className="col-span-2 pt-2 border-t border-stone-800 text-[11px] text-stone-300">
                      <span className="text-stone-400">Assigned Table: </span>
                      <span className="font-mono text-[#C1A87D]">
                        {confirmedReservation.tableNumbers.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-center gap-4">
                <Link
                  href={`/account/reservations`}
                  className="inline-flex items-center justify-center bg-[#F6F2EB] hover:bg-white text-[#15161A] text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3.5 rounded-[2px] transition-colors shadow-md"
                >
                  VIEW MY RESERVATIONS
                </Link>
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center bg-transparent border border-stone-700 hover:border-white text-stone-200 text-xs font-semibold tracking-[0.16em] uppercase px-7 py-3.5 rounded-[2px] transition-colors"
                >
                  EXPLORE MENU
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
