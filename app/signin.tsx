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
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { TextInput } from '@/components/TextInput';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { login } from '@/services/auth';
import { setAuth } from '@/store/auth';
import { ApiError } from '@/services/api';

/**
 * Sign in screen with email/password inputs, Google login, and navigation links
 */
export default function SignInScreen() {
   const dispatch = useDispatch();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleSignIn = useCallback(async () => {
      Keyboard.dismiss();
      setError(null);

      // Basic validation
      if (!email.trim() || !password.trim()) {
         setError('Please enter both email and password');
         return;
      }

      setIsLoading(true);

      try {
         // Call login API
         const response = await login({ email: email.trim(), password });

         // Store auth state in Redux
         dispatch(
            setAuth({
               accessToken: response.accessToken,
               user: response.user,
            })
         );

         // Redirect to home screen
         router.replace('/(tabs)');
      } catch (err) {
         // Handle API errors
         if (err instanceof ApiError) {
            if (err.status === 401) {
               setError('Invalid email or password');
            } else if (err.status === 400) {
               setError('Please check your email and password');
            } else {
               const errorData = err.data as { message?: string } | undefined;
               setError(errorData?.message || 'Login failed. Please try again.');
            }
         } else {
            const errorMessage =
               err instanceof Error ? err.message : 'Unknown error';
            console.error('[SignIn] Non-API error:', errorMessage);

            // Provide helpful error message for network issues
            let userMessage = 'Network error. Please check your connection and try again.';
            if (errorMessage.includes('Network request failed')) {
               userMessage = 'Cannot connect to server. If testing on a physical device, set EXPO_PUBLIC_API_URL to your computer\'s IP address (e.g., http://192.168.1.100:8080)';
            }

            setError(userMessage);
         }
      } finally {
         setIsLoading(false);
      }
   }, [email, password, dispatch]);

   const handleGoogleLogin = useCallback(() => {
      Keyboard.dismiss();
      console.log('Google login pressed');
      // TODO: Implement Google OAuth
   }, []);

   const handleForgotPassword = useCallback(() => {
      Keyboard.dismiss();
      console.log('Forgot password pressed');
      // TODO: Implement forgot password flow
   }, []);

   const handleNavigateToSignUp = useCallback(() => {
      Keyboard.dismiss();
      router.push('/signup');
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
                     <Text style={styles.title}>Welcome Back</Text>
                     <Text style={styles.subtitle}>
                        Sign in to continue to your account
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
                        testID="signin-email-input"
                     />

                     <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry={true}
                        autoCapitalize="none"
                        icon="lock-closed-outline"
                        testID="signin-password-input"
                     />

                     {/* Error Message */}
                     {error && (
                        <View style={styles.errorContainer}>
                           <Text style={styles.errorText}>{error}</Text>
                        </View>
                     )}

                     {/* Forgot Password Link */}
                     <TouchableOpacity
                        onPress={handleForgotPassword}
                        style={styles.forgotPasswordLink}
                        activeOpacity={0.7}
                     >
                        <Text style={styles.linkText}>Forgot Password?</Text>
                     </TouchableOpacity>

                     {/* Sign In Button */}
                     <TouchableOpacity
                        style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
                        onPress={handleSignIn}
                        activeOpacity={0.8}
                        disabled={isLoading}
                        testID="signin-button"
                     >
                        {isLoading ? (
                           <ActivityIndicator color={colors.text.dark} />
                        ) : (
                           <Text style={styles.signInButtonText}>Sign In</Text>
                        )}
                     </TouchableOpacity>

                     {/* Divider */}
                     <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                     </View>

                     {/* Google Login Button */}
                     <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleLogin}
                        activeOpacity={0.8}
                        testID="google-login-button"
                     >
                        <Ionicons
                           name="logo-google"
                           size={20}
                           color={colors.text.dark}
                           style={styles.googleIcon}
                        />
                        <Text style={styles.googleButtonText}>
                           Continue with Google
                        </Text>
                     </TouchableOpacity>

                     {/* Sign Up Link */}
                     <View style={styles.signUpLinkContainer}>
                        <Text style={styles.signUpLinkText}>
                           Don&apos;t have an account?{' '}
                        </Text>
                        <TouchableOpacity
                           onPress={handleNavigateToSignUp}
                           activeOpacity={0.7}
                        >
                           <Text style={styles.signUpLink}>Sign Up</Text>
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
   forgotPasswordLink: {
      alignSelf: 'flex-end',
      marginBottom: spacing.lg,
      marginTop: -spacing.sm,
   },
   linkText: {
      fontSize: typography.fontSize.sm,
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
   signInButton: {
      backgroundColor: colors.app.red,
      borderRadius: borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
   },
   signInButtonDisabled: {
      opacity: 0.6,
   },
   signInButtonText: {
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
   divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.lg,
   },
   dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
   },
   dividerText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      marginHorizontal: spacing.md,
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
   googleButton: {
      flexDirection: 'row',
      backgroundColor: colors.background.darkGrayLight,
      borderRadius: borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
   },
   googleIcon: {
      marginRight: spacing.sm,
   },
   googleButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: '500',
      color: colors.text.dark,
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
   signUpLinkContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.md,
   },
   signUpLinkText: {
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
   signUpLink: {
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

