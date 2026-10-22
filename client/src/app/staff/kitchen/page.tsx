'use client';

import React from 'react';
import { StaffLayout } from '../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../components/staff/StaffPageHeader';
import { KitchenDisplayBoard } from '../../../components/kitchen/KitchenDisplayBoard';
import { StaffRole } from '../../../types/staff';

export default function KitchenDashboardPage() {
  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN]}>
      <StaffPageHeader
        title="Kitchen Display System"
        subtitle="Real-time culinary order flow, line expediting, course firing, and guest handoff."
        badge="KDS LINE"
      />

      <KitchenDisplayBoard initialMode="all" />
    </StaffLayout>
  );
}
