"use client";

import React, { createContext, useContext, useState } from "react";

export interface CartItem {
  id: number | string;
  name: string;
  priceNum: number;
  priceStr: string;
  description: string;
  quantity: number;
  image: string;
}

interface CartContextType {
  cart: CartItem[];
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, delta: number) => void;
  updateItemPrice: (id: number | string, newPriceNum: number, newPriceStr: string) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
}

const INITIAL_CART: CartItem[] = [];

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const addToCart = (newItem: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number | string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number | string, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (item.id === id) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[],
    );
  };

  const updateItemPrice = (id: number | string, newPriceNum: number, newPriceStr: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id || String(item.id) === String(id)
          ? { ...item, priceNum: newPriceNum, priceStr: newPriceStr }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.priceNum * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartDrawerOpen,
        setCartDrawerOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemPrice,
        clearCart,
        totalCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
