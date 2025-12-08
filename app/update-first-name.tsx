import React, { useState, useCallback, useMemo } from 'react';
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
import { useSelector, useDispatch } from 'react-redux';
import { TextInput } from '@/components/TextInput';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { updateUserProfile } from '@/services/user';
import { fetchUserProfile } from '@/store/auth';
import { AppDispatch, RootState } from '@/store';
import { ApiError } from '@/services/api';

/**
 * Update first name screen
 * Allows user to update their first name
 */
export default function UpdateFirstNameScreen() {
   const dispatch = useDispatch<AppDispatch>();
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const currentFirstName = userProfile?.firstName || '';

   const [firstName, setFirstName] = useState(currentFirstName);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Update local state when profile changes
   useMemo(() => {
      if (userProfile?.firstName !== undefined) {
         setFirstName(userProfile.firstName || '');
      }
   }, [userProfile?.firstName]);

   const handleUpdate = useCallback(async () => {
      Keyboard.dismiss();
      setError(null);

      // Basic validation
      if (!firstName.trim()) {
         setError('First name cannot be empty');
         return;
      }

      // Check if value actually changed
      if (firstName.trim() === currentFirstName) {
         // No change, just go back
         router.back();
         return;
      }

      setIsLoading(true);

      try {
         // Update profile
         await updateUserProfile({
            firstName: firstName.trim() || null,
         });

         // Refresh user profile
         try {
            await dispatch(fetchUserProfile()).unwrap();
         } catch (profileError) {
            console.error('[UpdateFirstName] Failed to refresh user profile:', profileError);
         }

         // Redirect back to account screen
         router.replace('/account');
      } catch (err) {
         // Handle API errors
         if (err instanceof ApiError) {
            if (err.status === 400) {
               const errorData = err.data as { message?: string } | undefined;
               setError(errorData?.message || 'Invalid first name. Please try again.');
            } else if (err.status === 401) {
               setError('Update failed. Please sign in again.');
            } else {
               const errorData = err.data as { message?: string } | undefined;
               setError(errorData?.message || 'Update failed. Please try again.');
            }
         } else {
            const errorMessage =
               err instanceof Error ? err.message : 'Unknown error';
            console.error('[UpdateFirstName] Non-API error:', errorMessage);

            // Provide helpful error message for network issues
            let userMessage = 'Network error. Please check your connection and try again.';
            if (errorMessage.includes('Network request failed')) {
               userMessage =
                  'Cannot connect to server. If testing on a physical device, set EXPO_PUBLIC_API_URL to your computer\'s IP address (e.g., http://192.168.1.100:8082)';
            }

            setError(userMessage);
         }
      } finally {
         setIsLoading(false);
      }
   }, [firstName, currentFirstName, dispatch]);

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
                     <Text style={styles.title}>Update First Name</Text>
                     <Text style={styles.subtitle}>
                        Enter your first name
                     </Text>
                  </View>

                  {/* Form */}
                  <View style={styles.form}>
                     <TextInput
                        label="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter your first name"
                        autoCapitalize="words"
                        icon="person-outline"
                        testID="first-name-input"
                     />

                     {/* Error Message */}
                     {error && (
                        <View style={styles.errorContainer}>
                           <Text style={styles.errorText}>{error}</Text>
                        </View>
                     )}

                     {/* Update Button */}
                     <TouchableOpacity
                        style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
                        onPress={handleUpdate}
                        activeOpacity={0.8}
                        disabled={isLoading}
                        testID="update-button"
                     >
                        {isLoading ? (
                           <ActivityIndicator color={colors.text.dark} />
                        ) : (
                           <Text style={styles.updateButtonText}>Update</Text>
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
   updateButtonDisabled: {
      opacity: 0.6,
   },
   updateButton: {
      backgroundColor: colors.app.red,
      borderRadius: borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
   },
   updateButtonText: {
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

