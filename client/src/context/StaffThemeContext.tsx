'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type StaffTheme = Theme;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

export type StaffThemeContextType = ThemeContextType;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const StaffThemeContext = ThemeContext;

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('aurelle_theme') ||
        localStorage.getItem('aurelle_staff_theme')) as Theme | null;

      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'light') {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        }
      } else {
        // Default to dark mode if no preference saved
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } catch {
      // LocalStorage unavailable in certain iframe/sandboxed modes
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    // Add temporary transition class for smooth 300ms cross-fade
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transition');
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }

      window.setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 350);
    }

    setThemeState(newTheme);

    try {
      localStorage.setItem('aurelle_theme', newTheme);
      localStorage.setItem('aurelle_staff_theme', newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      <div
        suppressHydrationWarning
        data-theme={theme}
        data-staff-theme={theme}
        className="w-full min-h-screen transition-colors duration-200 bg-[#171715] text-[#F6F1E8]"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const StaffThemeProvider = ThemeProvider;

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useStaffTheme = useTheme;

