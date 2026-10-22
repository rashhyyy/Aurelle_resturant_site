'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { ROLE_NAVIGATION, NavItem } from '../../lib/staffNavigation';
import { ROLE_LABELS, StaffRole } from '../../types/staff';
import { NavIcon } from './NavIcon';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Shield,
  MapPin,
} from 'lucide-react';

interface StaffSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const StaffSidebar = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: StaffSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { staff, logout, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    onCloseMobile();
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  if (!staff) return null;

  const roleInfo = ROLE_LABELS[staff.role] || { title: staff.role, subtitle: '' };
  const navSections = ROLE_NAVIGATION[staff.role] || [];

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

  const isDark = theme === 'dark';

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div
        className={`flex items-center justify-between h-20 px-4 border-b ${
          isDark ? 'border-[#22211E]' : 'border-[#342A24]'
        } transition-all`}
      >
        <Link
          href={`/staff/${staff.role.toLowerCase()}`}
          className={`flex items-center gap-3 overflow-hidden ${
            collapsed ? 'justify-center w-full' : ''
          }`}
          title="Aurelle Restaurant Portal"
        >
          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#B99A63]/15 border border-[#B99A63]/30 flex items-center justify-center text-[#B99A63]">
            <Shield size={20} />
          </div>

          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span
                className={`font-serif tracking-[0.25em] font-semibold text-base leading-tight truncate ${
                  isDark ? 'text-white' : 'text-[#FAF6F0]'
                }`}
              >
                AURELLE
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#B99A63] font-mono truncate">
                {roleInfo.title}
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className={`lg:hidden p-2 rounded-lg transition-colors ${
            isDark
              ? 'text-[#737068] hover:text-[#B99A63]'
              : 'text-[#A89887] hover:text-[#FAF6F0] hover:bg-[#2C231E]'
          }`}
          aria-label="Close navigation menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 scrollbar-thin">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && section.title && (
              <div
                className={`px-3 mb-2 text-[10px] uppercase font-mono tracking-[0.25em] font-semibold ${
                  isDark ? 'text-[#737068]' : 'text-[#A89887]'
                }`}
              >
                {section.title}
              </div>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== `/staff/${staff.role.toLowerCase()}` &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? isDark
                          ? 'bg-[#B99A63]/15 text-[#B99A63] font-semibold'
                          : 'bg-[#B99A63]/20 text-[#E8CF9B] font-semibold'
                        : isDark
                        ? 'text-[#A5A198] hover:text-[#F6F1E8] hover:bg-[#1E1E1B]'
                        : 'text-[#C7BEB2] hover:text-[#FAF6F0] hover:bg-[#2C231E]'
                    }`}
                  >
                    {/* Active Accent Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#B99A63] rounded-r" />
                    )}

                    <NavIcon
                      name={item.iconName}
                      size={17}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'text-[#B99A63]'
                          : isDark
                          ? 'text-[#737068] group-hover:text-[#A5A198]'
                          : 'text-[#9E9284] group-hover:text-[#FAF6F0]'
                      }`}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 tracking-wide">{item.label}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-[#B99A63]/20 text-[#B99A63] border border-[#B99A63]/30">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed state on desktop */}
                    {collapsed && (
                      <div
                        className={`fixed left-20 ml-2 px-2.5 py-1.5 rounded-md text-xs font-medium tracking-wide whitespace-nowrap shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 ${
                          isDark
                            ? 'bg-[#171715] text-[#F6F1E8] border border-[#2C2C28]'
                            : 'bg-[#201A16] text-[#FAF6F0] border border-[#382C24]'
                        }`}
                      >
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Staff Account Summary & Sign Out */}
      <div
        className={`p-3 border-t ${
          isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#342A24] bg-[#1A1512]'
        }`}
      >
        {!collapsed ? (
          <div className="space-y-3">
            <Link
              href="/staff/profile"
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-[#1E1E1B]' : 'hover:bg-[#251D18]'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#B99A63]/20 border border-[#B99A63]/30 flex items-center justify-center text-xs font-mono font-bold text-[#B99A63]">
                {staff.firstName[0]}
                {staff.lastName[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <div
                  className={`text-xs font-semibold truncate ${
                    isDark ? 'text-[#F6F1E8]' : 'text-[#FAF6F0]'
                  }`}
                >
                  {staff.firstName} {staff.lastName}
                </div>
                <div
                  className={`flex items-center gap-1 text-[10px] truncate font-mono ${
                    isDark ? 'text-[#737068]' : 'text-[#A89887]'
                  }`}
                >
                  <MapPin size={10} className="text-[#B99A63] shrink-0" />
                  <span className="truncate">{selectedLocation || 'Default Location'}</span>
                </div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium tracking-wide transition-all border ${
                isDark
                  ? 'border-[#2C2C28] bg-[#171715] text-[#A5A198] hover:text-[#E07A70] hover:border-[#E07A70]/40'
                  : 'border-[#382C24] bg-[#241D19] text-[#C7BEB2] hover:text-[#E07A70] hover:border-[#E07A70]/40 hover:bg-[#2E201B]'
              } disabled:opacity-50`}
            >
              <LogOut size={14} className="shrink-0" />
              <span>{loggingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Link
              href="/staff/profile"
              className="w-9 h-9 rounded-full bg-[#B99A63]/20 border border-[#B99A63]/30 flex items-center justify-center text-xs font-mono font-bold text-[#B99A63]"
              title={`${staff.firstName} ${staff.lastName} (${roleInfo.title})`}
            >
              {staff.firstName[0]}
              {staff.lastName[0]}
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-[#737068] hover:text-[#E07A70]'
                  : 'text-[#A89887] hover:text-[#E07A70] hover:bg-[#251D18]'
              }`}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        {/* Desktop Collapse / Expand Toggle Button */}
        <div
          className={`hidden lg:flex items-center justify-center pt-2 mt-2 border-t border-dashed ${
            isDark ? 'border-[#B99A63]/15' : 'border-[#B99A63]/25'
          }`}
        >
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              isDark
                ? 'text-[#737068] hover:text-[#B99A63] hover:bg-[#1E1E1B]'
                : 'text-[#A89887] hover:text-[#B99A63] hover:bg-[#251D18]'
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        data-staff-sidebar="true"
        className={`staff-sidebar hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 border-r ${
          isDark
            ? 'bg-[#171715] border-[#22211E]'
            : 'bg-[#201A16] border-[#342A24]'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <div
        data-staff-sidebar="true"
        className={`staff-sidebar fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:hidden transition-transform duration-300 transform shadow-2xl border-r ${
          isDark
            ? 'bg-[#171715] border-[#22211E]'
            : 'bg-[#201A16] border-[#342A24]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
