'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  Sparkles,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Eye,
  X,
  Mail,
  Phone,
} from 'lucide-react';

interface VipMonitoringData {
  locationId: string;
  counts: {
    upcomingBookings: number;
    pendingInquiries: number;
    activeProposals: number;
  };
  upcomingBookings: any[];
  pendingInquiries: any[];
  activeProposals: any[];
}

export default function ManagerVipEventsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const [data, setData] = useState<VipMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const loadManagerData = useCallback(
    async (isManual = false) => {
      try {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const res = await apiClient<{ success: boolean; data: VipMonitoringData }>(
          `/manager/vip-events?locationId=${encodeURIComponent(locationId)}`
        );
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        console.error('Failed to load manager VIP overview:', err);
        setError(err?.message || 'Failed to fetch manager VIP data.');
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId]
  );

  useEffect(() => {
    loadManagerData();
  }, [loadManagerData]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      loadManagerData(true);
    };

    socket.on('vip:booking_created', handleUpdate);
    socket.on('vip:booking_status_changed', handleUpdate);
    socket.on('event:inquiry_created', handleUpdate);

    return () => {
      socket.off('vip:booking_created', handleUpdate);
      socket.off('vip:booking_status_changed', handleUpdate);
      socket.off('event:inquiry_created', handleUpdate);
    };
  }, [socket, loadManagerData]);

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="VIP & Events Monitoring"
        description="Supervise high-touch dining experiences, dedicated concierge coverage, turn-around prep, and event inquiries."
        onRefresh={() => loadManagerData(true)}
        refreshing={refreshing}
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Manager KPIs */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 font-mono text-xs">
          <div
            className={`p-5 rounded-xl border ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-stone-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Upcoming VIP Bookings
              </span>
              <Calendar size={18} className="text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-emerald-400">
              {data.counts.upcomingBookings} Bookings
            </p>
            <span className="text-[11px] text-stone-500 font-sans">
              Confirmed private salon reservations
            </span>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-stone-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Pending Event Inquiries
              </span>
              <FileText size={18} className="text-[#B99A63]" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-stone-100">
              {data.counts.pendingInquiries} Inquiries
            </p>
            <span className="text-[11px] text-stone-500 font-sans">
              Private dining & banquet leads awaiting response
            </span>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-stone-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Proposals Out
              </span>
              <Sparkles size={18} className="text-purple-400" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-purple-400">
              {data.counts.activeProposals} Active
            </p>
            <span className="text-[11px] text-stone-500 font-sans">
              Proposals sent awaiting guest acceptance
            </span>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 text-center text-stone-500 font-mono text-sm">
          <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading VIP & private event data...
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming VIP Bookings */}
          <div
            className={`p-6 rounded-xl border ${
              isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
            }`}
          >
            <h3 className="font-serif text-lg text-[#F6F1E8] mb-1">Upcoming VIP Bookings</h3>
            <p className="text-xs text-[#A5A198] mb-4">Confirmed private salon seatings</p>

            {data.upcomingBookings.length === 0 ? (
              <div className="py-8 text-center text-stone-500 font-mono text-xs">
                No upcoming VIP bookings scheduled.
              </div>
            ) : (
              <div className="divide-y divide-[#2A2925] border border-[#2A2925] rounded-lg overflow-hidden">
                {data.upcomingBookings.map((b) => (
                  <div key={b.id} className="p-3.5 bg-[#1C1B17]/40 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-[#F6F1E8]">
                        {b.guestName || b.customerName}{' '}
                        <span className="text-xs font-mono text-[#B99A63]">
                          ({b.guestCount} guests)
                        </span>
                      </div>
                      <div className="text-xs font-mono text-stone-400 mt-0.5">
                        Salon: {b.roomName || 'Private Salon'} • {b.bookingReference}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs text-stone-400">
                      <div className="text-emerald-400 font-medium">
                        {new Date(b.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-stone-500">{b.startTime} - {b.endTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Event Inquiries */}
          <div
            className={`p-6 rounded-xl border ${
              isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
            }`}
          >
            <h3 className="font-serif text-lg text-[#F6F1E8] mb-1">Event Inquiries</h3>
            <p className="text-xs text-[#A5A198] mb-4">Banquet, celebration & corporate inquiries</p>

            {data.pendingInquiries.length === 0 ? (
              <div className="py-8 text-center text-stone-500 font-mono text-xs">
                No pending event inquiries.
              </div>
            ) : (
              <div className="divide-y divide-[#2A2925] border border-[#2A2925] rounded-lg overflow-hidden">
                {data.pendingInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    onClick={() => setSelectedInquiry(inq)}
                    className="p-3.5 bg-[#1C1B17]/40 flex items-center justify-between hover:bg-[#1C1B17] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-sm text-[#F6F1E8]">
                        {inq.guestName}{' '}
                        <span className="text-xs font-mono text-stone-400">
                          ({inq.eventType} • {inq.guestCount} guests)
                        </span>
                      </div>
                      <div className="text-xs font-mono text-stone-400 mt-0.5">
                        #{inq.inquiryReference} • Preferred Date: {inq.preferredDate}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#B99A63]/20 text-[#B99A63]">
                      {inq.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#141412] border border-[#B99A63]/30 rounded-xl shadow-2xl p-6 text-[#F6F1E8]">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-[#F6F1E8]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between border-b border-[#2A2925] pb-4 mb-4">
              <div>
                <span className="text-xs font-mono text-[#B99A63] uppercase tracking-wider">
                  Event Inquiry
                </span>
                <h2 className="text-xl font-serif text-[#F6F1E8]">#{selectedInquiry.inquiryReference}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase bg-[#1C1B17] text-[#B99A63]">
                {selectedInquiry.status}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono bg-[#1C1B17] p-3 rounded-lg mb-4">
              <div>
                <span className="text-stone-500">Client:</span>{' '}
                <span className="text-sm font-sans font-medium text-[#F6F1E8]">{selectedInquiry.guestName}</span>
              </div>
              <div>
                <span className="text-stone-500">Contact:</span> {selectedInquiry.guestPhone} • {selectedInquiry.guestEmail}
              </div>
              <div>
                <span className="text-stone-500">Event Type:</span> {selectedInquiry.eventType}
              </div>
              <div>
                <span className="text-stone-500">Guest Count:</span> {selectedInquiry.guestCount} Attendees
              </div>
              <div>
                <span className="text-stone-500">Target Date:</span> {selectedInquiry.preferredDate} ({selectedInquiry.preferredTime})
              </div>
              {selectedInquiry.budgetMinor && (
                <div>
                  <span className="text-stone-500">Budget:</span>{' '}
                  {(selectedInquiry.budgetMinor / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: selectedInquiry.currency || 'LKR',
                  })}
                </div>
              )}
            </div>

            {selectedInquiry.requirements && (
              <div className="p-3 rounded-lg bg-[#1C1B17] border border-[#2A2925] text-xs text-stone-300 mb-4">
                <strong className="text-stone-400 font-mono block mb-1">Client Requirements:</strong>
                {selectedInquiry.requirements}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#2A2925]">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono text-[#A5A198] hover:text-[#F6F1E8] bg-[#1E1D1A] hover:bg-[#2A2925] border border-[#2A2925] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
