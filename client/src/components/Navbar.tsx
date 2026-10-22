"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sun,
  Moon,
  User,
  ShoppingBag,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import SearchModal from "./SearchModal";
import PreferencesModal from "./PreferencesModal";
import AccountModal from "./AccountModal";
import { NotificationBell } from "./notifications/NotificationBell";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/StaffThemeContext";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

const NAV_LINKS = [
  { name: "Home", href: "/", key: "nav.home" },
  { name: "Menu", href: "/menu", key: "nav.menu" },
  { name: "Reservations", href: "/reservations", key: "nav.reservations" },
  { name: "VIP & Events", href: "/vip-events", key: "nav.vip" },
  { name: "Recipes", href: "/recipes", key: "nav.recipes" },
  { name: "Our Story", href: "/our-story", key: "nav.ourStory" },
  { name: "Contact", href: "/contact", key: "nav.contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Hide customer navbar on staff portal routes
  if (pathname?.startsWith("/staff")) {
    return null;
  }

  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cart Context for drawer & count
  const { totalCount, setCartDrawerOpen } = useCart();

  // Preferences Context for language, currency, and translations
  const {
    language,
    currency,
    preferencesOpen,
    setPreferencesOpen,
    t,
  } = usePreferences();

  // Account / Profile Overview Modal state
  const [accountOpen, setAccountOpen] = useState(false);

  const handleProfileClick = () => {
    if (!user) {
      router.push("/signin");
    } else {
      router.push("/profile");
    }
  };

  // Track window scroll:
  // 1. Transparency adaptation
  // 2. Hide on scroll DOWN, reveal on scroll UP
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Adapt background styling
      setScrolled(currentScrollY > 20);

      // Scroll direction behavior:
      // Always show navbar near the top of page
      if (currentScrollY < 40) {
        setVisible(true);
      } else if (
        currentScrollY > lastScrollY &&
        currentScrollY - lastScrollY > 6
      ) {
        // Scrolling down -> hide navbar (unless mobile menu is open)
        if (!mobileMenuOpen) {
          setVisible(false);
        }
      } else if (lastScrollY - currentScrollY > 6) {
        // Scrolling up -> show navbar
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: visible ? 0 : "-100%" }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-250 ${
          scrolled
            ? "bg-black/90 backdrop-blur-md border-b border-white/10 shadow-md nav-scrolled"
            : "bg-black/40 backdrop-blur-[4px] border-b border-white/5"
        }`}
      >
        {/* Sleek, reduced height container (h-14 on mobile, h-16 on desktop) */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between relative">
          {/* Left Side: Brand Logo */}
          <div className="flex items-center flex-shrink-0 z-10">
            <Link
              href="/"
              className="flex flex-col items-start justify-center group"
            >
              <span className="font-serif text-lg sm:text-xl md:text-[21px] tracking-[0.24em] font-medium leading-none transition-colors group-hover:opacity-85 text-white">
                A U R E L L E
              </span>
              <span className="text-[7.5px] tracking-[0.32em] text-[#C1A87D] uppercase mt-1 font-medium">
                RESTAURANT
              </span>
            </Link>
          </div>

          {/* Center: Desktop Nav Links (Horizontally Centered in the Navigation Bar) */}
          <nav className="hidden lg:flex items-center justify-center space-x-6 xl:space-x-8 absolute left-1/2 -translate-x-1/2 z-10">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative py-1 text-[13px] xl:text-[13.5px] font-medium tracking-[0.04em] transition-colors whitespace-nowrap ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-stone-300 hover:text-white"
                  }`}
                >
                  {t(link.key, link.name)}

                  {/* Animated Gold Underline */}
                  <span
                    className={`absolute -bottom-1 left-0 right-0 h-[2px] bg-[#C1A87D] rounded-full transition-all duration-300 transform origin-left ${
                      isActive
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right Actions & Utilities */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0 z-10 transition-colors text-stone-300">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-1.5 transition-colors cursor-pointer hover:text-white"
            >
              <Search className="w-[17px] h-[17px] stroke-[1.8]" />
            </button>

            {/* Language Selector */}
            <button
              type="button"
              onClick={() => setPreferencesOpen(true)}
              className="text-[11.5px] font-medium tracking-wider transition-colors cursor-pointer px-1 hover:text-white"
              title="Change Language"
            >
              {language}
            </button>

            {/* Currency Selector */}
            <button
              type="button"
              onClick={() => setPreferencesOpen(true)}
              className="text-[11.5px] font-medium tracking-wider transition-colors cursor-pointer px-1 hover:text-white"
              title="Change Currency"
            >
              {currency}
            </button>

            {/* Light / Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              suppressHydrationWarning
              aria-label={
                !mounted
                  ? "Toggle theme"
                  : isDark
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
              }
              title={
                !mounted
                  ? "Toggle theme"
                  : isDark
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
              }
              className="p-1.5 rounded-full transition-all duration-200 cursor-pointer hover:text-white hover:bg-white/10 text-stone-300"
            >
              {mounted && isDark ? (
                <Moon className="w-[17px] h-[17px] stroke-[1.8] text-stone-300" />
              ) : (
                <Sun className="w-[17px] h-[17px] stroke-[1.8] text-[#B99A63]" />
              )}
            </button>

            {/* Notifications Bell */}
            <div className="flex items-center">
              <NotificationBell mode="customer" />
            </div>

            {/* User Account / Profile Icon Button */}
            <button
              type="button"
              onClick={handleProfileClick}
              aria-label={user ? "My Profile" : "Sign In"}
              className="p-1.5 transition-colors cursor-pointer hover:text-white"
            >
              <User className="w-[17px] h-[17px] stroke-[1.8]" />
            </button>

            {/* Shopping Bag / Orders Button */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label="Cart"
              className="p-1.5 transition-colors relative cursor-pointer hover:text-white"
            >
              <ShoppingBag className="w-[17px] h-[17px] stroke-[1.8]" />
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C1A87D] text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 cursor-pointer transition-colors text-stone-200 hover:text-white"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <MenuIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden backdrop-blur-xl border-t px-6 py-5 space-y-4 shadow-2xl overflow-hidden transition-colors bg-stone-950/98 border-white/10"
            >
              <nav className="flex flex-col space-y-2.5">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-[14.5px] font-medium py-1 transition-colors ${
                        isActive
                          ? "text-[#C1A87D] font-semibold"
                          : "text-stone-300 hover:text-white"
                      }`}
                    >
                      {t(link.key, link.name)}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t flex flex-col gap-2.5 text-xs transition-colors border-white/10 text-stone-400">
                {/* Mobile Theme Toggle Row */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  suppressHydrationWarning
                  aria-label={
                    isDark ? "Switch to Light Mode" : "Switch to Dark Mode"
                  }
                  className="w-full text-left py-2 px-3 rounded-[3px] transition-colors flex items-center justify-between font-medium cursor-pointer bg-white/5 text-stone-200 hover:bg-white/10 hover:text-white border border-white/10"
                >
                  <span className="flex items-center gap-2.5">
                    {mounted && isDark ? (
                      <Moon className="w-4 h-4 text-stone-300" />
                    ) : (
                      <Sun className="w-4 h-4 text-[#B99A63]" />
                    )}
                    <span>
                      {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    </span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#B99A63]/15 text-[#B99A63] font-semibold border border-[#B99A63]/30">
                    {isDark ? "Dark Mode" : "Light Mode"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleProfileClick();
                  }}
                  className="w-full text-left py-1 transition-colors hover:text-white"
                >
                  {user ? t("nav.profile", "My Profile") : t("nav.signIn", "Sign In / Register")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPreferencesOpen(true);
                  }}
                  className="w-full text-left py-1 transition-colors hover:text-white"
                >
                  {t("nav.preferences", "Preferences")} ({language} / {currency})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCartDrawerOpen(true);
                  }}
                  className="w-full text-left py-1 transition-colors flex items-center justify-between hover:text-white"
                >
                  <span>{t("nav.shoppingBag", "Shopping Bag")}</span>
                  <span className="font-mono text-[#C1A87D]">
                    ({totalCount})
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Full-Screen Search Modal Overlay */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Preferences Modal Overlay */}
      <PreferencesModal
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />

      {/* Account / Overview Modal Overlay */}
      <AccountModal
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        onOpenPreferences={() => setPreferencesOpen(true)}
      />
    </>
  );
}
