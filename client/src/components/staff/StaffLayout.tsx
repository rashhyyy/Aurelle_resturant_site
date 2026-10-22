'use client';

import React, { useState, useEffect } from 'react';
import { StaffGuard } from './StaffGuard';
import { StaffSidebar } from './StaffSidebar';
import { StaffTopbar } from './StaffTopbar';
import { StaffRole } from '../../types/staff';
import { useStaffTheme } from '../../context/StaffThemeContext';

interface StaffLayoutProps {
  children: React.ReactNode;
  allowedRoles?: StaffRole[];
}

export const StaffLayout = ({ children, allowedRoles }: StaffLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useStaffTheme();

  // Load sidebar preference from localStorage
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('aurelle_staff_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setCollapsed(savedCollapsed === 'true');
      }
    } catch {}
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aurelle_staff_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const isDark = theme === 'dark';

  return (
    <StaffGuard allowedRoles={allowedRoles}>
      <div
        className={`min-h-screen flex transition-colors duration-200 ${
          isDark ? 'bg-[#171715] text-[#F6F1E8]' : 'bg-[#F6F1E8] text-[#171715]'
        }`}
      >
        {/* Reusable Sidebar */}
        <StaffSidebar
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Top Bar */}
          <StaffTopbar onOpenMobileSidebar={() => setMobileOpen(true)} />

          {/* Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </StaffGuard>
  );
};
