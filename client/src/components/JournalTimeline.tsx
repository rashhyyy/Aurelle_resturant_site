"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function JournalTimeline() {
  return (
    <section className="relative w-full bg-[#1F232D] text-stone-100 py-20 lg:py-28 overflow-hidden select-none">
      {/* Decorative ambient background rings matching Figma */}
      <div className="absolute top-44 -left-16 w-72 h-72 rounded-full border border-stone-600/15 pointer-events-none" />
      <div className="absolute top-[55%] -right-20 w-80 h-80 rounded-full border border-stone-600/15 pointer-events-none" />
      <div className="absolute bottom-24 -left-16 w-72 h-72 rounded-full border border-stone-600/15 pointer-events-none" />

      {/* Responsive Central Container */}
      <div className="relative max-w-[1080px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-20 sm:mb-28">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-stone-400 font-medium block">
              THE JOURNAL
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-normal text-white mt-2 tracking-tight">
              Stories from the table
            </h2>
          </div>

          <Link
            href="/recipes"
            className="group inline-flex items-center gap-2 text-xs tracking-wider text-stone-300 hover:text-white uppercase font-medium whitespace-nowrap"
          >
            <span>Browse all stories</span>
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Continuous S-Curve Pathway SVG Background Layer */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1000 1850"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M 230 180 
                 C 320 180, 520 230, 600 370 
                 C 670 480, 740 540, 770 600 
                 C 770 780, 500 840, 360 900 
                 C 250 960, 230 1080, 230 1160 
                 C 230 1330, 560 1420, 770 1520"
              stroke="#D8C59A"
              strokeWidth="1.75"
              strokeOpacity="0.5"
            />
          </svg>
        </div>

        {/* ========================================================= */}
        {/* ROW 1: Ceylon Cinnamon (500 GR)                           */}
        {/* ========================================================= */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 mb-28 lg:mb-32">
          {/* Dish Link */}
          <Link
            href="/journal/ceylon-cinnamon"
            className="group relative w-72 h-72 sm:w-80 sm:h-80 flex-shrink-0 flex items-center justify-center cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full border border-stone-500/20 scale-110 pointer-events-none" />

            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-3 bg-gradient-to-b from-[#18191D] via-[#0E0F12] to-[#050506] shadow-[0_25px_50px_rgba(0,0,0,0.85)] border border-[#2B2E37]">
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-inner">
                <Image
                  src="https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=90&w=800&auto=format&fit=crop"
                  alt="Ceylon Cinnamon on spoon"
                  fill
                  sizes="300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <span className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#E3D1A5] text-[#1D212B] text-[9.5px] font-bold tracking-widest px-2 py-0.5 rounded-[2px] shadow-md z-20">
              500 GR
            </span>

            <div className="hidden lg:block absolute top-5 right-2 w-3.5 h-3.5 rounded-full bg-[#E3D1A5] border-2 border-[#1F232D] shadow-[0_0_8px_#E3D1A5] z-20" />
          </Link>

          {/* Description Card */}
          <div className="relative w-full max-w-md lg:-ml-12 z-10">
            <Link
              href="/journal/ceylon-cinnamon"
              className="block bg-[#262A35]/85 backdrop-blur-md border border-white/5 rounded-[4px] p-7 sm:p-8 shadow-2xl hover:border-white/15 transition-all group"
            >
              <span className="text-[10px] uppercase tracking-widest text-[#C1A87D] font-mono block mb-1">
                INGREDIENTS · 6 MIN
              </span>
              <h3 className="text-3xl sm:text-[34px] font-serif text-white tracking-wide leading-tight group-hover:text-[#E3D1A5] transition-colors">
                Ceylon Cinnamon
              </h3>
              <h4 className="text-base sm:text-lg font-serif italic text-stone-300 mt-0.5 font-light">
                The Quiet Complexity
              </h4>
              <p className="text-stone-400 text-xs font-light leading-relaxed mt-3.5">
                Harvested from southern coastal groves, true Ceylon cinnamon
                yields delicate floral sweetness, layered citrus notes, and
                centuries of artisan craft.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <span className="text-[11px] font-sans tracking-[0.16em] lowercase text-stone-300 group-hover:text-[#E3D1A5] transition-colors">
                  read story
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#E3D1A5]" />
              </div>
            </Link>

            {/* Floating Basil Leaf Ornament */}
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, 4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-6 pointer-events-none select-none z-20"
            >
              <span className="text-4xl filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)]">
                🌿
              </span>
            </motion.div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 2: Balancing Heat (410 GR) -> Navigates to Article    */}
        {/* ========================================================= */}
        <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between gap-8 mb-28 lg:mb-32">
          {/* Description Card */}
          <div className="relative w-full max-w-md lg:-mr-12 z-10">
            <Link
              href="/journal/balancing-heat"
              className="block bg-[#262A35]/85 backdrop-blur-md border border-white/5 rounded-[4px] p-7 sm:p-8 shadow-2xl hover:border-white/15 transition-all group"
            >
              <span className="text-[10px] uppercase tracking-widest text-[#C1A87D] font-mono block mb-1">
                TECHNIQUE · 8 MIN
              </span>
              <h3 className="text-3xl sm:text-[34px] font-serif text-white tracking-wide leading-tight group-hover:text-[#E3D1A5] transition-colors">
                Balancing Heat
              </h3>
              <h4 className="text-base sm:text-lg font-serif italic text-stone-300 mt-0.5 font-light">
                A Chef&apos;s Guide
              </h4>
              <p className="text-stone-400 text-xs font-light leading-relaxed mt-3.5">
                Chilli is most compelling when it creates momentum rather than
                noise. The craft lies in shaping heat with acidity, sweetness,
                richness, aroma, and texture.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <span className="text-[11px] font-sans tracking-[0.16em] lowercase text-stone-300 group-hover:text-[#E3D1A5] transition-colors">
                  read story
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#E3D1A5]" />
              </div>
            </Link>

            {/* Small White Sauce Ramekin Bowl on Left Node */}
            <div className="hidden lg:flex absolute -left-14 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-stone-500/50 bg-[#E8E8E8] shadow-lg items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-[#FAFAFA] border border-stone-300 shadow-inner" />
            </div>
          </div>

          {/* Dish Right */}
          <Link
            href="/journal/balancing-heat"
            className="group relative w-72 h-72 sm:w-80 sm:h-80 flex-shrink-0 flex items-center justify-center cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full border border-stone-500/20 scale-110 pointer-events-none" />

            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-3 bg-gradient-to-b from-[#18191D] via-[#0E0F12] to-[#050506] shadow-[0_25px_50px_rgba(0,0,0,0.85)] border border-[#2B2E37]">
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-inner">
                <Image
                  src="https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=90&w=900&auto=format&fit=crop"
                  alt="Red hot chillies on black plate"
                  fill
                  sizes="300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <span className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#E3D1A5] text-[#1D212B] text-[9.5px] font-bold tracking-widest px-2 py-0.5 rounded-[2px] shadow-md z-20">
              410 GR
            </span>

            <div className="hidden lg:block absolute bottom-8 left-0 w-3.5 h-3.5 rounded-full bg-[#E3D1A5] border-2 border-[#1F232D] shadow-[0_0_8px_#E3D1A5] z-20" />
          </Link>
        </div>

        {/* ========================================================= */}
        {/* ROW 3: Taco Soup Recipe (430 GR)                          */}
        {/* ========================================================= */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 mb-28 lg:mb-32">
          {/* Dish Left */}
          <Link
            href="/journal/taco-soup"
            className="group relative w-72 h-72 sm:w-80 sm:h-80 flex-shrink-0 flex items-center justify-center cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full border border-stone-500/20 scale-110 pointer-events-none" />

            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-3 bg-gradient-to-b from-[#18191D] via-[#0E0F12] to-[#050506] shadow-[0_25px_50px_rgba(0,0,0,0.85)] border border-[#2B2E37]">
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-inner">
                <Image
                  src="https://images.unsplash.com/photo-1547496502-affa22d38842?q=80&w=900&auto=format&fit=crop"
                  alt="Taco Soup Recipe"
                  fill
                  sizes="300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <span className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#E3D1A5] text-[#1D212B] text-[9.5px] font-bold tracking-widest px-2 py-0.5 rounded-[2px] shadow-md z-20">
              430 GR
            </span>

            <div className="hidden lg:block absolute top-10 right-4 w-3.5 h-3.5 rounded-full bg-[#E3D1A5] border-2 border-[#1F232D] shadow-[0_0_8px_#E3D1A5] z-20" />
          </Link>

          {/* Description Card */}
          <div className="relative w-full max-w-md lg:-ml-12 z-10">
            <Link
              href="/journal/taco-soup"
              className="block bg-[#262A35]/85 backdrop-blur-md border border-white/5 rounded-[4px] p-7 sm:p-8 shadow-2xl hover:border-white/15 transition-all group"
            >
              <span className="text-[10px] uppercase tracking-widest text-[#C1A87D] font-mono block mb-1">
                RECIPES · 14 MIN
              </span>
              <h3 className="text-3xl sm:text-[34px] font-serif text-white tracking-wide leading-tight group-hover:text-[#E3D1A5] transition-colors">
                Taco
              </h3>
              <h4 className="text-base sm:text-lg font-serif italic text-stone-300 mt-0.5 font-light">
                Soup Recipe
              </h4>
              <p className="text-stone-400 text-xs font-light leading-relaxed mt-3.5">
                Zesty slow-simmered broth layered with crushed corn, avocado
                crests, cilantro embers, and toasted cumin.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <span className="text-[11px] font-sans tracking-[0.16em] lowercase text-stone-300 group-hover:text-[#E3D1A5] transition-colors">
                  read story
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#E3D1A5]" />
              </div>
            </Link>

            {/* Floating Cherry Tomato Ornament */}
            <motion.div
              animate={{ y: [0, 6, 0], rotate: [0, -4, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-4 -right-12 pointer-events-none select-none z-20"
            >
              <span className="text-4xl filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)]">
                🍅
              </span>
            </motion.div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 4: Spaghetti with Olive Oil (370 GR)                   */}
        {/* ========================================================= */}
        <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between gap-8">
          {/* Description Card */}
          <div className="relative w-full max-w-md lg:-mr-12 z-10">
            <Link
              href="/journal/balancing-heat"
              className="block bg-[#262A35]/85 backdrop-blur-md border border-white/5 rounded-[4px] p-7 sm:p-8 shadow-2xl hover:border-white/15 transition-all group"
            >
              <span className="text-[10px] uppercase tracking-widest text-[#C1A87D] font-mono block mb-1">
                TECHNIQUE · 10 MIN
              </span>
              <h3 className="text-3xl sm:text-[34px] font-serif text-white tracking-wide leading-tight group-hover:text-[#E3D1A5] transition-colors">
                Spaghetti
              </h3>
              <h4 className="text-base sm:text-lg font-serif italic text-stone-300 mt-0.5 font-light">
                with Olive Oil
              </h4>
              <p className="text-stone-400 text-xs font-light leading-relaxed mt-3.5">
                Cold-pressed virgin olive oil, confit garlic cloves, fresh chili
                whispers, and hand-harvested wild herbs.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <span className="text-[11px] font-sans tracking-[0.16em] lowercase text-stone-300 group-hover:text-[#E3D1A5] transition-colors">
                  read story
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#E3D1A5]" />
              </div>
            </Link>

            {/* Floating Basil Leaf Ornament on Left */}
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -left-6 pointer-events-none select-none z-20"
            >
              <span className="text-4xl filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)]">
                🌿
              </span>
            </motion.div>
          </div>

          {/* Dish Right */}
          <Link
            href="/journal/balancing-heat"
            className="group relative w-72 h-72 sm:w-80 sm:h-80 flex-shrink-0 flex items-center justify-center cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full border border-stone-500/20 scale-110 pointer-events-none" />

            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-4 bg-gradient-to-b from-[#18191D] via-[#0E0F12] to-[#050506] shadow-[0_25px_50px_rgba(0,0,0,0.85)] border border-[#2B2E37] flex items-center justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden shadow-inner">
                <Image
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?q=90&w=900&auto=format&fit=crop"
                  alt="Fine dining entree plate"
                  fill
                  sizes="300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <span className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#E3D1A5] text-[#1D212B] text-[9.5px] font-bold tracking-widest px-2 py-0.5 rounded-[2px] shadow-md z-20">
              370 GR
            </span>

            <div className="hidden lg:block absolute -top-2 left-6 w-3.5 h-3.5 rounded-full bg-[#E3D1A5] border-2 border-[#1F232D] shadow-[0_0_8px_#E3D1A5] z-20" />
          </Link>
        </div>
      </div>
    </section>
  );
}
