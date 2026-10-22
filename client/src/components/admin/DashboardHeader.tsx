'use client';

import React from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { RefreshCw, MapPin, Calendar, Clock, Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing: boolean;
  locationName?: string;
}

export const DashboardHeader = ({
  lastUpdated,
  onRefresh,
  refreshing,
  locationName,
}: DashboardHeaderProps) => {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [greeting, setGreeting] = React.useState('Welcome back');
  const [formattedDate, setFormattedDate] = React.useState('');

  React.useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setFormattedDate(
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(now)
    );
  }, []);

  const formattedTime = lastUpdated
    ? new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(lastUpdated)
    : 'Just now';

  return (
    <div
      className={`border rounded-2xl p-6 sm:p-8 mb-8 shadow-sm transition-colors ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B99A63]/15 border border-[#B99A63]/30 text-[#B99A63] text-xs font-mono uppercase tracking-wider mb-3">
            <Sparkles size={13} />
            Administrator Control Center
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-serif tracking-wide ${
              isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
            }`}
          >
            {greeting}, {staff?.firstName || 'Administrator'}
          </h2>

          <p
            className={`text-sm mt-1.5 max-w-2xl leading-relaxed ${
              isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
            }`}
          >
            Here's an overview of your restaurant operations and daily venue telemetry.
          </p>

          {/* Location & Date Badges */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-xs font-mono">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF]'
                  : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#171715]'
              }`}
            >
              <MapPin size={13} className="text-[#B99A63] shrink-0" />
              <span className="font-medium">
                {locationName || selectedLocation || 'All Authorized Locations'}
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-[#A5A198]'
                  : 'bg-[#F6F1E8] border-[#E5DFD3] text-[#6B685F]'
              }`}
            >
              <Calendar size={13} className="text-[#B99A63] shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Refresh Action & Status */}
        <div className="flex flex-col items-start lg:items-end justify-between gap-3 self-start lg:self-center border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-[#737068]">
            <Clock size={13} className="text-[#B99A63]" />
            <span>Updated: {formattedTime}</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium tracking-wide uppercase transition-all border shadow-sm ${
              isDark
                ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF] hover:border-[#B99A63]/50 hover:text-[#B99A63]'
                : 'bg-white border-[#D9D2C4] text-[#171715] hover:border-[#B99A63]/60 hover:text-[#B99A63]'
            } disabled:opacity-50`}
            title="Fetch latest operational metrics"
          >
            <RefreshCw
              size={13}
              className={`text-[#B99A63] ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
