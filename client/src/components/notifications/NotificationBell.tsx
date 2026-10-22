'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  ShoppingBag,
  Calendar,
  ChefHat,
  Armchair,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Info,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { INotification, NotificationCategory, NotificationPriority } from '../../types/notification';

interface NotificationBellProps {
  mode: 'staff' | 'customer';
  isDark?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ mode, isDark = true }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count & recent preview
  const fetchUnreadData = async () => {
    try {
      const countRes = await apiClient<{ success: boolean; data: { unreadCount: number } }>(
        '/notifications/unread-count'
      );
      if (countRes?.success && typeof countRes.data?.unreadCount === 'number') {
        setUnreadCount(countRes.data.unreadCount);
      }

      const listRes = await apiClient<{
        success: boolean;
        data: { notifications: INotification[] };
      }>('/notifications?limit=5');
      if (listRes?.success && Array.isArray(listRes.data?.notifications)) {
        setRecentNotifications(listRes.data.notifications);
      }
    } catch (err) {
      // Graceful fallback if user not logged in
    }
  };

  useEffect(() => {
    fetchUnreadData();

    // Polling heartbeat interval every 20 seconds
    const interval = setInterval(fetchUnreadData, 20000);

    // Socket.IO real-time listener if available
    const handleCreated = (notif: INotification) => {
      setRecentNotifications((prev) => [notif, ...prev.slice(0, 4)]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleUnreadCountChanged = (data: { unreadCount: number }) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    if (typeof window !== 'undefined' && (window as any).__AURELLE_SOCKET__) {
      const socket = (window as any).__AURELLE_SOCKET__;
      socket.on('notifications.created', handleCreated);
      socket.on('notifications.unreadCountChanged', handleUnreadCountChanged);

      return () => {
        clearInterval(interval);
        socket.off('notifications.created', handleCreated);
        socket.off('notifications.unreadCountChanged', handleUnreadCountChanged);
      };
    }

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark single as read
  const handleMarkAsRead = async (id: string, link?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setRecentNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) {
        setIsOpen(false);
        router.push(link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await apiClient.post('/notifications/read-all', {});
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.ORDER:
        return <ShoppingBag size={14} className="text-[#B99A63]" />;
      case NotificationCategory.RESERVATION:
        return <Calendar size={14} className="text-amber-400" />;
      case NotificationCategory.KITCHEN:
        return <ChefHat size={14} className="text-orange-400" />;
      case NotificationCategory.FLOOR:
        return <Armchair size={14} className="text-blue-400" />;
      case NotificationCategory.VIP:
      case NotificationCategory.EVENT:
        return <Sparkles size={14} className="text-purple-400" />;
      case NotificationCategory.SECURITY:
        return <ShieldAlert size={14} className="text-emerald-400" />;
      case NotificationCategory.MANAGEMENT:
        return <AlertTriangle size={14} className="text-rose-400" />;
      default:
        return <Info size={14} className="text-stone-400" />;
    }
  };

  const historyLink = mode === 'staff' ? '/staff/notifications' : '/account/notifications';
  const preferencesLink =
    mode === 'staff' ? '/staff/profile/notifications' : '/account/notification-preferences';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchUnreadData();
        }}
        className={`relative p-2 rounded-lg border transition-colors select-none ${
          isDark
            ? 'border-[#2C2C28] bg-[#1E1E1B] text-[#A5A198] hover:text-[#B99A63] hover:border-[#B99A63]/40'
            : 'border-[#D9D2C4] bg-white text-[#6B685F] hover:text-[#B99A63] hover:border-[#B99A63]/50'
        }`}
        title="Notifications & Alerts"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B99A63] text-[#171715] font-bold text-[10px] flex items-center justify-center shadow-lg border border-[#171715]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 text-xs overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150 ${
            isDark
              ? 'bg-[#171715] border-[#2C2C28] text-[#ECE7DF]'
              : 'bg-white border-[#E5DFD3] text-[#171715]'
          }`}
        >
          {/* Header */}
          <div
            className={`p-3.5 border-b flex items-center justify-between ${
              isDark ? 'border-[#22211E] bg-[#1E1E1B]/50' : 'border-[#E5DFD3] bg-[#F6F1E8]/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B99A63]/20 text-[#B99A63] border border-[#B99A63]/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-[11px] text-[#B99A63] hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
              >
                <CheckCheck size={13} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Preview */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#22211E]/40 scrollbar-thin">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-[#737068]">
                <Bell size={24} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-xs">No notifications</p>
                <p className="text-[11px] mt-0.5">You're all caught up on alerts and updates.</p>
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const isUrgent =
                  notif.priority === NotificationPriority.URGENT ||
                  notif.priority === NotificationPriority.HIGH;
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleMarkAsRead(notif._id, notif.link)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      !notif.isRead
                        ? isDark
                          ? 'bg-[#B99A63]/5 hover:bg-[#B99A63]/10'
                          : 'bg-[#B99A63]/10 hover:bg-[#B99A63]/15'
                        : isDark
                        ? 'hover:bg-[#1E1E1B]'
                        : 'hover:bg-[#F6F1E8]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                        isDark
                          ? 'bg-[#1E1E1B] border-[#2C2C28]'
                          : 'bg-stone-100 border-[#E5DFD3]'
                      }`}
                    >
                      {getCategoryIcon(notif.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`font-semibold text-xs truncate ${
                            !notif.isRead
                              ? isDark
                                ? 'text-white'
                                : 'text-black'
                              : isDark
                              ? 'text-[#A5A198]'
                              : 'text-stone-600'
                          }`}
                        >
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#B99A63] shrink-0" />
                        )}
                      </div>
                      <p
                        className={`text-[11px] line-clamp-2 leading-relaxed ${
                          isDark ? 'text-[#A5A198]' : 'text-stone-600'
                        }`}
                      >
                        {notif.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation */}
          <div
            className={`p-2.5 border-t flex items-center justify-between text-[11px] font-medium ${
              isDark ? 'border-[#22211E] bg-[#141412]' : 'border-[#E5DFD3] bg-[#F6F1E8]'
            }`}
          >
            <Link
              href={historyLink}
              onClick={() => setIsOpen(false)}
              className="text-[#B99A63] hover:underline flex items-center gap-1"
            >
              <span>All notifications</span>
              <ExternalLink size={11} />
            </Link>
            <Link
              href={preferencesLink}
              onClick={() => setIsOpen(false)}
              className="text-[#737068] hover:text-[#B99A63] flex items-center gap-1 transition-colors"
            >
              <Settings size={12} />
              <span>Preferences</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
