"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const TRADITIONS = [
  { id: "01", title: "Sri Lankan", href: "/menu?category=Sri+Lankan#menu-items" },
  { id: "02", title: "Indian", href: "/menu?category=Indian#menu-items" },
  { id: "03", title: "East Asian", href: "/menu?category=East+Asian#menu-items" },
  { id: "04", title: "Plant-led", href: "/menu?category=Plant-led#menu-items" },
];

export default function ExperienceSection() {
  return (
    <section className="w-full bg-[#111215] text-stone-100 py-16 lg:py-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 space-y-24 lg:space-y-32">
        {/* ========================================================= */}
        {/* PART 1: RESERVATIONS SPLIT BLOCK (Image + Olive Green Box) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px] overflow-hidden shadow-2xl">
          {/* Left: Dining Hall Interior Image */}
          <div className="relative min-h-[360px] lg:min-h-full w-full">
            <Image
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop"
              alt="Aurelle dining room ambience"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* Right: Olive/Sage Panel */}
          <div className="bg-[#566453] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-[#F1EFEA]">
            <div>
              <span className="text-[11px] uppercase tracking-[0.28em] text-[#D8E0D5] font-medium block">
                RESERVATIONS
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-normal text-white mt-3 leading-[1.15] tracking-tight">
                Make an evening of it
              </h2>
              <p className="text-[#D8E0D5]/90 text-xs sm:text-sm font-light leading-relaxed mt-4 max-w-md">
                From an intimate dinner to a long-awaited celebration, select
                your preferred date and we&apos;ll show the available times
                provided by the restaurant.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/20">
              {/* Inline Selection Indicators */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C6D2C2] block">
                    DATE
                  </span>
                  <span className="font-serif text-sm sm:text-base text-white mt-0.5 block">
                    Fri, 18 Oct
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C6D2C2] block">
                    GUESTS
                  </span>
                  <span className="font-serif text-sm sm:text-base text-white mt-0.5 block">
                    2 people
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C6D2C2] block">
                    TIME
                  </span>
                  <span className="font-serif text-sm sm:text-base text-white mt-0.5 block">
                    7:30 PM
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Link
                  href="/reservations"
                  className="inline-flex items-center gap-2 bg-[#F6F2EB] hover:bg-white text-[#1c1c1c] text-[11px] font-semibold tracking-[0.16em] uppercase px-6 py-3 transition-colors shadow-md"
                >
                  <span>FIND A TABLE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PART 2: TRADITIONS HORIZONTAL GRID                       */}
        {/* ========================================================= */}
        <div>
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-stone-400 font-medium block">
            EXPLORE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-normal text-white mt-2 tracking-tight">
            Many traditions. One point of view.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 mt-10 border border-stone-800/80 bg-[#15171C]/70 divide-y sm:divide-y-0 sm:divide-x divide-stone-800/80">
            {TRADITIONS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group relative p-8 sm:p-10 flex flex-col justify-between min-h-[220px] hover:bg-[#1C1F26] transition-colors duration-300"
              >
                <span className="text-[11px] text-stone-500 font-mono">
                  {item.id}
                </span>

                <div className="flex items-end justify-between mt-12">
                  <h3 className="font-serif text-xl sm:text-2xl text-stone-200 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-stone-500 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-[#C1A87D]" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* PART 3: PRIVATE DINING SPLIT (Text Left + Image Right)    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-5 space-y-5">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
              PRIVATE DINING
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-serif font-normal text-white leading-[1.12] tracking-tight">
              An occasion, entirely your own
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed max-w-md">
              Thoughtful menus, discreet service and beautiful rooms for the
              moments worth gathering for.
            </p>

            <div className="pt-2">
              <Link
                href="/vip-events"
                className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-stone-200 hover:text-white border-b border-stone-600 hover:border-[#C1A87D] pb-1 transition-colors"
              >
                EXPLORE PRIVATE DINING
              </Link>
            </div>
          </div>

          {/* Right Image Column */}
          <div className="lg:col-span-7 relative h-[380px] sm:h-[480px] lg:h-[540px] w-full overflow-hidden shadow-2xl rounded-sm">
            <Image
              src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop"
              alt="Private intimate dining setting"
              fill
              className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* ========================================================= */}
        {/* PART 4: OUR PHILOSOPHY (Chef Image Left + Text Right)     */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left Chef Kitchen Image */}
          <div className="lg:col-span-6 relative h-[380px] sm:h-[480px] lg:h-[560px] w-full overflow-hidden shadow-2xl rounded-sm">
            <Image
              src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=1200&auto=format&fit=crop"
              alt="Aurelle chef working in culinary kitchen"
              fill
              className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />
          </div>

          {/* Right Philosophy Content */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
              OUR PHILOSOPHY
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-[54px] font-serif font-normal text-white leading-[1.08] tracking-tight">
              Global in outlook. <br />
              Grounded in place.
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed max-w-lg">
              AURELLE is an illustrative modern restaurant concept built around
              flavour, thoughtful timing and understated warmth. Our menus move
              between traditions without losing sight of where we are.
            </p>

            <div className="pt-2">
              <Link
                href="/our-story"
                className="group inline-flex items-center gap-2 text-xs text-stone-200 hover:text-white transition-colors"
              >
                <span>Meet our chefs</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PART 5: THE JOURNAL HEADER                                */}
        {/* ========================================================= */}
        <div className="border-t border-stone-800/80 pt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-stone-400 font-medium block">
                THE JOURNAL
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-normal text-white mt-2 tracking-tight">
                Stories from the table
              </h2>
            </div>

            <Link
              href="/journal"
              className="group inline-flex items-center gap-2 text-xs tracking-wider text-stone-300 hover:text-white uppercase font-medium whitespace-nowrap"
            >
              <span>Browse all stories</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
