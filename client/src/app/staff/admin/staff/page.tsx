'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffRole, SafeStaff } from '../../../../types/staff';
import {
  StaffSummaryCounts,
  RestaurantLocationOption,
} from '../../../../types/staffManagement';
import { useStaffAuth } from '../../../../context/StaffAuthContext';
import { useStaffTheme } from '../../../../context/StaffThemeContext';
import { apiClient } from '../../../../lib/api';

import { StaffSummaryCards } from '../../../../components/staff-mgmt/StaffSummaryCards';
import { StaffFilters } from '../../../../components/staff-mgmt/StaffFilters';
import { StaffDirectoryTable } from '../../../../components/staff-mgmt/StaffDirectoryTable';
import { StaffMobileCardList } from '../../../../components/staff-mgmt/StaffMobileCardList';
import { AddStaffModal } from '../../../../components/staff-mgmt/AddStaffModal';
import { StaffActionModals } from '../../../../components/staff-mgmt/StaffActionModals';
import { RolePermissionsDrawer } from '../../../../components/staff-mgmt/RolePermissionsDrawer';

import {
  UserPlus,
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function AdminStaffManagementPage() {
  const { staff } = useStaffAuth();
  const { theme } = useStaffTheme();
  const isDark = theme === 'dark';

  // Data states
  const [summary, setSummary] = useState<StaffSummaryCounts | null>(null);
  const [staffList, setStaffList] = useState<SafeStaff[]>([]);
  const [locations, setLocations] = useState<RestaurantLocationOption[]>([]);
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<StaffRole, string[]> | null>(null);

  // Loading & pagination states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal dialog states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [permissionsDrawerOpen, setPermissionsDrawerOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<SafeStaff | null>(null);

  // 1. Fetch Summary & Config
  const fetchMetadata = useCallback(async () => {
    try {
      const [sumRes, permRes] = await Promise.all([
        apiClient<{ success: boolean; data: StaffSummaryCounts }>('/admin/staff/summary'),
        apiClient<{
          success: boolean;
          data: {
            permissionsMatrix: Record<StaffRole, string[]>;
            locations: RestaurantLocationOption[];
          };
        }>('/admin/staff/permissions'),
      ]);

      if (sumRes?.success && sumRes.data) {
        setSummary(sumRes.data);
      }
      if (permRes?.success && permRes.data) {
        setPermissionsMatrix(permRes.data.permissionsMatrix);
        setLocations(permRes.data.locations);
      }
    } catch (err: any) {
      console.warn('[StaffMgmt] Notice fetching metadata:', err?.message || err);
    }
  }, []);

  // 2. Fetch Paginated Staff List
  const fetchStaffList = useCallback(
    async (pageToFetch = currentPage, isBackground = false) => {
      // Guard: only fetch if authenticated as ADMIN
      if (!staff || staff.role !== StaffRole.ADMIN) return;

      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        const queryParams = new URLSearchParams();
        if (search.trim()) queryParams.set('search', search.trim());
        if (selectedRole !== 'ALL') queryParams.set('role', selectedRole);
        if (selectedStatus !== 'ALL') queryParams.set('status', selectedStatus);
        if (selectedLocation !== 'all') queryParams.set('locationId', selectedLocation);
        queryParams.set('page', String(pageToFetch));
        queryParams.set('limit', '10');
        queryParams.set('sortBy', sortBy);
        queryParams.set('sortOrder', sortOrder);

        const res = await apiClient<{
          success: boolean;
          data: {
            staff: SafeStaff[];
            pagination: {
              total: number;
              page: number;
              limit: number;
              totalPages: number;
            };
          };
        }>(`/admin/staff?${queryParams.toString()}`);

        if (res?.success && res?.data) {
          setStaffList(res.data.staff);
          setTotalPages(res.data.pagination.totalPages);
          setTotalItems(res.data.pagination.total);
          setCurrentPage(res.data.pagination.page);
        }
      } catch (err: any) {
        console.warn('[StaffMgmt] Notice fetching directory:', err?.message || err);
        setErrorMessage(err.message || 'Failed to load employee directory.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [staff, search, selectedRole, selectedStatus, selectedLocation, sortBy, sortOrder, currentPage]
  );

  // Initial load
  useEffect(() => {
    if (staff && staff.role === StaffRole.ADMIN) {
      fetchMetadata();
      fetchStaffList(1, false);
    }
  }, [staff, fetchMetadata, fetchStaffList]);

  // Handle Search & Filter changes (debounced or triggered)
  const handleResetFilters = () => {
    setSearch('');
    setSelectedRole('ALL');
    setSelectedStatus('ALL');
    setSelectedLocation('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleActionSelect = (action: string, target: SafeStaff) => {
    setSelectedStaff(target);
    setActiveAction(action);
  };

  const handleActionSuccess = () => {
    fetchMetadata();
    fetchStaffList(currentPage, true);
  };

  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN]}>
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
              Staff Management
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'}`}>
              Manage your team, roles, and access across AURELLE restaurant locations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setPermissionsDrawerOpen(true)}
              className={`px-3 py-2.5 rounded-lg border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                isDark
                  ? 'border-[#2C2C28] text-[#D1CDC7] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                  : 'border-[#E5DFD3] text-[#4A4740] hover:text-[#171715] hover:border-[#B99A63]'
              }`}
            >
              <Shield size={14} className="text-[#B99A63]" />
              Permissions Matrix
            </button>

            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-[#B99A63] text-[#171715] font-semibold text-xs uppercase tracking-wider hover:bg-[#A88B54] transition-colors shadow-sm flex items-center gap-2"
            >
              <UserPlus size={15} />
              + ADD EMPLOYEE
            </button>
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
              onClick={() => fetchStaffList(currentPage, false)}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-mono text-[11px] uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. SUMMARY CARDS */}
        <StaffSummaryCards summary={summary} loading={loading && !summary} isDark={isDark} />

        {/* 2. FILTERS */}
        <StaffFilters
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setCurrentPage(1);
          }}
          role={selectedRole}
          onRoleChange={(v) => {
            setSelectedRole(v);
            setCurrentPage(1);
          }}
          status={selectedStatus}
          onStatusChange={(v) => {
            setSelectedStatus(v);
            setCurrentPage(1);
          }}
          locationId={selectedLocation}
          onLocationChange={(v) => {
            setSelectedLocation(v);
            setCurrentPage(1);
          }}
          sortBy={sortBy}
          onSortByChange={(v) => setSortBy(v)}
          sortOrder={sortOrder}
          onSortOrderToggle={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          onReset={handleResetFilters}
          locations={locations}
          isDark={isDark}
        />

        {/* 3. DIRECTORY TABLE (Desktop) & CARDS (Mobile) */}
        <StaffDirectoryTable
          staffList={staffList}
          loading={loading}
          locations={locations}
          onSelectAction={handleActionSelect}
          isDark={isDark}
        />

        <StaffMobileCardList
          staffList={staffList}
          loading={loading}
          locations={locations}
          onSelectAction={handleActionSelect}
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
              Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalItems)} of {totalItems} employees
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchStaffList(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1 disabled:opacity-40 transition-colors ${
                  isDark ? 'border-[#2C2C28] text-[#D1CDC7] hover:bg-[#252522]' : 'border-[#E5DFD3] text-[#4A4740] hover:bg-[#FAF8F5]'
                }`}
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <span className={`text-xs font-mono px-3 ${isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'}`}>
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => fetchStaffList(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1 disabled:opacity-40 transition-colors ${
                  isDark ? 'border-[#2C2C28] text-[#D1CDC7] hover:bg-[#252522]' : 'border-[#E5DFD3] text-[#4A4740] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* MODAL: ADD EMPLOYEE */}
        <AddStaffModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleActionSuccess}
          locations={locations}
          isDark={isDark}
        />

        {/* MODAL: ACTION DIALOGS (Edit, Role, Locations, Status, etc.) */}
        <StaffActionModals
          actionType={activeAction}
          targetStaff={selectedStaff}
          onClose={() => {
            setActiveAction(null);
            setSelectedStaff(null);
          }}
          onSuccess={handleActionSuccess}
          locations={locations}
          isDark={isDark}
        />

        {/* DRAWER: ROLE PERMISSIONS MATRIX */}
        <RolePermissionsDrawer
          isOpen={permissionsDrawerOpen}
          onClose={() => setPermissionsDrawerOpen(false)}
          permissionsMatrix={permissionsMatrix}
          isDark={isDark}
        />
      </div>
    </StaffLayout>
  );
}
