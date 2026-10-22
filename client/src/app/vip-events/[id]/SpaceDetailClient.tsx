"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Maximize2,
  CheckCircle2,
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  Send,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "../../../lib/api";
import { SpaceDetail, SPACES } from "../../../data/spaces";

interface SpaceDetailClientProps {
  space: SpaceDetail;
}

export default function SpaceDetailClient({ space }: SpaceDetailClientProps) {
  const [activeImage, setActiveImage] = useState(space.image);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedInquiry, setConfirmedInquiry] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "Private Celebration",
    guests: "",
    date: "",
    message: "",
  });

  const currentIndex = SPACES.findIndex((s) => s.id === space.id);
  const nextSpace = SPACES[(currentIndex + 1) % SPACES.length];
  const prevSpace = SPACES[(currentIndex - 1 + SPACES.length) % SPACES.length];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        locationId: 'loc-colombo-main',
        eventType: formData.eventType,
        preferredDate: formData.date || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
        preferredTime: '19:00',
        guestCount: parseInt(formData.guests, 10) || 8,
        preferredRoomId: space.id,
        requirements: formData.message || `Private booking enquiry for ${space.name}`,
        currency: 'LKR',
        guestName: formData.name.trim(),
        guestEmail: formData.email.trim().toLowerCase(),
        guestPhone: formData.phone.trim() || '+94 77 123 4567',
      };

      const res = await apiClient.post<any>('/api/vip/inquiries', payload);
      setConfirmedInquiry(res);
    } catch (err: any) {
      console.error('Inquiry submission error:', err);
      setSubmitError(err?.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById("request-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 pb-28">
      {/* ======================================================== */}
      {/* 1. CINEMATIC HERO SECTION                                */}
      {/* ======================================================== */}
      <section data-hero="true" className="relative w-full h-[68vh] min-h-[500px] sm:min-h-[540px] max-h-[640px] flex items-end overflow-hidden pb-16 sm:pb-20">
        <motion.div
          key={activeImage}
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={activeImage}
            alt={space.name}
            fill
            priority
            quality={95}
            className="object-cover object-center brightness-[1.06] contrast-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/35 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-transparent pointer-events-none" />
        </motion.div>

        {/* Content Box */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 w-full">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link
              href="/vip-events"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#C1A87D] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all spaces</span>
            </Link>
          </motion.div>

          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium bg-[#1F221B]/90 border border-[#C1A87D]/40 px-3.5 py-1 rounded-[2px]">
                {space.tag}
              </span>
              <span className="text-xs text-stone-200 keep-white font-light tracking-wider drop-shadow-sm">
                {space.capacity}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[70px] font-serif font-normal text-white keep-white tracking-tight leading-[1.08] drop-shadow-md">
              {space.name}
            </h1>

            <p className="font-serif italic text-lg sm:text-xl text-stone-200 keep-white font-light drop-shadow-sm">
              {space.subtitle}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToForm}
                className="inline-flex items-center gap-2 bg-[#C1A87D] hover:bg-[#D5BF96] text-black text-xs font-semibold tracking-[0.18em] uppercase px-7 py-3.5 rounded-[2px] transition-colors shadow-lg cursor-pointer"
              >
                <span>REQUEST THIS ROOM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-stone-200 hover:text-white border border-stone-500 hover:border-white text-xs font-semibold tracking-[0.16em] uppercase px-7 py-3.5 rounded-[2px] transition-colors"
              >
                <span>CONTACT CONCIERGE</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. GALLERY THUMBNAILS & KEY SPECIFICATIONS BAR           */}
      {/* ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 -mt-10 relative z-20">
        <div className="bg-[#181B22]/95 backdrop-blur-md border border-[#272B35] rounded-[2px] p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-stone-800">
            <div className="flex items-center gap-3.5 sm:px-4">
              <div className="w-10 h-10 rounded-full bg-[#202530] border border-[#2D3342] flex items-center justify-center text-[#C1A87D] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                  Capacity
                </span>
                <span className="font-serif text-sm sm:text-base text-white">
                  {space.guestsCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:px-4 pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-full bg-[#202530] border border-[#2D3342] flex items-center justify-center text-[#C1A87D] shrink-0">
                <Maximize2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                  Dimensions
                </span>
                <span className="font-serif text-sm sm:text-base text-white">
                  {space.squareMeters}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:px-4 pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-full bg-[#202530] border border-[#2D3342] flex items-center justify-center text-[#C1A87D] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                  Service
                </span>
                <span className="font-serif text-sm sm:text-base text-white">
                  Dedicated Brigade
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 sm:px-4 pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-full bg-[#202530] border border-[#2D3342] flex items-center justify-center text-[#C1A87D] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                  Exclusivity
                </span>
                <span className="font-serif text-sm sm:text-base text-white">
                  100% Private
                </span>
              </div>
            </div>
          </div>

          {/* Photo Switcher Row */}
          {space.gallery.length > 1 && (
            <div className="mt-6 pt-6 border-t border-stone-800/80">
              <span className="text-[10px] uppercase tracking-[0.24em] text-stone-400 font-medium block mb-3">
                VIEW ROOM ANGLES:
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {space.gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`relative w-24 h-16 rounded-[2px] overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImage === imgUrl
                        ? "border-[#C1A87D] scale-105 shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${space.name} view ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. MAIN DETAILS CONTENT GRID                             */}
      {/* ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Description & Menus */}
          <div className="lg:col-span-8 space-y-12">
            {/* Overview */}
            <div className="space-y-4">
              <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                ABOUT THE SPACE
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
                Architectural character &amp; atmosphere
              </h2>
              <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed">
                {space.overview}
              </p>
              <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed pt-1">
                {space.atmosphere}
              </p>
            </div>

            {/* Features Checklist */}
            <div className="bg-[#181B22] border border-[#272B35] rounded-[2px] p-8 space-y-5 shadow-xl">
              <h3 className="font-serif text-xl text-white">
                Space Inclusions &amp; Amenities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {space.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#C1A87D] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-[13px] text-stone-300 font-light">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curated Menus for This Space */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.26em] text-[#C1A87D] font-medium">
                <UtensilsCrossed className="w-4 h-4" />
                <span>CURATED MENUS FOR THIS SPACE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
                Degustation &amp; Banquet Formats
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {space.menusAvailable.map((menu, idx) => (
                  <div
                    key={idx}
                    className="bg-[#181B22] border border-[#272B35] rounded-[2px] p-6 sm:p-7 flex flex-col justify-between shadow-xl space-y-4 hover:border-[#C1A87D]/40 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#C1A87D] font-medium">
                        PACKAGE {idx + 1}
                      </span>
                      <h4 className="font-serif text-xl text-white font-normal mt-1">
                        {menu.title}
                      </h4>
                      <p className="text-xs text-stone-400 font-light mt-2 leading-relaxed">
                        {menu.description}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-stone-800">
                      <span className="font-sans text-sm font-semibold text-white">
                        {menu.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Key Amenities & Quick Reserve Card */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#181B22] border border-[#272B35] rounded-[2px] p-6 sm:p-7 space-y-5 shadow-xl">
              <span className="text-[10.5px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium block">
                KEY SPECIFICATIONS
              </span>
              <ul className="space-y-3.5 divide-y divide-stone-800 text-xs">
                {space.amenities.map((item, idx) => (
                  <li key={idx} className="pt-3.5 first:pt-0">
                    <span className="text-stone-400 block text-[10.5px] uppercase tracking-wider mb-0.5">
                      {item.label}
                    </span>
                    <span className="text-white font-light text-xs sm:text-[13px]">
                      {item.detail}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="w-full bg-[#C1A87D] hover:bg-[#D5BF96] text-black text-xs font-semibold tracking-[0.16em] uppercase py-3.5 rounded-[2px] transition-colors shadow-md cursor-pointer"
                >
                  CHECK AVAILABILITY
                </button>
              </div>
            </div>

            {/* Other Spaces Navigation Card */}
            <div className="bg-[#14161A] border border-stone-800 rounded-[2px] p-6 space-y-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium block">
                EXPLORE ANOTHER SPACE
              </span>
              <h4 className="font-serif text-lg text-white hover:text-[#C1A87D] transition-colors">
                <Link href={`/vip-events/${nextSpace.id}`}>
                  {nextSpace.name} &rarr;
                </Link>
              </h4>
              <p className="text-xs text-stone-400 font-light">
                {nextSpace.capacity}
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. SPECIFIC ENQUIRY FORM FOR THIS ROOM                   */}
      {/* ======================================================== */}
      <section
        id="request-form"
        className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-24 scroll-mt-24"
      >
        <div className="bg-[#566453] text-[#F1EFEA] rounded-[2px] p-8 sm:p-14 lg:p-16 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[11px] uppercase tracking-[0.28em] text-[#D8E0D5] font-medium block">
                RESERVATION REQUEST
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-normal text-white leading-[1.12] tracking-tight">
                Request {space.name}
              </h2>
              <p className="text-[#D8E0D5]/90 text-xs sm:text-sm font-light leading-relaxed pt-2">
                Submit your date and party size. Our private events manager will
                confirm availability and prepare custom tasting proposals.
              </p>
              <div className="pt-4 text-xs text-stone-200 space-y-1">
                <p>• Room: {space.name}</p>
                <p>• Suitable for: {space.capacity}</p>
                <p>• Concierge direct: +94 37 227 8890</p>
              </div>
            </div>

            <div className="lg:col-span-7">
              {confirmedInquiry ? (
                <div className="bg-[#465343] p-8 rounded-[2px] text-center space-y-4 border border-white/10">
                  <CheckCircle2 className="w-10 h-10 text-white mx-auto" />
                  <h3 className="font-serif text-2xl text-white">
                    Request Submitted for {space.name}
                  </h3>
                  <div className="inline-block bg-white/10 px-4 py-1.5 rounded text-xs font-mono tracking-wider text-[#C1A87D]">
                    Reference: {confirmedInquiry.inquiryReference}
                  </div>
                  <p className="text-xs text-stone-200 font-light max-w-md mx-auto">
                    Thank you, {confirmedInquiry.guestName || "Guest"}. We have registered your
                    request for {space.name}. Our private dining concierge will
                    contact you shortly with personalized arrangements.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmedInquiry(null)}
                    className="text-xs text-white underline underline-offset-4 uppercase tracking-wider"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-red-900/40 border border-red-500/50 rounded text-red-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#D8E0D5] block mb-1">
                        YOUR NAME *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g. Kasun Perera"
                        className="w-full bg-[#465343] border border-white/20 rounded-[2px] px-3.5 py-3 text-xs text-white placeholder-white/40 outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#D8E0D5] block mb-1">
                        EMAIL ADDRESS *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="e.g. kasun@example.com"
                        className="w-full bg-[#465343] border border-white/20 rounded-[2px] px-3.5 py-3 text-xs text-white placeholder-white/40 outline-none focus:border-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#D8E0D5] block mb-1">
                        PHONE NUMBER
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+94 77 123 4567"
                        className="w-full bg-[#465343] border border-white/20 rounded-[2px] px-3.5 py-3 text-xs text-white placeholder-white/40 outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#D8E0D5] block mb-1">
                        NUMBER OF GUESTS
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.guests}
                        onChange={(e) =>
                          setFormData({ ...formData, guests: e.target.value })
                        }
                        placeholder="e.g. 8"
                        className="w-full bg-[#465343] border border-white/20 rounded-[2px] px-3.5 py-3 text-xs text-white placeholder-white/40 outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#D8E0D5] block mb-1">
                        PREFERRED DATE
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full bg-[#465343] border border-white/20 rounded-[2px] px-3.5 py-3 text-xs text-white outline-none focus:border-white transition-colors cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#D8E0D5] block mb-1">
                      NOTES / OCCASION DETAILS
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder={`Tell us about dietary preferences or specific requests for ${space.name}...`}
                      className="w-full bg-[#465343] border border-white/20 rounded-[2px] p-3 text-xs text-white placeholder-white/40 outline-none focus:border-white transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSubmitting}
                      type="submit"
                      className="inline-flex items-center gap-2 bg-[#F6F2EB] hover:bg-white disabled:opacity-50 text-[#1c1c1c] text-[11px] font-semibold tracking-[0.16em] uppercase px-7 py-3.5 transition-colors shadow-md cursor-pointer"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{isSubmitting ? 'SUBMITTING...' : `SUBMIT REQUEST FOR ${space.name}`}</span>
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
