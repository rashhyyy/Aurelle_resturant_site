'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { apiClient } from '../../../../lib/api';
import {
  DeliveryChannel,
  DeliveryStatus,
  INotificationDelivery,
  DeliveryMonitoringData,
} from '../../../../types/notification';
import {
  Bell,
  Mail,
  Smartphone,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Activity,
  Send,
  ShieldCheck,
  Search,
} from 'lucide-react';

export default function AdminNotificationDeliveriesPage() {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);
  const [data, setData] = useState<DeliveryMonitoringData>({
    stats: {
      totalDeliveries: 0,
      deliveredCount: 0,
      pendingCount: 0,
      failedCount: 0,
      inAppCount: 0,
      emailCount: 0,
      smsCount: 0,
      successRate: 100,
    },
    deliveries: [],
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedChannel !== 'all') params.set('channel', selectedChannel);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      params.set('page', String(page));
      params.set('limit', '25');

      const res = await apiClient<{ success: boolean; data: DeliveryMonitoringData }>(
        `/notifications/admin/deliveries?${params.toString()}`
      );
      if (res?.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load deliveries data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, selectedStatus, page]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleRetryFailed = async () => {
    try {
      setRetrying(true);
      setRetryResult(null);
      const res = await apiClient<{
        success: boolean;
        message: string;
        data: { retried: number; succeeded: number; failed: number };
      }>('/notifications/admin/retry', { method: 'POST' });
      if (res?.success) {
        setRetryResult(res.message || 'Retry queue executed successfully.');
        fetchDeliveries();
      }
    } catch (err: any) {
      setRetryResult(`Retry failed: ${err?.message || 'Server error'}`);
    } finally {
      setRetrying(false);
    }
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.DELIVERED:
      case DeliveryStatus.SENT:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={11} />
            <span>Delivered</span>
          </span>
        );
      case DeliveryStatus.FAILED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertTriangle size={11} />
            <span>Failed</span>
          </span>
        );
      case DeliveryStatus.PENDING:
      case DeliveryStatus.QUEUED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock size={11} />
            <span>Queued</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getChannelIcon = (channel: DeliveryChannel) => {
    switch (channel) {
      case DeliveryChannel.IN_APP:
        return <Bell size={13} className="text-[#B99A63]" />;
      case DeliveryChannel.EMAIL:
        return <Mail size={13} className="text-blue-400" />;
      case DeliveryChannel.SMS:
        return <Smartphone size={13} className="text-purple-400" />;
    }
  };

  return (
    <StaffLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <StaffPageHeader
          title="Notification Delivery Operations"
          subtitle="Enterprise multi-channel dispatch monitoring, retry queues, and latency telemetry."
        />
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRetryFailed}
            disabled={retrying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#B99A63] text-[#171715] hover:bg-[#A38550] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RotateCcw size={14} className={retrying ? 'animate-spin' : ''} />
            <span>{retrying ? 'Retrying Queue...' : 'Retry Failed Deliveries'}</span>
          </button>
          <button
            type="button"
            onClick={() => fetchDeliveries()}
            className={`p-2 rounded-xl border transition-colors ${
              isDark
                ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#A5A198] hover:text-[#B99A63]'
                : 'bg-white border-[#E5DFD3] text-[#6B685F] hover:text-[#B99A63]'
            }`}
            title="Refresh logs"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {retryResult && (
        <div className="mb-6 p-4 rounded-xl border border-[#B99A63]/30 bg-[#B99A63]/10 text-[#ECE7DF] text-xs flex items-center justify-between">
          <span>{retryResult}</span>
          <button
            onClick={() => setRetryResult(null)}
            className="text-[11px] underline text-[#B99A63]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-[#737068] text-xs font-mono mb-2">
            <span>TOTAL DISPATCHED</span>
            <Send size={15} className="text-[#B99A63]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F6F1E8]">
            {data.stats.totalDeliveries}
          </div>
          <div className="text-[11px] text-[#737068] mt-1">Multi-channel events</div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-[#737068] text-xs font-mono mb-2">
            <span>SUCCESS RATE</span>
            <Activity size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {data.stats.successRate}%
          </div>
          <div className="text-[11px] text-[#737068] mt-1">
            {data.stats.deliveredCount} delivered / confirmed
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-[#737068] text-xs font-mono mb-2">
            <span>EMAIL & SMS</span>
            <Mail size={15} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {data.stats.emailCount + data.stats.smsCount}
          </div>
          <div className="text-[11px] text-[#737068] mt-1">
            {data.stats.emailCount} Email &bull; {data.stats.smsCount} SMS
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-[#737068] text-xs font-mono mb-2">
            <span>FAILED & RETRIES</span>
            <AlertTriangle size={15} className="text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {data.stats.failedCount}
          </div>
          <div className="text-[11px] text-[#737068] mt-1">
            {data.stats.pendingCount} currently queued
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-[#737068]">
          <Filter size={13} />
          <span>Channel:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {['all', 'IN_APP', 'EMAIL', 'SMS'].map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setSelectedChannel(ch);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selectedChannel === ch
                  ? 'bg-[#B99A63] text-[#171715] border-[#B99A63] font-semibold'
                  : isDark
                  ? 'bg-[#1E1E1B] text-[#A5A198] border-[#2C2C28]'
                  : 'bg-white text-[#6B685F] border-[#E5DFD3]'
              }`}
            >
              {ch.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {['all', 'DELIVERED', 'PENDING', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStatus(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selectedStatus === st
                  ? 'bg-[#B99A63] text-[#171715] border-[#B99A63] font-semibold'
                  : isDark
                  ? 'bg-[#1E1E1B] text-[#A5A198] border-[#2C2C28]'
                  : 'bg-white text-[#6B685F] border-[#E5DFD3]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Logs Table */}
      <div
        className={`border rounded-2xl overflow-hidden ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b ${
                  isDark
                    ? 'border-[#2C2C28] bg-[#141412] text-[#737068]'
                    : 'border-[#E5DFD3] bg-[#F6F1E8] text-[#737068]'
                }`}
              >
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                  Timestamp
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                  Channel
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                  Target & Recipient
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                  Notification Content
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                  Status
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                  Attempts
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                  Provider Telemetry
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2C28]/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#737068]">
                    Loading delivery audit logs...
                  </td>
                </tr>
              ) : data.deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#737068]">
                    No delivery records found matching current criteria.
                  </td>
                </tr>
              ) : (
                data.deliveries.map((del) => {
                  const notif = typeof del.notificationId === 'object' ? del.notificationId : null;
                  return (
                    <tr key={del._id} className="hover:bg-[#B99A63]/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#737068] whitespace-nowrap">
                        {new Date(del.createdAt).toLocaleDateString()} {new Date(del.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border border-[#2C2C28]">
                          {getChannelIcon(del.channel)}
                          <span>{del.channel}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs">{del.recipientType}</div>
                        <div className="text-[11px] text-[#737068] font-mono truncate max-w-[150px]">
                          {del.recipientDestination}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-medium truncate text-xs">
                          {notif?.title || 'Notification'}
                        </div>
                        <div className="text-[11px] text-[#737068] truncate">
                          {notif?.message || ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(del.status)}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {del.attempts} / {del.maxAttempts}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] font-mono text-[#737068] max-w-[180px] truncate">
                        {del.failureReason ? (
                          <span className="text-red-400">{del.failureReason}</span>
                        ) : del.providerMessageId ? (
                          <span className="text-emerald-400 truncate block">
                            ID: {del.providerMessageId}
                          </span>
                        ) : (
                          'Socket Direct Delivery'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div
            className={`p-4 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-[#2C2C28] bg-[#141412]' : 'border-[#E5DFD3] bg-[#F6F1E8]'
            }`}
          >
            <span className="text-[#737068]">
              Page {data.page} of {data.totalPages} ({data.total} total logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
                className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
