'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IRestaurantSettingsSafeJSON, IRestaurantGeneralSettings } from '../../../../../types/settings';
import { SettingsTabs } from '../../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { Building2, Save, RotateCcw, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function GeneralSettingsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<IRestaurantSettingsSafeJSON | null>(null);
  const [formData, setFormData] = useState<IRestaurantGeneralSettings>({
    restaurantName: '',
    tagline: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: { street: '', city: '', postalCode: '', country: '' },
    currency: 'LKR',
    currencySymbol: 'Rs.',
    timezone: 'Asia/Colombo',
    websiteUrl: '',
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
        setFormData(res.data.general);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load general settings.');
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

      const res = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON; message: string }>(
        '/settings',
        {
          method: 'PUT',
          data: {
            locationId,
            section: 'general',
            data: formData,
            version: settings.version,
          },
        }
      );

      if (res && res.data) {
        setSettings(res.data);
        setFormData(res.data.general);
        setSuccessMsg('General information updated successfully.');
      }
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.status === 409) {
        setErrorMsg('Concurrency conflict: Settings were modified by another administrator. Please refresh and reapply.');
      } else {
        setErrorMsg(err?.message || 'Failed to save general settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!settings || !confirm('Reset general settings to default system values?')) return;

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        '/settings/reset',
        {
          method: 'POST',
          data: {
            locationId,
            section: 'general',
            version: settings.version,
          },
        }
      );

      if (res && res.data) {
        setSettings(res.data);
        setFormData(res.data.general);
        setSuccessMsg('General settings reset to defaults.');
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
              <span>Brand & Identity</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              General Restaurant Information
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Official venue branding, concierge contact details, and location metadata
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSettings}
              disabled={loading}
              className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                isDark ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#D0CBC0]' : 'bg-white border-[#E5DFD3]'
              }`}
              title="Refresh Settings"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#B99A63]' : ''} />
            </button>
          </div>
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
              <button
                onClick={loadSettings}
                className="px-3 py-1 bg-red-500 text-white rounded text-xs font-mono hover:bg-red-600 transition-colors"
              >
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
              Brand Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#A5A198] mb-1">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
              />
            </div>
          </div>

          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#B99A63] border-b border-zinc-700/30 pb-3">
              Concierge Contact & Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Concierge Telephone</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address?.street || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">City</label>
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 text-xs font-mono text-[#A5A198] hover:text-red-400 hover:border-red-400/40 transition-colors"
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
              <span>{saving ? 'Saving...' : 'Save General Info'}</span>
            </button>
          </div>
        </form>
      </div>
    </StaffGuard>
  );
}
