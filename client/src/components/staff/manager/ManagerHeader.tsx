'use client';

import React, { useState, useEffect } from 'react';
import { useStaffAuth } from '../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import { useSocket } from '../../../context/SocketContext';
import { MapPin, Clock, Shield, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ManagerHeaderProps {
  heading?: string;
  description?: string;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const LOCATION_NAMES: Record<string, string> = {
  'loc-colombo-main': 'Aurelle Colombo (Flagship)',
  'loc-kandy-vip': 'Aurelle Kandy (Grand Salon)',
  'default-location': 'Aurelle Flagship',
};

export const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  heading = 'Restaurant Operations',
  description = 'Monitor daily performance and coordinate restaurant operations.',
  actions,
  onRefresh,
  refreshing = false,
}) => {
  const { staff, selectedLocation, setSelectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { connected } = useSocket();
  const isDark = theme === 'dark';

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';
  const locationName = LOCATION_NAMES[locationId] || locationId;
  const userLocations = staff?.locationIds || [];

  return (
    <div className="mb-8 select-none">
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#B99A63]/20 mb-4 text-xs font-mono">
        <div className="flex items-center gap-2 tracking-widest text-[#B99A63] font-semibold uppercase">
          <span>AURELLE</span>
          <span className="text-[#B99A63]/40">/</span>
          <span>MANAGEMENT</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Real-time Connection State */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {connected ? (
              <>
                <Wifi size={12} />
                <span>LIVE</span>
              </>
            ) : (
              <>
                <WifiOff size={12} />
                <span>RECONNECTING</span>
              </>
            )}
          </div>

          {/* Location Selector */}
          <div className="flex items-center gap-1.5 text-[#B99A63] bg-[#B99A63]/10 px-2.5 py-1 rounded border border-[#B99A63]/30">
            <MapPin size={12} />
            {userLocations.length > 1 ? (
              <select
                value={locationId}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent text-xs font-mono text-[#F6F1E8] focus:outline-none cursor-pointer"
              >
                {userLocations.map((loc) => (
                  <option key={loc} value={loc} className="bg-[#171715] text-[#F6F1E8]">
                    {LOCATION_NAMES[loc] || loc}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-sans font-medium text-xs text-[#F6F1E8]">{locationName}</span>
            )}
          </div>

          {/* Date & Time */}
          <div
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded border ${
              isDark
                ? 'bg-[#171715]/60 border-[#2A2925] text-[#A5A198]'
                : 'bg-stone-100 border-stone-200 text-stone-600'
            }`}
          >
            <Clock size={12} />
            <span>
              {currentDate} • {currentTime}
            </span>
          </div>

          {/* Manager Badge */}
          {staff && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded border ${
                isDark
                  ? 'bg-[#171715]/60 border-[#2A2925] text-[#A5A198]'
                  : 'bg-stone-100 border-stone-200 text-stone-600'
              }`}
            >
              <Shield size={12} className="text-[#B99A63]" />
              <span>
                {staff.firstName} {staff.lastName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-serif tracking-wide ${
              isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
            }`}
          >
            {heading}
          </h1>
          <p
            className={`mt-1 text-sm leading-relaxed max-w-2xl ${
              isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
            }`}
          >
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg border transition-all ${
                isDark
                  ? 'border-[#2A2925] hover:bg-[#1E1D1A] text-[#A5A198] hover:text-[#F6F1E8]'
                  : 'border-stone-200 hover:bg-stone-100 text-stone-600 hover:text-stone-900'
              } disabled:opacity-50`}
              title="Refresh operational data"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#B99A63]' : ''} />
            </button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
};
