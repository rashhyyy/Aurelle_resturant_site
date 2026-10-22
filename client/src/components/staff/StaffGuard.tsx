'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { StaffRole, ROLE_LABELS, ROLE_DASHBOARDS } from '../../types/staff';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface StaffGuardProps {
  children: React.ReactNode;
  allowedRoles?: StaffRole[];
}

export const StaffGuard = ({ children, allowedRoles }: StaffGuardProps) => {
  const { staff, loading } = useStaffAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !staff) {
      const redirectUrl = `/staff/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [staff, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171715] flex flex-col items-center justify-center text-[#F6F1E8]">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-[#B99A63]/20 animate-ping absolute" />
          <div className="w-12 h-12 rounded-full border-t-2 border-[#B99A63] animate-spin" />
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-[#B99A63]/80 font-mono">
          Verifying Staff Clearance
        </p>
      </div>
    );
  }

  if (!staff) {
    return null; // Redirecting to login
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(staff.role)) {
    const userRoleInfo = ROLE_LABELS[staff.role];
    const defaultDashboard = ROLE_DASHBOARDS[staff.role] || '/staff/login';

    return (
      <div className="min-h-screen bg-[#171715] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-[#1E1E1B] border border-[#B99A63]/25 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-[#8B3D35]/15 border border-[#8B3D35]/30 flex items-center justify-center text-[#8B3D35]">
            <ShieldAlert size={28} />
          </div>

          <h2 className="text-xl font-serif text-[#F6F1E8] tracking-wide mb-2">
            Restricted Staff Area
          </h2>
          <p className="text-sm text-[#A5A198] mb-6 leading-relaxed">
            Your current account role is{' '}
            <span className="text-[#B99A63] font-medium">{userRoleInfo?.title || staff.role}</span>.
            This module requires {allowedRoles.map((r) => ROLE_LABELS[r]?.title || r).join(' or ')} clearance.
          </p>

          <Link
            href={defaultDashboard}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-[#B99A63] text-[#171715] font-medium text-xs tracking-wider uppercase transition-colors hover:bg-[#cbb07e] shadow-sm"
          >
            <ArrowLeft size={14} />
            Return to My Assigned Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
