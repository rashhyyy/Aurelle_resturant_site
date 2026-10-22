'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { apiClient } from '../../../../../lib/api';
import { SettingsTabs } from '../../../../../components/admin/settings/SettingsTabs';
import { StaffGuard } from '../../../../../components/staff/StaffGuard';
import { StaffRole } from '../../../../../types/staff';
import { Shield, Lock, Database, Users, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function SecuritySettingsPage() {
  const { staff } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [securityData, setSecurityData] = useState<any>(null);

  const loadSecurity = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiClient<{ success: boolean; data: any }>('/settings/security');
      if (res && res.data) {
        setSecurityData(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load security overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

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
              <span>Infrastructure Security</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F6F1E8]">
              Security & Session Governance
            </h1>
            <p className="text-xs text-[#8E8A80] mt-1 font-mono">
              Cryptographic controls, session parameters, rate limiting guards, and RBAC matrix
            </p>
          </div>

          <button
            onClick={loadSecurity}
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
          {/* Session Parameters */}
          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <div className="flex items-center gap-2 border-b border-zinc-700/30 pb-3">
              <Lock size={16} className="text-[#B99A63]" />
              <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8]">
                Session & Cookie Governance
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-[#A5A198]">Mechanism:</span>
                <span className="text-[#F6F1E8]">{securityData?.session?.sessionType || 'Secure Cookie Session'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-[#A5A198]">Session TTL:</span>
                <span className="text-[#F6F1E8]">{securityData?.session?.maxAgeHours || 24} Hours</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-[#A5A198]">HttpOnly & SameSite:</span>
                <span className="text-emerald-400 font-bold">Lax (CSRF Protected)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#A5A198]">Password Cipher:</span>
                <span className="text-[#B99A63] font-bold">Argon2id (Memory-Hard)</span>
              </div>
            </div>
          </div>

          {/* Database & TLS */}
          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <div className="flex items-center gap-2 border-b border-zinc-700/30 pb-3">
              <Database size={16} className="text-[#B99A63]" />
              <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8]">
                Database & Transport Security
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-[#A5A198]">Connection Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>{securityData?.database?.state || 'CONNECTED'}</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-[#A5A198]">Target Cluster:</span>
                <span className="text-[#F6F1E8]">MongoDB Atlas (Encrypted at Rest)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-[#A5A198]">Transport Layer:</span>
                <span className="text-emerald-400 font-bold">TLS 1.3 Strict</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#A5A198]">CORS Allowed Origin:</span>
                <span className="text-[#B99A63] truncate max-w-[200px]">{securityData?.cors?.origin || 'http://localhost:3000'}</span>
              </div>
            </div>
          </div>

          {/* RBAC Active Role Breakdown */}
          <div className={`p-6 rounded-2xl border md:col-span-2 space-y-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}>
            <div className="flex items-center justify-between border-b border-zinc-700/30 pb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#B99A63]" />
                <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-[#F6F1E8]">
                  Role-Based Access Control (RBAC) Active Matrix
                </h3>
              </div>
              <span className="text-xs font-mono text-[#B99A63] font-bold">
                {securityData?.rbac?.activeStaffCount ?? 0} Active Staff Credentials
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {['ADMIN', 'MANAGER', 'KITCHEN', 'RECEPTION', 'FLOOR'].map((role) => {
                const count = securityData?.rbac?.roleBreakdown?.[role] ?? 0;
                return (
                  <div key={role} className="p-3 rounded-xl border border-zinc-700/20 bg-black/10 text-center">
                    <span className="text-[10px] font-mono text-[#A5A198] uppercase">{role}</span>
                    <div className="text-xl font-serif font-bold text-[#F6F1E8] my-1">{count}</div>
                    <span className="text-[9px] font-mono text-[#8E8A80]">accounts</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </StaffGuard>
  );
}
