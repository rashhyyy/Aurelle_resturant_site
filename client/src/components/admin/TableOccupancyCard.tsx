'use client';

import React from 'react';
import Link from 'next/link';
import { TableOccupancySummary } from '../../types/dashboard';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { Armchair, ArrowRight, Layers } from 'lucide-react';

interface TableOccupancyCardProps {
  occupancy: TableOccupancySummary;
}

export const TableOccupancyCard = ({ occupancy }: TableOccupancyCardProps) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const total = occupancy.totalConfigured || 0;
  const available = occupancy.available || 0;
  const occupied = occupancy.occupied || 0;
  const reserved = occupancy.reserved || 0;
  const cleaning = occupancy.awaitingCleaning || 0;
  const unavailable = occupancy.unavailable || 0;

  // Compute percentage widths for horizontal distribution bar
  const getPct = (val: number) => (total > 0 ? (val / total) * 100 : 0);

  return (
    <div
      className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#B99A63]/15 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Armchair size={16} />
            </div>
            <div>
              <h3
                className={`text-base font-serif font-semibold tracking-wide ${
                  isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                }`}
              >
                Table Occupancy
              </h3>
              <span className="text-[10px] font-mono text-[#737068] uppercase">
                Dining Room Seating
              </span>
            </div>
          </div>

          <Link
            href="/staff/admin/tables"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#B99A63] hover:underline"
          >
            <span>View Floor Plan</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {occupancy.connected && total > 0 ? (
          <div className="space-y-4 my-2">
            {/* Visual Horizontal Distribution Bar */}
            <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${getPct(occupied)}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Occupied: ${occupied}`}
              />
              <div
                style={{ width: `${getPct(reserved)}%` }}
                className="bg-indigo-500 transition-all duration-500"
                title={`Reserved: ${reserved}`}
              />
              <div
                style={{ width: `${getPct(available)}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Available: ${available}`}
              />
              <div
                style={{ width: `${getPct(cleaning)}%` }}
                className="bg-sky-500 transition-all duration-500"
                title={`Cleaning: ${cleaning}`}
              />
              <div
                style={{ width: `${getPct(unavailable)}%` }}
                className="bg-zinc-600 transition-all duration-500"
                title={`Unavailable: ${unavailable}`}
              />
            </div>

            {/* Accessible Status Labels and Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#B99A63]/5 border border-[#B99A63]/10">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[#A5A198]">Occupied:</span>
                <span className="font-semibold ml-auto">{occupied}</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#B99A63]/5 border border-[#B99A63]/10">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-[#A5A198]">Reserved:</span>
                <span className="font-semibold ml-auto">{reserved}</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#B99A63]/5 border border-[#B99A63]/10">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[#A5A198]">Available:</span>
                <span className="font-semibold ml-auto">{available}</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#B99A63]/5 border border-[#B99A63]/10">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <span className="text-[#A5A198]">Cleaning:</span>
                <span className="font-semibold ml-auto">{cleaning}</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#B99A63]/5 border border-[#B99A63]/10">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 shrink-0" />
                <span className="text-[#A5A198]">Held / Maint:</span>
                <span className="font-semibold ml-auto">{unavailable}</span>
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
              No tables configured yet.
            </p>
            <p className="text-[11px] text-[#737068] mt-1 max-w-sm">
              Dining room sections, table numbering schemas, and capacities will be established in Stage 7.
            </p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#B99A63]/10 mt-4 flex items-center justify-between text-[10px] font-mono text-[#737068]">
        <span>Capacity: {total > 0 ? `${total} Tables` : 'Not Configured'}</span>
        <span>Floor Plan: {occupancy.connected ? 'Active' : 'Stage 7 Scheduled'}</span>
      </div>
    </div>
  );
};
