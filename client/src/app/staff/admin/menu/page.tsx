'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffRole } from '../../../../types/staff';
import {
  ClientMenuItem,
  ClientMenuCategory,
  MenuSummaryCounts,
  PublicationStatus,
} from '../../../../types/menu';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { useSocket } from '../../../../context/SocketContext';
import { apiClient } from '../../../../lib/api';

import { MenuSummaryCards } from '../../../../components/menu-mgmt/MenuSummaryCards';
import { MenuFilters } from '../../../../components/menu-mgmt/MenuFilters';
import { MenuDirectoryTable } from '../../../../components/menu-mgmt/MenuDirectoryTable';
import { MenuMobileCardList } from '../../../../components/menu-mgmt/MenuMobileCardList';

import {
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';

export default function AdminMenuPage() {
  const { staff } = useStaffAuth();
  const { theme } = useStaffTheme();
  const { socket } = useSocket();
  const isDark = theme === 'dark';

  // Data states
  const [summary, setSummary] = useState<MenuSummaryCounts | null>(null);
  const [dishes, setDishes] = useState<ClientMenuItem[]>([]);
  const [categories, setCategories] = useState<ClientMenuCategory[]>([]);

  // Loading & pagination states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Confirmation modal dialog states
  const [confirmModal, setConfirmModal] = useState<{
    type: 'archive' | 'publish' | 'duplicate';
    dish: ClientMenuItem;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch Summary & Categories
  const fetchMetadata = useCallback(async () => {
    try {
      const [sumRes, catRes] = await Promise.all([
        apiClient<{ success: boolean; data: MenuSummaryCounts }>('/admin/menu/summary'),
        apiClient<{ success: boolean; data: ClientMenuCategory[] }>('/admin/menu/categories'),
      ]);

      if (sumRes?.success && sumRes.data) {
        setSummary(sumRes.data);
      }
      if (catRes?.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
    } catch (err: any) {
      console.warn('[AdminMenu] Metadata notice:', err?.message || err);
    }
  }, []);

  // 2. Fetch Paginated Dish Directory
  const fetchDishes = useCallback(
    async (pageToFetch = currentPage, isBackground = false) => {
      if (!staff || (staff.role !== StaffRole.ADMIN && staff.role !== StaffRole.MANAGER)) return;

      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        const queryParams = new URLSearchParams();
        if (search.trim()) queryParams.set('search', search.trim());
        if (selectedCategory !== 'ALL') queryParams.set('categorySlug', selectedCategory);
        if (selectedStatus !== 'ALL') queryParams.set('status', selectedStatus);
        if (selectedAvailability !== 'ALL') queryParams.set('availability', selectedAvailability);
        queryParams.set('page', String(pageToFetch));
        queryParams.set('limit', '10');
        queryParams.set('sortBy', sortBy);
        queryParams.set('sortOrder', sortOrder);

        const res = await apiClient<{
          success: boolean;
          data: {
            dishes: ClientMenuItem[];
            pagination: {
              total: number;
              page: number;
              limit: number;
              totalPages: number;
            };
          };
        }>(`/admin/menu?${queryParams.toString()}`);

        if (res?.success && res?.data) {
          setDishes(res.data.dishes);
          setTotalPages(res.data.pagination.totalPages);
          setTotalItems(res.data.pagination.total);
          setCurrentPage(res.data.pagination.page);
        }
      } catch (err: any) {
        console.warn('[AdminMenu] Error fetching dishes:', err?.message || err);
        setErrorMessage(err.message || 'Failed to load menu directory.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [staff, search, selectedCategory, selectedStatus, selectedAvailability, sortBy, sortOrder, currentPage]
  );

  // Initial load
  useEffect(() => {
    fetchMetadata();
    fetchDishes(1, false);
  }, [fetchMetadata, fetchDishes]);

  // Real-time socket event listener for live synchronization
  useEffect(() => {
    if (!socket) return;

    const handleMenuUpdated = () => {
      fetchMetadata();
      fetchDishes(currentPage, true);
    };

    socket.on('menu:updated', handleMenuUpdated);
    socket.on('menu:availability_changed', handleMenuUpdated);

    return () => {
      socket.off('menu:updated', handleMenuUpdated);
      socket.off('menu:availability_changed', handleMenuUpdated);
    };
  }, [socket, currentPage, fetchMetadata, fetchDishes]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedAvailability('ALL');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Availability Toggle
  const handleToggleAvailability = async (dish: ClientMenuItem) => {
    const nextAvailability = !dish.isAvailable;
    try {
      await apiClient(`/admin/menu/${dish.id}`, {
        method: 'PATCH',
        data: { isAvailable: nextAvailability },
      });
      fetchMetadata();
      fetchDishes(currentPage, true);
    } catch (err: any) {
      alert(err.message || 'Failed to update availability.');
    }
  };

  // Confirm Dialog Execution (Archive, Publish, Duplicate)
  const handleExecuteModalAction = async () => {
    if (!confirmModal) return;
    setActionLoading(true);

    try {
      if (confirmModal.type === 'archive') {
        await apiClient(`/admin/menu/${confirmModal.dish.id}/archive`, { method: 'POST' });
      } else if (confirmModal.type === 'publish') {
        await apiClient(`/admin/menu/${confirmModal.dish.id}/publish`, { method: 'POST' });
      } else if (confirmModal.type === 'duplicate') {
        await apiClient(`/admin/menu/${confirmModal.dish.id}/duplicate`, { method: 'POST' });
      }
      setConfirmModal(null);
      fetchMetadata();
      fetchDishes(currentPage, true);
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-current/10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#B99A63] font-semibold">
              AURELLE / ADMINISTRATION
            </span>
            <h1
              className={`text-2xl sm:text-3xl font-serif tracking-tight mt-1 ${
                isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
              }`}
            >
              Menu Management
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
              Curate your menu, manage availability, and publish updates to your guests.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/staff/admin/menu/categories"
              className={`px-3.5 py-2.5 rounded-lg border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                isDark
                  ? 'border-[#2C2C28] text-[#D1CDC7] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                  : 'border-[#E5DFD3] text-[#4A4740] hover:text-[#171715] hover:border-[#B99A63]'
              }`}
            >
              <Layers size={14} className="text-[#B99A63]" />
              MANAGE CATEGORIES
            </Link>

            <Link
              href="/staff/admin/menu/new"
              className="px-4 py-2.5 rounded-lg bg-[#B99A63] text-[#171715] font-semibold text-xs uppercase tracking-wider hover:bg-[#A88B54] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus size={15} />
              + ADD NEW DISH
            </Link>
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => fetchDishes(currentPage, false)}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-mono text-[11px] uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. SUMMARY CARDS */}
        <MenuSummaryCards summary={summary} loading={loading && !summary} isDark={isDark} />

        {/* 2. FILTERS */}
        <MenuFilters
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setCurrentPage(1);
          }}
          category={selectedCategory}
          onCategoryChange={(v) => {
            setSelectedCategory(v);
            setCurrentPage(1);
          }}
          status={selectedStatus}
          onStatusChange={(v) => {
            setSelectedStatus(v);
            setCurrentPage(1);
          }}
          availability={selectedAvailability}
          onAvailabilityChange={(v) => {
            setSelectedAvailability(v);
            setCurrentPage(1);
          }}
          sortBy={sortBy}
          onSortByChange={(v) => setSortBy(v)}
          sortOrder={sortOrder}
          onSortOrderToggle={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          onReset={handleResetFilters}
          categories={categories}
          isDark={isDark}
        />

        {/* 3. DIRECTORY TABLE (Desktop) & CARDS (Mobile) */}
        <MenuDirectoryTable
          dishes={dishes}
          loading={loading}
          onToggleAvailability={handleToggleAvailability}
          onDuplicate={(d) => setConfirmModal({ type: 'duplicate', dish: d })}
          onArchive={(d) => setConfirmModal({ type: 'archive', dish: d })}
          onPublish={(d) => setConfirmModal({ type: 'publish', dish: d })}
          isDark={isDark}
        />

        <MenuMobileCardList
          dishes={dishes}
          loading={loading}
          onToggleAvailability={handleToggleAvailability}
          onDuplicate={(d) => setConfirmModal({ type: 'duplicate', dish: d })}
          onArchive={(d) => setConfirmModal({ type: 'archive', dish: d })}
          onPublish={(d) => setConfirmModal({ type: 'publish', dish: d })}
          isDark={isDark}
        />

        {/* 4. PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div
            className={`flex items-center justify-between py-4 px-4 rounded-xl border ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className={`text-xs font-mono ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
              Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalItems)} of {totalItems} dishes
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDishes(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1 disabled:opacity-40 transition-colors ${
                  isDark
                    ? 'border-[#2C2C28] text-[#D1CDC7] hover:bg-[#252522]'
                    : 'border-[#E5DFD3] text-[#4A4740] hover:bg-[#FAF8F5]'
                }`}
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <span className={`text-xs font-mono px-3 ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => fetchDishes(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1 disabled:opacity-40 transition-colors ${
                  isDark
                    ? 'border-[#2C2C28] text-[#D1CDC7] hover:bg-[#252522]'
                    : 'border-[#E5DFD3] text-[#4A4740] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION DIALOG MODAL */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div
              className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
                isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
              }`}
            >
              <div
                className={`flex items-center justify-between px-6 py-4 border-b ${
                  isDark ? 'border-[#2C2C28] bg-[#171715]' : 'border-[#E5DFD3] bg-[#F9F7F2]'
                }`}
              >
                <h3 className={`text-sm font-serif font-medium ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
                  {confirmModal.type === 'archive' && 'Archive Menu Item'}
                  {confirmModal.type === 'publish' && 'Publish Dish to Guest Menu'}
                  {confirmModal.type === 'duplicate' && 'Duplicate Menu Item'}
                </h3>
                <button onClick={() => setConfirmModal(null)} className="p-1 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className={`text-xs leading-relaxed ${isDark ? 'text-[#D1CDC7]' : 'text-[#4A4740]'}`}>
                  {confirmModal.type === 'archive' && (
                    <>
                      Are you sure you want to archive <strong>{confirmModal.dish.name}</strong>? It will be safely removed from public guest menus. Past orders referencing this dish remain preserved.
                    </>
                  )}
                  {confirmModal.type === 'publish' && (
                    <>
                      Publish <strong>{confirmModal.dish.name}</strong>? This dish will immediately become visible to guests on the restaurant menu.
                    </>
                  )}
                  {confirmModal.type === 'duplicate' && (
                    <>
                      Create a duplicate of <strong>{confirmModal.dish.name}</strong>? A new draft item with a unique slug will be created for editing.
                    </>
                  )}
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-current/10">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-stone-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteModalAction}
                    disabled={actionLoading}
                    className={`px-5 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      confirmModal.type === 'archive'
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-[#B99A63] text-[#171715] hover:bg-[#A88B54]'
                    }`}
                  >
                    {actionLoading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
