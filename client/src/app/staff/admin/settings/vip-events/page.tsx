'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IRestaurantSettingsSafeJSON, IVipPolicySettings, IEventPolicySettings } from '../../../../../types/settings';
import { SettingsTabs } from '../../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { Sparkles, GlassWater, Save, RotateCcw, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function VipEventSettingsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<IRestaurantSettingsSafeJSON | null>(null);

  const [vipPolicy, setVipPolicy] = useState<IVipPolicySettings>({
    advanceNoticeDays: 2,
    minSpendRequirementMinor: 5000000,
    cancellationNoticeHours: 24,
    depositPercentage: 50,
  });

  const [eventPolicy, setEventPolicy] = useState<IEventPolicySettings>({
    proposalExpiryDays: 7,
    contractConfirmationLeadDays: 14,
    maxGuestCapacity: 150,
    depositPercentage: 50,
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
        setVipPolicy(res.data.vipPolicy);
        setEventPolicy(res.data.eventPolicy);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load VIP policies.');
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

      // Save VIP policy
      const resVip = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        '/settings',
        {
          method: 'PUT',
          data: {
            locationId,
            section: 'vipPolicy',
            data: vipPolicy,
            version: settings.version,
          },
        }
      );

      // Save Event policy with incremented version
      const resEvent = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        '/settings',
        {
          method: 'PUT',
          data: {
            locationId,
            section: 'eventPolicy',
            data: eventPolicy,
            version: resVip.data.version,
          },
        }
      );

      setSettings(resEvent.data);
      setSuccessMsg('VIP and Event policies updated successfully.');
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.status === 409) {
        setErrorMsg('Concurrency conflict: Settings were modified by another administrator. Please reload.');
      } else {
        setErrorMsg(err?.message || 'Failed to save policies.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!settings || !confirm('Reset VIP & Event policies to system defaults?')) return;
    try {
      setSaving(true);
      const resVip = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        '/settings/reset',
        {
          method: 'POST',
          data: { locationId, section: 'vipPolicy', version: settings.version },
        }
      );
      await apiClient('/settings/reset', {
        method: 'POST',
        data: { locationId, section: 'eventPolicy', version: resVip.data.version },
      });
      await loadSettings();
      setSuccessMsg('VIP and Event policies reset to system defaults.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset policies.');
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
              <span>VIP & Banquets</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              VIP Suites & Event Policies
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Bespoke salon rules, minimum spend thresholds, proposal lead times, and capacity caps
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
          {/* VIP Suites */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#B99A63] border-b border-zinc-700/30 pb-3">
              VIP Private Dining Salons
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Advance Notice Required (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={vipPolicy.advanceNoticeDays}
                  onChange={(e) => setVipPolicy({ ...vipPolicy, advanceNoticeDays: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Min Spend Requirement (Rs.)</label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={vipPolicy.minSpendRequirementMinor / 100}
                  onChange={(e) => setVipPolicy({ ...vipPolicy, minSpendRequirementMinor: Number(e.target.value) * 100 })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Cancellation Notice (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={vipPolicy.cancellationNoticeHours}
                  onChange={(e) => setVipPolicy({ ...vipPolicy, cancellationNoticeHours: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Deposit Percentage Required (%)</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={vipPolicy.depositPercentage}
                  onChange={(e) => setVipPolicy({ ...vipPolicy, depositPercentage: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Events */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#B99A63] border-b border-zinc-700/30 pb-3">
              Private Banquets & Gala Events
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Proposal Validity Window (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={eventPolicy.proposalExpiryDays}
                  onChange={(e) => setEventPolicy({ ...eventPolicy, proposalExpiryDays: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Contract Lead Time (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={eventPolicy.contractConfirmationLeadDays}
                  onChange={(e) => setEventPolicy({ ...eventPolicy, contractConfirmationLeadDays: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Maximum Event Capacity (Guests)</label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={eventPolicy.maxGuestCapacity}
                  onChange={(e) => setEventPolicy({ ...eventPolicy, maxGuestCapacity: Number(e.target.value) })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Event Deposit (%)</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={eventPolicy.depositPercentage}
                  onChange={(e) => setEventPolicy({ ...eventPolicy, depositPercentage: Number(e.target.value) })}
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
              <span>{saving ? 'Saving...' : 'Save VIP & Event Rules'}</span>
            </button>
          </div>
        </form>
      </div>
    </StaffGuard>
  );
}
