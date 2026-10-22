"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "../../lib/api";

import { SPACES, SpaceDetail } from "../../data/spaces";

const CATEGORIES = ["All spaces", "Intimate", "Celebrations", "Business"];

export default function VipEventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All spaces");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState("Birthday");
  const [guests, setGuests] = useState("");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedInquiry, setConfirmedInquiry] = useState<any | null>(null);

  const filteredSpaces = useMemo(() => {
    if (selectedCategory === "All spaces") return SPACES;
    return SPACES.filter((space) =>
      space.categories.includes(selectedCategory),
    );
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      let budgetMinor: number | undefined;
      if (budget) {
        const numeric = parseFloat(budget.replace(/[^0-9.]/g, ''));
        if (!isNaN(numeric) && numeric > 0) {
          budgetMinor = Math.round(numeric * 100);
        }
      }

      const payload = {
        locationId: 'loc-colombo-main',
        eventType,
        preferredDate: date || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
        preferredTime: '19:00',
        guestCount: parseInt(guests, 10) || 6,
        requirements: message || 'Private dining inquiry for Aurelle VIP salon',
        budgetMinor,
        currency: 'LKR',
        guestName: name.trim(),
        guestEmail: email.trim().toLowerCase(),
        guestPhone: phone.trim() || '+94 77 123 4567',
      };

      const res = await apiClient.post<any>('/api/vip/inquiries', payload);
      setConfirmedInquiry(res);
    } catch (err: any) {
      console.error('Inquiry submission error:', err);
      setSubmitError(err?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 pb-28">
      {/* ======================================================== */}
      {/* 1. HERO HEADER WITH MOODY PRIVATE DINING ROOM            */}
      {/* ======================================================== */}
      <section data-hero="true" className="relative w-full h-[62vh] min-h-[440px] sm:min-h-[480px] max-h-[580px] flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=90&w=2400&auto=format&fit=crop"
            alt="Aurelle private dining room setting"
            fill
            priority
            quality={95}
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
            PRIVATE DINING
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-[72px] font-serif font-normal text-white keep-white tracking-tight leading-[1.08] drop-shadow-md"
          >
            A room of your own.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="text-stone-200 keep-white text-xs sm:text-[13px] font-light leading-relaxed max-w-2xl mx-auto pt-2 drop-shadow-sm"
          >
            Beautifully composed spaces, thoughtful menus and discreet service
            for meaningful occasions.
          </motion.p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SPACES GALLERY & CATEGORY FILTERS                     */}
      {/* ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-16">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-3 flex-wrap mb-10">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${
                  isSelected
                    ? "bg-white text-black font-semibold shadow-md"
                    : "bg-[#181B22] text-stone-300 border border-[#272B35] hover:border-stone-500 hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 3 Space Cards Grid matching Figma */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredSpaces.map((space) => (
              <motion.div
                key={space.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className="bg-[#181B22] border border-[#242833] rounded-[2px] flex flex-col justify-between overflow-hidden group hover:border-[#383E4E] transition-colors shadow-2xl"
              >
                {/* Space Image */}
                <Link
                  href={`/vip-events/${space.id}`}
                  className="relative w-full h-72 sm:h-80 overflow-hidden bg-black block group/img"
                  aria-label={`View details for ${space.name}`}
                >
                  <Image
                    src={space.image}
                    alt={space.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181B22] via-transparent to-transparent opacity-80" />
                </Link>

                {/* Content Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium block">
                      {space.tag}
                    </span>
                    <h3 className="font-serif text-2xl text-white font-normal tracking-wide mt-1.5 hover:text-[#C1A87D] transition-colors">
                      <Link href={`/vip-events/${space.id}`}>{space.name}</Link>
                    </h3>
                    <p className="text-stone-400 text-xs sm:text-[13px] font-light mt-1">
                      {space.capacity}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-stone-800/80">
                    <Link
                      href={`/vip-events/${space.id}`}
                      className="group/link inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. REQUEST A PRIVATE ROOM ENQUIRY FORM                   */}
      {/* ======================================================== */}
      <section
        id="enquiry-form"
        className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 mt-24"
      >
        <div className="bg-[#566453] text-[#F1EFEA] rounded-[2px] p-8 sm:p-14 lg:p-16 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left Title Column */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[11px] uppercase tracking-[0.28em] text-[#D8E0D5] font-medium block">
                START A CONVERSATION
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-serif font-normal text-white leading-[1.12] tracking-tight">
                Request a <br />
                private room
              </h2>
              <p className="text-[#D8E0D5]/90 text-xs sm:text-sm font-light leading-relaxed max-w-sm pt-2">
                Share your preferences and our private dining concierge will respond with bespoke availability and a personalized proposal.
              </p>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7">
              {confirmedInquiry ? (
                <div className="bg-[#465343] p-8 rounded-[2px] text-center space-y-4 border border-white/10">
                  <CheckCircle2 className="w-10 h-10 text-white mx-auto" />
                  <h3 className="font-serif text-2xl text-white">
                    Enquiry Received
                  </h3>
                  <div className="inline-block bg-white/10 px-4 py-1.5 rounded text-xs font-mono tracking-wider text-[#C1A87D]">
                    Reference: {confirmedInquiry.inquiryReference}
                  </div>
                  <p className="text-xs text-stone-200 font-light max-w-md mx-auto">
                    Thank you, {confirmedInquiry.guestName}. We have recorded your private dining enquiry in our reservation ledger. Our private dining concierge will review your requirements and issue an event proposal shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmedInquiry(null)}
                    className="text-xs uppercase tracking-wider text-white underline pt-2"
                  >
                    Submit another enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {submitError && (
                    <div className="p-4 bg-red-900/40 border border-red-500/50 rounded text-red-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Row 1: Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#D8E0D5] font-medium block mb-2">
                        NAME
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#465343] border border-[#6B7967] rounded-[2px] px-4 py-3 text-sm text-white placeholder-[#C6D2C2]/50 outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#D8E0D5] font-medium block mb-2">
                        EMAIL
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#465343] border border-[#6B7967] rounded-[2px] px-4 py-3 text-sm text-white placeholder-[#C6D2C2]/50 outline-none focus:border-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 2: Event Type & Guests */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#D8E0D5] font-medium block mb-2">
                        EVENT TYPE
                      </label>
                      <div className="relative">
                        <select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value)}
                          className="w-full appearance-none bg-[#465343] border border-[#6B7967] rounded-[2px] px-4 py-3 pr-9 text-sm text-white outline-none focus:border-white cursor-pointer transition-colors"
                        >
                          <option
                            value="Birthday"
                            className="bg-[#3D473B] text-white"
                          >
                            Birthday
                          </option>
                          <option
                            value="Corporate / Business"
                            className="bg-[#3D473B] text-white"
                          >
                            Corporate / Business
                          </option>
                          <option
                            value="Anniversary"
                            className="bg-[#3D473B] text-white"
                          >
                            Anniversary
                          </option>
                          <option
                            value="Private Tasting Dinner"
                            className="bg-[#3D473B] text-white"
                          >
                            Private Tasting Dinner
                          </option>
                          <option
                            value="Other Celebration"
                            className="bg-[#3D473B] text-white"
                          >
                            Other Celebration
                          </option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#D8E0D5] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#D8E0D5] font-medium block mb-2">
                        GUESTS
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full bg-[#465343] border border-[#6B7967] rounded-[2px] px-4 py-3 text-sm text-white placeholder-[#C6D2C2]/50 outline-none focus:border-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 3: Date & Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#D8E0D5] font-medium block mb-2">
                        PREFERRED DATE
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[#465343] border border-[#6B7967] rounded-[2px] px-4 py-3 text-sm text-white outline-none focus:border-white transition-colors [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#D8E0D5] font-medium block mb-2">
                        ESTIMATED BUDGET
                      </label>
                      <input
                        type="text"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g. LKR 150,000"
                        className="w-full bg-[#465343] border border-[#6B7967] rounded-[2px] px-4 py-3 text-sm text-white placeholder-[#C6D2C2]/50 outline-none focus:border-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 4: Tell us about your event */}
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#D8E0D5] font-medium block mb-2">
                      TELL US ABOUT YOUR EVENT
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-[#465343] border border-[#6B7967] rounded-[2px] p-4 text-sm text-white placeholder-[#C6D2C2]/50 outline-none focus:border-white transition-colors resize-none"
                    />
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={isSubmitting}
                      type="submit"
                      className="bg-white hover:bg-stone-100 disabled:opacity-50 text-[#1A1A1A] text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3.5 rounded-[2px] transition-colors shadow-md flex items-center gap-2"
                    >
                      {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isSubmitting ? 'SUBMITTING ENQUIRY...' : 'SUBMIT EVENT ENQUIRY'}</span>
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
