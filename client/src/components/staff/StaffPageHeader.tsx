'use client';

import React from 'react';
import { useStaffTheme } from '../../context/StaffThemeContext';

interface StaffPageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export const StaffPageHeader = ({
  title,
  subtitle,
  badge,
  actions,
}: StaffPageHeaderProps) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h2
            className={`text-2xl sm:text-3xl font-serif tracking-wide ${
              isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
            }`}
          >
            {title}
          </h2>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p
            className={`mt-1 text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3 self-start sm:self-auto">{actions}</div>}
    </div>
  );
};
