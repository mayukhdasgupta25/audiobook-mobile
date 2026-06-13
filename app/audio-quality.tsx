import React, { useCallback, useMemo } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   ActivityIndicator,
   Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SecondaryButton } from '@/components/SecondaryButton';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import {
   resolveMembershipTier,
   getMembershipLabel,
   hasPaidMembership,
} from '@/utils/membershipDisplay';
import {
   getAudioQualityForTier,
   getPlanAudioQualityDisplay,
} from '@/utils/audioQualityDisplay';

export default function AudioQualityScreen() {
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
         content: {
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
         },
         card: {
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
         },
         planName: {
            fontSize: typography.fontSize.lg,
            fontWeight: '600',
            color: t.colors.text.primary,
            marginBottom: spacing.sm,
            ...Platform.select({
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         qualityValue: {
            fontSize: typography.fontSize.xl,
            fontWeight: '700',
            color: t.colors.accent.primary,
            marginBottom: spacing.sm,
         },
         hint: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
         },
         sectionTitle: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: spacing.sm,
            marginTop: spacing.sm,
         },
         planRow: {
            backgroundColor: t.colors.background.card,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
         },
         planRowName: {
            fontSize: typography.fontSize.base,
            fontWeight: '600',
            color: t.colors.text.primary,
            marginBottom: spacing.xs,
         },
         planRowQuality: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
         },
         loading: {
            paddingVertical: spacing.xl,
            alignItems: 'center',
         },
         cta: {
            marginTop: spacing.md,
         },
      })
   );

   const insets = useSafeAreaInsets();
   const { activeSubscription, isLoading: isSubscriptionLoading } = useUserSubscription();
   const { plans, isLoading: isPlansLoading } = useSubscriptionPlans();

   const tier = useMemo(
      () => resolveMembershipTier(activeSubscription?.plan, plans),
      [activeSubscription?.plan, plans]
   );

   const subscribedQuality = useMemo(() => getAudioQualityForTier(tier), [tier]);

   const handleBackPress = useCallback(() => {
      router.back();
   }, []);

   const handleViewPlansPress = useCallback(() => {
      router.push('/subscription-plans');
   }, []);

   const isLoading = isSubscriptionLoading || isPlansLoading;
   const hasSubscription = Boolean(activeSubscription) && hasPaidMembership(tier);

   return (
      <>
         <Stack.Screen
            options={{
               headerShown: false,
               contentStyle: { backgroundColor: colors.background.screen },
            }}
         />
         <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScreenHeader headerIcon="audio-quality" onBack={handleBackPress} titleSize="large" />
            <ScrollView
               style={styles.scrollView}
               contentContainerStyle={{
                  paddingBottom: insets.bottom + spacing.xl,
               }}
               showsVerticalScrollIndicator={false}
            >
               {isLoading ? (
                  <View style={styles.loading}>
                     <ActivityIndicator size="large" color={colors.accent.primary} />
                  </View>
               ) : hasSubscription && subscribedQuality ? (
                  <View style={styles.content}>
                     <View style={styles.card}>
                        <Text style={styles.planName}>
                           {getMembershipLabel(tier, activeSubscription?.plan.name)}
                        </Text>
                        <Text style={styles.qualityValue}>{subscribedQuality.kbpsLabel}</Text>
                        <Text style={styles.hint}>
                           Streaming quality is set by your membership plan and applied
                           automatically when you listen.
                        </Text>
                     </View>
                  </View>
               ) : (
                  <View style={styles.content}>
                     <View style={styles.card}>
                        <Text style={styles.planName}>No active membership</Text>
                        <Text style={styles.hint}>
                           Subscribe to unlock streaming audio quality. Each plan includes a
                           different listening experience:
                        </Text>
                     </View>

                     <Text style={styles.sectionTitle}>Plan comparison</Text>
                     {plans.map((plan) => {
                        const display = getPlanAudioQualityDisplay(plan, plans);
                        return (
                           <View key={plan.id} style={styles.planRow}>
                              <Text style={styles.planRowName}>{plan.name}</Text>
                              <Text style={styles.planRowQuality}>
                                 {display.plainEnglishLabel}
                              </Text>
                           </View>
                        );
                     })}

                     <SecondaryButton
                        title="View subscription plans"
                        onPress={handleViewPlansPress}
                        style={styles.cta}
                     />
                  </View>
               )}
            </ScrollView>
         </SafeAreaView>
      </>
   );
}
