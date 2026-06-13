import React, { useCallback } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SkipDurationPicker } from '@/components/settings/SkipDurationPicker';
import { PlaybackSpeedPicker } from '@/components/settings/PlaybackSpeedPicker';
import { SleepTimerPicker } from '@/components/settings/SleepTimerPicker';
import { spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function PlaybackSettingsScreen() {
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flex: 1,
            backgroundColor: t.colors.background.screen,
         },
         scrollView: {
            flex: 1,
         },
      })
   );

   const insets = useSafeAreaInsets();

   const handleBackPress = useCallback(() => {
      router.back();
   }, []);

   return (
      <>
         <Stack.Screen
            options={{
               headerShown: false,
               contentStyle: { backgroundColor: colors.background.screen },
            }}
         />
         <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScreenHeader
               headerIcon="playback-settings"
               onBack={handleBackPress}
               titleSize="large"
            />
            <ScrollView
               style={styles.scrollView}
               contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
               showsVerticalScrollIndicator={false}
            >
               <SettingsSection title="Skip intervals">
                  <SkipDurationPicker />
               </SettingsSection>

               <SettingsSection title="Playback speed">
                  <PlaybackSpeedPicker />
               </SettingsSection>

               <SettingsSection title="Sleep timer">
                  <SleepTimerPicker />
               </SettingsSection>
            </ScrollView>
         </SafeAreaView>
      </>
   );
}
