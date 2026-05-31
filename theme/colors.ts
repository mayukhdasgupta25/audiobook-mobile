/**
 * Light and dark color palettes — identical key structure for theme switching.
 */

export type ThemeColors = {
   app: {
      red: string;
      darkRed: string;
   };
   accent: {
      primary: string;
      primaryDark: string;
   };
   primary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
   };
   neutral: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
   };
   success: string;
   error: string;
   warning: string;
   info: string;
   like: string;
   background: {
      screen: string;
      player: string;
      input: string;
      card: string;
      highlight: string;
      drawer: string;
      light: string;
      dark: string;
      darkGray: string;
      darkGrayLight: string;
   };
   text: {
      primary: string;
      secondary: string;
      muted: string;
      dark: string;
      light: string;
      secondaryDark: string;
   };
   border: {
      light: string;
      medium: string;
   };
   iconBackgrounds: {
      brown: string;
      green: string;
      pink: string;
      purple: string;
      yellow: string;
      blue: string;
      greenShield: string;
      orange: string;
      red: string;
      peach: string;
      neutral: string;
   };
   iconForegrounds: {
      brown: string;
      green: string;
      pink: string;
      purple: string;
      yellow: string;
      blue: string;
      orange: string;
      red: string;
      muted: string;
   };
   membership: {
      bannerBg: string;
      bannerText: string;
      badgeBg: string;
      badgeText: string;
      noneBadgeBg: string;
      noneBadgeText: string;
   };
};

export const lightColors: ThemeColors = {
   app: {
      red: '#6F431B',
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
   like: '#B57373',
   background: {
      screen: '#FFFFFF',
      player: '#FDF8F2',
      input: '#F3F4F6',
      card: '#FFFFFF',
      highlight: '#F5F0E8',
      drawer: '#FAF6F1',
      light: '#FFFFFF',
      dark: '#FFFFFF',
      darkGray: '#FFFFFF',
      darkGrayLight: '#F3F4F6',
   },
   text: {
      primary: '#111111',
      secondary: '#6B7280',
      muted: '#9CA3AF',
      dark: '#111111',
      light: '#111111',
      secondaryDark: '#9CA3AF',
   },
   border: {
      light: '#E5E7EB',
      medium: '#D1D5DB',
   },
   iconBackgrounds: {
      brown: '#F5E6D3',
      green: '#E6F4EA',
      pink: '#FCE7F3',
      purple: '#EDE9FE',
      yellow: '#FEF9C3',
      blue: '#DBEAFE',
      greenShield: '#DCFCE7',
      orange: '#FFEDD5',
      red: '#FEE2E2',
      peach: '#FEF3E2',
      neutral: '#F3F4F6',
   },
   iconForegrounds: {
      brown: '#6F431B',
      green: '#16A34A',
      pink: '#DB2777',
      purple: '#7C3AED',
      yellow: '#CA8A04',
      blue: '#2563EB',
      orange: '#EA580C',
      red: '#DC2626',
      muted: '#9CA3AF',
   },
   membership: {
      bannerBg: '#FEF3E2',
      bannerText: '#6F431B',
      badgeBg: '#FEF3E2',
      badgeText: '#6F431B',
      noneBadgeBg: '#F3F4F6',
      noneBadgeText: '#6B7280',
   },
};

export const darkColors: ThemeColors = {
   app: {
      red: '#C9A882',
      darkRed: '#A67C52',
   },
   accent: {
      primary: '#C9A882',
      primaryDark: '#A67C52',
   },
   primary: {
      50: '#2A1810',
      100: '#3D2319',
      200: '#4B2C20',
      300: '#5C3817',
      400: '#6F431B',
      500: '#A67C52',
      600: '#C9A882',
      700: '#E0CCB0',
      800: '#F0E6D8',
      900: '#FAF6F1',
   },
   neutral: {
      50: '#111827',
      100: '#1F2937',
      200: '#374151',
      300: '#4B5563',
      400: '#6B7280',
      500: '#9CA3AF',
      600: '#D1D5DB',
      700: '#E5E7EB',
      800: '#F3F4F6',
      900: '#FAFAFA',
   },
   success: '#34d399',
   error: '#F87171',
   warning: '#fbbf24',
   info: '#60a5fa',
   like: '#D4A0A0',
   background: {
      screen: '#0F0F0F',
      player: '#1A1510',
      input: '#2C2C2E',
      card: '#1C1C1E',
      highlight: '#2A2318',
      drawer: '#4A3828',
      light: '#0F0F0F',
      dark: '#1C1C1E',
      darkGray: '#252528',
      darkGrayLight: '#2C2C2E',
   },
   text: {
      primary: '#F5F5F5',
      secondary: '#A1A1AA',
      muted: '#71717A',
      dark: '#F5F5F5',
      light: '#F5F5F5',
      secondaryDark: '#71717A',
   },
   border: {
      light: '#2E2E32',
      medium: '#3F3F46',
   },
   iconBackgrounds: {
      brown: '#3D2E1F',
      green: '#1A2E1F',
      pink: '#3D1F2E',
      purple: '#2A1F3D',
      yellow: '#3D351F',
      blue: '#1F2A3D',
      greenShield: '#1A2E22',
      orange: '#3D2A1F',
      red: '#3D1F1F',
      peach: '#3D301F',
      neutral: '#2C2C2E',
   },
   iconForegrounds: {
      brown: '#C9A882',
      green: '#4ADE80',
      pink: '#F472B6',
      purple: '#A78BFA',
      yellow: '#FACC15',
      blue: '#60A5FA',
      orange: '#FB923C',
      red: '#F87171',
      muted: '#71717A',
   },
   membership: {
      bannerBg: '#2A2318',
      bannerText: '#C9A882',
      badgeBg: '#2A2318',
      badgeText: '#C9A882',
      noneBadgeBg: '#2C2C2E',
      noneBadgeText: '#A1A1AA',
   },
};
