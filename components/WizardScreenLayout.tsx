import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Platform,
   ActivityIndicator,
   KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface WizardScreenLayoutProps {
   step: number;
   totalSteps: number;
   title: string;
   subtitle: string;
   children: React.ReactNode;
   onContinue: () => void;
   continueLabel?: string;
   continueDisabled?: boolean;
   isLoading?: boolean;
   onBack?: () => void;
   error?: string | null;
   /** When false, body uses a flex layout (e.g. nested scroll pickers). Default true. */
   scrollable?: boolean;
}

/**
 * Shared layout for signup onboarding wizard screens
 */
export const WizardScreenLayout: React.FC<WizardScreenLayoutProps> = ({
   step,
   totalSteps,
   title,
   subtitle,
   children,
   onContinue,
   continueLabel = 'Continue',
   continueDisabled = false,
   isLoading = false,
   onBack,
   error,
   scrollable = true,
}) => {
   const content = (
      <>
         <View style={styles.header}>
            {onBack ? (
               <TouchableOpacity
                  onPress={onBack}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
               >
                  <Text style={styles.backButtonText}>Back</Text>
               </TouchableOpacity>
            ) : (
               <View style={styles.backPlaceholder} />
            )}
            <Text style={styles.stepLabel}>
               Step {step} of {totalSteps}
            </Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
         </View>

         <View style={styles.body}>{children}</View>

         {error ? (
            <View style={styles.errorContainer}>
               <Text style={styles.errorText}>{error}</Text>
            </View>
         ) : null}

         <TouchableOpacity
            style={[
               styles.continueButton,
               (continueDisabled || isLoading) && styles.continueButtonDisabled,
            ]}
            onPress={onContinue}
            disabled={continueDisabled || isLoading}
            accessibilityRole="button"
            accessibilityLabel={continueLabel}
         >
            {isLoading ? (
               <ActivityIndicator color={colors.text.dark} />
            ) : (
               <Text style={styles.continueButtonText}>{continueLabel}</Text>
            )}
         </TouchableOpacity>
      </>
   );

   return (
      <>
         <Stack.Screen
            options={{
               headerShown: false,
               contentStyle: { backgroundColor: colors.background.dark },
               gestureEnabled: false,
            }}
         />
         <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
               style={styles.keyboardAvoid}
               behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
               {scrollable ? (
                  <ScrollView
                     style={styles.scrollView}
                     contentContainerStyle={styles.scrollContent}
                     keyboardShouldPersistTaps="handled"
                  >
                     {content}
                  </ScrollView>
               ) : (
                  <View style={[styles.scrollView, styles.staticContent]}>{content}</View>
               )}
            </KeyboardAvoidingView>
         </SafeAreaView>
      </>
   );
};

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
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      alignItems: 'stretch',
   },
   staticContent: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      alignItems: 'stretch',
   },
   header: {
      width: '100%',
      alignSelf: 'stretch',
      marginBottom: spacing.xl,
   },
   backButton: {
      alignSelf: 'flex-start',
      marginBottom: spacing.md,
      padding: spacing.xs,
   },
   backPlaceholder: {
      height: spacing.md + spacing.xs * 2,
      marginBottom: spacing.md,
   },
   backButtonText: {
      fontSize: typography.fontSize.base,
      color: colors.primary[400],
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   stepLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      marginBottom: spacing.sm,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '500' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   title: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: '700',
      color: colors.text.dark,
      marginBottom: spacing.sm,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '700' },
         android: { fontFamily: 'sans-serif-bold' },
      }),
   },
   subtitle: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '400' },
         android: { fontFamily: 'sans-serif' },
      }),
   },
   body: {
      flex: 1,
      width: '100%',
      alignSelf: 'stretch',
      marginBottom: spacing.lg,
   },
   errorContainer: {
      marginBottom: spacing.md,
   },
   errorText: {
      fontSize: typography.fontSize.sm,
      color: colors.error,
      textAlign: 'center',
   },
   continueButton: {
      backgroundColor: colors.app.red,
      borderRadius: borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
   },
   continueButtonDisabled: {
      opacity: 0.6,
   },
   continueButtonText: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
});
