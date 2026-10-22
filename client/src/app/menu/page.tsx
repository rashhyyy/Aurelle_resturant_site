"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { useSocket } from "../../context/SocketContext";
import { usePreferences } from "../../context/PreferencesContext";
import { apiClient } from "../../lib/api";
import { ClientMenuItem, ClientMenuCategory } from "../../types/menu";
import {
  Search,
  ChevronDown,
  Download,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface MenuItemCard {
  id: string | number;
  name: string;
  price: string;
  priceNum: number;
  description: string;
  image: string;
  categories: string[];
  dietaryTags: string[];
  spiceLevel?: string;
  isAvailable: boolean;
}

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart, setCartDrawerOpen } = useCart();
  const { socket } = useSocket();
  const { t, formatPrice } = usePreferences();

  const [categories, setCategories] = useState<string[]>(["All"]);
  const [items, setItems] = useState<MenuItemCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("Chef recommended");

  // Fetch Public Menu & Categories from MongoDB
  const fetchMenuData = useCallback(async () => {
    try {
      setFetchError(null);
      const [dishesRes, catsRes] = await Promise.all([
        apiClient<{ success: boolean; data: { dishes: ClientMenuItem[] } }>("/menu?limit=100"),
        apiClient<{ success: boolean; data: ClientMenuCategory[] }>("/menu/categories"),
      ]);

      const ALLOWED_CATEGORIES = [
        "Sri Lankan",
        "Indian",
        "East Asian",
        "Plant-led",
        "Dessert",
        "Drinks",
      ];

      if (catsRes?.success && Array.isArray(catsRes.data)) {
        const validCats = catsRes.data
          .filter((c) =>
            ALLOWED_CATEGORIES.some(
              (allowed) => allowed.toLowerCase() === c.name.toLowerCase().trim()
            )
          )
          .sort((a, b) => {
            const idxA = ALLOWED_CATEGORIES.findIndex(
              (x) => x.toLowerCase() === a.name.toLowerCase().trim()
            );
            const idxB = ALLOWED_CATEGORIES.findIndex(
              (x) => x.toLowerCase() === b.name.toLowerCase().trim()
            );
            return idxA - idxB;
          })
          .map((c) => c.name);

        setCategories(validCats.length > 0 ? ["All", ...validCats] : ["All", ...ALLOWED_CATEGORIES]);
      } else {
        setCategories(["All", ...ALLOWED_CATEGORIES]);
      }

      if (dishesRes?.success && Array.isArray(dishesRes.data?.dishes)) {
        const mappedDishes: MenuItemCard[] = dishesRes.data.dishes
          .filter((d) =>
            ALLOWED_CATEGORIES.some(
              (allowed) => allowed.toLowerCase() === (d.categoryName || "").toLowerCase().trim()
            )
          )
          .map((d) => ({
            id: d.id,
            name: d.name,
            price: d.formattedPrice,
            priceNum: Math.round(d.priceMinor / 100),
            description: d.shortDescription || d.description,
            image: d.images?.[0] || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000",
            categories: ["All", d.categoryName],
            dietaryTags: d.dietaryTags || [],
            spiceLevel: d.spiceLevel && d.spiceLevel !== "None" ? d.spiceLevel : undefined,
            isAvailable: d.isAvailable,
          }));
        setItems(mappedDishes);
      }
    } catch (err: any) {
      console.warn("[MenuPage] Backend fetch notice:", err?.message || err);
      setFetchError(err.message || "Failed to load restaurant menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchMenuData();
    };

    socket.on("menu:updated", handleUpdate);
    socket.on("menu:availability_changed", handleUpdate);

    return () => {
      socket.off("menu:updated", handleUpdate);
      socket.off("menu:availability_changed", handleUpdate);
    };
  }, [socket, fetchMenuData]);

  // Read URL query parameter or hash on load & updates
  useEffect(() => {
    const categoryParam = searchParams?.get("category");
    if (categoryParam && categories.length > 1) {
      const normalizedParam = categoryParam.toLowerCase().replace(/[-_]/g, " ");
      const matched =
        categories.find((c) => c.toLowerCase() === normalizedParam) ||
        categories.find(
          (c) => c.toLowerCase().replace(/[-_]/g, " ") === normalizedParam
        );
      if (matched) {
        setSelectedCategory(matched);
      }
    } else if (typeof window !== "undefined" && window.location.hash && categories.length > 1) {
      const hash = window.location.hash
        .replace("#", "")
        .toLowerCase()
        .replace(/[-_]/g, " ");
      const matched = categories.find(
        (c) => c.toLowerCase().replace(/[-_]/g, " ") === hash
      );
      if (matched) {
        setSelectedCategory(matched);
      }
    }
  }, [searchParams, categories]);

  // Smooth scroll down to dishes section when navigated from homepage traditions
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.location.hash === "#menu-items" || searchParams?.get("category"))
    ) {
      const el = document.getElementById("menu-items");
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedCategory, searchParams]);

  const handleAddToCart = (dish: MenuItemCard) => {
    if (!dish.isAvailable) return;
    addToCart({
      id: dish.id,
      name: dish.name,
      priceNum: dish.priceNum,
      priceStr: formatPrice(dish.priceNum),
      description: dish.description,
      image: dish.image,
    });
    setCartDrawerOpen(false);
    router.push("/cart");
  };

  // Filter items dynamically based on category, search query, and sort
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" ||
        item.categories.includes(selectedCategory);
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.dietaryTags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });

    if (sortOption === "Price: Low to High") {
      result.sort((a, b) => a.priceNum - b.priceNum);
    } else if (sortOption === "Price: High to Low") {
      result.sort((a, b) => b.priceNum - a.priceNum);
    }

    return result;
  }, [items, selectedCategory, searchQuery, sortOption]);

  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 pb-24">
      {/* ======================================================== */}
      {/* 1. HERO HEADER                                           */}
      {/* ======================================================== */}
      <section data-hero="true" className="relative w-full h-[62vh] min-h-[440px] sm:min-h-[480px] max-h-[580px] flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/images/menu-hero.jpg"
            alt="Aurelle Gourmet Culinary Presentation"
            fill
            priority
            quality={95}
            className="object-cover object-center brightness-[1.05] contrast-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />
        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-4 pt-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-[11px] sm:text-xs uppercase tracking-[0.32em] text-white keep-white font-medium block drop-shadow-sm"
          >
            AURELLE MENU
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-[70px] font-serif font-normal text-white keep-white tracking-tight leading-[1.08] drop-shadow-md"
          >
            A world of flavour, <br />
            considered.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="text-stone-100 text-white/95 keep-white text-xs sm:text-[13px] font-light leading-relaxed max-w-2xl mx-auto pt-2 drop-shadow-sm"
          >
            Crafted with indigenous Ceylon spices, seasonal coastal catches, and time-honored artisanal preparations.
          </motion.p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SEARCH & FILTER CONTROLS BAR                         */}
      {/* ======================================================== */}
      <section
        id="menu-controls"
        className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-10 scroll-mt-24"
      >
        {/* Search Input Box */}
        <div className="max-w-xl">
          <label className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-stone-400 font-medium block mb-2">
            SEARCH THE MENU
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Try "Sri Lankan", "prawns", "tandoori" or "vegan"'
              className="w-full bg-[#1A1D24] border border-[#2A2E38] rounded-[2px] px-4 py-3.5 text-sm text-stone-200 placeholder-stone-500 outline-none focus:border-[#C1A87D] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2.5 flex-wrap mt-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const catLabel =
              cat === "All"
                ? t("menu.all", "All")
                : cat === "Starters"
                ? t("menu.starters", "Starters")
                : cat === "Mains"
                ? t("menu.mains", "Mains")
                : cat === "Desserts"
                ? t("menu.desserts", "Desserts")
                : cat === "Beverages"
                ? t("menu.beverages", "Beverages")
                : cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white text-black font-semibold shadow-md"
                    : "bg-[#181B22] text-stone-300 border border-[#272B35] hover:border-stone-500 hover:text-white"
                }`}
              >
                {catLabel}
              </button>
            );
          })}
        </div>

        {/* Action strip: Count, Sort dropdown, and PDF Download */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-12 pt-6 border-t border-stone-800/80">
          <span className="text-xs text-stone-400 font-light">
            {filteredItems.length} dishes in selection
          </span>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-[#1A1D24] text-xs font-medium text-stone-200 border border-[#272B35] px-4 py-2.5 pr-9 rounded-[2px] outline-none focus:border-[#C1A87D] cursor-pointer"
              >
                <option value="Chef recommended">Chef recommended</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Download Menu PDF Button */}
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-[#171A21] hover:bg-[#20242E] border border-stone-600 hover:border-white text-stone-200 hover:text-white text-[11px] font-semibold tracking-[0.16em] uppercase px-4 py-2.5 rounded-[2px] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[1.8]" />
              <span>DOWNLOAD MENU PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. MENU ITEMS GRID                                       */}
      {/* ======================================================== */}
      <section
        id="menu-items"
        className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 mt-8 scroll-mt-28"
      >
        {/* Error notification */}
        {fetchError && (
          <div className="mb-6 p-4 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={fetchMenuData}
              className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-mono text-[11px] uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        )}

        {/* Active Tradition Banner when a filter is applied */}
        {selectedCategory !== "All" && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-[#181B22] border border-[#2D3341] rounded-[2px] shadow-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#C1A87D]" />
              <span className="text-[10.5px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium">
                Active Section:
              </span>
              <span className="font-serif text-lg sm:text-xl text-white font-normal">
                {selectedCategory}
              </span>
              <span className="text-xs text-stone-400 font-light">
                ({filteredItems.length}{" "}
                {filteredItems.length === 1 ? "dish" : "dishes"} available)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className="text-xs text-[#C1A87D] hover:text-white transition-colors underline underline-offset-4 cursor-pointer text-left sm:text-right"
            >
              Show all dishes &amp; traditions
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-[#181B22] border border-[#242833] rounded-[2px] h-96 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="w-full h-44 bg-stone-800/40 rounded" />
                <div className="space-y-2 mt-4">
                  <div className="h-5 bg-stone-800/40 rounded w-3/4" />
                  <div className="h-4 bg-stone-800/40 rounded w-1/2" />
                  <div className="h-10 bg-stone-800/40 rounded w-full mt-2" />
                </div>
                <div className="h-8 bg-stone-800/40 rounded w-full mt-4" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <Sparkles className="w-8 h-8 text-[#C1A87D] mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-xl text-white">No dishes found in this selection</h3>
            <p className="text-stone-400 text-xs mt-1">Try another category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            <AnimatePresence>
              {filteredItems.map((dish) => (
                <motion.div
                  key={dish.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="bg-[#181B22] border border-[#242833] rounded-[2px] flex flex-col justify-between overflow-hidden group hover:border-[#383E4E] transition-colors shadow-xl relative"
                >
                  {/* Image Section */}
                  <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-black">
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                        !dish.isAvailable ? "grayscale contrast-125 opacity-60" : ""
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181B22] via-transparent to-transparent opacity-80" />

                    {/* Primary Cuisine Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/80 backdrop-blur-md text-[#E8DCC4] text-[9.5px] uppercase font-semibold tracking-wider px-2.5 py-0.5 border border-white/10 rounded-[2px]">
                        {dish.categories.find((c) => c !== "All") || "Aurelle"}
                      </span>
                    </div>

                    {/* Out of Stock Overlay Badge */}
                    {!dish.isAvailable && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-rose-950/90 text-rose-300 border border-rose-500/40 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[2px]">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Header: Title & Price */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-lg sm:text-xl text-white font-normal tracking-wide leading-snug line-clamp-1">
                          {dish.name}
                        </h3>
                        <span className="font-sans text-xs sm:text-sm font-semibold text-stone-200 whitespace-nowrap">
                          {formatPrice(dish.priceNum)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-stone-400 text-xs font-light leading-relaxed mt-2 line-clamp-2">
                        {dish.description}
                      </p>

                      {/* Dietary Tags & Spice */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-3">
                        {dish.dietaryTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-medium tracking-[0.1em] uppercase px-1.5 py-0.5 bg-[#20242E] text-stone-400 border border-[#2D3341] rounded-[2px]"
                          >
                            {tag}
                          </span>
                        ))}
                        {dish.spiceLevel && (
                          <span className="text-[10.5px] text-stone-400 font-light">
                            {dish.spiceLevel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Add to Bag */}
                    <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-stone-800/80">
                      <span className="text-[11px] text-stone-400 font-light truncate mr-2">
                        {dish.isAvailable ? t("menu.freshlyPrepared", "Freshly prepared") : t("menu.soldOut", "Currently unavailable")}
                      </span>

                      {dish.isAvailable ? (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => handleAddToCart(dish)}
                          className="inline-flex items-center gap-1.5 bg-[#12141A] hover:bg-black text-[#E8DCC4] hover:text-white border border-[#2C313D] hover:border-[#C1A87D] text-[10.5px] font-semibold tracking-[0.12em] uppercase px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#C1A87D]" />
                          <span>{t("dishes.addToBag", "ADD TO BAG")}</span>
                        </motion.button>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center gap-1.5 bg-[#14161C] text-stone-500 border border-stone-800 text-[10px] font-mono uppercase px-3 py-1.5 rounded-[2px] opacity-60 cursor-not-allowed"
                        >
                          UNAVAILABLE
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#111215] flex items-center justify-center text-stone-400">
          <span className="font-serif text-lg tracking-widest uppercase">
            Loading Aurelle Menu...
          </span>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
