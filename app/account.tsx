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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { RootState } from '@/store';
import {
   requestPasswordChangeOtp,
   requestEmailUpdateOtp,
} from '@/services/auth';
import { ApiError } from '@/services/api';

/**
 * Account screen - Netflix-style account management
 * Displays membership details, security settings, and device management
 */
export default function AccountScreen() {
   const insets = useSafeAreaInsets();
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const user = useSelector((state: RootState) => state.auth.user);
   const [isRequestingPasswordOtp, setIsRequestingPasswordOtp] = useState(false);
   const [isRequestingEmailOtp, setIsRequestingEmailOtp] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Format member since date from createdAt
   const memberSince = useMemo(() => {
      if (!userProfile?.createdAt) return 'December 2024';
      try {
         const date = new Date(userProfile.createdAt);
         const month = date.toLocaleString('en-US', { month: 'long' });
         const year = date.getFullYear();
         return `${month} ${year}`;
      } catch {
         return 'December 2024';
      }
   }, [userProfile?.createdAt]);

   // Calculate next payment date (30 days from now as placeholder)
   const nextPaymentDate = useMemo(() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
   }, []);

   const handleBackPress = () => {
      router.back();
   };

   const handlePasswordPress = useCallback(async () => {
      setError(null);
      setIsRequestingPasswordOtp(true);

      try {
         // Request password change OTP
         await requestPasswordChangeOtp();

         // Navigate to password OTP verification screen
         router.push('/verify-password-otp');
      } catch (err) {
         console.error('[Account] Password press error:', err);
         if (err instanceof ApiError) {
            const errorData = err.data as { message?: string } | undefined;
            const errorMessage = errorData?.message || 'Failed to request OTP. Please try again.';
            setError(errorMessage);
         } else {
            const errorMessage =
               err instanceof Error ? err.message : 'Unknown error';
            console.error('[Account] Request password change OTP error:', errorMessage);
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
         // Request email update OTP with current email as query parameter
         await requestEmailUpdateOtp({ email: user.email });

         // Navigate to email OTP verification screen with email as param
         router.push({
            pathname: '/verify-email-otp',
            params: {
               email: user.email,
            },
         });
      } catch (err) {
         console.error('[Account] Email press error:', err);
         if (err instanceof ApiError) {
            const errorData = err.data as { message?: string } | undefined;
            setError(errorData?.message || 'Failed to request OTP. Please try again.');
         } else {
            const errorMessage =
               err instanceof Error ? err.message : 'Unknown error';
            console.error('[Account] Request email update OTP error:', errorMessage);
            setError('Failed to request OTP. Please try again.');
         }
      } finally {
         setIsRequestingEmailOtp(false);
      }
   }, [user?.email]);

   const handleFirstNamePress = useCallback(() => {
      router.push('/update-first-name');
   }, []);

   const handleLastNamePress = useCallback(() => {
      router.push('/update-last-name');
   }, []);

   const handleAvatarPress = useCallback(() => {
      router.push('/update-avatar');
   }, []);

   const handleAccessDevicesPress = () => {
      console.log('Access and devices pressed');
      // TODO: Navigate to access and devices screen
   };

   const handleDownloadDevicesPress = () => {
      console.log('Mobile download devices pressed');
      // TODO: Navigate to download devices screen
   };

   const handlePaymentHistoryPress = () => {
      console.log('View payment history pressed');
      // TODO: Navigate to payment history screen
   };

   const handleCancelMembershipPress = () => {
      console.log('Cancel Membership pressed');
      // TODO: Show confirmation dialog and handle cancellation
   };

   const handleDeleteAccountPress = () => {
      console.log('Delete Account pressed');
      // TODO: Show confirmation dialog and handle account deletion
   };

   return (
      <>
         <Stack.Screen
            options={{
               headerShown: false,
               contentStyle: {
                  backgroundColor: colors.background.dark,
               },
            }}
         />
         <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView
               style={styles.scrollView}
               contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
               showsVerticalScrollIndicator={false}
            >
               {/* Header with back button */}
               <View style={styles.header}>
                  <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
                     <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
                  </TouchableOpacity>
                  <View style={styles.headerContent}>
                     <Text style={styles.title}>Account</Text>
                  </View>
               </View>

               {/* Membership Details Section */}
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Membership details</Text>
                  <View style={styles.card}>
                     <View style={styles.memberSinceBadge}>
                        <Text style={styles.memberSinceText}>Member since {memberSince}</Text>
                     </View>
                     <Text style={styles.planName}>Standard plan</Text>
                     <Text style={styles.paymentInfo}>Next payment: {nextPaymentDate}</Text>
                     <View style={styles.paymentMethod}>
                        <View style={styles.paymentIcon}>
                           <Ionicons name="card-outline" size={20} color={colors.text.dark} />
                        </View>
                        <Text style={styles.paymentMethodText}>8***@ybl</Text>
                     </View>
                     <TouchableOpacity
                        onPress={handlePaymentHistoryPress}
                        style={styles.paymentHistoryLink}
                        activeOpacity={0.7}
                     >
                        <Text style={styles.linkText}>View payment history</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondaryDark} />
                     </TouchableOpacity>
                  </View>
               </View>

               {/* Profile Section */}
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Profile</Text>
                  <View style={styles.card}>
                     <TouchableOpacity
                        onPress={handleFirstNamePress}
                        style={styles.menuItem}
                        activeOpacity={0.7}
                     >
                        <Ionicons name="person-outline" size={24} color={colors.text.dark} />
                        <View style={styles.menuItemContent}>
                           <Text style={styles.menuItemText}>First Name</Text>
                           <Text style={styles.menuItemSubtext}>
                              {userProfile?.firstName || 'Not set'}
                           </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondaryDark} />
                     </TouchableOpacity>
                     <View style={styles.divider} />
                     <TouchableOpacity
                        onPress={handleLastNamePress}
                        style={styles.menuItem}
                        activeOpacity={0.7}
                     >
                        <Ionicons name="person-outline" size={24} color={colors.text.dark} />
                        <View style={styles.menuItemContent}>
                           <Text style={styles.menuItemText}>Last Name</Text>
                           <Text style={styles.menuItemSubtext}>
                              {userProfile?.lastName || 'Not set'}
                           </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondaryDark} />
                     </TouchableOpacity>
                     <View style={styles.divider} />
                     <TouchableOpacity
                        onPress={handleAvatarPress}
                        style={styles.menuItem}
                        activeOpacity={0.7}
                     >
                        <Ionicons name="image-outline" size={24} color={colors.text.dark} />
                        <View style={styles.menuItemContent}>
                           <Text style={styles.menuItemText}>Avatar</Text>
                           <Text style={styles.menuItemSubtext}>
                              {userProfile?.avatar ? 'Set' : 'Not set'}
                           </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondaryDark} />
                     </TouchableOpacity>
                  </View>
               </View>

               {/* Error Message */}
               {error && (
                  <View style={styles.errorContainer}>
                     <Text style={styles.errorText}>{error}</Text>
                  </View>
               )}

               {/* Security Section */}
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Security</Text>
                  <View style={styles.card}>
                     <TouchableOpacity
                        onPress={handlePasswordPress}
                        style={styles.menuItem}
                        activeOpacity={0.7}
                        disabled={isRequestingPasswordOtp}
                     >
                        <Ionicons name="lock-closed-outline" size={24} color={colors.text.dark} />
                        <View style={styles.menuItemContent}>
                           <Text style={styles.menuItemText}>Password</Text>
                        </View>
                        {isRequestingPasswordOtp ? (
                           <ActivityIndicator size="small" color={colors.text.secondaryDark} />
                        ) : (
                           <Ionicons name="chevron-forward" size={20} color={colors.text.secondaryDark} />
                        )}
                     </TouchableOpacity>
                     <View style={styles.divider} />
                     <TouchableOpacity
                        onPress={handleEmailPress}
                        style={styles.menuItem}
                        activeOpacity={0.7}
                        disabled={isRequestingEmailOtp}
                     >
                        <Ionicons name="mail-outline" size={24} color={colors.text.dark} />
                        <View style={styles.menuItemContent}>
                           <Text style={styles.menuItemText}>Email</Text>
                           <Text style={styles.menuItemSubtext}>{user?.email || 'Not set'}</Text>
                        </View>
                        {isRequestingEmailOtp ? (
                           <ActivityIndicator size="small" color={colors.text.secondaryDark} />
                        ) : (
                           <Ionicons name="chevron-forward" size={20} color={colors.text.secondaryDark} />
                        )}
                     </TouchableOpacity>
                  </View>
               </View>

               {/* Devices Section */}
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Devices</Text>
                  <View style={styles.card}>
                     <TouchableOpacity
                        onPress={handleAccessDevicesPress}
                        style={styles.menuItem}
                        activeOpacity={0.7}
                     >
                        <Ionicons name="desktop-outline" size={24} color={colors.text.dark} />
                        <View style={styles.menuItemContent}>
                           <Text style={styles.menuItemText}>Access and devices</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondaryDark} />
                     </TouchableOpacity>
                     <View style={styles.divider} />
                     <TouchableOpacity
                        onPress={handleDownloadDevicesPress}
                        style={styles.menuItem}
                        activeOpacity={0.7}
                     >
                        <Ionicons name="download-outline" size={24} color={colors.text.dark} />
                        <View style={styles.menuItemContent}>
                           <Text style={styles.menuItemText}>Mobile download devices</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondaryDark} />
                     </TouchableOpacity>
                  </View>
               </View>

               {/* Action Buttons */}
               <View style={styles.actionButtons}>
                  <TouchableOpacity
                     onPress={handleCancelMembershipPress}
                     style={styles.cancelButton}
                     activeOpacity={0.7}
                  >
                     <Text style={styles.cancelButtonText}>Cancel Membership</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                     onPress={handleDeleteAccountPress}
                     style={styles.deleteButton}
                     activeOpacity={0.7}
                  >
                     <Text style={styles.deleteButtonText}>Delete Account</Text>
                  </TouchableOpacity>
               </View>
            </ScrollView>
         </SafeAreaView>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xl,
      paddingTop: spacing.sm,
   },
   backButton: {
      marginRight: spacing.md,
      padding: spacing.xs,
   },
   headerContent: {
      flex: 1,
   },
   title: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: '700',
      color: colors.text.dark,
      marginBottom: spacing.xs,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '700',
         },
         android: {
            fontFamily: 'sans-serif-bold',
         },
      }),
   },
   subtitle: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   errorContainer: {
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
   },
   errorText: {
      fontSize: typography.fontSize.sm,
      color: colors.error,
      textAlign: 'center',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   section: {
      marginBottom: spacing.xl,
   },
   sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      marginBottom: spacing.md,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   card: {
      backgroundColor: colors.background.darkGrayLight,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
   },
   memberSinceBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#8B5CF6', // Purple color similar to Netflix
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      marginBottom: spacing.md,
   },
   memberSinceText: {
      fontSize: typography.fontSize.sm,
      fontWeight: '600',
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   planName: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      marginBottom: spacing.sm,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   paymentInfo: {
      fontSize: typography.fontSize.base,
      color: colors.text.dark,
      marginBottom: spacing.md,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   paymentMethod: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
   },
   paymentIcon: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background.darkGray,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
   },
   paymentMethodText: {
      fontSize: typography.fontSize.base,
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   paymentHistoryLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
   },
   linkText: {
      fontSize: typography.fontSize.base,
      color: colors.primary[400],
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
   },
   menuItemContent: {
      flex: 1,
      marginLeft: spacing.md,
   },
   menuItemText: {
      fontSize: typography.fontSize.base,
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   menuItemSubtext: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      marginTop: spacing.xs,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   divider: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      marginLeft: 40, // Align with text after icon
   },
   actionButtons: {
      marginTop: spacing.xl,
      marginBottom: spacing.xl,
      gap: spacing.md,
   },
   cancelButton: {
      backgroundColor: colors.background.darkGrayLight,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   cancelButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   deleteButton: {
      backgroundColor: colors.error,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
   },
   deleteButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
});

