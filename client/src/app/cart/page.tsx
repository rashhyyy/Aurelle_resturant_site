"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Clock, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useSocket } from "../../context/SocketContext";
import { usePreferences } from "../../context/PreferencesContext";
import { ClientOrder, OrderStatus } from "../../types/order";
import { apiClient } from "../../lib/api";

const STATUS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: OrderStatus.RECEIVED, label: "Order received" },
  { status: OrderStatus.CONFIRMED, label: "Accepted" },
  { status: OrderStatus.PREPARING, label: "Preparing" },
  { status: OrderStatus.READY, label: "Ready for pickup" },
  { status: OrderStatus.COMPLETED, label: "Completed" },
];

const ALL_TIME_SLOTS = [
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM",
  "10:00 PM", "10:30 PM",
];

function parseSlotToMinutes(slot: string): number {
  const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function getLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitialPickupDateTime(): { date: string; time: string } {
  const now = new Date();
  const todayStr = getLocalISODate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Operating hours are 11:00 AM to 11:00 PM. We need at least 35 min buffer.
  const availableToday = ALL_TIME_SLOTS.filter(
    (slot) => parseSlotToMinutes(slot) >= currentMinutes + 35
  );

  if (availableToday.length > 0) {
    return { date: todayStr, time: availableToday[0] };
  }

  // If no more slots today, schedule for tomorrow noon
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return { date: getLocalISODate(tomorrow), time: "12:00 PM" };
}

function CartContent() {
  const { cart, removeFromCart, updateQuantity, updateItemPrice, subtotal, clearCart } = useCart();
  const searchParams = useSearchParams();
  const { socket } = useSocket();
  const { currency, formatPrice: prefFormatPrice, t } = usePreferences();

  // Screen stages: "bag" (review) | "checkout" | "success" | "status"
  const [stage, setStage] = useState<"bag" | "checkout" | "success" | "status">("bag");
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [firstName, setFirstName] = useState("Sample");
  const [lastName, setLastName] = useState("Customer");
  const [email, setEmail] = useState("customer@example.com");
  const [contactNumber, setContactNumber] = useState("+94 77 123 4567");
  const [emailUpdates, setEmailUpdates] = useState(true);

  const [orderType, setOrderType] = useState("Pickup");
  const [reservationId, setReservationId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("12:00 PM");
  const [promoCode, setPromoCode] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [orderRef, setOrderRef] = useState("AUR-10482");
  const [placedOrder, setPlacedOrder] = useState<ClientOrder | null>(null);

  // Submission & validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [priceNotice, setPriceNotice] = useState<string | null>(null);
  const [confirmPriceChange, setConfirmPriceChange] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [todayStr, setTodayStr] = useState("");
  const [maxDateStr, setMaxDateStr] = useState("");

  useEffect(() => {
    const sched = getInitialPickupDateTime();
    setPickupDate((prev) => prev || sched.date);
    setPickupTime((prev) => (prev === "12:00 PM" ? sched.time : prev));

    const now = new Date();
    setTodayStr(getLocalISODate(now));

    const d = new Date();
    d.setDate(d.getDate() + 7);
    setMaxDateStr(getLocalISODate(d));
  }, []);

  // Available time slots based on selected date
  const availableTimeSlots = useMemo(() => {
    if (!pickupDate || !todayStr) return ALL_TIME_SLOTS;
    if (pickupDate === todayStr) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return ALL_TIME_SLOTS.filter(
        (slot) => parseSlotToMinutes(slot) >= currentMinutes + 35
      );
    }
    return ALL_TIME_SLOTS;
  }, [pickupDate, todayStr]);

  // Adjust pickup time if current selection is invalid for the new date
  useEffect(() => {
    if (availableTimeSlots.length > 0) {
      if (!availableTimeSlots.includes(pickupTime)) {
        setPickupTime(availableTimeSlots[0]);
      }
    } else if (pickupDate === todayStr) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPickupDate(getLocalISODate(tomorrow));
      setPickupTime("12:00 PM");
    }
  }, [availableTimeSlots, pickupDate, pickupTime, todayStr]);

  // Idempotency key per checkout session
  const generateFreshIdempotencyKey = useCallback(() => {
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `order-idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const idempotencyKeyRef = useRef<string>(generateFreshIdempotencyKey());

  // Automatically refresh idempotency key whenever cart items change to prevent any key collisions
  useEffect(() => {
    idempotencyKeyRef.current = generateFreshIdempotencyKey();
  }, [cart, generateFreshIdempotencyKey]);

  // Currency-aware Calculations
  const isUsd = currency === "USD";
  const serviceCharge = Math.round(subtotal * 0.1);
  const estimatedTaxes = Math.round(subtotal * 0.025);
  const grandTotal = subtotal + serviceCharge + estimatedTaxes;

  const formatPrice = (val: number) => prefFormatPrice(val);

  // Check query params on mount for order tracking or stage redirect
  useEffect(() => {
    const refParam = searchParams?.get("orderRef") || searchParams?.get("ref");
    const stageParam = searchParams?.get("stage");

    if (refParam) {
      setOrderRef(refParam.toUpperCase());
      setStage("status");
      fetchOrderDetails(refParam.toUpperCase());
    } else if (stageParam === "status") {
      setStage("status");
      const saved = localStorage.getItem("aurelle_latest_order");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPlacedOrder(parsed);
          setOrderRef(parsed.orderReference);
          // Always fetch latest authoritative status from backend on reload
          fetchOrderDetails(parsed.orderReference);
        } catch {}
      }
    }
  }, [searchParams]);

  // Fetch live order tracking details with race condition prevention
  const fetchOrderDetails = async (reference: string) => {
    try {
      const isDummy = email === "customer@example.com";
      const emailParam = email && !isDummy ? `?email=${encodeURIComponent(email)}` : "";
      const res = await fetch(`/api/orders/track/${encodeURIComponent(reference)}${emailParam}`);
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.customerEmail) {
          setEmail(data.data.customerEmail);
        }
        setPlacedOrder((prev) => {
          if (!prev) return data.data;
          // Prevent older responses from overwriting newer status data
          const prevTime = new Date(prev.updatedAt).getTime();
          const nextTime = new Date(data.data.updatedAt).getTime();
          if (nextTime < prevTime) return prev;
          return data.data;
        });
        try {
          localStorage.setItem("aurelle_latest_order", JSON.stringify(data.data));
        } catch {}
      }
    } catch (err) {
      console.warn("[CartPage] Failed to fetch live order tracking:", err);
    }
  };

  // Real-time Socket.IO synchronization with reconnection handling and race-condition prevention
  useEffect(() => {
    if (!socket || !orderRef || stage !== "status") return;

    const subscribeToOrder = () => {
      socket.emit("subscribe:order", {
        orderReference: orderRef,
        orderId: placedOrder?.id,
        email: email || placedOrder?.customerEmail,
      });
    };

    // 1. Subscribe immediately
    subscribeToOrder();

    // 2. Reconnection handling: re-subscribe and reconcile missed events
    const onConnect = () => {
      subscribeToOrder();
      fetchOrderDetails(orderRef);
    };

    const handleStatusChanged = (updatedOrder: ClientOrder) => {
      const matchesRef = updatedOrder.orderReference === orderRef;
      const matchesId =
        placedOrder &&
        (updatedOrder.id === placedOrder.id || (updatedOrder as any).orderId === placedOrder.id);

      if (matchesRef || matchesId) {
        setPlacedOrder((prev) => {
          if (!prev) return updatedOrder;
          // Race condition prevention: prevent older events from overwriting newer status data
          const prevTime = new Date(prev.updatedAt).getTime();
          const nextTime = new Date(updatedOrder.updatedAt).getTime();
          if (nextTime < prevTime) return prev;
          return updatedOrder;
        });

        try {
          localStorage.setItem("aurelle_latest_order", JSON.stringify(updatedOrder));
        } catch {}
      }
    };

    socket.on("connect", onConnect);
    socket.on("orders.statusChanged", handleStatusChanged);
    socket.on("orders.updated", handleStatusChanged);

    return () => {
      socket.off("connect", onConnect);
      socket.off("orders.statusChanged", handleStatusChanged);
      socket.off("orders.updated", handleStatusChanged);
    };
  }, [socket, orderRef, stage, email, placedOrder?.id, placedOrder?.customerEmail]);

  // Real order submission to backend
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const currentKey = idempotencyKeyRef.current || generateFreshIdempotencyKey();

      const payload = {
        items: cart.map((item) => ({
          menuItemId: String(item.id),
          quantity: item.quantity,
          expectedUnitPriceMinor: Math.round(item.priceNum * 100),
          specialInstructions: "",
        })),
        orderType: orderType === "Dine-in Pre-order" ? "DINE_IN_PREORDER" : "TAKEAWAY",
        locationId: "loc-colombo-main",
        customerName: `${firstName.trim()} ${lastName.trim()}`,
        customerEmail: email.trim(),
        customerPhone: contactNumber.trim(),
        customerNotes: orderNotes,
        reservationId: orderType === "Dine-in Pre-order" ? reservationId.trim() : null,
        pickupDate,
        pickupTime,
        expectedSubtotalMinor: Math.round(subtotal * 100),
        confirmPriceChange,
        idempotencyKey: currentKey,
      };

      const json = await apiClient<{ success: boolean; data: ClientOrder; message?: string }>(
        "/orders",
        {
          method: "POST",
          data: payload,
        }
      );

      const confirmedOrder: ClientOrder = json.data;
      setPlacedOrder(confirmedOrder);
      setOrderRef(confirmedOrder.orderReference);
      if (confirmedOrder.customerEmail) {
        setEmail(confirmedOrder.customerEmail);
      }

      try {
        localStorage.setItem("aurelle_latest_order", JSON.stringify(confirmedOrder));
      } catch {}

      clearCart();
      // Ensure the next order in this tab will use a fresh idempotency key
      idempotencyKeyRef.current = generateFreshIdempotencyKey();

      // Immediately synchronize URL for bookmarking/reloading order tracking
      if (typeof window !== "undefined") {
        window.history.replaceState(
          null,
          "",
          `/cart?orderRef=${encodeURIComponent(confirmedOrder.orderReference)}&stage=status`
        );
      }
      setStage("status");
    } catch (err: any) {
      const isPriceChanged =
        err.data?.code === "PRICE_CHANGED" ||
        err.message?.includes("Price update required") ||
        err.message?.includes("Price difference detected") ||
        err.response?.status === 409;

      if (isPriceChanged) {
        const changes = err.data?.data?.priceChanges || [];
        if (Array.isArray(changes) && changes.length > 0) {
          changes.forEach((pc: any) => {
            updateItemPrice(
              pc.menuItemId,
              Math.round(pc.newPriceMinor / 100),
              `LKR ${(pc.newPriceMinor / 100).toLocaleString()}`
            );
          });
        }
        setPriceNotice(
          err.data?.message ||
            err.message ||
            "Dish prices were updated in our menu. Your cart has been updated with the authoritative prices. Please review and confirm your order."
        );
        setConfirmPriceChange(true);
        setSubmitError(null);
        return;
      }

      setSubmitError(err.message || "Failed to place order. Please review your cart.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Customer self-cancellation
  const handleCancelOrder = async () => {
    if (!placedOrder) return;
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order? This action cannot be undone."
    );
    if (!confirmCancel) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      const data = await apiClient<{ success: boolean; data: ClientOrder; message?: string }>(
        `/orders/my/${placedOrder.id}/cancel`,
        {
          method: "POST",
          data: { reason: "Customer cancelled from tracking page" },
        }
      );

      if (data.success && data.data) {
        setPlacedOrder(data.data);
      } else {
        setCancelError(data.message || "Unable to cancel order.");
      }
    } catch (err: any) {
      setCancelError(err.message || "Cancellation failed.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Determine current timeline progress
  const currentStatus = placedOrder?.orderStatus || OrderStatus.RECEIVED;
  const isDineIn = placedOrder?.orderType === "DINE_IN_PREORDER";
  const statusSteps = useMemo(
    () => [
      { status: OrderStatus.RECEIVED, label: "Order Received" },
      { status: OrderStatus.CONFIRMED, label: "Accepted" },
      { status: OrderStatus.PREPARING, label: "Preparing" },
      { status: OrderStatus.READY, label: isDineIn ? "Ready for Service" : "Ready for Pickup" },
      { status: OrderStatus.COMPLETED, label: "Completed" },
    ],
    [isDineIn]
  );
  const currentStepIndex = statusSteps.findIndex((s) => s.status === currentStatus);

  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 pt-28 pb-32">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* ======================================================== */}
        {/* STAGE 1: SHOPPING BAG REVIEW                             */}
        {/* ======================================================== */}
        {stage === "bag" && (
          <div className="space-y-10">
            {/* Page Title */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.26em] text-[#C1A87D] font-medium block">
                YOUR ORDER
              </span>
              <h1 className="text-4xl sm:text-5xl font-serif text-white tracking-tight mt-1">
                Shopping bag
              </h1>
              <p className="text-stone-400 text-xs sm:text-sm font-light mt-1.5">
                Review illustrative items before continuing.
              </p>
            </div>

            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <p className="text-stone-400 text-sm">
                  Your shopping bag is currently empty.
                </p>
                <Link
                  href="/menu"
                  className="inline-block border border-stone-600 hover:border-white text-stone-200 hover:text-white text-xs uppercase tracking-widest px-6 py-3 transition-colors"
                >
                  Explore Menu
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                {/* Left: Item list */}
                <div className="lg:col-span-8 divide-y divide-stone-800/80">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-5">
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[2px] overflow-hidden border border-stone-800 bg-stone-900 flex-shrink-0 flex items-center justify-center">
                          {item.image && item.image.startsWith('http') ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-stone-500 gap-1 p-2 text-center">
                              <span className="font-serif text-sm font-semibold text-[#C1A87D]">
                                {item.name.slice(0, 3).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5 max-w-md">
                          <h3 className="font-serif text-lg sm:text-xl text-white font-normal">
                            {item.name}
                          </h3>
                          <p className="text-xs text-stone-400 font-light line-clamp-2">
                            {item.description}
                          </p>
                          <span className="font-mono text-xs text-[#C1A87D] block">
                            {formatPrice(item.priceNum)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quantity controls & Subtotal */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="flex items-center border border-stone-800 rounded-[2px] bg-[#16171B]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-mono text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-sm font-semibold text-white block">
                            {formatPrice(item.priceNum * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-[11px] text-stone-500 hover:text-rose-400 transition-colors mt-0.5"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Order Summary Box */}
                <div className="lg:col-span-4 bg-[#181A20] border border-stone-800 rounded-[2px] p-6 sm:p-8 space-y-6">
                  <h3 className="font-serif text-2xl text-white">
                    Order summary
                  </h3>

                  <div className="space-y-3 text-xs sm:text-sm font-light text-stone-300">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-white font-medium">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service charge (10%)</span>
                      <span className="font-mono text-white font-medium">
                        {formatPrice(serviceCharge)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated taxes (2.5%)</span>
                      <span className="font-mono text-white font-medium">
                        {formatPrice(estimatedTaxes)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-800 flex justify-between items-baseline">
                    <span className="text-sm font-medium text-white">
                      Total
                    </span>
                    <span className="font-mono text-lg font-bold text-white">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>

                  {/* Pickup Time Dropdown */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10.5px] uppercase tracking-wider text-stone-400 font-medium block">
                      PREFERRED PICKUP TIME
                    </span>
                    <div className="relative">
                      <select
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full appearance-none bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 pr-8 text-xs text-stone-200 outline-none focus:border-[#C1A87D] cursor-pointer"
                      >
                        {availableTimeSlots.map((slot: string) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="bg-[#1D1E1B] border-l-2 border-[#C1A87D] p-3 text-[11px] text-stone-300 font-light">
                    Time selection is validated against kitchen lead time and operating hours.
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      setStage("checkout");
                      setCheckoutStep(1);
                    }}
                    className="w-full bg-[#F6F2EB] hover:bg-white text-[#121316] text-xs font-semibold tracking-[0.16em] uppercase py-3.5 rounded-[2px] transition-colors shadow-md cursor-pointer"
                  >
                    PROCEED TO CHECKOUT
                  </motion.button>

                  <Link
                    href="/menu"
                    className="block text-center text-xs text-stone-400 hover:text-white transition-colors"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 2: 3-STEP CHECKOUT                                 */}
        {/* ======================================================== */}
        {stage === "checkout" && (
          <div className="space-y-12">
            <div>
              <span className="text-[10px] uppercase tracking-[0.26em] text-stone-400 font-medium block">
                SECURE CHECKOUT
              </span>
              <h1 className="text-4xl sm:text-5xl font-serif text-white tracking-tight mt-1">
                Complete your order
              </h1>
            </div>

            {/* Stepper Progress */}
            <div className="max-w-md mx-auto relative flex items-center justify-between">
              <div className="absolute top-4 left-6 right-6 h-[1px] bg-stone-800 -z-0" />

              {/* Step 1 */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    checkoutStep === 1
                      ? "bg-white text-black"
                      : "bg-[#C1A87D] text-black"
                  }`}
                >
                  {checkoutStep > 1 ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    "1"
                  )}
                </div>
                <span className="text-[11px] text-stone-300 mt-2 font-medium">
                  Details
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    checkoutStep === 2
                      ? "bg-white text-black"
                      : checkoutStep > 2
                        ? "bg-[#C1A87D] text-black"
                        : "bg-[#1C1F26] text-stone-400 border border-stone-700"
                  }`}
                >
                  {checkoutStep > 2 ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    "2"
                  )}
                </div>
                <span className="text-[11px] text-stone-400 mt-2 font-light">
                  Pickup
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    checkoutStep === 3
                      ? "bg-white text-black"
                      : "bg-[#1C1F26] text-stone-400 border border-stone-700"
                  }`}
                >
                  3
                </div>
                <span className="text-[11px] text-stone-400 mt-2 font-light">
                  Review
                </span>
              </div>
            </div>

            {/* Form Box & Order Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Form Content */}
              <div className="lg:col-span-8 bg-[#181A20] border border-stone-800 rounded-[2px] p-8 sm:p-12 shadow-2xl">
                <AnimatePresence mode="wait">
                  {/* STEP 1: CUSTOMER DETAILS */}
                  {checkoutStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-serif text-white">
                          Customer details
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                            FIRST NAME
                          </label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Your first name"
                            className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                            LAST NAME
                          </label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Your last name"
                            className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                            EMAIL
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                            CONTACT NUMBER
                          </label>
                          <input
                            type="tel"
                            required
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            placeholder="+94"
                            className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D]"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-stone-300 pt-2">
                        <input
                          type="checkbox"
                          checked={emailUpdates}
                          onChange={(e) => setEmailUpdates(e.target.checked)}
                          className="w-4 h-4 accent-[#C1A87D]"
                        />
                        <span>Email me updates about this order</span>
                      </label>

                      <div className="flex justify-end pt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => {
                            setCheckoutStep(2);
                            setSubmitError(null);
                          }}
                          className="bg-[#F6F2EB] hover:bg-white text-[#121316] text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3.5 rounded-[2px] shadow-md cursor-pointer"
                        >
                          CONTINUE
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: PICKUP DETAILS */}
                  {checkoutStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <h2 className="text-2xl font-serif text-white">
                        Pickup details
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                            ORDER TYPE
                          </label>
                          <select
                            value={orderType}
                            onChange={(e) => {
                              setOrderType(e.target.value);
                              setSubmitError(null);
                            }}
                            className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D]"
                          >
                            <option value="Pickup">Takeaway / Pickup</option>
                            <option value="Dine-in Pre-order">
                              Dine-in Pre-order (Requires Table Reservation)
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                            PICKUP DATE
                          </label>
                          <input
                            type="date"
                            min={todayStr}
                            max={maxDateStr}
                            value={pickupDate}
                            onChange={(e) => {
                              setPickupDate(e.target.value);
                              setSubmitError(null);
                            }}
                            className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D] [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      {orderType === "Dine-in Pre-order" && (
                        <div className="bg-[#17191F] border border-amber-900/50 rounded-[2px] p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase tracking-wider text-[#C1A87D] block font-medium">
                              TABLE RESERVATION REFERENCE *
                            </label>
                            <span className="text-[10px] text-stone-400">e.g. RES-1001</span>
                          </div>
                          <input
                            type="text"
                            value={reservationId}
                            onChange={(e) => {
                              setReservationId(e.target.value);
                              setSubmitError(null);
                            }}
                            placeholder="Enter your confirmed table reservation reference"
                            className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D]"
                          />
                          <p className="text-[11px] text-stone-400 leading-relaxed">
                            Dine-in pre-orders are plated and served directly to your reserved table. If you are picking up your food to take away, please select <strong>Takeaway / Pickup</strong> above.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                            PICKUP TIME
                          </label>
                          <select
                            value={pickupTime}
                            onChange={(e) => {
                              setPickupTime(e.target.value);
                              setSubmitError(null);
                            }}
                            className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D]"
                          >
                            {availableTimeSlots.map((slot: string) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                          {availableTimeSlots.length === 0 && (
                            <p className="text-[11px] text-amber-400/90 mt-1.5">
                              Orders for today are closed (operating hours 11:00 AM - 11:00 PM with 30m minimum prep). Please select tomorrow.
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                            PROMO CODE
                          </label>
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Optional"
                            className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] px-3.5 py-3 text-sm text-stone-200 outline-none focus:border-[#C1A87D]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-2 font-medium">
                          ORDER NOTES
                        </label>
                        <textarea
                          rows={4}
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="Special dietary requests, allergies, or collection notes"
                          className="w-full bg-[#12141A] border border-stone-700 rounded-[2px] p-3.5 text-sm text-stone-200 outline-none focus:border-[#C1A87D] resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutStep(1);
                            setSubmitError(null);
                          }}
                          className="border border-stone-600 hover:border-white text-stone-200 text-xs uppercase tracking-wider px-6 py-3 rounded-[2px]"
                        >
                          BACK
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => {
                            if (orderType === "Dine-in Pre-order" && !reservationId.trim()) {
                              setSubmitError("Please enter your table reservation reference for Dine-in Pre-orders, or switch Order Type to Takeaway / Pickup.");
                              return;
                            }
                            setCheckoutStep(3);
                            setSubmitError(null);
                          }}
                          className="bg-[#F6F2EB] hover:bg-white text-[#121316] text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3.5 rounded-[2px] shadow-md cursor-pointer"
                        >
                          CONTINUE
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: FINAL REVIEW */}
                  {checkoutStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <h2 className="text-2xl font-serif text-white">
                         Final review
                      </h2>

                      {submitError && (
                        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-3 rounded-[2px]">
                          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      <div className="space-y-6">
                        {/* Contact Summary */}
                        <div className="pb-5 border-b border-stone-800">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                              CONTACT
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutStep(1);
                                setSubmitError(null);
                              }}
                              className="text-xs text-stone-300 underline hover:text-white"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-sm text-stone-200 mt-2 font-light">
                            {firstName} {lastName} · {email} · {contactNumber}
                          </p>
                        </div>

                        {/* Pickup Summary */}
                        <div className="pb-5 border-b border-stone-800">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                              PICKUP
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutStep(2);
                                setSubmitError(null);
                              }}
                              className="text-xs text-stone-300 underline hover:text-white"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-sm text-stone-200 mt-2 font-light">
                            {orderType === "Dine-in Pre-order"
                              ? `Dine-in Pre-order (Reservation: ${reservationId || "Not specified"}) · Scheduled for ${pickupDate} at ${pickupTime}`
                              : `Takeaway / Pickup · Ready on ${pickupDate} at ${pickupTime}`}
                            {" · "}Pending restaurant confirmation
                          </p>
                        </div>
                      </div>

                      {/* Payment Notice */}
                      <div className="bg-[#1D1E1B] border-l-2 border-[#C1A87D] p-4 text-xs text-stone-300 space-y-1">
                        <span className="font-semibold text-white block">
                          Payment at Restaurant
                        </span>
                        <p className="font-light text-stone-400">
                          Settlement will be completed upon collection or table arrival. Authoritative totals are verified by restaurant systems.
                        </p>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setCheckoutStep(2);
                            setSubmitError(null);
                          }}
                          className="border border-stone-600 hover:border-white text-stone-200 text-xs uppercase tracking-wider px-6 py-3 rounded-[2px]"
                        >
                          BACK
                        </button>
                        <motion.button
                          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                          whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                          type="button"
                          disabled={isSubmitting}
                          onClick={handlePlaceOrder}
                          className="bg-[#F6F2EB] hover:bg-white text-[#121316] text-xs font-semibold tracking-[0.16em] uppercase px-8 py-3.5 rounded-[2px] shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>SUBMITTING ORDER...</span>
                            </>
                          ) : (
                            <span>PLACE ORDER</span>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-4 bg-[#181A20] border border-stone-800 rounded-[2px] p-6 sm:p-8 space-y-6">
                <h3 className="font-serif text-2xl text-white">
                  Order summary
                </h3>

                <div className="space-y-3 text-xs sm:text-sm font-light text-stone-300">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-white font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service charge (10%)</span>
                    <span className="font-mono text-white font-medium">
                      {formatPrice(serviceCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated taxes (2.5%)</span>
                    <span className="font-mono text-white font-medium">
                      {formatPrice(estimatedTaxes)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 flex justify-between items-baseline">
                  <span className="text-sm font-medium text-white">Total</span>
                  <span className="font-mono text-lg font-bold text-white">
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                <p className="text-[11px] text-stone-400 font-light">
                  All prices computed authoritatively in LKR minor units by backend restaurant services.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 3: ORDER RECEIVED SUCCESS                          */}
        {/* ======================================================== */}
        {stage === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 max-w-2xl mx-auto space-y-6"
          >
            {/* Circular Green Badge */}
            <div className="w-16 h-16 rounded-full bg-[#525E50] border border-[#6B7A69] flex items-center justify-center mx-auto text-white shadow-xl">
              <Check className="w-8 h-8 stroke-[2.2]" />
            </div>

            <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
              ORDER RECEIVED
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-serif font-normal text-white tracking-tight leading-tight">
              Thank you. We&apos;ve received <br />
              your order.
            </h1>

            <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed max-w-lg mx-auto">
              Your order has been recorded in the restaurant management system. The kitchen will review and confirm your preparation window.
            </p>

            {/* Reference Badge Card */}
            <div className="max-w-md mx-auto bg-[#181B22] border border-[#272B35] rounded-[2px] p-5 flex items-center justify-center gap-4 text-xs shadow-xl">
              <span className="text-stone-400 uppercase tracking-widest text-[10px]">
                ORDER REFERENCE
              </span>
              <span className="font-mono text-base font-bold text-white tracking-wider">
                {orderRef}
              </span>
              <span className="px-2.5 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider bg-[#32362F] text-[#B8C4B4]">
                {placedOrder?.orderStatus || "RECEIVED"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => setStage("status")}
                className="bg-[#F6F2EB] hover:bg-white text-[#15161A] text-xs font-semibold tracking-[0.16em] uppercase px-7 py-3.5 rounded-[2px] transition-colors shadow-md cursor-pointer"
              >
                VIEW ORDER STATUS
              </button>
              <Link
                href="/menu"
                className="border border-stone-600 hover:border-white text-stone-200 hover:text-white text-xs font-semibold tracking-[0.16em] uppercase px-7 py-3.5 rounded-[2px] transition-colors"
              >
                RETURN TO MENU
              </Link>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* STAGE 4: ORDER STATUS TRACKING                           */}
        {/* ======================================================== */}
        {stage === "status" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="-mt-28 -mx-4 sm:-mx-8 lg:-mx-12"
          >
            {/* Top Olive-Charcoal Header Strip */}
            <div className="w-full bg-[#232520] border-b border-stone-800/80 pt-32 pb-16 sm:pb-20 px-4 sm:px-8 text-center">
              <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C1A87D] font-medium block">
                ORDER {orderRef}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-serif font-normal text-white tracking-tight mt-3">
                {currentStatus === OrderStatus.CANCELLED
                  ? "Cancelled"
                  : currentStatus === OrderStatus.COMPLETED
                  ? "Completed"
                  : currentStatus === OrderStatus.READY
                  ? (isDineIn ? "Ready for Service" : "Ready for Pickup")
                  : currentStatus === OrderStatus.PREPARING
                  ? "Preparing"
                  : currentStatus === OrderStatus.CONFIRMED
                  ? "Accepted"
                  : "Order Received"}
              </h1>
              <p className="text-stone-300 text-xs sm:text-sm font-light mt-3 max-w-xl mx-auto leading-relaxed">
                Live real-time updates broadcast directly from Aurelle kitchen & management systems.
              </p>
            </div>

            {/* Content Section */}
            <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-12 lg:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Card: Scheduled Pickup & Stepper */}
                <div className="lg:col-span-8 bg-[#181A16] border border-stone-800/80 rounded-[2px] p-6 sm:p-10 shadow-2xl space-y-6">
                  {/* Top Pickup Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Clock className="w-6 h-6 stroke-[1.6] text-stone-300 mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium block">
                          Scheduled pickup
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-serif text-white mt-1">
                          {placedOrder?.scheduledFor
                            ? new Date(placedOrder.scheduledFor).toLocaleString([], {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : `Today, ${pickupTime}`}
                        </h3>
                        <p className="text-xs text-stone-400 font-light mt-1">
                          Venue: Aurelle Colombo (Flagship Dining)
                        </p>
                      </div>
                    </div>

                    {/* Self-cancellation button if still RECEIVED / CONFIRMED */}
                    {(currentStatus === OrderStatus.RECEIVED ||
                      currentStatus === OrderStatus.CONFIRMED) && (
                      <button
                        type="button"
                        disabled={isCancelling}
                        onClick={handleCancelOrder}
                        className="text-xs text-stone-400 hover:text-rose-400 border border-stone-700 hover:border-rose-700 px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer"
                      >
                        {isCancelling ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </div>

                  {cancelError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-[2px]">
                      {cancelError}
                    </div>
                  )}

                  {currentStatus === OrderStatus.CANCELLED && (
                    <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-[2px] text-rose-200 text-xs flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-sm">
                          Order Cancelled
                        </span>
                        <p className="text-stone-300 mt-1">
                          {placedOrder?.cancellationReason || "Customer or restaurant management cancelled this order."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="w-full h-px bg-stone-800/80 my-4" />

                  {/* Vertical Progress Stepper */}
                  <div className="space-y-0">
                    {statusSteps.map((step, idx) => {
                      const isPast = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex && currentStatus !== OrderStatus.CANCELLED;
                      const isLast = idx === statusSteps.length - 1;

                      return (
                        <div key={step.status} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-md ${
                                isPast
                                  ? "bg-[#525E50] border border-[#6B7A69] text-white"
                                  : isCurrent
                                  ? "bg-[#C1A87D] text-[#111215] font-bold"
                                  : "border border-stone-700 bg-transparent text-transparent"
                              }`}
                            >
                              {isPast ? (
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              ) : isCurrent ? (
                                <span className="w-2 h-2 rounded-full bg-[#111215]" />
                              ) : null}
                            </div>
                            {!isLast && (
                              <div
                                className={`w-[1.5px] h-10 my-1 ${
                                  isPast ? "bg-stone-600" : "bg-stone-800"
                                }`}
                              />
                            )}
                          </div>
                          <div className="pt-0.5 pb-4">
                            <h4
                              className={`text-sm tracking-wide ${
                                isCurrent
                                  ? "font-medium text-[#C1A87D]"
                                  : isPast
                                  ? "font-medium text-white"
                                  : "font-light text-stone-500"
                              }`}
                            >
                              {step.label}
                            </h4>
                            {isCurrent && (
                              <p className="text-xs text-stone-400 font-light mt-0.5">
                                Current live status
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Items snapshot in tracking view */}
                  {placedOrder && placedOrder.items && (
                    <div className="pt-6 border-t border-stone-800/80 space-y-3">
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                        ORDER SUMMARY ({placedOrder.items.length} {placedOrder.items.length === 1 ? "ITEM" : "ITEMS"})
                      </span>
                      <div className="divide-y divide-stone-800/60">
                        {placedOrder.items.map((item, idx) => (
                          <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                            <span className="text-stone-200">
                              {item.quantity}× {item.dishName}
                            </span>
                            <span className="font-mono text-stone-300">
                              LKR {(item.lineTotalMinor / 100).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-stone-800 space-y-1.5 text-xs text-stone-400">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-mono text-stone-300">
                            {placedOrder.formattedSubtotal}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Charge (10%)</span>
                          <span className="font-mono text-stone-300">
                            {placedOrder.formattedServiceCharge}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Statutory Tax (2.5%)</span>
                          <span className="font-mono text-stone-300">
                            {placedOrder.formattedTax}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-medium text-white pt-2 border-t border-stone-800/80">
                          <span>Total</span>
                          <span className="font-mono text-[#C1A87D] font-bold">
                            {placedOrder.formattedTotal}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Card: Need Help? */}
                <div className="lg:col-span-4 bg-[#21231E] border border-[#2E3129] rounded-[2px] p-7 sm:p-8 shadow-xl space-y-4">
                  <span className="text-[10.5px] uppercase tracking-[0.24em] text-stone-300 font-medium block">
                    NEED HELP?
                  </span>
                  <h3 className="font-serif text-2xl sm:text-[26px] text-white font-normal">
                    We&apos;re here to assist
                  </h3>
                  <p className="text-xs text-stone-400 font-light leading-relaxed">
                    If you have dietary questions or wish to modify pickup timing, call our dining concierge at +94 11 234 5678.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/contact"
                      className="inline-block border border-stone-400 hover:border-white text-stone-200 hover:text-white text-[11px] font-semibold tracking-[0.16em] uppercase px-6 py-3 transition-colors"
                    >
                      CONTACT THE RESTAURANT
                    </Link>
                  </div>
                </div>
              </div>

              {/* Navigation Back */}
              <div className="pt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setStage("bag")}
                  className="text-xs text-stone-400 hover:text-stone-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  ← Back to bag
                </button>
                <span className="text-stone-600">·</span>
                <Link
                  href="/menu"
                  className="text-xs text-[#C1A87D] hover:underline uppercase tracking-wider font-medium"
                >
                  Return to Menu
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#111215] flex items-center justify-center text-stone-400 text-xs uppercase tracking-widest">
          Loading Order Services...
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
