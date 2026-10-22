'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  Table as TableIcon,
  Sparkles,
  ShoppingBag,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { useSocket } from '../../../../../context/SocketContext';
import { StaffStatusBadge } from '../../../../../components/staff/StaffStatusBadge';
import { ClientReservation, ReservationStatus } from '../../../../../types/reservation';
import { ClientOrder } from '../../../../../types/order';
import { apiClient } from '../../../../../lib/api';

function ReservationDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const { staff, loading: authLoading } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [reservation, setReservation] = useState<ClientReservation | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal Dialogs
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [dialogReason, setDialogReason] = useState('');

  // Modify Form State
  const [modDate, setModDate] = useState('');
  const [modTime, setModTime] = useState('');
  const [modGuests, setModGuests] = useState(2);
  const [modRequests, setModRequests] = useState('');
  const [modError, setModError] = useState<string | null>(null);

  const fetchReservation = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ success: boolean; data: ClientReservation }>(
        `/admin/reservations/${id}`
      );

      if (res?.success && res.data) {
        setReservation(res.data);
        setModDate(res.data.reservationDate);
        setModTime(res.data.reservationTime);
        setModGuests(res.data.guestCount);
        setModRequests(res.data.specialRequests || '');

        // Fetch related dine-in pre-orders linked to this reservation reference
        try {
          const ordersRes = await apiClient<{
            success: boolean;
            data: { orders: ClientOrder[] };
          }>(`/admin/orders?search=${encodeURIComponent(res.data.reservationReference)}`);
          if (ordersRes?.success && Array.isArray(ordersRes.data?.orders)) {
            setRelatedOrders(ordersRes.data.orders);
          }
        } catch {}
      } else {
        setError('Reservation record not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load reservation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, [id]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || !reservation) return;

    socket.emit('subscribe:reservation', {
      reservationReference: reservation.reservationReference,
    });

    const handleUpdate = (updated: ClientReservation) => {
      if (
        updated.id === reservation.id ||
        updated.reservationReference === reservation.reservationReference
      ) {
        setReservation(updated);
      }
    };

    socket.on('reservations.updated', handleUpdate);
    socket.on('reservations.confirmed', handleUpdate);
    socket.on('reservations.cancelled', handleUpdate);

    return () => {
      socket.off('reservations.updated', handleUpdate);
      socket.off('reservations.confirmed', handleUpdate);
      socket.off('reservations.cancelled', handleUpdate);
    };
  }, [socket, reservation]);

  const handleConfirm = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await apiClient<{ success: boolean; data: ClientReservation; message: string }>(
        `/admin/reservations/${id}/confirm`,
        { method: 'POST' }
      );
      if (res?.success) {
        setReservation(res.data);
        setFeedback(res.message || 'Reservation confirmed successfully.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to confirm reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await apiClient<{ success: boolean; data: ClientReservation; message: string }>(
        `/admin/reservations/${id}/reject`,
        {
          method: 'POST',
          data: { reason: dialogReason || 'Declined by administration' },
        }
      );
      if (res?.success) {
        setReservation(res.data);
        setShowRejectModal(false);
        setDialogReason('');
        setFeedback(res.message || 'Reservation request declined.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await apiClient<{ success: boolean; data: ClientReservation; message: string }>(
        `/admin/reservations/${id}/cancel`,
        {
          method: 'POST',
          data: { reason: dialogReason || 'Cancelled by staff' },
        }
      );
      if (res?.success) {
        setReservation(res.data);
        setShowCancelModal(false);
        setDialogReason('');
        setFeedback(res.message || 'Reservation cancelled.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setActionLoading(true);
      setModError(null);

      const res = await apiClient<{ success: boolean; data: ClientReservation; message: string }>(
        `/admin/reservations/${id}`,
        {
          method: 'PATCH',
          data: {
            date: modDate,
            time: modTime,
            guestCount: modGuests,
            specialRequests: modRequests,
          },
        }
      );

      if (res?.success) {
        setReservation(res.data);
        setShowModifyModal(false);
        setFeedback('Reservation modified successfully.');
      }
    } catch (err: any) {
      setModError(err.message || 'Failed to modify reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-[#B99A63]" />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-serif text-white">Record Not Found</h2>
        <p className="text-xs text-stone-400">{error || 'Unable to locate reservation dossier.'}</p>
        <Link
          href="/staff/admin/reservations"
          className="inline-flex items-center gap-1.5 text-xs text-[#B99A63] hover:underline uppercase tracking-wider font-mono"
        >
          <ArrowLeft size={13} />
          <span>Return to Reservation Directory</span>
        </Link>
      </div>
    );
  }

  const isPending = reservation.status === ReservationStatus.PENDING;
  const isConfirmed = reservation.status === ReservationStatus.CONFIRMED;

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <div>
        <Link
          href="/staff/admin/reservations"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white uppercase font-mono tracking-wider transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Reservation Directory</span>
        </Link>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Dossier Header */}
      <div
        className={`border rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-2xl font-bold text-[#B99A63] tracking-wide">
              {reservation.reservationReference}
            </span>
            <StaffStatusBadge status={reservation.status} />
            <span className="text-xs font-mono text-stone-400">
              Source: {reservation.source}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-stone-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-[#B99A63]" />
              <span className="text-white font-medium">{reservation.reservationDate}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-[#B99A63]" />
              <span className="text-white font-medium">{reservation.reservationTime}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users size={13} className="text-[#B99A63]" />
              <span className="text-white font-medium">{reservation.guestCount} Guests</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isPending && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirm}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-xl text-xs font-mono uppercase tracking-wider text-white transition-colors flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Confirm Booking</span>
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setShowRejectModal(true);
                  setDialogReason('');
                }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-xl text-xs font-mono uppercase tracking-wider text-stone-300 transition-colors flex items-center gap-1.5"
              >
                <X size={14} />
                <span>Reject</span>
              </button>
            </>
          )}

          {isConfirmed && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setShowModifyModal(true);
                  setModError(null);
                }}
                className="px-3.5 py-2 bg-[#252A35] hover:bg-stone-700 border border-[#2D3341] rounded-xl text-xs font-mono uppercase tracking-wider text-stone-200 transition-colors flex items-center gap-1.5"
              >
                <Edit2 size={13} className="text-[#B99A63]" />
                <span>Modify</span>
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setShowCancelModal(true);
                  setDialogReason('');
                }}
                className="px-3.5 py-2 bg-stone-800 hover:bg-red-950/60 border border-stone-600 hover:border-red-800/80 rounded-xl text-xs font-mono uppercase tracking-wider text-stone-300 hover:text-red-300 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Cancel</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={fetchReservation}
            className={`p-2 rounded-xl border transition-colors ${
              isDark
                ? 'border-[#2C2C28] hover:bg-stone-800 text-stone-300'
                : 'border-stone-300 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Information */}
          <div
            className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <h3
              className={`text-sm font-serif font-semibold tracking-wide uppercase font-mono ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              Guest Manifest Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">
                  GUEST NAME
                </span>
                <span className="text-white font-medium text-sm">
                  {reservation.guestName}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">
                  VENUE LOCATION
                </span>
                <span className="text-white font-medium">
                  {reservation.locationName}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">
                  CONTACT TELEPHONE
                </span>
                <span className="text-stone-200 flex items-center gap-1.5">
                  <Phone size={12} className="text-[#B99A63]" />
                  <span>{reservation.guestPhone}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">
                  CONFIRMATION EMAIL
                </span>
                <span className="text-stone-200 flex items-center gap-1.5">
                  <Mail size={12} className="text-[#B99A63]" />
                  <span>{reservation.guestEmail}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">
                  OCCASION
                </span>
                <span className="text-[#B99A63] font-medium">
                  {reservation.occasion || 'No occasion specified'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">
                  SEATING PREFERENCE
                </span>
                <span className="text-stone-200 font-medium">
                  {reservation.seatingPreference}
                </span>
              </div>
            </div>

            {reservation.specialRequests && (
              <div className="pt-3 border-t border-stone-800 text-xs">
                <span className="text-stone-400 block text-[10px] uppercase font-mono mb-1">
                  DIETARY RESTRICTIONS & SPECIAL REQUESTS
                </span>
                <p className="text-stone-200 bg-[#171715] p-3 rounded-xl border border-stone-800 leading-relaxed">
                  {reservation.specialRequests}
                </p>
              </div>
            )}
          </div>

          {/* Table Allocation */}
          <div
            className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-serif font-semibold tracking-wide uppercase font-mono ${
                  isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                }`}
              >
                Table & Floor Inventory Allocation
              </h3>
              <TableIcon className="w-4 h-4 text-[#B99A63]" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">
                  ASSIGNED TABLE(S)
                </span>
                <span className="font-mono text-base font-bold text-[#B99A63]">
                  {reservation.tableNumbers.length > 0
                    ? reservation.tableNumbers.join(', ')
                    : 'Awaiting Allocation'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">
                  STANDARD SITTING
                </span>
                <span className="text-white font-medium">
                  {reservation.durationMinutes} Minutes
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-stone-400 block text-[10px] uppercase font-mono">
                  VENUE TIMEZONE
                </span>
                <span className="text-stone-300 font-mono">
                  {reservation.timezone}
                </span>
              </div>
            </div>
          </div>

          {/* Related Dine-In Pre-Orders */}
          <div
            className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-serif font-semibold tracking-wide uppercase font-mono ${
                  isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                }`}
              >
                Linked Dine-In Pre-Orders (Stage 7)
              </h3>
              <ShoppingBag className="w-4 h-4 text-[#B99A63]" />
            </div>

            {relatedOrders.length === 0 ? (
              <p className="text-xs text-stone-400 italic">
                No food pre-orders currently linked to this dining reservation.
              </p>
            ) : (
              <div className="space-y-2">
                {relatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 bg-[#171715] border border-stone-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <Link
                        href={`/staff/admin/orders/${order.id}`}
                        className="font-mono text-[#B99A63] font-medium hover:underline"
                      >
                        {order.orderReference}
                      </Link>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        {order.items.length} items · Total: {order.currency} {(order.totalMinor / 100).toLocaleString()}
                      </div>
                    </div>
                    <StaffStatusBadge status={order.orderStatus} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status History & Timeline */}
        <div className="space-y-6">
          <div
            className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <h3
              className={`text-sm font-serif font-semibold tracking-wide uppercase font-mono ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              Reservation Lifecycle Timeline
            </h3>

            <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
              {(reservation.statusHistory || []).map((entry, idx) => (
                <div key={idx} className="relative pl-6 text-xs space-y-1">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#1E1E1B] border border-[#B99A63] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B99A63]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white uppercase text-[11px] tracking-wider">
                      {entry.status}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {new Date(entry.changedAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-stone-400 text-[11px] leading-relaxed">
                      {entry.note}
                    </p>
                  )}
                  <span className="text-[10px] text-[#B99A63] font-mono block">
                    By {entry.actorType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`w-full max-w-md border rounded-2xl p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-stone-300'
            }`}
          >
            <h3 className="text-base font-serif font-semibold text-white">
              Reject Reservation Request
            </h3>
            <p className="text-xs text-stone-400">
              Provide a reason for declining reservation {reservation.reservationReference}.
            </p>
            <input
              type="text"
              placeholder="Reason for declining..."
              value={dialogReason}
              onChange={(e) => setDialogReason(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-white'
                  : 'bg-stone-50 border-stone-200 text-stone-900'
              }`}
            />
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-mono uppercase text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-xl text-xs font-mono uppercase text-white"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`w-full max-w-md border rounded-2xl p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-stone-300'
            }`}
          >
            <h3 className="text-base font-serif font-semibold text-white">
              Cancel Reservation
            </h3>
            <p className="text-xs text-stone-400">
              Are you sure you want to cancel booking {reservation.reservationReference}? Table
              capacity will be immediately returned to inventory.
            </p>
            <input
              type="text"
              placeholder="Cancellation reason..."
              value={dialogReason}
              onChange={(e) => setDialogReason(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-white'
                  : 'bg-stone-50 border-stone-200 text-stone-900'
              }`}
            />
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-mono uppercase text-stone-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-stone-700 hover:bg-red-800 rounded-xl text-xs font-mono uppercase text-white transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg border rounded-2xl p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-stone-300'
            }`}
          >
            <h3 className="text-base font-serif font-semibold text-white">
              Reschedule / Modify Reservation
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1">
                  NEW DATE
                </label>
                <input
                  type="date"
                  value={modDate}
                  onChange={(e) => setModDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-white [color-scheme:dark]'
                      : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1">
                  NEW TIME
                </label>
                <select
                  value={modTime}
                  onChange={(e) => setModTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-white'
                      : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                >
                  <option value="6:00 PM">6:00 PM</option>
                  <option value="6:30 PM">6:30 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                  <option value="7:30 PM">7:30 PM</option>
                  <option value="8:00 PM">8:00 PM</option>
                  <option value="8:15 PM">8:15 PM</option>
                  <option value="8:30 PM">8:30 PM</option>
                  <option value="9:00 PM">9:00 PM</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1">
                  GUEST COUNT
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={modGuests}
                  onChange={(e) => setModGuests(parseInt(e.target.value, 10) || 1)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark
                      ? 'bg-[#171715] border-[#2C2C28] text-white'
                      : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-stone-400 block mb-1">
                SPECIAL REQUESTS
              </label>
              <textarea
                rows={2}
                value={modRequests}
                onChange={(e) => setModRequests(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none border resize-none ${
                  isDark
                    ? 'bg-[#171715] border-[#2C2C28] text-white'
                    : 'bg-stone-50 border-stone-200 text-stone-900'
                }`}
              />
            </div>

            {modError && (
              <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs">
                {modError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowModifyModal(false)}
                className="px-4 py-2 text-xs font-mono uppercase text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModifySubmit}
                className="px-4 py-2 bg-[#B99A63] hover:bg-[#a38652] text-[#111215] font-semibold rounded-xl text-xs font-mono uppercase"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReservationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[500px] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#B99A63]" />
        </div>
      }
    >
      <ReservationDetailContent />
    </Suspense>
  );
}
