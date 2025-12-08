import React, { useState, useCallback } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Platform,
   KeyboardAvoidingView,
   Keyboard,
   ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { TextInput } from '@/components/TextInput';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { updateEmail, UpdateEmailRequest } from '@/services/auth';
import { fetchUserProfile } from '@/store/auth';
import { AppDispatch } from '@/store';
import { useDispatch } from 'react-redux';
import { ApiError } from '@/services/api';

/**
 * Change email screen
 * Allows user to set new email after OTP verification
 */
export default function ChangeEmailScreen() {
   const dispatch = useDispatch<AppDispatch>();
   const [newEmail, setNewEmail] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleChangeEmail = useCallback(async () => {
      Keyboard.dismiss();
      setError(null);

      // Basic validation
      if (!newEmail.trim()) {
         setError('Please enter a new email address');
         return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail.trim())) {
         setError('Please enter a valid email address');
         return;
      }

      setIsLoading(true);

      try {
         const request: UpdateEmailRequest = {
            newEmail: newEmail.trim(),
         };

         // Update email
         await updateEmail(request);

         // Refresh user profile
         try {
            await dispatch(fetchUserProfile()).unwrap();
         } catch (profileError) {
            console.error('[ChangeEmail] Failed to refresh user profile:', profileError);
         }

         // Redirect back to account screen
         router.replace('/account');
      } catch (err) {
         // Handle API errors
         if (err instanceof ApiError) {
            if (err.status === 400) {
               const errorData = err.data as { message?: string } | undefined;
               setError(errorData?.message || 'Invalid email. Please try again.');
            } else if (err.status === 401) {
               setError('Email update failed. Please verify OTP again.');
            } else if (err.status === 409) {
               setError('An account with this email already exists');
            } else {
               const errorData = err.data as { message?: string } | undefined;
               setError(errorData?.message || 'Email update failed. Please try again.');
            }
         } else {
            const errorMessage =
               err instanceof Error ? err.message : 'Unknown error';
            console.error('[ChangeEmail] Non-API error:', errorMessage);

            // Provide helpful error message for network issues
            let userMessage = 'Network error. Please check your connection and try again.';
            if (errorMessage.includes('Network request failed')) {
               userMessage =
                  'Cannot connect to server. If testing on a physical device, set EXPO_PUBLIC_AUTH_API_URL to your computer\'s IP address (e.g., http://192.168.1.100:8080)';
            }

            setError(userMessage);
         }
      } finally {
         setIsLoading(false);
      }
   }, [newEmail, dispatch]);

   const handleBackPress = useCallback(() => {
      Keyboard.dismiss();
      router.back();
   }, []);

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
            <KeyboardAvoidingView
               style={styles.keyboardAvoid}
               behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
               <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
               >
                  {/* Header */}
                  <View style={styles.header}>
                     <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
                        <Text style={styles.backButtonText}>← Back</Text>
                     </TouchableOpacity>
                     <Text style={styles.title}>Change Email</Text>
                     <Text style={styles.subtitle}>
                        Enter your new email address
                     </Text>
                  </View>

                  {/* Form */}
                  <View style={styles.form}>
                     <TextInput
                        label="New Email"
                        value={newEmail}
                        onChangeText={setNewEmail}
                        placeholder="Enter your new email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        icon="mail-outline"
                        testID="new-email-input"
                     />

                     {/* Error Message */}
                     {error && (
                        <View style={styles.errorContainer}>
                           <Text style={styles.errorText}>{error}</Text>
                        </View>
                     )}

                     {/* Change Email Button */}
                     <TouchableOpacity
                        style={[styles.changeEmailButton, isLoading && styles.changeEmailButtonDisabled]}
                        onPress={handleChangeEmail}
                        activeOpacity={0.8}
                        disabled={isLoading}
                        testID="change-email-button"
                     >
                        {isLoading ? (
                           <ActivityIndicator color={colors.text.dark} />
                        ) : (
                           <Text style={styles.changeEmailButtonText}>Change Email</Text>
                        )}
                     </TouchableOpacity>
                  </View>
               </ScrollView>
            </KeyboardAvoidingView>
         </SafeAreaView>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
   },
   keyboardAvoid: {
      flex: 1,
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xl,
   },
   header: {
      marginBottom: spacing.xl,
   },
   backButton: {
      alignSelf: 'flex-start',
      marginBottom: spacing.md,
      padding: spacing.xs,
   },
   backButtonText: {
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
   title: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: '700',
      color: colors.text.dark,
      marginBottom: spacing.sm,
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
   form: {
      flex: 1,
      justifyContent: 'center',
   },
   errorContainer: {
      marginBottom: spacing.md,
      marginTop: -spacing.sm,
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
   changeEmailButtonDisabled: {
      opacity: 0.6,
   },
   changeEmailButton: {
      backgroundColor: colors.app.red,
      borderRadius: borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
   },
   changeEmailButtonText: {
      fontSize: typography.fontSize.lg,
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

