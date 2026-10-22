'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { OrderDetailsModal } from '../../../../components/kitchen/OrderDetailsModal';
import { ClientOrder, OrderStatus, OrderType } from '../../../../types/order';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../types/staff';
import {
  History,
  Search,
  Filter,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function KitchenHistoryPage() {
  const { selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [orderType, setOrderType] = useState<'ALL' | OrderType>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Order for details modal
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedLocation) params.set('locationId', selectedLocation);
      if (search.trim()) params.set('search', search.trim());
      if (orderType !== 'ALL') params.set('orderType', orderType);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', String(page));
      params.set('limit', '15');

      const res = await fetch(`/api/kitchen/orders/history?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load kitchen order history.');
      }

      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data.orders || []);
        setTotal(json.data.total || 0);
        setTotalPages(json.data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with kitchen history API.');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, search, orderType, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN]}>
      <StaffPageHeader
        title="Kitchen Order History"
        subtitle="Completed culinary passes, fulfillment timeline records, and cancelled kitchen tickets."
        badge="HISTORICAL RECORDS"
      />

      <div className="space-y-6">
        {/* Filters and Search Bar */}
        <div
          className={`border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center flex-wrap gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737068]" />
              <input
                type="text"
                placeholder="Search Reference, Guest, or Dish..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#B99A63] ${
                  isDark
                    ? 'bg-[#141412] border-[#2C2C28] text-[#F6F1E8]'
                    : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#171715]'
                }`}
              />
            </div>

            {/* Order Type */}
            <select
              value={orderType}
              onChange={(e) => {
                setOrderType(e.target.value as any);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                isDark ? 'bg-[#141412] border-[#2C2C28] text-[#A5A198]' : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#6B685F]'
              }`}
            >
              <option value="ALL">All Types</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="DINE_IN_PREORDER">Dine-in Pre-order</option>
            </select>

            {/* Date From */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                isDark ? 'bg-[#141412] border-[#2C2C28] text-[#A5A198]' : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#6B685F]'
              }`}
              title="Filter from date"
            />

            {/* Date To */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                isDark ? 'bg-[#141412] border-[#2C2C28] text-[#A5A198]' : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#6B685F]'
              }`}
              title="Filter to date"
            />
          </div>

          <button
            onClick={fetchHistory}
            className={`p-2 rounded-xl border transition-colors self-end md:self-auto ${
              isDark
                ? 'bg-[#141412] border-[#2C2C28] hover:bg-[#2C2C28] text-[#A5A198]'
                : 'bg-[#FAF7F2] border-[#E8E2D5] hover:bg-[#F0ECE1] text-[#6B685F]'
            }`}
            title="Refresh history"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* History Table */}
        <div
          className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-mono uppercase tracking-wider text-[11px] border-b ${
                  isDark
                    ? 'bg-[#141412] border-[#2C2C28] text-[#737068]'
                    : 'bg-[#FAF7F2] border-[#E5DFD3] text-[#8E8A80]'
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Ticket Ref</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Scheduled For</th>
                  <th className="py-3 px-4">Completed / Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#2C2C28]/40">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#737068]">
                      {loading ? 'Loading historical orders...' : 'No historical kitchen records found.'}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isCompleted = order.orderStatus === OrderStatus.COMPLETED;
                    const isCancelled = order.orderStatus === OrderStatus.CANCELLED;

                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-[#141412]/60' : 'hover:bg-[#FAF7F2]/80'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#B99A63]">
                          {order.orderReference}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {order.customerName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                              order.orderType === 'DINE_IN_PREORDER'
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {order.orderType === 'DINE_IN_PREORDER' ? 'Dine-in' : 'Takeaway'}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-[#A5A198]">
                          {order.items.map((i) => `${i.quantity}x ${i.dishName}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {order.formattedTotal}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#737068]">
                          {new Date(order.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 size={13} />
                              Completed
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                              <XCircle size={13} />
                              Cancelled
                            </span>
                          ) : (
                            <span className="text-amber-400 font-medium text-[11px]">
                              {order.orderStatus}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
                              isDark
                                ? 'border-[#2C2C28] hover:bg-[#2C2C28] text-[#A5A198]'
                                : 'border-[#E5DFD3] hover:bg-[#F0ECE1] text-[#6B685F]'
                            }`}
                            title="View Ticket"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div
              className={`px-4 py-3 border-t flex items-center justify-between text-xs font-mono ${
                isDark ? 'border-[#2C2C28] text-[#737068]' : 'border-[#E5DFD3] text-[#8E8A80]'
              }`}
            >
              <span>
                Showing page {page} of {totalPages} ({total} total tickets)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                    isDark ? 'border-[#2C2C28] hover:bg-[#2C2C28]' : 'border-[#E5DFD3] hover:bg-[#F0ECE1]'
                  }`}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                    isDark ? 'border-[#2C2C28] hover:bg-[#2C2C28]' : 'border-[#E5DFD3] hover:bg-[#F0ECE1]'
                  }`}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </StaffLayout>
  );
}
