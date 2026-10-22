'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { StaffRole, ROLE_LABELS } from '../../types/staff';
import { LogOut, MapPin, User, ChevronRight, ShieldCheck } from 'lucide-react';

const ROLE_BADGE_STYLES: Record<StaffRole, string> = {
  [StaffRole.ADMIN]: 'bg-[#C1A87D]/15 text-[#C1A87D] border-[#C1A87D]/30',
  [StaffRole.MANAGER]: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  [StaffRole.KITCHEN]: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  [StaffRole.RECEPTION]: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  [StaffRole.FLOOR]: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

export const StaffHeader = () => {
  const { staff, logout } = useStaffAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!staff) return null;

  const roleInfo = ROLE_LABELS[staff.role] || { title: staff.role, subtitle: '' };
  const badgeStyle = ROLE_BADGE_STYLES[staff.role] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

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
    <header className="sticky top-0 z-40 bg-[#0C0D10]/95 backdrop-blur-md border-b border-[#22211F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand & Portal Label */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="group flex items-center space-x-3">
              <span className="font-serif text-lg tracking-[0.25em] font-bold text-white group-hover:text-[#C1A87D] transition-colors">
                AURELLE
              </span>
            </Link>
            <div className="hidden sm:flex items-center text-xs tracking-wider text-[#737068]">
              <ChevronRight size={14} className="mx-1.5 opacity-60" />
              <span className="uppercase text-[#A5A198] font-mono">Staff Management Portal</span>
            </div>
          </div>

          {/* User Details & Sign Out */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <div className="text-right hidden md:block">
              <div className="flex items-center justify-end space-x-2">
                <span className="text-sm font-medium text-[#F6F4EE]">
                  {staff.firstName} {staff.lastName}
                </span>
                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${badgeStyle}`}
                >
                  {roleInfo.title}
                </span>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-0.5 text-xs text-[#737068]">
                <span>{staff.email}</span>
                {staff.locationIds && staff.locationIds.length > 0 && (
                  <span className="flex items-center gap-1 text-[#A5A198]">
                    <MapPin size={11} className="text-[#C1A87D]" />
                    {staff.locationIds[0]}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-xs font-mono tracking-wider uppercase rounded-lg border border-[#33312B] bg-[#14151B] text-[#ECE7DF] hover:bg-[#1E2028] hover:border-[#C1A87D]/40 hover:text-white transition-all disabled:opacity-50"
              title="Securely end current staff session"
            >
              <LogOut size={14} className="text-[#C1A87D]" />
              <span className="hidden sm:inline">
                {loggingOut ? 'Ending Session...' : 'Sign Out'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
