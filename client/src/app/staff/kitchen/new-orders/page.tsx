'use client';

import React from 'react';
import { StaffLayout } from '../../../../components/staff/StaffLayout';
import { StaffPageHeader } from '../../../../components/staff/StaffPageHeader';
import { KitchenDisplayBoard } from '../../../../components/kitchen/KitchenDisplayBoard';
import { StaffRole } from '../../../../types/staff';

export default function KitchenNewOrdersPage() {
  return (
    <StaffLayout allowedRoles={[StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.KITCHEN]}>
      <StaffPageHeader
        title="Incoming New Tickets"
        subtitle="Newly arrived culinary tickets awaiting line acceptance and station routing."
        badge="NEW TICKETS"
      />

      <KitchenDisplayBoard initialMode="new" />
    </StaffLayout>
  );
}
