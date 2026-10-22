'use client';

import React, { useState } from 'react';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import { AnalyticsDatePreset } from '../../../types/analytics';
import { Calendar, RefreshCw } from 'lucide-react';

interface AnalyticsDateFilterProps {
  preset: AnalyticsDatePreset;
  onPresetChange: (preset: AnalyticsDatePreset, start?: string, end?: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AnalyticsDateFilter: React.FC<AnalyticsDateFilterProps> = ({
  preset,
  onPresetChange,
  onRefresh,
  isLoading = false,
}) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const PRESETS: { id: AnalyticsDatePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last7days', label: 'Last 7 Days' },
    { id: 'last30days', label: 'Last 30 Days' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'lastMonth', label: 'Last Month' },
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onPresetChange('custom', customStart, customEnd);
      setShowCustom(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border transition-all text-xs font-mono select-none"
        style={{
          backgroundColor: isDark ? '#141412' : '#F9F7F2',
          borderColor: isDark ? '#2C2C28' : '#E5DFD3',
        }}
      >
        {PRESETS.map((p) => {
          const active = preset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setShowCustom(false);
                onPresetChange(p.id);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                active
                  ? 'bg-[#B99A63] text-black shadow-xs font-semibold'
                  : isDark
                  ? 'text-[#A5A198] hover:text-[#F6F1E8] hover:bg-white/5'
                  : 'text-[#6B685F] hover:text-[#171715] hover:bg-black/5'
              }`}
            >
              {p.label}
            </button>
          );
        })}

        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-medium ${
            preset === 'custom'
              ? 'bg-[#B99A63] text-black shadow-xs font-semibold'
              : isDark
              ? 'text-[#A5A198] hover:text-[#F6F1E8] hover:bg-white/5'
              : 'text-[#6B685F] hover:text-[#171715] hover:bg-black/5'
          }`}
        >
          <Calendar size={13} />
          <span>Custom</span>
        </button>
      </div>

      <button
        onClick={onRefresh}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono tracking-wider border transition-all ${
          isDark
            ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#D0CBC0] hover:border-[#B99A63]/50'
            : 'bg-white border-[#E5DFD3] text-[#4F4B41] hover:border-[#B99A63]'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#B99A63]' : ''} />
        <span>Sync Live</span>
      </button>

      {showCustom && (
        <form
          onSubmit={handleApplyCustom}
          className={`w-full p-4 rounded-xl border flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1 ${
            isDark ? 'bg-[#1A1A17] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <span className="text-xs font-mono uppercase text-[#B99A63]">Custom Period:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#A5A198]">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
              className="px-2.5 py-1 text-xs rounded-lg border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#A5A198]">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
              className="px-2.5 py-1 text-xs rounded-lg border bg-transparent text-[#F6F1E8] border-[#2C2C28] focus:border-[#B99A63] outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#B99A63] hover:bg-[#A88B54] text-black font-medium text-xs rounded-lg transition-all"
          >
            Apply Range
          </button>
        </form>
      )}
    </div>
  );
};
