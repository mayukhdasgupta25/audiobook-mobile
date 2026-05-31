import React from 'react';
import {
   View,
   TextInput as RNTextInput,
   StyleSheet,
   Text,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

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
   const { colors, isDark } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            width: '100%',
            alignSelf: 'stretch',
            marginBottom: spacing.md,
         },
         label: {
            width: '100%',
            alignSelf: 'stretch',
            textAlign: 'left',
            fontSize: typography.fontSize.sm,
            fontWeight: '500',
            color: t.colors.text.dark,
            marginBottom: spacing.xs,
            ...Platform.select({
               ios: {
                  fontFamily: 'System',
                  fontWeight: '500',
               },
               android: {
                  fontFamily: 'sans-serif-medium',
                  includeFontPadding: false,
               },
            }),
         },
         inputContainer: {
            width: '100%',
            alignSelf: 'stretch',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.colors.background.input,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.md,
            height: 48,
         },
         inputContainerError: {
            backgroundColor: '#FEE2E2',
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
            color: t.colors.text.dark,
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
            color: t.colors.error,
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
      })
   );

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
               keyboardAppearance={isDark ? 'dark' : 'light'}
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
