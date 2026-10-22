'use client';

import React from 'react';
import { StaffLayout } from './StaffLayout';
import { StaffPageHeader } from './StaffPageHeader';
import { StaffRole } from '../../types/staff';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { Construction, Sparkles, Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface StaffPlaceholderPageProps {
  title: string;
  subtitle: string;
  moduleName: string;
  stageName?: string;
  allowedRoles?: StaffRole[];
  returnRoute?: string;
}

export const StaffPlaceholderPage = ({
  title,
  subtitle,
  moduleName,
  stageName = 'Stage 4 / 5',
  allowedRoles,
  returnRoute,
}: StaffPlaceholderPageProps) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  return (
    <StaffLayout allowedRoles={allowedRoles}>
      <StaffPageHeader
        title={title}
        subtitle={subtitle}
        badge="Coming Soon"
      />

      <div
        className={`border rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-sm ${
          isDark
            ? 'bg-[#1E1E1B] border-[#2C2C28]'
            : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center mx-auto mb-6">
          <Construction size={30} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-[#B99A63]/10 text-[#B99A63] border border-[#B99A63]/25 mb-4">
          <Sparkles size={13} />
          {moduleName}
        </div>

        <h3
          className={`text-xl font-serif mb-3 tracking-wide ${
            isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
          }`}
        >
          Scheduled for Later Stage Implementation
        </h3>

        <p
          className={`text-sm leading-relaxed mb-8 max-w-lg mx-auto ${
            isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
          }`}
        >
          The navigation structure and route authorization for this module are established.
          Interactive operations, real-time data synchronization, and operational workflows
          will be introduced in subsequent stages.
        </p>

        <div
          className={`p-4 rounded-xl text-xs font-mono text-left max-w-md mx-auto mb-8 border ${
            isDark
              ? 'bg-[#171715] border-[#262623] text-[#737068]'
              : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#6B685F]'
          }`}
        >
          <div className="flex items-center gap-2 text-[#B99A63] font-medium mb-1">
            <Layers size={14} />
            <span>Architecture Status:</span>
          </div>
          <div>• Role-Based Access Control: Active & Enforced</div>
          <div>• Backend Route Protection: Configured</div>
          <div>• Real-time Socket.IO Handshake: Ready</div>
        </div>

        {returnRoute && (
          <Link
            href={returnRoute}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider bg-[#B99A63] text-[#171715] hover:bg-[#cbb07e] transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        )}
      </div>
    </StaffLayout>
  );
};
