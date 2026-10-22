'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../components/staff/StaffPageHeader';
import { StaffEmptyState } from '../../../components/staff/StaffEmptyState';
import { useStaffTheme } from '../../../context/StaffThemeContext';
import { apiClient } from '../../../lib/api';
import {
  INotification,
  NotificationCategory,
  NotificationPriority,
} from '../../../types/notification';
import {
  Bell,
  ShoppingBag,
  Calendar,
  ChefHat,
  UserCheck,
  Armchair,
  ShieldAlert,
  Radio,
  CheckCircle2,
  CheckCheck,
  Check,
  Trash2,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Info,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Settings,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Updates', icon: Bell },
  { id: 'order', label: 'Orders', icon: ShoppingBag },
  { id: 'reservation', label: 'Reservations', icon: Calendar },
  { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { id: 'reception', label: 'Reception', icon: UserCheck },
  { id: 'floor', label: 'Floor Operations', icon: Armchair },
  { id: 'vip', label: 'VIP & Events', icon: Sparkles },
  { id: 'management', label: 'Operations & Alerts', icon: AlertTriangle },
  { id: 'security', label: 'Account Security', icon: ShieldAlert },
];

export default function StaffNotificationsPage() {
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [activeCategory, setActiveCategory] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchNotifications = useCallback(
    async (showLoadingSpinner = true) => {
      try {
        if (showLoadingSpinner) setLoading(true);
        else setRefreshing(true);

        const params = new URLSearchParams();
        if (activeCategory !== 'all') params.set('category', activeCategory);
        if (unreadOnly) params.set('isRead', 'false');
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        params.set('page', String(page));
        params.set('limit', '25');

        const res = await apiClient<{
          success: boolean;
          data: {
            notifications: INotification[];
            total: number;
            page: number;
            totalPages: number;
            unreadCount: number;
          };
        }>(`/notifications?${params.toString()}`);

        if (res?.success && res.data) {
          setNotifications(res.data.notifications || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCategory, unreadOnly, searchQuery, page]
  );

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__AURELLE_SOCKET__) {
      const socket = (window as any).__AURELLE_SOCKET__;

      const handleCreated = (notif: INotification) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
        setTotal((t) => t + 1);
      };

      const handleRead = (data: { notificationId: string }) => {
        setNotifications((prev) =>
          prev.map((n) => (n._id === data.notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      };

      const handleReadAll = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      };

      socket.on('notifications.created', handleCreated);
      socket.on('notifications.read', handleRead);
      socket.on('notifications.readAll', handleReadAll);

      return () => {
        socket.off('notifications.created', handleCreated);
        socket.off('notifications.read', handleRead);
        socket.off('notifications.readAll', handleReadAll);
      };
    }
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/read-all', {
        category: activeCategory !== 'all' ? activeCategory : undefined,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error('Delete notification failed:', err);
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.ORDER:
        return <ShoppingBag size={16} className="text-[#B99A63]" />;
      case NotificationCategory.RESERVATION:
        return <Calendar size={16} className="text-amber-400" />;
      case NotificationCategory.KITCHEN:
        return <ChefHat size={16} className="text-orange-400" />;
      case NotificationCategory.FLOOR:
        return <Armchair size={16} className="text-blue-400" />;
      case NotificationCategory.VIP:
      case NotificationCategory.EVENT:
        return <Sparkles size={16} className="text-purple-400" />;
      case NotificationCategory.SECURITY:
        return <ShieldAlert size={16} className="text-emerald-400" />;
      case NotificationCategory.MANAGEMENT:
        return <AlertTriangle size={16} className="text-rose-400" />;
      default:
        return <Info size={16} className="text-stone-400" />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
            Urgent
          </span>
        );
      case NotificationPriority.HIGH:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            High Priority
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <StaffLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <StaffPageHeader
          title="Notifications & Live Alerts"
          subtitle="Operational broadcasts, order dispatch alerts, guest updates, and system activity logs."
        />
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <Link
            href="/staff/profile/notifications"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              isDark
                ? 'bg-[#1E1E1B] text-[#ECE7DF] border-[#2C2C28] hover:border-[#B99A63]/50'
                : 'bg-white text-[#171715] border-[#E5DFD3] hover:border-[#B99A63]/50'
            }`}
          >
            <Settings size={14} className="text-[#B99A63]" />
            <span>Preferences</span>
          </Link>
          <button
            type="button"
            onClick={() => fetchNotifications(false)}
            disabled={refreshing}
            className={`p-2 rounded-xl border transition-colors ${
              isDark
                ? 'bg-[#1E1E1B] text-[#A5A198] border-[#2C2C28] hover:text-[#B99A63]'
                : 'bg-white text-[#6B685F] border-[#E5DFD3] hover:text-[#B99A63]'
            }`}
            title="Refresh feed"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#B99A63]' : ''} />
          </button>
        </div>
      </div>

      {/* Real-time Push Status Card */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Radio size={18} className="animate-pulse" />
          </div>
          <div>
            <h4 className={`text-sm font-semibold ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
              Real-Time Push Stream: Active
            </h4>
            <p className="text-xs text-[#737068]">
              Socket.IO listeners listening to order status, kitchen pass, floor service, and VIP rooms.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#B99A63]/15 text-[#B99A63] border border-[#B99A63]/30 hover:bg-[#B99A63]/25 transition-colors"
            >
              <CheckCheck size={14} />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg">
            <CheckCircle2 size={13} />
            <span>Synchronized</span>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="space-y-4 mb-6">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? isDark
                      ? 'bg-[#B99A63]/15 text-[#B99A63] border-[#B99A63]/40 shadow-sm'
                      : 'bg-[#B99A63]/15 text-[#8F723D] border-[#B99A63]/40 shadow-sm'
                    : isDark
                    ? 'bg-[#1E1E1B] text-[#A5A198] border-[#2C2C28] hover:text-[#F6F1E8]'
                    : 'bg-white text-[#6B685F] border-[#E5DFD3] hover:text-[#171715]'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-[#B99A63]' : 'opacity-60'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Unread Toggle Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737068]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search notifications by title or reference..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none transition-colors ${
                isDark
                  ? 'bg-[#1E1E1B] border-[#2C2C28] text-white placeholder-[#737068] focus:border-[#B99A63]'
                  : 'bg-white border-[#E5DFD3] text-black placeholder-[#737068] focus:border-[#B99A63]'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUnreadOnly(!unreadOnly);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                unreadOnly
                  ? 'bg-[#B99A63] text-[#171715] border-[#B99A63] font-semibold'
                  : isDark
                  ? 'bg-[#1E1E1B] text-[#A5A198] border-[#2C2C28]'
                  : 'bg-white text-[#6B685F] border-[#E5DFD3]'
              }`}
            >
              <Filter size={13} />
              <span>Unread Only ({unreadCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`h-24 rounded-2xl border animate-pulse ${
                isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
              }`}
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <StaffEmptyState
          icon={<Bell size={26} />}
          title={unreadOnly ? 'No Unread Notifications' : 'No Notifications Found'}
          description={
            unreadOnly
              ? 'You have caught up with all incoming alerts. Turn off the unread filter to browse your past history.'
              : 'Real operational events from guest reservations, live kitchen orders, floor service requests, and manager alerts will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            return (
              <div
                key={notif._id}
                className={`group border rounded-2xl p-4 sm:p-5 transition-all flex items-start gap-4 ${
                  !notif.isRead
                    ? isDark
                      ? 'bg-[#1E1E1B] border-[#B99A63]/40 shadow-sm'
                      : 'bg-white border-[#B99A63]/50 shadow-sm'
                    : isDark
                    ? 'bg-[#171715]/60 border-[#22211E] opacity-80 hover:opacity-100'
                    : 'bg-[#F6F1E8]/60 border-[#E5DFD3] opacity-80 hover:opacity-100'
                }`}
              >
                {/* Category Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDark
                      ? 'bg-[#141412] border-[#2C2C28]'
                      : 'bg-stone-50 border-[#E5DFD3]'
                  }`}
                >
                  {getCategoryIcon(notif.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{notif.title}</span>
                    {getPriorityBadge(notif.priority)}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#B99A63] shrink-0" />
                    )}
                    <div className="ml-auto flex items-center gap-1.5 text-[11px] font-mono text-[#737068]">
                      <Clock size={12} />
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <p
                    className={`text-xs leading-relaxed mb-3 ${
                      isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
                    }`}
                  >
                    {notif.message}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#22211E]/30">
                    <div className="flex items-center gap-2">
                      {notif.link && (
                        <Link
                          href={notif.link}
                          onClick={() => handleMarkAsRead(notif._id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B99A63] hover:underline"
                        >
                          <span>Open Associated Workspace</span>
                          <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif._id, e)}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                            isDark
                              ? 'border-[#2C2C28] hover:bg-[#1E1E1B] text-[#A5A198] hover:text-[#B99A63]'
                              : 'border-[#E5DFD3] hover:bg-stone-100 text-[#6B685F] hover:text-[#B99A63]'
                          }`}
                          title="Mark as read"
                        >
                          <Check size={13} />
                          <span className="hidden sm:inline">Mark read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(notif._id, e)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'border-[#2C2C28] hover:bg-red-500/10 text-[#737068] hover:text-red-400'
                            : 'border-[#E5DFD3] hover:bg-red-50 text-[#737068] hover:text-red-600'
                        }`}
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-[#737068]">
                Page {page} of {totalPages} ({total} total alerts)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-40 ${
                    isDark
                      ? 'bg-[#1E1E1B] border-[#2C2C28] text-white'
                      : 'bg-white border-[#E5DFD3] text-black'
                  }`}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-40 ${
                    isDark
                      ? 'bg-[#1E1E1B] border-[#2C2C28] text-white'
                      : 'bg-white border-[#E5DFD3] text-black'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </StaffLayout>
  );
}
