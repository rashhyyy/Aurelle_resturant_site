'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../lib/api';
import { ClientOrder, OrderStatus } from '../../../types/order';
import { Clock, Eye, ShoppingBag, ArrowRight } from 'lucide-react';

export default function AccountOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = Boolean(user);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await apiClient<{ success: boolean; data: { orders: ClientOrder[] } }>('/orders/my');
        if (res.success && res.data?.orders) {
          setOrders(res.data.orders);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, authLoading]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case OrderStatus.READY:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse';
      case OrderStatus.PREPARING:
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
      case OrderStatus.CANCELLED:
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-[#C1A87D]/15 text-[#C1A87D] border border-[#C1A87D]/30';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#111215] text-stone-100 pt-28 pb-32">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="border-b border-stone-800 pb-8 mb-10">
          <span className="text-[10px] uppercase tracking-[0.26em] text-[#C1A87D] font-medium block">
            MY ACCOUNT
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight mt-1">
            Order History & Tracking
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm font-light mt-1.5">
            Monitor real-time kitchen preparation, pickup schedules, and historical dining receipts.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#C1A87D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-stone-400 text-xs font-mono tracking-widest uppercase">
              Loading orders...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-950/40 border border-rose-800 rounded text-rose-300 text-sm">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-5 bg-[#181A16] border border-stone-800 rounded-lg p-8">
            <ShoppingBag className="w-12 h-12 text-stone-600 mx-auto" />
            <div>
              <h3 className="text-lg font-serif text-white">No orders found</h3>
              <p className="text-stone-400 text-xs sm:text-sm mt-1">
                You haven&apos;t placed any dining or takeaway orders yet.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-[#C1A87D] text-[#111215] hover:bg-white text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded transition-colors"
            >
              Explore Menu <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id || ord.orderReference}
                className="bg-[#181A16] border border-stone-800 hover:border-stone-700 transition-all rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-[#C1A87D]">
                      {ord.orderReference}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold ${getStatusBadge(ord.orderStatus)}`}>
                      {ord.orderStatus}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">
                      {ord.orderType === 'DINE_IN_PREORDER' ? 'Dine-in Pre-order' : 'Takeaway'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300">
                    {ord.items.map((i) => `${i.quantity}x ${i.dishName}`).join(' • ')}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Pickup: {new Date(ord.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-white">
                      {ord.formattedTotal}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/cart?orderRef=${encodeURIComponent(ord.orderReference)}&stage=status`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded border border-stone-700 hover:border-white text-xs font-mono uppercase tracking-wider text-stone-200 hover:text-white transition-colors"
                >
                  <Eye size={14} /> Track Order
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
