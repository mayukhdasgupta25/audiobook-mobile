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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { TextInput } from '@/components/TextInput';
import { colors, spacing, typography, borderRadius } from '@/theme';

/**
 * Sign up screen with email, password, and confirm password inputs
 */
export default function SignUpScreen() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');

   const handleSignUp = useCallback(() => {
      Keyboard.dismiss();
      console.log('Sign up with:', { email, password, confirmPassword });
      // TODO: Implement sign up logic
   }, [email, password, confirmPassword]);

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

                     {/* Sign Up Button */}
                     <TouchableOpacity
                        style={styles.signUpButton}
                        onPress={handleSignUp}
                        activeOpacity={0.8}
                        testID="signup-button"
                     >
                        <Text style={styles.signUpButtonText}>Sign Up</Text>
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

