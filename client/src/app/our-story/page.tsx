"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Compass, HeartHandshake, Leaf, MapPin, Phone, Mail, Clock } from "lucide-react";

export default function OurStoryPage() {
  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 pb-28">
      {/* ======================================================== */}
      {/* 1. HERO HEADER WITH MOODY KITCHEN AMBIENCE               */}
      {/* ======================================================== */}
      <section data-hero="true" className="relative w-full h-[62vh] min-h-[440px] sm:min-h-[480px] max-h-[580px] flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=90&w=2400&auto=format&fit=crop"
            alt="Aurelle chef preparing culinary creations"
            fill
            priority
            quality={95}
            className="object-cover object-center brightness-[1.06] contrast-[1.02]"
          />
          {/* Refined single luxury gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45 pointer-events-none" />

        </motion.div>

        {/* Hero Text Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-4 pt-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-[11px] sm:text-xs uppercase tracking-[0.32em] text-[#C1A87D] font-medium block"
          >
            OUR STORY
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-[72px] font-serif font-normal text-white keep-white tracking-tight leading-[1.08] drop-shadow-md"
          >
            Hospitality, with <br />
            intention.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="text-stone-200 keep-white text-xs sm:text-[13px] font-light leading-relaxed max-w-2xl mx-auto pt-2 drop-shadow-sm"
          >
            A modern international dining concept inspired by the ingredients
            and generosity of Sri Lanka.
          </motion.p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SPLIT SECTION: OUR POINT OF VIEW                      */}
      {/* ======================================================== */}
      <section className="w-full bg-[#15171D] border-t border-b border-stone-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[580px]">
          {/* Left Dark Content Column */}
          <div className="p-8 sm:p-14 lg:p-20 flex flex-col justify-between">
            <div className="space-y-6">
              <span className="text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                OUR POINT OF VIEW
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-normal text-white leading-[1.14] tracking-tight">
                We believe the best <br />
                meals unfold at their <br />
                own pace.
              </h2>

              <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed max-w-md">
                AURELLE is presented as an illustrative restaurant concept. Its
                philosophy centres on intuitive service, seasonal produce and
                cooking that moves freely across borders while remaining
                sensitive to place.
              </p>

              <p className="text-stone-400 text-xs font-light leading-relaxed max-w-md">
                No awards, certifications or historical claims are implied by
                this prototype.
              </p>
            </div>

            <div className="pt-8">
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center bg-[#F6F2EB] hover:bg-white text-[#15161A] text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3.5 rounded-[2px] transition-colors shadow-md"
                >
                  EXPLORE THE MENU
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Right Dining Room Image */}
          <div className="relative min-h-[360px] lg:min-h-full w-full">
            <Image
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=90&w=1600&auto=format&fit=crop"
              alt="Aurelle dining hall with warm lighting and wooden finishes"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. HERITAGE & ETHICAL PRACTICE SECTION (DARK MODE)       */}
      {/* ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-20 space-y-20">
        {/* Story Block 1: A Name Worth Knowing */}
        <div className="max-w-3xl space-y-4">
          <span className="text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
            GENEALOGY & PHILOSOPHY
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
            A Name Worth Knowing.
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed">
            Aurelle is inspired by the timeless tradition of welcoming people
            into one&apos;s home—of making strangers feel like cherished family.
            Our affection towards guests goes beyond simply escorting you to
            your table. You will find yourself part of the family at Aurelle,
            where we connect on an authentic, first-name basis with every guest.
          </p>
          <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed">
            To maximize your dining experience, Aurelle provides you with
            thoughtfully crafted ambiance, freshly-cooked meals, a dedicated
            chef&apos;s table, and an intimate lounge for private gatherings.
          </p>
        </div>

        {/* Story Block 2: Ethical Tourism / Sourcing & Landscape Train Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2 text-[#C1A87D]">
              <Leaf className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-[0.24em] font-medium">
                SUSTAINABLE GASTRONOMY
              </span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
              Ethical sourcing & heritage
            </h3>

            <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed">
              It is embedded in the core values of our kitchen to preserve the
              progress of sustainable culinary culture that Sri Lanka is known
              for. And with that perseverance comes our innate duty to celebrate
              our enchanted island through an unwavering commitment to our
              natural environment and local farmers.
            </p>

            <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed">
              Starting with our organic tea growers, coastal artisanal fishers,
              and spice cultivators, Aurelle bridges several communities
              together in our efforts to promote sustainable gastronomy and
              ethical trade.
            </p>

            <div className="pt-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-[#182635] hover:bg-[#1E3043] border border-[#2E4660] text-stone-200 text-xs font-semibold tracking-[0.14em] uppercase px-6 py-3 rounded-[2px] transition-colors shadow-md"
              >
                LOCATION &amp; CONTACT US
              </Link>
            </div>
          </div>

          {/* Right Image: Sri Lankan Hill Country Train & Scenery */}
          <div className="lg:col-span-6 relative h-[360px] sm:h-[440px] w-full overflow-hidden rounded-[2px] shadow-2xl border border-stone-800">
            <Image
              src="https://images.unsplash.com/photo-1546708973-b339540b5162?q=90&w=1200&auto=format&fit=crop"
              alt="Sri Lankan iconic blue train through emerald hill country"
              fill
              className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. LOCATION, MAP & CONTACT SECTION                       */}
        {/* ======================================================== */}
        <div className="w-full bg-[#16181F] border border-stone-800 rounded-[2px] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 mb-14">
          <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                VISIT AURELLE
              </span>
              <h3 className="text-3xl font-serif text-white tracking-tight">
                Our Home in Alawwa Town
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed">
                Experience our gastronomy in a serene setting along the Maha Oya basin.
                Conveniently located in Kurunegala District, accessible by car or scenic train.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-stone-300 font-light">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C1A87D] shrink-0" />
                  <span>Main Street, Alawwa Town, Sri Lanka</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#C1A87D] shrink-0" />
                  <span>+94 37 227 8890 / +94 77 123 4567</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#C1A87D] shrink-0" />
                  <span>reservations@aurelledining.com</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#C1A87D] shrink-0" />
                  <span>Mon–Thu: 5:30 PM | Fri–Sun: 12:00 PM &amp; 5:30 PM</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#C1A87D] hover:bg-[#D5BF96] text-black text-xs font-semibold tracking-[0.16em] uppercase px-6 py-3 rounded-[2px] transition-colors shadow-md"
              >
                <span>FULL CONTACT DETAILS &amp; INQUIRIES</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 relative min-h-[340px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-stone-800">
            <iframe
              title="Aurelle Location Map in Our Story - Alawwa, Sri Lanka"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.625345719329!2d80.2323446750003!3d7.296895713753733!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae3171465e921b3%3A0x6b871c841368a52e!2sAlawwa%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1710000000000!5m2!1sen!2slk"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full min-h-[340px] border-0 block"
              loading="lazy"
              allowFullScreen
            />
            <div className="absolute top-4 left-4 bg-[#111215]/90 backdrop-blur-md border border-[#C1A87D]/40 px-3 py-1.5 rounded-sm shadow-xl flex items-center space-x-2 pointer-events-none z-10">
              <MapPin className="w-3.5 h-3.5 text-[#C1A87D]" />
              <span className="text-[11px] font-serif text-stone-200 tracking-wider">
                Alawwa Town, Sri Lanka
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. BOTTOM RESERVATION RIBBON (DARK LUXURY NAVY BANNER)   */}
        {/* ======================================================== */}
        <div className="w-full bg-gradient-to-r from-[#0C1A2B] via-[#0E2034] to-[#0A1624] border border-[#1E3550] rounded-[2px] p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <h3 className="text-2xl sm:text-3xl font-serif text-white tracking-wide">
              Make your online reservation now!
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm font-light mt-1">
              Reserve your table online or consult with our private concierge.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/reservations"
              className="inline-flex items-center justify-center bg-transparent hover:bg-white/10 text-white border border-[#3E658E] hover:border-white text-xs font-semibold tracking-[0.18em] uppercase px-8 py-3.5 rounded-[2px] transition-colors whitespace-nowrap"
            >
              DISCOVER MORE
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
