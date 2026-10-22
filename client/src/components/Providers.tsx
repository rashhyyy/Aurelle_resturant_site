'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { StaffAuthProvider } from '../context/StaffAuthContext';
import { StaffThemeProvider } from '../context/StaffThemeContext';
import { SocketProvider } from '../context/SocketContext';
import { PreferencesProvider } from '../context/PreferencesContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <StaffAuthProvider>
          <StaffThemeProvider>
            <SocketProvider>{children}</SocketProvider>
          </StaffThemeProvider>
        </StaffAuthProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
