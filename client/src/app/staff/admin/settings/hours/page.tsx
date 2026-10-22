'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { IRestaurantSettingsSafeJSON, IDayHours, IHolidayClosure } from '../../../../../types/settings';
import { SettingsTabs } from '../../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { Clock, Save, RotateCcw, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function OperatingHoursSettingsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<IRestaurantSettingsSafeJSON | null>(null);
  const [operatingHours, setOperatingHours] = useState<IDayHours[]>([]);
  const [kitchenHours, setKitchenHours] = useState<IDayHours[]>([]);
  const [holidayClosures, setHolidayClosures] = useState<IHolidayClosure[]>([]);

  const [newClosureDate, setNewClosureDate] = useState('');
  const [newClosureReason, setNewClosureReason] = useState('');

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
        setOperatingHours(res.data.operatingHours);
        setKitchenHours(res.data.kitchenHours);
        setHolidayClosures(res.data.holidayClosures || []);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load hours settings.');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUpdateDay = (
    list: IDayHours[],
    setList: React.Dispatch<React.SetStateAction<IDayHours[]>>,
    index: number,
    field: keyof IDayHours,
    value: any
  ) => {
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: value };
    setList(updated);
  };

  const handleAddClosure = () => {
    if (!newClosureDate || !newClosureReason) return;
    setHolidayClosures([...holidayClosures, { date: newClosureDate, reason: newClosureReason }]);
    setNewClosureDate('');
    setNewClosureReason('');
  };

  const handleRemoveClosure = (index: number) => {
    setHolidayClosures(holidayClosures.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Save operating hours
      await apiClient('/settings', {
        method: 'PUT',
        data: {
          locationId,
          section: 'operatingHours',
          data: operatingHours,
          version: settings.version,
        },
      });

      // Reload updated version
      await loadSettings();
      setSuccessMsg('Operating hours updated successfully.');
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.status === 409) {
        setErrorMsg('Concurrency conflict: Settings were modified by another administrator. Please reload.');
      } else {
        setErrorMsg(err?.message || 'Failed to save hours settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!settings || !confirm('Reset operating hours to default configuration?')) return;
    try {
      setSaving(true);
      await apiClient('/settings/reset', {
        method: 'POST',
        data: {
          locationId,
          section: 'operatingHours',
          version: settings.version,
        },
      });
      await loadSettings();
      setSuccessMsg('Operating hours reset to default configuration.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset operating hours.');
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
              <span>Service Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Operating Hours & Kitchen Service
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Synchronized customer reservation availability and order checkout cutoff hours
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
          {/* Main Dining Room Operating Hours */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#B99A63] border-b border-zinc-700/30 pb-3">
              Venue & Front-of-House Operating Hours
            </h3>

            <div className="space-y-3">
              {operatingHours.map((h, i) => (
                <div
                  key={h.day}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-zinc-700/20 bg-black/10 text-xs font-mono"
                >
                  <div className="flex items-center gap-3 w-32">
                    <input
                      type="checkbox"
                      checked={h.isOpen}
                      onChange={(e) => handleUpdateDay(operatingHours, setOperatingHours, i, 'isOpen', e.target.checked)}
                      className="accent-[#B99A63] w-4 h-4 cursor-pointer"
                    />
                    <span className={`font-semibold ${h.isOpen ? 'text-[#F6F1E8]' : 'text-[#737068] line-through'}`}>
                      {h.day}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#8E8A80]">Open:</span>
                      <input
                        type="time"
                        value={h.openTime}
                        disabled={!h.isOpen}
                        onChange={(e) => handleUpdateDay(operatingHours, setOperatingHours, i, 'openTime', e.target.value)}
                        className="px-2.5 py-1 rounded-lg border bg-transparent text-[#F6F1E8] border-[#2C2C28] disabled:opacity-30 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[#8E8A80]">Close:</span>
                      <input
                        type="time"
                        value={h.closeTime}
                        disabled={!h.isOpen}
                        onChange={(e) => handleUpdateDay(operatingHours, setOperatingHours, i, 'closeTime', e.target.value)}
                        className="px-2.5 py-1 rounded-lg border bg-transparent text-[#F6F1E8] border-[#2C2C28] disabled:opacity-30 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Holiday / Temporary Closures */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#B99A63] border-b border-zinc-700/30 pb-3">
              Holiday Closures & Private Salon Blackouts
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={newClosureDate}
                onChange={(e) => setNewClosureDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] text-xs font-mono outline-none"
              />
              <input
                type="text"
                placeholder="Reason (e.g. National Holiday / Gala)"
                value={newClosureReason}
                onChange={(e) => setNewClosureReason(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl border bg-transparent text-[#F6F1E8] border-[#2C2C28] text-xs font-mono outline-none"
              />
              <button
                type="button"
                onClick={handleAddClosure}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#B99A63] text-black text-xs font-mono rounded-xl font-medium"
              >
                <Plus size={14} />
                <span>Add Closure</span>
              </button>
            </div>

            {holidayClosures.length > 0 && (
              <div className="space-y-2 pt-2">
                {holidayClosures.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-zinc-700/20 bg-black/10 text-xs font-mono">
                    <span className="text-[#F6F1E8] font-bold">{c.date}</span>
                    <span className="text-[#A5A198]">{c.reason}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClosure(idx)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              <span>{saving ? 'Saving...' : 'Save Operating Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </StaffGuard>
  );
}
