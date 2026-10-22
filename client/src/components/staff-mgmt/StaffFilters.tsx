'use client';

import React from 'react';
import { Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { StaffRole, StaffStatus } from '../../types/staff';
import { RestaurantLocationOption } from '../../types/staffManagement';

interface StaffFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  locationId: string;
  onLocationChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderToggle: () => void;
  onReset: () => void;
  locations: RestaurantLocationOption[];
  isDark: boolean;
}

export const StaffFilters: React.FC<StaffFiltersProps> = ({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  locationId,
  onLocationChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
  onReset,
  locations,
  isDark,
}) => {
  const hasActiveFilters =
    Boolean(search) || role !== 'ALL' || status !== 'ALL' || locationId !== 'all';

  return (
    <div
      className={`border rounded-xl p-4 sm:p-5 mb-6 shadow-sm transition-colors ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'
            }`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by first name, last name, or email..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-colors outline-none focus:ring-1 focus:ring-[#B99A63] ${
              isDark
                ? 'bg-[#171715] border border-[#2C2C28] text-[#F6F1E8] placeholder-[#7A766D]'
                : 'bg-[#F9F7F2] border border-[#E5DFD3] text-[#171715] placeholder-[#8E8A80]'
            }`}
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-75 ${
                isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
              }`}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Role Filter */}
          <div className="flex-1 sm:flex-none min-w-[130px]">
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider outline-none cursor-pointer border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]'
                  : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
              }`}
            >
              <option value="ALL">All Roles</option>
              <option value={StaffRole.ADMIN}>Administrator</option>
              <option value={StaffRole.MANAGER}>Manager</option>
              <option value={StaffRole.KITCHEN}>Kitchen Staff</option>
              <option value={StaffRole.RECEPTION}>Reception Staff</option>
              <option value={StaffRole.FLOOR}>Floor Staff</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 sm:flex-none min-w-[130px]">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider outline-none cursor-pointer border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]'
                  : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
              }`}
            >
              <option value="ALL">All Statuses</option>
              <option value={StaffStatus.ACTIVE}>Active</option>
              <option value={StaffStatus.INVITED}>Invited</option>
              <option value={StaffStatus.DISABLED}>Disabled</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="flex-1 sm:flex-none min-w-[150px]">
            <select
              value={locationId}
              onChange={(e) => onLocationChange(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider outline-none cursor-pointer border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]'
                  : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
              }`}
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Field */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider outline-none cursor-pointer border ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8]'
                  : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715]'
              }`}
            >
              <option value="createdAt">Date Added</option>
              <option value="name">Name</option>
              <option value="role">Role</option>
              <option value="status">Status</option>
              <option value="lastLoginAt">Last Active</option>
            </select>

            <button
              onClick={onSortOrderToggle}
              title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              className={`p-2.5 rounded-lg border flex items-center justify-center transition-colors ${
                isDark
                  ? 'bg-[#171715] border-[#2C2C28] text-[#A5A198] hover:text-[#F6F1E8]'
                  : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#6B685F] hover:text-[#171715]'
              }`}
            >
              <ArrowUpDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
            </button>
          </div>

          {/* Reset Action */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[#B99A63] hover:underline flex items-center gap-1.5"
            >
              <X size={12} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
