import React, { useCallback, useEffect, useRef } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
   type LayoutChangeEvent,
} from 'react-native';
import Animated, {
   cancelAnimation,
   interpolateColor,
   type SharedValue,
   useAnimatedStyle,
   useSharedValue,
   withSpring,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '@/theme';
import { TAB_UNDERLINE_SPRING } from '@/theme/tabAnimation';

export interface TabUnderlineItem {
   key: string;
   label: string;
   count?: number;
}

interface TabUnderlineProps {
   tabs: TabUnderlineItem[];
   activeKey: string;
   onTabPress: (key: string) => void;
}

interface TabLayout {
   x: number;
   width: number;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

interface TabLabelProps {
   label: string;
   index: number;
   activeProgress: SharedValue<number>;
   onPress: () => void;
   onLayout: (event: LayoutChangeEvent) => void;
}

function TabLabel({
   label,
   index,
   activeProgress,
   onPress,
   onLayout,
}: TabLabelProps) {
   const labelStyle = useAnimatedStyle(() => {
      const distance = Math.abs(activeProgress.value - index);
      const blend = Math.max(0, 1 - Math.min(distance, 1));
      return {
         color: interpolateColor(
            blend,
            [0, 1],
            [colors.text.muted, colors.accent.primary]
         ),
      };
   });

   return (
      <TouchableOpacity
         style={styles.tab}
         onPress={onPress}
         onLayout={onLayout}
         activeOpacity={0.7}
      >
         <AnimatedText style={[styles.label, labelStyle]}>{label}</AnimatedText>
      </TouchableOpacity>
   );
}

export const TabUnderline: React.FC<TabUnderlineProps> = ({
   tabs,
   activeKey,
   onTabPress,
}) => {
   const tabLayouts = useRef<Record<string, TabLayout>>({});
   const underlineX = useSharedValue(0);
   const underlineWidth = useSharedValue(0);
   const activeProgress = useSharedValue(
      Math.max(0, tabs.findIndex((tab) => tab.key === activeKey))
   );
   const hasInitialized = useRef(false);

   const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.key === activeKey));

   const animateToTab = useCallback(
      (key: string, index: number) => {
         const layout = tabLayouts.current[key];
         if (!layout) return;

         cancelAnimation(underlineX);
         cancelAnimation(underlineWidth);
         cancelAnimation(activeProgress);

         underlineX.value = withSpring(layout.x, TAB_UNDERLINE_SPRING);
         underlineWidth.value = withSpring(layout.width, TAB_UNDERLINE_SPRING);
         activeProgress.value = withSpring(index, TAB_UNDERLINE_SPRING);
      },
      [underlineX, underlineWidth, activeProgress]
   );

   useEffect(() => {
      const tab = tabs[activeIndex];
      if (tab) {
         animateToTab(tab.key, activeIndex);
      }
   }, [activeIndex, tabs, animateToTab]);

   const handleTabLayout = useCallback(
      (key: string, index: number, event: LayoutChangeEvent) => {
         const { x, width } = event.nativeEvent.layout;
         tabLayouts.current[key] = { x, width };

         if (index === activeIndex) {
            if (!hasInitialized.current) {
               underlineX.value = x;
               underlineWidth.value = width;
               activeProgress.value = index;
               hasInitialized.current = true;
            } else {
               animateToTab(key, index);
            }
         }
      },
      [activeIndex, animateToTab, underlineX, underlineWidth, activeProgress]
   );

   const underlineStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: underlineX.value }],
      width: underlineWidth.value,
   }));

   return (
      <View style={styles.container}>
         <View style={styles.tabRow}>
            {tabs.map((tab, index) => {
               const label =
                  tab.count !== undefined
                     ? `${tab.label} (${tab.count})`
                     : tab.label;

               return (
                  <TabLabel
                     key={tab.key}
                     label={label}
                     index={index}
                     activeProgress={activeProgress}
                     onPress={() => onTabPress(tab.key)}
                     onLayout={(event) => handleTabLayout(tab.key, index, event)}
                  />
               );
            })}
            <Animated.View style={[styles.slidingUnderline, underlineStyle]} />
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      paddingHorizontal: spacing.md,
   },
   tabRow: {
      flexDirection: 'row',
      position: 'relative',
   },
   tab: {
      marginRight: spacing.lg,
      paddingVertical: spacing.sm,
   },
   label: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   slidingUnderline: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: 2,
      backgroundColor: colors.accent.primary,
      borderRadius: 1,
   },
});
