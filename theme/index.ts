/**
 * Design tokens — light cream/brown audiobook theme
 */

export const colors = {
   app: {
      /** @deprecated Use accent.primary */
      red: '#6F431B',
      /** @deprecated Use accent.primaryDark */
      darkRed: '#4B2C20',
   },
   accent: {
      primary: '#6F431B',
      primaryDark: '#4B2C20',
   },
   primary: {
      50: '#FAF6F1',
      100: '#F0E6D8',
      200: '#E0CCB0',
      300: '#C9A882',
      400: '#A67C52',
      500: '#6F431B',
      600: '#5C3817',
      700: '#4B2C20',
      800: '#3D2319',
      900: '#2A1810',
   },
   neutral: {
      50: '#FAFAFA',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
   },
   success: '#10b981',
   error: '#EF4444',
   warning: '#f59e0b',
   info: '#3b82f6',
   like: '#EF4444',
   background: {
      screen: '#FFFFFF',
      player: '#FDF8F2',
      input: '#F3F4F6',
      card: '#FFFFFF',
      highlight: '#F5F0E8',
      /** Legacy: maps to screen */
      light: '#FFFFFF',
      /** Legacy: maps to screen */
      dark: '#FFFFFF',
      /** Legacy: maps to card / tab bar */
      darkGray: '#FFFFFF',
      /** Legacy: maps to input */
      darkGrayLight: '#F3F4F6',
   },
   text: {
      primary: '#111111',
      secondary: '#6B7280',
      muted: '#9CA3AF',
      /** Legacy: maps to primary */
      dark: '#111111',
      /** Legacy */
      light: '#111111',
      secondaryDark: '#9CA3AF',
   },
   border: {
      light: '#E5E7EB',
      medium: '#D1D5DB',
   },
} as const;

export const spacing = {
   xs: 4,
   sm: 8,
   md: 16,
   lg: 24,
   xl: 32,
   xxl: 48,
   /** Gap between scroll content and bottom tab bar */
   tabBarGap: 12,
   /** Horizontal inset for floating tab bar pill */
   tabBarFloatHorizontal: 16,
   /** Bottom inset below floating tab bar pill (above home indicator) */
   tabBarFloatBottom: 10,
} as const;

export const typography = {
   fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
   },
   fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
      '4xl': 28,
   },
   lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
   },
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
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
   },
   lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
   },
   tabBar: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 8,
   },
} as const;

export const lightTheme = {
   colors,
   spacing,
   typography,
   borderRadius,
   shadows,
} as const;

export const darkTheme = lightTheme;

export type Theme = typeof lightTheme;
