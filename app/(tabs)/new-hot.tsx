import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { colors, typography } from '@/theme';

/**
 * New & Hot tab screen content
 * Placeholder for future implementation
 */
function NewHotScreenContent() {
   return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
         <View style={styles.content}>
            <Text style={styles.title}>New & Hot</Text>
            <Text style={styles.subtitle}>Coming soon...</Text>
         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
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
      color: colors.text.dark,
      marginBottom: 8,
      letterSpacing: -0.3,
   },
   subtitle: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      fontWeight: '400',
   },
});

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

