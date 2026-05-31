import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
   getTheme,
   type ColorScheme,
   type Theme,
   type ThemeColors,
} from '@/theme';

interface ThemeContextValue {
   theme: Theme;
   colors: ThemeColors;
   colorScheme: ColorScheme;
   isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
   const colorScheme = useSelector(
      (state: RootState) => state.settings.colorScheme
   );

   const value = useMemo((): ThemeContextValue => {
      const theme = getTheme(colorScheme);
      return {
         theme,
         colors: theme.colors,
         colorScheme,
         isDark: colorScheme === 'dark',
      };
   }, [colorScheme]);

   return (
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
   );
}

export function useTheme(): ThemeContextValue {
   const context = useContext(ThemeContext);
   if (!context) {
      throw new Error('useTheme must be used within ThemeProvider');
   }
   return context;
}
