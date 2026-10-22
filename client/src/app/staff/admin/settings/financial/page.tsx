'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IRestaurantSettingsSafeJSON, IFinancialPolicySettings } from '../../../../../types/settings';
import { SettingsTabs } from '../../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { DollarSign, Save, RotateCcw, CheckCircle2, AlertCircle, RefreshCw, Calculator } from 'lucide-react';

export default function FinancialSettingsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<IRestaurantSettingsSafeJSON | null>(null);
  const [formData, setFormData] = useState<IFinancialPolicySettings>({
    serviceChargeRate: 0.10,
    taxRate: 0.025,
    currency: 'LKR',
    roundingRule: 'NEAREST',
    minimumOrderValueMinor: 0,
    tippingEnabled: true,
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
        setFormData(res.data.financialPolicy);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load financial settings.');
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
            section: 'financialPolicy',
            data: formData,
            version: settings.version,
          },
        }
      );

      if (res && res.data) {
        setSettings(res.data);
        setFormData(res.data.financialPolicy);
        setSuccessMsg('Financial and fiscal policies updated successfully.');
      }
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.status === 409) {
        setErrorMsg('Concurrency conflict: Settings were modified by another administrator. Please reload.');
      } else {
        setErrorMsg(err?.message || 'Failed to save financial settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!settings || !confirm('Reset financial settings to standard default rates (10% service, 2.5% tax)?')) return;
    try {
      setSaving(true);
      const res = await apiClient<{ success: boolean; data: IRestaurantSettingsSafeJSON }>(
        '/settings/reset',
        {
          method: 'POST',
          data: {
            locationId,
            section: 'financialPolicy',
            version: settings.version,
          },
        }
      );
      if (res && res.data) {
        setSettings(res.data);
        setFormData(res.data.financialPolicy);
        setSuccessMsg('Financial settings reset to system defaults.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset financial settings.');
    } finally {
      setSaving(false);
    }
  };

  // Live calculator calculation based on sample Rs. 10,000 order
  const sampleSubtotal = 10000;
  const sampleServiceCharge = sampleSubtotal * formData.serviceChargeRate;
  const sampleTax = sampleSubtotal * formData.taxRate;
  const sampleTotal = sampleSubtotal + sampleServiceCharge + sampleTax;

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
              <span>Fiscal Parameters</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Financial Rates, Tax & Currency
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Configure authoritative tax rates, service surcharges, and order calculation rules
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
              Tax & Surcharge Rates
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">
                  Service Charge Rate (%) [Stored as decimal e.g. 0.10 for 10%]
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={0.5}
                    step={0.005}
                    value={formData.serviceChargeRate}
                    onChange={(e) => setFormData({ ...formData, serviceChargeRate: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                  />
                  <span className="text-xs font-mono text-[#B99A63] font-bold w-16">
                    {(formData.serviceChargeRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">
                  Government Tax Rate (%) [Stored as decimal e.g. 0.025 for 2.5%]
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={0.3}
                    step={0.001}
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                  />
                  <span className="text-xs font-mono text-[#B99A63] font-bold w-16">
                    {(formData.taxRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Currency Code</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A5A198] mb-1">Rounding Rule</label>
                <select
                  value={formData.roundingRule}
                  onChange={(e) => setFormData({ ...formData, roundingRule: e.target.value as any })}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
                >
                  <option value="NEAREST" className="bg-[#1E1E1B]">NEAREST (Standard)</option>
                  <option value="UP" className="bg-[#1E1E1B]">CEIL (Round Up)</option>
                  <option value="DOWN" className="bg-[#1E1E1B]">FLOOR (Round Down)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Bill Calculation Simulator */}
          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <div className="flex items-center gap-2 border-b border-zinc-700/30 pb-3">
              <Calculator size={16} className="text-[#B99A63]" />
              <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8]">
                Real-Time Checkout Calculation Simulator
              </h3>
            </div>
            <p className="text-xs font-mono text-[#8E8A80]">
              Demonstrating how a standard Rs. 10,000 dining order is authoritative computed:
            </p>

            <div className="p-4 rounded-xl border border-zinc-700/20 bg-black/20 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-[#A5A198]">Dishes Subtotal:</span>
                <span className="text-[#F6F1E8]">Rs. {sampleSubtotal.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A5A198]">Service Charge ({(formData.serviceChargeRate * 100).toFixed(1)}%):</span>
                <span className="text-[#D0CBC0]">Rs. {sampleServiceCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A5A198]">Government Tax ({(formData.taxRate * 100).toFixed(1)}%):</span>
                <span className="text-[#D0CBC0]">Rs. {sampleTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-700/40 pt-2 font-bold">
                <span className="text-[#B99A63]">Authoritative Bill Total:</span>
                <span className="text-[#B99A63] text-sm">Rs. {sampleTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
              <span>{saving ? 'Saving...' : 'Save Financial Rates'}</span>
            </button>
          </div>
        </form>
      </div>
    </StaffGuard>
  );
}
