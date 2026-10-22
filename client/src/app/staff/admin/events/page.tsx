'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import {
  IEventInquirySafeJSON,
  IEventProposalSafeJSON,
  IEventBookingSafeJSON,
  IVIPRoomSafeJSON,
  IPrivateDiningPackageSafeJSON,
  EventInquiryStatus,
  EventProposalStatus,
  EventBookingStatus,
} from '../../../../types/vip';
import { apiClient } from '../../../../lib/api';
import {
  GlassWater,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Send,
  Loader2,
  Sparkles,
  Phone,
  Mail,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

export default function AdminEventsPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const locationId = selectedLocation || 'loc-colombo-main';

  // Active Tab
  const [activeTab, setActiveTab] = useState<'inquiries' | 'bookings'>('inquiries');

  // Data states
  const [inquiries, setInquiries] = useState<IEventInquirySafeJSON[]>([]);
  const [bookings, setBookings] = useState<IEventBookingSafeJSON[]>([]);
  const [rooms, setRooms] = useState<IVIPRoomSafeJSON[]>([]);
  const [packages, setPackages] = useState<IPrivateDiningPackageSafeJSON[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Proposal Creation Modal
  const [proposalModalInquiry, setProposalModalInquiry] = useState<IEventInquirySafeJSON | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [proposalDate, setProposalDate] = useState('');
  const [proposalStartTime, setProposalStartTime] = useState('19:00');
  const [proposalEndTime, setProposalEndTime] = useState('22:00');
  const [proposalGuests, setProposalGuests] = useState(10);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [subtotalMajor, setSubtotalMajor] = useState(150000);
  const [taxMajor, setTaxMajor] = useState(15000);
  const [termsText, setTermsText] = useState(
    '50% deposit required upon confirmation. Cancellation within 48 hours is non-refundable.'
  );
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Private Sommelier Pairings',
    'Curated Tasting Menu',
  ]);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Quick helper to show toast
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [inqData, bookData, roomData, pkgData] = await Promise.all([
        apiClient<any>(
          `/api/admin/vip/inquiries?locationId=${encodeURIComponent(locationId)}`
        ),
        apiClient<any>(
          `/api/admin/vip/event-bookings?locationId=${encodeURIComponent(locationId)}`
        ),
        apiClient<any>(
          `/api/admin/vip/rooms?locationId=${encodeURIComponent(locationId)}`
        ),
        apiClient<any>(
          `/api/vip/packages?locationId=${encodeURIComponent(locationId)}`
        ),
      ]);

      setInquiries(inqData?.data || []);
      setBookings(bookData?.data || []);
      setRooms(roomData?.data || []);
      setPackages(pkgData?.data || []);
    } catch (err: any) {
      console.error('Failed to load events data:', err);
      setError(err?.message || 'Failed to fetch event data from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleEventUpdate = () => {
      loadData(true);
    };

    socket.on('events.inquiryCreated', handleEventUpdate);
    socket.on('events.proposalSent', handleEventUpdate);
    socket.on('events.proposalAccepted', handleEventUpdate);
    socket.on('events.bookingConfirmed', handleEventUpdate);

    return () => {
      socket.off('events.inquiryCreated', handleEventUpdate);
      socket.off('events.proposalSent', handleEventUpdate);
      socket.off('events.proposalAccepted', handleEventUpdate);
      socket.off('events.bookingConfirmed', handleEventUpdate);
    };
  }, [socket, loadData]);

  // Open Proposal Builder
  const handleOpenProposal = (inq: IEventInquirySafeJSON) => {
    setProposalModalInquiry(inq);
    setSelectedRoomId(inq.preferredRoomId || (rooms[0] ? rooms[0].id : ''));
    setProposalDate(inq.preferredDate || new Date().toISOString().slice(0, 10));
    setProposalStartTime(inq.preferredTime || '19:00');
    setProposalEndTime('22:00');
    setProposalGuests(inq.guestCount || 10);
    if (inq.budgetMinor) {
      setSubtotalMajor(Math.round((inq.budgetMinor / 100) * 0.9));
      setTaxMajor(Math.round((inq.budgetMinor / 100) * 0.1));
    } else {
      setSubtotalMajor(150000);
      setTaxMajor(15000);
    }
  };

  // Submit Proposal
  const handleCreateProposal = async () => {
    if (!proposalModalInquiry || !selectedRoomId) {
      alert('Please select a VIP room for this proposal.');
      return;
    }

    setIsSubmittingProposal(true);
    try {
      const startAt = new Date(`${proposalDate}T${proposalStartTime}:00Z`).toISOString();
      const endAt = new Date(`${proposalDate}T${proposalEndTime}:00Z`).toISOString();
      const totalMajor = subtotalMajor + taxMajor;
      const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();

      const payload = {
        inquiryId: proposalModalInquiry.id,
        roomId: selectedRoomId,
        startAt,
        endAt,
        guestCount: proposalGuests,
        packageId: selectedPackageId || null,
        servicesSnapshot: selectedServices,
        subtotalMinor: Math.round(subtotalMajor * 100),
        taxMinor: Math.round(taxMajor * 100),
        totalMinor: Math.round(totalMajor * 100),
        currency: 'LKR',
        terms: termsText,
        expiresAt,
      };

      await apiClient<any>('/api/admin/vip/proposals', {
        method: 'POST',
        data: payload,
      });
      showToast(`Proposal sent successfully for inquiry ${proposalModalInquiry.inquiryReference}`);
      setProposalModalInquiry(null);
      loadData(true);
    } catch (err: any) {
      console.error('Failed to create proposal:', err);
      alert(err?.message || 'Failed to generate proposal.');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Update Inquiry Status (e.g. Under Review or Declined)
  const handleUpdateInquiryStatus = async (id: string, status: EventInquiryStatus) => {
    try {
      await apiClient<any>(`/api/admin/vip/inquiries/${id}/status`, {
        method: 'PATCH',
        data: { status },
      });
      showToast(`Inquiry status updated to ${status}`);
      loadData(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to update inquiry status.');
    }
  };

  // Accept Proposal
  const handleAcceptProposal = async (proposalId: string) => {
    try {
      await apiClient<any>(`/api/admin/vip/proposals/${proposalId}/accept`, {
        method: 'POST',
      });
      showToast('Proposal accepted! Confirmed event booking created and VIP room slots claimed.');
      loadData(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to accept proposal.');
    }
  };

  // Filtered Inquiries
  const filteredInquiries = inquiries.filter((inq) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = inq.guestName.toLowerCase().includes(q);
      const matchRef = inq.inquiryReference.toLowerCase().includes(q);
      const matchEvent = inq.eventType.toLowerCase().includes(q);
      const matchEmail = inq.guestEmail.toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchEvent && !matchEmail) return false;
    }
    if (statusFilter !== 'ALL' && inq.status !== statusFilter) return false;
    return true;
  });

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="space-y-6">
        {/* Header */}
        <StaffPageHeader
          title="Banqueting & Private Events"
          subtitle="Manage corporate banquets, tasting salon inquiries, custom proposals, and confirmed bookings."
          actions={
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className={`p-2.5 rounded-lg border transition-all ${
                isDark
                  ? 'border-[#22211E] bg-[#141412] hover:bg-[#1E1E1C] text-stone-300'
                  : 'border-[#E5DFD3] bg-white hover:bg-stone-50 text-stone-700'
              }`}
              title="Refresh Event Ledger"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          }
        />

        {/* Toast */}
        {toastMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                New Inquiries
              </span>
              <FileText size={16} className="text-[#B99A63]" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-stone-100">
              {inquiries.filter((i) => i.status === EventInquiryStatus.NEW).length}
            </p>
            <span className="text-[11px] text-stone-400">Awaiting concierge review</span>
          </div>

          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Proposals Sent
              </span>
              <Send size={16} className="text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-amber-400">
              {inquiries.filter((i) => i.status === EventInquiryStatus.PROPOSAL_SENT).length}
            </p>
            <span className="text-[11px] text-stone-400">Active quotes under consideration</span>
          </div>

          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Confirmed Events
              </span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-emerald-400">{bookings.length}</p>
            <span className="text-[11px] text-stone-400">Exclusive room slots reserved</span>
          </div>

          <div
            className={`p-5 rounded-xl border transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
                Total Inquiries
              </span>
              <GlassWater size={16} className="text-[#B99A63]" />
            </div>
            <p className="mt-2 text-2xl font-serif font-bold text-stone-100">{inquiries.length}</p>
            <span className="text-[11px] text-stone-400">Lifetime event requests</span>
          </div>
        </div>

        {/* Tab Switcher & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-stone-900/60 border border-stone-800 w-fit">
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'inquiries'
                  ? 'bg-[#B99A63] text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Event Inquiries ({inquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'bookings'
                  ? 'bg-[#B99A63] text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Confirmed Bookings ({bookings.length})
            </button>
          </div>

          {activeTab === 'inquiries' && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search guest, ref, event..."
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100 focus:border-[#B99A63]'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 focus:border-[#B99A63]'
                  }`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg text-xs outline-none cursor-pointer border ${
                  isDark
                    ? 'bg-[#1C1B18] border-[#2B2A26] text-stone-200'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <option value="ALL">All Statuses</option>
                <option value={EventInquiryStatus.NEW}>New</option>
                <option value={EventInquiryStatus.UNDER_REVIEW}>Under Review</option>
                <option value={EventInquiryStatus.PROPOSAL_SENT}>Proposal Sent</option>
                <option value={EventInquiryStatus.ACCEPTED}>Accepted</option>
                <option value={EventInquiryStatus.DECLINED}>Declined</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Inquiries List */}
        {activeTab === 'inquiries' && (
          <div
            className={`rounded-2xl border overflow-hidden transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-stone-400">
                <Loader2 size={32} className="animate-spin text-[#B99A63]" />
                <p className="text-xs uppercase tracking-wider">Loading event inquiries...</p>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="p-16 text-center text-stone-400 space-y-2">
                <GlassWater size={36} className="mx-auto text-stone-600" />
                <p className="text-sm font-serif">No event inquiries matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[10.5px] uppercase tracking-wider font-semibold ${
                        isDark
                          ? 'border-[#22211E] text-stone-400 bg-[#171715]'
                          : 'border-[#E5DFD3] text-stone-500 bg-stone-50'
                      }`}
                    >
                      <th className="py-3.5 px-4">Reference & Guest</th>
                      <th className="py-3.5 px-4">Event Type</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Guests & Budget</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y text-xs ${
                      isDark ? 'divide-[#22211E] text-stone-200' : 'divide-[#E5DFD3] text-stone-800'
                    }`}
                  >
                    {filteredInquiries.map((inq) => {
                      const budgetDisplay = inq.budgetMinor
                        ? `${inq.currency} ${(inq.budgetMinor / 100).toLocaleString()}`
                        : 'Custom Quote';

                      return (
                        <tr
                          key={inq.id}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-[#1A1A18]' : 'hover:bg-stone-50/80'
                          }`}
                        >
                          {/* Guest & Reference */}
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-mono text-[10px] text-[#B99A63] font-semibold">
                                {inq.inquiryReference}
                              </div>
                              <div className="font-serif font-medium text-stone-100 text-sm mt-0.5">
                                {inq.guestName}
                              </div>
                              <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                                <span>{inq.guestEmail}</span>
                                <span>•</span>
                                <span>{inq.guestPhone}</span>
                              </div>
                            </div>
                          </td>

                          {/* Event Type */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-medium text-stone-200">{inq.eventType}</span>
                            {inq.requirements && (
                              <p className="text-[11px] text-stone-400 truncate max-w-xs mt-0.5">
                                {inq.requirements}
                              </p>
                            )}
                          </td>

                          {/* Date & Time */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-stone-300">
                              <Calendar size={13} className="text-[#B99A63]" />
                              <span>{inq.preferredDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
                              <Clock size={12} />
                              <span>{inq.preferredTime}</span>
                            </div>
                          </td>

                          {/* Guests & Budget */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-stone-300">
                              <Users size={13} className="text-[#B99A63]" />
                              <span>{inq.guestCount} Guests</span>
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">
                              Budget: {budgetDisplay}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {inq.status === EventInquiryStatus.NEW && (
                              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                New Inquiry
                              </span>
                            )}
                            {inq.status === EventInquiryStatus.UNDER_REVIEW && (
                              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Under Review
                              </span>
                            )}
                            {inq.status === EventInquiryStatus.PROPOSAL_SENT && (
                              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                Proposal Sent
                              </span>
                            )}
                            {inq.status === EventInquiryStatus.ACCEPTED && (
                              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Accepted
                              </span>
                            )}
                            {inq.status === EventInquiryStatus.DECLINED && (
                              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                Declined
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {inq.status === EventInquiryStatus.NEW && (
                                <button
                                  onClick={() =>
                                    handleUpdateInquiryStatus(inq.id, EventInquiryStatus.UNDER_REVIEW)
                                  }
                                  className="px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium"
                                  title="Mark as reviewing requirements"
                                >
                                  Review
                                </button>
                              )}

                              {inq.status !== EventInquiryStatus.ACCEPTED &&
                                inq.status !== EventInquiryStatus.DECLINED && (
                                  <button
                                    onClick={() => handleOpenProposal(inq)}
                                    className="px-3 py-1.5 rounded bg-[#B99A63] hover:bg-[#A88952] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                                  >
                                    <Send size={12} />
                                    <span>
                                      {inq.status === EventInquiryStatus.PROPOSAL_SENT
                                        ? 'Update Proposal'
                                        : 'Create Proposal'}
                                    </span>
                                  </button>
                                )}

                              {inq.activeProposalId &&
                                inq.status === EventInquiryStatus.PROPOSAL_SENT && (
                                  <button
                                    onClick={() => handleAcceptProposal(inq.activeProposalId!)}
                                    className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1"
                                    title="Confirm event and atomically allocate room"
                                  >
                                    <Check size={12} />
                                    <span>Confirm</span>
                                  </button>
                                )}

                              {inq.status !== EventInquiryStatus.DECLINED &&
                                inq.status !== EventInquiryStatus.ACCEPTED && (
                                  <button
                                    onClick={() =>
                                      handleUpdateInquiryStatus(inq.id, EventInquiryStatus.DECLINED)
                                    }
                                    className="p-1.5 rounded text-stone-500 hover:text-rose-400"
                                    title="Decline inquiry"
                                  >
                                    <XCircle size={15} />
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Confirmed Bookings List */}
        {activeTab === 'bookings' && (
          <div
            className={`rounded-2xl border overflow-hidden transition-all ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-white shadow-sm'
            }`}
          >
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-stone-400">
                <Loader2 size={32} className="animate-spin text-[#B99A63]" />
                <p className="text-xs uppercase tracking-wider">Loading confirmed events...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-16 text-center text-stone-400 space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-stone-600" />
                <p className="text-sm font-serif">No confirmed private events yet.</p>
                <p className="text-xs text-stone-500">
                  Confirmed bookings appear here once an event proposal is accepted.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[10.5px] uppercase tracking-wider font-semibold ${
                        isDark
                          ? 'border-[#22211E] text-stone-400 bg-[#171715]'
                          : 'border-[#E5DFD3] text-stone-500 bg-stone-50'
                      }`}
                    >
                      <th className="py-3.5 px-4">Event Ref & Host</th>
                      <th className="py-3.5 px-4">Allocated VIP Salon</th>
                      <th className="py-3.5 px-4">Scheduled Window</th>
                      <th className="py-3.5 px-4">Guests</th>
                      <th className="py-3.5 px-4">Agreed Total</th>
                      <th className="py-3.5 px-4">Payment</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y text-xs ${
                      isDark ? 'divide-[#22211E] text-stone-200' : 'divide-[#E5DFD3] text-stone-800'
                    }`}
                  >
                    {bookings.map((b) => {
                      const totalFormatted = `${b.currency} ${(b.agreedTotalMinor / 100).toLocaleString()}`;
                      const start = new Date(b.startAt).toLocaleString();
                      const end = new Date(b.endAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr
                          key={b.id}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-[#1A1A18]' : 'hover:bg-stone-50/80'
                          }`}
                        >
                          <td className="py-4 px-4">
                            <span className="font-mono text-[10px] text-[#B99A63] font-semibold">
                              {b.eventReference}
                            </span>
                            <div className="font-serif font-medium text-stone-100 text-sm">
                              {b.guestName}
                            </div>
                            <div className="text-[11px] text-stone-400">{b.eventType}</div>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-medium text-stone-200">
                              {b.roomName || 'Private Salon'}
                            </span>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-stone-300">
                              <Calendar size={13} className="text-[#B99A63]" />
                              <span>{start}</span>
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">Until {end}</div>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-stone-300">
                              <Users size={13} className="text-[#B99A63]" />
                              <span>{b.guestCount} Guests</span>
                            </div>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-semibold text-[#B99A63]">{totalFormatted}</span>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {b.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Proposal Creation Modal */}
        {proposalModalInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
              className={`max-w-2xl w-full rounded-2xl border p-6 space-y-5 max-h-[90vh] overflow-y-auto ${
                isDark ? 'bg-[#171715] border-[#22211E]' : 'bg-white border-[#E5DFD3]'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-4 border-stone-800">
                <div>
                  <h3 className="font-serif text-lg font-medium text-stone-100 flex items-center gap-2">
                    <Sparkles size={16} className="text-[#B99A63]" />
                    <span>Create Event Proposal</span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    For {proposalModalInquiry.guestName} ({proposalModalInquiry.inquiryReference})
                  </p>
                </div>
                <button
                  onClick={() => setProposalModalInquiry(null)}
                  className="p-1 rounded text-stone-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Inquiry Brief Summary */}
              <div className="p-3.5 rounded-xl bg-stone-900/50 border border-stone-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block">Event Type</span>
                  <span className="font-medium text-stone-200">{proposalModalInquiry.eventType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block">Requested Date</span>
                  <span className="font-medium text-stone-200">
                    {proposalModalInquiry.preferredDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block">Guest Count</span>
                  <span className="font-medium text-stone-200">
                    {proposalModalInquiry.guestCount} Guests
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-stone-400 block">Target Budget</span>
                  <span className="font-medium text-[#B99A63]">
                    {proposalModalInquiry.budgetMinor
                      ? `LKR ${(proposalModalInquiry.budgetMinor / 100).toLocaleString()}`
                      : 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Room Selection */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5 font-medium">
                  Allocated VIP Salon *
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs outline-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                      : 'bg-stone-50 border border-stone-200 text-stone-900'
                  }`}
                >
                  <option value="">Select a private salon...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Capacity: {r.capacityMin}-{r.capacityMax} Guests, Min Spend: LKR{' '}
                      {(r.minimumSpendMinor / 100).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={proposalDate}
                    onChange={(e) => setProposalDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={proposalStartTime}
                    onChange={(e) => setProposalStartTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={proposalEndTime}
                    onChange={(e) => setProposalEndTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              {/* Package Selection */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1.5 font-medium">
                  Private Dining Package (Optional)
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs outline-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                      : 'bg-stone-50 border border-stone-200 text-stone-900'
                  }`}
                >
                  <option value="">No pre-set package (Bespoke a la carte quote)</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (LKR {(p.priceMinor / 100).toLocaleString()} per guest)
                    </option>
                  ))}
                </select>
              </div>

              {/* Financial Calculation */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-stone-900/40 border border-stone-800">
                <div>
                  <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                    Subtotal (LKR)
                  </label>
                  <input
                    type="number"
                    value={subtotalMajor}
                    onChange={(e) => setSubtotalMajor(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                    Taxes & Service (LKR)
                  </label>
                  <input
                    type="number"
                    value={taxMajor}
                    onChange={(e) => setTaxMajor(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none ${
                      isDark
                        ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                        : 'bg-stone-50 border border-stone-200 text-stone-900'
                    }`}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                    Agreed Total (LKR)
                  </span>
                  <div className="px-3 py-2 rounded-lg bg-stone-900 text-sm font-bold text-[#B99A63] border border-stone-800">
                    LKR {(subtotalMajor + taxMajor).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1 font-medium">
                  Proposal Terms & Expiration
                </label>
                <textarea
                  rows={2}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs outline-none resize-none ${
                    isDark
                      ? 'bg-[#1C1B18] border border-[#2B2A26] text-stone-100'
                      : 'bg-stone-50 border border-stone-200 text-stone-900'
                  }`}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setProposalModalInquiry(null)}
                  className="px-4 py-2 rounded-lg border border-stone-700 text-stone-300 text-xs hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingProposal}
                  onClick={handleCreateProposal}
                  className="px-5 py-2.5 rounded-lg bg-[#B99A63] hover:bg-[#A88952] text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md"
                >
                  {isSubmittingProposal ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>Issue & Send Proposal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
