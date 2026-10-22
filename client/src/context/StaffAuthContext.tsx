'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SafeStaff, StaffRole, ROLE_DASHBOARDS } from '../types/staff';
import { apiClient } from '../lib/api';

interface StaffAuthContextType {
  staff: SafeStaff | null;
  loading: boolean;
  csrfToken: string | null;
  selectedLocation: string | null;
  setSelectedLocation: (locationId: string) => void;
  login: (email: string, password: string) => Promise<SafeStaff>;
  logout: () => Promise<void>;
  refreshStaff: () => Promise<void>;
  getDefaultRedirect: (role?: StaffRole) => string;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const StaffAuthProvider = ({ children }: { children: ReactNode }) => {
  const [staff, setStaff] = useState<SafeStaff | null>(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocationState] = useState<string | null>(null);

  const fetchCsrfToken = async () => {
    try {
      const data = await apiClient<{ success: boolean; csrfToken: string }>('/staff/auth/csrf');
      if (data?.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
    } catch {
      // Non-critical if offline
    }
  };

  const refreshStaff = async () => {
    try {
      const data = await apiClient<{ success: boolean; staff: SafeStaff }>('/staff/auth/me');
      if (data?.success && data?.staff) {
        setStaff(data.staff);
        // Default to first assigned location if not set
        if (!selectedLocation && data.staff.locationIds && data.staff.locationIds.length > 0) {
          setSelectedLocationState(data.staff.locationIds[0]);
        }
      } else {
        setStaff(null);
        setSelectedLocationState(null);
      }
    } catch {
      setStaff(null);
      setSelectedLocationState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStaff();
    fetchCsrfToken();
  }, []);

  const setSelectedLocation = (locationId: string) => {
    // Only allow selection if admin or staff is assigned to this location
    if (staff?.role === StaffRole.ADMIN || staff?.locationIds?.includes(locationId)) {
      setSelectedLocationState(locationId);
      try {
        localStorage.setItem('aurelle_staff_location', locationId);
      } catch {}
    }
  };

  const login = async (email: string, password: string): Promise<SafeStaff> => {
    const res = await apiClient<{
      success: boolean;
      staff: SafeStaff;
      csrfToken?: string;
      message?: string;
    }>('/staff/auth/login', {
      data: { email, password },
    });

    if (res.staff) {
      setStaff(res.staff);
      if (res.csrfToken) {
        setCsrfToken(res.csrfToken);
      }
      if (res.staff.locationIds && res.staff.locationIds.length > 0) {
        setSelectedLocationState(res.staff.locationIds[0]);
      }
      return res.staff;
    }

    throw new Error(res.message || 'Authentication failed');
  };

  const logout = async () => {
    try {
      await apiClient('/staff/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failures on logout
    } finally {
      setStaff(null);
      setSelectedLocationState(null);
    }
  };

  const getDefaultRedirect = (role?: StaffRole): string => {
    const targetRole = role || staff?.role;
    if (targetRole && ROLE_DASHBOARDS[targetRole]) {
      return ROLE_DASHBOARDS[targetRole];
    }
    return '/staff/login';
  };

  return (
    <StaffAuthContext.Provider
      value={{
        staff,
        loading,
        csrfToken,
        selectedLocation,
        setSelectedLocation,
        login,
        logout,
        refreshStaff,
        getDefaultRedirect,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = (): StaffAuthContextType => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
};
