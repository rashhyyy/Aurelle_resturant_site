'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { StaffRole } from '../../../../types/staff';
import { apiClient } from '../../../../lib/api';
import {
  IDiningSessionSafeJSON,
  ICleaningTaskSafeJSON,
  IServiceRequestSafeJSON,
} from '../../../../types/floor';
import {
  History,
  Users,
  Sparkles,
  BellRing,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Armchair,
  Calendar,
} from 'lucide-react';

export default function FloorHistoryPage() {
  const { staff, selectedLocation } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'sessions' | 'cleaning' | 'requests'>('sessions');
  const [sessions, setSessions] = useState<IDiningSessionSafeJSON[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<ICleaningTaskSafeJSON[]>([]);
  const [serviceRequests, setServiceRequests] = useState<IServiceRequestSafeJSON[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationId = selectedLocation || staff?.locationIds?.[0] || 'loc-colombo-main';

  const fetchHistory = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await apiClient.get(`/api/floor/history?locationId=${locationId}`);
      if (res.data?.success) {
        setSessions(res.data.data.sessions || []);
        setCleaningTasks(res.data.data.cleaningTasks || []);
        setServiceRequests(res.data.data.serviceRequests || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load floor history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.guestName.toLowerCase().includes(q) || s.tableNumbers.some((tn) => tn.toLowerCase().includes(q));
  });

  const filteredCleaning = cleaningTasks.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.tableNumber.toLowerCase().includes(q) || (c.completedBy && c.completedBy.toLowerCase().includes(q));
  });

  const filteredRequests = serviceRequests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.tableNumber.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.FLOOR]}>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                AURELLE / FLOOR AUDIT ARCHIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
              Floor Operations History
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Historical record of closed dining sessions, completed sanitization turnover tasks, and resolved guest calls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border/60 hover:bg-accent transition text-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/staff/floor"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border/60 hover:bg-accent transition text-foreground"
            >
              <Armchair className="w-3.5 h-3.5" />
              <span>Floor Dashboard</span>
            </Link>
          </div>
        </div>

        {/* CONTROLS: TABS & SEARCH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-accent/40 p-1 rounded-xl border border-border/40">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'sessions'
                  ? 'bg-amber-500 text-black font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dining Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('cleaning')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'cleaning'
                  ? 'bg-rose-500 text-white font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cleaning Turnover ({cleaningTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'requests'
                  ? 'bg-purple-600 text-white font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Resolved Requests ({serviceRequests.length})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history records..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-border/60 bg-background text-foreground"
            />
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm">Loading archive...</span>
          </div>
        ) : activeTab === 'sessions' ? (
          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <div className="p-10 border rounded-2xl text-center text-xs text-muted-foreground">
                No closed dining sessions recorded
              </div>
            ) : (
              <div className="border rounded-2xl overflow-hidden divide-y divide-border/40">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                          Table {session.tableNumbers.join(', ')}
                        </span>
                        <span className="font-semibold text-foreground text-sm">
                          {session.guestName}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          ({session.guestCount} guests)
                        </span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-3">
                        <span>Seated: {new Date(session.seatedAt).toLocaleTimeString()}</span>
                        {session.completedAt && (
                          <span>Closed: {new Date(session.completedAt).toLocaleTimeString()}</span>
                        )}
                        {session.completedBy && <span>By {session.completedBy}</span>}
                      </div>
                    </div>
                    <span className="text-emerald-500 font-mono font-semibold">CLOSED</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'cleaning' ? (
          <div className="space-y-3">
            {filteredCleaning.length === 0 ? (
              <div className="p-10 border rounded-2xl text-center text-xs text-muted-foreground">
                No completed cleaning turnover tasks
              </div>
            ) : (
              <div className="border rounded-2xl overflow-hidden divide-y divide-border/40">
                {filteredCleaning.map((task) => (
                  <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                          Table {task.tableNumber}
                        </span>
                        <span className="font-medium text-foreground">Turnover Sanitization</span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-3">
                        {task.completedAt && (
                          <span>Sanitized at {new Date(task.completedAt).toLocaleTimeString()}</span>
                        )}
                        {task.completedBy && <span>By {task.completedBy}</span>}
                      </div>
                    </div>
                    <span className="text-emerald-500 font-mono font-semibold">SANITIZED</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="p-10 border rounded-2xl text-center text-xs text-muted-foreground">
                No resolved service requests
              </div>
            ) : (
              <div className="border rounded-2xl overflow-hidden divide-y divide-border/40">
                {filteredRequests.map((req) => (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          Table {req.tableNumber}
                        </span>
                        <span className="font-semibold uppercase text-purple-300">{req.requestType}</span>
                        <span className="text-foreground">{req.description}</span>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-3">
                        {req.resolvedAt && (
                          <span>Resolved at {new Date(req.resolvedAt).toLocaleTimeString()}</span>
                        )}
                        {req.resolvedBy && <span>By {req.resolvedBy}</span>}
                      </div>
                    </div>
                    <span className="text-emerald-500 font-mono font-semibold">RESOLVED</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
