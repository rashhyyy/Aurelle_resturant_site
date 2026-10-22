'use client';

import React from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { KitchenDisplayBoard } from '../../../../components/kitchen/KitchenDisplayBoard';
import { StaffRole } from '../../../../types/staff';

export default function KitchenScheduledOrdersPage() {
  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN]}>
      <StaffPageHeader
        title="Scheduled Pre-Orders"
        subtitle="Advance dining pre-orders scheduled for later times today. Automatically transitions into live queue 30m before pickup."
        badge="SCHEDULED"
      />

      <KitchenDisplayBoard initialMode="scheduled" />
    </StaffLayout>
  );
}
