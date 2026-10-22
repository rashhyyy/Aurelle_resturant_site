"use client";

import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, Clock, AlertCircle, Sparkles } from "lucide-react";

export default function TermsAndConditionsPage() {
  return (
    <div className="w-full min-h-screen bg-[#111215] text-[#ECE7DF] pt-32 pb-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B99A63] hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>

        {/* Header */}
        <div className="border-b border-[#23211F] pb-8 space-y-3">
          <span className="text-[11px] uppercase tracking-[0.28em] text-[#B99A63] font-medium block">
            TERMS &amp; GUEST ETIQUETTE
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-white tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-[#9C958B] font-light max-w-2xl leading-relaxed">
            Effective Date: October 2026. By dining with AURELLE, reserving a table, or booking a private salon, you agree to the hospitality standards outlined herein.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-[14px] leading-relaxed text-[#BAB3A8] font-light">
          <section className="space-y-3">
            <h2 className="font-serif text-xl text-white flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#B99A63]" />
              <span>1. Reservations &amp; Arrival Punctuality</span>
            </h2>
            <p>
              To maintain our culinary rhythm and ensure each course is served at its intended temperature, tables are held for a grace period of 15 minutes beyond your reservation time. If your party is delayed, please inform our concierge promptly. Parties arriving past the grace period without notice may have their table reassigned to waitlisted patrons.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-white flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#B99A63]" />
              <span>2. Cancellations &amp; Modifications</span>
            </h2>
            <p>
              Standard dining reservations may be cancelled without penalty up to 2 hours prior to seating. Private VIP salons and customized banquet events require 48 hours notice for deposit refunds due to specialized procurement of seasonal ingredients.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-white flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#B99A63]" />
              <span>3. Dress Code &amp; Dining Ambience</span>
            </h2>
            <p>
              AURELLE cultivates an elegant, intimate atmosphere. We request smart casual to formal attire for evening dining. Athletic wear, swimwear, and casual flip-flops are strictly precluded. We kindly request that guests maintain respectful volume on mobile devices within our main dining room.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-white flex items-center gap-2.5">
              <Scale className="w-4 h-4 text-[#B99A63]" />
              <span>4. Dietary Requirements &amp; Allergies</span>
            </h2>
            <p>
              While our kitchen exercises care in accommodating allergies and intolerances, our open prep stations handle allergens including shellfish, nuts, dairy, and gluten. Please notify your captain before ordering so our culinary team can take appropriate sanitization protocols.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
