"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, ArrowRight, PackageCheck } from "lucide-react";

export default function OrderTrackLookupPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = reference.trim().toUpperCase();
    if (cleanRef) {
      router.push(`/cart?ref=${encodeURIComponent(cleanRef)}&stage=status`);
    } else {
      router.push("/cart?stage=status");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#111215] text-[#ECE7DF] pt-32 pb-24 px-6 sm:px-8 lg:px-12 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B99A63] hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>

        <div className="border border-[#262B35] bg-[#16181D]/90 rounded-[2px] p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#202530] border border-[#2D3342] flex items-center justify-center text-[#B99A63] mx-auto mb-4">
              <PackageCheck className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#B99A63] font-medium block">
              LIVE ORDER TRACKING
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal">
              Track Your Order
            </h1>
            <p className="text-xs text-[#9C958B] font-light leading-relaxed">
              Enter your unique order reference number (e.g. AUR-12345) to view live culinary preparation status.
            </p>
          </div>

          <form onSubmit={handleTrack} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Order Reference (e.g. AUR-88910)"
                required
                className="w-full bg-[#111215] border border-[#2F3542] rounded-[1px] px-4 py-3 text-sm text-white placeholder-[#686F7C] outline-none focus:border-[#B99A63] transition-colors"
              />
              <Search className="w-4 h-4 text-[#686F7C] absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#B99A63] hover:bg-white text-black font-medium text-xs tracking-wider uppercase transition-colors duration-200 rounded-[1px] cursor-pointer"
            >
              <span>Track Live Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#232730] text-center">
            <p className="text-[11px] text-[#7E8594]">
              Signed-in patrons can also review all historical orders directly in the{" "}
              <Link href="/account/orders" className="text-[#B99A63] hover:underline">
                Orders Dashboard
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
