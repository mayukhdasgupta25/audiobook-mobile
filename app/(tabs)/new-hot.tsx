import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { typography } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getTabScreenPaddingBottom } from '@/theme/tabLayout';

/**
 * New & Hot tab screen content
 * Placeholder for future implementation
 */
function NewHotScreenContent() {
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flex: 1,
            backgroundColor: t.colors.background.screen,
         },
         content: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
         },
         title: {
            fontSize: typography.fontSize['2xl'],
            fontWeight: '600',
            color: t.colors.text.dark,
            marginBottom: 8,
            letterSpacing: -0.3,
         },
         subtitle: {
            fontSize: typography.fontSize.base,
            color: t.colors.text.secondaryDark,
            fontWeight: '400',
         },
      })
   );
   const insets = useSafeAreaInsets();

   // Calculate dynamic padding for content
   const contentPadding = getTabScreenPaddingBottom(insets.bottom);

   return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
         <View style={[styles.content, { paddingBottom: contentPadding }]}>
            <Text style={styles.title}>New & Hot</Text>
            <Text style={styles.subtitle}>Coming soon...</Text>
         </View>
      </SafeAreaView>
   );
}

/**
 * New & Hot screen wrapper with conditional animation
 * Transitions from right if coming from Home, from left if coming from My AudioBook
 */
export default function NewHotScreen() {
   const { previousRoute } = useTabNavigation();

   return (
      <AnimatedTabScreen
         direction="right"
         previousRoute={previousRoute}
         currentRoute="new-hot"
      >
         <NewHotScreenContent />
      </AnimatedTabScreen>
   );
}

