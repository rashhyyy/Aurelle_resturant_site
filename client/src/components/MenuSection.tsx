"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Star } from "lucide-react";
import { useCart } from "../context/CartContext";

interface DishItem {
  id: number | string;
  name: string;
  price: string;
  priceNum: number;
  description: string;
  rating: number;
  image: string;
}

const INITIAL_DISHES: DishItem[] = [
  {
    id: 101,
    name: "Spaghetti with Olive Oil",
    price: "$9.25",
    priceNum: 9.25,
    description: "Handcrafted pasta tossed in cold-pressed extra virgin olive oil, garlic slivers & fresh herbs",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 102,
    name: "Taco Soup Recipe",
    price: "$5.25",
    priceNum: 5.25,
    description: "Hearty slow-simmered spiced broth with beans, sweet roasted corn, and fresh avocado",
    rating: 4,
    image:
      "https://images.unsplash.com/photo-1547496502-affa22d38842?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 103,
    name: "Spicy Scrambled Eggs",
    price: "$6.25",
    priceNum: 6.25,
    description: "Farm-fresh organic eggs with house chili crisp, grilled sourdough, and garden microgreens",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 104,
    name: "Black Pasta",
    price: "$9.25",
    priceNum: 9.25,
    description: "Signature squid ink tagliolini with blistered heirloom cherry tomatoes and lemon zest",
    rating: 4,
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
  },
];

export default function MenuSection() {
  const router = useRouter();
  const { addToCart, setCartDrawerOpen } = useCart();
  const [dishesList, setDishesList] = React.useState<DishItem[]>(INITIAL_DISHES);

  React.useEffect(() => {
    fetch("http://localhost:5000/api/menu/featured")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data) && payload.data.length > 0) {
          const mapped = payload.data.slice(0, 4).map((d: any) => ({
            id: d.id,
            name: d.name,
            price: d.formattedPrice,
            priceNum: Math.round(d.priceMinor / 100),
            description: d.shortDescription || d.description,
            rating: 5,
            image: d.images?.[0] || INITIAL_DISHES[0].image,
          }));
          setDishesList(mapped);
        }
      })
      .catch(() => {
        // Keeps graceful initial signatures if network error
      });
  }, []);

  const handleAddToCart = (dish: DishItem) => {
    addToCart({
      id: dish.id,
      name: dish.name,
      priceNum: dish.priceNum,
      priceStr: dish.price,
      description: dish.description,
      image: dish.image,
    });
    setCartDrawerOpen(false);
    router.push("/cart");
  };
  return (
    <section className="w-full bg-[#0D0F12] text-stone-100 pt-0 pb-28">
      {/* 1. Top Strip: Seasonal Menu Announcement */}
      <div className="w-full border-b border-stone-800/60 bg-[#121418]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-serif tracking-[0.24em] text-[#C1A87D] font-medium uppercase text-[11px]">
              SEASONAL MENU
            </span>
            <span className="text-stone-300 font-light text-xs sm:text-[13px]">
              Island harvest — a six-course exploration of smoke, spice and
              coastal produce.
            </span>
          </div>

          <Link
            href="/reservations"
            className="group inline-flex items-center gap-1.5 text-stone-300 hover:text-white transition-colors tracking-wide font-medium text-xs whitespace-nowrap"
          >
            <span>Reserve the experience</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* 2. Section Header */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-16 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium">
              FROM OUR KITCHEN
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-normal text-white mt-2 tracking-tight">
              Signatures with a sense of place
            </h2>
            <p className="text-stone-400 text-sm sm:text-base mt-2.5 font-light max-w-xl">
              Familiar flavours, reimagined with modern technique and the best
              of the season.
            </p>
          </div>

          <Link
            href="/menu"
            className="group inline-flex items-center gap-1.5 text-xs tracking-wider text-stone-300 hover:text-white uppercase font-medium whitespace-nowrap"
          >
            <span>View full menu</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3. Eye-Catching Food Circles with Maximized Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-28 mt-24 pt-4">
          {dishesList.map((dish) => (
            <motion.div
              key={dish.id}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative bg-[#1A1D24] border border-[#252A34] rounded-lg pt-24 sm:pt-28 pb-6 px-5 flex flex-col items-center text-center shadow-xl transition-all duration-300 hover:border-[#3E4656] group"
            >
              {/* Circular Plate Image Overlapping Top - Maximized & Eye-Catching */}
              <div className="absolute -top-20 sm:-top-22 left-1/2 -translate-x-1/2 w-44 h-44 sm:w-48 sm:h-48 lg:w-[190px] lg:h-[190px] rounded-full overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.9)] border-2 border-[#121418] bg-black">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  sizes="(max-width: 640px) 176px, (max-width: 1024px) 192px, 190px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                />
              </div>

              {/* Dish Name */}
              <h3 className="font-serif text-base sm:text-lg text-white font-medium tracking-wide mt-2 min-h-[28px] flex items-center justify-center">
                {dish.name}
              </h3>

              {/* 5 Rating Stars */}
              <div className="flex items-center justify-center gap-1.5 my-2.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < dish.rating
                        ? "text-[#C1A87D] fill-[#C1A87D]"
                        : "text-stone-600 stroke-stone-500"
                    }`}
                  />
                ))}
              </div>

              {/* Price */}
              <span className="text-[#E8DCC4] font-sans text-sm sm:text-base font-semibold tracking-wider">
                {dish.price}
              </span>

              {/* + ADD TO CART Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => handleAddToCart(dish)}
                className="mt-4 w-full py-2.5 px-3 bg-[#0F1116] hover:bg-black text-stone-200 hover:text-white border border-[#2B303C] hover:border-[#C1A87D]/70 text-[11px] font-semibold tracking-[0.12em] flex items-center justify-center gap-1.5 rounded transition-all duration-200 shadow-md cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 stroke-[1.8] text-[#C1A87D]" />
                <span>+ ADD TO CART</span>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
