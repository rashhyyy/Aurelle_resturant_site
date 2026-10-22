"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ChevronRight, ChevronDown, Check, ShieldCheck, Lock, Bell, Calendar, Package } from "lucide-react";
import { apiClient } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreferences?: () => void;
  isStandalonePage?: boolean;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  dateOfBirth: string;
}

const DEFAULT_PROFILE: UserProfile = {
  firstName: "Sample",
  lastName: "Customer",
  email: "customer@example.com",
  countryCode: "Sri Lanka (+94)",
  phone: "77 123 4567",
  dateOfBirth: "",
};

export default function AccountModal({
  isOpen,
  onClose,
  onOpenPreferences,
  isStandalonePage = false,
}: AccountModalProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { formatPrice, openPreferences } = usePreferences();

  const [activeTab, setActiveTab] = useState("Overview");
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [formState, setFormState] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // Sync profile when authenticated user is loaded
  useEffect(() => {
    if (user) {
      const updatedProfile: UserProfile = {
        firstName: user.firstName || user.username || "Customer",
        lastName: user.lastName || "",
        email: user.email || "",
        countryCode: user.countryCode || "Sri Lanka (+94)",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || "",
      };
      setProfile(updatedProfile);
      setFormState(updatedProfile);
      try {
        localStorage.setItem("aurelle_user_profile", JSON.stringify(updatedProfile));
      } catch (e) {}
    }
  }, [user]);

  // Load saved profile on mount and fetch orders
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aurelle_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setFormState(parsed);
      }
    } catch (e) {
      // Ignore storage errors
    }

    // Load recent order from local storage if available
    try {
      const latestSaved = localStorage.getItem("aurelle_latest_order");
      if (latestSaved) {
        setUserOrders([JSON.parse(latestSaved)]);
      }
    } catch (e) {}

    // Fetch server order history
    apiClient<{ success: boolean; data: { orders: any[] } }>("/orders/my")
      .then((data) => {
        if (data?.success && Array.isArray(data.data?.orders) && data.data.orders.length > 0) {
          setUserOrders(data.data.orders);
        }
      })
      .catch(() => {});
  }, []);

  // When modal opens, sync form state
  useEffect(() => {
    if (isOpen) {
      setFormState(profile);
      setSaveSuccess(false);
    }
  }, [isOpen, profile]);

  // Close on Escape key press and prevent background scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen && !isStandalonePage) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isStandalonePage]);

  const navItems = [
    "Overview",
    "Edit profile",
    "My orders",
    "Reservations & events",
    "Notifications",
    "Preferences",
    "Account security",
  ];

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      // Ignore logout errors
    }
    onClose();
    router.push("/");
  };

  const handleTabClick = (item: string) => {
    if (item === "Preferences") {
      onClose();
      if (onOpenPreferences) {
        onOpenPreferences();
      } else {
        openPreferences();
      }
      return;
    }
    if (item === "Sign out") {
      handleSignOut();
      return;
    }
    if (item === "Edit profile") {
      setFormState(profile);
      setSaveSuccess(false);
    }
    setActiveTab(item);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formState);
    try {
      localStorage.setItem("aurelle_user_profile", JSON.stringify(formState));
      if (user) {
        await apiClient("/auth/profile", {
          method: "PUT",
          data: formState,
        }).catch(() => {});
      }
    } catch (err) {
      // Ignore storage errors
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab("Overview");
    }, 1000);
  };

  const handleCancel = () => {
    setFormState(profile);
    setSaveSuccess(false);
    setActiveTab("Overview");
  };

  const modalBody = (
    <div className={`relative w-full max-w-5xl ${isStandalonePage ? "" : "max-h-[88vh] overflow-y-auto"} bg-[#101114] border border-stone-800 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-4 sm:p-9 z-10 [color-scheme:dark]`}>
      {/* Top Modal Header Bar */}
      <div className="flex items-center justify-between pb-5 border-b border-stone-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Go back"
          className="group inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-semibold tracking-[0.2em] uppercase transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{isStandalonePage ? "HOME" : "BACK"}</span>
        </button>

        {!isStandalonePage && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
          >
            <X className="w-5 h-5 stroke-[1.8]" />
          </button>
        )}
      </div>

      {/* Layout Grid: Left Sidebar + Right Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 mt-7">
              {/* Left Column: MY AURELLE Navigation */}
              <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-stone-800/90 pr-0 md:pr-6 pb-6 md:pb-0 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.24em] text-[#C1A87D] font-medium block mb-5">
                    MY AURELLE
                  </span>

                  <nav className="divide-y divide-stone-800/60 border-t border-stone-800/60">
                    {navItems.map((item) => {
                      const isActive = activeTab === item;

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleTabClick(item)}
                          className={`w-full flex items-center justify-between py-3.5 px-1 text-left text-sm transition-colors ${
                            isActive
                              ? "text-white font-bold"
                              : "text-stone-400 hover:text-stone-200"
                          }`}
                        >
                          <span>{item}</span>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isActive ? "text-white" : "text-stone-600"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Bottom Sign out button */}
                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => handleTabClick("Sign out")}
                    className="text-sm font-medium text-[#C97B6A] hover:text-[#e08f7d] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>

              {/* Right Column: Dynamic Tab Content */}
              <div className="md:col-span-8">
                {/* 1. EDIT PROFILE TAB */}
                {activeTab === "Edit profile" && (
                  <div className="bg-[#17181D] border border-stone-800/90 rounded-[3px] p-6 sm:p-9 shadow-2xl">
                    {/* Header */}
                    <div className="flex items-start justify-between pb-6 border-b border-stone-800/50">
                      <div>
                        <h2 className="text-3xl sm:text-4xl font-serif font-normal text-white tracking-tight">
                          Personal information
                        </h2>
                        <p className="text-stone-400 text-xs sm:text-[13px] font-light mt-1.5">
                          Manage the details associated with your account.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("Account security")}
                        className="text-stone-200 hover:text-[#C1A87D] underline underline-offset-4 text-xs font-light transition-colors whitespace-nowrap pt-1"
                      >
                        Account security
                      </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSaveProfile} className="space-y-6 pt-6">
                      {/* Row 1: First Name & Last Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold block mb-2">
                            FIRST NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={formState.firstName}
                            onChange={(e) =>
                              setFormState({ ...formState, firstName: e.target.value })
                            }
                            className="w-full bg-[#111215] border border-stone-800/90 focus:border-[#C1A87D] focus:outline-none px-4 py-3 text-sm text-stone-100 rounded-[2px] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold block mb-2">
                            LAST NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={formState.lastName}
                            onChange={(e) =>
                              setFormState({ ...formState, lastName: e.target.value })
                            }
                            className="w-full bg-[#111215] border border-stone-800/90 focus:border-[#C1A87D] focus:outline-none px-4 py-3 text-sm text-stone-100 rounded-[2px] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Row 2: Email & Country Code + Phone Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold block mb-2">
                            EMAIL ADDRESS *
                          </label>
                          <input
                            type="email"
                            required
                            value={formState.email}
                            onChange={(e) =>
                              setFormState({ ...formState, email: e.target.value })
                            }
                            className="w-full bg-[#111215] border border-stone-800/90 focus:border-[#C1A87D] focus:outline-none px-4 py-3 text-sm text-stone-100 rounded-[2px] transition-colors"
                          />
                        </div>

                        {/* Country Code and Phone Number side by side */}
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5">
                            <label
                              className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold block mb-2 truncate"
                              title="COUNTRY CODE"
                            >
                              COUNTRY CODE
                            </label>
                            <div className="relative">
                              <select
                                value={formState.countryCode}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    countryCode: e.target.value,
                                  })
                                }
                                className="w-full bg-[#111215] border border-stone-800/90 focus:border-[#C1A87D] focus:outline-none px-3 py-3 text-xs sm:text-sm text-stone-100 rounded-[2px] appearance-none pr-7 transition-colors cursor-pointer"
                              >
                                <option value="Sri Lanka (+94)">Sri Lanka (+94)</option>
                                <option value="United States (+1)">United States (+1)</option>
                                <option value="United Kingdom (+44)">United Kingdom (+44)</option>
                                <option value="Australia (+61)">Australia (+61)</option>
                                <option value="India (+91)">India (+91)</option>
                                <option value="Singapore (+65)">Singapore (+65)</option>
                                <option value="United Arab Emirates (+971)">UAE (+971)</option>
                                <option value="Canada (+1)">Canada (+1)</option>
                                <option value="Germany (+49)">Germany (+49)</option>
                                <option value="France (+33)">France (+33)</option>
                                <option value="Japan (+81)">Japan (+81)</option>
                                <option value="Maldives (+960)">Maldives (+960)</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>

                          <div className="col-span-7">
                            <label
                              className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold block mb-2 truncate"
                              title="PHONE NUMBER"
                            >
                              PHONE NUMBER
                            </label>
                            <input
                              type="tel"
                              value={formState.phone}
                              onChange={(e) =>
                                setFormState({ ...formState, phone: e.target.value })
                              }
                              placeholder="77 123 4567"
                              className="w-full bg-[#111215] border border-stone-800/90 focus:border-[#C1A87D] focus:outline-none px-4 py-3 text-sm text-stone-100 rounded-[2px] transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Date of Birth (Optional) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold block mb-2">
                            DATE OF BIRTH (OPTIONAL)
                          </label>
                          <input
                            type="date"
                            value={formState.dateOfBirth}
                            onChange={(e) =>
                              setFormState({
                                ...formState,
                                dateOfBirth: e.target.value,
                              })
                            }
                            className="w-full bg-[#111215] border border-stone-800/90 focus:border-[#C1A87D] focus:outline-none px-4 py-3 text-sm text-stone-100 rounded-[2px] transition-colors [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      {/* Success Feedback Banner */}
                      {saveSuccess && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-[2px]">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Personal information saved successfully.</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-800/50">
                        <button
                          type="submit"
                          className="bg-[#786646] hover:bg-[#8B7652] text-[#141414] font-semibold text-xs tracking-[0.16em] uppercase px-7 py-3.5 rounded-[2px] transition-colors cursor-pointer"
                        >
                          SAVE CHANGES
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="bg-transparent hover:bg-stone-800/50 border border-white text-white font-semibold text-xs tracking-[0.16em] uppercase px-7 py-3.5 rounded-[2px] transition-colors cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 2. OVERVIEW DASHBOARD TAB */}
                {activeTab === "Overview" && (
                  <div className="space-y-8">
                    {/* Greeting Title */}
                    <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
                      Good evening, {profile.firstName || "Sample"}
                    </h2>

                    {/* Top Two Cards: Upcoming Reservation & Active Order */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Card 1: Upcoming Reservation */}
                      <div className="bg-[#181A20] border border-stone-800/80 rounded-[2px] p-6 flex flex-col justify-between shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
                            UPCOMING RESERVATION
                          </span>
                          <span className="bg-[#2D2A20] text-[#D4B572] text-[9.5px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-[2px]">
                            PENDING
                          </span>
                        </div>

                        <div>
                          <h3 className="font-serif text-2xl text-white font-normal tracking-wide">
                            Friday, 18 October
                          </h3>
                          <p className="text-stone-400 text-xs sm:text-[13px] font-light mt-1">
                            7:30 PM · 2 guests · RES-2841
                          </p>
                        </div>

                        <div className="pt-2">
                          <Link
                            href="/reservations"
                            onClick={onClose}
                            className="text-xs font-medium text-stone-200 hover:text-white underline underline-offset-4 transition-colors"
                          >
                            View reservation
                          </Link>
                        </div>
                      </div>

                      {/* Card 2: Active Order */}
                      <div className="bg-[#181A20] border border-stone-800/80 rounded-[2px] p-6 flex flex-col justify-between shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
                            ACTIVE ORDER
                          </span>
                          <span className="bg-[#1E2522] text-[#86A697] text-[9.5px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-[2px]">
                            {userOrders[0]?.orderStatus || "RECEIVED"}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-serif text-2xl text-white font-normal tracking-wide">
                            {userOrders[0]?.orderReference || "AUR-10482"}
                          </h3>
                          <p className="text-stone-400 text-xs sm:text-[13px] font-light mt-1">
                            {userOrders[0]?.scheduledFor
                              ? `Pickup: ${new Date(userOrders[0].scheduledFor).toLocaleString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  month: "short",
                                  day: "numeric",
                                })}`
                              : "Pickup today · 7:00 PM"}
                          </p>
                        </div>

                        <div className="pt-2">
                          <Link
                            href={
                              userOrders[0]?.orderReference
                                ? `/cart?orderRef=${userOrders[0].orderReference}`
                                : "/cart?stage=status"
                            }
                            onClick={onClose}
                            className="text-xs font-medium text-stone-200 hover:text-white underline underline-offset-4 transition-colors"
                          >
                            Track order
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card: Profile Details */}
                    <div className="bg-[#181A20] border border-stone-800/80 rounded-[2px] p-6 sm:p-7 shadow-xl space-y-4">
                      <span className="text-[10.5px] uppercase tracking-[0.2em] text-stone-400 font-medium block">
                        Profile details
                      </span>

                      <div className="space-y-1 text-sm text-stone-200 font-light">
                        <p className="font-medium text-white text-base">
                          {profile.firstName} {profile.lastName}
                        </p>
                        <p className="text-stone-400 text-xs sm:text-sm">
                          {profile.email}
                        </p>
                        <p className="text-stone-400 text-xs sm:text-sm">
                          {profile.countryCode.match(/\(\+\d+\)/)?.[0] || "+94"}{" "}
                          {profile.phone}
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormState(profile);
                            setActiveTab("Edit profile");
                          }}
                          className="inline-flex items-center justify-center bg-transparent hover:bg-stone-800/60 border border-stone-500 hover:border-white text-stone-100 text-[11px] font-semibold tracking-[0.16em] uppercase px-5 py-2.5 rounded-[2px] transition-colors cursor-pointer"
                        >
                          EDIT PROFILE
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MY ORDERS TAB */}
                {activeTab === "My orders" && (
                  <div className="bg-[#17181D] border border-stone-800/90 rounded-[3px] p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-stone-800/60">
                      <div>
                        <h2 className="text-2xl font-serif text-white font-normal">My Orders</h2>
                        <p className="text-stone-400 text-xs mt-1">Review your recent dine-in and pickup orders</p>
                      </div>
                      <Package className="w-5 h-5 text-[#C1A87D]" />
                    </div>

                    {userOrders.length > 0 ? (
                      <div className="space-y-3">
                        {userOrders.map((ord: any) => (
                          <div
                            key={ord.id || ord.orderReference}
                            className="bg-[#111215] border border-stone-800/80 p-5 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <span className="text-xs text-[#86A697] font-semibold tracking-wider uppercase block">
                                ORDER #{ord.orderReference} · {ord.orderStatus || "RECEIVED"}
                              </span>
                              <p className="text-white font-medium text-sm mt-1">
                                {ord.items?.[0]
                                  ? `${ord.items[0].dishName}${ord.items.length > 1 ? ` +${ord.items.length - 1} more` : ""}`
                                  : "Aurelle Fine Dining Order"}
                              </p>
                              <span className="text-xs text-stone-400">
                                {ord.scheduledFor
                                  ? `Scheduled: ${new Date(ord.scheduledFor).toLocaleString([], {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}`
                                  : "Scheduled pickup: Today at 7:00 PM"}{" "}
                                · {formatPrice(Math.round((ord.totalMinor || 0) / 100))}
                              </span>
                            </div>
                            <Link
                              href={`/cart?orderRef=${ord.orderReference}`}
                              onClick={onClose}
                              className="text-xs uppercase tracking-wider text-[#C1A87D] hover:underline"
                            >
                              Details
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#111215] border border-stone-800/80 p-8 rounded-[2px] text-center text-stone-400 text-xs">
                        No orders recorded yet. Explore our restaurant tasting menu to place your first takeaway or pre-order.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. RESERVATIONS & EVENTS TAB */}
                {activeTab === "Reservations & events" && (
                  <div className="bg-[#17181D] border border-stone-800/90 rounded-[3px] p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-stone-800/60">
                      <div>
                        <h2 className="text-2xl font-serif text-white font-normal">Reservations & Events</h2>
                        <p className="text-stone-400 text-xs mt-1">Your upcoming dining reservations and private bookings</p>
                      </div>
                      <Calendar className="w-5 h-5 text-[#C1A87D]" />
                    </div>

                    <div className="bg-[#111215] border border-stone-800/80 p-5 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-[#D4B572] font-semibold tracking-wider uppercase block">BOOKING #RES-2841 · CONFIRMED</span>
                        <p className="text-white font-medium text-sm mt-1">Main Dining Pavilion · 2 Guests</p>
                        <span className="text-xs text-stone-400">Friday, 18 October · 7:30 PM</span>
                      </div>
                      <Link
                        href="/reservations"
                        onClick={onClose}
                        className="text-xs uppercase tracking-wider text-[#C1A87D] hover:underline"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                )}

                {/* 5. NOTIFICATIONS TAB */}
                {activeTab === "Notifications" && (
                  <div className="bg-[#17181D] border border-stone-800/90 rounded-[3px] p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-stone-800/60">
                      <div>
                        <h2 className="text-2xl font-serif text-white font-normal">Notifications</h2>
                        <p className="text-stone-400 text-xs mt-1">Manage dining alerts, receipts, and seasonal tasting menus</p>
                      </div>
                      <Bell className="w-5 h-5 text-[#C1A87D]" />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-[#111215] border border-stone-800/80 rounded-[2px] cursor-pointer">
                        <div>
                          <p className="text-sm text-white font-medium">Order & Reservation SMS</p>
                          <p className="text-xs text-stone-400">Receive real-time alerts for booking confirmations and preparation</p>
                        </div>
                        <input type="checkbox" defaultChecked className="accent-[#C1A87D] w-4 h-4 cursor-pointer" />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-[#111215] border border-stone-800/80 rounded-[2px] cursor-pointer">
                        <div>
                          <p className="text-sm text-white font-medium">Seasonal Tasting Invitations</p>
                          <p className="text-xs text-stone-400">Exclusive previews of quarterly chef tasting menus and wine pairings</p>
                        </div>
                        <input type="checkbox" defaultChecked className="accent-[#C1A87D] w-4 h-4 cursor-pointer" />
                      </label>
                    </div>

                    <div className="pt-4 border-t border-stone-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <Link
                        href="/account/notifications"
                        onClick={onClose}
                        className="text-xs text-[#C1A87D] hover:underline font-semibold flex items-center gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Open Full Notification Center &rarr;</span>
                      </Link>
                      <Link
                        href="/account/notification-preferences"
                        onClick={onClose}
                        className="text-xs text-stone-400 hover:text-white transition-colors"
                      >
                        Advanced Settings
                      </Link>
                    </div>
                  </div>
                )}

                {/* 6. ACCOUNT SECURITY TAB */}
                {activeTab === "Account security" && (
                  <div className="bg-[#17181D] border border-stone-800/90 rounded-[3px] p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-stone-800/60">
                      <div>
                        <h2 className="text-2xl font-serif text-white font-normal">Account Security</h2>
                        <p className="text-stone-400 text-xs mt-1">Manage your credentials, password, and session access</p>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-[#C1A87D]" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold block mb-2">
                          CURRENT PASSWORD
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          className="w-full bg-[#111215] border border-stone-800/90 focus:border-[#C1A87D] focus:outline-none px-4 py-3 text-sm text-stone-100 rounded-[2px]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold block mb-2">
                            NEW PASSWORD
                          </label>
                          <input
                            type="password"
                            placeholder="••••••••••••"
                            className="w-full bg-[#111215] border border-stone-800/90 focus:border-[#C1A87D] focus:outline-none px-4 py-3 text-sm text-stone-100 rounded-[2px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.16em] text-stone-400 font-semibold block mb-2">
                            CONFIRM NEW PASSWORD
                          </label>
                          <input
                            type="password"
                            placeholder="••••••••••••"
                            className="w-full bg-[#111215] border border-stone-800/90 focus:border-[#C1A87D] focus:outline-none px-4 py-3 text-sm text-stone-100 rounded-[2px]"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            alert("Password updated successfully.");
                            setActiveTab("Overview");
                          }}
                          className="bg-[#786646] hover:bg-[#8B7652] text-[#141414] font-semibold text-xs tracking-[0.16em] uppercase px-6 py-3 rounded-[2px] transition-colors cursor-pointer"
                        >
                          UPDATE PASSWORD
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
    </div>
  );

  if (isStandalonePage) {
    return modalBody;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 lg:p-10 select-none">
          {/* Dimmed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Centered Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl z-10"
          >
            {modalBody}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
