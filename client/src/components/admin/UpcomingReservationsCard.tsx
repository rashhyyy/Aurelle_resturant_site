'use client';

import React from 'react';
import Link from 'next/link';
import { UpcomingReservationSummary } from '../../types/dashboard';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { StaffStatusBadge } from '../staff/StaffStatusBadge';
import { Calendar, ArrowRight, Users, Clock, Layers } from 'lucide-react';

interface UpcomingReservationsCardProps {
  reservations: UpcomingReservationSummary[];
  connected: boolean;
  statusMessage: string;
}

export const UpcomingReservationsCard = ({
  reservations,
  connected,
  statusMessage,
}: UpcomingReservationsCardProps) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#B99A63]/15 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <div>
              <h3
                className={`text-base font-serif font-semibold tracking-wide ${
                  isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                }`}
              >
                Upcoming Reservations
              </h3>
              <span className="text-[10px] font-mono text-[#737068] uppercase">
                Guest Manifest
              </span>
            </div>
          </div>

          <Link
            href="/staff/admin/reservations"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#B99A63] hover:underline"
          >
            <span>View Reservations</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {connected && reservations.length > 0 ? (
          <div className="space-y-3">
            {reservations.map((res) => (
              <div
                key={res.id}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDark
                    ? 'bg-[#171715] border-[#2A2926]'
                    : 'bg-[#F6F1E8] border-[#E5DFD3]'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">{res.guestName}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#737068]">
                    <span className="font-mono text-[#B99A63]">{res.reference}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {res.reservationTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {res.guestCount} Guests
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <StaffStatusBadge status={res.status} />
                  <span className="block text-[10px] text-[#737068] mt-1 font-mono">
                    {res.reservationType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/40 text-zinc-500 border border-zinc-700/50 flex items-center justify-center mb-3">
              <Layers size={22} />
            </div>
            <p
              className={`text-xs font-medium ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              {connected ? 'No upcoming reservations.' : 'Reservation Module Pending'}
            </p>
            <p className="text-[11px] text-[#737068] mt-1 max-w-sm">
              {statusMessage}
            </p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#B99A63]/10 mt-4 flex items-center justify-between text-[10px] font-mono text-[#737068]">
        <span>Source: Aurelle Reservation Registry</span>
        <span>{connected ? 'Active Registry' : 'Stage 6 Scheduled'}</span>
      </div>
    </div>
  );
};
