import React, { useMemo, useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedTabScreen } from '@/components/AnimatedTabScreen';
import { ProfileUserCard } from '@/components/profile/ProfileUserCard';
import { ProfileStatsRow } from '@/components/profile/ProfileStatsRow';
import { MembershipBanner } from '@/components/profile/MembershipBanner';
import {
   ProfileMenuSection,
   type ProfileMenuItem,
} from '@/components/profile/ProfileMenuSection';
import { colors, spacing, typography } from '@/theme';
import { getTabScreenPaddingBottom } from '@/theme/tabLayout';
import { logout } from '@/utils/logout';
import { resolveAvatarUrl } from '@/utils/resolveAvatarUrl';
import { resolveMembershipTier } from '@/utils/membershipDisplay';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { RootState } from '@/store';

function ProfileScreenContent() {
   const insets = useSafeAreaInsets();
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const user = useSelector((state: RootState) => state.auth.user);
   const { activeSubscription } = useUserSubscription();

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

   const handleSettingsPress = useCallback(() => {
      router.push('/settings' as never);
   }, []);

   const handleAccountPress = useCallback(() => {
      router.push('/account');
   }, []);

   const handleManagePlanPress = useCallback(() => {
      router.push('/subscription-plans');
   }, []);

   const handleSignOutPress = useCallback(async () => {
      try {
         await logout();
      } catch (error) {
         console.error('[Profile] Logout failed:', error);
      }
   }, []);

   const activityItems: ProfileMenuItem[] = useMemo(
      () => [
         {
            id: 'listening-history',
            title: 'Listening History',
            subtitle: "View all the titles you've listened to",
            icon: 'time-outline',
            iconBg: colors.iconBackgrounds.purple,
            iconColor: colors.iconForegrounds.purple,
         },
         {
            id: 'favorites',
            title: 'Favorites',
            subtitle: 'Your liked stories and shows',
            icon: 'heart-outline',
            iconBg: colors.iconBackgrounds.pink,
            iconColor: colors.iconForegrounds.pink,
            onPress: () => router.push('/library/favorites'),
         },
         {
            id: 'downloads',
            title: 'Downloads',
            subtitle: "Stories you've downloaded",
            icon: 'download-outline',
            iconBg: colors.iconBackgrounds.green,
            iconColor: colors.iconForegrounds.green,
         },
      ],
      []
   );

   const accountItems: ProfileMenuItem[] = useMemo(
      () => [
         {
            id: 'edit-profile',
            title: 'Edit Profile',
            subtitle: 'Update your personal information',
            icon: 'person-outline',
            iconBg: colors.iconBackgrounds.brown,
            iconColor: colors.iconForegrounds.brown,
            onPress: handleAccountPress,
         },
         {
            id: 'payment',
            title: 'Payment & Billing',
            subtitle: 'Manage your subscriptions and payments',
            icon: 'card-outline',
            iconBg: colors.iconBackgrounds.blue,
            iconColor: colors.iconForegrounds.blue,
            onPress: () => router.push('/subscription-plans'),
         },
         {
            id: 'refer',
            title: 'Refer & Earn',
            subtitle: 'Invite friends and earn rewards',
            icon: 'gift-outline',
            iconBg: colors.iconBackgrounds.pink,
            iconColor: colors.iconForegrounds.pink,
         },
         {
            id: 'privacy',
            title: 'Privacy & Security',
            subtitle: 'Manage your privacy and security settings',
            icon: 'shield-checkmark-outline',
            iconBg: colors.iconBackgrounds.greenShield,
            iconColor: colors.iconForegrounds.green,
            onPress: handleAccountPress,
         },
      ],
      [handleAccountPress]
   );

   const logOutItems: ProfileMenuItem[] = useMemo(
      () => [
         {
            id: 'logout',
            title: 'Log Out',
            subtitle: 'Sign out from your account',
            icon: 'log-out-outline',
            iconBg: colors.iconBackgrounds.red,
            iconColor: colors.iconForegrounds.red,
            onPress: handleSignOutPress,
            isDanger: true,
         },
      ],
      [handleSignOutPress]
   );

   const scrollContentPadding = getTabScreenPaddingBottom(insets.bottom);

   return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
         <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
               styles.scrollContent,
               { paddingBottom: scrollContentPadding },
            ]}
            showsVerticalScrollIndicator={false}
         >
            <View style={styles.header}>
               <Text style={styles.headerTitle}>Profile</Text>
               <TouchableOpacity
                  onPress={handleSettingsPress}
                  style={styles.settingsButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Settings"
               >
                  <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
               </TouchableOpacity>
            </View>

            <ProfileUserCard
               displayName={displayName}
               email={user?.email}
               avatarUri={avatarUri}
               tier={membershipTier}
               planName={planName}
               onPress={handleAccountPress}
            />

            <ProfileStatsRow />

            <MembershipBanner
               tier={membershipTier}
               planName={planName}
               onManagePlanPress={handleManagePlanPress}
               onUpgradePress={handleManagePlanPress}
            />

            <ProfileMenuSection
               title="Your Activity"
               items={activityItems}
               showViewAll
            />

            <ProfileMenuSection title="Account" items={accountItems} />

            <ProfileMenuSection title="" items={logOutItems} />
         </ScrollView>
      </SafeAreaView>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
   },
   headerTitle: {
      fontSize: typography.fontSize['3xl'],
      color: colors.text.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
      }),
   },
   settingsButton: {
      padding: spacing.xs,
   },
});

export default function ProfileScreen() {
   return (
      <AnimatedTabScreen direction="right" currentRoute="profile">
         <ProfileScreenContent />
      </AnimatedTabScreen>
   );
}
