import React from 'react';
import {
   View,
   TextInput as RNTextInput,
   StyleSheet,
   Text,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface TextInputProps {
   value: string;
   onChangeText: (text: string) => void;
   placeholder?: string;
   label?: string;
   error?: string;
   secureTextEntry?: boolean;
   keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
   autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
   autoCorrect?: boolean;
   icon?: keyof typeof Ionicons.glyphMap;
   editable?: boolean;
   testID?: string;
}

/**
 * Reusable text input component with dark theme styling
 * Supports email, password, and text input types with optional icon and error states
 */
export const TextInput: React.FC<TextInputProps> = ({
   value,
   onChangeText,
   placeholder,
   label,
   error,
   secureTextEntry = false,
   keyboardType = 'default',
   autoCapitalize = 'none',
   autoCorrect = false,
   icon,
   editable = true,
   testID,
}) => {
   return (
      <View style={styles.container}>
         {label && <Text style={styles.label}>{label}</Text>}
         <View
            style={[
               styles.inputContainer,
               error && styles.inputContainerError,
               !editable && styles.inputContainerDisabled,
            ]}
         >
            {icon && (
               <Ionicons
                  name={icon}
                  size={20}
                  color={colors.text.secondaryDark}
                  style={styles.icon}
               />
            )}
            <RNTextInput
               style={styles.input}
               value={value}
               onChangeText={onChangeText}
               placeholder={placeholder}
               placeholderTextColor={colors.text.secondaryDark}
               secureTextEntry={secureTextEntry}
               keyboardType={keyboardType}
               keyboardAppearance="dark"
               autoCapitalize={autoCapitalize}
               autoCorrect={autoCorrect}
               editable={editable}
               testID={testID}
            />
         </View>
         {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      marginBottom: spacing.md,
   },
   label: {
      fontSize: typography.fontSize.sm,
      fontWeight: '500',
      color: colors.text.dark,
      marginBottom: spacing.xs,
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
   inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.darkGrayLight,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      height: 48,
      borderWidth: 1,
      borderColor: 'transparent',
   },
   inputContainerError: {
      borderColor: colors.error,
   },
   inputContainerDisabled: {
      opacity: 0.5,
   },
   icon: {
      marginRight: spacing.sm,
   },
   input: {
      flex: 1,
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
   errorText: {
      fontSize: typography.fontSize.xs,
      color: colors.error,
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
});

