'use client';

import React from 'react';
import Link from 'next/link';
import { RecentOrderSummary } from '../../types/dashboard';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { StaffStatusBadge } from '../staff/StaffStatusBadge';
import { ShoppingBag, ArrowRight, Clock, Layers } from 'lucide-react';

interface RecentOrdersCardProps {
  orders: RecentOrderSummary[];
  connected: boolean;
  statusMessage: string;
}

export const RecentOrdersCard = ({
  orders,
  connected,
  statusMessage,
}: RecentOrdersCardProps) => {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#B99A63]/15 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h3
                className={`text-base font-serif font-semibold tracking-wide ${
                  isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                }`}
              >
                Recent Orders
              </h3>
              <span className="text-[10px] font-mono text-[#737068] uppercase">
                Transaction Feed
              </span>
            </div>
          </div>

          <Link
            href="/staff/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#B99A63] hover:underline"
          >
            <span>View All Orders</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {connected && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2C2C28] text-[10px] font-mono uppercase text-[#737068]">
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2C28]/40">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#B99A63]/5 transition-colors">
                    <td className="py-2.5 font-mono font-medium text-[#B99A63]">
                      {order.reference}
                    </td>
                    <td className="py-2.5 text-[#A5A198]">{order.orderType}</td>
                    <td className="py-2.5 font-mono text-[#737068]">
                      {new Date(order.orderTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 font-mono font-semibold">
                      {order.currency} {order.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <StaffStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/40 text-zinc-500 border border-zinc-700/50 flex items-center justify-center mb-3">
              <Layers size={22} />
            </div>
            <p
              className={`text-xs font-medium ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              {connected ? 'No orders to display yet.' : 'Order Management Pending'}
            </p>
            <p className="text-[11px] text-[#737068] mt-1 max-w-sm">
              {statusMessage}
            </p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#B99A63]/10 mt-4 flex items-center justify-between text-[10px] font-mono text-[#737068]">
        <span>Source: Aurelle Order Subsystem</span>
        <span>{connected ? 'Active Feed' : 'Stage 5 Scheduled'}</span>
      </div>
    </div>
  );
};
