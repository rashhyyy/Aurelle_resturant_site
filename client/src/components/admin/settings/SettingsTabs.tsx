'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import {
  Building2,
  Clock,
  Calendar,
  ShoppingBag,
  DollarSign,
  Sparkles,
  Bell,
  MapPin,
  Shield,
  History,
  LayoutGrid,
} from 'lucide-react';

export const SettingsTabs: React.FC = () => {
  const pathname = usePathname();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const TABS = [
    { label: 'Overview Hub', href: '/staff/admin/settings', icon: LayoutGrid },
    { label: 'General Info', href: '/staff/admin/settings/general', icon: Building2 },
    { label: 'Operating Hours', href: '/staff/admin/settings/hours', icon: Clock },
    { label: 'Reservation Policies', href: '/staff/admin/settings/reservations', icon: Calendar },
    { label: 'Order Policies', href: '/staff/admin/settings/orders', icon: ShoppingBag },
    { label: 'Financial Rates', href: '/staff/admin/settings/financial', icon: DollarSign },
    { label: 'VIP & Events', href: '/staff/admin/settings/vip-events', icon: Sparkles },
    { label: 'Notifications', href: '/staff/admin/settings/notifications', icon: Bell },
    { label: 'Locations', href: '/staff/admin/settings/locations', icon: MapPin },
    { label: 'Security & Session', href: '/staff/admin/settings/security', icon: Shield },
    { label: 'Audit Activity', href: '/staff/admin/settings/activity', icon: History },
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
