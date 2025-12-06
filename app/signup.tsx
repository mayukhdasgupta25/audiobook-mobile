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
import { useDispatch } from 'react-redux';
import { TextInput } from '@/components/TextInput';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { signup } from '@/services/auth';
import { setAuth, fetchUserProfile } from '@/store/auth';
import { AppDispatch } from '@/store';
import { ApiError } from '@/services/api';

/**
 * Sign up screen with email, password, and confirm password inputs
 */
export default function SignUpScreen() {
   const dispatch = useDispatch<AppDispatch>();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleSignUp = useCallback(async () => {
      Keyboard.dismiss();
      setError(null);

      // Basic validation
      if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
         setError('Please fill in all fields');
         return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
         setError('Please enter a valid email address');
         return;
      }

      // Validate password match
      if (password !== confirmPassword) {
         setError('Passwords do not match');
         return;
      }

      // Validate password length
      if (password.length < 6) {
         setError('Password must be at least 6 characters long');
         return;
      }

      setIsLoading(true);

      try {
         // Call signup API
         const response = await signup({ email: email.trim(), password });

         // Store auth state in Redux
         dispatch(
            setAuth({
               accessToken: response.accessToken,
               refreshToken: response.refreshToken,
               user: response.user,
            })
         );

         // Fetch user profile after successful signup
         try {
            await dispatch(fetchUserProfile()).unwrap();
         } catch (profileError) {
            // Log error but don't block navigation - profile fetch failure shouldn't prevent signup
            console.error('[SignUp] Failed to fetch user profile:', profileError);
         }

         // Redirect to home screen
         router.replace('/(tabs)');
      } catch (err) {
         // Handle API errors
         if (err instanceof ApiError) {
            if (err.status === 400) {
               const errorData = err.data as { message?: string } | undefined;
               setError(errorData?.message || 'Invalid signup data. Please check your information.');
            } else if (err.status === 409) {
               setError('An account with this email already exists');
            } else {
               const errorData = err.data as { message?: string } | undefined;
               setError(errorData?.message || 'Signup failed. Please try again.');
            }
         } else {
            const errorMessage =
               err instanceof Error ? err.message : 'Unknown error';
            console.error('[SignUp] Non-API error:', errorMessage);

            // Provide helpful error message for network issues
            let userMessage = 'Network error. Please check your connection and try again.';
            if (errorMessage.includes('Network request failed')) {
               userMessage = 'Cannot connect to server. If testing on a physical device, set EXPO_PUBLIC_AUTH_API_URL to your computer\'s IP address (e.g., http://192.168.1.100:8080)';
            }

            setError(userMessage);
         }
      } finally {
         setIsLoading(false);
      }
   }, [email, password, confirmPassword, dispatch]);

   const handleNavigateToSignIn = useCallback(() => {
      Keyboard.dismiss();
      router.push('/signin');
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
                     <Text style={styles.title}>Create Account</Text>
                     <Text style={styles.subtitle}>
                        Sign up to get started with AudioBook
                     </Text>
                  </View>

                  {/* Form */}
                  <View style={styles.form}>
                     <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        icon="mail-outline"
                        testID="signup-email-input"
                     />

                     <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry={true}
                        autoCapitalize="none"
                        icon="lock-closed-outline"
                        testID="signup-password-input"
                     />

                     <TextInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm your password"
                        secureTextEntry={true}
                        autoCapitalize="none"
                        icon="lock-closed-outline"
                        testID="signup-confirm-password-input"
                     />

                     {/* Error Message */}
                     {error && (
                        <View style={styles.errorContainer}>
                           <Text style={styles.errorText}>{error}</Text>
                        </View>
                     )}

                     {/* Sign Up Button */}
                     <TouchableOpacity
                        style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                        onPress={handleSignUp}
                        activeOpacity={0.8}
                        disabled={isLoading}
                        testID="signup-button"
                     >
                        {isLoading ? (
                           <ActivityIndicator color={colors.text.dark} />
                        ) : (
                           <Text style={styles.signUpButtonText}>Sign Up</Text>
                        )}
                     </TouchableOpacity>

                     {/* Sign In Link */}
                     <View style={styles.signInLinkContainer}>
                        <Text style={styles.signInLinkText}>
                           Already have an account?{' '}
                        </Text>
                        <TouchableOpacity
                           onPress={handleNavigateToSignIn}
                           activeOpacity={0.7}
                        >
                           <Text style={styles.signInLink}>Sign In</Text>
                        </TouchableOpacity>
                     </View>
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
      alignItems: 'center',
   },
   title: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: '700',
      color: colors.text.dark,
      marginBottom: spacing.sm,
      textAlign: 'center',
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
   signUpButtonDisabled: {
      opacity: 0.6,
   },
   signUpButton: {
      backgroundColor: colors.app.red,
      borderRadius: borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
   },
   signUpButtonText: {
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
   signInLinkContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.md,
   },
   signInLinkText: {
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
   signInLink: {
      fontSize: typography.fontSize.base,
      color: colors.primary[400],
      fontWeight: '600',
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

