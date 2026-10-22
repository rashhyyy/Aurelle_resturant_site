'use client';

import React from 'react';
import { StaffPlaceholderPage } from '../../../../components/staff/StaffPlaceholderPage';
import { StaffRole } from '../../../../types/staff';

export default function AdminCustomersPage() {
  return (
    <StaffPlaceholderPage
      title="Guest Directory & CRM"
      subtitle="Guest dining histories, lifetime spend records, VIP preferences, allergy notes, and loyalty statuses."
      moduleName="Customer Relationship Management"
      allowedRoles={[StaffRole.ADMIN]}
      returnRoute="/staff/admin"
    />
  );
}
