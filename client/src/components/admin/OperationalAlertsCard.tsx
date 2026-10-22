'use client';

import React from 'react';
import Link from 'next/link';
import { OperationalAlert } from '../../types/dashboard';
import { useStaffTheme } from '../../context/StaffThemeContext';
import {
  AlertTriangle,
  Info,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface OperationalAlertsCardProps {
  alerts: OperationalAlert[];
}

export const OperationalAlertsCard = ({ alerts }: OperationalAlertsCardProps) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return {
          icon: AlertCircle,
          className: 'bg-red-500/15 text-red-400 border-red-500/30',
        };
      case 'Warning':
        return {
          icon: AlertTriangle,
          className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      default:
        return {
          icon: Info,
          className: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        };
    }
  };

  return (
    <div
      className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#B99A63]/15 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h3
                className={`text-base font-serif font-semibold tracking-wide ${
                  isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                }`}
              >
                Operational Alerts
              </h3>
              <span className="text-[10px] font-mono text-[#737068] uppercase">
                System Diagnostics
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#B99A63]/10 text-[#B99A63] border border-[#B99A63]/20">
            {alerts.length} Active
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const { icon: Icon, className } = getSeverityBadge(alert.severity);

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                    isDark
                      ? 'bg-[#171715] border-[#2A2926]'
                      : 'bg-[#F6F1E8] border-[#E5DFD3]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${className}`}
                    >
                      <Icon size={14} />
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{alert.title}</span>
                        <span
                          className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border ${className}`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A5A198] mt-0.5 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  {alert.actionUrl && (
                    <Link
                      href={alert.actionUrl}
                      className="shrink-0 p-1.5 text-[#737068] hover:text-[#B99A63] transition-colors"
                      title="Inspect issue"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-2">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-xs text-[#A5A198]">
              No operational alerts at this time.
            </p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#B99A63]/10 mt-4 flex items-center justify-between text-[10px] font-mono text-[#737068]">
        <span>Monitor: Real-time telemetry</span>
        <span>Severity filtering: Active</span>
      </div>
    </div>
  );
};
