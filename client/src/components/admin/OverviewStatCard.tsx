'use client';

import React from 'react';
import { useStaffTheme } from '../../context/StaffThemeContext';

interface OverviewStatCardProps {
  title: string;
  value: string | number | null;
  available: boolean;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  subtext?: string;
}

export const OverviewStatCard = ({
  title,
  value,
  available,
  description,
  icon,
  badge,
  subtext,
}: OverviewStatCardProps) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`border rounded-2xl p-5 sm:p-6 transition-all hover:border-[#B99A63]/30 shadow-xs flex flex-col justify-between ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-xs uppercase font-mono tracking-wider font-medium truncate ${
              isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
            }`}
          >
            {title}
          </span>
          <div className="w-9 h-9 rounded-xl bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center shrink-0">
            {icon}
          </div>
        </div>

        <div className="my-2">
          {available && value !== null ? (
            <div
              className={`text-2xl sm:text-3xl font-serif font-semibold tracking-tight ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          ) : (
            <div className="text-sm font-mono text-[#737068] flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              <span>Not available</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-dashed border-[#B99A63]/15 mt-3">
        <p
          className={`text-[11px] leading-relaxed truncate ${
            isDark ? 'text-[#737068]' : 'text-[#8E8A80]'
          }`}
          title={description}
        >
          {description}
        </p>
        {subtext && (
          <span className="text-[10px] font-mono text-[#B99A63] mt-0.5 block truncate">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
