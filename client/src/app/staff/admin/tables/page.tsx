'use client';

import React from 'react';
import { StaffPlaceholderPage } from '../../../../components/staff/StaffPlaceholderPage';
import { StaffRole } from '../../../../types/staff';

export default function AdminTablesPage() {
  return (
    <StaffPlaceholderPage
      title="Tables & Floor Plan Architecture"
      subtitle="Spatial dining room designer, table numbering schemas, seating capacities, and service section allocation."
      moduleName="Floor Plan Architect"
      allowedRoles={[StaffRole.ADMIN]}
      returnRoute="/staff/admin"
    />
  );
}
