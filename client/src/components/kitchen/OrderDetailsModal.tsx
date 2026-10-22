'use client';

import React from 'react';
import { ClientOrder, OrderStatus, KitchenPriority } from '../../types/order';
import { useStaffTheme } from '../../context/StaffThemeContext';
import {
  X,
  Clock,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Utensils,
  Receipt,
  Check,
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: ClientOrder | null;
  onClose: () => void;
  onAccept?: (orderId: string) => Promise<void>;
  onStartPrep?: (orderId: string) => Promise<void>;
  onMarkReady?: (orderId: string) => Promise<void>;
  onCompleteHandoff?: (orderId: string) => Promise<void>;
  actionLoading?: string | null;
}

export function OrderDetailsModal({
  order,
  onClose,
  onAccept,
  onStartPrep,
  onMarkReady,
  onCompleteHandoff,
  actionLoading,
}: OrderDetailsModalProps) {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  if (!order) return null;

  const isUrgent = order.priority === KitchenPriority.URGENT;
  const isAttention = order.priority === KitchenPriority.ATTENTION_REQUIRED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border flex flex-col ${
          isDark ? 'bg-[#1A1A18] border-[#2C2C28] text-[#F6F1E8]' : 'bg-white border-[#E5DFD3] text-[#171715]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between sticky top-0 z-10 ${
            isDark ? 'bg-[#1A1A18]/95 border-[#2C2C28]' : 'bg-white/95 border-[#E5DFD3]'
          } backdrop-blur`}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold tracking-wider text-[#B99A63]">
              {order.orderReference}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                order.orderType === 'DINE_IN_PREORDER'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}
            >
              {order.orderType === 'DINE_IN_PREORDER' ? 'Dine-in Pre-order' : 'Takeaway'}
            </span>
            {isUrgent && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                URGENT
              </span>
            )}
            {isAttention && !isUrgent && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ATTENTION
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-[#2C2C28] text-[#737068]' : 'hover:bg-[#F0ECE1] text-[#8E8A80]'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Key Timestamps & Customer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#141412] border-[#2C2C28]' : 'bg-[#FAF7F2] border-[#E8E2D5]'
              }`}
            >
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#737068] mb-2 flex items-center gap-1.5">
                <Calendar size={13} />
                Scheduling & Pass Time
              </h4>
              <p className="text-sm font-semibold">
                Scheduled: {new Date(order.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-[#737068] mt-1">
                Date: {new Date(order.scheduledFor).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              {order.kitchenAcceptedByName && (
                <p className="text-xs text-[#B99A63] mt-2 font-mono">
                  Accepted by: {order.kitchenAcceptedByName}
                </p>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#141412] border-[#2C2C28]' : 'bg-[#FAF7F2] border-[#E8E2D5]'
              }`}
            >
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#737068] mb-2 flex items-center gap-1.5">
                <User size={13} />
                Guest Information
              </h4>
              <p className="text-sm font-semibold">{order.customerName}</p>
              <p className="text-xs text-[#737068] mt-1 flex items-center gap-1">
                <Phone size={12} /> {order.customerPhone}
              </p>
              <p className="text-xs text-[#737068] flex items-center gap-1">
                <Mail size={12} /> {order.customerEmail}
              </p>
              {order.reservationId && (
                <p className="text-xs text-purple-400 font-mono mt-1">
                  Table Res: {order.reservationId}
                </p>
              )}
            </div>
          </div>

          {/* Customer Dietary & Special Notes */}
          {order.customerNotes && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-1">
                <AlertTriangle size={14} />
                Special Preparation / Dietary Notes
              </div>
              <p className="text-sm font-medium text-amber-200">{order.customerNotes}</p>
            </div>
          )}

          {/* Items Snapshots */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#737068] mb-3 flex items-center gap-1.5">
              <Utensils size={13} />
              Culinary Ticket Items ({order.items.length})
            </h4>

            <div className="divide-y divide-dashed divide-[#2C2C28]/60 space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#B99A63]/20 text-[#B99A63] font-mono font-bold flex items-center justify-center text-sm shrink-0">
                      {item.quantity}x
                    </span>
                    <div>
                      <h5 className="text-sm font-bold tracking-wide">{item.dishName}</h5>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-xs text-[#737068] mt-0.5">
                          {item.selectedOptions.join(' • ')}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-xs font-medium text-amber-400 mt-1 flex items-center gap-1">
                          <AlertTriangle size={12} /> {item.specialInstructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-mono text-[#737068] shrink-0">
                    LKR {(item.lineTotalMinor / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div
            className={`p-4 rounded-xl border space-y-1.5 text-xs font-mono ${
              isDark ? 'bg-[#141412] border-[#2C2C28]' : 'bg-[#FAF7F2] border-[#E8E2D5]'
            }`}
          >
            <div className="flex justify-between text-[#737068]">
              <span>Subtotal:</span>
              <span>{order.formattedSubtotal}</span>
            </div>
            <div className="flex justify-between text-[#737068]">
              <span>Service Charge (10%):</span>
              <span>{order.formattedServiceCharge}</span>
            </div>
            <div className="flex justify-between text-[#737068]">
              <span>Tax (2.5%):</span>
              <span>{order.formattedTax}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#B99A63] pt-2 border-t border-[#2C2C28]">
              <span>Total:</span>
              <span>{order.formattedTotal}</span>
            </div>
          </div>

          {/* Status Timeline History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#737068] mb-3 flex items-center gap-1.5">
                <Receipt size={13} />
                Ticket Event Timeline
              </h4>
              <div className="space-y-2">
                {order.statusHistory.map((h, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                      isDark ? 'bg-[#141412]' : 'bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#B99A63]" />
                      <span className="font-semibold">{h.status}</span>
                      {h.note && <span className="text-[#737068] italic">— {h.note}</span>}
                    </div>
                    <span className="text-[#737068] font-mono">
                      {new Date(h.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`px-6 py-4 border-t flex flex-wrap items-center justify-end gap-3 sticky bottom-0 ${
            isDark ? 'bg-[#1A1A18]/95 border-[#2C2C28]' : 'bg-white/95 border-[#E5DFD3]'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-medium border ${
              isDark ? 'border-[#2C2C28] hover:bg-[#2C2C28]' : 'border-[#E5DFD3] hover:bg-[#F0ECE1]'
            }`}
          >
            Close Ticket
          </button>

          {!order.kitchenAcceptedAt && (order.orderStatus === OrderStatus.RECEIVED || order.orderStatus === OrderStatus.CONFIRMED) && onAccept && (
            <button
              onClick={() => onAccept(order.id)}
              disabled={actionLoading === order.id}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#B99A63] text-black hover:bg-[#cbb180] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={14} />
              {actionLoading === order.id ? 'Accepting...' : 'Accept Ticket'}
            </button>
          )}

          {order.orderStatus !== OrderStatus.PREPARING &&
            order.orderStatus !== OrderStatus.READY &&
            order.orderStatus !== OrderStatus.COMPLETED &&
            order.orderStatus !== OrderStatus.CANCELLED &&
            onStartPrep && (
              <button
                onClick={() => onStartPrep(order.id)}
                disabled={actionLoading === order.id}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Flame size={14} />
                {actionLoading === order.id ? 'Starting...' : 'Start Preparation'}
              </button>
            )}

          {order.orderStatus === OrderStatus.PREPARING && onMarkReady && (
            <button
              onClick={() => onMarkReady(order.id)}
              disabled={actionLoading === order.id}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              {actionLoading === order.id ? 'Marking Ready...' : 'Mark Ready for Pickup'}
            </button>
          )}

          {order.orderStatus === OrderStatus.READY && onCompleteHandoff && (
            <button
              onClick={() => onCompleteHandoff(order.id)}
              disabled={actionLoading === order.id}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              {actionLoading === order.id ? 'Completing...' : 'Complete Handoff'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
