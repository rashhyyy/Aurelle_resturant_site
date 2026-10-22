'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ShoppingBag,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Settings,
  Clock,
  Filter,
} from 'lucide-react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { apiClient } from '../../../lib/api';
import {
  INotification,
  NotificationCategory,
  NotificationPriority,
} from '../../../types/notification';

const CUSTOMER_CATEGORIES = [
  { id: 'all', label: 'All Alerts', icon: Bell },
  { id: 'order', label: 'Dining Orders', icon: ShoppingBag },
  { id: 'reservation', label: 'Table Reservations', icon: Calendar },
  { id: 'vip', label: 'Private Suites & VIP', icon: Sparkles },
  { id: 'security', label: 'Security & Account', icon: ShieldCheck },
];

export default function CustomerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (unreadOnly) params.set('isRead', 'false');

      const res = await apiClient<{
        success: boolean;
        data: { notifications: INotification[]; unreadCount: number };
      }>(`/notifications?${params.toString()}`);

      if (res?.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket.IO real-time synchronization
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__AURELLE_SOCKET__) {
      const socket = (window as any).__AURELLE_SOCKET__;

      const handleCreated = (notif: INotification) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      };

      const handleRead = (data: { notificationId: string }) => {
        setNotifications((prev) =>
          prev.map((n) => (n._id === data.notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      };

      socket.on('notifications.created', handleCreated);
      socket.on('notifications.read', handleRead);

      return () => {
        socket.off('notifications.created', handleCreated);
        socket.off('notifications.read', handleRead);
      };
    }
  }, []);

  const handleMarkAsRead = async (id: string, link?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (link) {
        router.push(link);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
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
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.ORDER:
        return <ShoppingBag size={16} className="text-[#B99A63]" />;
      case NotificationCategory.RESERVATION:
        return <Calendar size={16} className="text-[#C1A87D]" />;
      case NotificationCategory.VIP:
      case NotificationCategory.EVENT:
        return <Sparkles size={16} className="text-purple-400" />;
      case NotificationCategory.SECURITY:
        return <ShieldCheck size={16} className="text-emerald-400" />;
      default:
        return <Bell size={16} className="text-stone-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D0E] text-[#ECE7DF] flex flex-col justify-between selection:bg-[#B99A63]/30">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header navigation bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800/80 mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700 transition-colors"
              title="Return to Home"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <span className="text-[11px] font-mono tracking-[0.25em] text-[#C1A87D] uppercase">
                Aurelle Guest Concierge
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide mt-0.5">
                Notifications & Dining Alerts
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              href="/account/notification-preferences"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-800 bg-[#141518] text-xs text-stone-300 hover:text-[#C1A87D] hover:border-[#C1A87D]/40 transition-colors"
            >
              <Settings size={14} className="text-[#C1A87D]" />
              <span>Preferences</span>
            </Link>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C1A87D]/15 text-[#C1A87D] border border-[#C1A87D]/30 text-xs font-medium hover:bg-[#C1A87D]/25 transition-colors"
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {CUSTOMER_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#C1A87D]/15 text-[#C1A87D] border-[#C1A87D]/40 shadow-sm'
                    : 'bg-[#141518] text-stone-400 border-stone-800 hover:text-white hover:border-stone-700'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-[#C1A87D]' : 'opacity-60'} />
                <span>{cat.label}</span>
              </button>
            );
          })}

          <div className="ml-auto pl-2">
            <button
              type="button"
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                unreadOnly
                  ? 'bg-[#C1A87D] text-black font-semibold border-[#C1A87D]'
                  : 'bg-[#141518] text-stone-400 border-stone-800'
              }`}
            >
              <Filter size={12} />
              <span>Unread Only ({unreadCount})</span>
            </button>
          </div>
        </div>

        {/* Notifications Feed */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-stone-800/80 bg-[#141518] animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 px-4 border border-stone-800/60 rounded-2xl bg-[#141518]/50">
            <div className="w-14 h-14 rounded-full bg-[#C1A87D]/10 text-[#C1A87D] border border-[#C1A87D]/20 flex items-center justify-center mx-auto mb-4">
              <Bell size={24} />
            </div>
            <h3 className="text-lg font-serif text-white mb-1">No Notifications</h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
              You are completely up to date. Order receipts, table reservation confirmations, and VIP suite updates will stream here directly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleMarkAsRead(notif._id, notif.link)}
                className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                  !notif.isRead
                    ? 'bg-[#16181C] border-[#C1A87D]/40 shadow-sm'
                    : 'bg-[#121316] border-stone-800/80 opacity-75 hover:opacity-100 hover:border-stone-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm text-white truncate">
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#C1A87D] shrink-0" />
                    )}
                    <span className="text-[11px] font-mono text-stone-500 whitespace-nowrap ml-auto">
                      {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed mb-3">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/60">
                    <div>
                      {notif.link && (
                        <span className="inline-flex items-center gap-1 text-xs text-[#C1A87D] hover:underline font-medium">
                          <span>View Details</span>
                          <ExternalLink size={12} />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif._id, undefined, e)}
                          className="p-1 text-xs text-stone-400 hover:text-white"
                          title="Mark read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif._id, e)}
                        className="p-1 text-xs text-stone-500 hover:text-red-400 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
