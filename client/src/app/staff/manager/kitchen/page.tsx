'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Utensils,
  Eye,
  X,
  Flame,
} from 'lucide-react';

interface KitchenTicket {
  id: string;
  orderReference: string;
  customerName: string;
  orderType: string;
  orderStatus: string;
  items: Array<{
    dishName: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  createdAt: string;
  scheduledFor?: string;
  elapsedMinutes: number;
  isDelayed: boolean;
  urgency: 'NORMAL' | 'MEDIUM' | 'HIGH';
}

interface KitchenMonitoringData {
  locationId: string;
  counts: {
    new: number;
    preparing: number;
    ready: number;
    scheduled: number;
    totalActive: number;
  };
  tickets: {
    new: KitchenTicket[];
    preparing: KitchenTicket[];
    ready: KitchenTicket[];
    scheduled: KitchenTicket[];
  };
}

export default function ManagerKitchenPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const [data, setData] = useState<KitchenMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<KitchenTicket | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchKitchen = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await apiClient<{ success: boolean; data: KitchenMonitoringData }>(
          `/manager/kitchen?locationId=${locationId}`
        );
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        console.error('Failed to load kitchen monitoring:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId]
  );

  useEffect(() => {
    fetchKitchen();
  }, [fetchKitchen]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchKitchen();
    socket.on('order:created', handleUpdate);
    socket.on('order:status_changed', handleUpdate);
    socket.on('kitchen:order_updated', handleUpdate);
    return () => {
      socket.off('order:created', handleUpdate);
      socket.off('order:status_changed', handleUpdate);
      socket.off('kitchen:order_updated', handleUpdate);
    };
  }, [socket, fetchKitchen]);

  const renderTicketCard = (ticket: KitchenTicket) => (
    <div
      key={ticket.id}
      onClick={() => setSelectedTicket(ticket)}
      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        ticket.isDelayed
          ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400'
          : isDark
          ? 'bg-[#181714] border-[#2A2925] hover:border-[#B99A63]/50'
          : 'bg-white border-stone-200 hover:border-[#B99A63] shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm font-semibold text-[#F6F1E8]">
          #{ticket.orderReference}
        </span>
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Clock size={12} className={ticket.isDelayed ? 'text-rose-400' : 'text-stone-400'} />
          <span
            className={
              ticket.isDelayed
                ? 'text-rose-400 font-semibold'
                : ticket.elapsedMinutes > 15
                ? 'text-amber-400'
                : 'text-stone-400'
            }
          >
            {ticket.elapsedMinutes}m
          </span>
          {ticket.isDelayed && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/30 text-rose-300 font-semibold">
              DELAYED
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-stone-300 font-medium mb-2 truncate">
        {ticket.customerName}
      </div>

      <div className="space-y-1 mb-3">
        {ticket.items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="text-xs text-stone-400 flex items-center justify-between">
            <span className="truncate">
              <span className="font-mono text-[#B99A63] font-semibold mr-1.5">
                {item.quantity}x
              </span>
              {item.dishName}
            </span>
            {item.specialInstructions && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Special instructions" />
            )}
          </div>
        ))}
        {ticket.items.length > 3 && (
          <div className="text-[11px] font-mono text-stone-500">
            +{ticket.items.length - 3} more items...
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#2A2925] text-[11px] font-mono">
        <span className="text-stone-500">{ticket.orderType}</span>
        <span className="text-[#B99A63] font-medium flex items-center gap-1">
          <Eye size={12} /> View Ticket
        </span>
      </div>
    </div>
  );

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Kitchen Operations"
        description="Monitor culinary dispatch pipeline, preparation bottlenecks, and station handoff pacing."
        onRefresh={() => fetchKitchen(true)}
        refreshing={refreshing}
      />

      {/* Pipeline Summary Bar */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 font-mono text-xs">
          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/15">
            <div className="text-stone-400 uppercase tracking-wider text-[11px]">New / Confirmed</div>
            <div className="text-2xl font-serif text-blue-400 font-semibold mt-1">
              {data.counts.new} Tickets
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/15">
            <div className="text-stone-400 uppercase tracking-wider text-[11px]">In Preparation</div>
            <div className="text-2xl font-serif text-amber-400 font-semibold mt-1">
              {data.counts.preparing} Tickets
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/15">
            <div className="text-stone-400 uppercase tracking-wider text-[11px]">Ready for Handoff</div>
            <div className="text-2xl font-serif text-emerald-400 font-semibold mt-1">
              {data.counts.ready} Tickets
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/15">
            <div className="text-stone-400 uppercase tracking-wider text-[11px]">Scheduled Pre-Orders</div>
            <div className="text-2xl font-serif text-purple-400 font-semibold mt-1">
              {data.counts.scheduled} Tickets
            </div>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 text-center text-stone-500 font-mono text-sm">
          <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading kitchen pipelines...
        </div>
      ) : data ? (
        /* 4 Columns Pipeline */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Column 1: New / Confirmed */}
          <div className="flex flex-col rounded-xl border border-[#2A2925] bg-[#141412] p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2925] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h3 className="font-serif text-base text-[#F6F1E8]">New Orders</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#1C1B17] text-stone-400">
                {data.tickets.new.length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
              {data.tickets.new.length === 0 ? (
                <div className="text-center py-10 text-stone-600 text-xs font-mono">
                  No pending new orders
                </div>
              ) : (
                data.tickets.new.map(renderTicketCard)
              )}
            </div>
          </div>

          {/* Column 2: In Preparation */}
          <div className="flex flex-col rounded-xl border border-[#2A2925] bg-[#141412] p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2925] mb-3">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-amber-400" />
                <h3 className="font-serif text-base text-[#F6F1E8]">Preparing</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#1C1B17] text-amber-400 font-semibold">
                {data.tickets.preparing.length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
              {data.tickets.preparing.length === 0 ? (
                <div className="text-center py-10 text-stone-600 text-xs font-mono">
                  No orders currently cooking
                </div>
              ) : (
                data.tickets.preparing.map(renderTicketCard)
              )}
            </div>
          </div>

          {/* Column 3: Ready for Handoff */}
          <div className="flex flex-col rounded-xl border border-[#2A2925] bg-[#141412] p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2925] mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <h3 className="font-serif text-base text-[#F6F1E8]">Food Ready</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#1C1B17] text-emerald-400 font-semibold">
                {data.tickets.ready.length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
              {data.tickets.ready.length === 0 ? (
                <div className="text-center py-10 text-stone-600 text-xs font-mono">
                  No ready orders awaiting dispatch
                </div>
              ) : (
                data.tickets.ready.map(renderTicketCard)
              )}
            </div>
          </div>

          {/* Column 4: Scheduled Pre-Orders */}
          <div className="flex flex-col rounded-xl border border-[#2A2925] bg-[#141412] p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2925] mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-purple-400" />
                <h3 className="font-serif text-base text-[#F6F1E8]">Scheduled</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#1C1B17] text-purple-400 font-semibold">
                {data.tickets.scheduled.length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
              {data.tickets.scheduled.length === 0 ? (
                <div className="text-center py-10 text-stone-600 text-xs font-mono">
                  No upcoming scheduled orders
                </div>
              ) : (
                data.tickets.scheduled.map(renderTicketCard)
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Ticket Inspection Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#141412] border border-[#B99A63]/30 rounded-xl shadow-2xl p-6 text-[#F6F1E8]">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-[#F6F1E8]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between border-b border-[#2A2925] pb-4 mb-4">
              <div>
                <span className="text-xs font-mono text-[#B99A63] uppercase tracking-wider">Kitchen Ticket</span>
                <h2 className="text-xl font-serif text-[#F6F1E8]">Order #{selectedTicket.orderReference}</h2>
              </div>
              <span
                className={`px-3 py-1 rounded text-xs font-mono uppercase font-semibold ${
                  selectedTicket.isDelayed
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {selectedTicket.orderStatus}
              </span>
            </div>

            <div className="bg-[#1C1B17] p-3 rounded-lg mb-4 text-xs font-mono space-y-1">
              <div className="text-stone-400">
                <strong>Guest:</strong> {selectedTicket.customerName}
              </div>
              <div className="text-stone-400">
                <strong>Type:</strong> {selectedTicket.orderType}
              </div>
              <div className="text-stone-400">
                <strong>Placed:</strong> {new Date(selectedTicket.createdAt).toLocaleTimeString()} ({selectedTicket.elapsedMinutes} mins ago)
              </div>
              {selectedTicket.scheduledFor && (
                <div className="text-purple-400">
                  <strong>Scheduled For:</strong> {new Date(selectedTicket.scheduledFor).toLocaleString()}
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-mono uppercase text-[#A5A198] tracking-wider mb-2">Dishes to Cook</h4>
              <div className="divide-y divide-[#2A2925] border border-[#2A2925] rounded-lg overflow-hidden bg-[#1C1B17]/40">
                {selectedTicket.items.map((item, idx) => (
                  <div key={idx} className="p-3 text-sm">
                    <div className="font-medium text-[#F6F1E8]">
                      <span className="text-[#B99A63] font-mono mr-2">{item.quantity}x</span>
                      {item.dishName}
                    </div>
                    {item.specialInstructions && (
                      <div className="text-xs text-amber-300 italic mt-0.5">
                        Instructions: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#2A2925]">
              <button
                onClick={() => setSelectedTicket(null)}
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
