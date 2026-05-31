import React, { useMemo, useCallback, useState } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Switch,
   Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { ProfileUserCard } from '@/components/profile/ProfileUserCard';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsMenuRow } from '@/components/settings/SettingsMenuRow';
import { colors, spacing, typography } from '@/theme';
import { resolveAvatarUrl } from '@/utils/resolveAvatarUrl';
import { resolveMembershipTier } from '@/utils/membershipDisplay';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { RootState } from '@/store';

function formatLanguageLabel(language?: string): string | undefined {
   if (!language?.trim()) {
      return undefined;
   }
   try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
      return displayNames.of(language) ?? language;
   } catch {
      return language;
   }
}

export default function SettingsScreen() {
   const insets = useSafeAreaInsets();
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const user = useSelector((state: RootState) => state.auth.user);
   const { activeSubscription } = useUserSubscription();
   const [carModeEnabled, setCarModeEnabled] = useState(false);

   const displayName = useMemo(() => {
      if (userProfile?.firstName && userProfile?.lastName) {
         return `${userProfile.firstName} ${userProfile.lastName}`;
      }
      if (userProfile?.firstName) {
         return userProfile.firstName;
      }
      if (userProfile?.username) {
         return userProfile.username;
      }
      return 'User';
   }, [userProfile]);

   const avatarUri = resolveAvatarUrl(userProfile?.avatar);
   const membershipTier = resolveMembershipTier(activeSubscription?.plan);
   const planName = activeSubscription?.plan.name;
   const languageLabel = formatLanguageLabel(userProfile?.preferences.language);

   const appVersion = Application.nativeApplicationVersion ?? '1.0.0';

   const handleBackPress = useCallback(() => {
      router.back();
   }, []);

   const handleAccountPress = useCallback(() => {
      router.push('/account');
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
            <ScrollView
               style={styles.scrollView}
               contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: insets.bottom + spacing.xl },
               ]}
               showsVerticalScrollIndicator={false}
            >
               <View style={styles.header}>
                  <TouchableOpacity
                     onPress={handleBackPress}
                     style={styles.backButton}
                     activeOpacity={0.7}
                  >
                     <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Settings</Text>
                  <View style={styles.headerSpacer} />
               </View>

               <ProfileUserCard
                  displayName={displayName}
                  email={user?.email}
                  avatarUri={avatarUri}
                  tier={membershipTier}
                  planName={planName}
                  onPress={handleAccountPress}
               />

               <SettingsSection title="Playback">
                  <SettingsMenuRow
                     title="Playback Settings"
                     subtitle="Sleep timer, skip intervals, speed"
                     icon="play-circle-outline"
                     iconBg={colors.iconBackgrounds.brown}
                     iconColor={colors.iconForegrounds.brown}
                  />
                  <SettingsMenuRow
                     title="Downloads"
                     subtitle="Download quality, storage location"
                     icon="download-outline"
                     iconBg={colors.iconBackgrounds.green}
                     iconColor={colors.iconForegrounds.green}
                  />
                  <SettingsMenuRow
                     title="Audio Quality"
                     subtitle="Streaming & download quality"
                     icon="pulse-outline"
                     iconBg={colors.iconBackgrounds.pink}
                     iconColor={colors.iconForegrounds.pink}
                  />
                  <SettingsMenuRow
                     title="Car Mode"
                     subtitle="Driving settings and shortcuts"
                     icon="car-outline"
                     iconBg={colors.iconBackgrounds.purple}
                     iconColor={colors.iconForegrounds.purple}
                     showChevron={false}
                     isLast
                     trailing={
                        <Switch
                           value={carModeEnabled}
                           onValueChange={setCarModeEnabled}
                           trackColor={{
                              false: colors.border.medium,
                              true: colors.primary[300],
                           }}
                           thumbColor={colors.background.screen}
                        />
                     }
                  />
               </SettingsSection>

               <SettingsSection title="Personalization">
                  <SettingsMenuRow
                     title="Content Preferences"
                     subtitle="Genres, themes & topics you love"
                     icon="heart-outline"
                     iconBg={colors.iconBackgrounds.pink}
                     iconColor={colors.iconForegrounds.pink}
                  />
                  <SettingsMenuRow
                     title="Recommendations"
                     subtitle="Manage your recommendation settings"
                     icon="sparkles-outline"
                     iconBg={colors.iconBackgrounds.yellow}
                     iconColor={colors.iconForegrounds.yellow}
                  />
                  <SettingsMenuRow
                     title="Notifications"
                     subtitle="Manage push notifications"
                     icon="notifications-outline"
                     iconBg={colors.iconBackgrounds.green}
                     iconColor={colors.iconForegrounds.green}
                  />
                  <SettingsMenuRow
                     title="Language"
                     subtitle="Change app language"
                     icon="globe-outline"
                     iconBg={colors.iconBackgrounds.blue}
                     iconColor={colors.iconForegrounds.blue}
                     isLast
                     trailing={
                        languageLabel ? (
                           <View style={styles.languageTrailing}>
                              <Text style={styles.languageText}>{languageLabel}</Text>
                              <Ionicons
                                 name="chevron-forward"
                                 size={20}
                                 color={colors.text.secondaryDark}
                              />
                           </View>
                        ) : (
                           <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={colors.text.secondaryDark}
                           />
                        )
                     }
                  />
               </SettingsSection>

               <SettingsSection title="Account & App">
                  <SettingsMenuRow
                     title="Privacy & Security"
                     subtitle="Manage privacy and security settings"
                     icon="shield-checkmark-outline"
                     iconBg={colors.iconBackgrounds.blue}
                     iconColor={colors.iconForegrounds.blue}
                     onPress={handleAccountPress}
                  />
                  <SettingsMenuRow
                     title="Payment & Billing"
                     subtitle="Manage your subscription and payments"
                     icon="card-outline"
                     iconBg={colors.iconBackgrounds.orange}
                     iconColor={colors.iconForegrounds.orange}
                     onPress={() => router.push('/subscription-plans')}
                  />
                  <SettingsMenuRow
                     title="About"
                     subtitle={`App version, terms & policies · v${appVersion}`}
                     icon="information-circle-outline"
                     iconBg={colors.iconBackgrounds.purple}
                     iconColor={colors.iconForegrounds.purple}
                     isLast
                  />
               </SettingsSection>

               <SettingsSection title="More">
                  <SettingsMenuRow
                     title="Invite Friends"
                     subtitle="Share the app and earn rewards"
                     icon="share-social-outline"
                     iconBg={colors.iconBackgrounds.orange}
                     iconColor={colors.iconForegrounds.orange}
                     isLast
                  />
               </SettingsSection>
            </ScrollView>
         </SafeAreaView>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.screen,
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {},
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
   },
   backButton: {
      padding: spacing.xs,
      marginRight: spacing.sm,
   },
   headerTitle: {
      flex: 1,
      fontSize: typography.fontSize['3xl'],
      color: colors.text.primary,
      textAlign: 'center',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
      }),
   },
   headerSpacer: {
      width: 32,
   },
   languageTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
   },
   languageText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
   },
});
