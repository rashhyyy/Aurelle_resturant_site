"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Loader2,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { apiClient } from "../../../lib/api";
import { ClientReservation, ReservationStatus } from "../../../types/reservation";
import { useSocket } from "../../../context/SocketContext";

export default function CustomerReservationsPage() {
  const { socket } = useSocket();
  const [reservations, setReservations] = useState<ClientReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming");

  // Cancellation State
  const [cancellingRes, setCancellingRes] = useState<ClientReservation | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Modification State
  const [modifyingRes, setModifyingRes] = useState<ClientReservation | null>(null);
  const [modDate, setModDate] = useState("");
  const [modTime, setModTime] = useState("");
  const [modGuests, setModGuests] = useState(2);
  const [modRequests, setModRequests] = useState("");
  const [modLoading, setModLoading] = useState(false);
  const [modError, setModError] = useState<string | null>(null);
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    setMinDate(new Date().toISOString().split("T")[0]);
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        timeFilter: tab,
        limit: "50",
      });

      const res = await apiClient<{
        success: boolean;
        data: { reservations: ClientReservation[]; total: number };
      }>(`/reservations/my?${params.toString()}`);

      if (res?.success && Array.isArray(res.data?.reservations)) {
        setReservations(res.data.reservations);
      } else {
        setReservations([]);
      }
    } catch (err: any) {
      if (err.message?.includes("sign in")) {
        setError("Please sign in to view your reservation history.");
      } else {
        setError(err.message || "Failed to load reservations.");
      }
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchReservations();
    };
    socket.on("reservations.created", handleUpdate);
    socket.on("reservations.updated", handleUpdate);
    socket.on("reservations.cancelled", handleUpdate);
    socket.on("reservations.confirmed", handleUpdate);

    return () => {
      socket.off("reservations.created", handleUpdate);
      socket.off("reservations.updated", handleUpdate);
      socket.off("reservations.cancelled", handleUpdate);
      socket.off("reservations.confirmed", handleUpdate);
    };
  }, [socket, fetchReservations]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingRes) return;
    try {
      setCancelLoading(true);
      setCancelError(null);

      await apiClient(`/reservations/my/${cancellingRes.id}/cancel`, {
        method: "POST",
        data: { reason: cancelReason || "Cancelled by guest online" },
      });

      setCancellingRes(null);
      setCancelReason("");
      fetchReservations();
    } catch (err: any) {
      setCancelError(err.message || "Unable to cancel reservation.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyingRes) return;
    try {
      setModLoading(true);
      setModError(null);

      await apiClient(`/reservations/my/${modifyingRes.id}`, {
        method: "PATCH",
        data: {
          date: modDate,
          time: modTime,
          guestCount: modGuests,
          specialRequests: modRequests,
        },
      });

      setModifyingRes(null);
      fetchReservations();
    } catch (err: any) {
      setModError(err.message || "Unable to modify reservation.");
    } finally {
      setModLoading(false);
    }
  };

  const openModifyModal = (res: ClientReservation) => {
    setModifyingRes(res);
    setModDate(res.reservationDate);
    setModTime(res.reservationTime);
    setModGuests(res.guestCount);
    setModRequests(res.specialRequests || "");
    setModError(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
          <div>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-1.5 text-xs text-[#C1A87D] hover:underline uppercase tracking-wider font-medium mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Book Another Table</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-serif font-normal text-white tracking-tight">
              My Dining Manifest
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm mt-1">
              Review and manage your upcoming dining experiences and past visits at Aurelle.
            </p>
          </div>

          {/* Tab Filter */}
          <div className="flex bg-[#181B22] border border-[#272B35] rounded-[2px] p-1 self-start sm:self-auto">
            {(["upcoming", "past", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-[2px] transition-colors ${
                  tab === t
                    ? "bg-[#C1A87D] text-[#111215] font-semibold"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#C1A87D] mx-auto" />
            <div className="text-xs text-stone-400 uppercase tracking-widest">
              Consulting Manifest...
            </div>
          </div>
        ) : error ? (
          <div className="p-8 bg-[#181A20] border border-stone-800 rounded-[2px] text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <div className="text-stone-300 text-sm font-medium">{error}</div>
            <Link
              href="/reservations"
              className="inline-block bg-[#C1A87D] text-[#111215] text-xs font-semibold uppercase tracking-widest px-6 py-2.5 rounded-[2px]"
            >
              Reserve a Table
            </Link>
          </div>
        ) : reservations.length === 0 ? (
          <div className="py-16 text-center bg-[#17191E]/60 border border-stone-800/80 rounded-[2px] p-8 space-y-4">
            <Calendar className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-lg font-serif text-white">No {tab} reservations found</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              You do not have any {tab === "all" ? "" : tab} table reservations on record.
            </p>
            <div className="pt-2">
              <Link
                href="/reservations"
                className="bg-[#F6F2EB] hover:bg-white text-[#15161A] text-xs font-semibold tracking-[0.16em] uppercase px-7 py-3 rounded-[2px] transition-colors inline-block"
              >
                Reserve Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => {
              const isConfirmed = res.status === ReservationStatus.CONFIRMED;
              const isPending = res.status === ReservationStatus.PENDING;
              const isCancelled = res.status === ReservationStatus.CANCELLED;

              return (
                <div
                  key={res.id}
                  className="bg-[#17191E]/95 border border-[#272B35] rounded-[2px] p-6 transition-all hover:border-stone-600 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-bold text-[#C1A87D] tracking-wider">
                          {res.reservationReference}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-[2px] text-[10px] font-semibold uppercase tracking-wider ${
                            isConfirmed
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                              : isPending
                                ? "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                                : isCancelled
                                  ? "bg-stone-800 text-stone-400"
                                  : "bg-blue-950/60 text-blue-300"
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C1A87D]" />
                        <span>{res.locationName}</span>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-2">
                      {res.canModify && (
                        <button
                          type="button"
                          onClick={() => openModifyModal(res)}
                          className="px-3 py-1.5 bg-[#1F232B] hover:bg-stone-700 border border-[#2D3340] rounded-[2px] text-xs text-stone-200 flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-[#C1A87D]" />
                          <span>Modify</span>
                        </button>
                      )}
                      {res.canCancel && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingRes(res);
                            setCancelError(null);
                          }}
                          className="px-3 py-1.5 bg-[#1F232B] hover:bg-red-950/40 border border-[#2D3340] hover:border-red-800/60 rounded-[2px] text-xs text-stone-300 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                        DATE
                      </span>
                      <span className="text-white font-medium">{res.reservationDate}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                        TIME
                      </span>
                      <span className="text-white font-medium">{res.reservationTime}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                        PARTY SIZE
                      </span>
                      <span className="text-white font-medium">{res.guestCount} Guests</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                        SEATING / TABLE
                      </span>
                      <span className="text-white font-medium">
                        {res.tableNumbers.length > 0 ? (
                          <span className="font-mono text-[#C1A87D]">{res.tableNumbers.join(", ")}</span>
                        ) : (
                          res.seatingPreference
                        )}
                      </span>
                    </div>
                  </div>

                  {res.specialRequests && (
                    <div className="pt-3 border-t border-stone-800/80 text-xs text-stone-400">
                      <span className="text-stone-400 font-medium">Requests: </span>
                      <span>{res.specialRequests}</span>
                    </div>
                  )}

                  {res.cancellationReason && (
                    <div className="pt-2 text-xs text-stone-400 italic">
                      Cancellation note: {res.cancellationReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Dialog Modal */}
      <AnimatePresence>
        {cancellingRes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#17191E] border border-stone-700 rounded-[2px] p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-serif text-white">Cancel Reservation?</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Are you sure you wish to cancel reservation{" "}
                <span className="font-mono text-[#C1A87D] font-bold">
                  {cancellingRes.reservationReference}
                </span>{" "}
                for {cancellingRes.guestCount} guests on {cancellingRes.reservationDate} at{" "}
                {cancellingRes.reservationTime}?
              </p>

              <div>
                <label className="text-[10.5px] uppercase tracking-wider text-stone-400 block mb-1.5">
                  REASON FOR CANCELLATION
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="E.g. Plans changed, flight delayed..."
                  className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-3.5 py-2.5 text-xs text-stone-200 outline-none focus:border-[#C1A87D]"
                />
              </div>

              {cancelError && (
                <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded-[2px] text-red-200 text-xs">
                  {cancelError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={() => setCancellingRes(null)}
                  className="px-4 py-2 border border-stone-700 hover:border-white rounded-[2px] text-xs font-semibold uppercase tracking-wider text-stone-300 transition-colors"
                >
                  Nevermind
                </button>
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={handleCancelSubmit}
                  className="px-5 py-2 bg-red-800 hover:bg-red-700 rounded-[2px] text-xs font-semibold uppercase tracking-wider text-white transition-colors flex items-center gap-1.5"
                >
                  {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modification Modal */}
      <AnimatePresence>
        {modifyingRes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#17191E] border border-stone-700 rounded-[2px] p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-lg font-serif text-white">Modify Reservation</h3>
                <span className="font-mono text-xs text-[#C1A87D]">
                  {modifyingRes.reservationReference}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                    NEW DATE
                  </label>
                  <input
                    type="date"
                    min={minDate || undefined}
                    value={modDate}
                    onChange={(e) => setModDate(e.target.value)}
                    className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-3 py-2 text-xs text-stone-200 outline-none focus:border-[#C1A87D] [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                    NEW TIME
                  </label>
                  <select
                    value={modTime}
                    onChange={(e) => setModTime(e.target.value)}
                    className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-3 py-2 text-xs text-stone-200 outline-none focus:border-[#C1A87D]"
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
                  <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                    GUEST COUNT
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={modGuests}
                    onChange={(e) => setModGuests(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] px-3 py-2 text-xs text-stone-200 outline-none focus:border-[#C1A87D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                  SPECIAL REQUESTS
                </label>
                <textarea
                  rows={2}
                  value={modRequests}
                  onChange={(e) => setModRequests(e.target.value)}
                  className="w-full bg-[#1F232B] border border-[#2D3340] rounded-[2px] p-2.5 text-xs text-stone-200 outline-none focus:border-[#C1A87D] resize-none"
                />
              </div>

              {modError && (
                <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded-[2px] text-red-200 text-xs">
                  {modError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  disabled={modLoading}
                  onClick={() => setModifyingRes(null)}
                  className="px-4 py-2 border border-stone-700 hover:border-white rounded-[2px] text-xs font-semibold uppercase tracking-wider text-stone-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={modLoading}
                  onClick={handleModifySubmit}
                  className="px-5 py-2 bg-[#F6F2EB] hover:bg-white text-[#15161A] rounded-[2px] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  {modLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
