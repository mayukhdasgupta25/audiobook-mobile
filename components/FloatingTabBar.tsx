import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getTabBarFloatHorizontal, getTabBarFloatBottom } from '@/theme/tabLayout';

/**
 * Floating pill-style bottom tab bar with rounded border and shadow.
 */
export function FloatingTabBar(props: BottomTabBarProps) {
   const insets = useSafeAreaInsets();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         outer: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            zIndex: 200,
            ...Platform.select({
               android: { elevation: 200 },
            }),
         },
         pill: {
            borderRadius: borderRadius.xl,
            backgroundColor: t.colors.background.screen,
            overflow: 'hidden',
            ...t.shadows.lg,
            ...Platform.select({
               android: { elevation: 12 },
            }),
         },
      })
   );

   return (
      <View
         style={[
            styles.outer,
            {
               paddingHorizontal: getTabBarFloatHorizontal(),
               paddingBottom: insets.bottom + getTabBarFloatBottom(),
            },
         ]}
         pointerEvents="box-none"
      >
         <View style={styles.pill}>
            <BottomTabBar {...props} />
         </View>
      </View>
   );
}
