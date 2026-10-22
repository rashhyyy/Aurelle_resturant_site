'use client';

import React from 'react';

interface StaffStatusBadgeProps {
  status: string;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'gold';
}

export const StaffStatusBadge = ({ status, variant }: StaffStatusBadgeProps) => {
  // Infer variant if not provided
  let computedVariant = variant;
  if (!computedVariant) {
    const s = status.toUpperCase();
    if (['ACTIVE', 'READY', 'CONFIRMED', 'DELIVERED', 'COMPLETED'].includes(s)) {
      computedVariant = 'success';
    } else if (['INVITED', 'PREPARING', 'SEATED', 'PENDING'].includes(s)) {
      computedVariant = 'warning';
    } else if (['DISABLED', 'CANCELLED', 'VOID', 'FAILED'].includes(s)) {
      computedVariant = 'danger';
    } else if (['ADMIN', 'VIP'].includes(s)) {
      computedVariant = 'gold';
    } else {
      computedVariant = 'neutral';
    }
  }

  const styles = {
    neutral: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    gold: 'bg-[#B99A63]/15 text-[#B99A63] border-[#B99A63]/30',
  }[computedVariant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border ${styles}`}
    >
      {status}
    </span>
  );
};
