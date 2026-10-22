"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Sparkles,
  UtensilsCrossed,
  Share2,
} from "lucide-react";
import { StoryArticle, STORIES } from "../../../data/stories";

interface RecipeStoryClientProps {
  activeStory: StoryArticle;
}

export default function RecipeStoryClient({ activeStory }: RecipeStoryClientProps) {
  const currentIndex = STORIES.findIndex((s) => s.id === activeStory.id);
  const nextStory = STORIES[(currentIndex + 1) % STORIES.length];

  return (
    <article className="w-full min-h-screen bg-[#111215] text-stone-100 pb-32">
      {/* ======================================================== */}
      {/* 1. HERO HEADER WITH MOODY CINEMATIC PHOTOGRAPHY          */}
      {/* ======================================================== */}
      <section data-hero="true" className="relative w-full h-[68vh] min-h-[500px] sm:min-h-[540px] max-h-[640px] flex items-end overflow-hidden pb-16 sm:pb-20">
        <motion.div
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={activeStory.image}
            alt={activeStory.title}
            fill
            priority
            quality={95}
            className="object-cover object-center brightness-[1.06] contrast-[1.02]"
          />
          {/* Moody overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/35 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-transparent pointer-events-none" />
        </motion.div>

        {/* Hero Meta & Title */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-14 w-full">
          {/* Back Navigation Bar */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link
              href="/#journal"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#C1A87D] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to The Journal</span>
            </Link>
          </motion.div>

          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium bg-[#1F221B]/90 border border-[#C1A87D]/40 px-3 py-1 rounded-[2px]">
                {activeStory.tag}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-stone-200 keep-white font-light drop-shadow-sm">
                <Clock className="w-3.5 h-3.5 text-[#C1A87D]" />
                {activeStory.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[60px] font-serif font-normal text-white keep-white tracking-tight leading-[1.1] drop-shadow-md">
              {activeStory.title}
            </h1>

            <p className="text-stone-200 keep-white text-sm sm:text-base font-light leading-relaxed pt-2 drop-shadow-sm">
              {activeStory.excerpt}
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. ARTICLE BODY CONTENT                                  */}
      {/* ======================================================== */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-14 pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Main Story Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Chef Quote Pullout */}
            {activeStory.chefQuote && (
              <blockquote className="relative p-6 sm:p-8 bg-[#181A20] border-l-2 border-[#C1A87D] rounded-[2px] shadow-xl">
                <p className="font-serif italic text-lg sm:text-xl text-stone-200 leading-relaxed">
                  &ldquo;{activeStory.chefQuote}&rdquo;
                </p>
                <cite className="block mt-3 text-xs uppercase tracking-[0.2em] text-[#C1A87D] font-medium not-italic">
                  — Aurelle Kitchen Philosophy
                </cite>
              </blockquote>
            )}

            {/* Paragraphs */}
            <div className="space-y-6 text-stone-300 text-sm sm:text-base font-light leading-relaxed">
              {activeStory.paragraphs.map((p, idx) => (
                <p
                  key={idx}
                  className="first-letter:text-3xl first-letter:font-serif first-letter:text-white first-letter:mr-1"
                >
                  {p}
                </p>
              ))}
            </div>

            {/* In-Article Image Accent */}
            <div className="relative w-full h-[320px] sm:h-[420px] rounded-[2px] overflow-hidden border border-stone-800 shadow-2xl mt-10">
              <Image
                src={activeStory.image}
                alt={activeStory.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-stone-300">
                <span className="font-serif italic text-white">
                  Field notes &amp; culinary harvest
                </span>
                <span className="text-[10px] uppercase tracking-widest text-stone-400">
                  Aurelle Culinary Archives
                </span>
              </div>
            </div>

            {/* Sharing and Navigation Bar */}
            <div className="pt-8 border-t border-stone-800 flex items-center justify-between flex-wrap gap-4">
              <Link
                href="/recipes"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C1A87D] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Explore all stories &amp; recipes</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator
                      .share({
                        title: activeStory.title,
                        url: window.location.href,
                      })
                      .catch(() => {});
                  }
                }}
                className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share story</span>
              </button>
            </div>
          </div>

          {/* Sidebar: Notes, Terroir & Pairing */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Terroir & Technique Card */}
            <div className="bg-[#181A20] border border-stone-800 rounded-[2px] p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium">
                <Sparkles className="w-4 h-4" />
                <span>CHEF&apos;S KEY NOTES</span>
              </div>
              <ul className="space-y-3 divide-y divide-stone-800/80 pt-2 text-xs text-stone-300 font-light leading-relaxed">
                {activeStory.keyNotes.map((note, idx) => (
                  <li key={idx} className="pt-3 first:pt-0">
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* Menu Pairing Card */}
            {activeStory.pairingDish && (
              <div className="bg-[#1F221B] border border-[#2F3528] rounded-[2px] p-6 sm:p-7 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>TASTING MENU PAIRING</span>
                </div>
                <h3 className="font-serif text-lg text-white font-normal">
                  {activeStory.pairingDish}
                </h3>
                <p className="text-stone-400 text-xs font-light leading-relaxed">
                  Experience this ingredient in our current seasonal dinner menu.
                </p>
                <div className="pt-2">
                  <Link
                    href="/menu"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#C1A87D] hover:text-white uppercase transition-colors"
                  >
                    <span>View on Menu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Story Navigation: Next Story */}
            <div className="bg-[#14161A] border border-stone-800 rounded-[2px] p-6 space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium block">
                NEXT STORY
              </span>
              <h4 className="font-serif text-base text-white hover:text-[#C1A87D] transition-colors">
                <Link href={`/recipes/${nextStory.id}`}>{nextStory.title}</Link>
              </h4>
              <p className="text-[11px] text-stone-400 font-light">
                {nextStory.readTime}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}
