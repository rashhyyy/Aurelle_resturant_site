'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IRestaurantSettingsSafeJSON, INotificationPolicySettings } from '../../../../../types/settings';
import { SettingsTabs } from '../../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { Bell, Save, RotateCcw, CheckCircle2, AlertCircle, RefreshCw, Mail, MessageSquare } from 'lucide-react';

export default function NotificationSettingsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<IRestaurantSettingsSafeJSON | null>(null);
  const [formData, setFormData] = useState<INotificationPolicySettings>({
    orderCreatedEmail: true,
    orderStatusSms: true,
    reservationConfirmedEmail: true,
    reservationReminderSms: true,
    staffInAppAlerts: true,
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        `/settings?locationId=${locationId}`
      );
      if (res && res.data) {
        setSettings(res.data);
        setFormData(res.data.notificationPolicy);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load notification settings.');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        '/settings',
        {
          method: 'PUT',
          data: {
            locationId,
            section: 'notificationPolicy',
            data: formData,
            version: settings.version,
          },
        }
      );

      if (res && res.data) {
        setSettings(res.data);
        setFormData(res.data.notificationPolicy);
        setSuccessMsg('Notification parameters updated successfully.');
      }
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.status === 409) {
        setErrorMsg('Concurrency conflict: Settings were modified by another administrator. Please reload.');
      } else {
        setErrorMsg(err?.message || 'Failed to save notification settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!settings || !confirm('Reset notification settings to system defaults?')) return;
    try {
      setSaving(true);
      const res = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        '/settings/reset',
        {
          method: 'POST',
          data: {
            locationId,
            section: 'notificationPolicy',
            version: settings.version,
          },
        }
      );
      if (res && res.data) {
        setSettings(res.data);
        setFormData(res.data.notificationPolicy);
        setSuccessMsg('Notification settings reset to defaults.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaffGuard allowedRoles={[StaffRole.ADMIN]}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5"
          style={{ borderColor: isDark ? '#2C2C28' : '#E5DFD3' }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#B99A63] mb-1">
              <span>Settings</span>
              <span>/</span>
              <span>Communication Channels</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Automated Notification Rules
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Transactional email receipts, SMS customer alerts, and real-time staff dispatch signals
            </p>
          </div>

          <button
            onClick={loadSettings}
            disabled={loading}
            className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#D0CBC0]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-[#B99A63]' : ''} />
          </button>
        </div>

        <SettingsTabs />

        {successMsg && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.includes('conflict') && (
              <button onClick={loadSettings} className="px-3 py-1 bg-red-500 text-white rounded text-xs font-mono">
                Reload Latest
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#B99A63] border-b border-zinc-700/30 pb-3">
              Customer Transactional Messaging
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-700/30 bg-black/10 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[#B99A63]" />
                  <div>
                    <span className="text-xs font-mono text-[#F6F1E8] block">Order Confirmation Email</span>
                    <span className="text-[11px] font-mono text-[#8E8A80]">Instant branded receipt dispatched upon checkout completion</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.orderCreatedEmail}
                  onChange={(e) => setFormData({ ...formData, orderCreatedEmail: e.target.checked })}
                  className="accent-[#B99A63] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-700/30 bg-black/10 cursor-pointer">
                <div className="flex items-center gap-3">
                  <MessageSquare size={16} className="text-[#B99A63]" />
                  <div>
                    <span className="text-xs font-mono text-[#F6F1E8] block">Order Ready SMS Notification</span>
                    <span className="text-[11px] font-mono text-[#8E8A80]">Alert sent when chef flags takeaway order as ready for pickup</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.orderStatusSms}
                  onChange={(e) => setFormData({ ...formData, orderStatusSms: e.target.checked })}
                  className="accent-[#B99A63] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-700/30 bg-black/10 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[#B99A63]" />
                  <div>
                    <span className="text-xs font-mono text-[#F6F1E8] block">Reservation Confirmation Email</span>
                    <span className="text-[11px] font-mono text-[#8E8A80]">Concierge confirmation with calendar invite attachment</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.reservationConfirmedEmail}
                  onChange={(e) => setFormData({ ...formData, reservationConfirmedEmail: e.target.checked })}
                  className="accent-[#B99A63] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-700/30 bg-black/10 cursor-pointer">
                <div className="flex items-center gap-3">
                  <MessageSquare size={16} className="text-[#B99A63]" />
                  <div>
                    <span className="text-xs font-mono text-[#F6F1E8] block">Reservation Reminder SMS</span>
                    <span className="text-[11px] font-mono text-[#8E8A80]">Automated reminder dispatched 2 hours prior to scheduled seating</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.reservationReminderSms}
                  onChange={(e) => setFormData({ ...formData, reservationReminderSms: e.target.checked })}
                  className="accent-[#B99A63] w-4 h-4"
                />
              </label>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#B99A63] border-b border-zinc-700/30 pb-3">
              Internal Staff Dispatch
            </h3>

            <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-700/30 bg-black/10 cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-[#B99A63]" />
                <div>
                  <span className="text-xs font-mono text-[#F6F1E8] block">In-App Staff Audio & Visual Alerts</span>
                  <span className="text-[11px] font-mono text-[#8E8A80]">Broadcast live chimes and toast notifications over Socket.IO</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.staffInAppAlerts}
                onChange={(e) => setFormData({ ...formData, staffInAppAlerts: e.target.checked })}
                className="accent-[#B99A63] w-4 h-4"
              />
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-700/20">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 text-xs font-mono text-[#A5A198] hover:text-red-400"
            >
              <RotateCcw size={14} />
              <span>Reset Section</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#B99A63] hover:bg-[#A88B54] text-black font-semibold text-xs font-mono tracking-wider transition-all disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Notification Rules'}</span>
            </button>
          </div>
        </form>
      </div>
    </StaffGuard>
  );
}
