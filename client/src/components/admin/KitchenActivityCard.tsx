'use client';

import React from 'react';
import Link from 'next/link';
import { KitchenActivitySummary } from '../../types/dashboard';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { ChefHat, ArrowRight, Clock, Flame, CheckCircle2, AlertCircle } from 'lucide-react';

interface KitchenActivityCardProps {
  activity: KitchenActivitySummary;
}

export const KitchenActivityCard = ({ activity }: KitchenActivityCardProps) => {
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
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ChefHat size={16} />
            </div>
            <div>
              <h3
                className={`text-base font-serif font-semibold tracking-wide ${
                  isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                }`}
              >
                Kitchen Activity
              </h3>
              <span className="text-[10px] font-mono text-[#737068] uppercase">
                Line Expediting
              </span>
            </div>
          </div>

          <Link
            href="/staff/admin/kitchen"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#B99A63] hover:underline"
          >
            <span>Open Kitchen Overview</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div
            className={`p-3 rounded-xl border text-center ${
              isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
            }`}
          >
            <div className="text-[10px] uppercase font-mono text-[#737068] mb-1">
              New Orders
            </div>
            <div className="text-xl font-serif font-semibold">
              {activity.newOrders !== null ? activity.newOrders : '—'}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border text-center ${
              isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
            }`}
          >
            <div className="text-[10px] uppercase font-mono text-[#737068] mb-1">
              Accepted
            </div>
            <div className="text-xl font-serif font-semibold">
              {activity.acceptedOrders !== null ? activity.acceptedOrders : '—'}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border text-center ${
              isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
            }`}
          >
            <div className="text-[10px] uppercase font-mono text-amber-400 mb-1">
              Preparing
            </div>
            <div className="text-xl font-serif font-semibold text-amber-400">
              {activity.preparingOrders !== null ? activity.preparingOrders : '—'}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border text-center ${
              isDark ? 'bg-[#171715] border-[#2C2C28]' : 'bg-[#F6F1E8] border-[#E5DFD3]'
            }`}
          >
            <div className="text-[10px] uppercase font-mono text-emerald-400 mb-1">
              Ready on Pass
            </div>
            <div className="text-xl font-serif font-semibold text-emerald-400">
              {activity.readyOrders !== null ? activity.readyOrders : '—'}
            </div>
          </div>
        </div>

        {!activity.connected && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{activity.message}</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#B99A63]/10 mt-4 flex items-center justify-between text-[10px] font-mono text-[#737068]">
        <span>Station: Executive Pass</span>
        <span>KMS Integration: {activity.connected ? 'Active' : 'Awaiting Stage 5'}</span>
      </div>
    </div>
  );
};
