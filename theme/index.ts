/**
 * Design tokens — light cream/brown audiobook theme with dark mode support
 */

import { darkColors, lightColors, type ThemeColors } from './colors';

export type ColorScheme = 'light' | 'dark';

/** @deprecated Use useTheme().colors instead — kept for non-UI modules during migration */
export const colors = lightColors;

export type { ThemeColors };

export const spacing = {
   xs: 4,
   sm: 8,
   md: 16,
   lg: 24,
   xl: 32,
   xxl: 48,
   tabBarGap: 12,
   tabBarFloatHorizontal: 16,
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

export const darkShadows = {
   sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
   },
   md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 3,
   },
   lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
   },
   tabBar: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
   },
} as const;

export { getTimestampMentionStyles } from './timestampMention';
export { lightColors, darkColors } from './colors';

export type ThemeShadows = {
   sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
   };
   md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
   };
   lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
   };
   tabBar: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
   };
};

export type Theme = {
   colors: ThemeColors;
   spacing: typeof spacing;
   typography: typeof typography;
   borderRadius: typeof borderRadius;
   shadows: ThemeShadows;
};

export const lightTheme: Theme = {
   colors: lightColors,
   spacing,
   typography,
   borderRadius,
   shadows,
} ;

export const darkTheme: Theme = {
   colors: darkColors,
   spacing,
   typography,
   borderRadius,
   shadows: darkShadows,
};

export function getTheme(colorScheme: ColorScheme): Theme {
   return colorScheme === 'dark' ? darkTheme : lightTheme;
}
