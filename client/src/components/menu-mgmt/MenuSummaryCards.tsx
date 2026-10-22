'use client';

import React from 'react';
import { MenuSummaryCounts } from '../../types/menu';
import { Utensils, CheckCircle, FileText, AlertTriangle } from 'lucide-react';

interface MenuSummaryCardsProps {
  summary: MenuSummaryCounts | null;
  loading: boolean;
  isDark: boolean;
}

export const MenuSummaryCards: React.FC<MenuSummaryCardsProps> = ({
  summary,
  loading,
  isDark,
}) => {
  const cards = [
    {
      title: 'Total Dishes',
      count: summary?.total ?? 0,
      icon: Utensils,
      color: 'text-[#B99A63]',
      bg: 'bg-[#B99A63]/10',
      border: 'border-[#B99A63]/25',
      note: 'All active catalog dishes',
    },
    {
      title: 'Published Dishes',
      count: summary?.published ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/25',
      note: 'Live on guest menu',
    },
    {
      title: 'Draft Dishes',
      count: summary?.draft ?? 0,
      icon: FileText,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/25',
      note: 'Pending chef review & publish',
    },
    {
      title: 'Unavailable Dishes',
      count: summary?.unavailable ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/25',
      note: 'Temporarily out of stock',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
              isDark
                ? 'bg-[#1E1E1B] border-[#2C2C28] hover:border-[#3E3E38]'
                : 'bg-white border-[#E5DFD3] hover:border-[#D5CFC3]'
            } shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] font-medium ${
                  isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
                }`}
              >
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                <Icon size={16} />
              </div>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-16 rounded bg-current/10 animate-pulse my-1" />
              ) : (
                <div
                  className={`text-2xl sm:text-3xl font-serif font-bold tracking-tight ${
                    isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                  }`}
                >
                  {card.count}
                </div>
              )}
              <p
                className={`text-[11px] mt-1 font-light truncate ${
                  isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'
                }`}
              >
                {card.note}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
