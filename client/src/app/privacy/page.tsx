"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Eye, FileText, Bell } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            LEGAL &amp; GOVERNANCE
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#9C958B] font-light max-w-2xl leading-relaxed">
            Effective Date: October 2026. At AURELLE, discretion and data protection are fundamental to our hospitality philosophy.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-[14px] leading-relaxed text-[#BAB3A8] font-light">
          <section className="space-y-3">
            <h2 className="font-serif text-xl text-white flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#B99A63]" />
              <span>1. Information We Collect</span>
            </h2>
            <p>
              When you reserve a table, book a VIP suite, place an order, or subscribe to our communications, we collect details necessary to tailor your dining experience. This includes guest names, contact telephone numbers, email addresses, dietary preferences, and billing details processed securely through encrypted channels.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-white flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[#B99A63]" />
              <span>2. Purpose &amp; Use of Personal Data</span>
            </h2>
            <p>
              Your data is utilized solely for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#C4BDAF]">
              <li>Confirming and managing reservations and private dining suites.</li>
              <li>Executing and coordinating takeaway orders with the kitchen.</li>
              <li>Accommodating medical allergies, intolerances, and bespoke dining requests.</li>
              <li>Delivering critical service notifications and booking confirmations via SMS or email.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-white flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-[#B99A63]" />
              <span>3. Data Protection &amp; Confidentiality</span>
            </h2>
            <p>
              AURELLE adheres to high standards of digital security. We never sell, lease, or monetize guest personal data with third-party advertisers. All staff handling customer records are bound by contractual non-disclosure agreements and role-based data governance policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-white flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#B99A63]" />
              <span>4. Guest Inquiries &amp; Rights</span>
            </h2>
            <p>
              You retain the right to request access to, correction of, or deletion of your profile data at any time. For privacy inquiries, please contact our Data Governance Officer at{" "}
              <a
                href="mailto:concierge@aurelledining.com"
                className="text-[#B99A63] hover:underline"
              >
                concierge@aurelledining.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
