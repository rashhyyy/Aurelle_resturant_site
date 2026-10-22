'use client';

import React from 'react';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { Inbox } from 'lucide-react';

interface StaffEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const StaffEmptyState = ({
  icon,
  title,
  description,
  action,
}: StaffEmptyStateProps) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`border rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center justify-center my-6 ${
        isDark
          ? 'bg-[#1E1E1B] border-[#2C2C28]'
          : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center mb-5">
        {icon || <Inbox size={26} />}
      </div>
      <h3
        className={`text-lg font-serif mb-2 tracking-wide ${
          isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-sm leading-relaxed mb-6 max-w-md ${
          isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
        }`}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
