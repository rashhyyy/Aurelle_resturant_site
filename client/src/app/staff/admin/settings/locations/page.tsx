'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { SettingsTabs } from '../../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { MapPin, Building2, CheckCircle2, RefreshCw, AlertCircle, Shield } from 'lucide-react';

interface LocationItem {
  id: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
  hasCustomSettings: boolean;
  version: number;
  currency: string;
  onlineOrderingEnabled: boolean;
  serviceChargeRate: number;
  taxRate: number;
}

export default function LocationSettingsPage() {
  const { staff, selectedLocation, setSelectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiClient<{ success: boolean; data: LocationItem[] }>('/settings/locations');
      if (res && res.data) {
        setLocations(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load restaurant locations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

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
              <span>Venues & Locations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Multi-Location Fleet Management
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Independent location policies, isolated menus, and dedicated fiscal rates
            </p>
          </div>

          <button
            onClick={loadLocations}
            disabled={loading}
            className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#D0CBC0]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-[#B99A63]' : ''} />
          </button>
        </div>

        <SettingsTabs />

        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {locations.map((loc) => {
            const isCurrent = selectedLocation === loc.id;
            return (
              <div
                key={loc.id}
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-[#B99A63] bg-[#B99A63]/5 shadow-sm'
                    : isDark
                    ? 'bg-[#1E1E1B] border-[#2C2C28]'
                    : 'bg-white border-[#E5DFD3]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#A5A198]">{loc.id}</span>
                        <h3 className="text-base font-serif font-semibold text-[#F6F1E8]">{loc.name}</h3>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#B99A63] font-bold bg-[#B99A63]/15 px-2.5 py-1 rounded-md">
                        Active Workspace
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedLocation && setSelectedLocation(loc.id)}
                        className="text-[10px] font-mono uppercase tracking-wider text-[#A5A198] hover:text-[#B99A63] border border-zinc-700 px-2 py-1 rounded-md"
                      >
                        Switch View
                      </button>
                    )}
                  </div>

                  <p className="text-xs font-mono text-[#8E8A80] mb-4 flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#B99A63]" />
                    <span>{loc.address}</span>
                  </p>

                  <div className="space-y-2 p-3 rounded-xl border border-zinc-700/20 bg-black/10 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#A5A198]">Config Version:</span>
                      <span className="text-[#F6F1E8] font-bold">v{loc.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A5A198]">Currency:</span>
                      <span className="text-[#F6F1E8] font-bold">{loc.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A5A198]">Online Ordering:</span>
                      <span className={loc.onlineOrderingEnabled ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                        {loc.onlineOrderingEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A5A198]">Service Charge / Tax:</span>
                      <span className="text-[#B99A63] font-bold">
                        {(loc.serviceChargeRate * 100).toFixed(0)}% / {(loc.taxRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StaffGuard>
  );
}
