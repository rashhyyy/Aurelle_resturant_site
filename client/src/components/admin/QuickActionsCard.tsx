'use client';

import React from 'react';
import Link from 'next/link';
import { useStaffTheme } from '../../context/StaffThemeContext';
import {
  ShoppingBag,
  Calendar,
  UtensilsCrossed,
  Users,
  TrendingUp,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const QuickActionsCard = () => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const actions = [
    {
      label: 'Manage Orders',
      description: 'Incoming & active floor orders',
      href: '/staff/admin/orders',
      icon: ShoppingBag,
    },
    {
      label: 'Manage Reservations',
      description: 'Bookings & table allocation rules',
      href: '/staff/admin/reservations',
      icon: Calendar,
    },
    {
      label: 'Manage Menu',
      description: 'Culinary items, pricing & allergens',
      href: '/staff/admin/menu',
      icon: UtensilsCrossed,
    },
    {
      label: 'Manage Staff',
      description: 'Accounts, RBAC roles & venue permissions',
      href: '/staff/admin/staff',
      icon: Users,
    },
    {
      label: 'View Reports',
      description: 'Shift analytics & financial turnover',
      href: '/staff/admin/reports',
      icon: TrendingUp,
    },
  ];

  return (
    <div
      className={`border rounded-2xl p-6 shadow-sm ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div className="flex items-center gap-2.5 pb-4 border-b border-[#B99A63]/15 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center">
          <Zap size={16} />
        </div>
        <div>
          <h3
            className={`text-base font-serif font-semibold tracking-wide ${
              isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
            }`}
          >
            Quick Actions
          </h3>
          <span className="text-[10px] font-mono text-[#737068] uppercase">
            Administrative Shortcuts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.href}
              href={act.href}
              className={`group p-3.5 rounded-xl border transition-all flex flex-col justify-between hover:border-[#B99A63]/50 focus:outline-hidden focus:ring-1 focus:ring-[#B99A63] ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] hover:bg-[#1E1E1B]'
                  : 'bg-[#F6F1E8] border-[#E5DFD3] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon size={15} />
                </div>
                <ArrowRight
                  size={13}
                  className="text-[#737068] group-hover:text-[#B99A63] group-hover:translate-x-0.5 transition-all"
                />
              </div>

              <div>
                <div className="text-xs font-semibold tracking-wide group-hover:text-[#B99A63] transition-colors">
                  {act.label}
                </div>
                <div className="text-[10px] text-[#737068] leading-tight mt-0.5 truncate">
                  {act.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
