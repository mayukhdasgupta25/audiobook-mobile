import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface NavigationPillsProps {
   selectedTab?: 'shows' | 'movies' | 'categories';
   onTabChange?: (tab: 'shows' | 'movies' | 'categories') => void;
}

/**
 * Navigation pills component for category selection
 * Modern navigation button design
 */
const NavigationPillsComponent: React.FC<NavigationPillsProps> = ({
   selectedTab = 'shows',
   onTabChange,
}) => {
   // Memoize tabs array to prevent recreation on every render
   const tabs = useMemo(() => [
      { id: 'shows' as const, label: 'Shows' },
      { id: 'movies' as const, label: 'Movies' },
      { id: 'categories' as const, label: 'Categories' },
   ], []);

   // Memoize tab press handler
   const handleTabPress = useCallback((tabId: 'shows' | 'movies' | 'categories') => {
      onTabChange?.(tabId);
   }, [onTabChange]);

   return (
      <View style={styles.container}>
         {tabs.map((tab) => (
            <TouchableOpacity
               key={tab.id}
               onPress={() => handleTabPress(tab.id)}
               style={[
                  styles.pill,
                  selectedTab === tab.id && styles.pillActive,
               ]}
               activeOpacity={0.7}
            >
               <Text
                  style={[
                     styles.pillText,
                     selectedTab === tab.id && styles.pillTextActive,
                  ]}
               >
                  {tab.label}
               </Text>
               {tab.id === 'categories' && (
                  <Ionicons
                     name="chevron-down"
                     size={16}
                     color={
                        selectedTab === tab.id
                           ? colors.text.dark
                           : colors.text.secondaryDark
                     }
                     style={styles.chevron}
                  />
               )}
            </TouchableOpacity>
         ))}
      </View>
   );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export const NavigationPills = React.memo(NavigationPillsComponent);

const styles = StyleSheet.create({
   container: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingTop: 0,
      paddingBottom: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.background.dark,
      marginBottom: spacing.sm,
   },
   pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.background.darkGray,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
   },
   pillActive: {
      backgroundColor: colors.background.darkGrayLight,
   },
   pillText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      fontWeight: '500',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   pillTextActive: {
      color: colors.text.dark,
   },
   chevron: {
      marginLeft: -spacing.xs,
   },
});

