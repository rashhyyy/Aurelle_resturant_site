"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { usePreferences } from "../context/PreferencesContext";

interface FooterLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  external?: boolean;
  ariaLabel?: string;
  badge?: string;
}

function FooterNavLink({
  href,
  label,
  isActive,
  external = false,
  ariaLabel,
  badge,
}: FooterLinkProps) {
  const content = (
    <>
      <span className="inline-block transform transition-transform duration-250 ease-out group-hover:translate-x-1.5 motion-reduce:transform-none">
        {label}
      </span>
      {badge && (
        <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-[2px] bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30">
          {badge}
        </span>
      )}
      {external && (
        <ExternalLink
          className="w-3 h-3 text-[#B99A63]/70 group-hover:text-[#B99A63] transition-colors duration-250 opacity-80 group-hover:opacity-100"
          aria-hidden="true"
        />
      )}
      {/* Animated Underline Reveal from Left to Right */}
      <span
        className={`absolute -bottom-0.5 left-0 w-full h-[1.5px] bg-[#B99A63] origin-left transition-transform duration-300 ease-out motion-reduce:hidden ${
          isActive
            ? "scale-x-100 opacity-100"
            : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
        }`}
        aria-hidden="true"
      />
    </>
  );

  const baseClasses = `group relative inline-flex items-center gap-1.5 py-1 text-[13px] tracking-wide transition-colors duration-250 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63] focus-visible:text-[#B99A63] rounded-[1px] ${
    isActive
      ? "text-[#B99A63] font-medium"
      : "text-[#BAB3A8] hover:text-[#B99A63]"
  }`;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel || label}
        className={baseClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel || label}
      aria-current={isActive ? "page" : undefined}
      className={baseClasses}
    >
      {content}
    </Link>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const { t } = usePreferences();

  const [toast, setToast] = useState<{
    id: number;
    channel: string;
    message: string;
  } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleComingSoonClick = (channelName: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({
      id: Date.now(),
      channel: channelName,
      message: `Our official ${channelName} channel is launching soon. For immediate reservations and concierge assistance, please contact us directly at +94 37 227 8890.`,
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Hide customer footer on internal staff portal routes
  if (pathname?.startsWith("/staff")) {
    return null;
  }

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentYear = 2026;

  // Social & Communication channels
  const SOCIAL_CHANNELS = [
    {
      name: "WhatsApp",
      isComingSoon: true,
      ariaLabel: "WhatsApp Concierge (Coming Soon)",
      icon: (
        <svg
          className="w-4 h-4 stroke-[1.8]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
        </svg>
      ),
    },
    {
      name: "Location",
      href: "https://www.google.com/maps/search/?api=1&query=Alawwa+Town+Sri+Lanka",
      isComingSoon: false,
      ariaLabel: "View Aurelle restaurant location and directions on Google Maps",
      icon: <MapPin className="w-4 h-4 stroke-[1.8]" aria-hidden="true" />,
    },
    {
      name: "Instagram",
      isComingSoon: true,
      ariaLabel: "Instagram (Coming Soon)",
      icon: (
        <svg
          className="w-4 h-4 stroke-[1.8]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      isComingSoon: true,
      ariaLabel: "Facebook (Coming Soon)",
      icon: (
        <svg
          className="w-4 h-4 stroke-[1.8]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full border-t relative z-20 transition-colors duration-250 bg-[#111215] text-[#ECE7DF] border-[#23211F]"
      role="contentinfo"
      aria-label="Restaurant footer"
    >
      {/* Decorative Champagne Gold Top Glow Accent Line */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#B99A63]/50 to-transparent" />

      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-12">
        {/* Main 5-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-[#23211F]">
          {/* Column 1: Brand Atelier & Identity (Span 4) */}
          <div className="lg:col-span-4 space-y-5">
            <Link
              href="/"
              className="inline-block group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63] rounded-[1px]"
              aria-label="Aurelle Restaurant Home"
            >
              <span className="font-serif text-2xl lg:text-[26px] tracking-[0.32em] font-medium leading-none block transition-colors duration-250 group-hover:text-[#B99A63] text-white">
                A U R E L L E
              </span>
              <span className="text-[9.5px] tracking-[0.38em] text-[#B99A63] uppercase mt-2 block font-medium">
                RESTAURANT &amp; CULINARY ATELIER
              </span>
            </Link>

            <p className="text-[13.5px] font-light leading-relaxed max-w-sm text-[#9C958B]">
              {t("footer.tagline", "Exceptional dining. Thoughtfully timed. A refined culinary sanctuary where every seasonal detail and moment of hospitality matters.")}
            </p>

            {/* Concierge CTA Pill */}
            <div className="pt-1">
              <Link
                href="/reservations"
                className="group inline-flex items-center gap-2 px-4 py-2 border text-[11.5px] uppercase tracking-[0.18em] font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63] rounded-[1px] border-[#B99A63]/60 bg-[#171715] text-[#F6F1E8] hover:border-[#B99A63] hover:bg-[#B99A63] hover:text-[#111215]"
              >
                <span>{t("hero.reserveBtn", "Reserve a Table")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-all duration-300 ease-out group-hover:translate-x-1 text-[#B99A63] group-hover:text-[#111215]" />
              </Link>
            </div>

            {/* Social & Communication Icons */}
            <div className="pt-2">
              <span className="text-[10px] uppercase tracking-[0.24em] font-medium block mb-3 text-[#8F887E]">
                CONNECT &amp; CONCIERGE
              </span>
              <div className="flex items-center gap-2.5">
                {SOCIAL_CHANNELS.map((item) => {
                  const commonClasses = "w-9 h-9 rounded-full border border-[#262B35] bg-[#16181D] flex items-center justify-center text-[#BAB3A8] transition-all duration-250 ease-out hover:text-[#B99A63] hover:border-[#B99A63]/70 hover:bg-[#20221E] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63] cursor-pointer";

                  if (item.isComingSoon) {
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleComingSoonClick(item.name)}
                        aria-label={item.ariaLabel}
                        className={commonClasses}
                      >
                        {item.icon}
                      </button>
                    );
                  }

                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.ariaLabel}
                      className={commonClasses}
                    >
                      {item.icon}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: EXPLORE (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[11px] font-semibold tracking-[0.26em] text-[#B99A63] uppercase border-l-2 border-[#B99A63]/40 pl-2.5">
              {t("footer.navigation", "EXPLORE")}
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <FooterNavLink
                  href="/"
                  label={t("nav.home", "Home")}
                  isActive={pathname === "/"}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/menu"
                  label={t("nav.menu", "Our Menu")}
                  isActive={pathname === "/menu" || pathname?.startsWith("/menu/")}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/our-story"
                  label={t("nav.ourStory", "Our Story & Philosophy")}
                  isActive={pathname === "/our-story"}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/recipes"
                  label={t("nav.recipes", "Signature Recipes")}
                  isActive={pathname === "/recipes" || pathname?.startsWith("/recipes/")}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/journal"
                  label="Chef's Journal"
                  isActive={pathname === "/journal" || pathname?.startsWith("/journal/")}
                />
              </li>
            </ul>
          </div>

          {/* Column 3: DINING (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[11px] font-semibold tracking-[0.26em] text-[#B99A63] uppercase border-l-2 border-[#B99A63]/40 pl-2.5">
              DINING
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <FooterNavLink
                  href="/reservations"
                  label={t("nav.reservations", "Make a Reservation")}
                  isActive={pathname === "/reservations"}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/vip-events"
                  label={t("highlights.privateDining", "Private Dining Salons")}
                  isActive={pathname === "/vip-events"}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/vip-events"
                  label="Banquets &amp; Events"
                  isActive={pathname === "/vip-events"}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/menu"
                  label="Order Takeaway"
                  isActive={false}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/orders/track"
                  label="Live Order Tracking"
                  isActive={pathname === "/orders/track" || pathname?.startsWith("/orders/track/")}
                />
              </li>
            </ul>
          </div>

          {/* Column 4: HELP & INFORMATION (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[11px] font-semibold tracking-[0.26em] text-[#B99A63] uppercase border-l-2 border-[#B99A63]/40 pl-2.5">
              INFORMATION
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <FooterNavLink
                  href="/contact"
                  label="Contact Concierge"
                  isActive={pathname === "/contact"}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/faq"
                  label="Frequently Asked Questions"
                  isActive={pathname === "/faq"}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/privacy"
                  label="Privacy Policy"
                  isActive={pathname === "/privacy"}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/terms"
                  label="Terms &amp; Etiquette"
                  isActive={pathname === "/terms"}
                />
              </li>
              <li>
                <FooterNavLink
                  href="/staff/login"
                  label="Staff Management Portal"
                  isActive={false}
                  badge="Staff"
                />
              </li>
            </ul>
          </div>

          {/* Column 5: VISIT & CONTACT (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[11px] font-semibold tracking-[0.26em] text-[#B99A63] uppercase border-l-2 border-[#B99A63]/40 pl-2.5">
              LOCATION &amp; HOURS
            </h3>
            <div className="space-y-3 text-[13px] text-[#BAB3A8] font-light leading-relaxed">
              {/* Address */}
              <div>
                <p className="text-white font-normal">
                  Alawwa Town
                </p>
                <p className="text-xs text-[#9C958B]">
                  Main Street, Kurunegala District, Sri Lanka
                </p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Alawwa+Town+Sri+Lanka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-[11px] uppercase tracking-wider transition-colors duration-250 mt-1 text-[#B99A63] hover:text-white"
                >
                  <span>Google Maps</span>
                  <ArrowRight className="w-3 h-3 transition-transform duration-250 group-hover:translate-x-0.5" />
                </a>
              </div>

              {/* Direct Telephone */}
              <div className="pt-1 border-t border-[#23211F]/80">
                <span className="text-[10px] uppercase tracking-wider block text-[#8F887E]">
                  Telephone Lines:
                </span>
                <p>
                  <a
                    href="tel:+94372278890"
                    className="hover:text-[#B99A63] transition-colors duration-250 font-normal text-xs text-white"
                  >
                    +94 37 227 8890
                  </a>
                </p>
                <p>
                  <a
                    href="tel:+94771234567"
                    className="hover:text-[#B99A63] transition-colors duration-250 text-xs text-[#BAB3A8]"
                  >
                    +94 77 123 4567 (VIP)
                  </a>
                </p>
              </div>

              {/* Opening Hours */}
              <div className="pt-1 border-t border-[#23211F]/80">
                <span className="text-[10px] uppercase tracking-wider block text-[#8F887E]">
                  Service Hours:
                </span>
                <p className="text-[11.5px] text-[#C4BDAF]">
                  Mon–Thu: 5:30 PM – 10:30 PM
                </p>
                <p className="text-[11.5px] text-[#C4BDAF]">
                  Fri–Sun: 12:00 PM – 11:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Legal, Location Badge & Scroll to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-[12px] text-[#8F887E]">
          {/* Copyright & Regional Designation */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
            <span>
              Copyright &copy; {currentYear} AURELLE. {t("footer.rights", "All rights reserved.")}
            </span>
            <span className="hidden sm:inline text-[#3E3A35]" aria-hidden="true">
              ·
            </span>
            <span className="text-[11.5px] text-[#9C958B]">
              Alawwa Town · Western / North Western Border, Sri Lanka
            </span>
          </div>

          {/* Quick Policies & Scroll To Top */}
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-[#B99A63] transition-colors duration-250 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63] rounded-[1px] text-[#BAB3A8]"
            >
              {t("footer.privacy", "Privacy Policy")}
            </Link>
            <span className="text-[#3E3A35]" aria-hidden="true">
              ·
            </span>
            <Link
              href="/terms"
              className="hover:text-[#B99A63] transition-colors duration-250 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63] rounded-[1px] text-[#BAB3A8]"
            >
              {t("footer.terms", "Terms of Service")}
            </Link>
            <span className="text-[#3E3A35]" aria-hidden="true">
              ·
            </span>
            <Link
              href="/faq"
              className="hover:text-[#B99A63] transition-colors duration-250 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63] rounded-[1px] text-[#BAB3A8]"
            >
              FAQ
            </Link>
            <span className="text-[#3E3A35]" aria-hidden="true">
              ·
            </span>

            {/* Back to Top Button */}
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll back to top of page"
              className="group inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-wider hover:text-[#B99A63] transition-colors duration-250 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63] rounded-[1px] p-1 cursor-pointer text-[#BAB3A8]"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 text-[#B99A63] transition-transform duration-250 ease-out group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Luxury Toast Notification for Coming Soon Social Channels */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 max-w-sm mx-auto sm:mx-0 z-50 p-4 rounded-[4px] bg-[#16181D]/95 backdrop-blur-md border border-[#B99A63]/60 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(185,154,99,0.15)] text-[#ECE7DF]"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#B99A63]/15 border border-[#B99A63]/40 flex items-center justify-center shrink-0 text-[#B99A63] mt-0.5">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] uppercase tracking-[0.22em] font-semibold text-[#B99A63]">
                    Coming Soon!
                  </span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 font-medium">
                    {toast.channel}
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-[#D2CBC1] mt-1 font-light">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
                className="text-[#8F887E] hover:text-[#ECE7DF] transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B99A63] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Subtle Progress Bar */}
            <div className="mt-3 w-full h-[1.5px] bg-[#23211F] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className="h-full bg-gradient-to-r from-[#B99A63] to-[#DFD0B8]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.footer>
  );
}
