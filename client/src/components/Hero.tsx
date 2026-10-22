"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BellRing, Clock } from "lucide-react";

const HERO_SLIDES = [
  {
    id: 1,
    src: "/images/hero-bg1.jpg",
    alt: "Artfully plated seasonal dish at Aurelle",
  },
  {
    id: 2,
    src: "/images/hero-bg2.jpg",
    alt: "Fresh nigiri sushi course served on slate",
  },
  {
    id: 3,
    src: "/images/hero-bg3.jpg",
    alt: "Refined culinary broth and ramen presentation",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Automatically cycle through background images (1 -> 2 -> 3) with calm, luxury pacing
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full px-2 sm:px-4 pt-0 pb-4">
      {/* Container with rounded bottom corners filling the screen cleanly */}
      <div className="relative w-full h-[calc(100vh-5.5rem)] min-h-[660px] max-h-[960px] rounded-b-[2.5rem] lg:rounded-b-[3.5rem] overflow-hidden bg-[#0A0A0A] flex flex-col justify-between p-6 sm:p-12 lg:px-20 lg:pt-12 lg:pb-14 shadow-2xl">
        {/* Animated Background Slides */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.02, y: 0 }}
              animate={{
                opacity: 1,
                scale: [1.02, 1.06, 1.02],
                y: [0, -6, 0],
              }}
              exit={{
                opacity: 0,
                scale: 1.07,
                transition: { duration: 2.2, ease: "easeInOut" },
              }}
              transition={{
                opacity: { duration: 2.2, ease: "easeInOut" },
                scale: {
                  duration: 16,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
                y: {
                  duration: 16,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
              }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={HERO_SLIDES[currentSlide].src}
                alt={HERO_SLIDES[currentSlide].alt}
                fill
                priority
                className="object-cover object-center w-full h-full select-none pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradients matching Figma: soft left shade for text legibility, clear right for food */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Top spacer to ensure clear separation from the transparent navbar */}
        <div className="relative z-10 h-16 sm:h-20" />

        {/* Central Content: Placed lower down in the frame */}
        <div className="relative z-10 max-w-2xl flex-1 flex flex-col justify-end pt-36 sm:pt-44 lg:pt-52 pb-1 md:pb-2">
          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-[68px] font-bold text-white tracking-tight leading-[1.08]"
          >
            Exceptional dining.
          </motion.h1>

          {/* Subtitle in Italic Serif */}
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-5xl lg:text-[58px] font-serif italic text-[#EDE6D8] font-normal mt-1 leading-tight"
          >
            Thoughtfully timed.
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-stone-300 text-sm sm:text-base font-light leading-relaxed mt-5 max-w-lg"
          >
            A considered journey through Sri Lanka and the world, shaped by the
            season and served with warm, intuitive hospitality.
          </motion.p>

          {/* Interactive Buttons with Touch & Cursor Animations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-4 mt-8"
          >
            {/* Primary Button */}
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link
                href="/menu"
                className="inline-flex items-center justify-center bg-[#F3EDE2] hover:bg-white text-black text-[12px] font-semibold tracking-[0.14em] uppercase px-7 py-3.5 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-white/10 group"
              >
                EXPLORE THE MENU
                <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </motion.div>

            {/* Secondary Glass Button */}
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link
                href="/reservations"
                className="inline-flex items-center justify-center bg-black/40 hover:bg-black/65 backdrop-blur-md text-[#E8DCC4] hover:text-white text-[12px] font-semibold tracking-[0.14em] uppercase px-7 py-3.5 border border-white/20 hover:border-[#C1A87D]/70 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-black/50"
              >
                RESERVE A TABLE
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Bar: Quick Trigger & Hours Card */}
        <div className="relative z-10 flex items-end justify-between pt-4">
          {/* Quick Concierge Trigger */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            aria-label="Concierge & Special Requests"
            className="w-12 h-12 rounded-full bg-stone-900/90 border border-white/20 flex items-center justify-center text-[#E8DCC4] hover:text-white hover:bg-stone-800 transition-colors shadow-lg backdrop-blur-sm"
          >
            <BellRing className="w-5 h-5 stroke-[1.7]" />
          </motion.button>

          {/* Hours Glassmorphism Card */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-black/55 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 max-w-[280px] sm:max-w-xs shadow-xl transition-all hover:border-white/20"
          >
            <div className="flex items-center space-x-2 text-[11px] uppercase tracking-wider text-stone-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#C1A87D]" />
              <span>Today</span>
            </div>
            <p className="text-white font-serif text-lg sm:text-xl font-normal mt-1 tracking-wide">
              Dinner 5:30–10:30 PM
            </p>
            <p className="text-[11px] text-stone-400 mt-1 font-light">
              Illustrative hours · confirm before visiting
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
