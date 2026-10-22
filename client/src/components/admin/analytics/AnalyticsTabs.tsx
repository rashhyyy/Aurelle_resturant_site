'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  UtensilsCrossed,
  ChefHat,
  Calendar,
  Armchair,
  Sparkles,
  Users,
  UserCheck,
} from 'lucide-react';

export const AnalyticsTabs: React.FC = () => {
  const pathname = usePathname();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const TABS = [
    { label: 'Executive Overview', href: '/staff/admin/analytics', icon: TrendingUp },
    { label: 'Sales & Revenue', href: '/staff/admin/analytics/sales', icon: DollarSign },
    { label: 'Order Velocity', href: '/staff/admin/analytics/orders', icon: ShoppingBag },
    { label: 'Menu Performance', href: '/staff/admin/analytics/menu', icon: UtensilsCrossed },
    { label: 'Kitchen Display', href: '/staff/admin/analytics/kitchen', icon: ChefHat },
    { label: 'Reservations', href: '/staff/admin/analytics/reservations', icon: Calendar },
    { label: 'Table Utilization', href: '/staff/admin/analytics/tables', icon: Armchair },
    { label: 'VIP & Events', href: '/staff/admin/analytics/vip-events', icon: Sparkles },
    { label: 'Staff Operations', href: '/staff/admin/analytics/staff', icon: UserCheck },
    { label: 'Customer Retention', href: '/staff/admin/analytics/customers', icon: Users },
  ];

  return (
    <div className="overflow-x-auto scrollbar-thin border-b mb-6 pb-1"
      style={{ borderColor: isDark ? '#2C2C28' : '#E5DFD3' }}
    >
      <div className="flex items-center gap-1.5 min-w-max">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono tracking-wider transition-all border ${
                isActive
                  ? 'bg-[#B99A63]/15 text-[#B99A63] border-[#B99A63]/40 font-semibold shadow-xs'
                  : isDark
                  ? 'border-transparent text-[#A5A198] hover:text-[#F6F1E8] hover:bg-white/5'
                  : 'border-transparent text-[#6B685F] hover:text-[#171715] hover:bg-black/5'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#B99A63]' : ''} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
