import { StaffRole, StaffStatus, SafeStaff } from './staff';

export interface StaffSummaryCounts {
  total: number;
  active: number;
  invited: number;
  disabled: number;
}

export interface StaffDirectoryQueryParams {
  search?: string;
  role?: string;
  status?: string;
  locationId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedStaffResponse {
  staff: SafeStaff[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StaffAuditLogItem {
  _id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetStaffId: string;
  targetStaffName: string;
  targetStaffEmail: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
  locationId?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface RestaurantLocationOption {
  id: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
}

export interface RolePermissionsData {
  permissionsMatrix: Record<StaffRole, string[]>;
  locations: RestaurantLocationOption[];
}

export interface InviteStaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: StaffRole;
  locationIds: string[];
}
