import React, {
   createContext,
   useContext,
   useMemo,
   useState,
   useLayoutEffect,
   useRef,
} from 'react';
import {
   View,
   Modal,
   ActivityIndicator,
   StyleSheet,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
   getTheme,
   type ColorScheme,
   type Theme,
   type ThemeColors,
} from '@/theme';

const THEME_TRANSITION_MIN_MS = 400;

interface ThemeContextValue {
   theme: Theme;
   colors: ThemeColors;
   colorScheme: ColorScheme;
   isDark: boolean;
   isThemeTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
   const colorScheme = useSelector(
      (state: RootState) => state.settings.colorScheme
   );
   const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
   const isInitialMountRef = useRef(true);
   const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   const value = useMemo((): ThemeContextValue => {
      const theme = getTheme(colorScheme);
      return {
         theme,
         colors: theme.colors,
         colorScheme,
         isDark: colorScheme === 'dark',
         isThemeTransitioning,
      };
   }, [colorScheme, isThemeTransitioning]);

   useLayoutEffect(() => {
      if (isInitialMountRef.current) {
         isInitialMountRef.current = false;
         return;
      }

      if (hideTimerRef.current) {
         clearTimeout(hideTimerRef.current);
         hideTimerRef.current = null;
      }

      setIsThemeTransitioning(true);

      hideTimerRef.current = setTimeout(() => {
         setIsThemeTransitioning(false);
         hideTimerRef.current = null;
      }, THEME_TRANSITION_MIN_MS);

      return () => {
         if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
         }
      };
   }, [colorScheme]);

   return (
      <ThemeContext.Provider value={value}>
         <View style={styles.root}>{children}</View>
         <Modal
            visible={isThemeTransitioning}
            transparent={false}
            animationType="none"
            statusBarTranslucent
            onRequestClose={() => {}}
         >
            <View
               style={[
                  styles.modalContent,
                  { backgroundColor: value.colors.background.screen },
               ]}
            >
               <ActivityIndicator size="large" color={value.colors.accent.primary} />
            </View>
         </Modal>
      </ThemeContext.Provider>
   );
}

export function useTheme(): ThemeContextValue {
   const context = useContext(ThemeContext);
   if (!context) {
      throw new Error('useTheme must be used within ThemeProvider');
   }
   return context;
}

const styles = StyleSheet.create({
   root: {
      flex: 1,
   },
   modalContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
   },
});
