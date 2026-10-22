'use client';

import React from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { KitchenDisplayBoard } from '../../../../components/kitchen/KitchenDisplayBoard';
import { StaffRole } from '../../../../types/staff';

export default function KitchenReadyOrdersPage() {
  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN]}>
      <StaffPageHeader
        title="Ready for Guest Handoff"
        subtitle="Completed dishes and plated courses ready for pickup or server collection."
        badge="THE PASS"
      />

      <KitchenDisplayBoard initialMode="ready" />
    </StaffLayout>
  );
}
