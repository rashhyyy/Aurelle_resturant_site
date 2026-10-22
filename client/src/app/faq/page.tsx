"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HelpCircle, ArrowLeft, ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "Reservations",
    question: "How far in advance can I book a table?",
    answer: "Reservations for our main dining room and terrace open up to 30 days in advance. For VIP Private Salons and private banquet events, bookings can be secured up to 6 months in advance.",
  },
  {
    category: "Reservations",
    question: "What is your cancellation and grace period policy?",
    answer: "We hold tables for 15 minutes past your scheduled reservation time. Standard dining reservations can be cancelled with 2 hours advance notice at no charge directly via your customer account portal or concierge phone.",
  },
  {
    category: "Dining Experience",
    question: "Do you accommodate dietary requirements, allergies, and Halal preferences?",
    answer: "Yes. Our culinary team offers customized degustation courses for gluten-free, dairy-free, vegetarian, and Halal-conscious guests. Please specify any requirements upon booking or notify your captain.",
  },
  {
    category: "Dining Experience",
    question: "Is there an evening dress code?",
    answer: "AURELLE maintains an elegant dining atmosphere. We kindly request smart casual to formal attire for evening seatings. Athletic wear and beachwear are not permitted.",
  },
  {
    category: "Arrival & Parking",
    question: "Is valet parking available at the venue?",
    answer: "Complimentary private valet parking is provided for all dining and VIP suite guests directly at our main driveway on Main Street, Alawwa Town.",
  },
  {
    category: "Private Dining & Events",
    question: "How do I inquire about Private Dining Salons or Corporate Dinners?",
    answer: "You can submit an inquiry through our VIP & Events portal or contact our dedicated events director at concierge@aurelledining.com or +94 77 123 4567.",
  },
  {
    category: "Orders & Takeaway",
    question: "Can I pre-order gourmet takeaway dishes online?",
    answer: "Yes, you can select takeaway items from our online menu, choose an exact pickup timeslot, and track preparation status in real-time through our order tracking portal.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

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
            GUEST CONCIERGE &amp; GUIDANCE
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-[#9C958B] font-light max-w-2xl leading-relaxed">
            Essential information regarding dining reservations, culinary accommodations, private salon bookings, and venue etiquette.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-[#262B35] bg-[#16181D]/80 rounded-[2px] transition-colors duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left hover:text-[#B99A63] transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63]"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base sm:text-lg text-white font-normal pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#B99A63] flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-[#BAB3A8] font-light leading-relaxed border-t border-[#232730]/60">
                    <p>{item.answer}</p>
                    <span className="inline-block mt-3 text-[10px] uppercase tracking-wider text-[#B99A63]/80 font-medium">
                      Category: {item.category}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="pt-8 border-t border-[#23211F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg text-white">Have a specific request?</h3>
            <p className="text-xs text-[#9C958B] font-light mt-0.5">
              Our concierge team is at your disposal daily from 10:00 AM to 10:00 PM.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#B99A63] text-black font-medium text-xs tracking-wider uppercase hover:bg-white transition-colors duration-200 rounded-[1px]"
          >
            Contact Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
