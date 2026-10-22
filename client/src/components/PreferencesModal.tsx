"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useTheme } from "../context/StaffThemeContext";
import { usePreferences } from "../context/PreferencesContext";
import { Language, Currency } from "../lib/translations";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  setLanguage?: (lang: string) => void;
  currency?: string;
  setCurrency?: (curr: string) => void;
}

export default function PreferencesModal({
  isOpen,
  onClose,
  language: propLanguage,
  setLanguage: propSetLanguage,
  currency: propCurrency,
  setCurrency: propSetCurrency,
}: PreferencesModalProps) {
  const [activeTab, setActiveTab] = React.useState("Preferences");
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [appearance, setAppearance] = React.useState(theme === "light" ? "Light" : "Dark");
  const [emailNotifications, setEmailNotifications] = React.useState(true);

  const preferences = usePreferences();
  const currentLanguage = propLanguage || preferences.language;
  const currentCurrency = propCurrency || preferences.currency;

  const handleLanguageChange = (lang: string) => {
    if (propSetLanguage) propSetLanguage(lang);
    preferences.setLanguage(lang as Language);
  };

  const handleCurrencyChange = (curr: string) => {
    if (propSetCurrency) propSetCurrency(curr);
    preferences.setCurrency(curr as Currency);
  };

  const t = preferences.t;

  useEffect(() => {
    setAppearance(theme === "light" ? "Light" : "Dark");
  }, [theme]);

  // Close on Escape key press and prevent background scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  const navItems = [
    "Overview",
    "My orders",
    "Reservations & events",
    "Notifications",
    "Preferences",
    "Sign out",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none">
          {/* Dimmed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Centered Half-Screen Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-5xl max-h-[88vh] overflow-y-auto rounded-xl p-6 sm:p-10 z-10 transition-colors duration-200 ${
              isDark
                ? "bg-[#111215] border border-stone-800 text-stone-100 shadow-[0_25px_60px_rgba(0,0,0,0.9)] [color-scheme:dark]"
                : "bg-[#FFFCF7] border border-[#DED5C7] text-[#171715] shadow-2xl [color-scheme:light]"
            }`}
          >
            {/* Top Modal Header Bar: Back & Close Buttons */}
            <div
              className={`flex items-center justify-between pb-6 border-b ${
                isDark ? "border-stone-800" : "border-[#DED5C7]"
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Go back"
                className={`group inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase transition-colors ${
                  isDark ? "text-stone-400 hover:text-white" : "text-[#5C5852] hover:text-[#171715]"
                }`}
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>{t("pref.back", "BACK")}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close preferences"
                className={`p-1.5 rounded-full transition-colors ${
                  isDark
                    ? "text-stone-400 hover:text-white hover:bg-stone-800/60"
                    : "text-[#5C5852] hover:text-[#171715] hover:bg-[#EDE5D8]"
                }`}
              >
                <X className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Layout Grid: Left Sidebar + Right Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mt-8">
              {/* Left Column: MY AURELLE Navigation */}
              <div
                className={`md:col-span-4 border-b md:border-b-0 md:border-r pr-0 md:pr-6 pb-6 md:pb-0 space-y-6 ${
                  isDark ? "border-stone-800/80" : "border-[#DED5C7]"
                }`}
              >
                <span className="text-[10px] uppercase tracking-[0.26em] text-[#B99A63] font-medium block">
                  MY AURELLE
                </span>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = activeTab === item;
                    const isSignOut = item === "Sign out";

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => !isSignOut && setActiveTab(item)}
                        className={`w-full flex items-center justify-between py-3 px-2 text-left text-sm transition-colors cursor-pointer ${
                          isActive
                            ? isDark
                              ? "text-white font-semibold border-b border-stone-700/60"
                              : "text-[#171715] font-semibold border-b border-[#B99A63]"
                            : isSignOut
                              ? "text-stone-400 hover:text-rose-400 pt-6"
                              : isDark
                                ? "text-stone-400 hover:text-stone-200 border-b border-stone-800/40"
                                : "text-[#5C5852] hover:text-[#171715] border-b border-[#DED5C7]/60"
                        }`}
                      >
                        <span>{item}</span>
                        {!isSignOut && (
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isActive
                                ? isDark ? "text-white" : "text-[#171715]"
                                : isDark ? "text-stone-600" : "text-[#5C5852]/60"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Right Column: Preferences Settings */}
              <div className="md:col-span-8 space-y-8">
                <h2
                  className={`text-3xl sm:text-4xl font-serif font-normal tracking-tight ${
                    isDark ? "text-white" : "text-[#171715]"
                  }`}
                >
                  {t("pref.title", "Preferences")}
                </h2>

                <form onSubmit={handleSave} className="space-y-8">
                  {/* 1. Language */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                      isDark ? "border-stone-800/80" : "border-[#DED5C7]"
                    }`}
                  >
                    <div className="space-y-1 max-w-sm">
                      <h3
                        className={`text-sm sm:text-base font-medium ${
                          isDark ? "text-white" : "text-[#171715]"
                        }`}
                      >
                        {t("pref.langTitle", "Language")}
                      </h3>
                      <p
                        className={`text-xs font-light ${
                          isDark ? "text-stone-400" : "text-[#5C5852]"
                        }`}
                      >
                        {t("pref.langDesc", "Choose your interface language")}
                      </p>
                    </div>

                    <div className="w-full sm:w-64 space-y-1">
                      <span
                        className={`text-[10px] uppercase tracking-wider block font-medium ${
                          isDark ? "text-stone-400" : "text-[#5C5852]"
                        }`}
                      >
                        LANGUAGE
                      </span>
                      <div className="relative">
                        <select
                          value={currentLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className={`w-full appearance-none rounded-[2px] px-3.5 py-2.5 pr-8 text-xs sm:text-sm outline-none transition-colors cursor-pointer ${
                            isDark
                              ? "bg-[#181B22] border border-stone-700 text-stone-200 focus:border-[#C1A87D]"
                              : "bg-[#F6F1E8] border border-[#DED5C7] text-[#171715] focus:border-[#B99A63]"
                          }`}
                        >
                          <option value="EN">English</option>
                          <option value="SI">Sinhala (සිංහල)</option>
                          <option value="TA">Tamil (தமிழ்)</option>
                          <option value="FR">Français</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* 2. Display currency */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                      isDark ? "border-stone-800/80" : "border-[#DED5C7]"
                    }`}
                  >
                    <div className="space-y-1 max-w-sm">
                      <h3
                        className={`text-sm sm:text-base font-medium ${
                          isDark ? "text-white" : "text-[#171715]"
                        }`}
                      >
                        {t("pref.currTitle", "Display currency")}
                      </h3>
                      <p
                        className={`text-xs font-light ${
                          isDark ? "text-stone-400" : "text-[#5C5852]"
                        }`}
                      >
                        {t("pref.currDesc", "Convert prices dynamically across the entire website.")}
                      </p>
                    </div>

                    <div className="w-full sm:w-64 space-y-1">
                      <span
                        className={`text-[10px] uppercase tracking-wider block font-medium ${
                          isDark ? "text-stone-400" : "text-[#5C5852]"
                        }`}
                      >
                        CURRENCY
                      </span>
                      <div className="relative">
                        <select
                          value={currentCurrency}
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          className={`w-full appearance-none rounded-[2px] px-3.5 py-2.5 pr-8 text-xs sm:text-sm outline-none transition-colors cursor-pointer ${
                            isDark
                              ? "bg-[#181B22] border border-stone-700 text-stone-200 focus:border-[#C1A87D]"
                              : "bg-[#F6F1E8] border border-[#DED5C7] text-[#171715] focus:border-[#B99A63]"
                          }`}
                        >
                          <option value="LKR">LKR — Sri Lankan Rupee</option>
                          <option value="USD">USD — US Dollar ($)</option>
                          <option value="EUR">EUR — Euro (€)</option>
                          <option value="GBP">GBP — British Pound (£)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* 3. Appearance */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                      isDark ? "border-stone-800/80" : "border-[#DED5C7]"
                    }`}
                  >
                    <div className="space-y-1 max-w-sm">
                      <h3
                        className={`text-sm sm:text-base font-medium ${
                          isDark ? "text-white" : "text-[#171715]"
                        }`}
                      >
                        {t("pref.themeTitle", "Appearance")}
                      </h3>
                      <p
                        className={`text-xs font-light ${
                          isDark ? "text-stone-400" : "text-[#5C5852]"
                        }`}
                      >
                        {t("pref.themeDesc", "Use a theme that feels comfortable.")}
                      </p>
                    </div>

                    <div className="w-full sm:w-64 space-y-1">
                      <span
                        className={`text-[10px] uppercase tracking-wider block font-medium ${
                          isDark ? "text-stone-400" : "text-[#5C5852]"
                        }`}
                      >
                        THEME
                      </span>
                      <div className="relative">
                        <select
                          value={appearance}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAppearance(val);
                            if (val === "Dark") setTheme("dark");
                            if (val === "Light") setTheme("light");
                          }}
                          className={`w-full appearance-none rounded-[2px] px-3.5 py-2.5 pr-8 text-xs sm:text-sm outline-none transition-colors cursor-pointer ${
                            isDark
                              ? "bg-[#181B22] border border-stone-700 text-stone-200 focus:border-[#C1A87D]"
                              : "bg-[#F6F1E8] border border-[#DED5C7] text-[#171715] focus:border-[#B99A63]"
                          }`}
                        >
                          <option value="Dark">Dark</option>
                          <option value="Light">Light</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* 4. Order updates */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8">
                    <div className="space-y-1 max-w-sm">
                      <h3
                        className={`text-sm sm:text-base font-medium ${
                          isDark ? "text-white" : "text-[#171715]"
                        }`}
                      >
                        Order updates
                      </h3>
                      <p
                        className={`text-xs font-light ${
                          isDark ? "text-stone-400" : "text-[#5C5852]"
                        }`}
                      >
                        Channels appear only when configured.
                      </p>
                    </div>

                    <label
                      className={`flex items-center gap-2.5 cursor-pointer text-xs ${
                        isDark ? "text-stone-300" : "text-[#5C5852]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) =>
                          setEmailNotifications(e.target.checked)
                        }
                        className={`w-4 h-4 accent-[#B99A63] rounded cursor-pointer ${
                          isDark ? "bg-stone-900 border-stone-700" : "bg-[#F6F1E8] border-[#DED5C7]"
                        }`}
                      />
                      <span>Email notifications</span>
                    </label>
                  </div>

                  {/* 5. Save Button */}
                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      className={`inline-flex items-center justify-center text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3.5 rounded-[2px] transition-colors shadow-md cursor-pointer ${
                        isDark
                          ? "bg-[#F6F2EB] hover:bg-white text-[#111215]"
                          : "bg-[#B99A63] hover:bg-[#CCA96F] text-[#171715]"
                      }`}
                    >
                      {t("pref.save", "SAVE PREFERENCES")}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
