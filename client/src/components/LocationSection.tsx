"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export default function LocationSection() {
  return (
    <section className="w-full bg-[#1A1A17] text-stone-100 border-t border-stone-800/80 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px] lg:min-h-[560px]">
        {/* Left Column: Details & Opening Hours */}
        <div className="bg-[#1D1D19] p-8 sm:p-14 lg:p-20 flex flex-col justify-between">
          <div className="space-y-6">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
              VISIT AURELLE
            </span>

            <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-serif font-normal text-white leading-[1.08] tracking-tight">
              Find your way <br />
              to the table
            </h2>

            <div className="text-stone-300 text-xs sm:text-sm font-light space-y-1">
              <p>Address to be confirmed by the restaurant</p>
              <p className="text-stone-400">Colombo, Sri Lanka</p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-stone-800/80 my-6" />

            {/* Operational Hours */}
            <div className="space-y-2 text-xs sm:text-sm font-light">
              <div className="flex items-center justify-between max-w-sm">
                <span className="text-stone-300">Monday–Thursday</span>
                <span className="text-stone-400">Hours to be supplied</span>
              </div>
              <div className="flex items-center justify-between max-w-sm">
                <span className="text-stone-300">Friday–Sunday</span>
                <span className="text-stone-400">Hours to be supplied</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-8">
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-transparent hover:bg-stone-800/60 border border-stone-400 hover:border-white text-stone-100 text-[11px] font-semibold tracking-[0.18em] uppercase px-7 py-3.5 transition-all duration-200"
              >
                LOCATION & CONTACT
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Right Column: Configured Map Placeholder Canvas */}
        <div className="relative bg-[#262823] min-h-[360px] lg:min-h-full flex flex-col items-center justify-center p-8 border-t lg:border-t-0 lg:border-l border-stone-800/80">
          {/* Subtle Map Grid lines / Texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          {/* Pin Icon & Notice matching Figma */}
          <div className="flex flex-col items-center justify-center space-y-4 text-center z-10">
            <div className="w-12 h-12 rounded-full border border-stone-600/60 bg-[#1D1D19]/60 flex items-center justify-center text-stone-400 shadow-md">
              <MapPin className="w-5 h-5 stroke-[1.6]" />
            </div>
            <p className="text-stone-400 text-xs sm:text-sm font-light tracking-wide">
              Configured map will appear here
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
