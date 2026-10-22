'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MoreVertical,
  Edit,
  Copy,
  Archive,
  CheckCircle,
  FileText,
  Star,
  Eye,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { ClientMenuItem, PublicationStatus } from '../../types/menu';

interface MenuDirectoryTableProps {
  dishes: ClientMenuItem[];
  loading: boolean;
  onToggleAvailability: (dish: ClientMenuItem) => void;
  onDuplicate: (dish: ClientMenuItem) => void;
  onArchive: (dish: ClientMenuItem) => void;
  onPublish: (dish: ClientMenuItem) => void;
  isDark: boolean;
}

export const MenuDirectoryTable: React.FC<MenuDirectoryTableProps> = ({
  dishes,
  loading,
  onToggleAvailability,
  onDuplicate,
  onArchive,
  onPublish,
  isDark,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const getStatusBadge = (status: PublicationStatus) => {
    switch (status) {
      case PublicationStatus.PUBLISHED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Published
          </span>
        );
      case PublicationStatus.DRAFT:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Draft
          </span>
        );
      case PublicationStatus.ARCHIVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`hidden md:block rounded-2xl border overflow-hidden shadow-sm transition-all ${
        isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className={`border-b text-[11px] font-mono uppercase tracking-[0.2em] ${
                isDark ? 'border-[#2C2C28] bg-[#171715] text-[#A5A198]' : 'border-[#E5DFD3] bg-[#F9F7F2] text-[#6B685F]'
              }`}
            >
              <th className="py-3.5 px-4">Dish</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Price</th>
              <th className="py-3.5 px-4">Availability</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-center">Featured</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-current/10 text-xs">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-current/10 shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 bg-current/10 rounded" />
                        <div className="h-3 w-48 bg-current/10 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-current/10 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-16 bg-current/10 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-20 bg-current/10 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-20 bg-current/10 rounded" /></td>
                  <td className="py-4 px-4 text-center"><div className="h-4 w-4 bg-current/10 rounded mx-auto" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-6 w-8 bg-current/10 rounded ml-auto" /></td>
                </tr>
              ))
            ) : dishes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <AlertCircle size={28} className="text-[#B99A63] mx-auto mb-2 opacity-60" />
                  <p className="font-serif text-sm">No dishes match your query.</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
                    Try adjusting search parameters or create a new dish.
                  </p>
                </td>
              </tr>
            ) : (
              dishes.map((dish) => (
                <tr
                  key={dish.id}
                  className={`transition-colors ${
                    isDark ? 'hover:bg-[#252522]' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  {/* DISH PHOTO & NAME */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-current/10 bg-black">
                        <Image
                          src={dish.images[0] || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000'}
                          alt={dish.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <div
                          className={`font-serif font-medium text-sm tracking-tight ${
                            isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                          }`}
                        >
                          {dish.name}
                        </div>
                        <div
                          className={`text-[11px] font-light max-w-xs truncate mt-0.5 ${
                            isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
                          }`}
                        >
                          {dish.shortDescription || dish.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* CATEGORY */}
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        isDark ? 'bg-[#171715] border-[#2C2C28] text-[#D1CDC7]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#4A4740]'
                      }`}
                    >
                      {dish.categoryName || 'General'}
                    </span>
                  </td>

                  {/* PRICE */}
                  <td className="py-3 px-4 font-mono font-semibold text-[#B99A63]">
                    {dish.formattedPrice}
                  </td>

                  {/* AVAILABILITY TOGGLE */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onToggleAvailability(dish)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all border ${
                        dish.isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                      title="Click to toggle availability"
                    >
                      {dish.isAvailable ? <Check size={11} /> : <X size={11} />}
                      <span>{dish.isAvailable ? 'In Stock' : 'Unavailable'}</span>
                    </button>
                  </td>

                  {/* PUBLICATION STATUS */}
                  <td className="py-3 px-4">
                    {getStatusBadge(dish.publicationStatus)}
                  </td>

                  {/* FEATURED STAR */}
                  <td className="py-3 px-4 text-center">
                    {dish.isFeatured ? (
                      <Star size={15} className="text-[#B99A63] fill-[#B99A63] mx-auto" />
                    ) : (
                      <span className={`text-[11px] font-mono ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>—</span>
                    )}
                  </td>

                  {/* ACTION DROPDOWN */}
                  <td className="py-3 px-4 text-right relative">
                    <div className="inline-block text-left">
                      <button
                        onClick={() =>
                          setOpenDropdownId(openDropdownId === dish.id ? null : dish.id)
                        }
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'border-[#2C2C28] text-[#A5A198] hover:text-[#F6F1E8]'
                            : 'border-[#E5DFD3] text-[#6B685F] hover:text-[#171715]'
                        }`}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {openDropdownId === dish.id && (
                        <div
                          className={`absolute right-4 mt-1 w-44 rounded-xl border shadow-xl z-30 py-1.5 text-left text-xs ${
                            isDark
                              ? 'bg-[#1E1E1B] border-[#2C2C28] text-[#F6F1E8]'
                              : 'bg-white border-[#E5DFD3] text-[#171715]'
                          } animate-in fade-in duration-100`}
                          onMouseLeave={() => setOpenDropdownId(null)}
                        >
                          <Link
                            href={`/staff/admin/menu/${dish.id}/edit`}
                            className={`flex items-center gap-2 px-3.5 py-2 hover:bg-current/10 transition-colors`}
                            onClick={() => setOpenDropdownId(null)}
                          >
                            <Edit size={13} className="text-[#B99A63]" />
                            <span>Edit Dish</span>
                          </Link>

                          <button
                            onClick={() => {
                              onDuplicate(dish);
                              setOpenDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-current/10 transition-colors"
                          >
                            <Copy size={13} className="text-indigo-400" />
                            <span>Duplicate</span>
                          </button>

                          {dish.publicationStatus === PublicationStatus.DRAFT ? (
                            <button
                              onClick={() => {
                                onPublish(dish);
                                setOpenDropdownId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-current/10 transition-colors text-emerald-400"
                            >
                              <CheckCircle size={13} />
                              <span>Publish Dish</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onArchive(dish);
                                setOpenDropdownId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-current/10 transition-colors text-rose-400"
                            >
                              <Archive size={13} />
                              <span>Archive Dish</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
