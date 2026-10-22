"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { useCart } from "../context/CartContext";
import { usePreferences } from "../context/PreferencesContext";

export default function CartDrawer() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname?.startsWith("/staff")) {
    return null;
  }
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    removeFromCart,
    clearCart,
    totalCount,
    subtotal,
  } = useCart();
  const { t, formatPrice } = usePreferences();

  const handleGoToCheckout = () => {
    setCartDrawerOpen(false);
    router.push("/cart");
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end select-none">
          {/* Dimmed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setCartDrawerOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Slide-Over Drawer Container */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-[#14161A] border-l border-stone-800 h-full p-6 sm:p-10 flex flex-col justify-between shadow-2xl z-10"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between pb-6 border-b border-stone-800/80">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#C1A87D] font-medium block">
                    YOUR ORDER
                  </span>
                  <h2 className="text-3xl font-serif text-white tracking-tight mt-1">
                    {t("cart.title", "Shopping bag")}{" "}
                    <span className="text-sm font-sans font-light text-stone-400">
                      {totalCount}
                    </span>
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  aria-label="Close bag"
                  className="p-1.5 text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5 stroke-[1.8]" />
                </button>
              </div>

              {/* Items List or Empty State */}
              {cart.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#1C1F26] border border-stone-700/80 flex items-center justify-center text-stone-400">
                    <Search className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <h3 className="font-serif text-2xl text-white">
                    {t("cart.empty", "Your bag is empty")}
                  </h3>
                  <p className="text-stone-400 text-xs font-light max-w-xs leading-relaxed">
                    {t("cart.emptyDesc", "There's always room for something exceptional.")}
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/menu"
                      onClick={() => setCartDrawerOpen(false)}
                      className="inline-block border border-stone-600 hover:border-white text-stone-200 hover:text-white text-[11px] font-semibold tracking-[0.16em] uppercase px-6 py-3 transition-colors"
                    >
                      RESET AND EXPLORE
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-stone-800/80 overflow-y-auto max-h-[50vh] pr-1 mt-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="py-5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-[2px] overflow-hidden border border-stone-800 bg-black flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm tracking-wide">
                            {item.name}
                          </h4>
                          <p className="text-stone-400 text-xs font-light mt-0.5">
                            Qty {item.quantity} · {formatPrice(item.priceNum)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-[11px] text-stone-500 hover:text-rose-400 transition-colors"
                      >
                        {t("cart.remove", "Remove")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Subtotal & Action Bar */}
            {cart.length > 0 && (
              <div className="pt-6 border-t border-stone-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-300 font-light">
                    {t("cart.subtotal", "Subtotal")}
                  </span>
                  <span className="font-mono text-base font-semibold text-white">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 font-light">
                  {t("cart.taxNote", "Taxes and service charges calculated at checkout.")}
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleGoToCheckout}
                  className="w-full bg-[#F6F2EB] hover:bg-white text-[#121316] text-xs font-semibold tracking-[0.16em] uppercase py-3.5 transition-colors shadow-md"
                >
                  {t("cart.checkout", "VIEW BAG & CHECKOUT")}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full text-center text-xs text-stone-400 hover:text-white transition-colors pt-1"
                >
                  Continue browsing
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

