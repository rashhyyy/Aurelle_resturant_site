"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function JournalStoryPage() {
  return (
    <article className="w-full min-h-screen bg-[#111215] text-stone-100 pt-28 pb-32">
      {/* 1. Header & Breadcrumb Container */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 text-center space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center justify-center gap-2 text-xs text-stone-400 font-light">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/recipes" className="hover:text-white transition-colors">
            Journal
          </Link>
          <span>/</span>
          <span className="text-stone-300 truncate max-w-[220px] sm:max-w-none">
            A Chef’s Guide to Balancing Heat
          </span>
        </nav>

        {/* Category Tag */}
        <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
          THE JOURNAL / TECHNIQUE
        </span>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl lg:text-[68px] font-serif font-normal text-white tracking-tight leading-[1.08]"
        >
          A Chef’s Guide to <br />
          Balancing Heat
        </motion.h1>

        {/* Lead Quote Paragraph */}
        <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto pt-2">
          Chilli is most compelling when it creates momentum rather than noise.
          The craft lies in shaping heat with acidity, sweetness, richness,
          aroma, and texture.
        </p>

        {/* Meta Bar */}
        <div className="pt-4 flex items-center justify-center gap-3 text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-mono">
          <span>TECHNIQUE</span>
          <span>•</span>
          <span>8 MIN READ</span>
          <span>•</span>
          <span>OCTOBER 2026</span>
        </div>
      </header>

      {/* 2. Primary Hero Feature Image */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-14">
        <div className="relative w-full h-[380px] sm:h-[480px] lg:h-[540px] rounded-[2px] overflow-hidden shadow-2xl bg-black border border-stone-800">
          <Image
            src="https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=90&w=1600&auto=format&fit=crop"
            alt="Fresh red chillies on dark slate"
            fill
            priority
            className="object-cover object-center"
          />
        </div>
        <p className="text-stone-400 text-xs font-light mt-3 text-left">
          Heat becomes more expressive when each chilli is chosen for flavour as
          well as strength.
        </p>
      </section>

      {/* 3. Numbered Editorial Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-20 space-y-20">
        {/* Section 01 */}
        <section className="space-y-4">
          <span className="text-[11px] font-mono text-[#C1A87D] block">01</span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
            Heat is an architecture
          </h2>
          <div className="space-y-4 text-stone-300 text-sm sm:text-[15px] font-light leading-relaxed">
            <p>
              A spicy dish is not balanced by making every element equally loud.
              It is balanced by deciding when the heat should appear, how long
              it should remain, and what the palate should notice around it.
              Fresh chilli offers brightness; dried chilli can bring fruit,
              smoke and depth; black pepper creates a shorter, more aromatic
              warmth.
            </p>
            <p>
              Seeds and membranes hold much of a chilli’s capsaicin, but
              removing them is only one adjustment. Variety, ripeness,
              preparation and cooking time all influence the final sensation.
            </p>
          </div>
        </section>

        {/* Section 02 */}
        <section className="space-y-4">
          <span className="text-[11px] font-mono text-[#C1A87D] block">02</span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
            Acidity gives heat an edge
          </h2>
          <div className="space-y-4 text-stone-300 text-sm sm:text-[15px] font-light leading-relaxed">
            <p>
              Lime, tamarind and vinegar do not simply reduce perceived heat.
              They sharpen the boundaries of a dish, allowing chilli to feel
              cleaner and less heavy. Added too early, acidity can lose its
              fragrance; added in stages, it can season both the sauce and its
              finish.
            </p>
            <p>
              A final squeeze of citrus often does more than extra salt. It
              restores contrast, especially in dishes built around coconut,
              butter or slow-cooked meat.
            </p>
          </div>

          {/* Callout Quote Box */}
          <div className="bg-[#181A20] border-l-2 border-[#C1A87D] p-6 sm:p-8 rounded-r-[2px] mt-8 shadow-xl">
            <p className="font-serif text-xl sm:text-2xl text-stone-100 leading-snug tracking-wide italic">
              “Sophisticated heat has shape: it arrives with aroma, gathers
              slowly, and leaves enough space for the next flavour to be
              understood.”
            </p>
          </div>
        </section>

        {/* Section 03 & Image */}
        <section className="space-y-6">
          <div className="space-y-4">
            <span className="text-[11px] font-mono text-[#C1A87D] block">
              03
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
              Sweetness, richness and restraint
            </h2>
            <div className="space-y-4 text-stone-300 text-sm sm:text-[15px] font-light leading-relaxed">
              <p>
                A small amount of palm sugar, ripe fruit or caramelised onion
                can round the bitter edge of chilli without making a dish sweet.
                Fat carries capsaicin and extends its presence, yet creamy
                elements also soften the perception of sharpness. This is why
                coconut milk, yoghurt and nut pastes can make heat feel generous
                rather than aggressive.
              </p>
              <p>
                The ratio is never fixed. Rich dishes often need brighter
                acidity; lean dishes may benefit from a softer sweetness or a
                finishing oil that lets the spice linger.
              </p>
            </div>
          </div>

          {/* Inset Preparation Image */}
          <div className="relative w-full h-[320px] sm:h-[400px] rounded-[2px] overflow-hidden border border-stone-800 shadow-xl bg-black">
            <Image
              src="https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=90&w=1400&auto=format&fit=crop"
              alt="Artisanal red peppers prepared on kitchen board"
              fill
              className="object-cover object-center"
            />
          </div>
        </section>

        {/* Section 04 */}
        <section className="space-y-4">
          <span className="text-[11px] font-mono text-[#C1A87D] block">04</span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
            Building heat in layers
          </h2>
          <div className="space-y-4 text-stone-300 text-sm sm:text-[15px] font-light leading-relaxed">
            <p>
              At AURELLE, the illustrative method begins with aromatic warmth:
              dried chilli or pepper bloomed carefully in fat. A fresher form
              may enter midway for body, while a raw or lightly pickled chilli
              appears at the end for clarity. Each layer has a different
              purpose.
            </p>
            <p>
              Texture matters as much as taste. A cool cucumber, crisp leaf,
              toasted seed or spoonful of cultured cream gives the palate a new
              surface, preventing repeated heat from becoming monotonous.
            </p>
          </div>
        </section>

        {/* Section 05 */}
        <section className="space-y-4">
          <span className="text-[11px] font-mono text-[#C1A87D] block">05</span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
            Taste for the second bite
          </h2>
          <div className="space-y-4 text-stone-300 text-sm sm:text-[15px] font-light leading-relaxed">
            <p>
              Chilli continues to accumulate as a diner eats, so a sauce that
              feels perfect on the first spoon may become tiring by the fourth.
              Taste the complete dish, pause, and taste again. The most
              memorable spicy food invites another bite because the heat
              supports curiosity instead of overwhelming it.
            </p>
          </div>
        </section>
      </main>

      {/* 4. "More from the Journal" Footer Block */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 mt-28 pt-16 border-t border-stone-800/80">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
            EXPLORE MORE STORIES
          </span>
          <h3 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
            More from the Journal
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Card 1 */}
          <Link
            href="/journal/ceylon-cinnamon"
            className="group bg-[#181A20] border border-stone-800 rounded-[2px] overflow-hidden hover:border-stone-700 transition-colors shadow-xl flex flex-col justify-between"
          >
            <div className="relative w-full h-64 overflow-hidden bg-black">
              <Image
                src="https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=90&w=800&auto=format&fit=crop"
                alt="Ceylon Cinnamon spices"
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            <div className="p-6 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium block">
                INGREDIENTS · 6 MIN
              </span>
              <h4 className="font-serif text-xl sm:text-2xl text-white group-hover:text-[#C1A87D] transition-colors">
                The Quiet Complexity of Ceylon Cinnamon
              </h4>
              <span className="inline-flex items-center gap-1.5 text-xs text-stone-300 font-medium pt-2">
                <span>Read story</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/journal/king-coconut"
            className="group bg-[#181A20] border border-stone-800 rounded-[2px] overflow-hidden hover:border-stone-700 transition-colors shadow-xl flex flex-col justify-between"
          >
            <div className="relative w-full h-64 overflow-hidden bg-black">
              <Image
                src="https://images.unsplash.com/photo-1547514701-42782101795e?q=90&w=800&auto=format&fit=crop"
                alt="Golden king coconuts"
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            <div className="p-6 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium block">
                RECIPE · 12 MIN
              </span>
              <h4 className="font-serif text-xl sm:text-2xl text-white group-hover:text-[#C1A87D] transition-colors">
                King Coconut, Three Ways
              </h4>
              <span className="inline-flex items-center gap-1.5 text-xs text-stone-300 font-medium pt-2">
                <span>Read story</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </div>
      </footer>
    </article>
  );
}
