"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { apiClient } from "../lib/api";
import { usePreferences } from "../context/PreferencesContext";
import {
  ArrowRight,
  BellRing,
  Clock,
  ShoppingBag,
  MapPin,
} from "lucide-react";

// Luxury cubic-bezier easing for smooth, editorial-grade scroll transitions
const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;

/* =========================================================================
   1. HERO SECTION
   ========================================================================= */
const HERO_SLIDES = [
  {
    id: 1,
    src: "/images/hero-bg2.jpg",
    alt: "Fresh nigiri sushi course served on slate at Aurelle",
  },
  {
    id: 2,
    src: "/images/hero-bg1.jpg",
    alt: "Artfully plated seasonal dish at Aurelle",
  },
  {
    id: 3,
    src: "/images/hero-bg3.jpg",
    alt: "Refined culinary broth and ramen presentation",
  },
];

function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = usePreferences();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section data-hero="true" className="relative w-full p-0 m-0">
      <div className="relative w-full h-[78vh] min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] max-h-[760px] rounded-b-[2rem] sm:rounded-b-[3rem] lg:rounded-b-[3.5rem] overflow-hidden bg-[#0A0A0A] flex flex-col justify-between px-4 sm:px-12 lg:px-20 pt-16 sm:pt-20 pb-8 sm:pb-12 shadow-2xl">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.02, y: 0 }}
              animate={{
                opacity: 1,
                scale: [1.02, 1.06, 1.02],
                y: [0, -6, 0],
              }}
              exit={{
                opacity: 0,
                scale: 1.07,
                transition: { duration: 2.2, ease: "easeInOut" },
              }}
              transition={{
                opacity: { duration: 2.2, ease: "easeInOut" },
                scale: {
                  duration: 16,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
                y: {
                  duration: 16,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
              }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={HERO_SLIDES[currentSlide].src}
                alt={HERO_SLIDES[currentSlide].alt}
                fill
                priority
                className="object-cover object-center w-full h-full select-none pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 h-10 sm:h-16" />

        <div className="relative z-10 max-w-2xl flex-1 flex flex-col justify-end pt-12 sm:pt-20 lg:pt-24 pb-1 md:pb-2">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-6xl lg:text-[70px] font-bold text-white tracking-tight leading-[1.06]"
          >
            {t("hero.title", "Exceptional dining.")}
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-5xl lg:text-[60px] font-serif italic text-[#EDE6D8] font-normal mt-1 leading-[1.1]"
          >
            {t("hero.timed", "Thoughtfully timed.")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-stone-300 text-xs sm:text-[15px] font-light leading-relaxed mt-4 sm:mt-5 max-w-lg"
          >
            {t("hero.subtitle", "A considered journey through Sri Lanka and the world, shaped by the season and served with warm, intuitive hospitality.")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full sm:w-auto"
          >
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/menu"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-[#D6CBBF] hover:bg-[#E2D8CC] text-[#121418] text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase px-6 sm:px-7 py-3 sm:py-3.5 rounded-[2px] transition-all duration-300 shadow-md group"
              >
                <span>{t("hero.exploreMenu", "EXPLORE THE MENU")}</span>
                <span className="ml-2.5 transition-transform duration-300 group-hover:translate-x-1 font-sans">→</span>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/reservations"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent hover:bg-white/10 text-white text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase px-6 sm:px-7 py-3 sm:py-3.5 rounded-[2px] border border-white/30 hover:border-white/60 transition-all duration-300 shadow-sm"
              >
                {t("hero.reserveTable", "RESERVE A TABLE")}
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-end justify-end gap-3 pt-4 pb-1">
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 sm:p-5 w-full sm:w-auto sm:max-w-xs shadow-2xl transition-all hover:border-white/25"
          >
            <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-stone-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#C1A87D]" />
              <span>{t("hero.today", "TODAY")}</span>
            </div>
            <p className="text-white font-serif text-lg sm:text-xl font-normal mt-1 tracking-wide">
              {t("hero.dinnerHours", "Dinner 5:30–10:30 PM")}
            </p>
            <p className="text-[11px] text-stone-400 mt-1 font-light leading-snug">
              {t("hero.hoursNotice", "Illustrative hours · confirm before visiting")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   2. SEASONAL ANNOUNCEMENT & SIGNATURES MENU SECTION
   ========================================================================= */
interface DishItem {
  id: number | string;
  name: string;
  price: string;
  priceNum: number;
  description: string;
  rating: number;
  image: string;
}

const FALLBACK_DISH_IMAGES = [
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop", // Ceylon Pepper Beef (Prime beef tenderloin)
  "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1000&auto=format&fit=crop", // Jaffna Spiced Lamb Shank (Aromatic spiced roast)
  "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1000&auto=format&fit=crop", // Tandoori Malabar Prawns
  "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=1000&auto=format&fit=crop", // Miso Glazed Black Cod
];

const DISHES: DishItem[] = [
  {
    id: 101,
    name: "Ceylon Pepper Beef",
    price: "LKR 6,850",
    priceNum: 6850,
    description: "Charred tenderloin with Tellicherry pepper crackling and hand-tempered shallots",
    rating: 5,
    image: FALLBACK_DISH_IMAGES[0],
  },
  {
    id: 102,
    name: "Jaffna Spiced Lamb Shank",
    price: "LKR 7,400",
    priceNum: 7400,
    description: "Slow-braised with roasted coriander, toasted shallots, and rich bone marrow sauce",
    rating: 5,
    image: FALLBACK_DISH_IMAGES[1],
  },
  {
    id: 103,
    name: "Tandoori Malabar Prawns",
    price: "LKR 6,400",
    priceNum: 6400,
    description: "Jumbo tiger prawns, Kashmiri chili, hung curd, and wild mountain mint marinade",
    rating: 5,
    image: FALLBACK_DISH_IMAGES[2],
  },
  {
    id: 104,
    name: "Miso Glazed Black Cod",
    price: "LKR 7,900",
    priceNum: 7900,
    description: "Wild Alaskan black cod with Saikyo sweet white miso, Junmai sake, and baby bok choy",
    rating: 5,
    image: FALLBACK_DISH_IMAGES[3],
  },
];

interface FeaturedDishCardProps {
  dish: DishItem;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onAddToCart: (dish: DishItem) => void;
}

function FeaturedDishCard({
  dish,
  index,
  isActive,
  onActivate,
  onAddToCart,
}: FeaturedDishCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [imgSrc, setImgSrc] = useState(
    dish.image && !dish.image.includes("photo-1514944298352-f47ec051c278")
      ? dish.image
      : FALLBACK_DISH_IMAGES[index % FALLBACK_DISH_IMAGES.length]
  );
  const { formatPrice, t } = usePreferences();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        opacity: { duration: 0.75, delay: shouldReduceMotion ? 0 : index * 0.1, ease: LUXURY_EASE },
        y: { duration: 0.75, delay: shouldReduceMotion ? 0 : index * 0.1, ease: LUXURY_EASE },
      }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 350, damping: 25 } }}
      onMouseEnter={onActivate}
      onClick={onActivate}
      className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center text-center transition-all duration-300 cursor-pointer group ${
        isActive
          ? "bg-[#21242D]/95 dark:bg-[#21242D]/95 light:bg-[#FAF4EB] border border-[#C1A87D]/50 dark:border-[#C1A87D]/50 light:border-[#C1A87D]/60 shadow-[0_15px_35px_rgba(0,0,0,0.5)] light:shadow-md transform -translate-y-1"
          : "bg-transparent hover:bg-white/[0.04] dark:hover:bg-white/[0.04] light:hover:bg-stone-100/70 border border-transparent hover:border-white/10 dark:hover:border-white/10 light:hover:border-stone-300/60"
      }`}
    >
      {/* Circular Dish Image */}
      <div
        className={`w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full relative overflow-hidden transition-all duration-300 shrink-0 ${
          isActive
            ? "ring-4 ring-[#C1A87D] shadow-[0_0_25px_rgba(193,168,125,0.4)]"
            : "ring-2 ring-stone-700/50 dark:ring-stone-700/50 light:ring-stone-300 group-hover:ring-[#C1A87D]/60"
        }`}
      >
        <Image
          src={imgSrc}
          alt={dish.name}
          fill
          sizes="(max-width: 640px) 150px, (max-width: 1024px) 170px, 176px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          onError={() =>
            setImgSrc(FALLBACK_DISH_IMAGES[index % FALLBACK_DISH_IMAGES.length])
          }
        />
      </div>

      {/* Overlapping Pill Badge for Dish Name */}
      <div
        className={`-mt-4 sm:-mt-5 z-10 px-5 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold uppercase tracking-wider text-[11px] sm:text-xs shadow-lg transition-all duration-300 max-w-[92%] text-center truncate ${
          isActive
            ? "bg-[#C1A87D] text-[#121418] font-black shadow-[0_4px_14px_rgba(193,168,125,0.45)]"
            : "bg-white dark:bg-white text-stone-900 font-extrabold shadow-md border border-stone-200/40 group-hover:bg-[#C1A87D] group-hover:text-[#121418]"
        }`}
      >
        {dish.name}
      </div>

      {/* Description */}
      <p className="text-xs sm:text-[13px] text-stone-400 dark:text-stone-300 light:text-stone-600 font-light mt-4 line-clamp-2 leading-relaxed text-center px-1 min-h-[36px]">
        {dish.description}
      </p>

      {/* Price */}
      <span className="text-sm sm:text-base font-semibold text-[#E8DCC4] dark:text-[#E8DCC4] light:text-[#916E36] tracking-wide my-3">
        {formatPrice(dish.priceNum)}
      </span>

      {/* Add to Cart Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart(dish);
        }}
        className={`w-full py-2.5 px-4 text-xs font-semibold tracking-wider flex items-center justify-center gap-2 rounded-full transition-all duration-200 shadow-md cursor-pointer ${
          isActive
            ? "bg-[#C1A87D] hover:bg-[#D4BC91] text-[#121418] font-bold"
            : "bg-[#0F1116] hover:bg-[#C1A87D] hover:text-black text-stone-200 border border-[#2B303C] hover:border-[#C1A87D]/70 dark:bg-[#0F1116] dark:text-stone-200 light:bg-stone-900 light:text-white"
        }`}
      >
        <ShoppingBag
          className={`w-3.5 h-3.5 stroke-[2] ${
            isActive ? "text-[#121418]" : "text-[#C1A87D]"
          }`}
        />
        <span>+ {t("dishes.addToBag", "ADD TO BAG")}</span>
      </motion.button>
    </motion.div>
  );
}

function MenuSection() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { addToCart, setCartDrawerOpen } = useCart();
  const { t, formatPrice } = usePreferences();
  const [dishList, setDishList] = useState<DishItem[]>(DISHES);
  const [activeId, setActiveId] = useState<string | number | null>(DISHES[1]?.id || null);

  useEffect(() => {
    apiClient<{ success: boolean; data: any[] }>("/menu/featured")
      .then((payload) => {
        if (
          payload?.success &&
          Array.isArray(payload.data) &&
          payload.data.length > 0
        ) {
          const mapped = payload.data.slice(0, 4).map((d: any, index: number) => {
            let dishImg = d.images?.[0];
            if (
              !dishImg ||
              dishImg.includes("photo-1514944298352-f47ec051c278") ||
              dishImg.trim() === ""
            ) {
              dishImg = FALLBACK_DISH_IMAGES[index % FALLBACK_DISH_IMAGES.length];
            }
            return {
              id: d.id,
              name: d.name,
              price:
                d.formattedPrice ||
                (d.priceMinor
                  ? `LKR ${(d.priceMinor / 100).toLocaleString()}`
                  : "$9.25"),
              priceNum: Math.round((d.priceMinor || 0) / 100),
              description:
                d.shortDescription ||
                d.description ||
                "Charred tenderloin with Tellicherry pepper crackling and spices",
              rating: 5,
              image: dishImg,
            };
          });
          setDishList(mapped);
          if (mapped.length > 1) {
            setActiveId(mapped[1].id);
          } else if (mapped.length > 0) {
            setActiveId(mapped[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleAddToCart = (dish: DishItem) => {
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

  return (
    <section className="w-full bg-[#0D0F12] dark:bg-[#0D0F12] light:bg-[#FAF7F2] text-stone-100 dark:text-stone-100 light:text-stone-900 pt-0 pb-28 transition-colors duration-300">
      <div className="w-full border-b border-stone-800/60 dark:border-stone-800/60 light:border-stone-200/80 bg-[#121418] dark:bg-[#121418] light:bg-[#F2ECE0] transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease: LUXURY_EASE }}
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs sm:text-sm"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-serif tracking-[0.24em] text-[#C1A87D] font-medium uppercase text-[11px]">
              {t("seasonal.bannerTitle", "SEASONAL MENU")}
            </span>
            <span className="text-stone-300 dark:text-stone-300 light:text-stone-700 font-light text-xs sm:text-[13px]">
              {t("seasonal.bannerText", "Island harvest — a six-course exploration of smoke, spice and coastal produce.")}
            </span>
          </div>

          <Link
            href="/reservations"
            className="group inline-flex items-center gap-1.5 text-stone-300 dark:text-stone-300 light:text-stone-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors tracking-wide font-medium text-xs whitespace-nowrap"
          >
            <span>{t("seasonal.reserveExp", "Reserve the experience")}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-16 pb-10">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, ease: LUXURY_EASE }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
              {t("dishes.badge", "FROM OUR KITCHEN")}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-normal text-white dark:text-white light:text-stone-900 mt-2 tracking-tight">
              {t("dishes.title", "Signatures with a sense of place")}
            </h2>
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 48, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15, ease: LUXURY_EASE }}
              className="h-1 bg-[#C1A87D] rounded-full mt-3 mb-1"
            />
            <p className="text-stone-400 dark:text-stone-400 light:text-stone-600 text-sm sm:text-base mt-2 font-light max-w-xl">
              {t("dishes.subtitle", "Familiar flavours, reimagined with modern technique and the best of the season.")}
            </p>
          </div>

          <Link
            href="/menu"
            className="group inline-flex items-center gap-1.5 text-xs tracking-wider text-stone-300 dark:text-stone-300 light:text-stone-700 hover:text-white dark:hover:text-white light:hover:text-black uppercase font-medium whitespace-nowrap"
          >
            <span>{t("dishes.viewAll", "View full menu")}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Showcase Container Inspired by Image 1 */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, delay: 0.1, ease: LUXURY_EASE }}
          className="mt-12 rounded-[2rem] sm:rounded-[2.5rem] bg-[#16181E]/75 dark:bg-[#16181E]/75 light:bg-[#FAF7F2] border border-stone-800/80 dark:border-stone-800/80 light:border-stone-200/90 p-4 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
            {dishList.map((dish, index) => (
              <FeaturedDishCard
                key={dish.id}
                dish={dish}
                index={index}
                isActive={activeId === dish.id}
                onActivate={() => setActiveId(dish.id)}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* =========================================================================
   3. RESERVATIONS, TRADITIONS & EXPERIENCES SECTION
   ========================================================================= */
const TRADITIONS = [
  { id: "01", title: "Sri Lankan", href: "/menu?category=Sri+Lankan#menu-items" },
  { id: "02", title: "Indian", href: "/menu?category=Indian#menu-items" },
  { id: "03", title: "East Asian", href: "/menu?category=East+Asian#menu-items" },
  { id: "04", title: "Plant-led", href: "/menu?category=Plant-led#menu-items" },
];

function ExperienceSection() {
  const { t } = usePreferences();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="w-full bg-[#111215] dark:bg-[#111215] light:bg-[#FAF7F2] text-stone-100 dark:text-stone-100 light:text-stone-900 overflow-hidden transition-colors duration-300">
      {/* 1. Full-Width Reservations Split Banner (Edge-to-edge, zero left/right margins) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-[480px] lg:min-h-[520px] xl:min-h-[560px] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, ease: LUXURY_EASE }}
          className="relative min-h-[340px] sm:min-h-[400px] lg:min-h-full w-full overflow-hidden"
        >
          <Image
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop"
            alt="Aurelle dining room ambience"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.1, ease: LUXURY_EASE }}
          className="bg-[#566453] p-6 sm:p-12 md:p-14 lg:p-16 xl:p-20 2xl:p-24 flex flex-col justify-between text-[#F1EFEA]"
        >
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.28em] text-[#D8E0D5] font-medium block">
              RESERVATIONS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-serif font-normal text-white mt-3 leading-[1.15] tracking-tight">
              Make an evening of it
            </h2>
            <p className="text-[#D8E0D5]/90 text-xs sm:text-sm font-light leading-relaxed mt-4 max-w-lg">
              From an intimate dinner to a long-awaited celebration, select
              your preferred date and we&apos;ll show the available times
              provided by the restaurant.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 pt-6 border-t border-white/20">
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <span className="text-[9.5px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C6D2C2] block">
                  DATE
                </span>
                <span className="font-serif text-xs sm:text-base lg:text-lg text-white mt-0.5 block truncate">
                  Fri, 18 Oct
                </span>
              </div>
              <div>
                <span className="text-[9.5px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C6D2C2] block">
                  GUESTS
                </span>
                <span className="font-serif text-xs sm:text-base lg:text-lg text-white mt-0.5 block truncate">
                  2 people
                </span>
              </div>
              <div>
                <span className="text-[9.5px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C6D2C2] block">
                  TIME
                </span>
                <span className="font-serif text-xs sm:text-base lg:text-lg text-white mt-0.5 block truncate">
                  7:30 PM
                </span>
              </div>
            </div>

            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Link
                href="/reservations"
                className="inline-flex items-center gap-2 bg-[#F6F2EB] hover:bg-white text-[#1c1c1c] text-[11px] font-semibold tracking-[0.16em] uppercase px-7 py-3.5 transition-colors shadow-md"
              >
                <span>FIND A TABLE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* 2. Remaining Content Contained */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-14 sm:pt-20 lg:pt-28 pb-14 sm:pb-16 lg:pb-24 space-y-16 sm:space-y-24 lg:space-y-32">
        <div>
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, ease: LUXURY_EASE }}
          >
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-stone-400 font-medium block">
              EXPLORE
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-[44px] font-serif font-normal text-white mt-2 tracking-tight">
              Many traditions. One point of view.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 mt-8 sm:mt-10 border border-stone-800/80 bg-[#15171C]/70 divide-y sm:divide-y-0 sm:divide-x divide-stone-800/80 overflow-hidden">
            {TRADITIONS.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.65,
                  delay: shouldReduceMotion ? 0 : idx * 0.08,
                  ease: LUXURY_EASE,
                }}
                className="h-full"
              >
                <Link
                  href={item.href}
                  className="group relative p-6 sm:p-10 flex flex-col justify-between min-h-[180px] sm:min-h-[220px] h-full hover:bg-[#1C1F26] transition-colors duration-300"
                >
                  <span className="text-[11px] text-stone-500 font-mono">
                    {item.id}
                  </span>

                  <div className="flex items-end justify-between mt-12">
                    <h3 className="font-serif text-xl sm:text-2xl text-stone-200 group-hover:text-white transition-colors">
                      {item.title}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-stone-500 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-[#C1A87D]" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: LUXURY_EASE }}
            className="lg:col-span-5 space-y-6"
          >
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
              {t("experience.privateDiningBadge", "PRIVATE DINING")}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-serif font-normal text-white dark:text-white light:text-stone-900 leading-[1.12] tracking-tight">
              {t("experience.privateDiningTitle", "An occasion, entirely your own")}
            </h2>
            <div className="space-y-3.5 text-stone-400 dark:text-stone-400 light:text-stone-600 text-xs sm:text-sm font-light leading-relaxed max-w-lg">
              <p>
                {t(
                  "experience.privateDiningDesc1",
                  "From intimate milestone celebrations to distinguished corporate gatherings, our secluded private dining suites offer an elevated sanctuary tailored entirely to your rhythm."
                )}
              </p>
              <p>
                {t(
                  "experience.privateDiningDesc2",
                  "Immerse your guests in bespoke multi-course degustation menus crafted in collaboration with our Executive Chef, paired with rare vintage allocations from our sommelier's cellar and accompanied by dedicated, intuitive hospitality."
                )}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/vip-events"
                className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-stone-200 dark:text-stone-200 light:text-stone-900 hover:text-white dark:hover:text-white light:hover:text-black border-b border-stone-600 dark:border-stone-600 light:border-stone-400 hover:border-[#C1A87D] pb-1 transition-colors"
              >
                {t("experience.explorePrivateDining", "EXPLORE PRIVATE DINING")}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, delay: 0.1, ease: LUXURY_EASE }}
            className="lg:col-span-7 relative h-[380px] sm:h-[480px] lg:h-[540px] w-full overflow-hidden shadow-2xl rounded-sm"
          >
            <Image
              src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop"
              alt="Private intimate dining setting"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: LUXURY_EASE }}
            className="lg:col-span-6 relative h-[380px] sm:h-[480px] lg:h-[560px] w-full overflow-hidden shadow-2xl rounded-sm"
          >
            <Image
              src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=1200&auto=format&fit=crop"
              alt="Aurelle chef working in culinary kitchen"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.1, ease: LUXURY_EASE }}
            className="lg:col-span-6 space-y-6"
          >
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
              {t("experience.philosophyBadge", "OUR PHILOSOPHY")}
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-[54px] font-serif font-normal text-white dark:text-white light:text-stone-900 leading-[1.08] tracking-tight">
              {t("experience.philosophyTitle1", "Global in outlook.")} <br />
              {t("experience.philosophyTitle2", "Grounded in place.")}
            </h2>
            <div className="space-y-3.5 text-stone-400 dark:text-stone-400 light:text-stone-600 text-xs sm:text-sm font-light leading-relaxed max-w-lg">
              <p>
                {t(
                  "experience.philosophyDesc1",
                  "At AURELLE, fine dining is an ongoing dialogue between heritage and contemporary innovation. Rooted in the fertile soils and vibrant coastal terroirs of Sri Lanka, our kitchen celebrates centuries-old spice craftsmanship, slow-fire hearth cooking, and wild-caught ocean harvests, refined through modern global gastronomy."
                )}
              </p>
              <p>
                {t(
                  "experience.philosophyDesc2",
                  "We forge personal partnerships with local organic growers, highland tea estates, and artisanal divers. Every dish is a balanced study in temperature, texture, and aroma—served with thoughtful pacing and the quiet, heartfelt warmth of intuitive island hospitality."
                )}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/our-story"
                className="group inline-flex items-center gap-2 text-xs text-stone-200 dark:text-stone-200 light:text-stone-900 hover:text-white dark:hover:text-white light:hover:text-black transition-colors"
              >
                <span>{t("experience.meetChefs", "Meet our chefs")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   4. STORIES FROM THE TABLE - PROFESSIONAL RESPONSIVE FIGMA JOURNAL TIMELINE
   ========================================================================= */

// Realistic Fresh Basil Leaves SVG Garnish
function BasilLeavesSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 90"
      className={`w-14 h-12 select-none filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.7)] ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="basilBg1" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#8FE345" />
          <stop offset="50%" stopColor="#53B022" />
          <stop offset="100%" stopColor="#2A6412" />
        </radialGradient>
        <radialGradient id="basilBg2" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#9EED4E" />
          <stop offset="55%" stopColor="#5BBE28" />
          <stop offset="100%" stopColor="#2F6E13" />
        </radialGradient>
      </defs>
      <path
        d="M 45 48 C 30 40, 10 38, 5 55 C 2 70, 25 78, 48 58 Z"
        fill="url(#basilBg1)"
      />
      <path
        d="M 46 54 C 40 30, 48 8, 64 2 C 78 8, 86 35, 52 60 Z"
        fill="url(#basilBg2)"
      />
      <path
        d="M 50 52 C 65 42, 85 45, 95 56 C 90 70, 72 74, 48 56 Z"
        fill="url(#basilBg1)"
      />
      <circle cx="49" cy="54" r="3.5" fill="#3D7B1C" />
    </svg>
  );
}

// Realistic Whole + Sliced Cherry Tomatoes SVG Garnish
function CherryTomatoesSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 110 130"
      className={`w-16 h-20 select-none filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.8)] ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="tRedGrad" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FF4A3B" />
          <stop offset="40%" stopColor="#E21818" />
          <stop offset="85%" stopColor="#9C0A0A" />
          <stop offset="100%" stopColor="#5E0000" />
        </radialGradient>
        <radialGradient id="tCutGrad" cx="50%" cy="48%" r="52%">
          <stop offset="0%" stopColor="#FF6B52" />
          <stop offset="55%" stopColor="#E52020" />
          <stop offset="90%" stopColor="#8C0909" />
          <stop offset="100%" stopColor="#660202" />
        </radialGradient>
        <linearGradient id="glossGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Sliced Half Top */}
      <g transform="translate(18, 5) scale(0.82)">
        <ellipse cx="45" cy="40" rx="38" ry="34" fill="#910C0C" />
        <ellipse cx="45" cy="40" rx="35" ry="31" fill="url(#tCutGrad)" />
        <circle cx="45" cy="40" r="10" fill="#FFA588" opacity="0.85" />
        <ellipse cx="32" cy="30" rx="8" ry="6" fill="#820404" />
        <ellipse cx="33" cy="30" rx="2.5" ry="4" fill="#FFDE59" />
        <ellipse cx="58" cy="30" rx="8" ry="6" fill="#820404" />
        <ellipse cx="57" cy="30" rx="2.5" ry="4" fill="#FFDE59" />
        <ellipse cx="45" cy="54" rx="9" ry="5.5" fill="#820404" />
        <ellipse cx="45" cy="54" rx="4" ry="2.5" fill="#FFDE59" />
        <path
          d="M 22 26 C 30 18, 55 16, 68 22"
          stroke="url(#glossGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>

      {/* Whole Tomato Bottom */}
      <g transform="translate(14, 52)">
        <ellipse cx="38" cy="42" rx="36" ry="33" fill="url(#tRedGrad)" />
        <ellipse
          cx="26"
          cy="28"
          rx="12"
          ry="7"
          fill="url(#glossGrad)"
          transform="rotate(-20 26 28)"
        />
        <circle cx="34" cy="22" r="2.5" fill="#FFFFFF" opacity="0.8" />
        <g transform="translate(38, 12)">
          <path d="M 0 0 L -8 -7 L -2 -1" fill="#4B9C23" />
          <path d="M 0 0 L 7 -9 L 2 -1" fill="#3D841A" />
          <path d="M 0 0 L -12 2 L -3 2" fill="#5AA628" />
          <path d="M 0 0 L 11 3 L 3 3" fill="#3D841A" />
          <path d="M 0 0 Q 2 -12 8 -16" stroke="#5DAE2C" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

// Background Culinary Shadow Silhouettes (Optimized for Visibility)
function CroissantShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 100" className={className} fill="currentColor">
      <path
        d="M 12 72 C 18 42, 45 16, 70 14 C 95 16, 122 42, 128 72 C 122 62, 102 48, 70 48 C 38 48, 18 62, 12 72 Z"
        opacity="0.95"
      />
      <path
        d="M 38 60 C 44 38, 60 26, 70 25 C 80 26, 96 38, 102 60 C 92 53, 78 50, 70 50 C 62 50, 48 53, 38 60 Z"
        opacity="0.8"
      />
      <path
        d="M 52 48 C 58 35, 65 31, 70 31 C 75 31, 82 35, 88 48 C 82 45, 75 44, 70 44 C 65 44, 58 45, 52 48 Z"
        opacity="0.65"
      />
    </svg>
  );
}

function CitrusWheelShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.9" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <circle cx="50" cy="50" r="6" opacity="0.95" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 50 50)`}>
          <line x1="50" y1="50" x2="50" y2="9" stroke="currentColor" strokeWidth="3" opacity="0.85" />
          <path
            d="M 44 14 C 47 13, 53 13, 56 14 L 53 43 C 51 44, 49 44, 47 43 Z"
            opacity="0.65"
          />
        </g>
      ))}
    </svg>
  );
}

function RosemarySprigShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 140" className={className} fill="none">
      <path d="M 40 135 Q 38 70 42 10" stroke="currentColor" strokeWidth="4" opacity="0.9" strokeLinecap="round" />
      {[20, 38, 56, 74, 92, 110].map((y, i) => (
        <g key={i}>
          <path d={`M 40 ${y} Q 18 ${y - 14} 8 ${y - 8}`} stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
          <path d={`M 40 ${y} Q 62 ${y - 14} 72 ${y - 8}`} stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}

function MushroomShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 110" className={className} fill="currentColor">
      <path
        d="M 10 56 C 8 20, 30 8, 50 8 C 70 8, 92 20, 90 56 C 80 60, 20 60, 10 56 Z"
        opacity="0.95"
      />
      <path
        d="M 36 56 Q 32 88 34 104 C 42 108, 58 108, 66 104 Q 68 88 64 56 Z"
        opacity="0.85"
      />
    </svg>
  );
}

function OliveBranchShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none">
      <path d="M 20 150 Q 55 90 95 15" stroke="currentColor" strokeWidth="4" opacity="0.9" strokeLinecap="round" />
      <path d="M 40 120 Q 18 105 14 82 Q 36 94 40 120 Z" fill="currentColor" opacity="0.85" />
      <path d="M 50 100 Q 78 88 88 66 Q 66 76 50 100 Z" fill="currentColor" opacity="0.85" />
      <path d="M 68 75 Q 48 54 40 32 Q 65 46 68 75 Z" fill="currentColor" opacity="0.85" />
      <path d="M 80 50 Q 108 38 112 16 Q 88 30 80 50 Z" fill="currentColor" opacity="0.85" />
      <path d="M 95 15 Q 102 2 106 0 Q 98 12 95 15 Z" fill="currentColor" opacity="0.9" />
      <ellipse cx="32" cy="115" rx="7" ry="10" fill="currentColor" opacity="0.9" transform="rotate(-25 32 115)" />
      <ellipse cx="78" cy="68" rx="7" ry="10" fill="currentColor" opacity="0.9" transform="rotate(30 78 68)" />
    </svg>
  );
}

function GarlicBulbShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} fill="currentColor">
      <path d="M 46 5 Q 50 24 50 38 Q 54 24 56 5 Q 51 0 46 5 Z" opacity="0.95" />
      <path
        d="M 50 35 C 28 35 12 55 12 76 C 12 97 28 112 50 112 C 72 112 88 97 88 76 C 88 55 72 35 50 35 Z"
        opacity="0.9"
      />
      <path d="M 50 38 Q 36 66 36 110" stroke="#000" strokeWidth="3.5" opacity="0.5" fill="none" />
      <path d="M 50 38 Q 64 66 64 110" stroke="#000" strokeWidth="3.5" opacity="0.5" fill="none" />
    </svg>
  );
}

function TomatoSliceShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="7" opacity="0.9" />
      <circle cx="50" cy="50" r="11" fill="currentColor" opacity="0.9" />
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 50 50)`}>
          <path
            d="M 50 36 C 42 36, 36 28, 38 20 C 40 15, 60 15, 62 20 C 64 28, 58 36, 50 36 Z"
            fill="currentColor"
            opacity="0.75"
          />
          <circle cx="48" cy="22" r="2.5" fill="currentColor" opacity="0.95" />
          <circle cx="53" cy="25" r="2.5" fill="currentColor" opacity="0.95" />
        </g>
      ))}
    </svg>
  );
}

function StarAniseShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <circle cx="50" cy="50" r="9" opacity="0.95" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <path
          key={i}
          d="M 50 50 C 43 40, 41 22, 50 10 C 59 22, 57 40, 50 50 Z"
          opacity="0.88"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
    </svg>
  );
}

function BayLeafShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 120" className={className} fill="none">
      <path
        d="M 30 115 Q 10 75 12 35 Q 25 10 30 5 Q 35 10 48 35 Q 50 75 30 115 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M 30 115 Q 30 60 30 8" stroke="currentColor" strokeWidth="2.5" opacity="0.7" />
      <path d="M 30 80 Q 18 70 14 65" stroke="currentColor" strokeWidth="1.8" opacity="0.6" />
      <path d="M 30 70 Q 42 60 46 55" stroke="currentColor" strokeWidth="1.8" opacity="0.6" />
    </svg>
  );
}

function ChiliPepperShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 140" className={className} fill="currentColor">
      <path d="M 50 15 Q 56 8 68 8 Q 62 18 53 22 Z" opacity="0.95" />
      <path d="M 38 22 C 45 18, 55 18, 62 22 L 64 26 C 54 28, 46 28, 36 26 Z" opacity="0.95" />
      <path
        d="M 38 26 C 45 45, 60 70, 68 95 C 72 108, 70 126, 52 135 C 50 132, 60 115, 52 98 C 42 78, 30 55, 34 26 Z"
        opacity="0.9"
      />
    </svg>
  );
}

function LemonWedgeShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" className={className} fill="currentColor">
      <path d="M 10 20 C 35 65, 85 65, 110 20 C 85 55, 35 55, 10 20 Z" opacity="0.95" />
      <path d="M 14 20 L 106 20 C 82 50, 38 50, 14 20 Z" opacity="0.8" />
      <line x1="32" y1="20" x2="42" y2="40" stroke="#000" strokeWidth="2.5" opacity="0.45" />
      <line x1="60" y1="20" x2="60" y2="46" stroke="#000" strokeWidth="2.5" opacity="0.45" />
      <line x1="88" y1="20" x2="78" y2="40" stroke="#000" strokeWidth="2.5" opacity="0.45" />
    </svg>
  );
}

function AvocadoShadowSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 130" className={className} fill="currentColor">
      <path
        d="M 45 10 C 25 10, 20 35, 12 70 C 4 102, 22 125, 45 125 C 68 125, 86 102, 78 70 C 70 35, 65 10, 45 10 Z"
        opacity="0.9"
      />
      <circle cx="45" cy="85" r="18" fill="#000" opacity="0.45" />
    </svg>
  );
}

function JournalTimelineSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="w-full flex flex-col">
      {/* 1. TOP HEADER: Sleek, Proportionate Bar */}
      <div className="w-full bg-[#171715] border-b border-stone-800/50 py-5 sm:py-6 lg:py-7">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: LUXURY_EASE }}
          className="max-w-[1200px] mx-auto px-6 sm:px-12 lg:px-16 flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-stone-400 font-medium block">
              THE JOURNAL
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-serif font-normal text-white mt-1 tracking-tight leading-tight">
              Stories from the table
            </h2>
          </div>

          <Link
            href="/recipes"
            className="group inline-flex items-center gap-2 text-xs sm:text-sm text-stone-300 hover:text-[#E2CE9C] transition-colors cursor-pointer"
          >
            <span>Browse all stories</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1.5" />
          </Link>
        </motion.div>
      </div>

      {/* 2. MAIN TIMELINE: Generous, Full-Featured Luxury Timeline Canvas */}
      <section className="relative w-full bg-[#111215] py-16 lg:py-20 overflow-hidden select-none">
        {/* Soft Ambient Radial Glow matching the dark homepage palette */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#1A1D24]/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#1A1D24]/40 rounded-full blur-[100px] pointer-events-none" />

        {/* ========================================================= */}
        {/* ATMOSPHERIC BACKGROUND CULINARY SHADOW SILHOUETTES         */}
        {/* ========================================================= */}
        {/* Top-Right Croissant Shadow */}
        <motion.div
          animate={{ y: [0, 14, 0], rotate: [-8, 2, -8] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <CroissantShadowSvg className="w-36 h-28" />
        </motion.div>

        {/* Top-Left Wild Mushroom Shadow */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-4, 6, -4] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-4 left-6 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <MushroomShadowSvg className="w-22 h-22" />
        </motion.div>

        {/* Top-Left Rosemary Herb Shadow */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-6 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <RosemarySprigShadowSvg className="w-22 h-40" />
        </motion.div>

        {/* Top-Left Olive Branch Shadow */}
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-6 left-[18%] text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <OliveBranchShadowSvg className="w-28 h-36" />
        </motion.div>

        {/* Upper-Center Chili Pepper Shadow */}
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [12, -4, 12] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-[42%] text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <ChiliPepperShadowSvg className="w-18 h-26" />
        </motion.div>

        {/* Upper-Left Lemon Wedge Shadow */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-10, 8, -10] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-3 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <LemonWedgeShadowSvg className="w-26 h-18" />
        </motion.div>

        {/* Upper-Right Garlic Bulb Shadow */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [2, -6, 2] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[23%] right-8 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <GarlicBulbShadowSvg className="w-24 h-28" />
        </motion.div>

        {/* Middle-Right Heirloom Tomato Slice Shadow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
          className="absolute top-[35%] right-2 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <TomatoSliceShadowSvg className="w-32 h-32" />
        </motion.div>

        {/* Middle-Left Citrus Wheel Shadow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -left-6 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <CitrusWheelShadowSvg className="w-36 h-36" />
        </motion.div>

        {/* Middle-Left Warm Croissant Shadow */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-6, 6, -6] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[48%] left-2 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <CroissantShadowSvg className="w-30 h-22" />
        </motion.div>

        {/* Center-Right Avocado Shadow */}
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [8, -4, 8] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[46%] right-[18%] text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <AvocadoShadowSvg className="w-22 h-32" />
        </motion.div>

        {/* Middle-Right Mushroom Shadow */}
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [5, -5, 5] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[50%] -right-2 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <MushroomShadowSvg className="w-28 h-28" />
        </motion.div>

        {/* Middle-Left Star Anise Shadow */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
          className="absolute top-[58%] left-8 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <StarAniseShadowSvg className="w-24 h-24" />
        </motion.div>

        {/* Lower-Center Chili Pepper Shadow */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-15, 5, -15] }}
          transition={{ duration: 21, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[63%] right-[16%] text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <ChiliPepperShadowSvg className="w-20 h-28 transform scale-x-[-1]" />
        </motion.div>

        {/* Lower-Left Citrus Wheel Shadow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute top-[67%] left-10 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <CitrusWheelShadowSvg className="w-28 h-28" />
        </motion.div>

        {/* Lower-Right Bay Leaf Sprig Shadow */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[71%] right-7 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <BayLeafShadowSvg className="w-20 h-32" />
        </motion.div>

        {/* Lower-Right Lemon Wedge Shadow */}
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [8, -8, 8] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[78%] right-3 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <LemonWedgeShadowSvg className="w-28 h-20" />
        </motion.div>

        {/* Lower-Left Garlic Bulb Shadow */}
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 21, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-44 left-10 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <GarlicBulbShadowSvg className="w-22 h-26" />
        </motion.div>

        {/* Bottom-Left Mirrored Croissant Shadow */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [10, -3, 10] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-24 left-8 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <CroissantShadowSvg className="w-36 h-28 transform scale-x-[-1]" />
        </motion.div>

        {/* Bottom-Center-Left Porcini Mushroom Shadow */}
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [-6, 6, -6] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-16 left-[22%] text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <MushroomShadowSvg className="w-22 h-22" />
        </motion.div>

        {/* Bottom-Center Star Anise Shadow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-6 left-[35%] text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <StarAniseShadowSvg className="w-22 h-22" />
        </motion.div>

        {/* Bottom-Right Citrus Wheel Shadow */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-24 right-12 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <CitrusWheelShadowSvg className="w-32 h-32" />
        </motion.div>

        {/* Bottom-Right Olive Branch Shadow */}
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [4, -4, 4] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 right-1 text-black/20 filter blur-[0.6px] pointer-events-none z-0"
        >
          <OliveBranchShadowSvg className="w-28 h-36 transform -scale-x-100" />
        </motion.div>

        <div className="relative max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* ========================================================= */}
          {/* S-CURVE VECTOR ROAD BACKGROUND SVG LAYER                 */}
          {/* ========================================================= */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 1320"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Outer decorative arcs on edges */}
              <circle
                cx="0"
                cy="160"
                r="140"
                stroke="#8A92A6"
                strokeWidth="1.2"
                strokeOpacity="0.18"
              />
              <circle
                cx="1000"
                cy="490"
                r="140"
                stroke="#8A92A6"
                strokeWidth="1.2"
                strokeOpacity="0.18"
              />

              {/* Orbit rings around dishes */}
              <circle
                cx="290"
                cy="160"
                r="160"
                stroke="#8A92A6"
                strokeWidth="1.2"
                strokeOpacity="0.22"
              />
              <circle
                cx="710"
                cy="1150"
                r="160"
                stroke="#8A92A6"
                strokeWidth="1.2"
                strokeOpacity="0.22"
              />

              {/* Branch curve to Sauce Ramekin on far left */}
              <path
                d="M 190 240 
                   C 150 310, 150 420, 180 490"
                stroke="#D2BF96"
                strokeWidth="1.75"
                strokeOpacity="0.75"
              />
              {/* Horizontal line from Sauce Ramekin to Card 2 */}
              <path
                d="M 205 490 L 290 490"
                stroke="#D2BF96"
                strokeWidth="1.75"
                strokeOpacity="0.75"
              />

              {/* Smooth Winding Golden S-Curve connecting all 4 dishes */}
              {/* Segment 1: Dot 1 (395, 90) -> Dot 2 (605, 420) under Card 1 */}
              <path
                d="M 395 90 
                   C 490 90, 510 280, 550 290 
                   C 580 300, 600 360, 605 420"
                stroke="#D2BF96"
                strokeWidth="2"
                strokeOpacity="0.85"
              />
              {/* Segment 2: From Dish 2 lower-left (650, 600) -> Dot 3 (395, 750) */}
              <path
                d="M 650 600 
                   C 610 680, 490 660, 395 750"
                stroke="#D2BF96"
                strokeWidth="2"
                strokeOpacity="0.85"
              />
              {/* Segment 3: From Dish 3 lower-right (350, 930) -> Dot 4 (605, 1080) */}
              <path
                d="M 350 930 
                   C 390 1010, 510 990, 605 1080"
                stroke="#D2BF96"
                strokeWidth="2"
                strokeOpacity="0.85"
              />

              {/* Glowing Golden Checkpoint Nodes */}
              <circle cx="395" cy="90" r="6" fill="#E5D2A5" />
              <circle cx="395" cy="90" r="10" stroke="#E5D2A5" strokeWidth="1.5" strokeOpacity="0.45" />

              <circle cx="605" cy="420" r="6" fill="#E5D2A5" />
              <circle cx="605" cy="420" r="10" stroke="#E5D2A5" strokeWidth="1.5" strokeOpacity="0.45" />

              <circle cx="395" cy="750" r="6" fill="#E5D2A5" />
              <circle cx="395" cy="750" r="10" stroke="#E5D2A5" strokeWidth="1.5" strokeOpacity="0.45" />

              <circle cx="605" cy="1080" r="6" fill="#E5D2A5" />
              <circle cx="605" cy="1080" r="10" stroke="#E5D2A5" strokeWidth="1.5" strokeOpacity="0.45" />
            </svg>
          </div>

          <div className="relative z-10 space-y-16 lg:space-y-20">
            {/* ========================================================= */}
            {/* ROW 1: Dish 1 (Left) | Card 1 (Right) + Basil Sprig       */}
            {/* ========================================================= */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.85, ease: LUXURY_EASE }}
              className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12"
            >
              {/* Dish 1: Ceylon Cinnamon Plate */}
              <Link
                href="/recipes/ceylon-cinnamon"
                aria-label="Read story: The Quiet Complexity of Ceylon Cinnamon"
                className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-[310px] lg:h-[310px] flex-shrink-0 flex items-center justify-center cursor-pointer group/plate"
              >
                {/* Outer concentric subtle ring */}
                <div className="absolute inset-0 rounded-full border border-stone-400/25 group-hover/plate:border-[#C1A87D]/50 scale-110 pointer-events-none transition-colors duration-300" />

                {/* Matte Black Ceramic Plate */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-[280px] lg:h-[280px] rounded-full p-3 sm:p-4 bg-gradient-to-b from-[#1C1D24] via-[#101116] to-[#060608] shadow-[0_30px_60px_rgba(0,0,0,0.95)] border-2 border-[#222530] group-hover/plate:border-[#C1A87D]/60 transition-colors"
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src="https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=80&w=1000&auto=format&fit=crop"
                        alt="The Quiet Complexity of Ceylon Cinnamon"
                        fill
                        priority
                        sizes="(max-width: 768px) 250px, 300px"
                        className="object-cover scale-110"
                      />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Golden Badge: 500 GR */}
                <span className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#E2CE9C] text-[#1B1E26] text-[10px] sm:text-[11px] font-bold tracking-widest px-3 py-1 rounded-[2px] shadow-xl z-20 uppercase">
                  500 GR
                </span>
              </Link>

              {/* Card 1: Ceylon Cinnamon Story */}
              <div className="relative w-full max-w-md lg:max-w-[400px]">
                <Link
                  href="/recipes/ceylon-cinnamon"
                  className="block group/card cursor-pointer"
                  aria-label="Read story: The Quiet Complexity of Ceylon Cinnamon"
                >
                  <motion.div
                    whileHover={{ y: -6, scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="bg-[#15171C]/90 backdrop-blur-md rounded-[4px] p-5 sm:p-8 shadow-2xl border border-stone-800/80 group-hover/card:border-[#D2BF96]/60 transition-colors duration-300"
                  >
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-[#C1A87D] font-medium block mb-2">
                      INGREDIENTS · 6 MIN
                    </span>
                    <h3 className="text-2xl sm:text-4xl lg:text-[38px] font-serif text-white tracking-wide leading-tight group-hover/card:text-[#F6F2EB] transition-colors">
                      Ceylon Cinnamon
                    </h3>
                    <h4 className="text-base sm:text-xl font-serif italic text-stone-200 mt-1 font-light group-hover/card:text-white transition-colors">
                      The Quiet Complexity
                    </h4>
                    <p className="text-[#8E96A6] text-xs sm:text-sm font-light leading-relaxed mt-3.5 max-w-sm">
                      Harvested from southern coastal groves, true Ceylon cinnamon yields delicate floral sweetness, layered citrus notes, and centuries of artisan craft.
                    </p>

                    {/* Read Story Link Button & Indicator */}
                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-xs font-sans tracking-[0.18em] lowercase text-[#8E96A6] group-hover/card:text-[#E2CE9C] transition-colors">
                        read story
                      </span>
                      <div className="flex items-center">
                        <span className="w-10 h-[1.5px] bg-[#E2CE9C]/70 group-hover/card:bg-[#E2CE9C] group-hover/card:w-12 transition-all duration-300" />
                        <span className="w-4 h-4 rounded-full border border-[#E2CE9C] flex items-center justify-center -ml-0.5 shadow-sm group-hover/card:scale-110 transition-transform">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E2CE9C]" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>

                {/* Fresh Basil Leaves Garnish (Right of Card 1) */}
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-4 right-1 sm:-bottom-6 sm:-right-6 pointer-events-none z-20"
                >
                  <BasilLeavesSvg className="w-16 h-14" />
                </motion.div>
              </div>
            </motion.div>

            {/* ========================================================= */}
            {/* ROW 2: Sauce Ramekin + Card 2 (Left) | Dish 2 (Right)     */}
            {/* ========================================================= */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.85, ease: LUXURY_EASE }}
              className="flex flex-col-reverse lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12"
            >
              {/* Card 2 (Left): Balancing Heat Story */}
              <div className="relative w-full max-w-md lg:max-w-[400px]">
                <Link
                  href="/recipes/balancing-heat"
                  className="block group/card cursor-pointer"
                  aria-label="Read story: A Chef's Guide to Balancing Heat"
                >
                  <motion.div
                    whileHover={{ y: -6, scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="bg-[#15171C]/90 backdrop-blur-md rounded-[4px] p-5 sm:p-8 shadow-2xl border border-stone-800/80 group-hover/card:border-[#D2BF96]/60 transition-colors duration-300"
                  >
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-[#C1A87D] font-medium block mb-2">
                      TECHNIQUE · 8 MIN
                    </span>
                    <h3 className="text-2xl sm:text-4xl lg:text-[38px] font-serif text-white tracking-wide leading-tight group-hover/card:text-[#F6F2EB] transition-colors">
                      Balancing Heat
                    </h3>
                    <h4 className="text-base sm:text-xl font-serif italic text-stone-200 mt-1 font-light group-hover/card:text-white transition-colors">
                      A Chef&apos;s Guide
                    </h4>
                    <p className="text-[#8E96A6] text-xs sm:text-sm font-light leading-relaxed mt-3.5 max-w-sm">
                      Navigating the fierce vibrancy of island chilis and crushed black pepper through gentle coconut milk, slow reduction, and balanced acidity.
                    </p>

                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-xs font-sans tracking-[0.18em] lowercase text-[#8E96A6] group-hover/card:text-[#E2CE9C] transition-colors">
                        read story
                      </span>
                      <div className="flex items-center">
                        <span className="w-10 h-[1.5px] bg-[#E2CE9C]/70 group-hover/card:bg-[#E2CE9C] group-hover/card:w-12 transition-all duration-300" />
                        <span className="w-4 h-4 rounded-full border border-[#E2CE9C] flex items-center justify-center -ml-0.5 shadow-sm group-hover/card:scale-110 transition-transform">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E2CE9C]" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>

                {/* White Ceramic Dipping Ramekin on Left */}
                <div className="hidden lg:flex absolute -left-16 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-2 border-stone-400/50 bg-[#EFEFEF] shadow-[0_10px_20px_rgba(0,0,0,0.75)] items-center justify-center z-20">
                  <div className="w-10 h-10 rounded-full bg-[#FCFBF7] border border-stone-300 shadow-inner flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-[#F3EDE2]" />
                  </div>
                </div>
              </div>

              {/* Dish 2 (Right): Two vibrant red chilis on dark slate */}
              <Link
                href="/recipes/balancing-heat"
                className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-[310px] lg:h-[310px] flex-shrink-0 flex items-center justify-center group/plate cursor-pointer"
                aria-label="View dish: A Chef's Guide to Balancing Heat"
              >
                <div className="absolute inset-0 rounded-full border border-stone-400/25 group-hover/plate:border-[#C1A87D]/50 scale-110 pointer-events-none transition-colors duration-300" />

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-[280px] lg:h-[280px] rounded-full p-3 sm:p-4 bg-gradient-to-b from-[#1C1D24] via-[#101116] to-[#060608] shadow-[0_30px_60px_rgba(0,0,0,0.95)] border-2 border-[#222530] group-hover/plate:border-[#C1A87D]/60 transition-colors"
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src="https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=80&w=1000&auto=format&fit=crop"
                        alt="A Chef's Guide to Balancing Heat"
                        fill
                        sizes="(max-width: 768px) 250px, 300px"
                        className="object-cover scale-110"
                      />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Golden Badge: 410 GR */}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#E2CE9C] text-[#1B1E26] text-[10px] sm:text-[11px] font-bold tracking-widest px-3 py-1 rounded-[2px] shadow-xl z-20 uppercase">
                  410 GR
                </span>
              </Link>
            </motion.div>

            {/* ========================================================= */}
            {/* ROW 3: Dish 3 (Left) | Card 3 (Right) + Cherry Tomatoes   */}
            {/* ========================================================= */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.85, ease: LUXURY_EASE }}
              className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12"
            >
              {/* Dish 3: King Coconut, Three Ways */}
              <Link
                href="/recipes/king-coconut"
                className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-[310px] lg:h-[310px] flex-shrink-0 flex items-center justify-center group/plate cursor-pointer"
                aria-label="View dish: King Coconut, Three Ways"
              >
                <div className="absolute inset-0 rounded-full border border-stone-400/25 group-hover/plate:border-[#C1A87D]/50 scale-110 pointer-events-none transition-colors duration-300" />

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-[280px] lg:h-[280px] rounded-full p-3 sm:p-4 bg-gradient-to-b from-[#1C1D24] via-[#101116] to-[#060608] shadow-[0_30px_60px_rgba(0,0,0,0.95)] border-2 border-[#222530] group-hover/plate:border-[#C1A87D]/60 transition-colors"
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src="https://images.unsplash.com/photo-1525385133512-2f3bdd039054?q=80&w=1000&auto=format&fit=crop"
                        alt="King Coconut, Three Ways"
                        fill
                        sizes="(max-width: 768px) 250px, 300px"
                        className="object-cover scale-110"
                      />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Golden Badge: 430 GR */}
                <span className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#E2CE9C] text-[#1B1E26] text-[10px] sm:text-[11px] font-bold tracking-widest px-3 py-1 rounded-[2px] shadow-xl z-20 uppercase">
                  430 GR
                </span>
              </Link>

              {/* Card 3: King Coconut Story */}
              <div className="relative w-full max-w-md lg:max-w-[400px]">
                <Link
                  href="/recipes/king-coconut"
                  className="block group/card cursor-pointer"
                  aria-label="Read story: King Coconut, Three Ways"
                >
                  <motion.div
                    whileHover={{ y: -6, scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="bg-[#15171C]/90 backdrop-blur-md rounded-[4px] p-5 sm:p-8 shadow-2xl border border-stone-800/80 group-hover/card:border-[#D2BF96]/60 transition-colors duration-300"
                  >
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-[#C1A87D] font-medium block mb-2">
                      RECIPE · 12 MIN
                    </span>
                    <h3 className="text-2xl sm:text-4xl lg:text-[38px] font-serif text-white tracking-wide leading-tight group-hover/card:text-[#F6F2EB] transition-colors">
                      King Coconut
                    </h3>
                    <h4 className="text-base sm:text-xl font-serif italic text-stone-200 mt-1 font-light group-hover/card:text-white transition-colors">
                      Three Ways
                    </h4>
                    <p className="text-[#8E96A6] text-xs sm:text-sm font-light leading-relaxed mt-3.5 max-w-sm">
                      Celebrating Sri Lanka&apos;s endemic golden treasure across light granitas, aromatic herbal broths, and chilled coconut water reductions.
                    </p>

                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-xs font-sans tracking-[0.18em] lowercase text-[#8E96A6] group-hover/card:text-[#E2CE9C] transition-colors">
                        read story
                      </span>
                      <div className="flex items-center">
                        <span className="w-10 h-[1.5px] bg-[#E2CE9C]/70 group-hover/card:bg-[#E2CE9C] group-hover/card:w-12 transition-all duration-300" />
                        <span className="w-4 h-4 rounded-full border border-[#E2CE9C] flex items-center justify-center -ml-0.5 shadow-sm group-hover/card:scale-110 transition-transform">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E2CE9C]" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>

                {/* Cherry Tomatoes Garnish (Right of Card 3) */}
                <motion.div
                  animate={{ y: [0, 8, 0], rotate: [0, -4, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-4 right-1 sm:-bottom-6 sm:-right-12 pointer-events-none z-20"
                >
                  <CherryTomatoesSvg className="w-18 h-22" />
                </motion.div>
              </div>
            </motion.div>

            {/* ========================================================= */}
            {/* ROW 4: Card 4 (Left) + Basil | Dish 4 (Right, Gourmet)    */}
            {/* ========================================================= */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.85, ease: LUXURY_EASE }}
              className="flex flex-col-reverse lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12"
            >
              {/* Card 4 (Left): Ceylon Black Tea Story */}
              <div className="relative w-full max-w-md lg:max-w-[400px]">
                <Link
                  href="/recipes/ceylon-black-tea"
                  className="block group/card cursor-pointer"
                  aria-label="Read story: Ceylon Black Tea, Single-Estate Infusions"
                >
                  <motion.div
                    whileHover={{ y: -6, scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="bg-[#15171C]/90 backdrop-blur-md rounded-[4px] p-5 sm:p-8 shadow-2xl border border-stone-800/80 group-hover/card:border-[#D2BF96]/60 transition-colors duration-300"
                  >
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-[#C1A87D] font-medium block mb-2">
                      TRADITIONS · 10 MIN
                    </span>
                    <h3 className="text-2xl sm:text-4xl lg:text-[38px] font-serif text-white tracking-wide leading-tight group-hover/card:text-[#F6F2EB] transition-colors">
                      Ceylon Black Tea
                    </h3>
                    <h4 className="text-base sm:text-xl font-serif italic text-stone-200 mt-1 font-light group-hover/card:text-white transition-colors">
                      Single-Estate Infusions
                    </h4>
                    <p className="text-[#8E96A6] text-xs sm:text-sm font-light leading-relaxed mt-3.5 max-w-sm">
                      Hand-plucked high-elevation tea leaves steeped with crushed cardamom and wild honey, celebrating generations of island tea craft.
                    </p>

                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-xs font-sans tracking-[0.18em] lowercase text-[#8E96A6] group-hover/card:text-[#E2CE9C] transition-colors">
                        read story
                      </span>
                      <div className="flex items-center">
                        <span className="w-10 h-[1.5px] bg-[#E2CE9C]/70 group-hover/card:bg-[#E2CE9C] group-hover/card:w-12 transition-all duration-300" />
                        <span className="w-4 h-4 rounded-full border border-[#E2CE9C] flex items-center justify-center -ml-0.5 shadow-sm group-hover/card:scale-110 transition-transform">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E2CE9C]" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>

                {/* Basil Leaves Garnish (Left above Card 4) */}
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-8 left-1 sm:-top-12 sm:-left-6 pointer-events-none z-20"
                >
                  <BasilLeavesSvg className="w-16 h-14" />
                </motion.div>
              </div>

              {/* Dish 4 (Right): Single-Estate Ceylon Black Tea */}
              <Link
                href="/recipes/ceylon-black-tea"
                className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-[310px] lg:h-[310px] flex-shrink-0 flex items-center justify-center group/plate cursor-pointer"
                aria-label="View dish: Single-Estate Ceylon Black Tea"
              >
                <div className="absolute inset-0 rounded-full border border-stone-400/25 group-hover/plate:border-[#C1A87D]/50 scale-110 pointer-events-none transition-colors duration-300" />

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-[280px] lg:h-[280px] rounded-full p-3 sm:p-4 bg-gradient-to-b from-[#1C1D24] via-[#0E0F14] to-[#040405] shadow-[0_30px_60px_rgba(0,0,0,0.95)] border-2 border-[#222530] flex items-center justify-center group-hover/plate:border-[#C1A87D]/60 transition-colors"
                >
                  <div className="relative w-36 h-36 sm:w-52 sm:h-52 lg:w-[200px] lg:h-[200px] rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=1000&auto=format&fit=crop"
                        alt="Single-Estate Ceylon Black Tea"
                        fill
                        sizes="(max-width: 768px) 220px, 260px"
                        className="object-cover scale-110"
                      />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Golden Badge: 370 GR */}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#E2CE9C] text-[#1B1E26] text-[10px] sm:text-[11px] font-bold tracking-widest px-3 py-1 rounded-[2px] shadow-xl z-20 uppercase">
                  370 GR
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================================
   5. VISIT AURELLE & LOCATION SECTION
   ========================================================================= */
function LocationSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="w-full bg-[#1A1A17] text-stone-100 border-t border-stone-800/80 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px] lg:min-h-[560px]">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: LUXURY_EASE }}
          className="bg-[#1D1D19] p-5 sm:p-14 lg:p-20 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
              VISIT AURELLE
            </span>

            <h2 className="text-3xl sm:text-5xl lg:text-[56px] font-serif font-normal text-white leading-[1.08] tracking-tight">
              Find your way <br />
              to the table
            </h2>

            <div className="text-stone-300 text-xs sm:text-sm font-light space-y-1">
              <p>Main Street, Alawwa Town</p>
              <p className="text-stone-400">Kurunegala District, Sri Lanka</p>
            </div>

            <div className="w-full h-px bg-stone-800/80 my-6" />

            <div className="space-y-2 text-xs sm:text-sm font-light">
              <div className="flex items-center justify-between max-w-sm">
                <span className="text-stone-300">Monday–Thursday</span>
                <span className="text-stone-400">5:30 PM – 10:30 PM</span>
              </div>
              <div className="flex items-center justify-between max-w-sm">
                <span className="text-stone-300">Friday–Sunday</span>
                <span className="text-stone-400">12:00 PM – 11:00 PM</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-transparent hover:bg-stone-800/60 border border-stone-400 hover:border-white text-stone-100 text-[11px] font-semibold tracking-[0.18em] uppercase px-7 py-3.5 transition-all duration-200"
              >
                LOCATION & CONTACT
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, delay: 0.1, ease: LUXURY_EASE }}
          className="relative w-full min-h-[380px] lg:min-h-full h-full bg-[#1A1A17] overflow-hidden border-t lg:border-t-0 lg:border-l border-stone-800/80"
        >
          <iframe
            title="Aurelle Location Map - Alawwa Town, Sri Lanka"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.625345719329!2d80.2323446750003!3d7.296895713753733!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae3171465e921b3%3A0x6b871c841368a52e!2sAlawwa%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1710000000000!5m2!1sen!2slk"
            className="w-full h-full min-h-[380px] lg:min-h-[560px] border-0 block"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute top-4 left-4 bg-[#111215]/90 backdrop-blur-md border border-[#C1A87D]/40 px-3.5 py-2 rounded-sm shadow-xl flex items-center space-x-2 pointer-events-none z-10">
            <MapPin className="w-4 h-4 text-[#C1A87D]" />
            <span className="text-[11px] font-serif text-stone-200 tracking-wider">
              Alawwa Town, Sri Lanka
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* =========================================================================
   MAIN HOMEPAGE EXPORT
   ========================================================================= */
export default function Home() {
  return (
    <div className="w-full min-h-screen bg-[#111111] text-stone-100 flex flex-col">
      {/* 1. Aurelle Luxury Hero Section */}
      <HeroSection />

      {/* 2. Seasonal Announcement & Signatures Menu Grid */}
      <MenuSection />

      {/* 3. Reservations, Traditions, and Private Dining Experiences */}
      <ExperienceSection />

      {/* 4. Stories from the table Interactive Pathway (Figma Design) */}
      <JournalTimelineSection />

      {/* 5. Visit Aurelle & Location Section */}
      <LocationSection />
    </div>
  );
}
