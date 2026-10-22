'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Eye,
  AlertCircle,
  MoreVertical,
  ChefHat,
  PackageCheck,
} from 'lucide-react';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffStatusBadge } from '../../../../components/staff/StaffStatusBadge';
import { ClientOrder, OrderStatus, OrderSummaryMetrics } from '../../../../types/order';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';

export default function AdminOrdersPage() {
  const { staff, loading: authLoading } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [summary, setSummary] = useState<OrderSummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('newest');

  // Action state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchOrdersAndSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('orderType', typeFilter);
      if (sortFilter) params.append('sort', sortFilter);

      const [ordersRes, summaryRes] = await Promise.all([
        apiClient<{ success: boolean; data: { orders: ClientOrder[]; total: number } }>(
          `/admin/orders?${params.toString()}`
        ),
        apiClient<{ success: boolean; data: OrderSummaryMetrics }>(
          '/admin/orders/summary'
        ),
      ]);

      if (ordersRes?.success && Array.isArray(ordersRes.data?.orders)) {
        setOrders(ordersRes.data.orders);
      } else {
        setError('Failed to load orders.');
      }

      if (summaryRes?.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Network error retrieving order records.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, sortFilter]);

  useEffect(() => {
    fetchOrdersAndSummary();
  }, [fetchOrdersAndSummary]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleOrderEvent = () => {
      fetchOrdersAndSummary();
    };

    socket.on('orders.created', handleOrderEvent);
    socket.on('orders.updated', handleOrderEvent);
    socket.on('orders.statusChanged', handleOrderEvent);

    return () => {
      socket.off('orders.created', handleOrderEvent);
      socket.off('orders.updated', handleOrderEvent);
      socket.off('orders.statusChanged', handleOrderEvent);
    };
  }, [socket, fetchOrdersAndSummary]);

  // Quick order transition action
  const handleTransition = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    try {
      setActionLoadingId(orderId);
      setActionMessage(null);

      let res: { success: boolean; message: string } | undefined;
      if (newStatus === OrderStatus.CONFIRMED) {
        res = await apiClient<{ success: boolean; message: string }>(
          `/admin/orders/${orderId}/confirm`,
          { method: 'POST' }
        );
      } else if (newStatus === OrderStatus.CANCELLED) {
        const reason = window.prompt('Please enter a cancellation reason:');
        if (reason === null) {
          setActionLoadingId(null);
          return;
        }
        res = await apiClient<{ success: boolean; message: string }>(
          `/admin/orders/${orderId}/cancel`,
          {
            method: 'POST',
            data: { reason: reason || 'Cancelled by management' },
          }
        );
      } else {
        res = await apiClient<{ success: boolean; message: string }>(
          `/admin/orders/${orderId}/status`,
          {
            method: 'PATCH',
            data: { status: newStatus, note },
          }
        );
      }

      if (res?.success) {
        setActionMessage(res.message || 'Status updated successfully.');
        fetchOrdersAndSummary();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to execute status update.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-[#B99A63]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#B99A63] font-semibold block">
          AURELLE / OPERATIONS
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div>
            <h1
              className={`text-3xl sm:text-4xl font-serif font-normal tracking-tight ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              Order Management
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Monitor incoming orders and manage restaurant order operations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrdersAndSummary()}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#2C2C28] hover:bg-stone-800 text-stone-300'
                : 'border-stone-300 hover:bg-stone-100 text-stone-700'
            }`}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          className={`border rounded-2xl p-5 shadow-sm ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-stone-400 block">
            TODAY&apos;S ORDERS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl sm:text-3xl font-serif font-semibold ${
                isDark ? 'text-[#F6F1E8]' : 'text-stone-900'
              }`}
            >
              {summary ? summary.todayOrders : '—'}
            </span>
            <ShoppingBag className="w-5 h-5 text-[#B99A63]" />
          </div>
          <span className="text-[11px] font-mono text-[#B99A63] mt-1 block">
            {summary ? summary.formattedTodayRevenue : 'LKR 0'} Settled
          </span>
        </div>

        <div
          className={`border rounded-2xl p-5 shadow-sm ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-stone-400 block">
            ACTIVE ORDERS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl sm:text-3xl font-serif font-semibold text-amber-500`}
            >
              {summary ? summary.activeOrders : '—'}
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Received, confirmed or prepping
          </span>
        </div>

        <div
          className={`border rounded-2xl p-5 shadow-sm ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-stone-400 block">
            COMPLETED ORDERS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl sm:text-3xl font-serif font-semibold text-emerald-500`}
            >
              {summary ? summary.completedOrders : '—'}
            </span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Successfully fulfilled
          </span>
        </div>

        <div
          className={`border rounded-2xl p-5 shadow-sm ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-stone-400 block">
            CANCELLED ORDERS
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-2xl sm:text-3xl font-serif font-semibold text-rose-500`}
            >
              {summary ? summary.cancelledOrders : '—'}
            </span>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Voided or customer cancelled
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-stone-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, name, phone..."
            className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-colors ${
              isDark
                ? 'bg-[#141412] border-[#2C2C28] text-stone-200 focus:border-[#B99A63]'
                : 'bg-stone-50 border-stone-300 text-stone-900 focus:border-[#B99A63]'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`text-xs px-3 py-2.5 rounded-xl border outline-none cursor-pointer ${
              isDark
                ? 'bg-[#141412] border-[#2C2C28] text-stone-200 focus:border-[#B99A63]'
                : 'bg-stone-50 border-stone-300 text-stone-900 focus:border-[#B99A63]'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`text-xs px-3 py-2.5 rounded-xl border outline-none cursor-pointer ${
              isDark
                ? 'bg-[#141412] border-[#2C2C28] text-stone-200 focus:border-[#B99A63]'
                : 'bg-stone-50 border-stone-300 text-stone-900 focus:border-[#B99A63]'
            }`}
          >
            <option value="all">All Order Types</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DINE_IN_PREORDER">Dine-in Pre-order</option>
          </select>

          {/* Sort */}
          <select
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
            className={`text-xs px-3 py-2.5 rounded-xl border outline-none cursor-pointer ${
              isDark
                ? 'bg-[#141412] border-[#2C2C28] text-stone-200 focus:border-[#B99A63]'
                : 'bg-stone-50 border-stone-300 text-stone-900 focus:border-[#B99A63]'
            }`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="scheduled">Scheduled Time</option>
            <option value="highest">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* Order Directory Table (Desktop) & Cards (Mobile) */}
      <div
        className={`border rounded-2xl shadow-sm overflow-hidden ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-[#B99A63] mb-3" />
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
              Querying database order ledger...
            </span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-400 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <span>{error}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-stone-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40 text-[#B99A63]" />
            <p className="text-sm font-medium">No order records match your criteria.</p>
            <p className="text-xs text-stone-500 mt-1">Adjust your search or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`border-b text-[10px] font-mono uppercase ${
                    isDark
                      ? 'border-[#2C2C28] text-stone-400 bg-[#161614]'
                      : 'border-stone-200 text-stone-500 bg-stone-50'
                  }`}
                >
                  <th className="py-3.5 px-4">Order Reference</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Scheduled For</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#2C2C28]/60' : 'divide-stone-200'}`}>
                {orders.map((ord) => {
                  const isActionLoading = actionLoadingId === ord.id;

                  return (
                    <tr
                      key={ord.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#B99A63]/5' : 'hover:bg-stone-50'
                      }`}
                    >
                      {/* Reference */}
                      <td className="py-4 px-4">
                        <Link
                          href={`/staff/admin/orders/${ord.id}`}
                          className="font-mono font-semibold text-[#B99A63] hover:underline block"
                        >
                          {ord.orderReference}
                        </Link>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {new Date(ord.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4">
                        <span className="font-medium text-white block">
                          {ord.customerName}
                        </span>
                        <span className="text-[11px] text-stone-400 block font-light">
                          {ord.customerPhone}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4">
                        <span className="text-xs text-stone-300 font-medium">
                          {ord.orderType === 'DINE_IN_PREORDER' ? 'Dine-In' : 'Takeaway'}
                        </span>
                        {ord.reservationId && (
                          <span className="text-[10px] text-[#B99A63] block font-mono">
                            Ref: {ord.reservationId}
                          </span>
                        )}
                      </td>

                      {/* Scheduled */}
                      <td className="py-4 px-4 font-mono text-stone-300">
                        {new Date(ord.scheduledFor).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4 font-mono font-bold text-white">
                        {ord.formattedTotal}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <StaffStatusBadge status={ord.orderStatus} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Confirm */}
                          {ord.orderStatus === OrderStatus.RECEIVED && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleTransition(ord.id, OrderStatus.CONFIRMED)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700 text-emerald-300 rounded-[2px] transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}

                          {/* Preparing */}
                          {ord.orderStatus === OrderStatus.CONFIRMED && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleTransition(ord.id, OrderStatus.PREPARING)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700 text-amber-300 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <ChefHat size={12} />
                              <span>Prep</span>
                            </button>
                          )}

                          {/* Ready */}
                          {ord.orderStatus === OrderStatus.PREPARING && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleTransition(ord.id, OrderStatus.READY)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-blue-950/40 hover:bg-blue-900/60 border border-blue-700 text-blue-300 rounded-[2px] transition-colors cursor-pointer"
                            >
                              Ready
                            </button>
                          )}

                          {/* Complete */}
                          {ord.orderStatus === OrderStatus.READY && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleTransition(ord.id, OrderStatus.COMPLETED)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700 text-purple-300 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <PackageCheck size={12} />
                              <span>Complete</span>
                            </button>
                          )}

                          {/* Cancel if active */}
                          {ord.orderStatus !== OrderStatus.COMPLETED &&
                            ord.orderStatus !== OrderStatus.CANCELLED && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleTransition(ord.id, OrderStatus.CANCELLED)}
                                className="px-2 py-1 text-[10px] text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Cancel Order"
                              >
                                Cancel
                              </button>
                            )}

                          {/* View details */}
                          <Link
                            href={`/staff/admin/orders/${ord.id}`}
                            className="p-1.5 text-stone-400 hover:text-white rounded transition-colors"
                            title="View Dossier"
                          >
                            <Eye size={14} />
                          </Link>
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
    </div>
  );
}
