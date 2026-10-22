"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AccountModal from "../../components/AccountModal";
import { useAuth } from "../../context/AuthContext";
import { Sparkles } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin?redirect=/profile");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-[#C1A87D]/40 bg-[#16171C]/70 shadow-lg shadow-black/40 flex items-center justify-center text-[#C1A87D]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.24em] text-[#C1A87D]">
            Loading Your Aurelle Profile...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center justify-center">
      <AccountModal
        isOpen={true}
        onClose={() => router.push("/")}
        isStandalonePage={true}
      />
    </div>
  );
}
