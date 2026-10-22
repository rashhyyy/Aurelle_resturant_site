'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { apiClient } from '../../../../lib/api';
import { IRestaurantSettingsSafeJSON } from '../../../../types/settings';
import { SettingsTabs } from '../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../types/staff';
import {
  Settings,
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
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function AdminSettingsOverviewPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<IRestaurantSettingsSafeJSON | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        `/settings?locationId=${locationId}`
      );
      if (res && res.data) {
        setSettings(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError(err?.message || 'Failed to fetch restaurant settings.');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const SECTIONS = [
    {
      title: 'General Restaurant Info',
      href: '/staff/admin/settings/general',
      icon: Building2,
      summary: settings?.general ? `${settings.general.restaurantName} • ${settings.general.contactPhone}` : 'Loading...',
      tag: 'Brand & Concierge',
    },
    {
      title: 'Operating Hours & Service',
      href: '/staff/admin/settings/hours',
      icon: Clock,
      summary: `${(settings?.operatingHours || []).filter((h) => h.isOpen).length} days open / week • Kitchen cutoff active`,
      tag: 'Hours of Operation',
    },
    {
      title: 'Reservation Policies',
      href: '/staff/admin/settings/reservations',
      icon: Calendar,
      summary: `Max ${settings?.reservationPolicy.maxPartySize ?? 16} guests • ${settings?.reservationPolicy.defaultDurationMinutes ?? 120}m duration • ${settings?.reservationPolicy.minNoticeHours ?? 2}h notice`,
      tag: 'Booking Rules',
    },
    {
      title: 'Ordering Policies',
      href: '/staff/admin/settings/orders',
      icon: ShoppingBag,
      summary: `Online ordering ${settings?.orderPolicy.onlineOrderingEnabled ? 'Enabled' : 'Disabled'} • ${settings?.orderPolicy.minLeadMinutes ?? 30}m min lead time`,
      tag: 'E-Commerce Rules',
    },
    {
      title: 'Financial Rates & Currency',
      href: '/staff/admin/settings/financial',
      icon: DollarSign,
      summary: `Govt Tax: ${((settings?.financialPolicy.taxRate ?? 0.025) * 100).toFixed(1)}% • Service: ${((settings?.financialPolicy.serviceChargeRate ?? 0.1) * 100).toFixed(0)}% • ${settings?.financialPolicy.currency || 'LKR'}`,
      tag: 'Fiscal Governance',
    },
    {
      title: 'VIP Suites & Events Policy',
      href: '/staff/admin/settings/vip-events',
      icon: Sparkles,
      summary: `VIP Notice: ${settings?.vipPolicy.advanceNoticeDays ?? 2} days • Banquet Capacity: ${settings?.eventPolicy.maxGuestCapacity ?? 150} guests`,
      tag: 'Private Dining',
    },
    {
      title: 'Notification Configuration',
      href: '/staff/admin/settings/notifications',
      icon: Bell,
      summary: 'Order receipts, SMS alerts, and staff in-app dispatch toggles',
      tag: 'Alert Channels',
    },
    {
      title: 'Multi-Location Fleet',
      href: '/staff/admin/settings/locations',
      icon: MapPin,
      summary: 'Flagship Colombo & Kandy Sanctuary configuration and status',
      tag: 'Locations',
    },
    {
      title: 'Security & Session Parameters',
      href: '/staff/admin/settings/security',
      icon: Shield,
      summary: 'Express secure sessions, CORS whitelist, and Argon2id controls',
      tag: 'Security & RBAC',
    },
    {
      title: 'System Audit Activity History',
      href: '/staff/admin/settings/activity',
      icon: History,
      summary: 'Enterprise audit log tracking administrative modifications',
      tag: 'Audit Trail',
    },
  ];

  return (
    <StaffGuard allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5"
          style={{ borderColor: isDark ? '#2C2C28' : '#E5DFD3' }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#B99A63] mb-1">
              <span>Platform Governance</span>
              <span>/</span>
              <span>System Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Platform & Restaurant Settings
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Centralized operational parameters, fiscal rates, and compliance rules for {selectedLocation === 'loc-kandy-vip' ? 'Aurelle Kandy' : 'Aurelle Colombo'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {settings && (
              <div className="px-3.5 py-1.5 rounded-xl border border-[#B99A63]/30 bg-[#B99A63]/10 text-xs font-mono text-[#B99A63] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Config Version v{settings.version}</span>
              </div>
            )}
            <button
              onClick={fetchSettings}
              disabled={loading}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono tracking-wider border transition-all ${
                isDark
                  ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#D0CBC0] hover:border-[#B99A63]/50'
                  : 'bg-white border-[#E5DFD3] text-[#4F4B41] hover:border-[#B99A63]'
              }`}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-[#B99A63]' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <SettingsTabs />

        {error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Configuration Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.href}
                href={sec.href}
                className={`p-6 rounded-2xl border transition-all hover:border-[#B99A63]/50 group flex flex-col justify-between ${
                  isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#B99A63] font-semibold bg-[#B99A63]/10 px-2.5 py-1 rounded-md">
                      {sec.tag}
                    </span>
                  </div>

                  <h3 className={`text-base font-serif font-semibold group-hover:text-[#B99A63] transition-colors ${
                    isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                  }`}>
                    {sec.title}
                  </h3>
                  <p className="text-xs font-mono text-[#8E8A80] mt-1 line-clamp-2">
                    {sec.summary}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-700/20 flex items-center justify-between text-xs font-mono text-[#A5A198] group-hover:text-[#B99A63]">
                  <span>Configure parameters</span>
                  <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </StaffGuard>
  );
}
