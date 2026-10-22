'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Edit,
  Copy,
  Archive,
  CheckCircle,
  Star,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { ClientMenuItem, PublicationStatus } from '../../types/menu';

interface MenuMobileCardListProps {
  dishes: ClientMenuItem[];
  loading: boolean;
  onToggleAvailability: (dish: ClientMenuItem) => void;
  onDuplicate: (dish: ClientMenuItem) => void;
  onArchive: (dish: ClientMenuItem) => void;
  onPublish: (dish: ClientMenuItem) => void;
  isDark: boolean;
}

export const MenuMobileCardList: React.FC<MenuMobileCardListProps> = ({
  dishes,
  loading,
  onToggleAvailability,
  onDuplicate,
  onArchive,
  onPublish,
  isDark,
}) => {
  if (loading) {
    return (
      <div className="md:hidden space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl border animate-pulse space-y-3 ${
              isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
            }`}
          >
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-current/10 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-current/10 rounded" />
                <div className="h-3 w-48 bg-current/10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (dishes.length === 0) {
    return (
      <div
        className={`md:hidden p-8 text-center rounded-2xl border ${
          isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
        }`}
      >
        <AlertCircle size={28} className="text-[#B99A63] mx-auto mb-2 opacity-60" />
        <p className="font-serif text-sm">No dishes match your query.</p>
        <p className={`text-xs mt-1 ${isDark ? 'text-[#7A766D]' : 'text-[#8E8A80]'}`}>
          Try adjusting search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {dishes.map((dish) => (
        <div
          key={dish.id}
          className={`p-4 rounded-2xl border shadow-sm space-y-3.5 transition-all ${
            isDark ? 'bg-[#1E1E1B] border-[#2C2C28]' : 'bg-white border-[#E5DFD3]'
          }`}
        >
          {/* TOP ROW: IMAGE, NAME, PRICE */}
          <div className="flex items-start gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-current/10 bg-black">
              <Image
                src={dish.images[0] || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000'}
                alt={dish.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={`font-serif font-medium text-sm leading-snug truncate ${
                    isDark ? 'text-[#F6F1E8]' : 'text-[#171715]'
                  }`}
                >
                  {dish.name}
                </h3>
                {dish.isFeatured && (
                  <Star size={14} className="text-[#B99A63] fill-[#B99A63] shrink-0 mt-0.5" />
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono font-semibold text-xs text-[#B99A63]">
                  {dish.formattedPrice}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                    isDark ? 'bg-[#171715] border-[#2C2C28] text-[#D1CDC7]' : 'bg-[#F9F7F2] border-[#E5DFD3] text-[#4A4740]'
                  }`}
                >
                  {dish.categoryName}
                </span>
              </div>

              <p
                className={`text-[11px] font-light truncate mt-1 ${
                  isDark ? 'text-[#A5A198]' : 'text-[#6B685F]'
                }`}
              >
                {dish.shortDescription || dish.description}
              </p>
            </div>
          </div>

          {/* STATUS & AVAILABILITY ROW */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div className="flex items-center gap-1.5">
              {dish.publicationStatus === PublicationStatus.PUBLISHED ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              ) : dish.publicationStatus === PublicationStatus.DRAFT ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Draft
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  Archived
                </span>
              )}
            </div>

            <button
              onClick={() => onToggleAvailability(dish)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider border ${
                dish.isAvailable
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {dish.isAvailable ? <Check size={11} /> : <X size={11} />}
              <span>{dish.isAvailable ? 'In Stock' : 'Sold Out'}</span>
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Link
              href={`/staff/admin/menu/${dish.id}/edit`}
              className={`py-1.5 rounded-lg border text-center text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 ${
                isDark ? 'border-[#2C2C28] text-[#D1CDC7]' : 'border-[#E5DFD3] text-[#4A4740]'
              }`}
            >
              <Edit size={12} className="text-[#B99A63]" />
              <span>Edit</span>
            </Link>

            <button
              onClick={() => onDuplicate(dish)}
              className={`py-1.5 rounded-lg border text-center text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 ${
                isDark ? 'border-[#2C2C28] text-[#D1CDC7]' : 'border-[#E5DFD3] text-[#4A4740]'
              }`}
            >
              <Copy size={12} className="text-indigo-400" />
              <span>Copy</span>
            </button>

            {dish.publicationStatus === PublicationStatus.DRAFT ? (
              <button
                onClick={() => onPublish(dish)}
                className="py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-center text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <CheckCircle size={12} />
                <span>Publish</span>
              </button>
            ) : (
              <button
                onClick={() => onArchive(dish)}
                className="py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <Archive size={12} />
                <span>Archive</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
