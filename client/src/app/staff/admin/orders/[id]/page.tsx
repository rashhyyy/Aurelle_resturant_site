'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  ShoppingBag,
  CheckCircle,
  XCircle,
  ChefHat,
  PackageCheck,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useStaffAuth } from '../../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../../context/StaffThemeContext';
import { useSocket } from '../../../../../context/SocketContext';
import { StaffStatusBadge } from '../../../../../components/staff/StaffStatusBadge';
import { ClientOrder, OrderStatus } from '../../../../../types/order';
import { apiClient } from '../../../../../lib/api';

function OrderDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const { staff, loading: authLoading } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [order, setOrder] = useState<ClientOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<{ success: boolean; data: ClientOrder }>(
        `/admin/orders/${id}`
      );

      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        setError('Order dossier not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Real-time synchronization for this order
  useEffect(() => {
    if (!socket || !order) return;

    socket.emit('subscribe:order', order.orderReference);

    const handleUpdate = (updatedOrder: ClientOrder) => {
      if (updatedOrder.id === order.id || updatedOrder.orderReference === order.orderReference) {
        setOrder(updatedOrder);
      }
    };

    socket.on('orders.statusChanged', handleUpdate);
    socket.on('orders.updated', handleUpdate);

    return () => {
      socket.off('orders.statusChanged', handleUpdate);
      socket.off('orders.updated', handleUpdate);
    };
  }, [socket, order]);

  const handleAction = async (newStatus: OrderStatus) => {
    if (!id) return;
    try {
      setActionLoading(true);
      setFeedback(null);

      let data: { success: boolean; data: ClientOrder; message: string };
      if (newStatus === OrderStatus.CONFIRMED) {
        data = await apiClient<{ success: boolean; data: ClientOrder; message: string }>(
          `/admin/orders/${id}/confirm`,
          { method: 'POST' }
        );
      } else if (newStatus === OrderStatus.CANCELLED) {
        const reason = window.prompt('Specify cancellation reason for the audit ledger:');
        if (reason === null) {
          setActionLoading(false);
          return;
        }
        data = await apiClient<{ success: boolean; data: ClientOrder; message: string }>(
          `/admin/orders/${id}/cancel`,
          {
            method: 'POST',
            data: { reason: reason || 'Cancelled by administrator' },
          }
        );
      } else {
        data = await apiClient<{ success: boolean; data: ClientOrder; message: string }>(
          `/admin/orders/${id}/status`,
          {
            method: 'PATCH',
            data: { status: newStatus },
          }
        );
      }

      if (data?.success) {
        setOrder(data.data);
        setFeedback(data.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to execute status update.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-[#B99A63]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-serif text-white">Order Record Unavailable</h2>
        <p className="text-xs text-stone-400 mt-2">{error || 'Order was not found in database records.'}</p>
        <Link
          href="/staff/admin/orders"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 border border-stone-700 text-stone-300 hover:text-white rounded-xl text-xs uppercase font-mono tracking-wider"
        >
          <ArrowLeft size={14} />
          <span>Back to Order Management</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button and breadcrumb */}
      <div>
        <Link
          href="/staff/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-stone-400 hover:text-[#B99A63] transition-colors mb-2"
        >
          <ArrowLeft size={13} />
          <span>Back to orders directory</span>
        </Link>
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#B99A63] font-semibold block">
          AURELLE / OPERATIONS / {order.orderReference}
        </span>
      </div>

      {/* Header card with status and action buttons */}
      <div
        className={`border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div>
          <div className="flex items-center gap-3">
            <h1
              className={`text-3xl font-serif font-bold tracking-tight ${
                isDark ? 'text-[#F6F1E8]' : 'text-stone-900'
              }`}
            >
              {order.orderReference}
            </h1>
            <StaffStatusBadge status={order.orderStatus} />
          </div>
          <p className="text-xs text-stone-400 mt-1 font-mono">
            Placed on {new Date(order.createdAt).toLocaleString()} · {order.orderType}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {order.orderStatus === OrderStatus.RECEIVED && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleAction(OrderStatus.CONFIRMED)}
              className="px-4 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle size={14} />
              <span>Confirm Order</span>
            </button>
          )}

          {order.orderStatus === OrderStatus.CONFIRMED && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleAction(OrderStatus.PREPARING)}
              className="px-4 py-2 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700 text-amber-300 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ChefHat size={14} />
              <span>Start Preparation</span>
            </button>
          )}

          {order.orderStatus === OrderStatus.PREPARING && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleAction(OrderStatus.READY)}
              className="px-4 py-2 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-700 text-blue-300 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <PackageCheck size={14} />
              <span>Mark Ready</span>
            </button>
          )}

          {order.orderStatus === OrderStatus.READY && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleAction(OrderStatus.COMPLETED)}
              className="px-4 py-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700 text-purple-300 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle size={14} />
              <span>Complete Order</span>
            </button>
          )}

          {order.orderStatus !== OrderStatus.COMPLETED &&
            order.orderStatus !== OrderStatus.CANCELLED && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleAction(OrderStatus.CANCELLED)}
                className="px-4 py-2 border border-rose-800 text-rose-300 hover:bg-rose-950/40 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Cancel</span>
              </button>
            )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Grid: Details Left, Finance Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Customer Info, Items, Status History */}
        <div className="lg:col-span-8 space-y-8">
          {/* Customer & Logistics Dossier */}
          <div
            className={`border rounded-2xl p-6 shadow-sm space-y-5 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <h3 className="font-serif text-lg font-semibold text-white">
              Logistics & Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-stone-400 block">
                  CUSTOMER NAME
                </span>
                <span className="font-medium text-white text-sm">
                  {order.customerName}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-stone-400 block">
                  CONTACT DETAILS
                </span>
                <span className="text-stone-200 block">{order.customerEmail}</span>
                <span className="text-stone-300 font-mono block">{order.customerPhone}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-stone-400 block">
                  SCHEDULED TIME
                </span>
                <span className="font-mono text-stone-200">
                  {new Date(order.scheduledFor).toLocaleString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-stone-400 block">
                  VENUE & VENUE ID
                </span>
                <span className="text-stone-200 font-medium">
                  {order.locationId === 'loc-colombo-main'
                    ? 'Aurelle Colombo (Flagship)'
                    : order.locationId}
                </span>
              </div>
            </div>

            {order.customerNotes && (
              <div className="pt-3 border-t border-[#2C2C28]/60 text-xs">
                <span className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                  SPECIAL INSTRUCTIONS & NOTES
                </span>
                <p className="text-stone-300 bg-[#161614] p-3 rounded-lg border border-[#2C2C28]">
                  {order.customerNotes}
                </p>
              </div>
            )}
          </div>

          {/* Items Breakdown Table */}
          <div
            className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-white">
                Ordered Dishes ({order.items.length})
              </h3>
              <span className="text-[10px] font-mono uppercase text-[#B99A63]">
                Immutable Purchase Snapshot
              </span>
            </div>

            <div className="divide-y divide-[#2C2C28]/60">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-800 bg-black flex-shrink-0">
                        <Image src={item.image} alt={item.dishName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-stone-800 flex items-center justify-center text-stone-500">
                        <ShoppingBag size={18} />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-white">{item.dishName}</h4>
                      <span className="text-xs font-mono text-stone-400">
                        {item.quantity} × LKR {(item.unitPriceMinor / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-semibold text-sm text-white">
                    LKR {(item.lineTotalMinor / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Timeline History */}
          <div
            className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <h3 className="font-serif text-lg font-semibold text-white">
              Status Transition Audit History
            </h3>

            <div className="space-y-3">
              {order.statusHistory.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-[#161614] border border-[#2C2C28] rounded-xl text-xs"
                >
                  <Clock className="w-4 h-4 text-[#B99A63] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white uppercase font-mono">
                        {h.status}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400">
                        {new Date(h.changedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-stone-300 mt-0.5">{h.note || 'State updated'}</p>
                    <span className="text-[10px] text-stone-500 font-mono">
                      Actor: {h.actorType} ({h.changedBy || 'system'})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Financial Ledger */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <h3 className="font-serif text-lg font-semibold text-white">
              Financial Breakdown
            </h3>

            <div className="space-y-3 text-xs text-stone-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-white font-medium">
                  {order.formattedSubtotal}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Service Charge (10%)</span>
                <span className="font-mono text-white font-medium">
                  {order.formattedServiceCharge}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Statutory Dining Tax (2.5%)</span>
                <span className="font-mono text-white font-medium">
                  {order.formattedTax}
                </span>
              </div>

              {order.discountMinor > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono">
                    - LKR {(order.discountMinor / 100).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#2C2C28] flex justify-between items-baseline">
              <span className="text-sm font-semibold text-white">Total</span>
              <span className="font-mono text-xl font-bold text-[#B99A63]">
                {order.formattedTotal}
              </span>
            </div>

            <div className="pt-3 border-t border-[#2C2C28]/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">Payment Status</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-amber-950/40 border border-amber-800 text-amber-300">
                  {order.paymentStatus}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-light">
                Settlement collected at dining pavilion or pickup counter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[500px] flex items-center justify-center text-stone-400 text-xs font-mono uppercase tracking-wider">
          Loading Order Dossier...
        </div>
      }
    >
      <OrderDetailContent />
    </Suspense>
  );
}
