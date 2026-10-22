'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { ManagerHeader } from '../../../../components/staff/manager/ManagerHeader';
import { OverrideConfirmModal } from '../../../../components/staff/manager/OverrideConfirmModal';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  Search,
  Filter,
  Eye,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  CreditCard,
  Ban,
} from 'lucide-react';

interface OrderItem {
  dishName: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  selectedOptions?: string[];
  specialInstructions?: string;
}

interface OrderRecord {
  id: string;
  orderReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locationId: string;
  orderType: string;
  items: OrderItem[];
  subtotalMinor: number;
  taxMinor: number;
  serviceChargeMinor: number;
  totalMinor: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
  scheduledFor: string;
  createdAt: string;
  cancellationReason?: string;
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    note?: string;
  }>;
}

export default function ManagerOrdersPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderRecord | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchOrders = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const queryParams = new URLSearchParams({
          locationId,
          page: page.toString(),
          limit: '15',
          ...(search ? { search } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(typeFilter ? { orderType: typeFilter } : {}),
        });

        const res = await apiClient<{
          success: boolean;
          data: { orders: OrderRecord[]; total: number; page: number; limit: number };
        }>(`/manager/orders?${queryParams.toString()}`);

        if (res.success && res.data) {
          setOrders(res.data.orders);
          setTotal(res.data.total);
        }
      } catch (err: any) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [locationId, page, search, statusFilter, typeFilter]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchOrders();
    socket.on('order:created', handleUpdate);
    socket.on('order:status_changed', handleUpdate);
    socket.on('kitchen:order_updated', handleUpdate);
    return () => {
      socket.off('order:created', handleUpdate);
      socket.off('order:status_changed', handleUpdate);
      socket.off('kitchen:order_updated', handleUpdate);
    };
  }, [socket, fetchOrders]);

  const handleCancelOrder = async (reason: string) => {
    if (!cancelModalOrder) return;
    await apiClient(`/manager/overrides?locationId=${locationId}`, {
      method: 'POST',
      data: {
        action: 'CANCEL_DELAYED_ORDER',
        targetId: cancelModalOrder.id,
        reason,
      },
    });
    setCancelModalOrder(null);
    setSelectedOrder(null);
    fetchOrders();
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <ManagerHeader
        heading="Order Monitoring"
        description="Inspect customer orders, track preparation stages, and manage order exceptions."
        onRefresh={() => fetchOrders(true)}
        refreshing={refreshing}
      />

      {/* Filters & Search Toolbar */}
      <div
        className={`p-4 rounded-xl border mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference, guest name, phone..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-mono bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-mono bg-[#1C1B17] border border-[#2A2925] rounded-lg text-[#F6F1E8] focus:border-[#B99A63] focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="DINE_IN_PREORDER">Dine-In Pre-Order</option>
              <option value="TAKEAWAY">Takeaway</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-[#A5A198] shrink-0">
          Showing {orders.length} of {total} records
        </div>
      </div>

      {/* Orders Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-[#141412] border-[#2A2925]' : 'bg-white border-stone-200'
        }`}
      >
        {loading ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            <div className="w-8 h-8 border-2 border-[#B99A63] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-stone-500 font-mono text-sm">
            No matching orders found for this location.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#2A2925] bg-[#1C1B17]/40 text-xs font-mono text-[#A5A198] uppercase">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Placed / Scheduled</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2925]">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#1C1B17]/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-[#F6F1E8]">
                      #{order.orderReference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#F6F1E8]">{order.customerName}</div>
                      <div className="text-xs text-stone-500 font-mono">{order.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-stone-400">
                      {order.orderType === 'DINE_IN_PREORDER' ? 'Dine-In' : 'Takeaway'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-stone-400">
                      <div>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-stone-500">
                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-mono uppercase font-semibold ${
                          order.orderStatus === 'PREPARING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : order.orderStatus === 'READY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : order.orderStatus === 'COMPLETED'
                            ? 'bg-stone-500/20 text-stone-400'
                            : order.orderStatus === 'CANCELLED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span
                        className={
                          order.paymentStatus === 'PAID'
                            ? 'text-emerald-400'
                            : order.paymentStatus === 'REFUNDED'
                            ? 'text-purple-400'
                            : 'text-amber-400'
                        }
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#B99A63]">
                      {(order.totalMinor / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: order.currency || 'LKR',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded hover:bg-[#2A2925] text-stone-400 hover:text-[#F6F1E8] transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="p-4 border-t border-[#2A2925] flex items-center justify-between text-xs font-mono text-stone-400">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border border-[#2A2925] hover:bg-[#1C1B17] disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {Math.ceil(total / 15)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 15)}
              className="px-3 py-1.5 rounded border border-[#2A2925] hover:bg-[#1C1B17] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141412] border border-[#B99A63]/30 rounded-xl shadow-2xl p-6 text-[#F6F1E8]">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-[#F6F1E8]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between border-b border-[#2A2925] pb-4 mb-4">
              <div>
                <span className="text-xs font-mono text-[#B99A63] uppercase tracking-wider">Order Details</span>
                <h2 className="text-xl font-serif text-[#F6F1E8]">Order #{selectedOrder.orderReference}</h2>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded text-xs font-mono uppercase font-semibold ${
                    selectedOrder.orderStatus === 'PREPARING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : selectedOrder.orderStatus === 'READY'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : selectedOrder.orderStatus === 'COMPLETED'
                      ? 'bg-stone-500/20 text-stone-400'
                      : selectedOrder.orderStatus === 'CANCELLED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {selectedOrder.orderStatus}
                </span>
              </div>
            </div>

            {/* Customer & Scheduling Info */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-[#1C1B17] p-3 rounded-lg mb-4">
              <div>
                <div className="text-stone-500 mb-0.5">Guest Information</div>
                <div className="text-sm font-sans font-medium text-[#F6F1E8]">{selectedOrder.customerName}</div>
                <div className="text-stone-400">{selectedOrder.customerPhone}</div>
                <div className="text-stone-400">{selectedOrder.customerEmail}</div>
              </div>
              <div>
                <div className="text-stone-500 mb-0.5">Order Type & Schedule</div>
                <div className="text-sm font-sans font-medium text-[#F6F1E8]">{selectedOrder.orderType}</div>
                <div className="text-stone-400">
                  Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
                {selectedOrder.scheduledFor && (
                  <div className="text-amber-400">
                    Scheduled For: {new Date(selectedOrder.scheduledFor).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Itemized Dishes */}
            <div className="mb-4">
              <h4 className="text-xs font-mono uppercase text-[#A5A198] tracking-wider mb-2">Itemized Dishes</h4>
              <div className="divide-y divide-[#2A2925] border border-[#2A2925] rounded-lg overflow-hidden bg-[#1C1B17]/40">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between text-sm">
                    <div>
                      <div className="font-medium text-[#F6F1E8]">
                        <span className="text-[#B99A63] font-mono mr-2">{item.quantity}x</span>
                        {item.dishName}
                      </div>
                      {item.specialInstructions && (
                        <div className="text-xs text-amber-300 italic mt-0.5">
                          Note: {item.specialInstructions}
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-xs text-[#B99A63]">
                      {((item.lineTotalMinor || 0) / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: selectedOrder.currency || 'LKR',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-[#2A2925] pt-3 mb-4 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal</span>
                <span>
                  {(selectedOrder.subtotalMinor / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: selectedOrder.currency || 'LKR',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Service Charge</span>
                <span>
                  {(selectedOrder.serviceChargeMinor / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: selectedOrder.currency || 'LKR',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Dining Tax</span>
                <span>
                  {(selectedOrder.taxMinor / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: selectedOrder.currency || 'LKR',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#F6F1E8] pt-2 border-t border-[#2A2925]">
                <span>Total Amount</span>
                <span className="text-[#B99A63]">
                  {(selectedOrder.totalMinor / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: selectedOrder.currency || 'LKR',
                  })}
                </span>
              </div>
            </div>

            {/* Cancellation reason if applicable */}
            {selectedOrder.cancellationReason && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono mb-4">
                <strong>Cancellation Reason:</strong> {selectedOrder.cancellationReason}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#2A2925]">
              <div>
                {selectedOrder.orderStatus !== 'COMPLETED' &&
                  selectedOrder.orderStatus !== 'CANCELLED' && (
                    <button
                      onClick={() => setCancelModalOrder(selectedOrder)}
                      className="px-3 py-1.5 rounded text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <Ban size={14} />
                      <span>Cancel Order (Manager Override)</span>
                    </button>
                  )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono text-[#A5A198] hover:text-[#F6F1E8] bg-[#1E1D1A] hover:bg-[#2A2925] border border-[#2A2925] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirm Modal */}
      {cancelModalOrder && (
        <OverrideConfirmModal
          isOpen={true}
          onClose={() => setCancelModalOrder(null)}
          title="Cancel Delayed Order"
          actionName="ORDER CANCELLATION OVERRIDE"
          description="Cancel an active customer order under managerial authority. An explicit operational justification is required for auditing."
          recordSummary={`Order #${cancelModalOrder.orderReference} (${cancelModalOrder.customerName} - ${(cancelModalOrder.totalMinor / 100).toFixed(2)} ${cancelModalOrder.currency})`}
          onConfirm={handleCancelOrder}
        />
      )}
    </StaffLayout>
  );
}
