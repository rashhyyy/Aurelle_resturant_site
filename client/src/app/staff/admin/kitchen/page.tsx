'use client';

import React from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { KitchenDisplayBoard } from '../../../../components/kitchen/KitchenDisplayBoard';
import { StaffRole } from '../../../../types/staff';

export default function AdminKitchenPage() {
  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER]}>
      <StaffPageHeader
        title="Kitchen Display System (Executive View)"
        subtitle="Live culinary pass monitoring, cooking line stations, and guest preparation tracking."
        badge="ADMIN PASS"
      />

      <KitchenDisplayBoard initialMode="all" />
    </StaffLayout>
  );
}
