/**
 * Design tokens for the application
 * Centralized theme configuration for colors, spacing, typography, etc.
 */

export const colors = {
   // App brand colors
   app: {
      red: '#E50914',
      darkRed: '#B20710',
   },
   // Primary colors
   primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
   },
   // Neutral colors
   neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
   },
   // Semantic colors
   success: '#10b981',
   error: '#ef4444',
   warning: '#f59e0b',
   info: '#3b82f6',
   // Background colors
   background: {
      light: '#ffffff',
      dark: '#000000',
      darkGray: '#141414',
      darkGrayLight: '#1a1a1a',
   },
   // Text colors
   text: {
      light: '#000000',
      dark: '#ffffff',
      secondary: '#666666',
      secondaryDark: '#a3a3a3',
   },
} as const;

export const spacing = {
   xs: 4,
   sm: 8,
   md: 16,
   lg: 24,
   xl: 32,
   xxl: 48,
} as const;

export const typography = {
   fontFamily: {
      // Professional font families - platform specific
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
   },
   fontSize: {
      xs: 10,      // Reduced from 12
      sm: 12,      // Reduced from 14
      base: 14,    // Reduced from 16
      lg: 16,      // Reduced from 18
      xl: 18,      // Reduced from 20
      '2xl': 20,   // Reduced from 24
      '3xl': 24,   // Reduced from 30
      '4xl': 28,   // Reduced from 36
   },
   lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
   },
   // Font weight mapping for consistent usage
   fontWeight: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
      extraBold: '800',
   },
} as const;

export const borderRadius = {
   none: 0,
   sm: 4,
   md: 8,
   lg: 12,
   xl: 16,
   full: 9999,
} as const;

export const shadows = {
   sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
   },
   md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
   },
   lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
   },
} as const;

// Dark mode theme
export const darkTheme = {
   colors: {
      ...colors,
      background: {
         light: '#1a1a1a',
         dark: '#000000',
      },
      text: {
         light: '#ffffff',
         dark: '#000000',
         secondary: '#a3a3a3',
      },
   },
   spacing,
   typography,
   borderRadius,
   shadows,
} as const;

// Light mode theme
export const lightTheme = {
   colors,
   spacing,
   typography,
   borderRadius,
   shadows,
} as const;

export type Theme = typeof lightTheme;

