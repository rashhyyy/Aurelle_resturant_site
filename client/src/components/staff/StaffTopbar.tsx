'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { ROLE_LABELS, StaffRole } from '../../types/staff';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  MapPin,
  ChevronDown,
  User,
  Shield,
  LogOut,
  ChevronRight,
  Check,
} from 'lucide-react';

interface StaffTopbarProps {
  onOpenMobileSidebar: () => void;
}

export const StaffTopbar = ({ onOpenMobileSidebar }: StaffTopbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { staff, logout, selectedLocation, setSelectedLocation } = useStaffAuth();
  const { theme, toggleTheme } = useStaffTheme();

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!staff) return null;

  const roleInfo = ROLE_LABELS[staff.role] || { title: staff.role, subtitle: '' };
  const userLocations = staff.locationIds || [];
  const hasMultipleLocations = userLocations.length > 1;

  // Compute Breadcrumb Segments from pathname
  const pathParts = pathname.split('/').filter(Boolean);
  // e.g. ['staff', 'admin', 'orders'] -> ['Staff', 'Admin', 'Orders']
  const breadcrumbItems = pathParts.map((part) => {
    return part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  });

  const pageTitle = breadcrumbItems[breadcrumbItems.length - 1] || 'Dashboard';

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.push('/staff/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-20 h-16 sm:h-20 border-b transition-colors select-none ${
        isDark
          ? 'bg-[#171715]/95 border-[#22211E] backdrop-blur-md'
          : 'bg-[#F6F1E8]/95 border-[#E5DFD3] backdrop-blur-md'
      }`}
    >
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Button & Breadcrumbs / Title */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <button
            onClick={onOpenMobileSidebar}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isDark
                ? 'text-[#A5A198] hover:text-white hover:bg-[#1E1E1B]'
                : 'text-[#6B685F] hover:text-[#171715] hover:bg-[#E2DBCB]'
            }`}
            aria-label="Open staff navigation drawer"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-col overflow-hidden">
            {/* Breadcrumb Navigation */}
            <nav
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono tracking-wider"
              aria-label="Breadcrumbs"
            >
              {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                return (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <ChevronRight
                        size={12}
                        className={isDark ? 'text-[#55524B]' : 'text-[#A09B90]'}
                      />
                    )}
                    <span
                      className={`truncate ${
                        isLast
                          ? isDark
                            ? 'text-[#B99A63] font-medium'
                            : 'text-[#8F723D] font-medium'
                          : isDark
                          ? 'text-[#737068]'
                          : 'text-[#8E8A80]'
                      }`}
                    >
                      {item}
                    </span>
                  </React.Fragment>
                );
              })}
            </nav>

            {/* Current Page Title */}
            <h1
              className={`text-base sm:text-lg font-serif tracking-wide truncate ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right: Location Selector, Theme Toggle, Notifications, Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Restaurant Location Selector / Display */}
          <div className="relative" ref={locationRef}>
            {userLocations.length === 0 ? (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${
                  isDark
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-amber-600/30 bg-amber-50 text-amber-800'
                }`}
                title="No restaurant location assigned. Contact system administrator."
              >
                <MapPin size={13} className="shrink-0" />
                <span className="hidden md:inline">Setup Required</span>
              </div>
            ) : hasMultipleLocations ? (
              // Multiple Locations: Render Dropdown
              <div>
                <button
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    isDark
                      ? 'border-[#2C2C28] bg-[#1E1E1B] text-[#ECE7DF] hover:border-[#B99A63]/40'
                      : 'border-[#D9D2C4] bg-white text-[#171715] hover:border-[#B99A63]/50'
                  }`}
                  aria-expanded={locationDropdownOpen}
                  aria-haspopup="true"
                >
                  <MapPin size={13} className="text-[#B99A63] shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">
                    {selectedLocation || userLocations[0]}
                  </span>
                  <ChevronDown size={13} className="text-[#737068]" />
                </button>

                {locationDropdownOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-xl border p-1 shadow-2xl z-50 text-xs ${
                      isDark
                        ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF]'
                        : 'bg-white border-[#E5DFD3] text-[#171715]'
                    }`}
                  >
                    <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-[#737068]">
                      Authorized Venues
                    </div>
                    {userLocations.map((loc) => {
                      const isSelected = (selectedLocation || userLocations[0]) === loc;
                      return (
                        <button
                          key={loc}
                          onClick={() => {
                            setSelectedLocation(loc);
                            setLocationDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                            isSelected
                              ? isDark
                                ? 'bg-[#B99A63]/15 text-[#B99A63] font-medium'
                                : 'bg-[#B99A63]/15 text-[#8F723D] font-medium'
                              : isDark
                              ? 'hover:bg-[#1E1E1B]'
                              : 'hover:bg-[#F6F1E8]'
                          }`}
                        >
                          <span className="truncate font-mono">{loc}</span>
                          {isSelected && <Check size={14} className="text-[#B99A63]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Single Location: Display without dropdown
              <div
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${
                  isDark
                    ? 'border-[#22211E] bg-[#141412] text-[#A5A198]'
                    : 'border-[#E5DFD3] bg-[#EFE9DC] text-[#6B685F]'
                }`}
              >
                <MapPin size={13} className="text-[#B99A63] shrink-0" />
                <span className="truncate max-w-[150px]">{userLocations[0]}</span>
              </div>
            )}
          </div>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? 'border-[#2C2C28] bg-[#1E1E1B] text-[#A5A198] hover:text-[#B99A63] hover:border-[#B99A63]/40'
                : 'border-[#D9D2C4] bg-white text-[#6B685F] hover:text-[#B99A63] hover:border-[#B99A63]/50'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
            aria-label="Toggle visual theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Interactive Notifications Bell Center */}
          <NotificationBell mode="staff" isDark={isDark} />

          {/* Staff Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border transition-all ${
                isDark
                  ? 'border-[#2C2C28] bg-[#1E1E1B] hover:border-[#B99A63]/40'
                  : 'border-[#D9D2C4] bg-white hover:border-[#B99A63]/50'
              }`}
              aria-expanded={profileDropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-full bg-[#B99A63]/20 border border-[#B99A63]/30 flex items-center justify-center text-xs font-mono font-bold text-[#B99A63]">
                {staff.firstName[0]}
                {staff.lastName[0]}
              </div>
              <ChevronDown size={14} className="text-[#737068]" />
            </button>

            {profileDropdownOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-xl border p-2 shadow-2xl z-50 text-xs ${
                  isDark
                    ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF]'
                    : 'bg-white border-[#E5DFD3] text-[#171715]'
                }`}
              >
                {/* Profile Card Summary */}
                <div
                  className={`p-3 rounded-lg mb-2 border ${
                    isDark
                      ? 'bg-[#1E1E1B] border-[#252522]'
                      : 'bg-[#F6F1E8] border-[#E5DFD3]'
                  }`}
                >
                  <div className="font-semibold text-sm truncate">
                    {staff.firstName} {staff.lastName}
                  </div>
                  <div className="text-[11px] text-[#737068] truncate mb-2">
                    {staff.email}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="uppercase text-[#B99A63] font-semibold">
                      {roleInfo.title}
                    </span>
                    <span className="text-emerald-500 font-medium">{staff.status}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/staff/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-[#1E1E1B]' : 'hover:bg-[#F6F1E8]'
                    }`}
                  >
                    <User size={15} className="text-[#B99A63]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/staff/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-[#1E1E1B]' : 'hover:bg-[#F6F1E8]'
                    }`}
                  >
                    <Shield size={15} className="text-[#B99A63]" />
                    <span>Account Security</span>
                  </Link>

                  <Link
                    href="/staff/profile/notifications"
                    onClick={() => setProfileDropdownOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-[#1E1E1B]' : 'hover:bg-[#F6F1E8]'
                    }`}
                  >
                    <Bell size={15} className="text-[#B99A63]" />
                    <span>Notification Settings</span>
                  </Link>

                  <div
                    className={`my-1 border-t ${
                      isDark ? 'border-[#22211E]' : 'border-[#E5DFD3]'
                    }`}
                  />

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#8B3D35] transition-colors ${
                      isDark ? 'hover:bg-[#8B3D35]/10' : 'hover:bg-red-50'
                    }`}
                  >
                    <LogOut size={15} />
                    <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
