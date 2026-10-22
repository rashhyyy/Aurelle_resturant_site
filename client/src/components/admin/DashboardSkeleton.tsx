'use client';

import React from 'react';
import { useStaffTheme } from '../../context/StaffThemeContext';

export const DashboardSkeleton = () => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const cardBg = isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]';
  const pulseBg = isDark ? 'bg-zinc-800/60' : 'bg-zinc-200/70';

  return (
    <div className="space-y-8 animate-pulse select-none" aria-busy="true" aria-label="Loading dashboard metrics">
      {/* Header Skeleton */}
      <div className={`border rounded-2xl p-8 ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className={`w-32 h-5 rounded-full ${pulseBg}`} />
            <div className={`w-72 h-8 rounded-lg ${pulseBg}`} />
            <div className={`w-96 max-w-full h-4 rounded-md ${pulseBg}`} />
            <div className="flex gap-3 pt-2">
              <div className={`w-40 h-7 rounded-lg ${pulseBg}`} />
              <div className={`w-32 h-7 rounded-lg ${pulseBg}`} />
            </div>
          </div>
          <div className={`w-36 h-9 rounded-lg ${pulseBg}`} />
        </div>
      </div>

      {/* Six Overview Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`border rounded-2xl p-6 ${cardBg} space-y-4`}>
            <div className="flex items-center justify-between">
              <div className={`w-28 h-4 rounded ${pulseBg}`} />
              <div className={`w-9 h-9 rounded-xl ${pulseBg}`} />
            </div>
            <div className={`w-24 h-8 rounded-lg ${pulseBg}`} />
            <div className={`w-full h-3 rounded ${pulseBg}`} />
          </div>
        ))}
      </div>

      {/* Two Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`border rounded-2xl p-6 h-72 ${cardBg} space-y-4`}>
          <div className={`w-36 h-5 rounded ${pulseBg}`} />
          <div className={`w-full h-12 rounded-lg ${pulseBg}`} />
          <div className={`w-full h-12 rounded-lg ${pulseBg}`} />
        </div>
        <div className={`border rounded-2xl p-6 h-72 ${cardBg} space-y-4`}>
          <div className={`w-36 h-5 rounded ${pulseBg}`} />
          <div className={`w-full h-12 rounded-lg ${pulseBg}`} />
          <div className={`w-full h-12 rounded-lg ${pulseBg}`} />
        </div>
      </div>
    </div>
  );
};
