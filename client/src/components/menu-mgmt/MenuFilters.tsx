'use client';

import React from 'react';
import { Search, RotateCcw, ArrowUpDown } from 'lucide-react';
import { ClientMenuCategory, PublicationStatus } from '../../types/menu';

interface MenuFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  availability: string;
  onAvailabilityChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderToggle: () => void;
  onReset: () => void;
  categories: ClientMenuCategory[];
  isDark: boolean;
}

export const MenuFilters: React.FC<MenuFiltersProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  availability,
  onAvailabilityChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
  onReset,
  categories,
  isDark,
}) => {
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      } shadow-sm`}
    >
      {/* ROW 1: SEARCH & PRIMARY DROPDOWNS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'
            }`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dish, ingredients..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none border transition-colors ${
              isDark
                ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
            }`}
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider outline-none border cursor-pointer ${
              isDark
                ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
            }`}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Publication Status */}
        <div>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider outline-none border cursor-pointer ${
              isDark
                ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value={PublicationStatus.PUBLISHED}>Published (Live)</option>
            <option value={PublicationStatus.DRAFT}>Draft</option>
            <option value={PublicationStatus.ARCHIVED}>Archived</option>
          </select>
        </div>

        {/* Availability */}
        <div>
          <select
            value={availability}
            onChange={(e) => onAvailabilityChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider outline-none border cursor-pointer ${
              isDark
                ? 'bg-[#171715] border-[#2C2C28] text-[#F6F1E8] focus:border-[#B99A63]'
                : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#171715] focus:border-[#B99A63]'
            }`}
          >
            <option value="ALL">Any Availability</option>
            <option value="true">Available (In Stock)</option>
            <option value="false">Unavailable (Sold Out)</option>
          </select>
        </div>
      </div>

      {/* ROW 2: SORTING & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-current/10">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider outline-none border cursor-pointer ${
              isDark
                ? 'bg-[#171715] border-[#2C2C28] text-[#D1CDC7]'
                : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#4A4740]'
            }`}
          >
            <option value="createdAt">Date Created</option>
            <option value="name">Dish Name</option>
            <option value="priceMinor">Price</option>
            <option value="displayOrder">Display Order</option>
            <option value="publicationStatus">Status</option>
          </select>

          <button
            onClick={onSortOrderToggle}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              isDark
                ? 'border-[#2C2C28] text-[#D1CDC7] hover:text-[#F6F1E8] hover:border-[#B99A63]'
                : 'border-[#E5DFD3] text-[#4A4740] hover:text-[#171715] hover:border-[#B99A63]'
            }`}
            title="Toggle Sort Order"
          >
            <ArrowUpDown size={13} className="text-[#B99A63]" />
            <span className="font-mono uppercase text-[10px]">{sortOrder}</span>
          </button>
        </div>

        <button
          onClick={onReset}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
            isDark
              ? 'border-[#2C2C28] text-[#A5A198] hover:text-[#F6F1E8]'
              : 'border-[#E5DFD3] text-[#6B685F] hover:text-[#171715]'
          }`}
        >
          <RotateCcw size={12} />
          Reset Filters
        </button>
      </div>
    </div>
  );
};
