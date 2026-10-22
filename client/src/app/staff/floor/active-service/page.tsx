'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  IDiningSessionSafeJSON,
  DiningSessionStatus,
} from '../../../../types/floor';
import {
  Users,
  Clock,
  Armchair,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  ArrowRight,
  User,
  ShoppingBag,
} from 'lucide-react';

export default function ActiveServicePage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket, connected: isConnected } = useSocket();
  const isDark = theme === 'dark';

  const [sessions, setSessions] = useState<IDiningSessionSafeJSON[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchSessions = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await apiClient.get(`/api/floor/sessions?locationId=${locationId}`);
      if (res.data?.success) {
        setSessions(res.data.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load active dining sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = () => {
      fetchSessions(true);
    };

    socket.on('floor.guestSeated', handleUpdate);
    socket.on('floor.sessionClosed', handleUpdate);
    socket.on('floor.tableUpdated', handleUpdate);

    return () => {
      socket.off('floor.guestSeated', handleUpdate);
      socket.off('floor.sessionClosed', handleUpdate);
      socket.off('floor.tableUpdated', handleUpdate);
    };
  }, [socket, isConnected, fetchSessions]);

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to end service for this table and start turnover?')) return;
    try {
      await apiClient.post(`/api/floor/sessions/${sessionId}/close?locationId=${locationId}`);
      fetchSessions(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to close dining session');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.guestName.toLowerCase().includes(q) ||
      s.tableNumbers.some((tn) => tn.toLowerCase().includes(q)) ||
      (s.reservationReference && s.reservationReference.toLowerCase().includes(q))
    );
  });

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR]}>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded">
                AURELLE / FLOOR SERVICE
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono font-medium">
                {sessions.length} Active Sessions
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
              Active Dining Service
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live guest sittings, service duration tracking, and table turnover coordination.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchSessions(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border/60 hover:bg-accent transition text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/staff/floor/floor-plan"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-xs transition"
            >
              <Armchair className="w-3.5 h-3.5" />
              <span>Interactive Floor Plan</span>
            </Link>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by guest name, table, or reference..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border/60 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Failed to load active sessions</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
            <button onClick={() => fetchSessions(false)} className="text-xs underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            <span className="text-sm">Loading dining sessions...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Active Dining Sessions</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
              There are no seated guests currently in the restaurant. Active dining sessions are automatically activated when guests are seated at the reception desk.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session) => {
              const seatedDurationMinutes = Math.floor(
                (Date.now() - new Date(session.seatedAt).getTime()) / (1000 * 60)
              );

              return (
                <div
                  key={session.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* TOP ROW */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Table {session.tableNumbers.join(', ')}
                        </span>
                        <h3 className="text-base font-semibold text-foreground mt-2">
                          {session.guestName}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-sky-400">
                          {session.guestCount} {session.guestCount === 1 ? 'Guest' : 'Guests'}
                        </span>
                        {session.reservationReference && (
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {session.reservationReference}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DURATION & TIMING */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${isDark ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200'}`}>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Seated at {new Date(session.seatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-500">
                        {seatedDurationMinutes} mins elapsed
                      </span>
                    </div>

                    {/* SERVER ASSIGNMENTS */}
                    {session.assignedStaffNames.length > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Assigned: <strong className="text-foreground">{session.assignedStaffNames.join(', ')}</strong></span>
                      </div>
                    )}

                    {/* NOTES */}
                    {session.notes && (
                      <p className="text-xs italic text-amber-500/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                        "{session.notes}"
                      </p>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="pt-4 border-t border-border/40 mt-4 flex items-center justify-between">
                    <Link
                      href={`/staff/floor/floor-plan?table=${session.tableNumbers[0]}`}
                      className="text-xs text-amber-500 hover:underline font-medium"
                    >
                      Locate on Floor &rarr;
                    </Link>

                    <button
                      onClick={() => handleCloseSession(session.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
                    >
                      Close Session & Turnover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
