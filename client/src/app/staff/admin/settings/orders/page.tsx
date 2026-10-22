'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IRestaurantSettingsSafeJSON, IOrderPolicySettings } from '../../../../../types/settings';
import { SettingsTabs } from '../../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { ShoppingBag, Save, RotateCcw, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function OrderPolicySettingsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<IRestaurantSettingsSafeJSON | null>(null);
  const [formData, setFormData] = useState<IOrderPolicySettings>({
    onlineOrderingEnabled: true,
    takeawayEnabled: true,
    preorderEnabled: true,
    minLeadMinutes: 30,
    maxAdvanceDays: 7,
    orderCutoffMinutesBeforeClose: 45,
    maxItemsPerOrder: 20,
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
        setFormData(res.data.orderPolicy);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load order policies.');
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
            section: 'orderPolicy',
            data: formData,
            version: settings.version,
          },
        }
      );

      if (res && res.data) {
        setSettings(res.data);
        setFormData(res.data.orderPolicy);
        setSuccessMsg('Ordering policies updated successfully.');
      }
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.status === 409) {
        setErrorMsg('Concurrency conflict: Settings were modified by another administrator. Please reload.');
      } else {
        setErrorMsg(err?.message || 'Failed to save order policies.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!settings || !confirm('Reset ordering policy to system defaults?')) return;
    try {
      setSaving(true);
      const res = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        '/settings/reset',
        {
          method: 'POST',
          data: {
            locationId,
            section: 'orderPolicy',
            version: settings.version,
          },
        }
      );
      if (res && res.data) {
        setSettings(res.data);
        setFormData(res.data.orderPolicy);
        setSuccessMsg('Order policy reset to defaults.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset order policies.');
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
              <span>Fulfillment Rules</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Online Ordering & Pickup Policies
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Lead times, e-commerce switches, and closing cutoff windows for {selectedLocation === 'loc-kandy-vip' ? 'Aurelle Kandy' : 'Aurelle Colombo'}
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
              Channel Availability Switches
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-700/30 bg-black/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.onlineOrderingEnabled}
                  onChange={(e) => setFormData({ ...formData, onlineOrderingEnabled: e.target.checked })}
                  className="accent-[#B99A63] w-4 h-4"
                />
                <span className="text-xs font-mono text-[#F6F1E8]">Online Ordering Master Switch</span>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-700/30 bg-black/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.takeawayEnabled}
                  onChange={(e) => setFormData({ ...formData, takeawayEnabled: e.target.checked })}
                  className="accent-[#B99A63] w-4 h-4"
                />
                <span className="text-xs font-mono text-[#F6F1E8]">Takeaway / Pickup Allowed</span>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-zinc-700/30 bg-black/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preorderEnabled}
                  onChange={(e) => setFormData({ ...formData, preorderEnabled: e.target.checked })}
                  className="accent-[#B99A63] w-4 h-4"
                />
                <span className="text-xs font-mono text-[#F6F1E8]">Advance Pre-Orders Allowed</span>
              </label>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#B99A63] border-b border-zinc-700/30 pb-3">
              Preparation Timing & Limits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Minimum Lead Time (Minutes)</label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  step={5}
                  value={formData.minLeadMinutes}
                  onChange={(e) => setFormData({ ...formData, minLeadMinutes: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Max Advance Booking (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.maxAdvanceDays}
                  onChange={(e) => setFormData({ ...formData, maxAdvanceDays: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Kitchen Cutoff Before Close (Minutes)</label>
                <input
                  type="number"
                  min={15}
                  max={120}
                  step={5}
                  value={formData.orderCutoffMinutesBeforeClose}
                  onChange={(e) => setFormData({ ...formData, orderCutoffMinutesBeforeClose: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Maximum Dishes Per Order</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.maxItemsPerOrder}
                  onChange={(e) => setFormData({ ...formData, maxItemsPerOrder: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>
            </div>
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
              <span>{saving ? 'Saving...' : 'Save Order Policies'}</span>
            </button>
          </div>
        </form>
      </div>
    </StaffGuard>
  );
}
