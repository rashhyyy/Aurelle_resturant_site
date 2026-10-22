'use client';

import React from 'react';
import { Users, UserCheck, Mail, UserX } from 'lucide-react';
import { StaffSummaryCounts } from '../../types/staffManagement';

interface StaffSummaryCardsProps {
  summary: StaffSummaryCounts | null;
  loading: boolean;
  isDark: boolean;
}

export const StaffSummaryCards: React.FC<StaffSummaryCardsProps> = ({
  summary,
  loading,
  isDark,
}) => {
  const cards = [
    {
      title: 'Total Employees',
      count: summary?.total ?? 0,
      label: 'Registered on platform',
      icon: Users,
      color: 'text-[#B99A63]',
      bg: isDark ? 'bg-[#B99A63]/10' : 'bg-[#B99A63]/15',
      borderColor: isDark ? 'border-[#B99A63]/25' : 'border-[#B99A63]/30',
    },
    {
      title: 'Active Employees',
      count: summary?.active ?? 0,
      label: 'Authorized for duty',
      icon: UserCheck,
      color: 'text-emerald-500',
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/15',
      borderColor: isDark ? 'border-emerald-500/25' : 'border-emerald-500/30',
    },
    {
      title: 'Pending Invitations',
      count: summary?.invited ?? 0,
      label: 'Awaiting activation',
      icon: Mail,
      color: 'text-amber-400',
      bg: isDark ? 'bg-amber-400/10' : 'bg-amber-400/15',
      borderColor: isDark ? 'border-amber-400/25' : 'border-amber-400/30',
    },
    {
      title: 'Disabled Accounts',
      count: summary?.disabled ?? 0,
      label: 'Access revoked',
      icon: UserX,
      color: 'text-rose-400',
      bg: isDark ? 'bg-rose-400/10' : 'bg-rose-400/15',
      borderColor: isDark ? 'border-rose-400/25' : 'border-rose-400/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;

        return (
          <div
            key={idx}
            className={`border rounded-xl p-5 sm:p-6 transition-all duration-200 shadow-sm ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-xs uppercase tracking-wider font-mono font-medium ${
                  isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
                }`}
              >
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bg} ${card.color}`}>
                <IconComponent size={18} />
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-current opacity-10 rounded w-16" />
                <div className="h-4 bg-current opacity-5 rounded w-24" />
              </div>
            ) : (
              <div>
                <div
                  className={`text-3xl font-serif font-bold tracking-tight ${
                    isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                  }`}
                >
                  {card.count}
                </div>
                <p
                  className={`text-xs mt-1 font-sans ${
                    isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'
                  }`}
                >
                  {card.label}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
