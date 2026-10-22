'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  Smartphone,
  Save,
  CheckCircle2,
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { apiClient } from '../../../lib/api';
import { INotificationPreferences } from '../../../types/notification';

export default function CustomerNotificationPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [preferences, setPreferences] = useState<INotificationPreferences>({
    recipientType: 'CUSTOMER' as any,
    recipientId: '',
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    categories: {
      orders: { inApp: true, email: true, sms: false },
      reservations: { inApp: true, email: true, sms: false },
      kitchen: { inApp: true, email: false, sms: false },
      reception: { inApp: true, email: false, sms: false },
      floor: { inApp: true, email: false, sms: false },
      vip: { inApp: true, email: true, sms: false },
      events: { inApp: true, email: true, sms: false },
      management: { inApp: false, email: false, sms: false },
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
          }));
        }
      } catch (err) {
        console.error('Failed to load customer preferences:', err);
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

  const toggleCategory = (catKey: string, channel: 'inApp' | 'email' | 'sms') => {
    setPreferences((prev) => {
      const current = (prev.categories as any)[catKey] || { inApp: true, email: true, sms: false };
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [catKey]: {
            ...current,
            [channel]: !current[channel],
          },
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#0C0D0E] text-[#ECE7DF] flex flex-col justify-between selection:bg-[#B99A63]/30">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="flex items-center gap-3 pb-6 border-b border-stone-800/80 mb-8">
          <Link
            href="/account/notifications"
            className="p-2 rounded-lg border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700 transition-colors"
            title="Return to Notifications"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="text-[11px] font-mono tracking-[0.25em] text-[#C1A87D] uppercase">
              Guest Communication Settings
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide mt-0.5">
              Notification Preferences
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-stone-800/80 bg-[#141518] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            {/* Master Channels */}
            <div className="p-6 rounded-2xl border border-stone-800 bg-[#141518]/90">
              <h2 className="text-lg font-serif text-white mb-1">Communication Channels</h2>
              <p className="text-xs text-stone-400 mb-6">
                Choose how Aurelle Concierge and culinary staff contact you.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    preferences.inAppEnabled
                      ? 'border-[#C1A87D]/50 bg-[#C1A87D]/5'
                      : 'border-stone-800 bg-[#101114]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#C1A87D]/15 text-[#C1A87D] flex items-center justify-center">
                      <Bell size={17} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">In-App Live</div>
                      <div className="text-[11px] text-stone-400">Web alerts</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.inAppEnabled}
                    onChange={(e) =>
                      setPreferences({ ...preferences, inAppEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#C1A87D] cursor-pointer"
                  />
                </div>

                <div
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    preferences.emailEnabled
                      ? 'border-[#C1A87D]/50 bg-[#C1A87D]/5'
                      : 'border-stone-800 bg-[#101114]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                      <Mail size={17} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Email Dispatch</div>
                      <div className="text-[11px] text-stone-400">Confirmation receipts</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailEnabled}
                    onChange={(e) =>
                      setPreferences({ ...preferences, emailEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#C1A87D] cursor-pointer"
                  />
                </div>

                <div
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    preferences.smsEnabled
                      ? 'border-[#C1A87D]/50 bg-[#C1A87D]/5'
                      : 'border-stone-800 bg-[#101114]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                      <Smartphone size={17} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">SMS Updates</div>
                      <div className="text-[11px] text-stone-400">Real-time mobile texts</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.smsEnabled}
                    onChange={(e) =>
                      setPreferences({ ...preferences, smsEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#C1A87D] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="p-6 rounded-2xl border border-stone-800 bg-[#141518]/90">
              <h2 className="text-lg font-serif text-white mb-1">Alert Categories</h2>
              <p className="text-xs text-stone-400 mb-6">
                Specify your channels for specific reservation and culinary updates.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-mono tracking-wider">
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-center w-24">In-App</th>
                      <th className="pb-3 text-center w-24">Email</th>
                      <th className="pb-3 text-center w-24">SMS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {[
                      {
                        key: 'reservations',
                        title: 'Table Reservations & Check-In',
                        desc: 'Booking confirmations, reminders, and table seating ready alerts',
                        icon: Calendar,
                      },
                      {
                        key: 'orders',
                        title: 'Culinary Orders & Takeaway',
                        desc: 'Order placed, food ready for pickup, status changes',
                        icon: ShoppingBag,
                      },
                      {
                        key: 'vip',
                        title: 'VIP Suites & Private Banquets',
                        desc: 'Private salon bookings, custom menus, event inquiries',
                        icon: Sparkles,
                      },
                      {
                        key: 'security',
                        title: 'Account Security & Sign-In',
                        desc: 'Password changes, profile alterations, authenticated sessions',
                        icon: ShieldCheck,
                      },
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const pref = (preferences.categories as any)?.[cat.key] || {
                        inApp: true,
                        email: true,
                        sms: false,
                      };
                      return (
                        <tr key={cat.key} className="hover:bg-stone-800/20 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                                <Icon size={15} className="text-[#C1A87D]" />
                              </div>
                              <div>
                                <div className="font-medium text-white text-xs">{cat.title}</div>
                                <div className="text-[11px] text-stone-400">{cat.desc}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <input
                              type="checkbox"
                              checked={pref.inApp}
                              onChange={() => toggleCategory(cat.key, 'inApp')}
                              className="w-4 h-4 accent-[#C1A87D] cursor-pointer"
                            />
                          </td>
                          <td className="py-4 text-center">
                            <input
                              type="checkbox"
                              checked={pref.email}
                              onChange={() => toggleCategory(cat.key, 'email')}
                              className="w-4 h-4 accent-[#C1A87D] cursor-pointer"
                            />
                          </td>
                          <td className="py-4 text-center">
                            <input
                              type="checkbox"
                              checked={pref.sms}
                              onChange={() => toggleCategory(cat.key, 'sms')}
                              className="w-4 h-4 accent-[#C1A87D] cursor-pointer"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl">
                    <CheckCircle2 size={15} />
                    <span>Your notification preferences have been saved.</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#C1A87D] text-black hover:bg-[#A99066] transition-colors disabled:opacity-50 cursor-pointer shadow-md ml-auto"
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
