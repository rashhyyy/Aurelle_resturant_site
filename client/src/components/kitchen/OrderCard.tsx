'use client';

import React, { useState, useEffect } from 'react';
import { ClientOrder, OrderStatus, KitchenPriority } from '../../types/order';
import { useStaffTheme } from '../../context/StaffThemeContext';
import {
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  Calendar,
} from 'lucide-react';

interface OrderCardProps {
  order: ClientOrder;
  onOpenDetails: (order: ClientOrder) => void;
  onAccept?: (orderId: string) => Promise<void>;
  onStartPrep?: (orderId: string) => Promise<void>;
  onMarkReady?: (orderId: string) => Promise<void>;
  onCompleteHandoff?: (orderId: string) => Promise<void>;
  actionLoading?: string | null;
}

export function OrderCard({
  order,
  onOpenDetails,
  onAccept,
  onStartPrep,
  onMarkReady,
  onCompleteHandoff,
  actionLoading,
}: OrderCardProps) {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  // Live timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [secondsUntilPrep, setSecondsUntilPrep] = useState<number>(0);

  const scheduledDate = new Date(order.scheduledFor);
  const prepStartTargetMs = scheduledDate.getTime() - 30 * 60 * 1000;
  const isScheduledFuture =
    (order.orderStatus === OrderStatus.RECEIVED || order.orderStatus === OrderStatus.CONFIRMED) &&
    prepStartTargetMs > Date.now();

  useEffect(() => {
    const calculateElapsed = () => {
      const now = Date.now();
      let baseTimeMs: number;

      if (order.orderStatus === OrderStatus.PREPARING) {
        baseTimeMs = order.preparationStartedAt
          ? new Date(order.preparationStartedAt).getTime()
          : order.preparingAt
          ? new Date(order.preparingAt).getTime()
          : new Date(order.updatedAt).getTime();
      } else if (order.orderStatus === OrderStatus.READY) {
        baseTimeMs = order.readyAt
          ? new Date(order.readyAt).getTime()
          : new Date(order.updatedAt).getTime();
      } else {
        baseTimeMs = new Date(order.createdAt).getTime();
      }

      const diffSec = Math.max(0, Math.floor((now - baseTimeMs) / 1000));
      setElapsedSeconds(diffSec);

      const targetPrep = new Date(order.scheduledFor).getTime() - 30 * 60 * 1000;
      const countSec = Math.max(0, Math.floor((targetPrep - now) / 1000));
      setSecondsUntilPrep(countSec);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (totalSeconds: number) => {
    if (totalSeconds <= 0) return 'Due now';
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const isUrgent = order.priority === KitchenPriority.URGENT;
  const isAttention = order.priority === KitchenPriority.ATTENTION_REQUIRED;
  const isLate = Date.now() > scheduledDate.getTime() && order.orderStatus !== OrderStatus.READY;

  // Visual card border styles
  let cardBorder = isDark ? 'border-[#2C2C28]' : 'border-[#E5DFD3]';
  let cardBg = isDark ? 'bg-[#1E1E1B]' : 'bg-white';
  let glowStyle = '';

  if (isUrgent) {
    cardBorder = 'border-rose-500/70';
    glowStyle = 'ring-1 ring-rose-500/30';
  } else if (isAttention) {
    cardBorder = 'border-amber-500/60';
  } else if (order.orderStatus === OrderStatus.READY) {
    cardBorder = 'border-emerald-500/40';
  }

  const isLoading = actionLoading === order.id;

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-sm flex flex-col justify-between ${cardBg} ${cardBorder} ${glowStyle}`}
    >
      {/* Top Header: Order Reference + Priority Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-[#B99A63]">
              {order.orderReference}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold ${
                order.orderType === 'DINE_IN_PREORDER'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}
            >
              {order.orderType === 'DINE_IN_PREORDER' ? 'Dine-in' : 'Takeaway'}
            </span>
          </div>

          {/* Priority Pill */}
          {isUrgent && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              URGENT
            </span>
          )}
          {isAttention && !isUrgent && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ATTENTION
            </span>
          )}
          {!isUrgent && !isAttention && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                isDark ? 'bg-[#2C2C28] text-[#8E8A80]' : 'bg-[#F0ECE1] text-[#737068]'
              }`}
            >
              NORMAL
            </span>
          )}
        </div>

        {/* Guest & Timers Row */}
        <div className="flex items-center justify-between text-xs py-2 border-y border-dashed border-[#2C2C28]/60 mb-3">
          <span className="font-medium truncate max-w-[140px] text-[#A5A198]">
            {order.customerName}
          </span>

          <div className="flex items-center gap-3 font-mono">
            {/* Target time */}
            <span
              className={`flex items-center gap-1 text-[11px] ${
                isLate ? 'text-rose-400 font-bold' : isDark ? 'text-[#8E8A80]' : 'text-[#6B685F]'
              }`}
              title="Target Pickup Time"
            >
              <Calendar size={12} />
              {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Elapsed Timer or Scheduled Countdown */}
            <span
              className={`flex items-center gap-1 font-bold text-xs ${
                isScheduledFuture
                  ? 'text-blue-400'
                  : order.orderStatus === OrderStatus.PREPARING
                  ? 'text-amber-400'
                  : order.orderStatus === OrderStatus.READY
                  ? 'text-emerald-400'
                  : 'text-[#B99A63]'
              }`}
              title={isScheduledFuture ? 'Countdown until prep begins (30m before pickup)' : 'Elapsed Timer'}
            >
              <Clock size={12} />
              {isScheduledFuture
                ? `Prep in ${formatCountdown(secondsUntilPrep)}`
                : formatTimer(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Dish Items Snapshots */}
        <div className="space-y-2 mb-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="text-xs">
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#B99A63] shrink-0 w-6">
                  {item.quantity}x
                </span>
                <span
                  className={`font-semibold leading-tight ${
                    isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                  }`}
                >
                  {item.dishName}
                </span>
              </div>

              {item.specialInstructions && (
                <div className="ml-8 mt-0.5 flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <AlertTriangle size={11} className="shrink-0" />
                  <span className="truncate">{item.specialInstructions}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Customer Notes Alert */}
        {order.customerNotes && (
          <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 line-clamp-2">
            <span className="font-bold text-amber-400">Dietary: </span>
            {order.customerNotes}
          </div>
        )}
      </div>

      {/* Footer Interactive Actions */}
      <div className="pt-3 border-t border-[#2C2C28]/60 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenDetails(order)}
          className={`p-2 rounded-xl text-xs font-mono transition-colors border ${
            isDark
              ? 'border-[#2C2C28] hover:bg-[#2C2C28] text-[#8E8A80]'
              : 'border-[#E5DFD3] hover:bg-[#F0ECE1] text-[#6B685F]'
          }`}
          title="Open Ticket Details"
        >
          <Eye size={15} />
        </button>

        {/* Column-Specific Action */}
        <div className="flex items-center gap-2">
          {/* New Orders Column */}
          {(order.orderStatus === OrderStatus.RECEIVED || order.orderStatus === OrderStatus.CONFIRMED) && (
            <>
              {!order.kitchenAcceptedAt && onAccept && (
                <button
                  onClick={() => onAccept(order.id)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#B99A63] text-black hover:bg-[#caa972] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={13} />
                  {isLoading ? 'Accepting...' : 'Accept Ticket'}
                </button>
              )}

              {onStartPrep && (
                <button
                  onClick={() => onStartPrep(order.id)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  <Flame size={13} />
                  {isLoading ? 'Starting...' : 'Start Prep'}
                </button>
              )}
            </>
          )}

          {/* Preparing Column */}
          {order.orderStatus === OrderStatus.PREPARING && onMarkReady && (
            <button
              onClick={() => onMarkReady(order.id)}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              <CheckCircle2 size={13} />
              {isLoading ? 'Updating...' : 'Mark Ready'}
            </button>
          )}

          {/* Ready Column */}
          {order.orderStatus === OrderStatus.READY && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <CheckCircle2 size={13} />
                Ready for Pickup
              </span>
              {onCompleteHandoff && (
                <button
                  onClick={() => onCompleteHandoff(order.id)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  <CheckCircle2 size={13} />
                  {isLoading ? 'Completing...' : 'Complete Handoff'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
