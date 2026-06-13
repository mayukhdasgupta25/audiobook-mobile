import React, { useMemo, useState, useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Platform,
   ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useSelector } from 'react-redux';
import { ScreenHeader } from '@/components/ScreenHeader';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsMenuRow } from '@/components/settings/SettingsMenuRow';
import { AccountMembershipCard } from '@/components/account/AccountMembershipCard';
import { SecondaryButton } from '@/components/SecondaryButton';
import { RootState } from '@/store';
import {
   requestPasswordChangeOtp,
   requestEmailUpdateOtp,
} from '@/services/auth';
import { ApiError } from '@/services/api';
import { useUserSubscription } from '@/hooks/useUserSubscription';
export default function AccountScreen() {
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
         scrollContent: {},
         errorBanner: {
            marginHorizontal: spacing.md,
            marginBottom: spacing.md,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            backgroundColor: t.colors.background.card,
         },
         errorText: {
            fontSize: typography.fontSize.sm,
            color: t.colors.error,
            textAlign: 'center',
         },
         actionsContent: {
            padding: spacing.md,
            gap: spacing.md,
         },
         deleteButton: {
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
            borderWidth: 2,
            borderColor: t.colors.error,
            backgroundColor: 'transparent',
         },
         deleteButtonText: {
            fontSize: typography.fontSize.base,
            fontWeight: '600',
            color: t.colors.error,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '600' },
            }),
         },
      })
   );

   const insets = useSafeAreaInsets();
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const user = useSelector((state: RootState) => state.auth.user);
   const [isRequestingPasswordOtp, setIsRequestingPasswordOtp] = useState(false);
   const [isRequestingEmailOtp, setIsRequestingEmailOtp] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const {
      activeSubscription,
      isLoading: isSubscriptionLoading,
      error: subscriptionError,
      refetch: refetchSubscription,
   } = useUserSubscription();

   const memberSince = useMemo(() => {
      if (!userProfile?.createdAt) {
         return '—';
      }
      try {
         const date = new Date(userProfile.createdAt);
         const month = date.toLocaleString('en-US', { month: 'long' });
         const year = date.getFullYear();
         return `${month} ${year}`;
      } catch {
         return '—';
      }
   }, [userProfile?.createdAt]);

   const handleBackPress = useCallback(() => {
      router.back();
   }, []);

   const handlePasswordPress = useCallback(async () => {
      setError(null);
      setIsRequestingPasswordOtp(true);

      try {
         await requestPasswordChangeOtp();
         router.push('/verify-password-otp');
      } catch (err) {
         if (err instanceof ApiError) {
            const errorData = err.data as { message?: string } | undefined;
            setError(errorData?.message || 'Failed to request OTP. Please try again.');
         } else {
            setError('Failed to request OTP. Please try again.');
         }
      } finally {
         setIsRequestingPasswordOtp(false);
      }
   }, []);

   const handleEmailPress = useCallback(async () => {
      if (!user?.email) {
         setError('Email is required');
         return;
      }

      setError(null);
      setIsRequestingEmailOtp(true);

      try {
         await requestEmailUpdateOtp({ email: user.email });
         router.push({
            pathname: '/verify-email-otp',
            params: { email: user.email },
         });
      } catch (err) {
         if (err instanceof ApiError) {
            const errorData = err.data as { message?: string } | undefined;
            setError(errorData?.message || 'Failed to request OTP. Please try again.');
         } else {
            setError('Failed to request OTP. Please try again.');
         }
      } finally {
         setIsRequestingEmailOtp(false);
      }
   }, [user?.email]);

   const handleManagePlanPress = useCallback(() => {
      router.push('/subscription-plans');
   }, []);

   const handleCancelMembershipPress = useCallback(() => {
      console.log('Cancel Membership pressed');
   }, []);

   const handleDeleteAccountPress = useCallback(() => {
      console.log('Delete Account pressed');
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
               headerIcon="account"
               onBack={handleBackPress}
               titleSize="large"
            />
            <ScrollView
               style={styles.scrollView}
               contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: insets.bottom + spacing.xl },
               ]}
               showsVerticalScrollIndicator={false}
            >
               {error ? (
                  <View style={styles.errorBanner}>
                     <Text style={styles.errorText}>{error}</Text>
                  </View>
               ) : null}

               <SettingsSection title="Membership">
                  <AccountMembershipCard
                     memberSince={memberSince}
                     subscription={activeSubscription}
                     isLoading={isSubscriptionLoading}
                     error={subscriptionError}
                     onManagePlanPress={handleManagePlanPress}
                     onRetryPress={() => refetchSubscription()}
                  />
               </SettingsSection>

               <SettingsSection title="Profile">
                  <SettingsMenuRow
                     title="First name"
                     subtitle={userProfile?.firstName || 'Not set'}
                     icon="person-outline"
                     iconBg={colors.iconBackgrounds.brown}
                     iconColor={colors.iconForegrounds.brown}
                     onPress={() => router.push('/update-first-name')}
                  />
                  <SettingsMenuRow
                     title="Last name"
                     subtitle={userProfile?.lastName || 'Not set'}
                     icon="person-outline"
                     iconBg={colors.iconBackgrounds.peach}
                     iconColor={colors.iconForegrounds.brown}
                     onPress={() => router.push('/update-last-name')}
                  />
                  <SettingsMenuRow
                     title="Avatar"
                     subtitle={userProfile?.avatar ? 'Photo uploaded' : 'Not set'}
                     icon="image-outline"
                     iconBg={colors.iconBackgrounds.purple}
                     iconColor={colors.iconForegrounds.purple}
                     onPress={() => router.push('/update-avatar')}
                     isLast
                  />
               </SettingsSection>

               <SettingsSection title="Security">
                  <SettingsMenuRow
                     title="Password"
                     subtitle="Change your password"
                     icon="lock-closed-outline"
                     iconBg={colors.iconBackgrounds.blue}
                     iconColor={colors.iconForegrounds.blue}
                     onPress={handlePasswordPress}
                     showChevron={!isRequestingPasswordOtp}
                     trailing={
                        isRequestingPasswordOtp ? (
                           <ActivityIndicator size="small" color={colors.text.secondary} />
                        ) : undefined
                     }
                  />
                  <SettingsMenuRow
                     title="Email"
                     subtitle={user?.email || 'Not set'}
                     icon="mail-outline"
                     iconBg={colors.iconBackgrounds.green}
                     iconColor={colors.iconForegrounds.green}
                     onPress={handleEmailPress}
                     showChevron={!isRequestingEmailOtp}
                     isLast
                     trailing={
                        isRequestingEmailOtp ? (
                           <ActivityIndicator size="small" color={colors.text.secondary} />
                        ) : undefined
                     }
                  />
               </SettingsSection>

               <SettingsSection title="Devices">
                  <SettingsMenuRow
                     title="Access and devices"
                     subtitle="Manage signed-in devices"
                     icon="desktop-outline"
                     iconBg={colors.iconBackgrounds.purple}
                     iconColor={colors.iconForegrounds.purple}
                     onPress={() => router.push('/manage-devices')}
                  />
                  <SettingsMenuRow
                     title="Download devices"
                     subtitle="Manage offline download devices"
                     icon="download-outline"
                     iconBg={colors.iconBackgrounds.green}
                     iconColor={colors.iconForegrounds.green}
                     onPress={() => console.log('Mobile download devices pressed')}
                     isLast
                  />
               </SettingsSection>

               <SettingsSection title="Account actions">
                  <View style={styles.actionsContent}>
                     <SecondaryButton
                        title="Cancel membership"
                        onPress={handleCancelMembershipPress}
                        variant="outlined"
                     />
                     <TouchableOpacity
                        onPress={handleDeleteAccountPress}
                        style={styles.deleteButton}
                        activeOpacity={0.7}
                     >
                        <Text style={styles.deleteButtonText}>Delete account</Text>
                     </TouchableOpacity>
                  </View>
               </SettingsSection>
            </ScrollView>
         </SafeAreaView>
      </>
   );
}
