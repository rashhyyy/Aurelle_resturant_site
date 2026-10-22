'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClientOrder,
  OrderStatus,
  KitchenPriority,
  KitchenSummaryMetrics,
  OrderType,
} from '../../types/order';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { useStaffTheme } from '../../context/StaffThemeContext';
import { useSocket } from '../../context/SocketContext';
import { OrderCard } from './OrderCard';
import { OrderDetailsModal } from './OrderDetailsModal';
import { playKitchenChime } from '../../lib/kitchenAudio';
import {
  ChefHat,
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Radio,
  AlertCircle,
} from 'lucide-react';

interface KitchenDisplayBoardProps {
  initialMode?: 'all' | 'new' | 'preparing' | 'ready' | 'scheduled';
}

export function KitchenDisplayBoard({ initialMode = 'all' }: KitchenDisplayBoardProps) {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';
  const { socket, connected, isStaffAuthenticated } = useSocket();
  const isLive = connected && (isStaffAuthenticated || Boolean(staff));

  // State
  const [boardData, setBoardData] = useState<{
    newOrders: ClientOrder[];
    preparing: ClientOrder[];
    ready: ClientOrder[];
  }>({
    newOrders: [],
    preparing: [],
    ready: [],
  });

  const [scheduledOrders, setScheduledOrders] = useState<ClientOrder[]>([]);
  const [summary, setSummary] = useState<KitchenSummaryMetrics>({
    newOrders: 0,
    preparing: 0,
    ready: 0,
    scheduled: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'preparing' | 'ready' | 'scheduled'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | OrderType>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL' | KitchenPriority>('ALL');
  const [sortBy, setSortBy] = useState<'scheduledFor' | 'createdAt' | 'priority'>('scheduledFor');

  // Sound chime settings (stored in localStorage)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Check saved sound preference
    const saved = localStorage.getItem('aurelle_kds_sound');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }) +
          ' • ' +
          now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('aurelle_kds_sound', String(next));
    if (next) {
      playKitchenChime();
    }
  };

  // Fetch kitchen orders
  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (selectedLocation) params.set('locationId', selectedLocation);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (filterType !== 'ALL') params.set('orderType', filterType);
      if (filterPriority !== 'ALL') params.set('priority', filterPriority);
      params.set('sortBy', sortBy);

      const [boardRes, schedRes] = await Promise.all([
        fetch(`/api/kitchen/orders?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/kitchen/orders/scheduled?locationId=${selectedLocation || ''}`, { credentials: 'include' }),
      ]);

      if (!boardRes.ok) {
        throw new Error('Failed to load kitchen display board.');
      }

      const boardJson = await boardRes.json();
      if (boardJson.success && boardJson.data) {
        setBoardData({
          newOrders: boardJson.data.newOrders || [],
          preparing: boardJson.data.preparing || [],
          ready: boardJson.data.ready || [],
        });
        if (boardJson.data.summary) {
          setSummary(boardJson.data.summary);
        }
      }

      if (schedRes.ok) {
        const schedJson = await schedRes.json();
        if (schedJson.success && schedJson.data) {
          setScheduledOrders(schedJson.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with kitchen API.');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, searchQuery, filterType, filterPriority, sortBy]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Socket.IO real-time event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = () => {
      if (soundEnabled) {
        playKitchenChime();
      }
      fetchOrders();
    };

    const handleUpdate = () => {
      fetchOrders();
    };

    socket.on('kitchen.orderAvailable', handleNewOrder);
    socket.on('orders.created', handleNewOrder);
    socket.on('kitchen.orderAccepted', handleUpdate);
    socket.on('kitchen.orderPreparing', handleUpdate);
    socket.on('kitchen.orderReady', handleUpdate);
    socket.on('kitchen.orderCompleted', handleUpdate);
    socket.on('orders.statusChanged', handleUpdate);
    socket.on('orders.updated', handleUpdate);

    return () => {
      socket.off('kitchen.orderAvailable', handleNewOrder);
      socket.off('orders.created', handleNewOrder);
      socket.off('kitchen.orderAccepted', handleUpdate);
      socket.off('kitchen.orderPreparing', handleUpdate);
      socket.off('kitchen.orderReady', handleUpdate);
      socket.off('kitchen.orderCompleted', handleUpdate);
      socket.off('orders.statusChanged', handleUpdate);
      socket.off('orders.updated', handleUpdate);
    };
  }, [socket, soundEnabled, fetchOrders]);

  // Periodic background check so scheduled pre-orders automatically move to NEW ORDERS when lead time arrives
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 20000); // 20-second cadence
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Order Actions
  const handleAcceptOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/kitchen/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to accept order.');
      }
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(data.data);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartPrep = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/kitchen/orders/${orderId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: 'Cook started preparation' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to start preparation.');
      }
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(data.data);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/kitchen/orders/${orderId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: 'Order plated and ready on pass' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to mark order ready.');
      }
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(data.data);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteHandoff = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/kitchen/orders/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: 'Order handed off to customer / server' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to complete order handoff.');
      }
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(data.data);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Live telemetry, Location, Clock & Audio Toggle */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-[#B99A63] border border-amber-500/30 flex items-center justify-center shrink-0">
            <ChefHat size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className={`text-lg sm:text-xl font-serif font-bold ${
                  isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                }`}
              >
                Culinary Display System
              </h2>
              {/* Connection Status Pulse */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold ${
                  isLive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                {isLive ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-xs text-[#737068]">
              {selectedLocation || 'Flagship Venue'} • Real-time station expediting
            </p>
          </div>
        </div>

        {/* Live Clock & Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {currentTime && (
            <div
              className={`px-3 py-1.5 rounded-xl border font-mono text-xs ${
                isDark ? 'bg-[#141412] border-[#2C2C28] text-[#A5A198]' : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#6B685F]'
              }`}
            >
              {currentTime}
            </div>
          )}

          {/* Sound Alert Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : isDark
                ? 'bg-[#141412] border-[#2C2C28] text-[#737068]'
                : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#8E8A80]'
            }`}
            title={soundEnabled ? 'Mute Kitchen Audio Alert' : 'Enable Audio Alert'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchOrders}
            className={`p-2 rounded-xl border transition-colors ${
              isDark
                ? 'bg-[#141412] border-[#2C2C28] hover:bg-[#2C2C28] text-[#A5A198]'
                : 'bg-[#FAF7F2] border-[#E8E2D5] hover:bg-[#F0ECE1] text-[#6B685F]'
            }`}
            title="Refresh Orders"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: New Orders */}
        <div
          onClick={() => setActiveTab('new')}
          className={`cursor-pointer border rounded-2xl p-4 transition-all duration-200 hover:shadow-md ${
            activeTab === 'new'
              ? 'ring-2 ring-[#B99A63] border-[#B99A63]'
              : isDark
              ? 'bg-[#1E1E1B] border-[#2C2C28]'
              : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-[#B99A63] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">New Orders</span>
            <Clock size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#B99A63]">
            {summary.newOrders}
          </div>
          <p className="text-[11px] text-[#737068] mt-1">Ready for ticket acceptance</p>
        </div>

        {/* Card 2: Preparing */}
        <div
          onClick={() => setActiveTab('preparing')}
          className={`cursor-pointer border rounded-2xl p-4 transition-all duration-200 hover:shadow-md ${
            activeTab === 'preparing'
              ? 'ring-2 ring-amber-500 border-amber-500'
              : isDark
              ? 'bg-[#1E1E1B] border-[#2C2C28]'
              : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">In Preparation</span>
            <Flame size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
            {summary.preparing}
          </div>
          <p className="text-[11px] text-[#737068] mt-1">Actively cooking on the line</p>
        </div>

        {/* Card 3: Ready */}
        <div
          onClick={() => setActiveTab('ready')}
          className={`cursor-pointer border rounded-2xl p-4 transition-all duration-200 hover:shadow-md ${
            activeTab === 'ready'
              ? 'ring-2 ring-emerald-500 border-emerald-500'
              : isDark
              ? 'bg-[#1E1E1B] border-[#2C2C28]'
              : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Ready for Pass</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            {summary.ready}
          </div>
          <p className="text-[11px] text-[#737068] mt-1">Plated and awaiting handoff</p>
        </div>

        {/* Card 4: Scheduled */}
        <div
          onClick={() => setActiveTab('scheduled')}
          className={`cursor-pointer border rounded-2xl p-4 transition-all duration-200 hover:shadow-md ${
            activeTab === 'scheduled'
              ? 'ring-2 ring-blue-500 border-blue-500'
              : isDark
              ? 'bg-[#1E1E1B] border-[#2C2C28]'
              : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Scheduled Pre-orders</span>
            <Calendar size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-400">
            {summary.scheduled}
          </div>
          <p className="text-[11px] text-[#737068] mt-1">Activates 30m prior to pickup</p>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div
        className={`border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        {/* View / Column Tabs */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
              activeTab === 'all'
                ? 'bg-[#B99A63] text-black shadow'
                : isDark
                ? 'bg-[#141412] text-[#8E8A80] hover:text-[#F6F1E8]'
                : 'bg-[#FAF7F2] text-[#6B685F] hover:text-[#171715]'
            }`}
          >
            ALL STATIONS
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
              activeTab === 'new'
                ? 'bg-[#B99A63] text-black shadow'
                : isDark
                ? 'bg-[#141412] text-[#8E8A80] hover:text-[#F6F1E8]'
                : 'bg-[#FAF7F2] text-[#6B685F] hover:text-[#171715]'
            }`}
          >
            NEW ({summary.newOrders})
          </button>
          <button
            onClick={() => setActiveTab('preparing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
              activeTab === 'preparing'
                ? 'bg-amber-500 text-black shadow'
                : isDark
                ? 'bg-[#141412] text-[#8E8A80] hover:text-[#F6F1E8]'
                : 'bg-[#FAF7F2] text-[#6B685F] hover:text-[#171715]'
            }`}
          >
            PREPARING ({summary.preparing})
          </button>
          <button
            onClick={() => setActiveTab('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
              activeTab === 'ready'
                ? 'bg-emerald-600 text-white shadow'
                : isDark
                ? 'bg-[#141412] text-[#8E8A80] hover:text-[#F6F1E8]'
                : 'bg-[#FAF7F2] text-[#6B685F] hover:text-[#171715]'
            }`}
          >
            READY ({summary.ready})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-colors ${
              activeTab === 'scheduled'
                ? 'bg-blue-600 text-white shadow'
                : isDark
                ? 'bg-[#141412] text-[#8E8A80] hover:text-[#F6F1E8]'
                : 'bg-[#FAF7F2] text-[#6B685F] hover:text-[#171715]'
            }`}
          >
            SCHEDULED ({summary.scheduled})
          </button>
        </div>

        {/* Search & Select Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737068]" />
            <input
              type="text"
              placeholder="Search Ref, Guest, Dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#B99A63] ${
                isDark
                  ? 'bg-[#141412] border-[#2C2C28] text-[#F6F1E8]'
                  : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#171715]'
              }`}
            />
          </div>

          {/* Order Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className={`px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none ${
              isDark ? 'bg-[#141412] border-[#2C2C28] text-[#A5A198]' : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#6B685F]'
            }`}
          >
            <option value="ALL">All Types</option>
            <option value="TAKEAWAY">Takeaway</option>
            <option value="DINE_IN_PREORDER">Dine-in Pre-order</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className={`px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none ${
              isDark ? 'bg-[#141412] border-[#2C2C28] text-[#A5A198]' : 'bg-[#FAF7F2] border-[#E8E2D5] text-[#6B685F]'
            }`}
          >
            <option value="ALL">All Urgencies</option>
            <option value="URGENT">Urgent</option>
            <option value="ATTENTION_REQUIRED">Attention Required</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
      </div>

      {/* Main Kanban Board Display */}
      {activeTab !== 'scheduled' ? (
        <div className={`grid gap-4 items-start ${
          activeTab === 'all'
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {/* Column 1: New Orders */}
          {(activeTab === 'all' || activeTab === 'new') && (
            <div
              className={`border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 ${
                isDark ? 'bg-[#141412] border-[#2C2C28]' : 'bg-[#FAF7F2] border-[#E8E2D5]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#2C2C28]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#B99A63]" />
                  <h3 className="font-serif font-bold text-base tracking-wide">
                    New Incoming
                  </h3>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#B99A63]/20 text-[#B99A63] font-bold">
                  {boardData.newOrders.length}
                </span>
              </div>

              {boardData.newOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#737068] space-y-2">
                  <p>No new tickets in queue.</p>
                  {scheduledOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('scheduled')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-mono hover:bg-blue-500/20 transition-colors"
                    >
                      <Calendar size={12} />
                      {scheduledOrders.length} scheduled for later today
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {boardData.newOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onOpenDetails={setSelectedOrder}
                      onAccept={handleAcceptOrder}
                      onStartPrep={handleStartPrep}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Column 2: In Preparation */}
          {(activeTab === 'all' || activeTab === 'preparing') && (
            <div
              className={`border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 ${
                isDark ? 'bg-[#141412] border-[#2C2C28]' : 'bg-[#FAF7F2] border-[#E8E2D5]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#2C2C28]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="font-serif font-bold text-base tracking-wide text-amber-400">
                    In Preparation
                  </h3>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                  {boardData.preparing.length}
                </span>
              </div>

              {boardData.preparing.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#737068]">
                  Station clear. No active pans or dishes cooking.
                </div>
              ) : (
                <div className="space-y-4">
                  {boardData.preparing.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onOpenDetails={setSelectedOrder}
                      onMarkReady={handleMarkReady}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Column 3: Ready for Pass */}
          {(activeTab === 'all' || activeTab === 'ready') && (
            <div
              className={`border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 ${
                isDark ? 'bg-[#141412] border-[#2C2C28]' : 'bg-[#FAF7F2] border-[#E8E2D5]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#2C2C28]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="font-serif font-bold text-base tracking-wide text-emerald-400">
                    Ready for Handoff
                  </h3>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  {boardData.ready.length}
                </span>
              </div>

              {boardData.ready.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#737068]">
                  Pass is clear. No completed tickets awaiting pickup.
                </div>
              ) : (
                <div className="space-y-4">
                  {boardData.ready.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onOpenDetails={setSelectedOrder}
                      onCompleteHandoff={handleCompleteHandoff}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Column 4: Scheduled Pre-Orders (Displayed directly in All Stations view) */}
          {activeTab === 'all' && (
            <div
              className={`border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 ${
                isDark ? 'bg-[#141412] border-[#2C2C28]' : 'bg-[#FAF7F2] border-[#E8E2D5]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#2C2C28]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <h3 className="font-serif font-bold text-base tracking-wide text-blue-400">
                    Scheduled Pre-Orders
                  </h3>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                  {scheduledOrders.length}
                </span>
              </div>

              {scheduledOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#737068]">
                  No upcoming scheduled pre-orders.
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onOpenDetails={setSelectedOrder}
                      onAccept={handleAcceptOrder}
                      onStartPrep={handleStartPrep}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Scheduled Pre-Orders Board Section */
        <div
          className={`border rounded-2xl p-6 ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-serif font-bold">
                Upcoming Scheduled Pre-Orders
              </h3>
              <p className="text-xs text-[#737068] mt-0.5">
                Orders scheduled beyond 30 minutes in advance. Tickets automatically transition into the live queue once lead time is reached.
              </p>
            </div>
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 font-bold">
              {scheduledOrders.length} Scheduled
            </span>
          </div>

          {scheduledOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#737068]">
              No upcoming scheduled pre-orders for today.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onOpenDetails={setSelectedOrder}
                  onAccept={handleAcceptOrder}
                  onStartPrep={handleStartPrep}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal Drawer */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onAccept={handleAcceptOrder}
        onStartPrep={handleStartPrep}
        onMarkReady={handleMarkReady}
        onCompleteHandoff={handleCompleteHandoff}
        actionLoading={actionLoading}
      />
    </div>
  );
}
