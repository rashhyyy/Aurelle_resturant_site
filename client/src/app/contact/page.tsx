"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Send,
  CheckCircle2,
  Car,
  Train,
  Calendar,
} from "lucide-react";

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "Table Reservation",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 pb-28">
      {/* ======================================================== */}
      {/* 1. HERO HEADER                                           */}
      {/* ======================================================== */}
      <section data-hero="true" className="relative w-full h-[58vh] min-h-[420px] sm:min-h-[460px] max-h-[540px] flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=90&w=2400&auto=format&fit=crop"
            alt="Aurelle dining room ambience"
            fill
            priority
            quality={95}
            className="object-cover object-center brightness-[1.06] contrast-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45 pointer-events-none" />

        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-4 pt-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-[11px] sm:text-xs uppercase tracking-[0.32em] text-[#C1A87D] font-medium block"
          >
            GET IN TOUCH
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-[70px] font-serif font-normal text-white keep-white tracking-tight leading-[1.08] drop-shadow-md"
          >
            Find your way <br />
            to our table.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="text-stone-200 keep-white text-xs sm:text-[13px] font-light leading-relaxed max-w-2xl mx-auto pt-2 drop-shadow-sm"
          >
            Located in scenic Alawwa Town, Sri Lanka. Contact our team for table
            reservations, private dining inquiries, or directions.
          </motion.p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CONTACT DETAILS CARDS (4 COLUMNS)                     */}
      {/* ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 -mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Address */}
          <div className="bg-[#181B22]/95 backdrop-blur-md border border-[#262B35] rounded-[2px] p-5 sm:p-7 flex flex-col justify-between shadow-2xl hover:border-[#C1A87D]/50 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#202530] border border-[#2D3342] flex items-center justify-center text-[#C1A87D] mb-5">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium block mb-2">
                RESTAURANT LOCATION
              </span>
              <h3 className="font-serif text-lg text-white font-normal mb-2">
                Alawwa Town
              </h3>
              <p className="text-xs text-stone-300 font-light leading-relaxed">
                Main Street, Alawwa Town,
                <br />
                Kurunegala District,
                <br />
                Western / North Western Border,
                <br />
                Sri Lanka
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-stone-800/80">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Alawwa+Town+Sri+Lanka"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#C1A87D] hover:text-white transition-colors uppercase tracking-wider font-medium"
              >
                <span>Google Maps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Phone */}
          <div className="bg-[#181B22]/95 backdrop-blur-md border border-[#262B35] rounded-[2px] p-5 sm:p-7 flex flex-col justify-between shadow-2xl hover:border-[#C1A87D]/50 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#202530] border border-[#2D3342] flex items-center justify-center text-[#C1A87D] mb-5">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium block mb-2">
                TELEPHONE &amp; WHATSAPP
              </span>
              <h3 className="font-serif text-lg text-white font-normal mb-2">
                Concierge Desk
              </h3>
              <div className="text-xs text-stone-300 font-light space-y-1.5 leading-relaxed">
                <p>
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    Main Line:
                  </span>
                  <a
                    href="tel:+94372278890"
                    className="hover:text-[#C1A87D] transition-colors"
                  >
                    +94 37 227 8890
                  </a>
                </p>
                <p>
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    VIP &amp; WhatsApp:
                  </span>
                  <a
                    href="tel:+94771234567"
                    className="hover:text-[#C1A87D] transition-colors"
                  >
                    +94 77 123 4567
                  </a>
                </p>
              </div>
            </div>
            <div className="pt-5 mt-5 border-t border-stone-800/80">
              <span className="text-[11px] text-stone-400 font-light">
                Daily: 10:00 AM – 10:00 PM
              </span>
            </div>
          </div>

          {/* Card 3: Email */}
          <div className="bg-[#181B22]/95 backdrop-blur-md border border-[#262B35] rounded-[2px] p-5 sm:p-7 flex flex-col justify-between shadow-2xl hover:border-[#C1A87D]/50 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#202530] border border-[#2D3342] flex items-center justify-center text-[#C1A87D] mb-5">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium block mb-2">
                ELECTRONIC MAIL
              </span>
              <h3 className="font-serif text-lg text-white font-normal mb-2">
                Direct Inquiries
              </h3>
              <div className="text-xs text-stone-300 font-light space-y-2 leading-relaxed">
                <p>
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    Reservations:
                  </span>
                  <a
                    href="mailto:reservations@aurelledining.com"
                    className="hover:text-[#C1A87D] transition-colors break-all"
                  >
                    reservations@aurelledining.com
                  </a>
                </p>
                <p>
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    General Inquiries:
                  </span>
                  <a
                    href="mailto:concierge@aurelledining.com"
                    className="hover:text-[#C1A87D] transition-colors break-all"
                  >
                    concierge@aurelledining.com
                  </a>
                </p>
              </div>
            </div>
            <div className="pt-5 mt-5 border-t border-stone-800/80">
              <span className="text-[11px] text-stone-400 font-light">
                Replies within 24 hours
              </span>
            </div>
          </div>

          {/* Card 4: Hours */}
          <div className="bg-[#181B22]/95 backdrop-blur-md border border-[#262B35] rounded-[2px] p-5 sm:p-7 flex flex-col justify-between shadow-2xl hover:border-[#C1A87D]/50 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#202530] border border-[#2D3342] flex items-center justify-center text-[#C1A87D] mb-5">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium block mb-2">
                DINING HOURS
              </span>
              <h3 className="font-serif text-lg text-white font-normal mb-2">
                Weekly Service
              </h3>
              <div className="text-xs text-stone-300 font-light space-y-2 leading-relaxed">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    Monday – Thursday
                  </span>
                  <p>5:30 PM – 10:30 PM</p>
                  <span className="text-[10px] text-stone-500">
                    (Dinner Service)
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    Friday – Sunday
                  </span>
                  <p>12:00 PM – 3:30 PM (Lunch)</p>
                  <p>5:30 PM – 11:00 PM (Dinner)</p>
                </div>
              </div>
            </div>
            <div className="pt-5 mt-5 border-t border-stone-800/80">
              <Link
                href="/reservations"
                className="inline-flex items-center gap-1.5 text-xs text-[#C1A87D] hover:text-white transition-colors uppercase tracking-wider font-medium"
              >
                <span>Reserve a table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. INTERACTIVE MAP & TRAVEL DIRECTIONS                   */}
      {/* ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-20">
        <div className="bg-[#181B22] border border-[#262B35] rounded-[2px] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Map Details & Travel Info */}
          <div className="lg:col-span-5 p-5 sm:p-12 lg:p-14 flex flex-col justify-between">
            <div className="space-y-6">
              <span className="text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                LOCATION &amp; PIN
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight leading-[1.12]">
                Aurelle, Alawwa Town
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed">
                Nestled along the Maha Oya river basin in Alawwa, Aurelle provides a
                tranquil haven away from the city frenzy while remaining conveniently
                accessible from both Colombo and Kurunegala.
              </p>

              {/* Transit Options */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#202530] border border-[#2C3340] flex items-center justify-center text-[#C1A87D] shrink-0 mt-0.5">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                      By Private Vehicle
                    </h4>
                    <p className="text-xs text-stone-400 font-light mt-0.5">
                      Approximately 58 km from Colombo via the Central
                      Expressway (Mirigama / Ambepussa exit). Complimentary valet
                      parking available on premises.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#202530] border border-[#2C3340] flex items-center justify-center text-[#C1A87D] shrink-0 mt-0.5">
                    <Train className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                      By Scenic Railway
                    </h4>
                    <p className="text-xs text-stone-400 font-light mt-0.5">
                      The historic Alawwa Railway Station is situated just 4
                      minutes from our restaurant. Express trains connect
                      frequently from Colombo Fort.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex flex-wrap gap-4">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Alawwa+Town+Sri+Lanka"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#C1A87D] hover:bg-[#D5BF96] text-black text-xs font-semibold tracking-[0.16em] uppercase px-6 py-3.5 rounded-[2px] transition-colors shadow-md"
              >
                <span>OPEN IN GOOGLE MAPS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <Link
                href="/reservations"
                className="inline-flex items-center gap-2 bg-transparent hover:bg-stone-800/60 border border-stone-500 hover:border-white text-stone-200 hover:text-white text-xs font-semibold tracking-[0.16em] uppercase px-6 py-3.5 rounded-[2px] transition-colors"
              >
                <span>BOOK TABLE</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Google Maps Embed with Pin */}
          <div className="lg:col-span-7 relative min-h-[420px] lg:min-h-[560px] bg-[#16181F] border-t lg:border-t-0 lg:border-l border-[#262B35]">
            <iframe
              title="Aurelle Location Map - Alawwa, Sri Lanka"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.625345719329!2d80.2323446750003!3d7.296895713753733!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae3171465e921b3%3A0x6b871c841368a52e!2sAlawwa%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1710000000000!5m2!1sen!2slk"
              className="w-full h-full min-h-[420px] lg:min-h-[560px] border-0 block"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Dark Styled Map Badge Overlay */}
            <div className="absolute top-5 left-5 bg-[#111215]/95 backdrop-blur-md border border-[#C1A87D]/50 px-4 py-2.5 rounded-[2px] shadow-2xl flex items-center space-x-2.5 pointer-events-none z-10">
              <MapPin className="w-4 h-4 text-[#C1A87D]" />
              <div>
                <span className="text-xs font-serif text-white tracking-wider block">
                  Aurelle Restaurant
                </span>
                <span className="text-[10px] text-stone-400 tracking-wider">
                  Main St, Alawwa Town, Sri Lanka
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. CONTACT & INQUIRIES FORM SECTION                      */}
      {/* ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-20">
        <div className="bg-[#15171D] border border-[#242833] rounded-[2px] p-5 sm:p-14 lg:p-16 shadow-2xl">
          <div className="max-w-3xl mx-auto">
            <div className="text-center space-y-3 mb-10">
              <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                MESSAGE OUR CONCIERGE
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
                Send an inquiry
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm font-light">
                Whether planning a bespoke anniversary dinner, asking about
                dietary requirements, or arranging group dining, we are here to assist.
              </p>
            </div>

            {formSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#1B221B] border border-[#344E34] rounded-[2px] p-8 text-center space-y-4 shadow-xl"
              >
                <div className="w-12 h-12 rounded-full bg-[#273B27] text-[#9FD89F] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl text-white">
                  Thank you for reaching out
                </h3>
                <p className="text-stone-300 text-xs sm:text-sm font-light max-w-md mx-auto leading-relaxed">
                  Your message has been received by our dining concierge. We will
                  contact you via email or telephone within 24 hours.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setFormSubmitted(false)}
                    className="text-xs text-[#C1A87D] hover:text-white underline underline-offset-4 uppercase tracking-wider"
                  >
                    Send another message
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.22em] text-stone-400 font-medium block mb-2">
                      YOUR FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Kasun Perera"
                      className="w-full bg-[#1A1D24] border border-[#2B303C] rounded-[2px] px-4 py-3.5 text-sm text-stone-100 placeholder-stone-500 outline-none focus:border-[#C1A87D] transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.22em] text-stone-400 font-medium block mb-2">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="e.g. kasun@example.com"
                      className="w-full bg-[#1A1D24] border border-[#2B303C] rounded-[2px] px-4 py-3.5 text-sm text-stone-100 placeholder-stone-500 outline-none focus:border-[#C1A87D] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.22em] text-stone-400 font-medium block mb-2">
                      CONTACT NUMBER
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="e.g. +94 77 123 4567"
                      className="w-full bg-[#1A1D24] border border-[#2B303C] rounded-[2px] px-4 py-3.5 text-sm text-stone-100 placeholder-stone-500 outline-none focus:border-[#C1A87D] transition-colors"
                    />
                  </div>

                  {/* Inquiry Type */}
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.22em] text-stone-400 font-medium block mb-2">
                      INQUIRY SUBJECT
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) =>
                        setFormData({ ...formData, inquiryType: e.target.value })
                      }
                      className="w-full bg-[#1A1D24] border border-[#2B303C] rounded-[2px] px-4 py-3.5 text-sm text-stone-100 outline-none focus:border-[#C1A87D] transition-colors cursor-pointer"
                    >
                      <option value="Table Reservation">
                        Table Reservation &amp; Dining
                      </option>
                      <option value="Private Dining & Events">
                        VIP &amp; Private Dining (Events)
                      </option>
                      <option value="Dietary & Allergen Inquiries">
                        Dietary &amp; Ingredient Requirements
                      </option>
                      <option value="Press & Collaborations">
                        Press, Media &amp; Partnerships
                      </option>
                      <option value="General Feedback">General Feedback</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.22em] text-stone-400 font-medium block mb-2">
                    MESSAGE OR SPECIAL REQUESTS *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Tell us about your planned visit, preferred seating, or questions..."
                    className="w-full bg-[#1A1D24] border border-[#2B303C] rounded-[2px] p-4 text-sm text-stone-100 placeholder-stone-500 outline-none focus:border-[#C1A87D] transition-colors resize-none"
                  />
                </div>

                <div className="text-center pt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="inline-flex items-center gap-2 bg-[#C1A87D] hover:bg-[#D5BF96] text-black text-xs font-semibold tracking-[0.18em] uppercase px-9 py-4 rounded-[2px] transition-colors shadow-lg cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>SEND MESSAGE</span>
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
