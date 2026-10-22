'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { apiClient } from '../../../../lib/api';
import { INotificationPreferences } from '../../../../types/notification';
import {
  Bell,
  Mail,
  Smartphone,
  Moon,
  Clock,
  Save,
  CheckCircle2,
  ArrowLeft,
  ShoppingBag,
  Calendar,
  ChefHat,
  Armchair,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const CATEGORY_DEFINITIONS = [
  {
    key: 'orders',
    title: 'Orders & Dispatch',
    desc: 'Customer orders placed, takeaway ready alerts, cancellations',
    icon: ShoppingBag,
  },
  {
    key: 'reservations',
    title: 'Guest Reservations',
    desc: 'New table reservations, cancellations, arrival confirmations',
    icon: Calendar,
  },
  {
    key: 'kitchen',
    title: 'Kitchen & KDS Pass',
    desc: 'Dishes ready for plating, order expediting, ticket recalls',
    icon: ChefHat,
  },
  {
    key: 'floor',
    title: 'Floor Operations & Service',
    desc: 'Guest table requests, cleaning calls, turnover notices',
    icon: Armchair,
  },
  {
    key: 'vip',
    title: 'VIP Rooms & Private Dining',
    desc: 'Suite reservations, inquiry proposal actions, private banquet updates',
    icon: Sparkles,
  },
  {
    key: 'management',
    title: 'Operations & Management Alerts',
    desc: 'Staff shortfall alerts, long wait times, operational overrides',
    icon: AlertTriangle,
  },
  {
    key: 'security',
    title: 'Account Security & Access',
    desc: 'Password changes, new login devices, critical administrative events',
    icon: ShieldCheck,
  },
];

export default function StaffNotificationPreferencesPage() {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [preferences, setPreferences] = useState<INotificationPreferences>({
    recipientType: 'STAFF' as any,
    recipientId: '',
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    categories: {
      orders: { inApp: true, email: true, sms: false },
      reservations: { inApp: true, email: true, sms: false },
      kitchen: { inApp: true, email: true, sms: false },
      reception: { inApp: true, email: true, sms: false },
      floor: { inApp: true, email: true, sms: false },
      vip: { inApp: true, email: true, sms: false },
      events: { inApp: true, email: true, sms: false },
      management: { inApp: true, email: true, sms: false },
      security: { inApp: true, email: true, sms: true },
      system: { inApp: true, email: true, sms: false },
    },
    doNotDisturb: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const res = await apiClient<{ success: boolean; data: INotificationPreferences }>(
          '/notifications/preferences'
        );
        if (res?.success && res.data) {
          setPreferences((prev) => ({
            ...prev,
            ...res.data,
            categories: {
              ...prev.categories,
              ...(res.data.categories || {}),
            },
            doNotDisturb: {
              ...prev.doNotDisturb,
              ...(res.data.doNotDisturb || {}),
            },
          }));
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.patch('/notifications/preferences', preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoryChannel = (
    categoryKey: string,
    channel: 'inApp' | 'email' | 'sms'
  ) => {
    setPreferences((prev) => {
      const currentCat = (prev.categories as any)[categoryKey] || {
        inApp: true,
        email: true,
        sms: false,
      };
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [categoryKey]: {
            ...currentCat,
            [channel]: !currentCat[channel],
          },
        },
      };
    });
  };

  return (
    <StaffLayout>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/staff/notifications"
          className={`p-2 rounded-xl border transition-colors ${
            isDark
              ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#A5A198] hover:text-[#B99A63]'
              : 'bg-white border-[#E5DFD3] text-[#6B685F] hover:text-[#B99A63]'
          }`}
          title="Back to notifications"
        >
          <ArrowLeft size={16} />
        </Link>
        <StaffPageHeader
          title="Notification Preferences"
          subtitle="Configure real-time alerts, email digests, and communication delivery channels."
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`h-32 rounded-2xl border animate-pulse ${
                isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
              }`}
            />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Master Channel Toggles */}
          <div
            className={`border rounded-2xl p-6 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <h3
              className={`text-base font-semibold mb-1 ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              Master Communication Channels
            </h3>
            <p className="text-xs text-[#737068] mb-6">
              Enable or disable entire notification channels across the Aurelle platform.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* In-App Alerts */}
              <div
                className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${
                  preferences.inAppEnabled
                    ? 'border-[#B99A63]/50 bg-[#B99A63]/5'
                    : isDark
                    ? 'border-[#2C2C28] bg-[#171715]'
                    : 'border-[#E5DFD3] bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#B99A63]/15 text-[#B99A63] flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">In-App Live Alerts</h4>
                    <p className="text-[11px] text-[#737068]">Real-time push & sound</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.inAppEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, inAppEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#B99A63] cursor-pointer"
                />
              </div>

              {/* Email Alerts */}
              <div
                className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${
                  preferences.emailEnabled
                    ? 'border-[#B99A63]/50 bg-[#B99A63]/5'
                    : isDark
                    ? 'border-[#2C2C28] bg-[#171715]'
                    : 'border-[#E5DFD3] bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Email Dispatch</h4>
                    <p className="text-[11px] text-[#737068]">Transactional receipts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, emailEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#B99A63] cursor-pointer"
                />
              </div>

              {/* SMS Alerts */}
              <div
                className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${
                  preferences.smsEnabled
                    ? 'border-[#B99A63]/50 bg-[#B99A63]/5'
                    : isDark
                    ? 'border-[#2C2C28] bg-[#171715]'
                    : 'border-[#E5DFD3] bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">SMS Dispatch</h4>
                    <p className="text-[11px] text-[#737068]">Urgent text alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.smsEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, smsEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#B99A63] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Granular Category Matrix */}
          <div
            className={`border rounded-2xl p-6 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <h3
              className={`text-base font-semibold mb-1 ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              Category Routing Matrix
            </h3>
            <p className="text-xs text-[#737068] mb-6">
              Configure per-category alerts by selecting your preferred channel delivery methods.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark ? 'border-[#2C2C28] text-[#737068]' : 'border-[#E5DFD3] text-[#737068]'
                    }`}
                  >
                    <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">
                      Operational Category
                    </th>
                    <th className="pb-3 text-center font-semibold uppercase tracking-wider text-[10px] w-24">
                      In-App
                    </th>
                    <th className="pb-3 text-center font-semibold uppercase tracking-wider text-[10px] w-24">
                      Email
                    </th>
                    <th className="pb-3 text-center font-semibold uppercase tracking-wider text-[10px] w-24">
                      SMS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2C28]/40">
                  {CATEGORY_DEFINITIONS.map((cat) => {
                    const Icon = cat.icon;
                    const catPref = (preferences.categories as any)?.[cat.key] || {
                      inApp: true,
                      email: true,
                      sms: false,
                    };
                    return (
                      <tr key={cat.key} className="hover:bg-[#B99A63]/5 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isDark
                                  ? 'bg-[#141412] border-[#2C2C28]'
                                  : 'bg-stone-50 border-[#E5DFD3]'
                              }`}
                            >
                              <Icon size={15} className="text-[#B99A63]" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs">{cat.title}</div>
                              <div className="text-[11px] text-[#737068]">{cat.desc}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={catPref.inApp}
                            onChange={() => toggleCategoryChannel(cat.key, 'inApp')}
                            className="w-4 h-4 accent-[#B99A63] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={catPref.email}
                            onChange={() => toggleCategoryChannel(cat.key, 'email')}
                            className="w-4 h-4 accent-[#B99A63] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={catPref.sms}
                            onChange={() => toggleCategoryChannel(cat.key, 'sms')}
                            className="w-4 h-4 accent-[#B99A63] cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Do Not Disturb Schedule */}
          <div
            className={`border rounded-2xl p-6 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                  <Moon size={18} />
                </div>
                <div>
                  <h3
                    className={`text-base font-semibold ${
                      isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                    }`}
                  >
                    Do Not Disturb (Off-Duty Hours)
                  </h3>
                  <p className="text-xs text-[#737068]">
                    Silence non-urgent audio cues and external broadcasts outside of scheduled shifts.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.doNotDisturb.enabled}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    doNotDisturb: {
                      ...preferences.doNotDisturb,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-[#B99A63] cursor-pointer mt-1"
              />
            </div>

            {preferences.doNotDisturb.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#2C2C28]/40">
                <div>
                  <label className="block text-[11px] font-medium text-[#737068] mb-1">
                    Quiet Hours Start Time
                  </label>
                  <div className="relative">
                    <Clock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737068]"
                    />
                    <input
                      type="time"
                      value={preferences.doNotDisturb.startTime || '22:00'}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          doNotDisturb: {
                            ...preferences.doNotDisturb,
                            startTime: e.target.value,
                          },
                        })
                      }
                      className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none font-mono ${
                        isDark
                          ? 'bg-[#141412] border-[#2C2C28] text-white'
                          : 'bg-white border-[#E5DFD3] text-black'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#737068] mb-1">
                    Quiet Hours Resume Time
                  </label>
                  <div className="relative">
                    <Clock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737068]"
                    />
                    <input
                      type="time"
                      value={preferences.doNotDisturb.endTime || '08:00'}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          doNotDisturb: {
                            ...preferences.doNotDisturb,
                            endTime: e.target.value,
                          },
                        })
                      }
                      className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none font-mono ${
                        isDark
                          ? 'bg-[#141412] border-[#2C2C28] text-white'
                          : 'bg-white border-[#E5DFD3] text-black'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div>
              {saveSuccess && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 rounded-xl">
                  <CheckCircle2 size={15} />
                  <span>Notification preferences successfully saved!</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#B99A63] text-[#171715] hover:bg-[#A38550] transition-colors disabled:opacity-50 shadow-md cursor-pointer ml-auto"
            >
              <Save size={15} />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      )}
    </StaffLayout>
  );
}
