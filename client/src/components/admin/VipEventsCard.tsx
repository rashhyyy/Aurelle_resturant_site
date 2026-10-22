'use client';

import React from 'react';
import Link from 'next/link';
import { VipEventsSummary } from '../../types/dashboard';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { Sparkles, ArrowRight, Crown, GlassWater, Layers } from 'lucide-react';

interface VipEventsCardProps {
  vipEvents: VipEventsSummary;
}

export const VipEventsCard = ({ vipEvents }: VipEventsCardProps) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#B99A63]/15 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3
                className={`text-base font-serif font-semibold tracking-wide ${
                  isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                }`}
              >
                VIP & Events
              </h3>
              <span className="text-[10px] font-mono text-[#737068] uppercase">
                Private Dining & Banquets
              </span>
            </div>
          </div>

          <Link
            href="/staff/admin/vip-rooms"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#B99A63] hover:underline"
          >
            <span>Manage VIP & Events</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {vipEvents.connected ? (
          <div className="grid grid-cols-2 gap-3 my-3">
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
              }`}
            >
              <div className="text-[10px] uppercase font-mono text-[#737068] mb-1">
                Pending Enquiries
              </div>
              <div className="text-xl font-serif font-semibold text-[#B99A63]">
                {vipEvents.pendingEnquiries}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
              }`}
            >
              <div className="text-[10px] uppercase font-mono text-[#737068] mb-1">
                Confirmed Events
              </div>
              <div className="text-xl font-serif font-semibold text-emerald-400">
                {vipEvents.confirmedEvents}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/40 text-zinc-500 border border-zinc-700/50 flex items-center justify-center mb-3">
              <Layers size={22} />
            </div>
            <p
              className={`text-xs font-medium ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              VIP & Banqueting Module Pending
            </p>
            <p className="text-[11px] text-[#737068] mt-1 max-w-sm">
              The Ivory Room and Grand Banquet reservation tracking will be activated in later stages.
            </p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#B99A63]/10 mt-4 flex items-center justify-between text-[10px] font-mono text-[#737068]">
        <span>Venues: The Ivory Room, The Obsidian Suite</span>
        <span>Awaiting Stage Modules</span>
      </div>
    </div>
  );
};
