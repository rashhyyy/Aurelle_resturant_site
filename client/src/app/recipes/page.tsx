"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Users, BookOpen } from "lucide-react";
import { STORIES, StoryArticle } from "../../data/stories";

const CATEGORIES = ["All stories", "Ingredients", "Techniques", "Recipes", "Traditions"];

export default function RecipesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All stories");

  const filteredStories = useMemo(() => {
    if (selectedCategory === "All stories") return STORIES;
    return STORIES.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 pb-32">
      {/* ======================================================== */}
      {/* 1. HERO HEADER WITH MOODY CULINARY DISH                  */}
      {/* ======================================================== */}
      <section data-hero="true" className="relative w-full h-[62vh] min-h-[440px] sm:min-h-[480px] max-h-[580px] flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/images/recipes-hero.jpg"
            alt="Aurelle authentic Sri Lankan culinary spread and clay pot curries"
            fill
            priority
            quality={95}
            className="object-cover object-center brightness-[1.04] contrast-[1.03]"
          />
          {/* Refined single luxury gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35 pointer-events-none" />

        </motion.div>

        {/* Content with Smooth Staggered Load Animations */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-4 pt-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-[11px] sm:text-xs uppercase tracking-[0.32em] text-[#C1A87D] keep-white font-medium block drop-shadow-sm"
          >
            THE CHEF&apos;S JOURNAL
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-[72px] font-serif font-normal text-white keep-white tracking-tight leading-[1.08] drop-shadow-md"
          >
            Notes from the <br />
            kitchen.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="text-stone-200 keep-white text-xs sm:text-[13px] font-light leading-relaxed max-w-2xl mx-auto pt-2 drop-shadow-sm"
          >
            Recipes, ingredients and stories gathered from our culinary point of
            view.
          </motion.p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CATEGORY PILL FILTERS                                 */}
      {/* ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-16">
        <div className="flex items-center gap-3 flex-wrap mb-12">
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

        {/* ======================================================== */}
        {/* 3. STORIES & RECIPES GRID (3 Columns matching Figma)    */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredStories.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className="bg-[#181B22] border border-[#242833] rounded-[2px] flex flex-col justify-between overflow-hidden group hover:border-[#383E4E] transition-colors shadow-2xl"
              >
                {/* Story Image */}
                <div className="relative w-full h-72 sm:h-80 overflow-hidden bg-black">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181B22] via-transparent to-transparent opacity-80" />
                </div>

                {/* Content Details */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium block">
                      {item.tag}
                    </span>
                    <h3 className="font-serif text-2xl text-white font-normal tracking-wide mt-2">
                      {item.title}
                    </h3>
                    <p className="text-stone-400 text-xs sm:text-[13px] font-light mt-1.5">
                      {item.meta}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-stone-800/80">
                    <Link
                      href={`/recipes/${item.id}`}
                      className="group/link inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white transition-colors"
                    >
                      <span>Read story</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
