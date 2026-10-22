'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  FloorTableDetailItem,
  TableStatus,
  TableSection,
  TableShape,
  ServiceRequestStatus,
  CleaningTaskStatus,
} from '../../../../types/floor';
import {
  Armchair,
  Users,
  Clock,
  Sparkles,
  BellRing,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  Maximize2,
  X,
  Check,
  ChevronRight,
  User,
  ShoppingBag,
  Info,
  Layers,
  Settings,
} from 'lucide-react';

const SECTIONS = [
  { id: 'ALL', label: 'All Sections' },
  { id: TableSection.MAIN_DINING, label: 'Main Dining Room' },
  { id: TableSection.CHEFS_COUNTER, label: "Chef's Counter" },
  { id: TableSection.OUTDOOR_TERRACE, label: 'Outdoor Terrace' },
  { id: TableSection.PRIVATE_DINING, label: 'Private Dining' },
];

function InteractiveFloorPlanContent() {
  const searchParams = useSearchParams();
  const initialTableParam = searchParams.get('table');

  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected: isConnected } = useSocket();
  const isDark = theme === 'dark';

  const [tables, setTables] = useState<FloorTableDetailItem[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedTable, setSelectedTable] = useState<FloorTableDetailItem | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zoom and pan canvas state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';
  const isAdminOrManager = staff?.role === StaffRole.ADMIN || staff?.role === StaffRole.MANAGER;

  const fetchTables = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [tablesRes, layoutRes] = await Promise.all([
        apiClient.get(`/api/floor/tables?locationId=${locationId}`),
        apiClient.get(`/api/floor/layout?locationId=${locationId}`),
      ]);

      if (tablesRes.data?.success) {
        const tableList: FloorTableDetailItem[] = tablesRes.data.data;
        setTables(tableList);

        // Auto-select table from URL if present
        if (initialTableParam && !selectedTable) {
          const match = tableList.find(
            (t) => t.tableNumber.toUpperCase() === initialTableParam.toUpperCase()
          );
          if (match) setSelectedTable(match);
        } else if (selectedTable) {
          const updated = tableList.find((t) => t.id === selectedTable.id);
          if (updated) setSelectedTable(updated);
        }
      }

      if (layoutRes.data?.success) {
        setSetupRequired(layoutRes.data.data.setupRequired);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load restaurant floor plan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId, initialTableParam, selectedTable]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = () => {
      fetchTables(true);
    };

    socket.on('floor.tableUpdated', handleUpdate);
    socket.on('floor.guestSeated', handleUpdate);
    socket.on('floor.sessionClosed', handleUpdate);
    socket.on('floor.serviceRequestCreated', handleUpdate);
    socket.on('floor.serviceRequestUpdated', handleUpdate);
    socket.on('floor.kitchenOrderReady', handleUpdate);
    socket.on('floor.cleaningStarted', handleUpdate);
    socket.on('floor.cleaningCompleted', handleUpdate);

    return () => {
      socket.off('floor.tableUpdated', handleUpdate);
      socket.off('floor.guestSeated', handleUpdate);
      socket.off('floor.sessionClosed', handleUpdate);
      socket.off('floor.serviceRequestCreated', handleUpdate);
      socket.off('floor.serviceRequestUpdated', handleUpdate);
      socket.off('floor.kitchenOrderReady', handleUpdate);
      socket.off('floor.cleaningStarted', handleUpdate);
      socket.off('floor.cleaningCompleted', handleUpdate);
    };
  }, [socket, isConnected, fetchTables]);

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Status-based table styling helpers
  const getTableStatusStyle = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return {
          bg: isDark ? 'bg-emerald-950/40' : 'bg-emerald-50',
          border: 'border-emerald-500/60',
          text: 'text-emerald-500',
          glow: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]',
        };
      case TableStatus.OCCUPIED:
        return {
          bg: isDark ? 'bg-amber-950/40' : 'bg-amber-50',
          border: 'border-amber-500/70',
          text: 'text-amber-500',
          glow: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]',
        };
      case TableStatus.RESERVED:
        return {
          bg: isDark ? 'bg-sky-950/40' : 'bg-sky-50',
          border: 'border-sky-500/60',
          text: 'text-sky-400',
          glow: 'hover:shadow-[0_0_15px_rgba(14,165,233,0.25)]',
        };
      case TableStatus.AWAITING_CLEANING:
        return {
          bg: isDark ? 'bg-rose-950/40' : 'bg-rose-50',
          border: 'border-rose-500/70',
          text: 'text-rose-500',
          glow: 'hover:shadow-[0_0_15px_rgba(244,63,94,0.25)]',
        };
      case TableStatus.CLEANING:
        return {
          bg: isDark ? 'bg-orange-950/40' : 'bg-orange-50',
          border: 'border-orange-500/70',
          text: 'text-orange-400',
          glow: 'hover:shadow-[0_0_15px_rgba(249,115,22,0.25)]',
        };
      case TableStatus.UNAVAILABLE:
      default:
        return {
          bg: isDark ? 'bg-zinc-900/60' : 'bg-zinc-100',
          border: 'border-zinc-700',
          text: 'text-zinc-500',
          glow: '',
        };
    }
  };

  // Filtered tables
  const filteredTables = tables.filter((t) => {
    if (selectedSection === 'ALL') return true;
    return t.section === selectedSection;
  });

  // Action handlers from side panel
  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Close this dining session and start table turnover?')) return;
    try {
      await apiClient.post(`/api/floor/sessions/${sessionId}/close?locationId=${locationId}`);
      fetchTables(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to close session');
    }
  };

  const handleStartCleaning = async (taskId: string) => {
    try {
      await apiClient.post(`/api/floor/cleaning-tasks/${taskId}/start?locationId=${locationId}`);
      fetchTables(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to start cleaning');
    }
  };

  const handleCompleteCleaning = async (taskId: string) => {
    try {
      await apiClient.post(`/api/floor/cleaning-tasks/${taskId}/complete?locationId=${locationId}`);
      fetchTables(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to complete cleaning');
    }
  };

  const handleHandoffOrder = async (orderId: string) => {
    try {
      await apiClient.post(`/api/floor/orders/${orderId}/handoff?locationId=${locationId}`);
      fetchTables(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to complete order handoff');
    }
  };

  const handleResolveRequest = async (requestId: string) => {
    try {
      await apiClient.patch(`/api/floor/service-requests/${requestId}?locationId=${locationId}`, {
        status: ServiceRequestStatus.RESOLVED,
      });
      fetchTables(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to resolve request');
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR]}>
      <div className="flex flex-col h-[calc(100vh-4.5rem)] overflow-hidden">
        {/* TOP CONTROLS & FILTER BAR */}
        <div className="p-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-3 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <Link
              href="/staff/floor"
              className="text-xs text-muted-foreground hover:text-foreground transition font-medium"
            >
              &larr; Floor Operations
            </Link>
            <h1 className="text-lg font-serif font-semibold text-foreground">
              Interactive Floor Plan
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium border border-amber-500/20">
              {tables.length} Tables
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* SECTION SELECTOR */}
            <div className="flex items-center gap-1 bg-accent/40 p-1 rounded-lg border border-border/40">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSection(sec.id)}
                  className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${
                    selectedSection === sec.id
                      ? 'bg-amber-500 text-black shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* ZOOM CONTROLS */}
            <div className="flex items-center gap-1 bg-accent/40 p-1 rounded-lg border border-border/40">
              <button
                onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
                className="p-1 rounded hover:bg-accent text-foreground"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono px-1 min-w-[3rem] text-center text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
                className="p-1 rounded hover:bg-accent text-foreground"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1 rounded hover:bg-accent text-foreground"
                title="Reset View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => fetchTables(true)}
              disabled={refreshing}
              className="p-2 rounded-lg border border-border/60 hover:bg-accent text-foreground transition"
              title="Refresh Floor"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>

            {isAdminOrManager && (
              <Link
                href="/staff/admin/floor-layout"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-accent text-xs font-medium text-foreground transition"
                title="Configure Table Layout Geometry"
              >
                <Settings className="w-3.5 h-3.5 text-amber-500" />
                <span>Layout Editor</span>
              </Link>
            )}
          </div>
        </div>

        {/* SETUP REQUIRED NOTIFICATION BANNER */}
        {setupRequired && (
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-500">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                Restaurant tables currently use fallback visual layout. Layout configuration is available for administrators.
              </span>
            </div>
            {isAdminOrManager && (
              <Link
                href="/staff/admin/floor-layout"
                className="underline font-semibold hover:text-amber-400"
              >
                Configure Table Geometry &rarr;
              </Link>
            )}
          </div>
        )}

        {/* MAIN CANVAS AND SIDE PANEL WORKSPACE */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* FLOOR MAP CANVAS */}
          <div
            className={`flex-1 relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${
              isDark ? 'bg-[#121210]' : 'bg-[#F9F7F2]'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* CANVAS GRID BACKGROUND */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle, ${isDark ? '#444' : '#ccc'} 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* TRANSFORMED CANVAS CONTENT */}
            <div
              className="w-full h-full relative transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              {loading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <span className="text-xs">Rendering restaurant floor plan...</span>
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Armchair className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No tables in this section</p>
                </div>
              ) : (
                filteredTables.map((table, idx) => {
                  const style = getTableStatusStyle(table.status);
                  const isSelected = selectedTable?.id === table.id;

                  // Use real layout coordinates if configured, otherwise responsive normalized grid placement
                  const posX = table.layout?.positionX !== undefined ? table.layout.positionX : (idx % 6) * 15 + 6;
                  const posY = table.layout?.positionY !== undefined ? table.layout.positionY : Math.floor(idx / 6) * 22 + 10;
                  const width = table.layout?.width || 12;
                  const height = table.layout?.height || 14;
                  const shape = table.layout?.shape || (table.capacity === 2 ? 'ROUND' : 'RECTANGLE');

                  const hasRequests = table.serviceRequests && table.serviceRequests.length > 0;
                  const hasAlert = table.kitchenAlerts && table.kitchenAlerts.length > 0;

                  return (
                    <div
                      key={table.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Table ${table.tableNumber}, Capacity ${table.capacity} guests, Status ${table.status.replace('_', ' ')}`}
                      onClick={() => setSelectedTable(table)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedTable(table);
                        }
                      }}
                      className={`absolute cursor-pointer border-2 transition-all p-2 flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${style.bg} ${style.border} ${style.glow} ${
                        shape === 'ROUND' ? 'rounded-full' : shape === 'BOOTH' ? 'rounded-2xl border-dashed' : 'rounded-xl'
                      } ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2 scale-105 z-20' : 'hover:scale-[1.03] z-10'}`}
                      style={{
                        left: `${posX}%`,
                        top: `${posY}%`,
                        width: `${Math.max(80, width * 8)}px`,
                        height: `${Math.max(70, height * 6)}px`,
                      }}
                    >
                      {/* TOP ROW: TABLE NUMBER & INDICATOR BADGES */}
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-mono font-bold ${style.text}`}>
                          {table.tableNumber}
                        </span>
                        <div className="flex items-center gap-1">
                          {hasAlert && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Kitchen Order Ready" />
                          )}
                          {hasRequests && (
                            <span className="w-2 h-2 rounded-full bg-purple-500" title="Service Request Open" />
                          )}
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {table.capacity}p
                          </span>
                        </div>
                      </div>

                      {/* MIDDLE: OCCUPANT / SESSION INFO */}
                      <div className="text-center my-auto">
                        {table.status === TableStatus.OCCUPIED && table.activeSession ? (
                          <div>
                            <p className="text-[11px] font-medium text-foreground truncate max-w-[80px] mx-auto">
                              {table.activeSession.guestName}
                            </p>
                            <span className="text-[10px] text-amber-500 font-mono">
                              {table.activeSession.guestCount}g
                            </span>
                          </div>
                        ) : table.status === TableStatus.AWAITING_CLEANING ? (
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                            Needs Cleaning
                          </span>
                        ) : table.status === TableStatus.CLEANING ? (
                          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tight animate-pulse">
                            Sanitizing
                          </span>
                        ) : table.status === TableStatus.RESERVED ? (
                          <span className="text-[10px] font-medium text-sky-400">
                            Booked
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500/80 font-medium">
                            Available
                          </span>
                        )}
                      </div>

                      {/* BOTTOM: ASSIGNED SERVER */}
                      <div className="text-center text-[9px] text-muted-foreground truncate">
                        {table.assignedStaffName ? table.assignedStaffName.split(' ')[0] : ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* LEGEND BADGES (BOTTOM LEFT) */}
            <div className="absolute bottom-4 left-4 p-2.5 rounded-xl border bg-background/90 backdrop-blur-sm flex flex-wrap items-center gap-3 text-xs shadow-md">
              <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Occupied
              </span>
              <span className="flex items-center gap-1.5 text-sky-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Reserved
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Needs Cleaning
              </span>
              <span className="flex items-center gap-1.5 text-orange-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Cleaning
              </span>
            </div>
          </div>

          {/* SLIDE-OUT TABLE DETAIL PANEL */}
          {selectedTable && (
            <div
              className={`w-full sm:w-96 border-l flex flex-col justify-between shadow-2xl transition-all z-30 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              {/* PANEL HEADER */}
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-amber-500">
                      Table {selectedTable.tableNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        selectedTable.status === TableStatus.AVAILABLE
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : selectedTable.status === TableStatus.OCCUPIED
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : selectedTable.status === TableStatus.AWAITING_CLEANING
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : selectedTable.status === TableStatus.CLEANING
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : 'bg-zinc-500/10 text-zinc-400'
                      }`}
                    >
                      {selectedTable.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedTable.section.replace('_', ' ')} &bull; {selectedTable.capacity} Seats (Min: {selectedTable.minPartySize})
                  </p>
                </div>

                <button
                  onClick={() => setSelectedTable(null)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* PANEL BODY CONTENT */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {/* ASSIGNED SERVER */}
                <div className={`p-3 rounded-lg border text-xs ${isDark ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="text-muted-foreground flex items-center justify-between mb-1">
                    <span>Assigned Floor Staff</span>
                    <User className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="font-medium text-foreground">
                    {selectedTable.assignedStaffName || 'Unassigned'}
                  </div>
                </div>

                {/* ACTIVE DINING SESSION */}
                {selectedTable.activeSession ? (
                  <div className={`p-3.5 rounded-xl border space-y-2.5 ${isDark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Active Dining Session
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {Math.floor((Date.now() - new Date(selectedTable.activeSession.seatedAt).getTime()) / 60000)}m
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {selectedTable.activeSession.guestName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Party of {selectedTable.activeSession.guestCount} &bull; Seated at {new Date(selectedTable.activeSession.seatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {selectedTable.activeSession.notes && (
                      <p className="text-xs italic text-amber-500/90 bg-amber-500/10 p-2 rounded">
                        "{selectedTable.activeSession.notes}"
                      </p>
                    )}

                    <button
                      onClick={() => handleCloseSession(selectedTable.activeSession!.id)}
                      className="w-full text-xs font-medium py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                    >
                      Close Session & Turnover Table
                    </button>
                  </div>
                ) : (
                  <div className={`p-3 rounded-lg border text-center text-xs text-muted-foreground ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    No active dining session
                  </div>
                )}

                {/* KITCHEN FOOD READY ALERTS */}
                {selectedTable.kitchenAlerts && selectedTable.kitchenAlerts.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      Food Ready for Handoff
                    </span>
                    {selectedTable.kitchenAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-medium text-foreground line-clamp-1">
                            {alert.itemsSummary}
                          </p>
                          <span className="text-[11px] text-muted-foreground">Order {alert.orderReference}</span>
                        </div>
                        <button
                          onClick={() => handleHandoffOrder(alert.orderId)}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-amber-500 hover:bg-amber-600 text-black transition"
                        >
                          Handoff
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* SERVICE REQUESTS */}
                {selectedTable.serviceRequests && selectedTable.serviceRequests.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5" />
                      Service Requests
                    </span>
                    {selectedTable.serviceRequests.map((req) => (
                      <div
                        key={req.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                          isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-purple-300 uppercase">{req.requestType}</span>
                          <p className="text-foreground">{req.description}</p>
                        </div>
                        <button
                          onClick={() => handleResolveRequest(req.id)}
                          className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-medium"
                        >
                          Resolve
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* CLEANING TURNOVER TASK */}
                {selectedTable.cleaningTask && (
                  <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-rose-500">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Table Turnover
                      </span>
                      <span>{selectedTable.cleaningTask.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedTable.cleaningTask.status === CleaningTaskStatus.IN_PROGRESS
                        ? 'Sanitization actively in progress'
                        : 'Awaiting floor cleaner'}
                    </p>
                    {selectedTable.cleaningTask.status === CleaningTaskStatus.PENDING ? (
                      <button
                        onClick={() => handleStartCleaning(selectedTable.cleaningTask!.id)}
                        className="w-full text-xs font-medium py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black transition"
                      >
                        Start Cleaning Table
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompleteCleaning(selectedTable.cleaningTask!.id)}
                        className="w-full text-xs font-medium py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black transition"
                      >
                        Mark Cleaning Completed & Available
                      </button>
                    )}
                  </div>
                )}

                {/* UPCOMING RESERVATIONS */}
                {selectedTable.upcomingReservations && selectedTable.upcomingReservations.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Upcoming Bookings
                    </span>
                    <div className="space-y-1.5">
                      {selectedTable.upcomingReservations.map((res, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                            isDark ? 'bg-zinc-800/30 border-zinc-700/50' : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <div>
                            <span className="font-medium text-foreground">{res.guestName}</span>
                            <span className="text-muted-foreground ml-1 font-mono">({res.guestCount}g)</span>
                          </div>
                          <span className="text-sky-400 font-mono">{res.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PANEL FOOTER */}
              <div className="p-3 border-t border-border/40 text-center">
                <Link
                  href="/staff/floor/service-requests"
                  className="text-xs text-amber-500 hover:underline font-medium"
                >
                  Create Service Request for Table {selectedTable.tableNumber} &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}

export default function InteractiveFloorPlanPage() {
  return (
    <Suspense
      fallback={
        <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR]}>
          <div className="h-[calc(100vh-4.5rem)] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        </StaffLayout>
      }
    >
      <InteractiveFloorPlanContent />
    </Suspense>
  );
}
