"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowLeft } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SUGGESTIONS = [
  { label: "Vegan dishes", href: "/menu?search=vegan" },
  { label: "Sri Lankan flavours", href: "/menu?search=sri+lankan" },
  { label: "Private dining", href: "/vip-events" },
  { label: "Chef’s recipes", href: "/recipes" },
];

const RECENTS = [
  { label: "Ceylon pepper", href: "/menu?search=ceylon+pepper" },
];

export default function SearchModal({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
}: SearchModalProps) {
  const router = useRouter();

  // Close on Escape key press & lock body scroll
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  const handleSelectQuery = (query: string, href: string) => {
    setSearchQuery(query);
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10">
          {/* Dimmed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Half-Screen Centered Card Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-[#16181F] border border-stone-800 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 sm:p-10 lg:p-12 z-10 [color-scheme:dark]"
          >
            {/* Modal Header Bar: Back & Close */}
            <div className="flex items-center justify-between pb-6 border-b border-stone-800">
              <button
                type="button"
                onClick={onClose}
                aria-label="Go back"
                className="group inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-semibold tracking-[0.2em] uppercase transition-colors"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>BACK</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
              >
                <X className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Title Section */}
            <div className="mt-8 space-y-2">
              <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                DISCOVER
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-normal text-white tracking-tight leading-none">
                Search AURELLE
              </h2>
              <p className="text-stone-400 text-xs sm:text-sm font-light pt-1">
                Find dishes, drinks, cuisines, recipes and dining experiences.
              </p>
            </div>

            {/* Search Input Box */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 pb-3 border-b border-stone-700 focus-within:border-[#C1A87D] transition-colors flex items-center gap-3.5"
            >
              <Search className="w-5 h-5 text-stone-400 stroke-[1.8] flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent font-serif italic text-xl sm:text-2xl lg:text-[26px] text-white placeholder-stone-500/70 outline-none"
              />
            </form>

            {/* Suggestions & Featured Card Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-10">
              {/* Left Column: Suggestions & Recent Queries */}
              <div className="md:col-span-5 space-y-8">
                {/* Suggestions */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-stone-400 font-medium block">
                    SUGGESTIONS
                  </span>
                  <ul className="space-y-2.5">
                    {SUGGESTIONS.map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectQuery(item.label, item.href)
                          }
                          className="text-stone-300 hover:text-white text-sm font-light tracking-wide transition-colors text-left"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recents */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-stone-400 font-medium block">
                    RECENT
                  </span>
                  <ul className="space-y-2.5">
                    {RECENTS.map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectQuery(item.label, item.href)
                          }
                          className="text-stone-300 hover:text-white text-sm font-light tracking-wide transition-colors text-left"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Popular Now Card */}
              <div className="md:col-span-7">
                <div className="bg-[#1C1F28] border border-stone-800 rounded-sm p-6 sm:p-8 space-y-4 shadow-xl">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium block">
                    POPULAR NOW
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-normal text-white tracking-tight">
                    Seasonal tasting menu
                  </h3>
                  <p className="text-stone-300 text-xs font-light leading-relaxed">
                    Explore six courses inspired by the island harvest.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/menu"
                      onClick={onClose}
                      className="inline-flex items-center justify-center bg-[#F6F2EB] hover:bg-white text-[#14161B] text-[11px] font-semibold tracking-[0.16em] uppercase px-6 py-3 rounded-[2px] transition-colors shadow-md"
                    >
                      VIEW MENU
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
