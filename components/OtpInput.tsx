import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
   View,
   TextInput,
   StyleSheet,
   Platform,
   NativeSyntheticEvent,
   TextInputKeyPressEventData,
   Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';

/**
 * Props for OTP Input component
 */
export interface OtpInputProps {
   /**
    * Number of OTP digits (default: 6)
    */
   length?: number;
   /**
    * Callback when OTP is complete
    */
   onComplete: (otp: string) => void;
   /**
    * Whether the input is disabled
    */
   disabled?: boolean;
   /**
    * Test ID for testing
    */
   testID?: string;
}

/**
 * OTP Input component with individual digit boxes
 * Auto-focuses to next box on input and auto-submits when complete
 */
export function OtpInput({
   length = 6,
   onComplete,
   disabled = false,
   testID,
}: OtpInputProps) {
   const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
   const inputRefs = useRef<(TextInput | null)[]>([]);

   /**
    * Focus on a specific input box
    */
   const focusInput = useCallback((index: number) => {
      if (inputRefs.current[index]) {
         inputRefs.current[index]?.focus();
      }
   }, []);

   /**
    * Handle text change in an input box
    */
   const handleChangeText = useCallback(
      (text: string, index: number) => {
         if (disabled) return;

         // Only allow numeric input
         const numericText = text.replace(/[^0-9]/g, '');

         // Update OTP array
         const newOtp = [...otp];
         newOtp[index] = numericText.slice(-1); // Only take the last character
         setOtp(newOtp);

         // Auto-focus to next box if digit entered
         if (numericText && index < length - 1) {
            focusInput(index + 1);
         }

         // Check if all digits are filled
         const otpString = newOtp.join('');
         if (otpString.length === length && otpString.length === newOtp.filter((d) => d).length) {
            // All digits filled, call onComplete
            onComplete(otpString);
         }
      },
      [otp, length, onComplete, disabled, focusInput]
   );

   /**
    * Handle key press (for backspace)
    */
   const handleKeyPress = useCallback(
      (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
         if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            // If current box is empty and backspace is pressed, focus previous box
            focusInput(index - 1);
         }
      },
      [otp, focusInput]
   );

   /**
    * Handle focus on input
    */
   const handleFocus = useCallback(
      (index: number) => {
         // Select all text when focused for easy replacement
         if (inputRefs.current[index]) {
            inputRefs.current[index]?.setNativeProps({ selection: { start: 0, end: 999 } });
         }
      },
      []
   );

   /**
    * Reset OTP when disabled state changes
    */
   useEffect(() => {
      if (disabled) {
         setOtp(Array(length).fill(''));
      }
   }, [disabled, length]);

   return (
      <View style={styles.container} testID={testID}>
         {Array.from({ length }).map((_, index) => (
            <TextInput
               key={index}
               ref={(ref) => {
                  inputRefs.current[index] = ref;
               }}
               style={[styles.input, disabled && styles.inputDisabled]}
               value={otp[index]}
               onChangeText={(text) => handleChangeText(text, index)}
               onKeyPress={(e) => handleKeyPress(e, index)}
               onFocus={() => handleFocus(index)}
               keyboardType="number-pad"
               maxLength={1}
               selectTextOnFocus
               editable={!disabled}
               testID={testID ? `${testID}-${index}` : undefined}
            />
         ))}
      </View>
   );
}

// Calculate responsive box size based on screen width
const screenWidth = Dimensions.get('window').width;
const horizontalPadding = spacing.lg * 2; // Left and right padding
const availableWidth = screenWidth - horizontalPadding;
const gapBetweenBoxes = spacing.sm; // Reduced gap for better fit
const totalGaps = 5 * gapBetweenBoxes; // 5 gaps for 6 boxes
const boxWidth = Math.floor((availableWidth - totalGaps) / 6);
// Ensure minimum and maximum box sizes
const MIN_BOX_WIDTH = 40;
const MAX_BOX_WIDTH = 50;
const finalBoxWidth = Math.max(MIN_BOX_WIDTH, Math.min(MAX_BOX_WIDTH, boxWidth));

const styles = StyleSheet.create({
   container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: gapBetweenBoxes,
      paddingHorizontal: spacing.xs, // Small padding to prevent edge overflow
   },
   input: {
      width: finalBoxWidth,
      height: 56,
      backgroundColor: colors.background.darkGrayLight,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textAlign: 'center',
      fontSize: typography.fontSize['2xl'],
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
   inputDisabled: {
      opacity: 0.5,
   },
});

