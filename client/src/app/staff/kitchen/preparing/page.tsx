'use client';

import React from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { KitchenDisplayBoard } from '../../../../components/kitchen/KitchenDisplayBoard';
import { StaffRole } from '../../../../types/staff';

export default function KitchenPreparingPage() {
  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN]}>
      <StaffPageHeader
        title="Active Preparation Line"
        subtitle="Live cooking stations, timer countdowns, and preparation station dispatch."
        badge="IN PREP"
      />

      <KitchenDisplayBoard initialMode="preparing" />
    </StaffLayout>
  );
}
